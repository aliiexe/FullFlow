"use client";

import React, { useState } from "react";
import { Loader2 } from "lucide-react";
import { useAuth, useUser } from "@clerk/nextjs";

interface CheckoutButtonProps {
  selectedServices: string[];
  totalPrice: number;
  disabled?: boolean;
  subscriptionId?: string;
  isSubscription?: boolean;
  clerkId: string;
}

export default function CheckoutButton({
  selectedServices,
  totalPrice,
  disabled = false,
  subscriptionId = "",
  isSubscription = false,
  clerkId,
}: CheckoutButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Get user data from Clerk
  const { isSignedIn } = useAuth();
  const { user } = useUser();

  // Function to create checkout session
  const handleCheckout = async () => {
    if (!isSignedIn || !user) {
      setError("You must be signed in to checkout");
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Get user information from Clerk
      const customerEmail = user.primaryEmailAddress?.emailAddress || "";
      const customerFullName =
        user.fullName ||
        `${user.firstName || ""} ${user.lastName || ""}`.trim();

      if (!customerEmail) {
        setError(
          "Unable to retrieve your email address. Please sign in again."
        );
        setIsLoading(false);
        return;
      }

      // Use a relative URL for local development
      const response = await fetch("/api/payment/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedServices,
          customerFullName,
          customerEmail,
          subscriptionId,
          isSubscription,
          clerkId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(errorData || "Failed to create checkout session");
      }

      const { url } = await response.json();

      // Redirect to Stripe checkout
      window.location.href = url;
    } catch (err) {
      console.error("Checkout error:", err);
      setError(
        err instanceof Error ? err.message : "An error occurred during checkout"
      );
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      <button
        onClick={handleCheckout}
        disabled={isLoading || disabled || !isSignedIn}
        className={`w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 
          text-white text-lg font-medium rounded-lg transition-all shadow-lg 
          shadow-indigo-900/50 flex items-center justify-center
          ${
            isLoading || disabled || !isSignedIn
              ? "opacity-70 cursor-not-allowed"
              : "hover:from-indigo-500 hover:to-indigo-600"
          }`}
      >
        {isLoading ? (
          <>
            <Loader2 className="w-5 h-5 mr-2 animate-spin" /> Processing...
          </>
        ) : isSubscription ? (
          `Subscribe for $${totalPrice}/month`
        ) : (
          `Checkout $${totalPrice.toLocaleString()}`
        )}
      </button>
    </div>
  );
}
