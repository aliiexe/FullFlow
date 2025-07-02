//// filepath: c:\Users\abour\Documents\ProjectsF\full-flow\src\app\api\payment\capture-paypal\route.ts
import { NextRequest, NextResponse } from "next/server";

/**
 * Captures a PayPal order.
 */
export async function POST(request: NextRequest) {
  try {
    const { orderID } = await request.json();

    if (!orderID) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
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
    
    // Capture the order (works for both subscription and regular orders)
    const captureResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text();
      console.error("PayPal capture error:", errorText);
      throw new Error(`PayPal capture failed: ${errorText}`);
    }

    const captureResult = await captureResponse.json();
    console.log("PayPal payment captured:", captureResult);
    
    return NextResponse.json({ 
      status: "ORDER_CAPTURED",
      orderId: captureResult.id,
      captureId: captureResult.purchase_units[0]?.payments?.captures[0]?.id
    });

  } catch (error) {
    console.error("PayPal capture error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}