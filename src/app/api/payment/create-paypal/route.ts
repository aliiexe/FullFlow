import { NextRequest, NextResponse } from "next/server";

/**
 * Creates a new PayPal order or subscription.
 */
export async function POST(request: NextRequest) {
  console.log("[DEBUG] /api/payment/create-paypal called");
  try {
    const body = await request.json();
    console.log("[DEBUG] Request body:", body);
    const { selectedServices, customerFullName, customerEmail, isSubscription, subscriptionId, clerkId, totalPrice } = body;

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

    // Calculate the correct amount
    let amount = "150.00"; // Default amount
    
    if (isSubscription) {
      amount = "99.00"; // Default subscription amount
    } else if (totalPrice) {
      amount = totalPrice.toString();
    }

    // Use a simple custom_id that's within PayPal's length limits
    // We'll store the full data in the description or retrieve it later using the order ID
    const customId = `${clerkId || 'guest'}_${Date.now()}`;

    // Create order data - simplified custom_id
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: amount,
          },
          description: isSubscription
            ? `Monthly Subscription - Full Flow (${customerEmail})`
            : `Services: ${selectedServices?.length || 0} items (${customerEmail})`,
          custom_id: customId, // Simple, short custom ID
          // Store customer info in the payee object instead
          payee: {
            email_address: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ? undefined : customerEmail,
          },
        },
      ],
      application_context: {
        brand_name: "Full Flow",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: `${request.nextUrl.origin}/success`,
        cancel_url: `${request.nextUrl.origin}/cancel?source=paypal`,
      },
      // Store additional data in the order metadata
      metadata: {
        customer_email: customerEmail,
        customer_name: customerFullName,
        is_subscription: isSubscription.toString(),
        clerk_id: clerkId || '',
        selected_services: selectedServices?.join(',') || '',
        subscription_id: subscriptionId || ''
      }
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

    // Store the order details in a temporary storage or database for later retrieval
    // For now, we'll rely on the order description and custom_id
    
    return NextResponse.json({
      id: orderResult.id,
      status: orderResult.status,
      links: orderResult.links,
      custom_id: customId
    });

  } catch (error) {
    console.error("[DEBUG] PayPal create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}