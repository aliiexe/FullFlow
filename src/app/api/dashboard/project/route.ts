import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

// Add interfaces based on your project structure
interface ProjectInfo {
  email: string;
  projectkey: string; // Note: This matches the casing in your database
  jiraurl: string;    // Note: This matches the casing in your database
  slackurl: string;   // Note: This matches the casing in your database
}

interface Subscription {
  id: string;
  status: string;
  name: string;
  amount: number;
  currentPeriodStart: number;
  currentPeriodEnd: number;
  current_period_start?: number; // Add these to match Stripe API fields
  current_period_end?: number;
}

interface Deliverable {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  service_category: {
    id: string;
    name: string;
  };
}

interface DashboardResponse {
  email: string;
  projectKey: string;   // Note: Converting to camelCase for frontend
  jiraUrl: string;      // Note: Converting to camelCase for frontend
  slackUrl: string;     // Note: Converting to camelCase for frontend
  subscription: Subscription | null;
  deliverables: Deliverable[];
}

if (!process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY) {
  throw new Error("Missing NEXT_PUBLIC_STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json(
        { error: 'Email parameter is required' },
        { status: 400 }
      );
    }

    // Fetch project information from your database
    const projectInfoResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/project-infos/by-email/${encodeURIComponent(email)}`);
    
    if (!projectInfoResponse.ok) {
      return NextResponse.json(
        { error: 'Project information not found' },
        { status: 404 }
      );
    }
    
    let projectInfo: ProjectInfo;
    try {
      const data = await projectInfoResponse.json();
      
      // Validate required fields are present
      if (!data.email || !data.projectkey || !data.jiraurl || !data.slackurl) {
        console.warn('Project info is missing required fields:', data);
      }
      
      projectInfo = {
        email: data.email || '',
        projectkey: data.projectkey || '',
        jiraurl: data.jiraurl || '',
        slackurl: data.slackurl || ''
      };
    } catch (error) {
      return NextResponse.json(
        { error: 'Failed to parse project information' },
        { status: 500 }
      );
    }

    // Get subscription data if this customer has one
    let subscriptionData: Subscription | null = null;
    
    // Find customer in Stripe
    const customers = await stripe.customers.list({
      email: email,
      limit: 1,
    });
    
    if (customers.data.length > 0) {
      // Check if customer has any active subscriptions
      const subscriptions = await stripe.subscriptions.list({
        customer: customers.data[0].id,
        status: 'all',
        limit: 1,
      });
      
      if (subscriptions.data.length > 0) {
        const subscription = subscriptions.data[0];
        
        // Get the product details for the subscription
        const price = await stripe.prices.retrieve(
          subscription.items.data[0].price.id
        );
        
        const product = await stripe.products.retrieve(
          price.product as string
        );
        
        subscriptionData = {
          id: subscription.id,
          status: subscription.status,
          name: product.name,
          amount: (price.unit_amount || 0) / 100,
          // Fix: Using bracket notation to access properties with Stripe SDK
          currentPeriodStart: subscription['current_period_start'] * 1000,
          currentPeriodEnd: subscription['current_period_end'] * 1000,
        };
      }
    }

    // If user has purchased one-time services, fetch those too
    let deliverables: Deliverable[] = [];
    
    // Get purchased deliverables from your database
    const deliverablesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/deliverables/by-email/${encodeURIComponent(email)}`);
    
    if (deliverablesResponse.ok) {
      deliverables = await deliverablesResponse.json();
    }

    // Creating a well-typed response object
    const response: DashboardResponse = {
      email,
      projectKey: projectInfo.projectkey, // Converting to camelCase for frontend
      jiraUrl: projectInfo.jiraurl,       // Converting to camelCase for frontend
      slackUrl: projectInfo.slackurl,     // Converting to camelCase for frontend
      subscription: subscriptionData,
      deliverables,
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error("Error retrieving project data:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}