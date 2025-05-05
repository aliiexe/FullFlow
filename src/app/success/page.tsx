"use client";

import React, { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function SuccessPage() {
  const searchParams = useSearchParams();
  const session_id = searchParams.get("session_id");
  const [sessionDetails, setSessionDetails] = useState<{
    customer_email: string | null;
    amount_total: number | null;
  } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session_id) {
      console.log("Fetching session details for session_id:", session_id); // Debugging
      fetch(`/api/payment/session?session_id=${session_id}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("Session details fetched:", data); // Debugging
          if (data.error) {
            setError(data.error);
          } else {
            setSessionDetails(data);
          }
        })
        .catch((err) => {
          console.error("Error fetching session details:", err); // Debugging
          setError("Error fetching session details.");
        });
    }
  }, [session_id]);

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

        {error ? (
          <p className="text-red-500">{error}</p>
        ) : sessionDetails ? (
          <>
            <p className="text-gray-300 mb-4">
              Thank you for your purchase, <strong>{sessionDetails.customer_email || "Unknown"}</strong>!
            </p>
            <p className="text-gray-300 mb-8">
              Total Paid: <strong>${(sessionDetails.amount_total! / 100).toFixed(2)}</strong>
            </p>
          </>
        ) : (
          <p className="text-gray-300 mb-8">Loading session details...</p>
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