"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";

// Import PayPal components with dynamic import to avoid SSR issues
import dynamic from "next/dynamic";

// Dynamically import the PayPalButtonsContainer with SSR disabled
const PayPalButtonsContainer = dynamic(
  () => import("./PayPalButtonsContainer"),
  { ssr: false }
);

interface PayPalButtonProps {
  selectedServices: string[];
  totalPrice: number;
  disabled?: boolean;
  subscriptionId?: string;
  isSubscription?: boolean;
  clerkId: string;
}

export default function PayPalButton({
  selectedServices,
  totalPrice,
  disabled = false,
  subscriptionId = "",
  isSubscription = false,
  clerkId,
}: PayPalButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { isSignedIn } = useAuth();
  const { user } = useUser();

  if (!isSignedIn || !user) {
    return (
      <div className="text-red-400 text-sm">
        You must be signed in to checkout
      </div>
    );
  }

  // Validate PayPal configuration
  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    return (
      <div className="text-red-400 text-sm">
        PayPal is not configured. Please contact support.
      </div>
    );
  }

  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {isLoading ? (
        <button
          disabled
          className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 
            opacity-70 cursor-not-allowed text-white text-lg font-medium rounded-lg 
            flex items-center justify-center"
        >
          <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
        </button>
      ) : (
        <PayPalButtonsContainer
          selectedServices={selectedServices}
          totalPrice={totalPrice}
          disabled={disabled}
          subscriptionId={subscriptionId}
          isSubscription={isSubscription}
          clerkId={clerkId}
          user={user}
          setIsLoading={setIsLoading}
          setError={setError}
        />
      )}
    </div>
  );
}