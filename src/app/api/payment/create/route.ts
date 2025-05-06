import Stripe from "stripe";
import { NextRequest, NextResponse } from "next/server";

// Define interfaces based on your API schema
interface Category {
  id: string;
  name: string;
  description: string | null;
  base_id: string | null;
  order_position: number | null;
  created_at: string;
  updated_at: string;
}

interface Deliverable {
  id: string;
  service_category_id: string;
  name: string;
  description: string | null;
  base_price: number | null;
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
  monthly_price: number;
  yearly_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

async function createJiraProject(customerData: {
  customerEmail: string;
  customerName: string;
  isSubscription: boolean;
  subscriptionId?: string;
  selectedServices?: string[];
  sessionId: string;
}) {
  try {
    // Extract last 4 characters from session ID
    const sessionSuffix = customerData.sessionId.slice(-4);
    
    // Create project key with PRJ prefix and session ID suffix
    const projectKey = `PRJ${sessionSuffix}`;
    
    // Create company name as "Project" plus the last 4 chars of session ID
    const companyName = `PROJECT ${sessionSuffix}`;
    
    const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/create-jira-project`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerEmail: customerData.customerEmail,
        customerName: customerData.customerName,
        companyName: companyName, // Add the custom company name
        projectKey: projectKey,   // Use the custom project key format
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

if (!process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY) {
  throw new Error("Missing NEXT_PUBLIC_STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { selectedServices, customerFullName, customerEmail, subscriptionId, isSubscription } = body;
    
    // Validate email for all requests
    if (!customerEmail) {
      return NextResponse.json(
        { error: "Customer email is required" },
        { status: 400 }
      );
    }
    
    let session;
    
    // Handle subscription checkout
    if (isSubscription && subscriptionId) {
      // Fetch subscription details from your API
      const subscriptionResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription-tiers`);
      if (!subscriptionResponse.ok) {
        throw new Error('Failed to fetch subscription plans');
      }
      const subscriptionPlans: SubscriptionPlan[] = await subscriptionResponse.json();
      
      // Find the selected subscription plan
      const selectedPlan = subscriptionPlans.find(plan => plan.id === subscriptionId);
      
      if (!selectedPlan) {
        throw new Error(`Subscription plan with ID ${subscriptionId} not found`);
      }
      
      // Create a subscription product in Stripe (or use existing one)
      const product = await stripe.products.create({
        name: selectedPlan.name,
        description: selectedPlan.description || `${selectedPlan.name} subscription`,
      });
      
      // Create a price for the subscription
      const price = await stripe.prices.create({
        product: product.id,
        unit_amount: selectedPlan.monthly_price * 100, // Convert to cents
        currency: 'usd',
        recurring: {
          interval: 'month',
        },
      });
      
      // Create the subscription checkout session
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: [
          {
            price: price.id,
            quantity: 1,
          },
        ],
        mode: "subscription",
        customer_email: customerEmail,
        success_url: `${request.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${request.nextUrl.origin}/cancel`,
        metadata: {
          customerFullName: customerFullName,
          subscriptionId: subscriptionId,
          isSubscription: 'true',
          customerEmail: customerEmail, // Add this line for redundancy
          planName: selectedPlan.name, // Optional: Add this for more context
          planPrice: selectedPlan.monthly_price.toString(), // Optional: Add this for more context
        },
      });
      // Create Jira project after successful checkout session creation
      await createJiraProject({
        customerEmail,
        customerName: customerFullName || '',
        isSubscription: true,
        subscriptionId,
        sessionId: session.id
      });
    } 
    // Handle one-time payment checkout
    else {
      if (!selectedServices || !Array.isArray(selectedServices) || selectedServices.length === 0) {
        return NextResponse.json(
          { error: "Invalid request: selectedServices is required" },
          { status: 400 }
        );
      }
      
      // Fetch deliverables from your API
      const deliverablesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/deliverables`);
      if (!deliverablesResponse.ok) {
        throw new Error('Failed to fetch deliverables');
      }
      const deliverables: Deliverable[] = await deliverablesResponse.json();
      
      // Create line items for each selected service
      let totalPrice = 0;
      const lineItems = selectedServices.map((serviceId: string) => {
        // Find the matching deliverable
        const deliverable = deliverables.find(d => d.id === serviceId);
        
        if (!deliverable) {
          throw new Error(`Deliverable with ID ${serviceId} not found`);
        }
        
        const price = (deliverable.base_price || 1500) * 100; // Convert to cents, use 1500 as fallback
        totalPrice += price;
        
        return {
          price_data: {
            currency: 'usd',
            product_data: {
              name: deliverable.name,
              description: deliverable.description || `Service: ${deliverable.name}`,
            },
            unit_amount: price,
          },
          quantity: 1,
        };
      });
      
      session = await stripe.checkout.sessions.create({
        payment_method_types: ["card"],
        line_items: lineItems,
        mode: "payment",
        customer_email: customerEmail,
        success_url: `${request.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${request.nextUrl.origin}/cancel`,
        metadata: {
          customerFullName: customerFullName,
          selectedServices: JSON.stringify(selectedServices).slice(0, 499),
          isSubscription: 'false',
          customerEmail: customerEmail, // Add this line for redundancy
          totalAmount: totalPrice.toString(), // Optional: Add this for more context
        },
      });

      // Create Jira project after successful checkout session creation
      await createJiraProject({
        customerEmail,
        customerName: customerFullName || '',
        isSubscription: false,
        selectedServices,
        sessionId: session.id
      });
    }

    console.log('Customer Full Name:', customerFullName);
    console.log('Customer Email:', customerEmail);
    console.log('Session Mode:', isSubscription ? 'subscription' : 'payment');
    
    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}