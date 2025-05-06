"use client";

import React, { useState } from 'react';
import { loadStripe } from '@stripe/stripe-js';
import { Loader2 } from 'lucide-react';

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_SECRET_KEY!);

interface CheckoutButtonProps {
  selectedServices: string[];
  totalPrice: number;
  disabled?: boolean;
  subscriptionId?: string;
  isSubscription?: boolean;
}

export default function CheckoutButton({ 
  selectedServices, 
  totalPrice,
  disabled = false,
  subscriptionId = '',
  isSubscription = false
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullName,setFullName] = useState('');
  const [email, setEmail] = useState('');

  const handleCheckout = async () => {
    // For standard service purchases, validate services selection
    if (!isSubscription && selectedServices.length === 0) {
      setError("Please select at least one service");
      return;
    }
    
    // Email is required for all purchases
    if (!email) {
      setError("Please enter your email address");
      return;
    }
  
    setIsLoading(true);
    setError(null);
  
    try {
      const response = await fetch('/api/payment/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          selectedServices,
          customerEmail: email,
          customerFullName: fullName,
          subscriptionId,
          isSubscription
        }),
      });
  
      const data = await response.json();
  
      if (!response.ok) {
        throw new Error(data.error || 'Something went wrong');
      }
  
      if (data.url) {
        window.location.href = data.url;
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
      <input
        type="text"
        placeholder="Enter your full name"
        value={fullName}
        onChange={(e) => setFullName(e.target.value)}
        className="mb-4 w-full px-4 py-3 bg-white/[0.03] backdrop-blur-sm
                   text-white placeholder-gray-400
                   border border-white/10 rounded-lg 
                   focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                   focus:border-indigo-500/50 transition-all"
        required
      />
      <input
        type="email"
        placeholder="Enter your email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="mb-4 w-full px-4 py-3 bg-white/[0.03] backdrop-blur-sm
                   text-white placeholder-gray-400
                   border border-white/10 rounded-lg
                   focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                   focus:border-indigo-500/50 transition-all"
        required
      />
      {error && (
        <div className="mb-4 text-red-500 text-sm bg-red-100/10 p-3 rounded-md border border-red-500/20">
          {error}
        </div>
      )}
      <button
        onClick={handleCheckout}
        disabled={isLoading || disabled || !email || !fullName}
        className={`w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 
          text-white text-lg font-medium rounded-lg transition-all shadow-lg 
          shadow-indigo-900/50 flex items-center justify-center
          ${(isLoading || disabled || !email || !fullName) 
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
            {isSubscription ? 'Subscribe' : 'Checkout'} ${totalPrice.toLocaleString()}
          </>
        )}
      </button>
    </div>
  );
}