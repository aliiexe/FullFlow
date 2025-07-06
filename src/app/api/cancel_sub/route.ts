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

        // Forward the cancellation request to the backend API
        const response = await fetch(`${apiUrl}/api/cancel_subscription`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                clerk_id,
                subscription_id,
            }),
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
            console.error("[CANCEL SUB API] Backend error:", errorData);
            return NextResponse.json(
                { error: errorData.error || `Backend error: ${response.status}` },
                { status: response.status }
            );
        }

        const result = await response.json();
        console.log("[CANCEL SUB API] Success response:", result);

        return NextResponse.json(result);

    } catch (error) {
        console.error("[CANCEL SUB API] Error:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Internal server error" },
            { status: 500 }
        );
    }
} 