import { NextRequest, NextResponse } from 'next/server';

// Helper to fetch from internal endpoints
async function fetchInternal(url: string) {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) throw new Error(`Failed to fetch ${url}`);
    return res.json();
}

function getMonthKey(date: Date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export async function GET(request: NextRequest) {
    try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL || request.nextUrl.origin;

        // Fetch all projects
        const projectsData = await fetchInternal(`${baseUrl}/api/project-infos`);
        const projects = projectsData.projects || [];

        // Fetch all users
        const usersData = await fetchInternal(`${baseUrl}/api/users/all`);
        const users = usersData.users || [];

        // Fetch all payments
        let payments: any[] = [];
        try {
            const paymentsData = await fetchInternal(`${baseUrl}/api/payments/all`);
            payments = paymentsData.payments || [];
        } catch {
            payments = [];
        }

        // Fetch all subscriptions (if available)
        let subscriptions: any[] = [];
        try {
            const subsData = await fetchInternal(`${baseUrl}/api/subscriptions`);
            subscriptions = subsData || [];
        } catch {
            subscriptions = [];
        }

        // Total projects
        const totalProjects = projects.length;

        // Active clients (users with at least one project)
        const activeClientIds = new Set(projects.map((p: any) => p.user_id).filter(Boolean));
        const activeClients = users.filter((u: any) => activeClientIds.has(u.id));
        const totalActiveClients = activeClients.length;

        // Projects by status
        const statusCounts: Record<string, number> = {};
        projects.forEach((p: any) => {
            const status = p.status || 'unknown';
            statusCounts[status] = (statusCounts[status] || 0) + 1;
        });

        // Purchases and revenue
        let totalPurchases = 0;
        let totalRevenue = 0;
        if (payments.length > 0) {
            totalPurchases = payments.length;
            totalRevenue = payments.reduce((sum, p) => sum + (parseFloat(p.amount) || 0), 0);
        }

        // Recent purchases (last 5)
        const recentPurchases = payments.slice(-5).reverse();

        // Top clients by number of projects
        const clientProjectCounts: Record<string, number> = {};
        projects.forEach((p: any) => {
            if (p.user_id) clientProjectCounts[p.user_id] = (clientProjectCounts[p.user_id] || 0) + 1;
        });
        const topClients = Object.entries(clientProjectCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([userId, count]) => {
                const user = users.find((u: any) => u.id === userId);
                return { userId, email: user?.email || 'Unknown', projectCount: count };
            });

        // --- Additional Insights ---

        // 1. Monthly revenue trend (last 6 months)
        const now = new Date();
        const monthlyRevenue: Record<string, number> = {};
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const key = getMonthKey(d);
            monthlyRevenue[key] = 0;
        }
        payments.forEach((p) => {
            if (!p.payment_date) return;
            const date = new Date(p.payment_date);
            const key = getMonthKey(date);
            if (monthlyRevenue[key] !== undefined) {
                monthlyRevenue[key] += parseFloat(p.amount) || 0;
            }
        });

        // 2. New projects this month
        const thisMonthKey = getMonthKey(now);
        const newProjectsThisMonth = projects.filter((p: any) => {
            if (!p.created_at) return false;
            const date = new Date(p.created_at);
            return getMonthKey(date) === thisMonthKey;
        }).length;

        // 3. Number of active subscriptions (status === 'active')
        let activeSubscriptions = 0;
        if (subscriptions.length > 0) {
            activeSubscriptions = subscriptions.filter((s: any) => s.status === 'active').length;
        }

        // 4. Most popular project status
        let mostPopularStatus = null;
        let mostPopularStatusCount = 0;
        Object.entries(statusCounts).forEach(([status, count]) => {
            if (count > mostPopularStatusCount) {
                mostPopularStatus = status;
                mostPopularStatusCount = count;
            }
        });

        // 5. Average project completion time (if possible)
        let avgCompletionDays = null;
        const completedProjects = projects.filter((p: any) => p.status === 'completed' && p.created_at && p.updated_at);
        if (completedProjects.length > 0) {
            const totalDays = completedProjects.reduce((sum: number, p: any) => {
                const created = new Date(p.created_at);
                const completed = new Date(p.updated_at);
                return sum + (completed.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
            }, 0);
            avgCompletionDays = totalDays / completedProjects.length;
        }

        // 6. Clients with no active projects
        const clientsWithNoActiveProjects = users.filter((u: any) => !activeClientIds.has(u.id));
        const numClientsWithNoActiveProjects = clientsWithNoActiveProjects.length;

        // 7. Top revenue clients
        const clientRevenue: Record<string, number> = {};
        payments.forEach((p) => {
            if (p.user_id) clientRevenue[p.user_id] = (clientRevenue[p.user_id] || 0) + (parseFloat(p.amount) || 0);
        });
        const topRevenueClients = Object.entries(clientRevenue)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([userId, revenue]) => {
                const user = users.find((u: any) => u.id === userId);
                return { userId, email: user?.email || 'Unknown', revenue };
            });

        return NextResponse.json({
            totalProjects,
            totalActiveClients,
            statusCounts,
            totalPurchases,
            totalRevenue,
            recentPurchases,
            topClients,
            monthlyRevenue,
            newProjectsThisMonth,
            activeSubscriptions,
            mostPopularStatus,
            avgCompletionDays,
            numClientsWithNoActiveProjects,
            topRevenueClients,
        });
    } catch (error) {
        return NextResponse.json({ error: (error as Error).message }, { status: 500 });
    }
} 