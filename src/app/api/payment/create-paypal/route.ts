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

/**
 * Creates a new PayPal order or subscription.
 * Project creation will happen after payment capture.
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

    // Ensure reference_id always has a valid value
    let referenceId = "";
    if (isSubscription && subscriptionId) {
      referenceId = `subscription_${subscriptionId}`;
    } else if (selectedServices && Array.isArray(selectedServices) && selectedServices.length > 0) {
      referenceId = selectedServices.join(",");
    } else {
      referenceId = "default_purchase";
    }

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
          reference_id: referenceId,
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

    console.log('[DEBUG] Customer Full Name:', customerFullName);
    console.log('[DEBUG] Customer Email:', customerEmail);
    console.log('[DEBUG] Clerk ID:', clerkId || 'Not provided');
    console.log('[DEBUG] Payment Mode:', isSubscription ? 'subscription' : 'payment');

    // Return only the order creation response - project creation will happen after payment capture
    return NextResponse.json({
      id: orderResult.id,
      status: orderResult.status,
      links: orderResult.links,
      custom_id: customId,
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