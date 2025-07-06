import { NextRequest, NextResponse } from "next/server";

/**
 * Creates a PayPal order specifically for subscription cancellation payments.
 * This handles the payment for remaining months when cancelling a subscription.
 */
export async function POST(request: NextRequest) {
  console.log("[DEBUG] /api/payment/create-paypal-cancellation called");
  try {
    const body = await request.json();
    console.log("[DEBUG] Request body:", body);
    const { 
      customerFullName, 
      customerEmail, 
      clerkId, 
      totalPrice, 
      subscriptionId, 
      monthsToPay 
    } = body;

    if (!customerEmail) {
      console.error("[DEBUG] Missing customerEmail");
      return NextResponse.json({ error: "Customer email is required" }, { status: 400 });
    }

    if (!totalPrice || totalPrice <= 0) {
      console.error("[DEBUG] Invalid totalPrice:", totalPrice);
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    // Check if PayPal credentials are configured
    if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
      console.error("[DEBUG] PayPal credentials not configured");
      return NextResponse.json({ error: "PayPal configuration error" }, { status: 500 });
    }

    // Get PayPal access token - USING SANDBOX ENDPOINT
    console.log("[DEBUG] Fetching PayPal access token from SANDBOX");
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

    // Use the provided total price for cancellation
    const amount = parseFloat(totalPrice).toFixed(2);

    // Use a simple custom_id that's within PayPal's length limits
    const customId = `cancel_${clerkId || 'guest'}_${Date.now()}`;

    // Create order data for cancellation payment
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: amount },
          description: `Subscription Cancellation Payment - ${monthsToPay} months (${customerEmail})`,
          custom_id: customId,
          reference_id: `cancellation_${subscriptionId}`,
        },
      ],
      application_context: {
        brand_name: "Full Flow - Cancellation",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
      },
    };

    console.log("[DEBUG] Creating PayPal SANDBOX cancellation order with data:", JSON.stringify(orderData, null, 2));

    // CREATE ORDER IN SANDBOX
    const orderResponse = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
      body: JSON.stringify(orderData),
    });

    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error("[DEBUG] PayPal SANDBOX cancellation order creation error:", errorText);
      throw new Error(`PayPal order creation failed: ${errorText}`);
    }

    const orderResult = await orderResponse.json();
    console.log("[DEBUG] PayPal SANDBOX cancellation order created successfully:", orderResult);

    // Validate the response has the required fields
    if (!orderResult.id) {
      throw new Error("PayPal order creation failed: No order ID returned");
    }

    console.log('[DEBUG] Cancellation Payment Details:');
    console.log('[DEBUG] Customer Full Name:', customerFullName);
    console.log('[DEBUG] Customer Email:', customerEmail);
    console.log('[DEBUG] Clerk ID:', clerkId || 'Not provided');
    console.log('[DEBUG] Subscription ID:', subscriptionId);
    console.log('[DEBUG] Months to Pay:', monthsToPay);
    console.log('[DEBUG] Amount:', amount);

    // Return the order creation response
    return NextResponse.json({
      id: orderResult.id,
      status: orderResult.status,
      links: orderResult.links,
      custom_id: customId,
      cancellation_details: {
        subscription_id: subscriptionId,
        months_to_pay: monthsToPay,
        amount: amount
      }
    });

  } catch (error) {
    console.error("[DEBUG] PayPal cancellation create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}