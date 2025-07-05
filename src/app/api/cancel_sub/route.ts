import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { clerk_id, subscription_id } = body;

        if (!clerk_id || !subscription_id) {
            return NextResponse.json({ error: "Missing clerk_id or subscription_id" }, { status: 400 });
        }

        // Mock response for cancellation
        return NextResponse.json({
            canCancel: true,
            cancelMessage: "You can cancel anytime.",
            payToCancelAmount: null,
            subscription_id,
            subscription_tier_id: "85fb4214-af39-4a63-8020-daa8a48ec975",
            payments_count: 7
        });
    } catch (error) {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
} 