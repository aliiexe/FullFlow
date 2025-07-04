import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const order_id = searchParams.get("order_id");

    if (!order_id) {
      return NextResponse.json(
        { error: "Missing order_id in query" },
        { status: 400 }
      );
    }

    // Check if PayPal credentials are configured
    if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || !process.env.PAYPAL_SECRET) {
      throw new Error("PayPal credentials not configured");
    }

    // Get access token from PayPal
    const authResponse = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64')}`,
      },
      body: "grant_type=client_credentials",
    });
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      throw new Error(`PayPal authentication failed: ${errorText}`);
    }
    
    const authData = await authResponse.json();
    const access_token = authData.access_token;
    
    if (!access_token) {
      throw new Error("Failed to get PayPal access token");
    }
    
    // Get order details
    const orderDetailsResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${order_id}`, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json"
      }
    });
    
    if (!orderDetailsResponse.ok) {
      const errorText = await orderDetailsResponse.text();
      throw new Error(`Failed to get order details: ${errorText}`);
    }
    
    const orderDetails = await orderDetailsResponse.json();
    
    // Extract customer data from description and other fields
    const description = orderDetails.purchase_units?.[0]?.description || "";
    const amount = orderDetails.purchase_units?.[0]?.amount?.value || "0";
    const customId = orderDetails.purchase_units?.[0]?.custom_id || "";
    
    // Extract email from description (format: "Services: X items (email@example.com)")
    let customerEmail = "";
    let customerName = "";
    
    const emailMatch = description.match(/\(([^)]+@[^)]+)\)/);
    if (emailMatch) {
      customerEmail = emailMatch[1];
    }

    // Extract customer name from payer info if available
    if (orderDetails.payer?.name) {
      customerName = `${orderDetails.payer.name.given_name || ''} ${orderDetails.payer.name.surname || ''}`.trim();
    }
    
    // Parse amount as float first, then multiply by 100 and round to ensure integer cents
    const amountInCents = Math.round(parseFloat(amount) * 100);
    
    return NextResponse.json({
      customer_email: customerEmail,
      customer_name: customerName,
      amount_total: amountInCents,
      order_id: order_id,
      status: orderDetails.status,
      custom_id: customId
    });
  } catch (error) {
    console.error("Error retrieving PayPal order:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}