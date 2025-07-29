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
  sessionId: string;
}) {
  try {
    const sessionSuffix = customerData.sessionId.slice(-4).toLowerCase();
    const channelName = `prj-${sessionSuffix}`;

    console.log('Creating Slack channel:', channelName);
    console.log('Slack API URL:', `${process.env.NEXT_PUBLIC_API_URL}/api/createSlackChannel`);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/createSlackChannel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: channelName
      }),
    });

    console.log('Slack API response status:', response.status);
    console.log('Slack API response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.text();
      console.error('Error creating Slack channel:', errorData);
      console.error('Slack API failed with status:', response.status);
      return null;
    } else {
      const data = await response.json();
      console.log('Slack channel created successfully:', data);
      console.log(`Channel name: ${channelName}`);
      return { data, channelName };
    }
  } catch (error) {
    console.error('Failed to create Slack channel:', error);
    console.error('Slack API request failed completely');
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
    console.log('[EMAIL] Starting email notification process...');
    console.log('[EMAIL] Customer data:', {
      email: customerData.customerEmail,
      name: customerData.customerName,
      projectKey: customerData.projectKey,
      channelName: customerData.channelName,
      amount: customerData.amount,
      isSubscription: customerData.isSubscription,
      subscriptionName: customerData.subscriptionName,
      selectedServices: customerData.selectedServices
    });

    const emailData = {
      clientmail: customerData.customerEmail,
      clientname: customerData.customerName,
      projectKey: customerData.projectKey
    };

    console.log('[EMAIL] Email data to send:', emailData);
    console.log('[EMAIL] Calling welcome email endpoint:', `${process.env.NEXT_PUBLIC_API_URL}/api/welcomeEmail`);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/welcomeEmail`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(emailData),
    });

    console.log('[EMAIL] Welcome email response status:', response.status);
    console.log('[EMAIL] Welcome email response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[EMAIL] Error sending welcome email:', errorData);
      console.error('[EMAIL] Welcome email failed with status:', response.status);
      return null;
    } else {
      const responseData = await response.json();
      console.log('[EMAIL] Welcome email sent successfully:', responseData);
      return responseData;
    }
  } catch (error) {
    console.error('[EMAIL] Failed to send welcome email:', error);
    console.error('[EMAIL] Welcome email request failed completely');
    return null;
  }
}

async function sendAdminNotification(adminData: {
  user_id: string;
  purchase_type: 'subscription' | 'deliverable';
  purchase_data: {
    payment: any;
    tier?: any;
    selections?: any;
    payments?: any;
  };
}) {
  try {
    console.log('[ADMIN] Starting admin notification process...');
    console.log('[ADMIN] Admin notification data:', {
      user_id: adminData.user_id,
      purchase_type: adminData.purchase_type,
      purchase_data: adminData.purchase_data
    });

    console.log('[ADMIN] Calling admin notification endpoint:', `${process.env.NEXT_PUBLIC_API_URL}/api/admin/notify-purchase`);

    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/notify-purchase`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(adminData),
    });

    console.log('[ADMIN] Admin notification response status:', response.status);
    console.log('[ADMIN] Admin notification response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const errorData = await response.text();
      console.error('[ADMIN] Error sending admin notification:', errorData);
      console.error('[ADMIN] Admin notification failed with status:', response.status);
      return null;
    } else {
      const responseData = await response.json();
      console.log('[ADMIN] Admin notification sent successfully:', responseData);
      return responseData;
    }
  } catch (error) {
    console.error('[ADMIN] Failed to send admin notification:', error);
    console.error('[ADMIN] Admin notification request failed completely');
    return null;
  }
}

