"use client";

import React from "react";
import { PayPalButtons, PayPalScriptProvider } from "@paypal/react-paypal-js";
// Import the client-side UserResource type instead of server User type
import { UserResource } from "@clerk/types";

export interface PayPalButtonsContainerProps {
  selectedServices: string[];
  totalPrice: number;
  disabled?: boolean;
  subscriptionId?: string;
  isSubscription?: boolean;
  clerkId?: string;
  user: UserResource; // Updated to use UserResource instead of User
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

  // Initial options for PayPal
  const initialOptions = {
    clientId:
      process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID ||
      "Aac4nJ2_mL1I4234hyKJo9O3Vs7rTdo0COz-J1CCVW6y35PmBucM-sSZl-ndsSUdqFLnI5ZjEhOeLE3S",
    currency: "USD",
    intent: "capture",
  };

  const createOrder = async () => {
    setIsLoading(true);
    setError(null);
    console.log("[DEBUG] Starting createOrder");
    try {
      console.log("[DEBUG] Sending order creation request with:", {
        selectedServices,
        customerFullName,
        customerEmail,
        isSubscription,
        totalPrice
      });
      const response = await fetch("/api/payment/create-paypal", {
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
      console.log("[DEBUG] Received response from create-paypal endpoint", response);
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
      return orderData.id;
    } catch (err) {
      console.error("[DEBUG] Order creation error:", err);
      setError(err instanceof Error ? err.message : "Failed to create order");
      return "";
    } finally {
      setIsLoading(false);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderID: data.orderID,
          isSubscription,
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
  };

  const onError = (err: any) => {
    console.error("[DEBUG] PayPal error:", err);
    setError("An error occurred with PayPal. Please try again.");
    setIsLoading(false);
  };

  return (
    <PayPalScriptProvider options={initialOptions}>
      <PayPalButtons
        style={{
          layout: "vertical",
          color: "blue",
          shape: "rect",
          label: "pay",
        }}
        disabled={disabled}
        forceReRender={[isSubscription, totalPrice, disabled]}
        createOrder={createOrder}
        onApprove={onApprove}
        onCancel={onCancel}
        onError={onError}
        onClick={(data, actions) => {
          console.log('[DEBUG] PayPal button clicked', data, actions);
          return actions.resolve();
        }}
        onInit={(data, actions) => {
          console.log('[DEBUG] PayPal button initialized', data, actions);
        }}
      />
    </PayPalScriptProvider>
  );
}
