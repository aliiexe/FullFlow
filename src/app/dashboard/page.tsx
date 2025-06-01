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

// Polyfill for process.env in the browser (only if needed)
if (typeof window !== "undefined" && !window.process) {
  window.process = {
    env: {
      NODE_ENV: process.env.NODE_ENV || "development",
      CLERK_TELEMETRY_DEBUG: "false",
      CLERK_TELEMETRY_DISABLED: "true",
      NEXT_PUBLIC_CLERK_TELEMETRY_DEBUG: "false",
      NEXT_PUBLIC_CLERK_TELEMETRY_DISABLED: "true",
    },
  } as any;
}

// Define interfaces based on your API schema
interface Deliverable {
  id: string;
  service_category_id?: string;
  name: string;
  description: string | null;
  price: number | null;
  is_active?: boolean;
  complexity_level?: string | null;
  created_at: string;
  updated_at: string;
  service_category?: {
    id: string;
    name: string;
    base_id: string | null;
    created_at: string;
    updated_at: string;
    description: string | null;
    order_position: number | null;
  };
}

interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number; // <-- we use `price`, not `amount`
  is_active: boolean;
  includedUsers?: number;
  status?: string;
  currentPeriodEnd?: string;
  created_at: string;
  updated_at: string;
}

interface PaymentMethod {
  lastFour: string;
  type: string;
  expiryDate: string;
}

interface Invoice {
  id: string;
  date: string;
  total: number;
}

interface ProjectInfo {
  id: string;
  name: string;
  projectKey: string;
  email: string;
  jiraUrl: string;
  slackUrl: string;
  subscription: SubscriptionPlan;
  paymentMethod: PaymentMethod;
  deliverables: Deliverable[];
  invoices: Invoice[];
}

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
}

