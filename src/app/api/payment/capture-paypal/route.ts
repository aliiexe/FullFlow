import { NextRequest, NextResponse } from "next/server";

// Project creation functions
async function createJiraProject(customerData: {
  customerEmail: string;
  customerName: string;
  isSubscription: boolean;
  subscriptionId?: string;
  selectedServices?: string[];
  sessionId: string;
}) {
  try {
    const sessionSuffix = customerData.sessionId.slice(-4).toUpperCase();
    const projectKey = `PRJ${sessionSuffix}`;
    const companyName = `PROJECT ${sessionSuffix}`;

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create-jira-project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: customerData.customerEmail,
        customerName: customerData.customerName,
        companyName: companyName,
        projectKey: projectKey,
        isSubscription: customerData.isSubscription,
        subscriptionId: customerData.subscriptionId,
        selectedServices: customerData.selectedServices,
        sessionId: customerData.sessionId
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error creating Jira project:', errorData);
      return null;
    } else {
      const data = await response.json();
      console.log('Jira project created successfully:', data);
      console.log(`Project Key: ${projectKey}, Company Name: ${companyName}`);
      return { data, projectKey, companyName };
    }
  } catch (error) {
    console.error('Failed to create Jira project:', error);
    return null;
  }
}

async function createSlackChannel(customerData: {
  customerEmail: string;
  customerName: string;
  sessionId: string;
}) {
  try {
    const sessionSuffix = customerData.sessionId.slice(-4).toLowerCase();
    const channelName = `prj-${sessionSuffix}`;

    console.log('Creating Slack channel:', channelName);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/createSlackChannel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: channelName,
        customerEmail: customerData.customerEmail,
        customerName: customerData.customerName
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error creating Slack channel:', errorData);
      return null;
    } else {
      const data = await response.json();
      console.log('Slack channel created successfully:', data);
      console.log(`Channel name: ${channelName}`);
      return { data, channelName };
    }
  } catch (error) {
    console.error('Failed to create Slack channel:', error);
    return null;
  }
}

async function sendProjectInfo(data: {
  clerk_id: string;
  projectkey: string;
  jiraurl: string;
  slackurl: string;
}) {
  try {
    console.log('Sending project information with details:');
    console.log('- Clerk ID:', data.clerk_id);
    console.log('- Project Key:', data.projectkey);
    console.log('- Jira URL:', data.jiraurl);
    console.log('- Slack URL:', data.slackurl);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project-infos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error sending project information:', errorData);
      return null;
    } else {
      const responseData = await response.json();
      console.log('Project information sent successfully:', responseData);
      return responseData;
    }
  } catch (error) {
    console.error('Failed to send project information:', error);
    return null;
  }
}

async function sendEmailNotification(customerData: {
  customerEmail: string;
  customerName: string;
  projectKey: string;
  channelName: string;
  amount: string;
  selectedServices: string[];
  isSubscription: boolean;
  subscriptionName?: string;
}) {
  try {
    console.log('Sending email notification to customer:', customerData.customerEmail);

    const emailData = {
      clientmail: customerData.customerEmail,
      clientname: customerData.customerName,
      projectKey: customerData.projectKey
    };

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/welcomeEmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error sending email notification:', errorData);
      return null;
    } else {
      const responseData = await response.json();
      console.log('Email notification sent successfully:', responseData);
      return responseData;
    }
  } catch (error) {
    console.error('Failed to send email notification:', error);
    return null;
  }
}

/**
 * Captures a PayPal order and creates project resources after successful payment.
 */
