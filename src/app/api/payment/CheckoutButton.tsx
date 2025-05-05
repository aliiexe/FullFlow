"use client";

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY!);

interface CheckoutButtonProps {
  selectedServices: string[];
  totalPrice: number;
  disabled?: boolean;
}

export default function CheckoutButton({ 
  selectedServices, 
  totalPrice,
  disabled = false 
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    if (selectedServices.length === 0) {
      setError("Please select at least one service");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedServices }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        const stripe = await stripePromise;
        if (!stripe) throw new Error('Failed to load Stripe');
        
        const { error } = await stripe.redirectToCheckout({
          sessionId: data.id,
        });

        if (error) throw error;
      }
    } catch (err) {
      console.error('Checkout error:', err);
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 text-red-500 text-sm bg-red-100/10 p-3 rounded-md border border-red-500/20">
          {error}
        </div>
      )}
      
      <button
        onClick={handleCheckout}
        disabled={isLoading || disabled || selectedServices.length === 0}
        className={`w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-lg font-medium rounded-lg transition-all shadow-lg shadow-indigo-900/50 flex items-center justify-center
          ${(isLoading || disabled || selectedServices.length === 0) 
            ? 'opacity-70 cursor-not-allowed' 
            : 'hover:from-indigo-500 hover:to-indigo-600'}`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          <>
            Checkout ${totalPrice.toLocaleString()}
          </>
        )}
      </button>
    </div>
  );
}