export default function Dashboard() {
  const [projectDetails, setProjectDetails] = useState<ProjectInfo | null>(
    null
  );
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

  // Fetch project data when authenticated
  const fetchProjectData = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !userId) return;

    try {
      setLoading(true);
      console.log("Fetching project data for user:", userId);

      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "https://api.example.com";

      // 1. Fetch the user's “project” resource
      let data: any;
      try {
        const response = await fetch(`${apiUrl}/api/projects?userId=${userId}`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }
        const contentType = response.headers.get("content-type");
        if (!contentType?.includes("application/json")) {
          throw new Error("Invalid response format, expected JSON");
        }
        data = await response.json();
        console.log("Project data fetched:", data);
      } catch (err) {
        console.warn("Using mock project data:", err);
        data = {
          id: "project_mock",
          name: "Demo Project",
          projectKey: "DEMO-2024",
          email: "demo@example.com",
          jiraUrl:
            "https://fullflow.atlassian.net/jira/software/projects/DEMO/boards",
          slackUrl: "https://slack.com/app_redirect?channel=demo-project",
          subscriptionId: "sub_mock",
        };
      }

      // 2. Fetch subscription details
      let subscriptionData: SubscriptionPlan;
      try {
        const subscriptionResponse = await fetch(
          `${apiUrl}/api/subscriptions/${data.subscriptionId || "default"}`
        );
        if (!subscriptionResponse.ok) {
          throw new Error("Subscription data fetch failed");
        }
        subscriptionData = await subscriptionResponse.json();
      } catch (err) {
        console.warn("Using mock subscription data:", err);
        subscriptionData = {
          id: data.subscriptionId || "sub_default",
          name: "Professional",
          description: "Professional Plan",
          price: 39.0,
          is_active: true,
          includedUsers: 4,
          status: "active",
          currentPeriodEnd: new Date(
            Date.now() + 30 * 24 * 60 * 60 * 1000
          ).toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
      }

      // 3. Fetch payment method
      let paymentData: PaymentMethod;
      try {
        const paymentResponse = await fetch(
          `${apiUrl}/api/payment-methods?userId=${userId}`
        );
        if (!paymentResponse.ok) {
          throw new Error("Payment data fetch failed");
        }
        paymentData = await paymentResponse.json();
      } catch (err) {
        console.warn("Using mock payment data:", err);
        paymentData = {
          lastFour: "4242",
          type: "visa",
          expiryDate: "04/25",
        };
      }

      // 4. Fetch deliverables
      let deliverablesData: Deliverable[];
      try {
        const deliverablesResponse = await fetch(
          `${apiUrl}/api/project-deliverables?projectId=${data.id}`
        );
        if (!deliverablesResponse.ok) {
          throw new Error("Deliverables data fetch failed");
        }
        deliverablesData = await deliverablesResponse.json();
      } catch (err) {
        console.warn("Using mock deliverables data:", err);
        deliverablesData = [
          {
            id: "del_001",
            name: "Website Development",
            description: "Full website build with responsive design",
            price: 2500,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          {
            id: "del_002",
            name: "SEO Optimization",
            description: "Complete search engine optimization package",
            price: 1200,
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
        ];
      }

      // 5. Fetch invoices
      let invoicesData: Invoice[];
      try {
        const invoicesResponse = await fetch(
          `${apiUrl}/api/invoices?projectId=${data.id}`
        );
        if (!invoicesResponse.ok) {
          throw new Error("Invoices data fetch failed");
        }
        invoicesData = await invoicesResponse.json();
      } catch (err) {
        console.warn("Using mock invoices data:", err);
        invoicesData = [
          {
            id: "INV-1001",
            date: "2024-05-01",
            total: 1250.0,
          },
          {
            id: "INV-1002",
            date: "2024-04-01",
            total: 875.5,
          },
        ];
      }

      // Combine into our ProjectInfo shape
      const projectInfo: ProjectInfo = {
        id: data.id || "proj_123456",
        name: data.name || "Website Redesign",
        projectKey: data.projectKey || "WEB-2024",
        email: data.email || "client@example.com",
        jiraUrl:
          data.jiraUrl ||
          "https://fullflow.atlassian.net/jira/software/projects/WEB-2024/boards",
        slackUrl:
          data.slackUrl || "https://slack.com/app_redirect?channel=web-2024",
        subscription: subscriptionData,
        paymentMethod: paymentData,
        deliverables: deliverablesData,
        invoices: invoicesData,
      };

      setProjectDetails(projectInfo);
    } catch (err) {
      console.error("Error fetching project data:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch project data"
      );
    } finally {
      setLoading(false);
    }
  }, [userId, isLoaded, isSignedIn]);

  // Fetch user data when authenticated
  const fetchUserData = useCallback(async () => {
    if (!isLoaded || !isSignedIn || !userId) return;

    try {
      console.log("Fetching user data...");
      const apiUrl =
        process.env.NEXT_PUBLIC_API_URL || "https://api.example.com";

      // Get clerk ID from auth
      const clerkId = userId;

      try {
        // Using the updated endpoint with query parameter
        const response = await fetch(`${apiUrl}/api/users?clerk_id=${clerkId}`);
        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
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
          project_key: null,
          payments: [
            {
              payment_id: "mock-payment-1",
              payment_amount: 1500,
              payment_date: null,
              payment_type: "deliverable",
              payment_status: "pending",
              selected_deliverable_name: "Essentials",
              subscription_tier_name: null,
            },
          ],
        });
      }
    } catch (err) {
      console.error("Error fetching user data:", err);
    }
  }, [userId, isLoaded, isSignedIn]);

  // Kick off data fetch
  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      fetchProjectData();
      fetchUserData();
    }
  }, [fetchProjectData, fetchUserData, isLoaded, isSignedIn, userId]);

  // Add this effect after your other useEffects
  useEffect(() => {
    if (isLoaded && isSignedIn && userId) {
      fetchUserData();
    }
  }, [fetchUserData, isLoaded, isSignedIn, userId]);

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    if (!projectDetails) return;

    if (window.confirm("Are you sure you want to cancel your subscription?")) {
      try {
        setLoading(true);
        const apiUrl =
          process.env.NEXT_PUBLIC_API_URL || "https://api.example.com";

        try {
          const response = await fetch(
            `${apiUrl}/api/subscriptions/${projectDetails.subscription.id}/cancel`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ userId }),
            }
          );

          if (response.ok) {
            const updatedSubscription = await response.json();
            setProjectDetails({
              ...projectDetails,
              subscription: {
                ...projectDetails.subscription,
                status: updatedSubscription.status || "cancelled",
              },
            });
          } else {
            throw new Error("Failed to cancel subscription");
          }
        } catch (err) {
          console.warn("Using mock subscription cancellation:", err);
          setProjectDetails({
            ...projectDetails,
            subscription: {
              ...projectDetails.subscription,
              status: "cancelled",
            },
          });
        }
      } catch (err) {
        console.error("Error canceling subscription:", err);
        setError(
          err instanceof Error ? err.message : "Failed to cancel subscription"
        );
      } finally {
        setLoading(false);
      }
    }
  };

  // Show loader while auth isn't resolved OR while redirecting OR while fetching data
  if (!isLoaded || (!isSignedIn && isLoaded) || (isSignedIn && loading)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0c0c14]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="mt-4 text-gray-300">Loading your project dashboard...</p>
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

  // If we have no project data but are signed in, show a “no project found” message
  if (!projectDetails && isSignedIn) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0c0c14]">
        <AlertCircle className="w-16 h-16 text-amber-500 mb-4" />
        <h1 className="text-2xl font-bold text-white mb-2">No Project Found</h1>
        <p className="text-gray-300 mb-8">
          You don't have any active projects. Please contact support.
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
            Subscription
          </button>
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
          <button
            onClick={() => setActiveTab("billing")}
            className={`px-6 py-3 font-medium focus:outline-none ${
              activeTab === "billing"
                ? "text-indigo-400 border-b-2 border-indigo-400"
                : "text-gray-400 hover:text-white"
            }`}
          >
            Billing
          </button>
        </div>

        {activeTab === "subscription" && projectDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Your Plan Card */}
              <div className="md:col-span-2 backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-lg">
                <div className="p-6 border-b border-white/10">
                  <h2 className="text-xl font-semibold text-white">
                    Your Plan
                  </h2>
                  <p className="text-sm text-gray-400">
                    Renews{" "}
                    {new Date(
                      projectDetails.subscription.currentPeriodEnd!
                    ).toLocaleDateString()}
                  </p>
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {projectDetails.subscription.name}
                      </h3>
                      <div className="flex items-baseline mt-1">
                        <span className="text-2xl font-bold text-white">
                          ${projectDetails.subscription.price.toFixed(2)}
                        </span>
                        <span className="ml-1 text-gray-400">/month</span>
                      </div>
                      {projectDetails.subscription.includedUsers !==
                        undefined && (
                        <p className="text-sm text-gray-400 mt-1">
                          {projectDetails.subscription.includedUsers} included
                          users
                        </p>
                      )}
                    </div>

                    <button
                      className="px-5 py-2 border border-indigo-500/50 text-indigo-400 hover:bg-indigo-500/10 rounded-lg font-medium text-sm"
                      onClick={() => {
                        /* handle plan change */
                      }}
                    >
                      Change Plan
                    </button>
                  </div>

                  <div className="pt-6 border-t border-white/10">
                    <h4 className="text-sm font-medium text-gray-300 mb-4">
                      Plan Features
                    </h4>
                    <ul className="space-y-3">
                      <li className="flex items-start text-sm">
                        <Check className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-300">
                          Unlimited projects
                        </span>
                      </li>
                      <li className="flex items-start text-sm">
                        <Check className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-300">
                          Priority customer support
                        </span>
                      </li>
                      <li className="flex items-start text-sm">
                        <Check className="h-5 w-5 text-indigo-400 mr-3 flex-shrink-0" />
                        <span className="text-gray-300">
                          Advanced integrations
                        </span>
                      </li>
                    </ul>
                  </div>

                  {projectDetails.subscription.status === "active" && (
                    <div className="mt-6">
                      <button
                        onClick={handleCancelSubscription}
                        className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-400 hover:text-red-300 hover:underline focus:outline-none"
                      >
                        Cancel Subscription
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Payment Method Card */}
              <div className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-lg">
                <div className="p-6 border-b border-white/10">
                  <h2 className="text-xl font-semibold text-white">
                    Card Details
                  </h2>
                </div>
                <div className="p-6">
                  <div className="flex items-center mb-6">
                    <div className="h-10 w-16 bg-indigo-600/30 rounded flex items-center justify-center mr-4">
                      {projectDetails.paymentMethod.type === "visa" ? (
                        <span className="text-white font-bold">VISA</span>
                      ) : (
                        <CardIcon className="text-white" />
                      )}
                    </div>
                    <div>
                      <p className="text-white">Visa ending in</p>
                      <p className="text-gray-400">
                        •••• {projectDetails.paymentMethod.lastFour}
                      </p>
                    </div>
                  </div>
                  <button
                    className="w-full px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 font-medium rounded-lg text-sm transition-colors"
                    onClick={() => {
                      /* handle update */
                    }}
                  >
                    Update
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "project" && projectDetails && (
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
                    <p className="text-white">{projectDetails.projectKey}</p>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-1">
                      Client Email
                    </h3>
                    <p className="text-white">{projectDetails.email}</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">
                      Jira Project
                    </h3>
                    <a
                      href={projectDetails.jiraUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg transition-colors"
                    >
                      Access Jira Project
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                  <div>
                    <h3 className="text-sm font-medium text-gray-400 mb-2">
                      Slack Channel
                    </h3>
                    <a
                      href={projectDetails.slackUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg transition-colors"
                    >
                      Access Slack Channel
                      <ExternalLink className="ml-2 h-4 w-4" />
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Deliverables Card */}
            <div className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-lg">
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">
                  Purchased Services
                </h2>
              </div>
              <div className="px-6">
                {projectDetails.deliverables.map((deliverable, index) => (
                  <div
                    key={deliverable.id}
                    className={`py-4 ${
                      index !== projectDetails.deliverables.length - 1
                        ? "border-b border-white/10"
                        : ""
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-indigo-400 font-medium">
                          {deliverable.name}
                        </h3>
                        <p className="text-sm text-gray-400 mt-1">
                          {deliverable.description}
                        </p>
                      </div>
                      <div className="text-white font-semibold">
                        ${deliverable.price?.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === "billing" && projectDetails && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* User Payments Card */}
            {userData && userData.payments.length > 0 && (
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
            )}

            {/* Invoices Card */}
            <div className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-lg">
              {/* Existing invoices code */}
              <div className="p-6 border-b border-white/10">
                <h2 className="text-xl font-semibold text-white">
                  Invoice History
                </h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-gray-400 border-b border-white/10">
                      <th className="px-6 py-3 text-sm font-medium">
                        Invoice Date
                      </th>
                      <th className="px-6 py-3 text-sm font-medium">
                        Invoice ID
                      </th>
                      <th className="px-6 py-3 text-sm font-medium">Total</th>
                      <th className="px-6 py-3 text-sm font-medium"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {projectDetails.invoices.map((invoice) => (
                      <tr
                        key={invoice.id}
                        className="border-b border-white/5 hover:bg-white/[0.02]"
                      >
                        <td className="px-6 py-4 text-white">
                          {new Date(invoice.date).toLocaleDateString()}
                        </td>
                        <td className="px-6 py-4 text-white">{invoice.id}</td>
                        <td className="px-6 py-4 text-white">
                          ${invoice.total.toLocaleString()}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <button className="text-indigo-400 hover:text-indigo-300">
                            <FileText className="h-5 w-5" />
                          </button>
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
