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
            months_to_pay: paymentData.monthsToPay,
            payment_method: "PayPal",
            transaction_id: paymentData.captureId // Add PayPal capture ID as transaction ID
        };

        console.log("[DEBUG] Sending inactivation request to backend:", {
            url: `${apiUrl}/api/inactivate_sub`,
            data: inactivateData
        });

        const response = await fetch(`${apiUrl}/api/inactivate_sub`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Accept": "application/json"
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
            throw new Error(result.error || `HTTP error! status: ${response.status}`);
        }

        return NextResponse.json(result);
    } catch (error) {
        console.error("[DEBUG] Error processing cancellation:", error);
        return NextResponse.json(
            { error: error instanceof Error ? error.message : "Unknown error" },
            { status: 500 }
        );
    }
} 