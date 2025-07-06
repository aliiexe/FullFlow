"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Loader2,
  FileText,
  AlertCircle,
  ExternalLink,
  Check,
  CreditCard as CardIcon,
  X,
  Calendar,
  Info,
  ChevronDown,
} from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import PayPalCancellationButton from "../../components/PayPalCancellationButton";

// Update the Project interface to include project-specific fields
interface Project {
  projectkey: string;
  jiraurl: string;
  slackurl: string;
  description?: string; // Add description field to each project
  status?: string; // Add status field to each project
}

interface UserPayment {
  payment_id: string;
  payment_amount: number;
  payment_date: string | null;
  payment_type: string;
  payment_status?: string; // legacy or fallback
  status?: string; // new field for status
  selected_deliverable_name: string | null;
  subscription_tier_name: string | null;
  subscription_id?: string;
  subscription_tier_id?: string;
}

// Update UserData interface
interface UserData {
  user_id: string;
  user_fullname: string;
  user_email: string;
  clerk_id: string;
  projects: Project[];
  project_description?: string;
  project_status?: string;
  renewal_date?: string;
  payments: UserPayment[];
  subscriptions: UserSubscription[]; // New array for subscriptions
}

// Add new interface for subscriptions
interface UserSubscription {
  subscription_id: string;
  subscription_tier_id: string;
  status: string;
  start_date: string;
  end_date: string;
}

// Add interface for cancellation result
interface CancellationResult {
  success: boolean;
  cancelMessage: string;
  payToCancelAmount?: number | null;
  canCancel?: boolean;
  monthsToPay?: number;
  projectCreated?: boolean;
}

const SUBSCRIPTION_TIERS = {
  '85fb4214-af39-4a63-8020-daa8a48ec975': 'Monthly Flow',
  '4b90e07a-91e2-4269-87a2-5c4ebe07a4e9': 'Half Flow',
  '6f862c97-b368-4f59-9546-89461af80256': 'One Flow'
} as const;

function getSubscriptionTierName(tierId: string): string {
  return SUBSCRIPTION_TIERS[tierId as keyof typeof SUBSCRIPTION_TIERS] || tierId;
}

// Helper to get status from payment (status or fallback to payment_status)
function getPaymentStatus(payment: UserPayment): string {
  return payment.payment_status || payment.status || "";
}

