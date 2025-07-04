import { NextRequest, NextResponse } from "next/server";

// Interfaces from Stripe API
interface Deliverable {
  id: string;
  service_category_id: string;
  name: string;
  description: string | null;
  price: number | null;
  is_active: boolean;
  complexity_level: string | null;
  created_at: string;
  updated_at: string;
  service_category: {
    id: string;
    name: string;
    base_id: string | null;
    created_at: string;
    updated_at: string;
    description: string | null;
    order_position: number | null;
  };
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface ProjectInfos {
  clerk_id: string;
  projectkey: string;
  jiraurl: string;
  slackurl: string;
}

// Project creation functions from Stripe API
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
      // We'll log the error but continue with checkout to not block payment flow
    } else {
      const data = await response.json();
      console.log('Jira project created successfully:', data);
      console.log(`Project Key: ${projectKey}, Company Name: ${companyName}`);
      return data;
    }
  } catch (error) {
    console.error('Failed to create Jira project:', error);
    // Log error but don't throw to prevent blocking the payment flow
  }
}

async function createSlackChannel(customerData: {
  customerEmail: string;
  customerName: string;
  sessionId: string;
}) {
  try {
    // Extract last 4 characters from session ID and convert to uppercase
    const sessionSuffix = customerData.sessionId.slice(-4).toLowerCase();
    
    // Create Slack channel name with PRJ prefix and session ID suffix
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
      // We'll log the error but continue with checkout to not block payment flow
    } else {
      const data = await response.json();
      console.log('Slack channel created successfully:', data);
      console.log(`Channel name: ${channelName}`);
      return data;
    }
  } catch (error) {
    console.error('Failed to create Slack channel:', error);
    // Log error but don't throw to prevent blocking the payment flow
  }
}

async function sendProjectInfo(data: ProjectInfos) {
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
    } else {
      const responseData = await response.json();
      console.log('Project information sent successfully:', responseData);
      return responseData;
    }
  } catch (error) {
    console.error('Failed to send project information:', error);
  }
}

/**
 * Creates a new PayPal order or subscription with integrated project creation.
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

    // Calculate the correct amount based on subscription or selected services
    let amount = "150.00"; // Default amount
    
    let selectedDeliverableNames: string[] = [];
    let selectedPlanName: string | null = null;

    if (isSubscription && subscriptionId) {
      // Fetch subscription details
      const subscriptionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription-tiers`);
      if (subscriptionResponse.ok) {
        const subscriptionPlans: SubscriptionPlan[] = await subscriptionResponse.json();
        const selectedPlan = subscriptionPlans.find(plan => plan.id === subscriptionId);
        if (selectedPlan) {
          amount = selectedPlan.price.toFixed(2);
          selectedPlanName = selectedPlan.name;
        } else {
          amount = "99.00";
        }
      } else {
        amount = "99.00";
      }
    } else if (selectedServices && Array.isArray(selectedServices) && selectedServices.length > 0) {
      // Calculate total from selected services and get deliverable names
      try {
        const deliverablesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/deliverables`);
        if (deliverablesResponse.ok) {
          const deliverables: Deliverable[] = await deliverablesResponse.json();
          let calculatedTotal = 0;
          selectedDeliverableNames = [];
          selectedServices.forEach((serviceId: string) => {
            const deliverable = deliverables.find(d => d.id === serviceId);
            if (deliverable) {
              calculatedTotal += (deliverable.price || 1500);
              selectedDeliverableNames.push(deliverable.name);
            }
          });
          if (calculatedTotal > 0) {
            amount = calculatedTotal.toFixed(2);
          }
        }
      } catch (error) {
        console.error("[DEBUG] Error calculating service prices:", error);
      }
    } else if (totalPrice && totalPrice > 0) {
      // Use provided total price
      amount = parseFloat(totalPrice).toFixed(2);
    }

    if (!amount || parseFloat(amount) <= 0) {
      console.error("[DEBUG] Invalid calculated amount:", amount);
      return NextResponse.json({ error: "Invalid payment amount" }, { status: 400 });
    }

    console.log("[DEBUG] Using amount:", amount);

    // Use a simple custom_id that's within PayPal's length limits
    const customId = `${clerkId || 'guest'}_${Date.now()}`;

    // Create order data - simplified and clean for SANDBOX
    const orderData = {
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: { currency_code: "USD", value: amount },
          description: isSubscription
            ? `Monthly Subscription - Full Flow (${customerEmail})`
            : `Services: ${selectedServices?.length || 0} items (${customerEmail})`,
          custom_id: customId,
          reference_id: Array.isArray(selectedServices) ? selectedServices.join(",") : "",
        },
      ],
      application_context: {
        brand_name: "Full Flow",
        shipping_preference: "NO_SHIPPING",
        user_action: "PAY_NOW",
        // Remove return_url and cancel_url to prevent about:blank issue
      },
    };

    console.log("[DEBUG] Creating PayPal SANDBOX order with data:", JSON.stringify(orderData, null, 2));
    
    // CREATE ORDER IN SANDBOX
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
      console.error("[DEBUG] PayPal SANDBOX order creation error:", errorText);
      throw new Error(`PayPal order creation failed: ${errorText}`);
    }

    const orderResult = await orderResponse.json();
    console.log("[DEBUG] PayPal SANDBOX order created successfully:", orderResult);

    // Validate the response has the required fields
    if (!orderResult.id) {
      throw new Error("PayPal order creation failed: No order ID returned");
    }

    // Create project resources after successful PayPal order creation
    const sessionSuffix = orderResult.id.slice(-4).toUpperCase();
    const projectKey = `PRJ${sessionSuffix}`;
    const channelName = `prj-${orderResult.id.slice(-4).toLowerCase()}`;

    console.log("[DEBUG] Creating project resources with:");
    console.log(`- Project Key: ${projectKey}`);
    console.log(`- Channel Name: ${channelName}`);

    // Create Jira project
    await createJiraProject({
      customerEmail,
      customerName: customerFullName || '',
      isSubscription: isSubscription || false,
      subscriptionId,
      selectedServices,
      sessionId: orderResult.id
    });

    // Create Slack channel
    await createSlackChannel({
      customerEmail,
      customerName: customerFullName || '',
      sessionId: orderResult.id
    });

    // Send project information
    await sendProjectInfo({
      clerk_id: clerkId || 'anonymous',
      projectkey: projectKey,
      jiraurl: `https://pfa.atlassian.net/jira/software/projects/${projectKey}/boards`,
      slackurl: `https://slack.com/app_redirect?channel=${channelName}`
    });

    console.log('[DEBUG] Customer Full Name:', customerFullName);
    console.log('[DEBUG] Customer Email:', customerEmail);
    console.log('[DEBUG] Clerk ID:', clerkId || 'Not provided');
    console.log('[DEBUG] Payment Mode:', isSubscription ? 'subscription' : 'payment');
    
    // When returning the order creation response, include these for later use if needed
    return NextResponse.json({
      id: orderResult.id,
      status: orderResult.status,
      links: orderResult.links,
      custom_id: customId,
      project_key: projectKey,
      channel_name: channelName,
      selected_deliverable_names: selectedDeliverableNames,
      subscription_tier_name: selectedPlanName,
    });

  } catch (error) {
    console.error("[DEBUG] PayPal create error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "An unknown error occurred" },
      { status: 500 }
    );
  }
}