"use client";

import React from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

interface PayPalButtonsContainerProps {
  selectedServices: string[];
  totalPrice: number;
  disabled?: boolean;
  subscriptionId?: string;
  isSubscription?: boolean;
  clerkId: string;
  user: any;
  setIsLoading: (value: boolean) => void;
  setError: (value: string | null) => void;
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
  const customerEmail = user.primaryEmailAddress?.emailAddress || "";
  const customerFullName =
    user.fullName || `${user.firstName || ""} ${user.lastName || ""}`.trim();

  // Initial options for PayPal
  const initialOptions = {
    "client-id":
      "Aac4nJ2_mL1I4234hyKJo9O3Vs7rTdo0COz-J1CCVW6y35PmBucM-sSZl-ndsSUdqFLnI5ZjEhOeLE3S",
    currency: "USD",
    intent: "capture",
  };

  const createOrder = async () => {
    setIsLoading(true);
    setError(null);

    try {
      console.log("Creating PayPal order...");
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

      if (!response.ok) {
        const errorData = await response.text();
        console.error("PayPal order creation failed:", errorData);
        throw new Error(errorData || "Failed to create PayPal order");
      }

      const orderData = await response.json();
      console.log("PayPal order created:", orderData);
      return orderData.id;
    } catch (err) {
      console.error("Order creation error:", err);
      setError(err instanceof Error ? err.message : "Failed to create order");
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const onApprove = async (data: any) => {
    setIsLoading(true);

    try {
      console.log("Payment approved, capturing:", data);
      const captureResponse = await fetch("/api/payment/capture-paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderID: data.orderID }),
      });

      if (!captureResponse.ok) {
        const errorText = await captureResponse.text();
        throw new Error(`Payment capture failed: ${errorText}`);
      }

      const captureResult = await captureResponse.json();
      console.log("Payment captured successfully:", captureResult);

      // Redirect to success page
      window.location.href = `/success?order_id=${data.orderID}`;
    } catch (err) {
      console.error("Payment approval error:", err);
      setError(
        err instanceof Error ? err.message : "Payment processing failed"
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Handle payment cancellation
  const onCancel = (data: any) => {
    console.log("Payment cancelled:", data);
    setError("Payment was cancelled. Please try again.");
    setIsLoading(false);
  };

  // Handle payment errors
  const onError = (err: any) => {
    console.error("PayPal error:", err);
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
        createOrder={createOrder}
        onApprove={onApprove}
        onCancel={onCancel}
        onError={onError}
      />
    </PayPalScriptProvider>
  );
}