export default function Dashboard() {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "subscription" | "project" | "billing"
  >("subscription");
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelingSubscription, setCancelingSubscription] = useState(false);
  const [selectedProjectIndex, setSelectedProjectIndex] = useState(0);
  const [subscriptionToCancel, setSubscriptionToCancel] =
    useState<UserSubscription | null>(null);
  const [cancelResult, setCancelResult] = useState<CancellationResult | null>(null);
  const [subscriptions, setSubscriptions] = useState<UserSubscription[]>([]);
  const [showPaymentStep, setShowPaymentStep] = useState(false);
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
          if (response.status === 404) {
            alert(
              "User data not found. Please contact support."
            );
            return;
          }
          const errorData = await response.json();
          throw new Error(
            errorData.error || `HTTP error! status: ${response.status}`
          );
        }

        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          throw new Error("Invalid response format, expected JSON");
        }

        const result = await response.json();
        console.log("Raw API response:", result);

        // Process projects data if needed
        if (result.data && result.data.projects) {
          // Ensure each project has the required properties
          result.data.projects = result.data.projects.map((project: any) => ({
            ...project,
            // Set default status and description if not provided
            status:
              project.status || result.data.project_status || "In Progress",
            description:
              project.description || result.data.project_description || "",
          }));
        }

        // Now the data is in result.data instead of directly in the response
        setUserData(result.data);
        console.log("User data fetched:", result.data);
        console.log("Projects count:", result.data.projects?.length || 0);
      } catch (err) {
        console.warn("Using mock user data:", err);
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

  // Fetch subscriptions from /api/user_subs
  const fetchSubscriptions = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !userId) return;
    try {
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "https://api.example.com";
      const response = await fetch(
        `${apiUrl}/api/user_subs?clerk_id=${userId}`
      );
      if (response.ok) {
        const result = await response.json();
        setSubscriptions(result.data || []);
      }
    } catch (err) {
      console.error("Error fetching subscriptions:", err);
    }
  }, [userId, isLoaded, isSignedIn]);

  // Fetch both user data and subscriptions
  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      fetchUserData();
      fetchSubscriptions();
    }
  }, [fetchUserData, fetchSubscriptions, isLoaded, isSignedIn, userId]);

  // Handle subscription cancellation check
  const handleCheckCancellation = async () => {
    if (!userData || !subscriptionToCancel) return;
    setCancelingSubscription(true);
    try {
      console.log("[Cancel Check] Sending:", {
        clerk_id: userData.clerk_id,
        subscription_id: subscriptionToCancel.subscription_id,
      });

      const response = await fetch(`/api/cancel_sub`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_id: userData.clerk_id,
          subscription_id: subscriptionToCancel.subscription_id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status}`
        );
      }

      const result = await response.json();
      console.log("[Cancel Check] Result:", result);
      
      setCancelResult({
        success: result.success || false,
        cancelMessage: result.cancelMessage || "Cancellation processed",
        payToCancelAmount: result.payToCancelAmount,
        canCancel: result.canCancel !== false,
        monthsToPay: result.monthsToPay || 0,
        projectCreated: result.projectCreated || false
      });

      // If there's an amount to pay, show payment step
      if (result.payToCancelAmount && result.payToCancelAmount > 0) {
        setShowPaymentStep(true);
      } else {
        // If no payment needed, close modal and refresh data
        setTimeout(() => {
          setShowCancelModal(false);
          setSubscriptionToCancel(null);
          setCancelResult(null);
          setShowPaymentStep(false);
          fetchUserData();
          fetchSubscriptions();
        }, 2000);
      }
    } catch (error) {
      console.error("Error checking cancellation:", error);
      setCancelResult({
        success: false,
        cancelMessage: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setCancelingSubscription(false);
    }
  };

  // Handle final cancellation after payment
  const handleFinalCancellation = async () => {
    if (!userData || !subscriptionToCancel || !cancelResult) return;
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.example.com";
      
      const response = await fetch(`${apiUrl}/api/inactivate_sub`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clerk_id: userData.clerk_id,
          subscription_id: subscriptionToCancel.subscription_id,
          months: cancelResult.monthsToPay || 0,
          payment_method: "PayPal"
        }),
      });

      if (response.ok) {
        const result = await response.json();
        console.log("[Final Cancellation] Success:", result);
        
        // Close modal and refresh data
        setShowCancelModal(false);
        setSubscriptionToCancel(null);
        setCancelResult(null);
        setShowPaymentStep(false);
        fetchUserData();
        fetchSubscriptions();
      }
    } catch (error) {
      console.error("Error in final cancellation:", error);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = () => {
    console.log("[Payment Success] Cancellation payment completed");
    
    // Close modal and refresh data after successful payment
    setTimeout(() => {
      setShowCancelModal(false);
      setSubscriptionToCancel(null);
      setCancelResult(null);
      setShowPaymentStep(false);
      fetchUserData();
      fetchSubscriptions();
    }, 2000);
  };

  // Format date for display
  const formatDate = (dateStr: string | null | undefined) => {
    if (!dateStr) return "N/A";
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

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

  // Current selected project (if any projects exist)
  const selectedProject =
    userData?.projects && userData.projects.length > 0
      ? userData.projects[selectedProjectIndex]
      : null;

  // Get subscription data from payments
  const activeSubscription = userData?.subscriptions?.find(
    (sub) => sub.status === "active"
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
          {userData?.projects && userData.projects.length > 0 && (
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
            className="space-y-6"
          >
            {/* Account Information Card */}
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
              </div>
            </div>

            {/* Subscription Card */}
            {activeSubscription && (
              <div className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-lg">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">
                    Your Plan
                  </h2>
                  <span className="text-sm text-gray-400">
                    Valid until {formatDate(activeSubscription.end_date)}
                  </span>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-baseline mb-4">
                    <div>
                      <h3 className="font-semibold text-white text-lg">
                        {getSubscriptionTierName(activeSubscription.subscription_tier_id)}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1">
                        Subscription ID: {activeSubscription.subscription_id}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        activeSubscription.status === "active"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {activeSubscription.status}
                    </span>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/10">
                    {activeSubscription.status === "active" ? (
                      <button
                        onClick={() => {
                          setSubscriptionToCancel(activeSubscription);
                          setShowCancelModal(true);
                          setCancelResult(null);
                          setShowPaymentStep(false);
                        }}
                        className="px-4 py-2 border border-white/20 text-white hover:bg-white/[0.03] rounded-lg transition-colors"
                      >
                        Cancel Subscription
                      </button>
                    ) : (
                      <button className="px-4 py-2 bg-indigo-600 text-white hover:bg-indigo-500 rounded-lg transition-colors">
                        Reactivate Subscription
                      </button>
                    )}
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {activeTab === "project" &&
          userData &&
          userData.projects &&
          userData.projects.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {/* Project Selection Buttons - replacing dropdown */}
              {userData.projects.length > 1 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-400 mb-3">
                    Select Project
                  </h3>
                  <div className="flex flex-wrap gap-2">
                    {userData.projects.map((project, index) => (
                      <button
                        key={project.projectkey}
                        onClick={() => setSelectedProjectIndex(index)}
                        className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                          selectedProjectIndex === index
                            ? "bg-indigo-600/80 text-white border border-indigo-500"
                            : "bg-white/[0.03] text-gray-300 hover:bg-white/[0.05] hover:text-white border border-white/10"
                        }`}
                      >
                        {project.projectkey}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Project Info Card */}
              {selectedProject && (
                <div className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-lg mb-6">
                  <div className="p-6 border-b border-white/10">
                    <div className="flex justify-between items-center">
                      <h2 className="text-xl font-semibold text-white">
                        Project Information
                      </h2>
                      {/* Show project-specific status */}
                      <span
                        className={`px-3 py-1 text-sm font-medium rounded-full ${
                          selectedProject.status === "In Progress"
                            ? "bg-blue-500/20 text-blue-400"
                            : selectedProject.status === "Completed"
                            ? "bg-green-500/20 text-green-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}
                      >
                        {selectedProject.status || "Pending"}
                      </span>
                    </div>
                  </div>
                  <div className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-1">
                          Project Key
                        </h3>
                        <p className="text-white">
                          {selectedProject.projectkey}
                        </p>
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-gray-400 mb-1">
                          Client Email
                        </h3>
                        <p className="text-white">{userData.user_email}</p>
                      </div>
                    </div>

                    {/* Project Description Section - Use project-specific description */}
                    {selectedProject.description && (
                      <div className="pt-4 border-t border-white/10">
                        <h3 className="text-sm font-medium text-gray-400 mb-3">
                          Project Description
                        </h3>
                        <div className="p-4 bg-white/[0.02] rounded-lg">
                          <p className="text-gray-300 leading-relaxed">
                            {selectedProject.description ||
                              "No project description available. Please contact your account manager for more details."}
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="pt-6 border-t border-white/10">
                      <h3 className="text-sm font-medium text-gray-400 mb-4">
                        Project Resources
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedProject.jiraurl && (
                          <a
                            href={selectedProject.jiraurl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-3 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg transition-colors"
                          >
                            <FileText className="mr-2 h-5 w-5" />
                            Access Jira Project
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        )}

                        {selectedProject.slackurl && (
                          <a
                            href={selectedProject.slackurl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-3 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg transition-colors"
                          >
                            <FileText className="mr-2 h-5 w-5" />
                            Access Slack Channel
                            <ExternalLink className="ml-2 h-4 w-4" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
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
              className="space-y-6"
            >
              {/* Separate Deliverables and Subscriptions */}
              {/* Deliverables Section */}
              {userData.payments.filter((p) => p.payment_type === "deliverable")
                .length > 0 && (
                <div className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-lg">
                  <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <FileText className="mr-2 h-5 w-5" />
                      One-Time Services
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Individual services and deliverables
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-400 border-b border-white/10">
                          <th className="px-6 py-3 text-sm font-medium">
                            Date
                          </th>
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
                        {userData.payments
                          .filter(
                            (payment) => payment.payment_type === "deliverable"
                          )
                          .sort((a, b) => {
                            const dateA = a.payment_date
                              ? new Date(a.payment_date).getTime()
                              : 0;
                            const dateB = b.payment_date
                              ? new Date(b.payment_date).getTime()
                              : 0;
                            return dateB - dateA;
                          })
                          .map((payment) => (
                            <tr
                              key={payment.payment_id}
                              className="border-b border-white/5 hover:bg-white/[0.02]"
                            >
                              <td className="px-6 py-4 text-white">
                                {payment.payment_date
                                  ? new Date(
                                      payment.payment_date
                                    ).toLocaleDateString()
                                  : "Pending"}
                              </td>
                              <td className="px-6 py-4 text-white">
                                {payment.selected_deliverable_name || "-"}
                              </td>
                              <td className="px-6 py-4 text-white">
                                $
                                {payment.payment_amount?.toLocaleString() ??
                                  "0.00"}
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    getPaymentStatus(payment) === "completed" ||
                                    getPaymentStatus(payment) === "paid"
                                      ? "bg-green-500/20 text-green-400"
                                      : getPaymentStatus(payment) === "canceled"
                                      ? "bg-red-500/20 text-red-400"
                                      : "bg-amber-500/20 text-amber-400"
                                  }`}
                                >
                                  {getPaymentStatus(payment)}
                                </span>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Subscriptions Section */}
              {userData.subscriptions && userData.subscriptions.length > 0 && (
                <div className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-lg">
                  <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <CardIcon className="mr-2 h-5 w-5" />
                      Active Subscriptions
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Your current subscription plans
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-400 border-b border-white/10">
                          <th className="px-6 py-3 text-sm font-medium">
                            Start Date
                          </th>
                          <th className="px-6 py-3 text-sm font-medium">
                            End Date
                          </th>
                          <th className="px-6 py-3 text-sm font-medium">
                            Plan
                          </th>
                          <th className="px-6 py-3 text-sm font-medium">
                            Subscription ID
                          </th>
                          <th className="px-6 py-3 text-sm font-medium">
                            Status
                          </th>
                          <th className="px-6 py-3 text-sm font-medium">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {userData.subscriptions.map((subscription) => {
                          const canCancel = subscription.status === "active";

                          return (
                            <tr key={subscription.subscription_id} className="border-b border-white/5 hover:bg-white/[0.02]">
                              <td className="px-6 py-4 text-white">
                                {formatDate(subscription.start_date)}
                              </td>
                              <td className="px-6 py-4 text-white">
                                {formatDate(subscription.end_date)}
                              </td>
                              <td className="px-6 py-4 text-white">
                                {getSubscriptionTierName(subscription.subscription_tier_id)}
                              </td>
                              <td className="px-6 py-4 text-white">
                                <span className="px-2 py-1 text-[10px] bg-gray-700 text-gray-200 rounded">
                                  {subscription.subscription_id}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    subscription.status === "active"
                                      ? "bg-green-500/20 text-green-400"
                                      : subscription.status === "canceled"
                                      ? "bg-red-500/20 text-red-400"
                                      : "bg-amber-500/20 text-amber-400"
                                  }`}
                                >
                                  {subscription.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {canCancel && (
                                  <button
                                    className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
                                    onClick={() => {
                                      setSubscriptionToCancel(subscription);
                                      setShowCancelModal(true);
                                      setCancelResult(null);
                                      setShowPaymentStep(false);
                                    }}
                                    disabled={cancelingSubscription}
                                  >
                                    Cancel
                                  </button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
      </main>

      {/* Subscription Cancellation Modal */}
      {showCancelModal && subscriptionToCancel && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md w-full bg-[#0c0c14] border border-white/10 rounded-xl p-6"
          >
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-center">
                <AlertCircle className="h-5 w-5 text-amber-400 mr-2" />
                <h3 className="text-xl font-bold text-white">
                  Cancel Subscription
                </h3>
              </div>
              <button
                onClick={() => {
                  setShowCancelModal(false);
                  setSubscriptionToCancel(null);
                  setCancelResult(null);
                  setShowPaymentStep(false);
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {!showPaymentStep ? (
              <>
                <p className="text-gray-300 mb-4">
                  Are you sure you want to cancel your subscription? You'll lose
                  access to your Premium features at the end of your current billing
                  period.
                </p>

                <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-blue-300 text-sm font-medium">
                      Subscription ID
                    </span>
                    <span className="text-blue-300 text-sm">
                      {subscriptionToCancel.subscription_id}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-blue-300 text-sm">Plan</span>
                    <span className="text-blue-300 text-sm">
                      {getSubscriptionTierName(subscriptionToCancel.subscription_tier_id)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-blue-300 text-sm">Valid Until</span>
                    <span className="text-blue-300 text-sm">
                      {formatDate(subscriptionToCancel.end_date)}
                    </span>
                  </div>
                </div>

                {/* Show cancel result message from API */}
                {cancelResult && (
                  <div className={`p-4 rounded mb-4 ${
                    cancelResult.success 
                      ? "bg-green-500/10 border border-green-500/20 text-green-400"
                      : "bg-red-500/10 border border-red-500/20 text-red-400"
                  }`}>
                    <p>{cancelResult.cancelMessage}</p>
                    {cancelResult.payToCancelAmount && cancelResult.payToCancelAmount > 0 && (
                      <p className="font-bold mt-2">
                        Amount to pay: ${cancelResult.payToCancelAmount}
                      </p>
                    )}
                    {cancelResult.monthsToPay && cancelResult.monthsToPay > 0 && (
                      <p className="text-sm mt-1">
                        Months to pay: {cancelResult.monthsToPay}
                      </p>
                    )}
                  </div>
                )}

                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-6">
                  <p className="text-amber-300 text-sm">
                    Your subscription will remain active until {formatDate(subscriptionToCancel.end_date)}.
                    You can reactivate your subscription anytime before it expires.
                  </p>
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowCancelModal(false);
                      setSubscriptionToCancel(null);
                      setCancelResult(null);
                      setShowPaymentStep(false);
                    }}
                    className="px-4 py-2 border border-white/20 text-white hover:bg-white/[0.03] rounded-lg transition-colors"
                    disabled={cancelingSubscription}
                  >
                    Keep Subscription
                  </button>
                  <button
                    onClick={handleCheckCancellation}
                    className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg flex items-center transition-colors"
                    disabled={cancelingSubscription}
                  >
                    {cancelingSubscription && (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    )}
                    Check Cancellation
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className="mb-6">
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Payment Required for Cancellation
                  </h4>
                  <p className="text-gray-300 text-sm mb-4">
                    To cancel your subscription, you need to pay for the remaining {cancelResult?.monthsToPay} months.
                  </p>
                  
                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-blue-300 text-sm font-medium">
                        Amount Due:
                      </span>
                      <span className="text-blue-300 text-lg font-bold">
                        ${cancelResult?.payToCancelAmount}
                      </span>
                    </div>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-blue-300 text-sm">
                        Months to Pay:
                      </span>
                      <span className="text-blue-300 text-sm">
                        {cancelResult?.monthsToPay}
                      </span>
                    </div>
                  </div>
                </div>

                {/* PayPal Button for Cancellation Payment */}
                <div className="mb-4">
                  <PayPalCancellationButton
                    totalPrice={cancelResult?.payToCancelAmount || 0}
                    subscriptionId={subscriptionToCancel.subscription_id}
                    monthsToPay={cancelResult?.monthsToPay || 0}
                    clerkId={userId || ""}
                    onPaymentSuccess={handlePaymentSuccess}
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => setShowPaymentStep(false)}
                    className="px-4 py-2 border border-white/20 text-white hover:bg-white/[0.03] rounded-lg transition-colors"
                  >
                    Back
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}