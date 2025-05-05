"use client";

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function SuccessPage() {
  useEffect(() => {
    // You could fetch the session details here if needed
    // const sessionId = new URLSearchParams(window.location.search).get('session_id');
  }, []);

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center px-6 py-24">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-lg w-full max-w-lg p-10 text-center"
      >
        <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
        
        <h1 className="text-3xl font-bold text-white mb-4">
          Payment Successful!
        </h1>
        
        <p className="text-gray-300 mb-8">
          Thank you for your purchase. We've received your payment and will be in touch shortly to get started on your project.
        </p>
        
        <div className="space-y-4">
          <Link href="/" className="flex items-center justify-center py-3 px-4 bg-white/10 hover:bg-white/20 text-white rounded-lg transition-colors">
            Return to Home
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
          
          <Link href="/dashboard" className="flex items-center justify-center py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
            Go to Dashboard
            <ArrowRight className="w-4 h-4 ml-2" />
          </Link>
        </div>
      </motion.div>
    </div>
  );
}