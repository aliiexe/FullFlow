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



if (!process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY) {
  throw new Error("Missing NEXT_PUBLIC_STRIPE_SECRET_KEY environment variable");
}

const stripe = new Stripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY);

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { selectedServices, customerEmail } = body;
    
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
    const lineItems = selectedServices.map((serviceId: string) => {
      // Find the matching deliverable
      const deliverable = deliverables.find(d => d.id === serviceId);
      
      if (!deliverable) {
        throw new Error(`Deliverable with ID ${serviceId} not found`);
      }
      
      return {
        price_data: {
          currency: 'usd',
          product_data: {
            name: deliverable.name,
            description: deliverable.description || `Service: ${deliverable.name}`,
          },
          unit_amount: (deliverable.base_price || 1500) * 100, // Convert to cents, use 1500 as fallback
        },
        quantity: 1,
      };
    });
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: lineItems,
      mode: "payment",
      customer_email: customerEmail,
      success_url: `${request.nextUrl.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${request.nextUrl.origin}/cancel`,
      metadata: {
        selectedServices: JSON.stringify(selectedServices).slice(0, 499),
      },
    });

    console.log('Customer Email:', customerEmail);
    
    return NextResponse.json({ id: session.id, url: session.url });
  } catch (error) {
    console.error('Checkout error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}