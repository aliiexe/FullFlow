"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { XCircle, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function CancelPage() {
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
        
        <p className="text-gray-300 mb-8">
          Your payment was cancelled. If you need any assistance or have questions about our services, please don't hesitate to contact us.
        </p>
        
        <Link href="/pricing" className="flex items-center justify-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Return to Pricing
        </Link>
      </motion.div>
    </div>
  );
}