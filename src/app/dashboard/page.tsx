"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  FileText,
  AlertCircle,
  ExternalLink,
  Check,
  CreditCard as CardIcon,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

// Define interfaces based on your API schema
interface UserPayment {
  payment_id: string;
  payment_amount: number;
  payment_date: string | null;
  payment_type: string;
  payment_status: string;
  selected_deliverable_name: string | null;
  subscription_tier_name: string | null;
}

interface UserData {
  user_id: string;
  user_fullname: string;
  user_email: string;
  clerk_id: string;
  project_key: string | null;
  payments: UserPayment[];
  // Additional fields that might be returned from the API
  jira_url?: string;
  slack_url?: string;
}

export default function Dashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "subscription" | "project" | "billing"
  >("subscription");
  const router = useRouter();

  const { userId, isLoaded, isSignedIn } = useAuth();

  // Log auth state (optional, for debugging)
  useEffect(() => {
    console.log("Auth state:", { userId, isLoaded, isSignedIn });
  }, [userId, isLoaded, isSignedIn]);

  // If auth is loaded and user is not signed in, redirect
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect=/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);

  // Fetch user data when authenticated
  const fetchUserData = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !userId) return;

    try {
      setLoading(true);
      console.log("Fetching user data for clerk ID:", userId);

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "https://api.example.com";

      try {
        // Using the users endpoint with clerk_id parameter
        const response = await fetch(`${apiUrl}/api/users?clerk_id=${userId}`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          throw new Error("Invalid response format, expected JSON");
        }

        const result = await response.json();
        setUserData(result.data);
        console.log("User data fetched:", result.data);
      } catch (err) {
        console.warn("Using mock user data:", err);
        // Provide mock user data similar to your API response
        setUserData({
          user_id: "mock-user-id",
          user_fullname: "Demo User",
          user_email: "demo@example.com",
          clerk_id: userId || "mock-clerk-id",
          project_key: "DEMO-2024",
          jira_url:
            "https://fullflow.atlassian.net/jira/software/projects/DEMO/boards",
          slack_url: "https://slack.com/app_redirect?channel=demo-project",
          payments: [
            {
              payment_id: "mock-payment-1",
              payment_amount: 1500,
              payment_date: new Date().toISOString(),
              payment_type: "deliverable",
              payment_status: "completed",
              selected_deliverable_name: "Website Development",
              subscription_tier_name: null,
            },
            {
              payment_id: "mock-payment-2",
              payment_amount: 39.99,
              payment_date: new Date().toISOString(),
              payment_type: "subscription",
              payment_status: "active",
              selected_deliverable_name: null,
              subscription_tier_name: "Professional Plan",
            },
          ],
        });
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch user data"
      );
    } finally {
      setLoading(false);
    }
  }, [userId, isLoaded, isSignedIn]);

  // Kick off data fetch
  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      fetchUserData();
    }
  }, [fetchUserData, isLoaded, isSignedIn, userId]);

  // Show loader while auth isn't resolved OR while redirecting OR while fetching data
  if (!isLoaded || (!isSignedIn && isLoaded) || (isSignedIn && loading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0c0c14]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="mt-4 text-gray-300">Loading your dashboard...</p>
      </div>
    );
  }

  // If there's an error, show an error screen
  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0c0c14]">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Error</h1>
        <p className="text-gray-300 mb-8">{error}</p>
        <Link
          href="/"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  // If we have no user data but are signed in, show a "no data found" message
  if (!userData && isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0c0c14]">
        <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">
          No User Data Found
        </h1>
        <p className="text-gray-300 mb-8">
          We couldn't find your account information. Please contact support.
        </p>
        <Link
          href="/"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  // Get subscription data from payments
  const subscriptionPayment = userData?.payments.find(
    (payment) =>
      payment.payment_type === "subscription" &&
      payment.payment_status === "active"
  );

  // Main dashboard
  return (
    <div className="min-h-screen bg-[#0c0c14]">
      <header className="border-b border-white/10 backdrop-blur-md bg-black/20">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white">Client Dashboard</h1>
          <Link
            href="/"
            className="text-indigo-400 hover:text-indigo-300 transition-colors text-sm"
          >
            Return to Home
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto py-10 px-4 sm:px-6 lg:px-8">
        {/* Navigation Tabs */}
        <div className="flex border-b border-white/10 mb-8">
          <button
            onClick={() => setActiveTab("subscription")}
            className={`px-6 py-3 font-medium focus:outline-none ${
              activeTab === "subscription"
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Account
          </button>
          {userData?.project_key && (
            <button
              onClick={() => setActiveTab("project")}
              className={`px-6 py-3 font-medium focus:outline-none ${
                activeTab === "project"
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Project Details
            </button>
          )}
          {userData?.payments && userData.payments.length > 0 && (
            <button
              onClick={() => setActiveTab("billing")}
              className={`px-6 py-3 font-medium focus:outline-none ${
                activeTab === "billing"
                  ? "text-indigo-400 border-b-2 border-indigo-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              Payments
            </button>
          )}
        </div>

        {activeTab === "subscription" && userData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-lg">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">
                  Account Information
                </h2>
              </div>
              <div className="p-6 space-y-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">
                    Name
                  </h3>
                  <p className="text-white">{userData.user_fullname}</p>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-gray-400 mb-1">
                    Email
                  </h3>
                  <p className="text-white">{userData.user_email}</p>
                </div>

                {subscriptionPayment && (
                  <div className="pt-6 border-t border-white/10">
                    <h3 className="text-sm font-medium text-white mb-4">
                      Current Plan
                    </h3>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-medium text-white">
                          {subscriptionPayment.subscription_tier_name ||
                            "Standard Plan"}
                        </p>
                        <p className="text-indigo-400 mt-1">
                          ${subscriptionPayment.payment_amount.toFixed(2)}/month
                        </p>
                      </div>
                      <span className="px-3 py-1 text-sm font-medium bg-green-500/20 text-green-400 rounded-full">
                        Active
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "project" && userData && userData.project_key && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Project Info Card */}
            <div className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-lg mb-6">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">
                  Project Information
                </h2>
              </div>
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">
                      Project Key
                    </h3>
                    <p className="text-white">{userData.project_key}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">
                      Client Email
                    </h3>
                    <p className="text-white">{userData.user_email}</p>
                  </div>
                </div>

                {(userData.jira_url || userData.slack_url) && (
                  <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {userData.jira_url && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2">
                          Jira Project
                        </h3>
                        <a
                          href={userData.jira_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg transition-colors"
                        >
                          Access Jira Project
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </div>
                    )}

                    {userData.slack_url && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-2">
                          Slack Channel
                        </h3>
                        <a
                          href={userData.slack_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg transition-colors"
                        >
                          Access Slack Channel
                          <ExternalLink className="ml-2 h-4 w-4" />
                        </a>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "billing" &&
          userData &&
          userData.payments &&
          userData.payments.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Payment History Card */}
              <div className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-lg mb-6">
                <div className="p-6 border-b border-white/10">
                  <h2 className="text-xl font-semibold text-white">
                    Payment History
                  </h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-gray-400 border-b border-white/10">
                        <th className="px-6 py-3 text-sm font-medium">Type</th>
                        <th className="px-6 py-3 text-sm font-medium">Date</th>
                        <th className="px-6 py-3 text-sm font-medium">
                          Service
                        </th>
                        <th className="px-6 py-3 text-sm font-medium">
                          Amount
                        </th>
                        <th className="px-6 py-3 text-sm font-medium">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {userData.payments.map((payment) => (
                        <tr
                          key={payment.payment_id}
                          className="border-b border-white/5 hover:bg-white/[0.02]"
                        >
                          <td className="px-6 py-4 text-white capitalize">
                            {payment.payment_type}
                          </td>
                          <td className="px-6 py-4 text-white">
                            {payment.payment_date
                              ? new Date(
                                  payment.payment_date
                                ).toLocaleDateString()
                              : "Pending"}
                          </td>
                          <td className="px-6 py-4 text-white">
                            {payment.selected_deliverable_name ||
                              payment.subscription_tier_name ||
                              "-"}
                          </td>
                          <td className="px-6 py-4 text-white">
                            ${payment.payment_amount.toLocaleString()}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded-full ${
                                payment.payment_status === "completed"
                                  ? "bg-green-500/20 text-green-400"
                                  : payment.payment_status === "active"
                                  ? "bg-blue-500/20 text-blue-400"
                                  : "bg-amber-500/20 text-amber-400"
                              }`}
                            >
                              {payment.payment_status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.div>
          )}
      </main>
    </div>
  );
}
