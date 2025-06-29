import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { orderID } = body;
    
    console.log("Capturing PayPal payment for order:", orderID);
    
    if (!orderID) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }
    
    // Get access token from PayPal
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
    
    const { access_token } = await authResponse.json();
    
    if (!access_token) {
      throw new Error("Failed to get PayPal access token");
    }
    
    // Capture the payment
    console.log("Sending capture request to PayPal");
    const captureResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
      }
    });
    
    const responseText = await captureResponse.text();
    console.log("Capture response from PayPal:", responseText);
    
    try {
      const captureData = JSON.parse(responseText);
      
      if (captureResponse.ok && captureData.status === "COMPLETED") {
        console.log("Payment successfully captured");
        return NextResponse.json({ 
          success: true, 
          status: captureData.status,
          id: captureData.id
        });
      } else {
        return NextResponse.json(
          { error: `Payment capture failed: ${captureData.message || responseText}` },
          { status: 400 }
        );
      }
    } catch (err) {
      console.error("Error parsing PayPal response:", err);
      return NextResponse.json(
        { error: `Error processing PayPal response: ${responseText}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('PayPal capture error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}