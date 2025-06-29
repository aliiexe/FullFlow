"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft, RefreshCcw } from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';

export default function CancelPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const paymentProcessor = searchParams.get("source") || "payment"; // "stripe", "paypal", or default
  const reason = searchParams.get("reason");
  
  // Log cancel event for analytics (optional)
  useEffect(() => {
    console.log(`Payment canceled. Processor: ${paymentProcessor}, Reason: ${reason || "user cancelled"}`);
    
    // You could send this data to your analytics endpoint
    // const logCancelEvent = async () => {
    //   await fetch('/api/analytics/payment-cancel', {
    //     method: 'POST',
    //     body: JSON.stringify({ paymentProcessor, reason }),
    //     headers: { 'Content-Type': 'application/json' },
    //   });
    // };
    // logCancelEvent();
  }, [paymentProcessor, reason]);
  
  // Return to pricing builder with previous settings (if any)
  const handleRetryPayment = () => {
    router.push('/#pricing');
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-lg w-full max-w-lg p-10 text-center"
      >
        <XCircle className="w-20 h-20 text-red-500 mx-auto mb-6" />
        
        <h1 className="text-3xl font-bold text-white mb-4">
          Payment Cancelled
        </h1>
        
        <p className="text-gray-300 mb-6">
          Your payment was not completed. If you experienced any issues during checkout or have questions about our services, please don't hesitate to contact us.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={handleRetryPayment}
            className="flex items-center justify-center w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
          >
            <RefreshCcw className="w-4 h-4 mr-2" />
            Try Again
          </button>
          
          <Link href="/" className="flex items-center justify-center py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Return to Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}