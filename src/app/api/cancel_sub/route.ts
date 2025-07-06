import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const { clerk_id, subscription_id } = await request.json();

        console.log("[CANCEL SUB API] Received request:", { clerk_id, subscription_id });

        // Validate required fields
        if (!clerk_id || !subscription_id) {
            return NextResponse.json(
                { error: "Missing required fields: clerk_id and subscription_id" },
                { status: 400 }
            );
        }

        // Get the API URL from environment
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.example.com";

        // First, get subscription details to calculate months to pay
        let subscriptionDetails = null;
        let monthsToPay = 0;

        try {
            const subscriptionResponse = await fetch(`${apiUrl}/api/user_subs?clerk_id=${clerk_id}`);
            if (subscriptionResponse.ok) {
                const subscriptionData = await subscriptionResponse.json();
                const activeSubscription = subscriptionData.data?.find(
                    (sub: any) => sub.subscription_id === subscription_id && sub.status === 'active'
                );
                
                if (activeSubscription) {
                    subscriptionDetails = activeSubscription;
                    
                    // Calculate months remaining
                    const endDate = new Date(activeSubscription.end_date);
                    const currentDate = new Date();
                    const monthsRemaining = Math.max(0, Math.ceil((endDate.getTime() - currentDate.getTime()) / (1000 * 60 * 60 * 24 * 30)));
                    monthsToPay = monthsRemaining;
                    
                    console.log("[CANCEL SUB API] Subscription details:", {
                        subscription_id,
                        end_date: activeSubscription.end_date,
                        months_remaining: monthsRemaining
                    });
                }
            }
        } catch (error) {
            console.error("[CANCEL SUB API] Error fetching subscription details:", error);
        }

        // Call the inactivate subscription API
        const inactivateResponse = await fetch(`${apiUrl}/api/inactivate_sub`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                clerk_id,
                subscription_id,
                months: monthsToPay,
                payment_method: "PayPal" // Default to PayPal since that's what we're using
            }),
        });

        if (!inactivateResponse.ok) {
            const errorData = await inactivateResponse.json().catch(() => ({ error: "Unknown error" }));
            console.error("[CANCEL SUB API] Inactivate error:", errorData);
            return NextResponse.json(
                { error: errorData.error || `Inactivation failed: ${inactivateResponse.status}` },
                { status: inactivateResponse.status }
            );
        }

        const inactivateResult = await inactivateResponse.json();
        console.log("[CANCEL SUB API] Inactivation success:", inactivateResult);

        // If there are months to pay, create project resources
        if (monthsToPay > 0 && subscriptionDetails) {
            console.log("[CANCEL SUB API] Creating project resources for remaining months:", monthsToPay);
            
            try {
                // Get user details for project creation
                const userResponse = await fetch(`${apiUrl}/api/users?clerk_id=${clerk_id}`);
                let userData = null;
                
                if (userResponse.ok) {
                    const userResult = await userResponse.json();
                    userData = userResult.data;
                }

                if (userData) {
                    // Create Jira project
                    const sessionId = `cancel_${subscription_id}_${Date.now()}`;
                    const sessionSuffix = sessionId.slice(-4).toUpperCase();
                    const projectKey = `CXL${sessionSuffix}`;
                    const companyName = `CANCELLATION ${sessionSuffix}`;

                    const jiraResponse = await fetch(`${apiUrl}/api/create-jira-project`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            customerEmail: userData.user_email,
                            customerName: userData.user_fullname,
                            companyName: companyName,
                            projectKey: projectKey,
                            isSubscription: true,
                            subscriptionId: subscription_id,
                            selectedServices: [],
                            sessionId: sessionId
                        }),
                    });

                    let jiraResult = null;
                    if (jiraResponse.ok) {
                        const jiraData = await jiraResponse.json();
                        jiraResult = { data: jiraData, projectKey, companyName };
                        console.log("[CANCEL SUB API] Jira project created:", projectKey);
                    }

                    // Create Slack channel
                    const channelName = `cxl-${sessionSuffix.toLowerCase()}`;
                    const slackResponse = await fetch(`${apiUrl}/api/createSlackChannel`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            name: channelName,
                            customerEmail: userData.user_email,
                            customerName: userData.user_fullname
                        }),
                    });

                    let slackResult = null;
                    if (slackResponse.ok) {
                        const slackData = await slackResponse.json();
                        slackResult = { data: slackData, channelName };
                        console.log("[CANCEL SUB API] Slack channel created:", channelName);
                    }

                    // Send project information
                    if (jiraResult && slackResult) {
                        await fetch(`${apiUrl}/api/project-infos`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                clerk_id: clerk_id,
                                projectkey: jiraResult.projectKey,
                                jiraurl: `https://pfa.atlassian.net/jira/software/projects/${jiraResult.projectKey}/boards`,
                                slackurl: `https://slack.com/app_redirect?channel=${slackResult.channelName}`
                            }),
                        });

                        console.log("[CANCEL SUB API] Project information sent successfully");
                    }

                    // Send email notification
                    if (jiraResult) {
                        await fetch(`${apiUrl}/api/welcomeEmail`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                clientmail: userData.user_email,
                                clientname: userData.user_fullname,
                                projectKey: jiraResult.projectKey
                            }),
                        });

                        console.log("[CANCEL SUB API] Email notification sent");
                    }
                }
            } catch (projectError) {
                console.error("[CANCEL SUB API] Error creating project resources:", projectError);
                // Don't fail the cancellation if project creation fails
            }
        }

        // Return success response with cancellation details
        return NextResponse.json({
            success: true,
            cancelMessage: inactivateResult.message || "Subscription cancelled successfully",
            payToCancelAmount: inactivateResult.payToCancelAmount || null,
            canCancel: inactivateResult.canCancel !== false,
            monthsToPay: monthsToPay,
            projectCreated: monthsToPay > 0,
            ...inactivateResult
        });

    } catch (error) {
        console.error("[CANCEL SUB API] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
}