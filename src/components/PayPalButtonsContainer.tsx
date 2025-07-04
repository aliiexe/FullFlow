"use client";

import React from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
import { UserResource } from "@clerk/types";

export interface PayPalButtonsContainerProps {
  selectedServices: string[];
  totalPrice: number;
  disabled?: boolean;
  subscriptionId?: string;
  isSubscription?: boolean;
  clerkId?: string;
  user: UserResource;
  setIsLoading: (isLoading: boolean) => void;
  setError: (error: string | null) => void;
}

export default function PayPalButtonsContainer({
  selectedServices,
  totalPrice,
  disabled = false,
  subscriptionId = "",
  isSubscription = false,
  clerkId,
  user,
  setIsLoading,
  setError,
}: PayPalButtonsContainerProps) {
  // Access properties that are available on UserResource
  const customerEmail = user?.primaryEmailAddress?.emailAddress || "";
  const customerFullName =
    user?.fullName || `${user?.firstName || ""} ${user?.lastName || ""}`.trim();
  
  // Use the actual Clerk user ID instead of the prop
  const actualClerkId = user?.id || clerkId || "";

  // Initial options for PayPal - SANDBOX CONFIGURATION
  const initialOptions = {
    clientId: process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || "",
    currency: "USD",
    intent: "capture",
    components: "buttons",
    "enable-funding": "venmo,paylater",
    "disable-funding": "card",
    // IMPORTANT: This forces sandbox mode for testing
    "data-sdk-integration-source": "developer-studio",
    vault: false,
    // Add debug mode for testing
    debug: process.env.NODE_ENV === 'development'
  };

  const createOrder = async () => {
    console.log("[DEBUG] Starting createOrder");
    setError(null);
    
    try {
      console.log("[DEBUG] Sending order creation request with:", {
        selectedServices,
        customerFullName,
        customerEmail,
        isSubscription,
        subscriptionId,
        clerkId: actualClerkId,
        totalPrice
      });

      const response = await fetch("/api/payment/create-paypal", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-clerk-id": actualClerkId
        },
        body: JSON.stringify({
          selectedServices,
          customerFullName,
          customerEmail,
          subscriptionId,
          isSubscription,
          clerkId: actualClerkId,
          totalPrice
        }),
      });

      console.log("[DEBUG] Received response from create-paypal endpoint", response.status);
      
      if (!response.ok) {
        const errorData = await response.text();
        console.error("[DEBUG] Order creation failed:", errorData);
        throw new Error(errorData || "Failed to create PayPal order");
      }

      const orderData = await response.json();
      console.log("[DEBUG] PayPal order created successfully:", orderData);
      
      if (!orderData.id) {
        throw new Error("No order ID returned from PayPal");
      }

      console.log("[DEBUG] Returning order ID to PayPal SDK:", orderData.id);
      
      // Return just the order ID string - this is critical for PayPal SDK
      return orderData.id;
      
    } catch (err) {
      console.error("[DEBUG] Order creation error:", err);
      setError(err instanceof Error ? err.message : "Failed to create order");
      
      // Re-throw the error so PayPal SDK knows the order creation failed
      throw err;
    } finally {
      console.log("[DEBUG] Finished createOrder");
    }
  };

  const onApprove = async (data: any) => {
    setIsLoading(true);
    setError(null);
    console.log("[DEBUG] onApprove called with data:", data);
    try {
      console.log("[DEBUG] Sending capture request for orderID:", data.orderID);
      const captureResponse = await fetch("/api/payment/capture-paypal", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "x-clerk-id": clerkId || ""
        },
        body: JSON.stringify({
          orderID: data.orderID,
          isSubscription,
          subscriptionId,
        }),
      });
      console.log("[DEBUG] Received response from capture-paypal endpoint", captureResponse);
      if (!captureResponse.ok) {
        const errorText = await captureResponse.text();
        console.error("[DEBUG] Capture failed:", errorText);
        throw new Error(`Payment capture failed: ${errorText}`);
      }
      const captureResult = await captureResponse.json();
      console.log("[DEBUG] Payment captured successfully:", captureResult);
      setError(null);
      setTimeout(() => {
        const successUrl = `/success?order_id=${data.orderID}&amount=${captureResult.amount}&currency=${captureResult.currency}`;
        console.log("[DEBUG] Redirecting to success page:", successUrl);
        window.location.href = successUrl;
      }, 1000);
    } catch (err) {
      console.error("[DEBUG] Payment approval error:", err);
      setError(
        err instanceof Error ? err.message : "Payment processing failed"
      );
      setIsLoading(false);
    } finally {
      console.log("[DEBUG] Finished onApprove");
    }
  };

  const onCancel = (data: any) => {
    console.log("[DEBUG] Payment cancelled by user:", data);
    setError("Payment was cancelled. Please try again.");
    setIsLoading(false);
    
    // Redirect to cancel page
    window.location.href = "/cancel?source=paypal&reason=user_cancelled";
  };

  const onError = (err: any) => {
    console.error("[DEBUG] PayPal error:", err);
    setError("An error occurred with PayPal. Please try again.");
    setIsLoading(false);
  };

  // Validate required props
  if (!customerEmail) {
    return (
      <div className="text-red-400 text-sm">
        Customer email is required for PayPal payments
      </div>
    );
  }

  if (!actualClerkId) {
    return (
      <div className="text-red-400 text-sm">
        User authentication required for PayPal payments
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
    <div className="paypal-container">
      {/* Add a notice for sandbox testing */}
      {process.env.NODE_ENV === 'development' && (
        <div className="bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-3 rounded-lg mb-4 text-sm">
          <strong>Sandbox Mode:</strong> Use test PayPal accounts for testing. No real money will be charged.
          <br />
          <strong>Test Buyer Account:</strong> Use any PayPal sandbox buyer account or create one at developer.paypal.com
        </div>
      )}
      
      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtons
          style={{
            layout: "vertical",
            color: "blue",
            shape: "rect",
            label: "pay",
            height: 50
          }}
          disabled={disabled}
          forceReRender={[isSubscription, totalPrice, disabled, selectedServices]}
          createOrder={createOrder}
          onApprove={onApprove}
          onCancel={onCancel}
          onError={onError}
          onClick={(data, actions) => {
            console.log('[DEBUG] PayPal button clicked', data);
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
            return actions.resolve();
          }}
          onInit={(data, actions) => {
            console.log('[DEBUG] PayPal button initialized', data);
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}