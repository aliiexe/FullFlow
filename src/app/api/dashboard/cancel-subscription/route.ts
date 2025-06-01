import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';

if (!process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY) {
  throw new Error("Missing NEXT_PUBLIC_STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { subscriptionId, email } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { error: 'Subscription ID is required' },
        { status: 400 }
      );
    }

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Verify that this subscription belongs to this user
    const customers = await stripe.customers.list({
      email,
      limit: 1,
    });

    if (customers.data.length === 0) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    const customerSubscriptions = await stripe.subscriptions.list({
      customer: customers.data[0].id,
    });

    const subscription = customerSubscriptions.data.find(sub => sub.id === subscriptionId);

    if (!subscription) {
      return NextResponse.json(
        { error: 'Subscription not found or does not belong to this customer' },
        { status: 404 }
      );
    }

    // Cancel the subscription at the end of the current billing period
    const canceledSubscription = await stripe.subscriptions.update(
      subscriptionId,
      { cancel_at_period_end: true }
    );

    // Get updated subscription details for response
    const price = await stripe.prices.retrieve(
      canceledSubscription.items.data[0].price.id
    );

    const product = await stripe.products.retrieve(
      price.product as string
    );

    const updatedSubscription = {
      id: canceledSubscription.id,
      status: canceledSubscription.status,
      name: product.name,
      amount: (price.unit_amount || 0) / 100,
      currentPeriodStart: new Date(canceledSubscription.current_period_start * 1000).toISOString(),
      currentPeriodEnd: new Date(canceledSubscription.current_period_end * 1000).toISOString(),
      cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
    };

    return NextResponse.json({ 
      message: 'Subscription will be canceled at the end of the current billing period',
      subscription: updatedSubscription
    });
  } catch (error) {
    console.error("Error canceling subscription:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}