"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import Link from "next/link";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const order_id = searchParams.get("order_id");
  const amount = searchParams.get("amount");
  const currency = searchParams.get("currency");
  
  const [isLoading, setIsLoading] = useState(true);
  const [orderDetails, setOrderDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!order_id) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/payment/order?order_id=${order_id}`);
        if (response.ok) {
          const data = await response.json();
          setOrderDetails(data);
        } else {
          console.error("Failed to fetch order details");
        }
      } catch (err) {
        console.error("Error fetching order details:", err);
        setError("Failed to load order details");
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [order_id]);

  if (isLoading) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-lg w-full max-w-lg p-10 text-center"
        >
          <Loader2 className="w-20 h-20 text-indigo-500 mx-auto mb-6 animate-spin" />
          <h1 className="text-2xl font-bold text-white mb-4">Processing Payment...</h1>
          <p className="text-gray-300">Please wait while we confirm your payment.</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-lg w-full max-w-lg p-10 text-center"
      >
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />

        <h1 className="text-3xl font-bold text-white mb-4">Payment Successful!</h1>
        
        <div className="space-y-4 mb-6">
          <p className="text-gray-300">
            Thank you for your purchase! We've received your payment.
          </p>
          
          <div className="bg-white/5 rounded-lg p-4 text-left">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Order ID:</span>
                <span className="font-mono text-indigo-300">{order_id}</span>
              </div>
              {amount && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Amount:</span>
                  <span className="text-white">
                    {currency || "$"}{parseFloat(amount).toFixed(2)}
                  </span>
                </div>
              )}
              {orderDetails?.customer_name && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Customer:</span>
                  <span className="text-white">{orderDetails.customer_name}</span>
                </div>
              )}
              {orderDetails?.status && (
                <div className="flex justify-between">
                  <span className="text-gray-400">Status:</span>
                  <span className="text-green-400 capitalize">{orderDetails.status}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <Link
            href="/"
            className="flex items-center justify-center py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors"
          >
            Return to Home
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>

          <Link
            href="/dashboard"
            className="flex items-center justify-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}