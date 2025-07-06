"use client";

import React from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { UserResource } from "@clerk/types";

export interface PayPalCancellationButtonsContainerProps {
  totalPrice: number;
  subscriptionId: string;
  monthsToPay: number;
  clerkId: string;
  user: UserResource;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
  onPaymentSuccess?: () => void;
}

export default function PayPalCancellationButtonsContainer({
  totalPrice,
  subscriptionId,
  monthsToPay,
  clerkId,
  user,
  setIsLoading,
  setError,
  onPaymentSuccess
}: PayPalCancellationButtonsContainerProps) {
  // Access properties that are available on UserResource
  const customerEmail = user?.primaryEmailAddress?.emailAddress || "";
  const customerFullName =
    user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  
  // Use the actual Clerk user ID
  const actualClerkId = user?.id || clerkId || "";

  // Initial options for PayPal - SANDBOX CONFIGURATION
  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
    currency: "USD",
    intent: "capture",
    components: "buttons",
    "enable-funding": "venmo,paylater",
    "disable-funding": "card",
    vault: false,
    debug: process.env.NODE_ENV === 'development'
  };

  const createOrder = async () => {
    console.log("[DEBUG] Starting createOrder for cancellation");
    setError(null);
    
    try {
      console.log("[DEBUG] Sending cancellation order creation request with:", {
        customerFullName,
        customerEmail,
        clerkId: actualClerkId,
        totalPrice,
        subscriptionId,
        monthsToPay
      });

      const response = await fetch("/api/payment/create-paypal-cancellation", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-clerk-id": actualClerkId
        },
        body: JSON.stringify({
          customerFullName,
          customerEmail,
          clerkId: actualClerkId,
          totalPrice,
          subscriptionId,
          monthsToPay
        }),
      });

      console.log("[DEBUG] Received response from create-paypal-cancellation endpoint", response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("[DEBUG] Cancellation order creation failed:", errorData);
        throw new Error(errorData || "Failed to create PayPal cancellation order");
      }

      const orderData = await response.json();
      console.log("[DEBUG] PayPal cancellation order created successfully:", orderData);
      
      if (!orderData.id) {
        throw new Error("No order ID returned from PayPal");
      }

      console.log("[DEBUG] Returning cancellation order ID to PayPal SDK:", orderData.id);
      
      return orderData.id;
      
    } catch (err) {
      console.error("[DEBUG] Cancellation order creation error:", err);
      setError(err instanceof Error ? err.message : "Failed to create cancellation order");
      throw err;
    }
  };

  const onApprove = async (data: any) => {
    setIsLoading(true);
    setError(null);
    console.log("[DEBUG] onApprove called for cancellation with data:", data);
    
    try {
      console.log("[DEBUG] Sending cancellation capture request for orderID:", data.orderID);
      const captureResponse = await fetch("/api/payment/capture-paypal-cancellation", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-clerk-id": actualClerkId
        },
        body: JSON.stringify({
          orderID: data.orderID,
          subscriptionId,
          clerkId: actualClerkId,
          monthsToPay
        }),
      });

      if (!captureResponse.ok) {
        const errorData = await captureResponse.json();
        throw new Error(errorData.error || `Failed to capture payment: ${captureResponse.status}`);
      }

      const result = await captureResponse.json();
      console.log("[DEBUG] Capture successful:", result);
      if (onPaymentSuccess) {
        onPaymentSuccess();
      }
    } catch (error) {
      console.error("[DEBUG] Error capturing payment:", error);
      setError(error instanceof Error ? error.message : "Failed to process payment");
    } finally {
      setIsLoading(false);
    }
  };

  const onCancel = (data: any) => {
    console.log("[DEBUG] Cancellation payment cancelled by user:", data);
    setError("Cancellation payment was cancelled. Please try again.");
    setIsLoading(false);
  };

  const onError = (err: any) => {
    console.error("[DEBUG] PayPal cancellation error:", err);
    setError("An error occurred with PayPal cancellation payment. Please try again.");
    setIsLoading(false);
  };

  // Validate required props
  if (!customerEmail) {
    return (
      <div className="text-red-400 text-sm">
        Customer email is required for cancellation payment
      </div>
    );
  }

  if (!actualClerkId) {
    return (
      <div className="text-red-400 text-sm">
        User authentication required for cancellation payment
      </div>
    );
  }

  if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID) {
    return (
      <div className="text-red-400 text-sm">
        PayPal configuration error. Please contact support.
      </div>
    );
  }

  return (
    <div className="paypal-cancellation-container">
      {/* Add a notice for cancellation payment */}
      <div className="bg-amber-500/10 border border-amber-500/30 text-amber-400 px-4 py-3 rounded-lg mb-4 text-sm">
        <strong>Cancellation Payment:</strong> You are paying for {monthsToPay} remaining months (${totalPrice}) to cancel your subscription.
        {process.env.NODE_ENV === 'development' && (
          <>
            <br />
            <strong>Sandbox Mode:</strong> Use test PayPal accounts for testing.
          </>
        )}
      </div>
      
      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons
          style={{
            layout: "vertical",
            color: "gold",
            shape: "rect",
            label: "pay",
            height: 50
          }}
          forceReRender={[totalPrice, subscriptionId, monthsToPay]}
          createOrder={createOrder}
          onApprove={onApprove}
          onCancel={onCancel}
          onError={onError}
          onClick={(data, actions) => {
            console.log('[DEBUG] PayPal cancellation button clicked', data);
            // Validate before allowing payment
            if (!customerEmail) {
              setError("Customer email is required");
              return actions.reject();
            }
            if (!totalPrice || totalPrice <= 0) {
              setError("Invalid payment amount");
              return actions.reject();
            }
            if (!actualClerkId) {
              setError("User authentication required");
              return actions.reject();
            }
            if (!subscriptionId) {
              setError("Subscription ID is required");
              return actions.reject();
            }
            return actions.resolve();
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}