import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  console.log("PayPal order creation request received");
  
  try {
    const body = await request.json();
    const { selectedServices, customerFullName, customerEmail, subscriptionId, isSubscription, clerkId } = body;
    
    console.log("Request body:", JSON.stringify({
      customerEmail,
      isSubscription,
      totalServices: selectedServices?.length,
    }));
    
    // Validate required fields
    if (!customerEmail) {
      return NextResponse.json(
        { error: "Customer email is required" },
        { status: 400 }
      );
    }
    
    // Get access token from PayPal
    console.log("Getting PayPal access token");
    const authResponse = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`Aac4nJ2_mL1I4234hyKJo9O3Vs7rTdo0COz-J1CCVW6y35PmBucM-sSZl-ndsSUdqFLnI5ZjEhOeLE3S:EFVj8-NlPTy7jK4aSC797FzmrTiFVQ734_FcyIhWjTlqkhsBQoKi7rru2ezm3DhwnCYz4j1KDFvvrsfa`).toString('base64')}`,
      },
      body: "grant_type=client_credentials",
    });
    
    if (!authResponse.ok) {
      const errorText = await authResponse.text();
      console.error("PayPal authentication failed:", errorText);
      throw new Error(`PayPal authentication failed: ${errorText}`);
    }
    
    const authData = await authResponse.json();
    const access_token = authData.access_token;
    
    if (!access_token) {
      throw new Error("Failed to get PayPal access token");
    }
    
    console.log("Successfully obtained PayPal access token");
    
    // Create a simple PayPal order for now (we'll handle subscriptions through the backend)
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: isSubscription ? "99.00" : "150.00" // Simplified for now
          },
          description: isSubscription 
            ? `Subscription plan ${subscriptionId}` 
            : `Services: ${selectedServices.join(", ")}`
        }
      ],
      application_context: {
        brand_name: "Full Flow",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        return_url: `${request.nextUrl.origin}/success`,
        cancel_url: `${request.nextUrl.origin}/cancel`
      }
    };
    
    console.log("Creating PayPal order with data:", JSON.stringify(orderData));
    
    const orderResponse = await fetch("https://api-m.sandbox.paypal.com/v2/checkout/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
      },
      body: JSON.stringify(orderData),
    });
    
    if (!orderResponse.ok) {
      const errorText = await orderResponse.text();
      console.error("PayPal order creation failed:", errorText);
      throw new Error(`PayPal order creation failed: ${errorText}`);
    }
    
    const { id } = await orderResponse.json();
    if (!id) {
      throw new Error("No PayPal order ID in response");
    }
    console.log("PayPal order created successfully:", id);
    
    return NextResponse.json({ id });
  } catch (error) {
    console.error('PayPal order creation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}