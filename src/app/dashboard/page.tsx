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
import { io } from 'socket.io-client';

// Update the Project interface to include project-specific fields
interface Project {
  id: string; // <-- Add this line
  projectkey: string;
  jiraurl: string;
  slackurl: string;
  description?: string; // Add description field to each project
  status?: string; // Add status field to each project
  steps?: any[]; // Add steps field for stepper
  current_step?: number; // Add current_step field for stepper
}

interface UserPayment {
  payment_id: string;
  payment_amount: number;
  payment_date: string | null;
  payment_type: string;
  payment_status?: string; // legacy or fallback
  status?: string; // new field for status
  role?: string; // Add role field
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
  role: string;
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
  const [showConfirmCancellation, setShowConfirmCancellation] = useState(false);
  const [reactivatingSubscription, setReactivatingSubscription] = useState<string | null>(null);
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

  useEffect(() => {
    if (userData && userData.role) {
      if (userData.role === 'admin') {
        router.replace('/admin');
      } else if (userData.role !== 'client') {
        router.replace('/');
      }
    }
  }, [userData, router]);

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

  // Real-time updates: listen for project_updated events
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
    socket.on('project_updated', (updatedProject) => {
      console.log('Received project_updated event:', updatedProject);
      setUserData(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          projects: prev.projects.map(p =>
            p.projectkey === updatedProject.projectkey ? updatedProject : p
          ),
        };
      });
    });
    return () => {
      socket.disconnect();
    };
  }, []);

  if (userData && userData.role && userData.role !== 'client') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0c0c14]">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">Forbidden</h1>
        <p className="text-gray-300 mb-8">You do not have access to this page.</p>
        <Link
          href="/"
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  // Handle subscription cancellation check
  const handleCheckCancellation = async () => {
    if (!userData || !subscriptionToCancel) {
      console.log("[Cancel Check] Missing required data:", { userData: !!userData, subscriptionToCancel: !!subscriptionToCancel });
      return;
    }
    
    console.log("[Cancel Check] Starting cancellation check for subscription:", subscriptionToCancel.subscription_id);
    setCancelingSubscription(true);
    
    try {
      console.log("[Cancel Check] Sending cancellation check request:", {
        clerk_id: userData.clerk_id,
        subscription_id: subscriptionToCancel.subscription_id,
        subscription_tier_id: subscriptionToCancel.subscription_tier_id
      });

      // If it's a Monthly Flow subscription, directly cancel it
      if (subscriptionToCancel.subscription_tier_id === '85fb4214-af39-4a63-8020-daa8a48ec975') {
        console.log("[Cancel Check] Monthly Flow subscription - direct cancellation");
        const apiUrl = process.env.NEXT_PUBLIC_API_URL;
        if (!apiUrl) {
          throw new Error("API URL not configured");
        }

        console.log("[Cancel Check] Calling inactivate_sub for Monthly Flow with:", {
          clerk_id: userData.clerk_id,
          subscription_id: subscriptionToCancel.subscription_id,
          months: null,
          payment_method: null,
          transaction_id: null
        });

        const response = await fetch(`${apiUrl}/api/inactivate_sub`, {
          method: "POST",
          headers: { 
            "Content-Type": "application/json",
            "Accept": "application/json"
          },
          body: JSON.stringify({
            clerk_id: userData.clerk_id,
            subscription_id: subscriptionToCancel.subscription_id,
            months: null,
            payment_method: null,
            transaction_id: null
          }),
        });

        console.log("[Cancel Check] Monthly Flow cancellation response:", {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
          console.error("[Cancel Check] Monthly Flow cancellation failed:", errorData);
          throw new Error(errorData.error || `Failed to cancel subscription: ${response.status}`);
        }

        const result = await response.json();
        console.log("[Cancel Check] Direct cancellation result:", result);

        setCancelResult({
          success: true,
          cancelMessage: "Monthly subscription cancelled successfully",
          payToCancelAmount: 0,
          canCancel: true,
          monthsToPay: 0,
          projectCreated: false
        });

        // Close modal and refresh data
        setTimeout(() => {
          setShowCancelModal(false);
          setSubscriptionToCancel(null);
          setCancelResult(null);
          setShowPaymentStep(false);
          fetchUserData();
          fetchSubscriptions();
        }, 2000);

        return;
      }

      // For other subscription types, check cancellation fee
      console.log("[Cancel Check] Non-Monthly Flow subscription - checking cancellation fee");
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL not configured");
      }

      console.log("[Cancel Check] Calling cancel_sub API with:", {
        clerk_id: userData.clerk_id,
        subscription_id: subscriptionToCancel.subscription_id,
        url: `${apiUrl}/api/cancel_sub`
      });

      const response = await fetch(`${apiUrl}/api/cancel_sub`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          clerk_id: userData.clerk_id,
          subscription_id: subscriptionToCancel.subscription_id,
        }),
      });

      console.log("[Cancel Check] cancel_sub API response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
        console.error("[Cancel Check] API error:", {
          status: response.status,
          statusText: response.statusText,
          error: errorData,
          url: `${apiUrl}/api/cancel_sub`
        });
        throw new Error(
          errorData.error || `HTTP error! status: ${response.status} - ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("[Cancel Check] cancel_sub result:", result);
      
      setCancelResult({
        success: result.success || false,
        cancelMessage: result.cancelMessage || "Cancellation processed",
        payToCancelAmount: result.payToCancelAmount,
        canCancel: result.canCancel !== false,
        monthsToPay: result.months_to_pay || 0,
        projectCreated: result.projectCreated || false
      });

      // If there's an amount to pay, show payment step
      if (result.payToCancelAmount && result.payToCancelAmount > 0) {
        console.log("[Cancel Check] Payment required for cancellation:", {
          amount: result.payToCancelAmount,
          monthsToPay: result.months_to_pay
        });
        setShowPaymentStep(true);
        setShowConfirmCancellation(false);
      } else {
        console.log("[Cancel Check] No payment required, showing confirm cancellation button");
        // If no payment needed, show confirm cancellation button
        setShowConfirmCancellation(true);
        setShowPaymentStep(false);
      }
    } catch (error) {
      console.error("[Cancel Check] Error checking cancellation:", error);
      setCancelResult({
        success: false,
        cancelMessage: error instanceof Error ? error.message : "Unknown error",
      });
    } finally {
      setCancelingSubscription(false);
    }
  };

  // Handle final cancellation after payment
  const handleFinalCancellation = async (transactionId = "PENDING_PAYPAL") => {
    if (!userData || !subscriptionToCancel || !cancelResult) {
      console.log("[Final Cancellation] Missing required data:", {
        userData: !!userData,
        subscriptionToCancel: !!subscriptionToCancel,
        cancelResult: !!cancelResult
      });
      return;
    }
    
    console.log("[Final Cancellation] Starting final cancellation with:", {
      clerk_id: userData.clerk_id,
      subscription_id: subscriptionToCancel.subscription_id,
      months: cancelResult.monthsToPay || 0,
      payment_method: "PayPal",
      transaction_id: transactionId
    });
    
    // Validate required parameters
    const monthsToPay = cancelResult.monthsToPay || 0;
    if (!userData.clerk_id || !subscriptionToCancel.subscription_id || 
        monthsToPay === null || monthsToPay === undefined ||
        !transactionId) {
      console.error("[Final Cancellation] Missing required parameters:", {
        clerk_id: !!userData.clerk_id,
        subscription_id: !!subscriptionToCancel.subscription_id,
        months: monthsToPay !== null && monthsToPay !== undefined,
        transaction_id: !!transactionId
      });
      throw new Error("Missing required parameters for subscription inactivation");
    }
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL not configured");
      }
      
      console.log("[Final Cancellation] Calling inactivate_sub API with:", {
        url: `${apiUrl}/api/inactivate_sub`,
        data: {
          clerk_id: userData.clerk_id,
          subscription_id: subscriptionToCancel.subscription_id,
          months: monthsToPay,
          payment_method: "PayPal",
          transaction_id: transactionId
        }
      });
      
      const inactivateResponse = await fetch(`${apiUrl}/api/inactivate_sub`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          clerk_id: userData.clerk_id,
          subscription_id: subscriptionToCancel.subscription_id,
          months: monthsToPay,
          payment_method: "PayPal",
          transaction_id: transactionId
        }),
      });
      
      console.log("[Final Cancellation] inactivate_sub response:", {
        status: inactivateResponse.status,
        statusText: inactivateResponse.statusText,
        ok: inactivateResponse.ok
      });
      
      if (!inactivateResponse.ok) {
        const errorData = await inactivateResponse.json().catch(() => ({ error: "Failed to parse error response" }));
        console.error("[Final Cancellation] inactivate_sub failed:", errorData);
        throw new Error(errorData.error || `Failed to inactivate subscription: ${inactivateResponse.status}`);
      }
      
      const result = await inactivateResponse.json();
      console.log("[Final Cancellation] Success:", result);
      
      // Close modal and refresh data
      setShowCancelModal(false);
      setSubscriptionToCancel(null);
      setCancelResult(null);
      setShowPaymentStep(false);
      fetchUserData();
      fetchSubscriptions();
    } catch (error) {
      console.error("[Final Cancellation] Error:", error);
      throw error; // Re-throw to be handled by the caller
    }
  };

  // Handle direct cancellation when no payment is required
  const handleDirectCancellation = async () => {
    if (!userData || !subscriptionToCancel) {
      console.log("[Direct Cancellation] Missing required data:", { userData: !!userData, subscriptionToCancel: !!subscriptionToCancel });
      return;
    }
    
    console.log("[Direct Cancellation] Starting direct cancellation for subscription:", subscriptionToCancel.subscription_id);
    setCancelingSubscription(true);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL not configured");
      }
      
      console.log("[Direct Cancellation] Calling inactivate_sub API with:", {
        clerk_id: userData.clerk_id,
        subscription_id: subscriptionToCancel.subscription_id,
        months: null,
        payment_method: null,
        transaction_id: null
      });
      
      const response = await fetch(`${apiUrl}/api/inactivate_sub`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          clerk_id: userData.clerk_id,
          subscription_id: subscriptionToCancel.subscription_id,
          months: null,
          payment_method: null,
          transaction_id: null
        }),
      });
      
      console.log("[Direct Cancellation] API response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
        console.error("[Direct Cancellation] API error:", errorData);
        throw new Error(errorData.error || `Failed to cancel subscription: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("[Direct Cancellation] Success:", result);
      
      // Close modal and refresh data
      setTimeout(() => {
        setShowCancelModal(false);
        setSubscriptionToCancel(null);
        setCancelResult(null);
        setShowPaymentStep(false);
        setShowConfirmCancellation(false);
        fetchUserData();
        fetchSubscriptions();
      }, 2000);
      
    } catch (error) {
      console.error("[Direct Cancellation] Error:", error);
      setCancelResult({
        success: false,
        cancelMessage: error instanceof Error ? error.message : "Failed to cancel subscription",
      });
    } finally {
      setCancelingSubscription(false);
    }
  };

  // Handle successful payment
  const handlePaymentSuccess = (transactionId?: string) => {
    console.log("[Payment Success] Cancellation payment completed with transaction ID:", transactionId);
    // Call final cancellation with the real PayPal transaction ID or a default
    handleFinalCancellation(transactionId || "PENDING_PAYPAL");
    // Close modal and refresh data after successful payment
    setTimeout(() => {
      setShowCancelModal(false);
      setSubscriptionToCancel(null);
      setCancelResult(null);
      setShowPaymentStep(false);
      setShowConfirmCancellation(false);
      fetchUserData();
      fetchSubscriptions();
    }, 2000);
  };

  // Handle subscription reactivation
  const handleReactivateSubscription = async (subscriptionId: string) => {
    if (!userData) {
      console.log("[Reactivate] Missing user data");
      return;
    }
    
    console.log("[Reactivate] Starting reactivation for subscription:", subscriptionId);
    setReactivatingSubscription(subscriptionId);
    
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL;
      if (!apiUrl) {
        throw new Error("API URL not configured");
      }
      
      console.log("[Reactivate] Calling reactivate_sub API with:", {
        clerk_id: userData.clerk_id,
        sub_id: subscriptionId,
        payment_method: "PayPal",
        transaction_id: "REACTIVATION"
      });
      
      const response = await fetch(`${apiUrl}/api/reactivate_sub`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Accept": "application/json"
        },
        body: JSON.stringify({
          clerk_id: userData.clerk_id,
          sub_id: subscriptionId,
          payment_method: "PayPal",
          transaction_id: "REACTIVATION"
        }),
      });
      
      console.log("[Reactivate] API response:", {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Failed to parse error response" }));
        console.error("[Reactivate] API error:", errorData);
        throw new Error(errorData.error || `Failed to reactivate subscription: ${response.status}`);
      }
      
      const result = await response.json();
      console.log("[Reactivate] Success:", result);
      
      // Refresh data to show updated subscription status
      fetchUserData();
      fetchSubscriptions();
      
      // Show success message (you could add a toast notification here)
      alert("Subscription reactivated successfully!");
      
    } catch (error) {
      console.error("[Reactivate] Error:", error);
      alert(error instanceof Error ? error.message : "Failed to reactivate subscription");
    } finally {
      setReactivatingSubscription(null);
    }
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
            className="space-y-6 m-6"
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
                          setShowConfirmCancellation(false);
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
              className="m-6"
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
                    {Array.isArray(selectedProject?.steps) && selectedProject.steps.length > 0 && (
                      <div className="py-8 px-6">
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-white">Project Progress</h3>
                          <span className="text-xs text-gray-400">
                            Step {(typeof selectedProject?.current_step === 'number' ? selectedProject.current_step + 1 : 1)} of {selectedProject.steps.length}
                          </span>
                        </div>
                        <div className="relative w-full" style={{ minHeight: 100 }}>
                          {/* <div className="absolute left-0 right-0 top-1/2 h-[2px] bg-white/20 z-0" style={{ transform: 'translateY(-50%)' }} /> */}
                          <div className="relative z-20 flex w-full gap-4 flex-wrap md:flex-nowrap justify-between items-start overflow-x-auto scrollbar-thin scrollbar-thumb-gray-700 scrollbar-track-transparent pb-2">
                            {selectedProject.steps.map((step, idx) => {
                              const isCompleted = step.completed || idx < (selectedProject.current_step ?? 0);
                              const isCurrent   = idx === selectedProject.current_step;
                              return (
                                <div key={idx} className="flex-1 min-w-[90px] flex flex-col items-center">
                                  <div className="flex items-center justify-center" style={{ height: 48 }}>
                                    <div
                                      className={`w-12 h-12 rounded-full flex items-center justify-center border-2 transition-colors duration-300
                                        ${isCompleted
                                          ? 'border-cyan-400 bg-cyan-400/10 text-cyan-300'
                                          : isCurrent
                                          ? 'border-indigo-400 bg-indigo-500 text-white'
                                          : 'border-white/30 bg-white/10 text-white/70'
                                        }`}
                                    >
                                      {isCompleted
                                        ? <Check className="w-6 h-6" />
                                        : <span className="font-bold text-base">{idx + 1}</span>
                                      }
                                    </div>
                                  </div>
                                  <span className={`mt-2 text-xs text-center font-medium
                                    ${isCompleted ? 'text-cyan-300' : isCurrent ? 'text-indigo-300' : 'text-white/90'}
                                  `}>
                                    {step.name.charAt(0).toUpperCase() + step.name.slice(1)}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
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
              className="space-y-6 m-6"
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

              {/* Active Subscriptions */}
              {userData.subscriptions && userData.subscriptions.filter(sub => sub.status === "active").length > 0 && (
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
                          <th className="px-6 py-3 text-sm font-medium">Start Date</th>
                          <th className="px-6 py-3 text-sm font-medium">End Date</th>
                          <th className="px-6 py-3 text-sm font-medium">Plan</th>
                          <th className="px-6 py-3 text-sm font-medium">Subscription ID</th>
                          <th className="px-6 py-3 text-sm font-medium">Status</th>
                          <th className="px-6 py-3 text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userData.subscriptions
                          .filter(subscription => subscription.status === "active")
                          .map((subscription) => {
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
                                  <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-500/20 text-green-400">
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
                                        setShowConfirmCancellation(false);
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

              {/* Inactive Subscriptions */}
              {userData.subscriptions && userData.subscriptions.filter(sub => sub.status !== "active").length > 0 && (
                <div className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-lg">
                  <div className="p-6 border-b border-white/10">
                    <h2 className="text-xl font-semibold text-white flex items-center">
                      <CardIcon className="mr-2 h-5 w-5" />
                      Inactive Subscriptions
                    </h2>
                    <p className="text-sm text-gray-400 mt-1">
                      Your previous subscription plans
                    </p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="text-left text-gray-400 border-b border-white/10">
                          <th className="px-6 py-3 text-sm font-medium">Start Date</th>
                          <th className="px-6 py-3 text-sm font-medium">End Date</th>
                          <th className="px-6 py-3 text-sm font-medium">Plan</th>
                          <th className="px-6 py-3 text-sm font-medium">Subscription ID</th>
                          <th className="px-6 py-3 text-sm font-medium">Status</th>
                          <th className="px-6 py-3 text-sm font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userData.subscriptions
                          .filter(subscription => subscription.status !== "active")
                          .map((subscription) => (
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
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  subscription.status === "canceled"
                                    ? "bg-red-500/20 text-red-400"
                                    : "bg-amber-500/20 text-amber-400"
                                }`}>
                                  {subscription.status}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                {['canceled', 'not_active'].includes(subscription.status) && (
                                  <button
                                    className="px-3 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors flex items-center"
                                    onClick={() => handleReactivateSubscription(subscription.subscription_id)}
                                    disabled={reactivatingSubscription === subscription.subscription_id}
                                  >
                                    {reactivatingSubscription === subscription.subscription_id ? (
                                      <>
                                        <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                                        Reactivating...
                                      </>
                                    ) : (
                                      "Reactivate"
                                    )}
                                  </button>
                                )}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
      </main>
    </div>
  );
}