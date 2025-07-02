//// filepath: c:\Users\abour\Documents\ProjectsF\full-flow\src\app\api\payment\create-paypal\route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Creates a new PayPal order or subscription.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { selectedServices, customerFullName, customerEmail, isSubscription } = body;

    if (!customerEmail) {
      return NextResponse.json({ error: "Customer email is required" }, { status: 400 });
    }

    // Get PayPal access token
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
      console.error("PayPal auth error:", errorText);
      throw new Error(`PayPal auth failed: ${errorText}`);
    }
    
    const { access_token } = await authResponse.json();

    // For subscriptions, we actually still create a regular order
    // The subscription setup happens client-side with the PayPal SDK
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: isSubscription ? "99.00" : "150.00",
          },
          description: isSubscription 
            ? `Monthly Subscription` 
            : `Services: ${selectedServices.join(", ")}`,
          custom_id: JSON.stringify({ 
            customerEmail, 
            customerFullName,
            isSubscription 
          }),
        },
      ],
      application_context: {
        brand_name: "Full Flow",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: `${request.nextUrl.origin}/success`,
        cancel_url: `${request.nextUrl.origin}/cancel`,
      },
    };

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
      console.error("PayPal order creation error:", errorText);
      throw new Error(`PayPal order creation failed: ${errorText}`);
    }

    const orderResult = await orderResponse.json();
    console.log("PayPal order created:", orderResult);
    return NextResponse.json({ id: orderResult.id });

  } catch (error) {
    console.error("PayPal create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}