async function getAdminUsers() {
  try {
    console.log('[ADMIN] Fetching admin users...');
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/admin/users`);

    if (response.ok) {
      const adminData = await response.json();
      console.log('[ADMIN] Admin users found:', adminData);
      return adminData.admin_users || [];
    } else {
      console.error('[ADMIN] Failed to fetch admin users:', response.status);
      return [];
    }
  } catch (error) {
    console.error('[ADMIN] Error fetching admin users:', error);
    return [];
  }
}

/**
 * Captures a PayPal order and creates project resources after successful payment.
 * For subscription payments, checks if user is already subscribed and skips project creation if so.
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

      // Extract clerk ID from custom_id (format: "user_xxx..._timestamp")
      let extractedClerkId = '';
      if (customId.startsWith('user_')) {
        // Remove the trailing _digits (timestamp)
        extractedClerkId = customId.replace(/_[0-9]+$/, '');
      }
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

    // STEP 1: Save payment data to database (this will check subscription status internally)
    let saveResult = null;
    let isAlreadySubscribedFromSave = false;
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
        saveResult = await saveResponse.json();
        console.log("[DEBUG] SANDBOX payment saved successfully:", saveResult);

        // Check if the save-payment route indicates user is already subscribed
        if (saveResult.data?.is_already_subbed === true) {
          console.log("[DEBUG] Save-payment route indicates user is already subscribed");
          isAlreadySubscribedFromSave = true;
        }
      } else {
        console.error("[DEBUG] Failed to save SANDBOX payment data");
      }
    } catch (saveError) {
      console.error("[DEBUG] Error saving SANDBOX payment:", saveError);
    }

    // STEP 2: If user is already subscribed (from save-payment check), return early without creating projects
    if (isAlreadySubscribedFromSave) {
      console.log("[DEBUG] User already subscribed, skipping project creation");
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
        isAlreadySubscribed: true,
        projectCreated: false,
        slackCreated: false,
        message: "Payment processed successfully. User is already subscribed to this plan."
      });
    }

    // STEP 3: Create project resources only for new subscriptions or one-time payments
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
      sessionId: orderID
    });

    // Log Slack creation result
    if (slackResult) {
      console.log("[DEBUG] Slack channel created successfully:", slackResult.channelName);
    } else {
      console.log("[DEBUG] Slack channel creation failed - continuing with other processes");
    }

    // Get the best available clerk ID
    const finalClerkId = paymentDetails.clerkId ||
      clerkId ||
      request.headers.get("x-clerk-id") ||
      request.headers.get("authorization")?.replace("Bearer ", "") ||
      'anonymous';

    console.log("[DEBUG] Final clerk ID being used:", finalClerkId);

    // Send project information (proceed even if Slack fails)
    if (jiraResult) {
      await sendProjectInfo({
        clerk_id: finalClerkId,
        projectkey: jiraResult.projectKey,
        jiraurl: `https://pfa.atlassian.net/jira/software/projects/${jiraResult.projectKey}/boards`,
        slackurl: slackResult ? `https://slack.com/app_redirect?channel=${slackResult.channelName}` : 'Slack channel creation failed - please contact support'
      });
    }

    // STEP 4: Send email notification to client (proceed even if Slack fails)
    if (jiraResult) {
      console.log("[DEBUG] Sending welcome email to customer...");
      await sendEmailNotification({
        customerEmail: paymentDetails.customerEmail,
        customerName: paymentDetails.customerName,
        projectKey: jiraResult.projectKey,
        channelName: slackResult?.channelName || 'Slack channel creation failed',
        amount: paymentDetails.amount || "0",
        selectedServices: paymentDetails.selectedServices,
        isSubscription: paymentDetails.isSubscription,
        subscriptionName: subscriptionName
      });
    }

    // STEP 5: Send admin notification about the purchase
    console.log("[DEBUG] Sending admin notification...");
    try {
      // First, get the user by clerk_id to get the database user_id
      console.log("[DEBUG] Looking up user by clerk_id:", finalClerkId);
      const userLookupResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users?clerk_id=${finalClerkId}`);

      if (userLookupResponse.ok) {
        const userData = await userLookupResponse.json();
        console.log("[DEBUG] User lookup successful:", userData);

        if (userData.data && userData.data.user_id) {
          // Get admin users and log them
          const adminUsers = await getAdminUsers();
          console.log("[ADMIN] Admin users that will receive notification:", adminUsers.map((admin: any) => ({
            id: admin.id,
            email: admin.email,
            fullname: admin.fullname
          })));

          if (adminUsers.length === 0) {
            console.error("[ADMIN] No admin users found - admin notification will not be sent");
          } else {
            console.log("[ADMIN] Found", adminUsers.length, "admin users to notify");
          }

          // Prepare admin notification data with correct user_id
          const adminNotificationData = {
            user_id: userData.data.user_id, // Use the database user_id
            purchase_type: (paymentDetails.isSubscription ? 'subscription' : 'deliverable') as 'subscription' | 'deliverable',
            purchase_data: {
              payment: {
                orderId: paymentDetails.orderId,
                captureId: paymentDetails.captureId,
                amount: paymentDetails.amount,
                currency: paymentDetails.currency,
                status: paymentDetails.status,
                customerEmail: paymentDetails.customerEmail,
                customerName: paymentDetails.customerName,
                payment_method: 'PayPal',
                transaction_id: paymentDetails.captureId,
                payment_date: new Date().toISOString()
              },
              tier: paymentDetails.isSubscription ? {
                id: paymentDetails.subscriptionId,
                name: subscriptionName
              } : undefined,
              selections: !paymentDetails.isSubscription ? paymentDetails.selectedServices : undefined,
              payments: !paymentDetails.isSubscription ? [{
                orderId: paymentDetails.orderId,
                captureId: paymentDetails.captureId,
                amount: paymentDetails.amount,
                currency: paymentDetails.currency,
                payment_method: 'PayPal',
                transaction_id: paymentDetails.captureId,
                payment_date: new Date().toISOString(),
                status: paymentDetails.status
              }] : undefined
            }
          };

          console.log("[DEBUG] Admin notification data prepared:", adminNotificationData);
          await sendAdminNotification(adminNotificationData);
        } else {
          console.error("[DEBUG] User ID not found in user data for clerk_id:", finalClerkId);
          console.error("[DEBUG] User data structure:", userData);
        }
      } else {
        console.error("[DEBUG] Failed to lookup user by clerk_id:", finalClerkId);
        const errorText = await userLookupResponse.text();
        console.error("[DEBUG] User lookup error:", errorText);
      }
    } catch (adminError) {
      console.error("[DEBUG] Error sending admin notification:", adminError);
      // Don't fail the entire process if admin notification fails
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
      isAlreadySubscribed: false,
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