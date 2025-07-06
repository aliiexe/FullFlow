import { NextRequest, NextResponse } from "next/server";

/**
 * Captures a PayPal order for subscription cancellation and processes the final cancellation.
 */
export async function POST(request: NextRequest) {
  console.log("[DEBUG] /api/payment/capture-paypal-cancellation called");
  try {
    const { orderID, subscriptionId, clerkId, monthsToPay } = await request.json();
    console.log("[DEBUG] Request orderID:", orderID, "subscriptionId:", subscriptionId, "clerkId:", clerkId, "monthsToPay:", monthsToPay);

    if (!orderID) {
      console.error("[DEBUG] Missing orderID");
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
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

    // First, get the order details to extract customer information
    console.log("[DEBUG] Fetching SANDBOX order details for:", orderID);
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
      console.log("[DEBUG] SANDBOX order details retrieved:", orderDetails);
    }

    // Capture the order - USING SANDBOX ENDPOINT
    console.log("[DEBUG] Capturing PayPal SANDBOX cancellation order:", orderID);
    const captureResponse = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${orderID}/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${access_token}`,
      },
    });

    if (!captureResponse.ok) {
      const errorText = await captureResponse.text();
      console.error("[DEBUG] PayPal SANDBOX capture error:", errorText);
      throw new Error(`PayPal capture failed: ${errorText}`);
    }

    const captureResult = await captureResponse.json();
    console.log("[DEBUG] PayPal SANDBOX cancellation payment captured successfully:", captureResult);

    // Extract payment details
    const paymentDetails = {
      orderId: captureResult.id,
      captureId: captureResult.purchase_units[0]?.payments?.captures[0]?.id,
      status: captureResult.status,
      amount: captureResult.purchase_units[0]?.payments?.captures[0]?.amount?.value,
      currency: captureResult.purchase_units[0]?.payments?.captures[0]?.amount?.currency_code,
      customerEmail: "",
      customerName: "",
      clerkId: clerkId || "",
      subscriptionId: subscriptionId || "",
      monthsToPay: monthsToPay || 0
    };

    // Extract customer data from order details
    if (orderDetails) {
      const description = orderDetails.purchase_units[0]?.description || "";
      const customId = orderDetails.purchase_units[0]?.custom_id || "";

      // Extract email from description
      const emailMatch = description.match(/\(([^)]+@[^)]+)\)/);
      if (emailMatch) {
        paymentDetails.customerEmail = emailMatch[1];
      }

      // Extract customer name from payer info if available
      if (orderDetails.payer?.name) {
        paymentDetails.customerName = `${orderDetails.payer.name.given_name || ''} ${orderDetails.payer.name.surname || ''}`.trim();
      }
    }

    console.log("[DEBUG] SANDBOX cancellation payment details:", paymentDetails);

    // Save the cancellation payment data
    try {
      const saveResponse = await fetch(`${request.nextUrl.origin}/api/payment/save-payment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...paymentDetails,
          selectedServices: [],
          isSubscription: false,
          paymentType: "cancellation"
        }),
      });

      if (saveResponse.ok) {
        const saveResult = await saveResponse.json();
        console.log("[DEBUG] SANDBOX cancellation payment saved successfully:", saveResult);
      } else {
        console.error("[DEBUG] Failed to save SANDBOX cancellation payment data");
      }
    } catch (saveError) {
      console.error("[DEBUG] Error saving SANDBOX cancellation payment:", saveError);
    }

    // Now process the final subscription cancellation
    console.log("[DEBUG] Processing final subscription cancellation...");
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.example.com";
      
      const inactivateResponse = await fetch(`${apiUrl}/api/inactivate_sub`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clerk_id: paymentDetails.clerkId,
          subscription_id: paymentDetails.subscriptionId,
          months: paymentDetails.monthsToPay,
          payment_method: "PayPal"
        }),
      });

      if (inactivateResponse.ok) {
        const inactivateResult = await inactivateResponse.json();
        console.log("[DEBUG] Subscription inactivated successfully:", inactivateResult);
        
        // Create project resources for the remaining months
        if (paymentDetails.monthsToPay > 0) {
          console.log("[DEBUG] Creating project resources for cancellation...");
          
          // Get user details for project creation
          const userResponse = await fetch(`${apiUrl}/api/users?clerk_id=${paymentDetails.clerkId}`);
          let userData = null;
          
          if (userResponse.ok) {
            const userResult = await userResponse.json();
            userData = userResult.data;
          }

          if (userData) {
            // Create Jira project for cancellation
            const sessionId = `cancel_${paymentDetails.subscriptionId}_${Date.now()}`;
            const sessionSuffix = sessionId.slice(-4).toUpperCase();
            const projectKey = `CXL${sessionSuffix}`;
            const companyName = `CANCELLATION ${sessionSuffix}`;

            const jiraResponse = await fetch(`${apiUrl}/api/create-jira-project`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customerEmail: userData.user_email,
                customerName: userData.user_fullname,
                companyName: companyName,
                projectKey: projectKey,
                isSubscription: true,
                subscriptionId: paymentDetails.subscriptionId,
                selectedServices: [],
                sessionId: sessionId
              }),
            });

            let jiraResult = null;
            if (jiraResponse.ok) {
              const jiraData = await jiraResponse.json();
              jiraResult = { data: jiraData, projectKey, companyName };
              console.log("[DEBUG] Cancellation Jira project created:", projectKey);
            }

            // Create Slack channel for cancellation
            const channelName = `cxl-${sessionSuffix.toLowerCase()}`;
            const slackResponse = await fetch(`${apiUrl}/api/createSlackChannel`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                name: channelName,
                customerEmail: userData.user_email,
                customerName: userData.user_fullname
              }),
            });

            let slackResult = null;
            if (slackResponse.ok) {
              const slackData = await slackResponse.json();
              slackResult = { data: slackData, channelName };
              console.log("[DEBUG] Cancellation Slack channel created:", channelName);
            }

            // Send project information
            if (jiraResult && slackResult) {
              await fetch(`${apiUrl}/api/project-infos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clerk_id: paymentDetails.clerkId,
                  projectkey: jiraResult.projectKey,
                  jiraurl: `https://pfa.atlassian.net/jira/software/projects/${jiraResult.projectKey}/boards`,
                  slackurl: `https://slack.com/app_redirect?channel=${slackResult.channelName}`
                }),
              });

              console.log("[DEBUG] Cancellation project information sent successfully");
            }

            // Send email notification
            if (jiraResult) {
              await fetch(`${apiUrl}/api/welcomeEmail`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  clientmail: userData.user_email,
                  clientname: userData.user_fullname,
                  projectKey: jiraResult.projectKey
                }),
              });

              console.log("[DEBUG] Cancellation email notification sent");
            }
          }
        }
      } else {
        console.error("[DEBUG] Failed to inactivate subscription");
      }
    } catch (inactivateError) {
      console.error("[DEBUG] Error during subscription inactivation:", inactivateError);
    }

    console.log("[DEBUG] Cancellation process completed");

    return NextResponse.json({
      status: "CANCELLATION_COMPLETED",
      orderId: paymentDetails.orderId,
      captureId: paymentDetails.captureId,
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
      customerEmail: paymentDetails.customerEmail,
      customerName: paymentDetails.customerName,
      subscriptionId: paymentDetails.subscriptionId,
      monthsToPay: paymentDetails.monthsToPay,
      message: "Subscription cancelled and payment processed successfully"
    });

  } catch (error) {
    console.error("[DEBUG] PayPal SANDBOX cancellation capture error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}