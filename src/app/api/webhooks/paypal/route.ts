import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  console.log('🔍 PAYPAL WEBHOOK: Received webhook request');
  
  try {
    const rawBody = await req.text();
    console.log('🔍 PAYPAL WEBHOOK: Raw body length:', rawBody.length);
    console.log('🔍 PAYPAL WEBHOOK: Raw body preview:', rawBody.substring(0, 100) + '...');
    
    // Verify webhook (PayPal uses a different verification approach than Stripe)
    const eventBody = JSON.parse(rawBody);
    const webhookId = process.env.PAYPAL_WEBHOOK_ID;
    
    // Get PayPal access token
    const authResponse = await fetch("https://api-m.sandbox.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Authorization": `Basic ${Buffer.from(`${process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID}:${process.env.PAYPAL_SECRET}`).toString('base64')}`,
      },
      body: "grant_type=client_credentials",
    });
    
    const { access_token } = await authResponse.json();
    
    // Verify webhook signature
    const verifyResponse = await fetch("https://api-m.sandbox.paypal.com/v1/notifications/verify-webhook-signature", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${access_token}`,
      },
      body: JSON.stringify({
        auth_algo: req.headers.get('paypal-auth-algo'),
        cert_url: req.headers.get('paypal-cert-url'),
        transmission_id: req.headers.get('paypal-transmission-id'),
        transmission_sig: req.headers.get('paypal-transmission-sig'),
        transmission_time: req.headers.get('paypal-transmission-time'),
        webhook_id: webhookId,
        webhook_event: eventBody
      }),
    });
    
    const verificationData = await verifyResponse.json();
    
    if (verificationData.verification_status !== 'SUCCESS') {
      return NextResponse.json(
        { error: 'Webhook signature verification failed' },
        { status: 400 }
      );
    }
    
    // Handle different webhook event types
    const event = eventBody;
    console.log('🔍 PAYPAL WEBHOOK: Event type:', event.event_type);
    
    // Handle payment capture completed
    if (event.event_type === 'PAYMENT.CAPTURE.COMPLETED') {
      console.log('🔍 PAYPAL WEBHOOK: Processing payment capture completed');
      // Handle one-time payment completion logic
      // You'll need custom fields in the payment to differentiate between one-time and subscription
    }
    
    // Handle subscription activated
    else if (event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      console.log('🔍 PAYPAL WEBHOOK: Processing subscription activated');
      // Handle subscription activation
    }
    
    // Handle subscription cancelled
    else if (event.event_type === 'BILLING.SUBSCRIPTION.CANCELLED') {
      console.log('🔍 PAYPAL WEBHOOK: Processing subscription cancelled');
      // Handle subscription cancellation
    }
    
    // Return a 200 response to acknowledge receipt of the event
    return NextResponse.json({ received: true });
  } catch (err) {
    console.error('🔍 PAYPAL WEBHOOK ERROR:', err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Unknown error' },
      { status: 500 }
    );
  }
}