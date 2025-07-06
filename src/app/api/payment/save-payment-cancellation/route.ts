import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
    try {
        const paymentData = await request.json();
        console.log("[DEBUG] Processing cancellation payment data:", paymentData);

        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
            throw new Error("API URL not configured");
        }

        // Prepare the inactivation data - include transaction_id
        const inactivateData = {
            clerk_id: paymentData.clerkId,
            subscription_id: paymentData.subscriptionId,
            months: paymentData.monthsToPay,
            payment_method: "PayPal",
            transaction_id: paymentData.captureId // Add PayPal capture ID as transaction ID
        };

        // Validate required parameters
        console.log("[DEBUG] Validating parameters before sending:", {
            clerk_id: !!inactivateData.clerk_id,
            subscription_id: !!inactivateData.subscription_id,
            months: inactivateData.months !== null && inactivateData.months !== undefined,
            payment_method: !!inactivateData.payment_method,
            transaction_id: !!inactivateData.transaction_id
        });

        if (!inactivateData.clerk_id || !inactivateData.subscription_id ||
            inactivateData.months === null || inactivateData.months === undefined ||
            !inactivateData.payment_method || !inactivateData.transaction_id) {
            throw new Error("Missing required parameters for subscription inactivation");
        }

        console.log("[DEBUG] Sending inactivation request to backend:", {
            url: `${apiUrl}/api/inactivate_sub`,
            data: inactivateData,
            transaction_id: paymentData.captureId
        });

        console.log("[DEBUG] Full request body being sent:", JSON.stringify(inactivateData, null, 2));
        console.log("[DEBUG] Data types being sent:", {
            clerk_id: typeof inactivateData.clerk_id,
            subscription_id: typeof inactivateData.subscription_id,
            months: typeof inactivateData.months,
            payment_method: typeof inactivateData.payment_method,
            transaction_id: typeof inactivateData.transaction_id
        });

        const response = await fetch(`${apiUrl}/api/inactivate_sub`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "FullFlow-Frontend/1.0"
            },
            body: JSON.stringify(inactivateData)
        });

        // Log the complete response details
        console.log("[DEBUG] Backend response:", {
            status: response.status,
            statusText: response.statusText,
            headers: Object.fromEntries(response.headers.entries()),
            url: response.url
        });

        // Check content type before trying to parse JSON
        const contentType = response.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
            const textContent = await response.text();
            console.log("[DEBUG] Received non-JSON response:", {
                contentType,
                textContent: textContent.substring(0, 500) // Limit log size
            });
            throw new Error(`Invalid response type: ${contentType}`);
        }

        const result = await response.json();

        if (!response.ok) {
            console.error("[DEBUG] Backend API error response:", {
                status: response.status,
                statusText: response.statusText,
                error: result,
                requestData: inactivateData
            });
            throw new Error(result.error || `HTTP error! status: ${response.status}`);
        }

        console.log("[DEBUG] Backend API response successful:", {
            status: response.status,
            result: result,
            transaction_id: paymentData.captureId
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("[DEBUG] Error processing cancellation:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
} 