import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { headers } from 'next/headers';

console.log('🔍 WEBHOOK: Module loaded');

if (!process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY) {
  console.error('🔍 WEBHOOK ERROR: Missing STRIPE_SECRET_KEY');
  throw new Error("Missing NEXT_PUBLIC_STRIPE_SECRET_KEY environment variable");
}

if (!process.env.STRIPE_WEBHOOK_SECRET) {
  console.warn('🔍 WEBHOOK WARNING: Missing STRIPE_WEBHOOK_SECRET');
}

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
console.log('🔍 WEBHOOK: Initialized Stripe with webhook secret:', webhookSecret ? 'Present' : 'Missing');

// This is necessary to properly parse the raw body for signature verification
export const config = {
  api: {
    bodyParser: false,
  },
};

// Store logs for debugging - add at top of file
let debugLogs: string[] = [];
function logDebug(message: string, data?: any) {
  const timestamp = new Date().toISOString();
  const logEntry = `${timestamp} - ${message} ${data ? JSON.stringify(data) : ''}`;
  debugLogs.push(logEntry);
  console.log(logEntry);
}

// Add GET method to check logs and confirm endpoint is working
export async function GET(req: NextRequest) {
  logDebug("GET request received to webhook endpoint");
  return NextResponse.json({ 
    message: "Webhook endpoint is accessible",
    logs: debugLogs.slice(-50) // Return last 50 logs
  });
}