export async function POST(request: NextRequest) {
  console.log("[DEBUG] /api/payment/capture-paypal called");
  try {
    const { orderID, isSubscription, subscriptionId, clerkId } = await request.json();
    console.log("[DEBUG] Request orderID:", orderID, "isSubscription:", isSubscription, "subscriptionId:", subscriptionId, "clerkId:", clerkId);
    console.log("[DEBUG] Request headers:", Object.fromEntries(request.headers.entries()));

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
    console.log("[DEBUG] Capturing PayPal SANDBOX order:", orderID);
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
    console.log("[DEBUG] PayPal SANDBOX payment captured successfully:", captureResult);

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
      subscriptionId: subscriptionId || "",
      customId: captureResult.purchase_units[0]?.custom_id || "",
      clerkId: clerkId || "" // Use clerkId from request body if available
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
      const extractedClerkId = (clerkIdMatch && clerkIdMatch[1] !== 'guest' && clerkIdMatch[1] !== 'user') ? clerkIdMatch[1] : '';
      paymentDetails.clerkId = extractedClerkId;

      console.log("[DEBUG] Custom ID from PayPal:", customId);
      console.log("[DEBUG] Extracted clerk ID from custom_id:", extractedClerkId);

      // Extract selected services from reference_id if available
      const referenceId = orderDetails.purchase_units[0]?.reference_id || "";
      if (referenceId && !isSubscription) {
        paymentDetails.selectedServices = referenceId.split(",");
      }
    }

    console.log("[DEBUG] SANDBOX payment details to save:", paymentDetails);

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
        console.log("[DEBUG] SANDBOX payment saved successfully:", saveResult);
      } else {
        console.error("[DEBUG] Failed to save SANDBOX payment data");
      }
    } catch (saveError) {
      console.error("[DEBUG] Error saving SANDBOX payment:", saveError);
    }

    // When building deliverablePaymentData:
    const deliverablePaymentData = {
      clerk_id: paymentDetails.clerkId || '', // Make sure this is the real user ID!
      email: paymentDetails.customerEmail,
      fullname: paymentDetails.customerName || '',
      payment_method: 'PayPal',
      status: 'paid',
      transaction_id: paymentDetails.captureId || paymentDetails.orderId,
      deliverable_ids: paymentDetails.selectedServices
    };

    console.log("[DEBUG] Deliverable payment data:", deliverablePaymentData);

    // STEP 2: Create project resources after successful payment
    console.log("[DEBUG] Payment successful, creating project resources...");

    // Get subscription details if applicable
    let subscriptionName = null;
    if (isSubscription && subscriptionId) {
      try {
        const subscriptionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription-tiers`);
        if (subscriptionResponse.ok) {
          const subscriptionPlans = await subscriptionResponse.json();
          const selectedPlan = subscriptionPlans.find((plan: any) => plan.id === subscriptionId);
          if (selectedPlan) {
            subscriptionName = selectedPlan.name;
          }
        }
      } catch (error) {
        console.error("[DEBUG] Error fetching subscription details:", error);
      }
    }

    // Create Jira project
    const jiraResult = await createJiraProject({
      customerEmail: paymentDetails.customerEmail,
      customerName: paymentDetails.customerName,
      isSubscription: paymentDetails.isSubscription,
      subscriptionId: paymentDetails.subscriptionId,
      selectedServices: paymentDetails.selectedServices,
      sessionId: orderID
    });

    // Create Slack channel
    const slackResult = await createSlackChannel({
      customerEmail: paymentDetails.customerEmail,
      customerName: paymentDetails.customerName,
      sessionId: orderID
    });

    // Get the best available clerk ID
    const finalClerkId = paymentDetails.clerkId ||
      clerkId ||
      request.headers.get("x-clerk-id") ||
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      'anonymous';

    console.log("[DEBUG] Final clerk ID being used:", finalClerkId);

    // Send project information
    if (jiraResult && slackResult) {
      await sendProjectInfo({
        clerk_id: finalClerkId,
        projectkey: jiraResult.projectKey,
        jiraurl: `https://pfa.atlassian.net/jira/software/projects/${jiraResult.projectKey}/boards`,
        slackurl: `https://slack.com/app_redirect?channel=${slackResult.channelName}`
      });
    }

    // STEP 3: Send email notification to client
    if (jiraResult && slackResult) {
      await sendEmailNotification({
        customerEmail: paymentDetails.customerEmail,
        customerName: paymentDetails.customerName,
        projectKey: jiraResult.projectKey,
        channelName: slackResult.channelName,
        amount: paymentDetails.amount || "0",
        selectedServices: paymentDetails.selectedServices,
        isSubscription: paymentDetails.isSubscription,
        subscriptionName: subscriptionName
      });
    }

    console.log("[DEBUG] Project creation and email notification completed");

    return NextResponse.json({
      status: "ORDER_CAPTURED",
      orderId: paymentDetails.orderId,
      captureId: paymentDetails.captureId,
      amount: paymentDetails.amount,
      currency: paymentDetails.currency,
      customerEmail: paymentDetails.customerEmail,
      customerName: paymentDetails.customerName,
      selectedServices: paymentDetails.selectedServices,
      isSubscription: paymentDetails.isSubscription,
      subscriptionId: paymentDetails.subscriptionId,
      projectCreated: !!jiraResult,
      slackCreated: !!slackResult,
      projectKey: jiraResult?.projectKey,
      channelName: slackResult?.channelName
    });

  } catch (error) {
    console.error("[DEBUG] PayPal SANDBOX capture error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}