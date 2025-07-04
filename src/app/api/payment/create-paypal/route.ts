import { NextRequest, NextResponse } from "next/server";

/**
 * Creates a new PayPal order or subscription.
 */
export async function POST(request: NextRequest) {
  console.log("[DEBUG] /api/payment/create-paypal called");
  try {
    const body = await request.json();
    console.log("[DEBUG] Request body:", body);
    const { selectedServices, customerFullName, customerEmail, isSubscription, subscriptionId, clerkId } = body;

    if (!customerEmail) {
      console.error("[DEBUG] Missing customerEmail");
      return NextResponse.json({ error: "Customer email is required" }, { status: 400 });
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

    // Calculate the correct amount based on selected services or subscription
    let amount = "150.00"; // Default amount
    
    if (isSubscription) {
      // For subscriptions, use a fixed amount or get from subscriptionId
      amount = "99.00"; // Default subscription amount
    } else {
      // For one-time payments, calculate based on selected services
      // You might want to fetch actual prices from your API
      amount = "150.00";
    }

    // Create custom data to pass with the order
    const customData = JSON.stringify({
      selectedServices: selectedServices || [],
      customerEmail,
      customerFullName,
      isSubscription,
      subscriptionId,
      clerkId
    });

    // Create order data
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount,
          },
          description: isSubscription
            ? `Monthly Subscription - Full Flow`
            : `Services: ${selectedServices?.join(", ") || "Custom Services"}`,
          custom_id: customData, // Store custom data here
        },
      ],
      application_context: {
        brand_name: "Full Flow",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: `${request.nextUrl.origin}/success`,
        cancel_url: `${request.nextUrl.origin}/cancel?source=paypal`,
      },
    };

    console.log("[DEBUG] Creating PayPal order with data:", orderData);
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
      console.error("[DEBUG] PayPal order creation error:", errorText);
      throw new Error(`PayPal order creation failed: ${errorText}`);
    }

    const orderResult = await orderResponse.json();
    console.log("[DEBUG] PayPal order created successfully:", orderResult);

    return NextResponse.json({
      id: orderResult.id,
      status: orderResult.status,
      links: orderResult.links
    });

  } catch (error) {
    console.error("[DEBUG] PayPal create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}