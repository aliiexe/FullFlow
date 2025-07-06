import { NextRequest, NextResponse } from "next/server";
import { getPayPalAccessToken, capturePayPalOrder, getOrderDetails } from "@/libs/paypal";

/**
 * Captures a PayPal order for subscription cancellation and processes the final cancellation.
 */
export async function POST(request: NextRequest) {
  try {
    const { orderID, subscriptionId, clerkId, monthsToPay } = await request.json();
    console.log("[DEBUG] /api/payment/capture-paypal-cancellation called");
    console.log("[DEBUG] Request:", { orderID, subscriptionId, clerkId, monthsToPay });

    if (!orderID) {
      console.error("[DEBUG] Missing orderID");
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // Check if PayPal credentials are configured
    if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
      console.error("[DEBUG] PayPal credentials not configured");
      return NextResponse.json({ error: "PayPal configuration error" }, { status: 500 });
    }

    // Get PayPal access token
    const accessToken = await getPayPalAccessToken();
    console.log("[DEBUG] Got PayPal access token");

    // Get order details first
    console.log("[DEBUG] Fetching SANDBOX order details for:", orderID);
    const orderDetails = await getOrderDetails(orderID, accessToken);
    console.log("[DEBUG] Order details:", orderDetails);

    // Capture the order
    console.log("[DEBUG] Capturing order:", orderID);
    const captureData = await capturePayPalOrder(orderID, accessToken);
    console.log("[DEBUG] Capture data:", captureData);

    // Process the payment and inactivate subscription
    const paymentData = {
      clerkId,
      subscriptionId,
      monthsToPay, // This comes from cancel_sub response
      captureId: captureData.id // Add PayPal capture ID
    };

    console.log("[DEBUG] Processing subscription cancellation:", paymentData);

    const saveResponse = await fetch(`${request.nextUrl.origin}/api/payment/save-payment-cancellation`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(paymentData),
    });

    if (!saveResponse.ok) {
      const errorData = await saveResponse.json().catch(() => ({ error: "Failed to parse error response" }));
      throw new Error(errorData.error || `Failed to process cancellation: ${saveResponse.status}`);
    }

    const result = await saveResponse.json();
    console.log("[DEBUG] Subscription cancelled successfully:", result);

    return NextResponse.json(result);
  } catch (error) {
    console.error("[DEBUG] Error in capture-paypal-cancellation:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process cancellation" },
      { status: 500 }
    );
  }
}