export async function POST(req: NextRequest) {
  console.log('🔍 WEBHOOK: Received webhook request');
  console.log('🔍 WEBHOOK: Request URL:', req.url);
  console.log('🔍 WEBHOOK: Request method:', req.method);
  
  // Log all request headers
  const headerEntries = Array.from(req.headers.entries());
  console.log('🔍 WEBHOOK: Request headers:', Object.fromEntries(headerEntries));
  
  try {
    // Get headers and signature
    const signature = req.headers.get('stripe-signature');
    console.log('🔍 WEBHOOK: Stripe signature present:', !!signature);

    if (!signature) {
      console.error('🔍 WEBHOOK ERROR: No Stripe signature found in request headers');
      return NextResponse.json({ error: 'No signature' }, { status: 400 });
    }

    if (!webhookSecret) {
      console.error('🔍 WEBHOOK ERROR: Webhook secret is not defined in environment variables');
      return NextResponse.json({ error: 'Webhook secret missing' }, { status: 500 });
    }

    // Get the raw body as text for signature verification
    console.log('🔍 WEBHOOK: Reading request body...');
    const rawBody = await req.text();
    console.log('🔍 WEBHOOK: Raw body length:', rawBody.length);
    console.log('🔍 WEBHOOK: Raw body preview:', rawBody.substring(0, 100) + '...');
    
    let event: Stripe.Event;
    
    try {
      console.log('🔍 WEBHOOK: Attempting to verify signature and construct event...');
      event = stripe.webhooks.constructEvent(
        rawBody,
        signature,
        webhookSecret
      );
      console.log('🔍 WEBHOOK: Event constructed successfully:', event.id);
    } catch (err) {
      console.error('🔍 WEBHOOK ERROR: Webhook signature verification failed:', err);
      return NextResponse.json(
        { error: `Webhook signature verification failed` },
        { status: 400 }
      );
    }

    console.log('🔍 WEBHOOK SUCCESS: Verified signature for event:', event.type);
    console.log('🔍 WEBHOOK: Event ID:', event.id);
    console.log('🔍 WEBHOOK: Event created time:', new Date(event.created * 1000).toISOString());
    console.log('🔍 WEBHOOK: Event data:', JSON.stringify(event.data).substring(0, 500) + '...');

    // Handle the checkout.session.completed event
    if (event.type === 'checkout.session.completed') {
      console.log('🔍 WEBHOOK: Processing checkout.session.completed event');
      const session = event.data.object as Stripe.Checkout.Session;
      console.log('🔍 WEBHOOK: Session ID:', session.id);
      console.log('🔍 WEBHOOK: Customer email:', session.customer_email);
      console.log('🔍 WEBHOOK: Session metadata:', session.metadata);
      console.log('🔍 WEBHOOK: Session amount:', session.amount_total);
      
      try {
        // Process the payment data
        console.log('🔍 WEBHOOK: Calling handleCompletedCheckout function...');
        await handleCompletedCheckout(session);
        console.log('🔍 WEBHOOK SUCCESS: Payment processed successfully for session:', session.id);
      } catch (error) {
        console.error('🔍 WEBHOOK ERROR: Error processing payment data:', error);
        console.error('🔍 WEBHOOK ERROR: Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
        // We don't return an error response here to prevent Stripe retries
        // Instead, log the error and return 200 OK
      }
    } else {
      console.log('🔍 WEBHOOK: Ignoring non-checkout event:', event.type);
    }

    // Return a 200 response to acknowledge receipt of the event
    console.log('🔍 WEBHOOK: Returning success response');
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('🔍 WEBHOOK ERROR: Unhandled webhook error:', error);
    console.error('🔍 WEBHOOK ERROR: Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    );
  }
}

async function handleCompletedCheckout(session: Stripe.Checkout.Session) {
  console.log('🔍 PAYMENT HANDLER: Starting payment processing');
  console.log('🔍 PAYMENT HANDLER: Full session object:', JSON.stringify(session).substring(0, 1000) + '...');
  
  // Extract relevant data from session
  const isSubscription = session.metadata?.isSubscription === 'true';
  const customerEmail = session.customer_email;
  const customerName = session.metadata?.customerFullName || '';
  const amount = session.amount_total ? session.amount_total / 100 : 0;
  const transactionId = session.payment_intent || session.id;
  
  console.log('🔍 PAYMENT HANDLER: Extracted data:', {
    isSubscription,
    customerEmail,
    customerName,
    amount,
    transactionId,
    metadata: session.metadata
  });
  
  // Verify environment variables
  console.log('🔍 PAYMENT HANDLER: Environment variables:');
  console.log('🔍 PAYMENT HANDLER: NEXT_PUBLIC_API_URL =', process.env.NEXT_PUBLIC_API_URL);
  
  // Determine which API endpoint to call based on payment type
  if (isSubscription) {
    console.log('🔍 PAYMENT HANDLER: Processing subscription payment');
    // Handle subscription payment
    const subscriptionId = session.metadata?.subscriptionId;
    
    if (!subscriptionId) {
      console.error('🔍 PAYMENT HANDLER ERROR: Missing subscriptionId in session metadata');
      throw new Error('Missing subscriptionId in session metadata');
    }
    
    const paymentData = {
      email: customerEmail,
      fullname: customerName,
      amount: amount,
      payment_method: 'Stripe',
      transaction_id: transactionId,
      subscription_id: subscriptionId
    };
    
    console.log('🔍 PAYMENT HANDLER: Subscription payment data:', paymentData);
    
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/payments/subscription`;
    console.log('🔍 PAYMENT HANDLER: Making API request to:', apiUrl);
    
    try {
      console.log('🔍 PAYMENT HANDLER: Sending subscription payment data...');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      console.log('🔍 PAYMENT HANDLER: API response status:', response.status);
      console.log('🔍 PAYMENT HANDLER: API response status text:', response.statusText);
      
      // Log response headers
      const responseHeaders = Object.fromEntries(response.headers.entries());
      console.log('🔍 PAYMENT HANDLER: API response headers:', responseHeaders);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('🔍 PAYMENT HANDLER ERROR: API error response:', errorData);
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData}`);
      }
      
      const responseData = await response.json();
      console.log('🔍 PAYMENT HANDLER SUCCESS: API response data:', responseData);
      return responseData;
    } catch (error) {
      console.error('🔍 PAYMENT HANDLER ERROR: Failed to send subscription payment data:', error);
      console.error('🔍 PAYMENT HANDLER ERROR: Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  } else {
    console.log('🔍 PAYMENT HANDLER: Processing one-time payment for deliverables');
    // Handle one-time payment for deliverables
    const selectedServicesJson = session.metadata?.selectedServices;
    
    if (!selectedServicesJson) {
      console.error('🔍 PAYMENT HANDLER ERROR: Missing selectedServices in session metadata');
      throw new Error('Missing selectedServices in session metadata');
    }
    
    let deliverableIds: string[];
    try {
      console.log('🔍 PAYMENT HANDLER: Parsing selectedServices JSON:', selectedServicesJson);
      deliverableIds = JSON.parse(selectedServicesJson);
      console.log('🔍 PAYMENT HANDLER: Parsed deliverable IDs:', deliverableIds);
    } catch (e) {
      console.error('🔍 PAYMENT HANDLER ERROR: Failed to parse selectedServices JSON:', e);
      throw new Error(`Failed to parse selectedServices JSON: ${e}`);
    }
    
    const paymentData = {
      email: customerEmail,
      fullname: customerName,
      payment_method: 'Stripe',
      transaction_id: transactionId,
      deliverable_ids: deliverableIds
    };
    
    console.log('🔍 PAYMENT HANDLER: Deliverable payment data:', paymentData);
    
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/payments/deliverables`;
    console.log('🔍 PAYMENT HANDLER: Making API request to:', apiUrl);
    
    try {
      console.log('🔍 PAYMENT HANDLER: Sending deliverable payment data...');
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(paymentData),
      });
      
      console.log('🔍 PAYMENT HANDLER: API response status:', response.status);
      console.log('🔍 PAYMENT HANDLER: API response status text:', response.statusText);
      
      // Log response headers
      const responseHeaders = Object.fromEntries(response.headers.entries());
      console.log('🔍 PAYMENT HANDLER: API response headers:', responseHeaders);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error('🔍 PAYMENT HANDLER ERROR: API error response:', errorData);
        throw new Error(`API error: ${response.status} ${response.statusText} - ${errorData}`);
      }
      
      const responseData = await response.json();
      console.log('🔍 PAYMENT HANDLER SUCCESS: API response data:', responseData);
      return responseData;
    } catch (error) {
      console.error('🔍 PAYMENT HANDLER ERROR: Failed to send deliverable payment data:', error);
      console.error('🔍 PAYMENT HANDLER ERROR: Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      throw error;
    }
  }
}