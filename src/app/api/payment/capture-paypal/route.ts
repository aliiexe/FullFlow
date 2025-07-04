import { NextRequest, NextResponse } from "next/server";

/**
 * Captures a PayPal order.
 */
export async function POST(request: NextRequest) {
  console.log("[DEBUG] /api/payment/capture-paypal called");
  try {
    const { orderID, isSubscription } = await request.json();
    console.log("[DEBUG] Request orderID:", orderID, "isSubscription:", isSubscription);

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
    console.log("[DEBUG] Fetching PayPal access token");
    const authResponse = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString("base64")}`,
      },
      body: "grant_type=client_credentials",
    });

    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error("[DEBUG] PayPal auth error:", errorText);
      throw new Error(`PayPal auth failed: ${errorText}`);
    }

    const { access_token } = await authResponse.json();
    console.log("[DEBUG] Got PayPal access token");

    // First, get the order details to extract customer information
    console.log("[DEBUG] Fetching order details for:", orderID);
    const orderDetailsResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    });

    let orderDetails = null;
    if (orderDetailsResponse.ok) {
      orderDetails = await orderDetailsResponse.json();
      console.log("[DEBUG] Order details retrieved:", orderDetails);
    }

    // Capture the order
    console.log("[DEBUG] Capturing PayPal order:", orderID);
    const captureResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text();
      console.error("[DEBUG] PayPal capture error:", errorText);
      throw new Error(`PayPal capture failed: ${errorText}`);
    }

    const captureResult = await captureResponse.json();
    console.log("[DEBUG] PayPal payment captured successfully:", captureResult);

    // Extract payment details
    const paymentDetails = {
      orderId: captureResult.id,
      captureId: captureResult.purchase_units[0]?.payments?.captures[0]?.id,
      status: captureResult.status,
      amount: captureResult.purchase_units[0]?.payments?.captures[0]?.amount?.value,
      currency: captureResult.purchase_units[0]?.payments?.captures[0]?.amount?.currency_code,
      customerEmail: "",
      customerName: "",
      selectedServices: [],
      isSubscription: isSubscription || false,
      customId: captureResult.purchase_units[0]?.custom_id || ""
    };

    // Extract customer data from order details or description
    if (orderDetails) {
      const description = orderDetails.purchase_units[0]?.description || "";
      const customId = orderDetails.purchase_units[0]?.custom_id || "";
      
      // Extract email from description (format: "Services: X items (email@example.com)")
      const emailMatch = description.match(/\(([^)]+@[^)]+)\)/);
      if (emailMatch) {
        paymentDetails.customerEmail = emailMatch[1];
      }

      // Extract customer name from payer info if available
      if (orderDetails.payer?.name) {
        paymentDetails.customerName = `${orderDetails.payer.name.given_name || ''} ${orderDetails.payer.name.surname || ''}`.trim();
      }

      // Extract clerk ID from custom_id (format: "clerkId_timestamp")
      const clerkIdMatch = customId.match(/^([^_]+)_/);
      if (clerkIdMatch && clerkIdMatch[1] !== 'guest') {
        paymentDetails.clerkId = clerkIdMatch[1];
      }
    }

    console.log("[DEBUG] Payment details to save:", paymentDetails);

    // Save payment data to database
    try {
      const saveResponse = await fetch(`${request.nextUrl.origin}/api/payment/save-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentDetails,
          clerkId: paymentDetails.clerkId || request.headers.get("x-clerk-id") || ""
        }),
      });

      if (saveResponse.ok) {
        const saveResult = await saveResponse.json();
        console.log("[DEBUG] Payment saved successfully:", saveResult);
      } else {
        console.error("[DEBUG] Failed to save payment data");
      }
    } catch (saveError) {
      console.error("[DEBUG] Error saving payment:", saveError);
    }

    return NextResponse.json({
      status: "ORDER_CAPTURED",
      orderId: paymentDetails.orderId,
      captureId: paymentDetails.captureId,
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
      customerEmail: paymentDetails.customerEmail,
      customerName: paymentDetails.customerName,
      selectedServices: paymentDetails.selectedServices,
      isSubscription: paymentDetails.isSubscription
    });

  } catch (error) {
    console.error("[DEBUG] PayPal capture error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}