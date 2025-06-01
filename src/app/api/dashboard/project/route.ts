import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

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
    
    const projectInfo = await projectInfoResponse.json();

    // Get subscription data if this customer has one
    let subscriptionData = null;
    
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
          currentPeriodStart: subscription.currentPeriodStart * 1000,
          currentPeriodEnd: subscription.currentPeriodEnd * 1000,
        };
      }
    }

    // If user has purchased one-time services, fetch those too
    let deliverables = [];
    
    // Get purchased deliverables from your database
    const deliverablesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/payments/deliverables/by-email/${encodeURIComponent(email)}`);
    
    if (deliverablesResponse.ok) {
      deliverables = await deliverablesResponse.json();
    }

    return NextResponse.json({
      email,
      projectKey: projectInfo.projectkey,
      jiraUrl: projectInfo.jiraurl,
      slackUrl: projectInfo.slackurl,
      subscription: subscriptionData,
      deliverables,
    });
    
  } catch (error) {
    console.error("Error retrieving project data:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}