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
  payment_status: string;
  selected_deliverable_name: string | null;
  subscription_tier_name: string | null;
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
  subscription_amount: number;
  subscription_date: string;
  subscription_status: string;
  subscription_tier_name: string;
  renewal_date?: string;
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
        // Provide mock user data similar to your API response
        setUserData({
          user_id: "mock-user-id",
          user_fullname: "Demo User",
          user_email: "demo@example.com",
          clerk_id: userId || "mock-clerk-id",
          projects: [
            {
              projectkey: "DEMO-2024",
              jiraurl:
                "https://fullflow.atlassian.net/jira/software/projects/DEMO/boards",
              slackurl: "https://slack.com/app_redirect?channel=demo-project",
            },
          ],
          project_description:
            "Website redesign with custom CMS integration and e-commerce functionality. Including responsive design and SEO optimization.",
          project_status: "In Progress",
          renewal_date: "2024-06-13", // Format: YYYY-MM-DD
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
          subscriptions: [
            {
              subscription_id: "mock-subscription-1",
              subscription_amount: 39.99,
              subscription_date: new Date().toISOString(),
              subscription_status: "active",
              subscription_tier_name: "Professional Plan",
              renewal_date: "2024-06-13",
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

  // Handle subscription cancellation
  const handleCancelSubscription = async () => {
    setCancelingSubscription(true);
    try {
      // API call to cancel subscription would go here
      await new Promise((resolve) => setTimeout(resolve, 1500)); // Simulate API call

      // Update local state to reflect cancellation
      if (userData) {
        const updatedPayments = userData.payments.map((payment) => {
          if (payment.payment_type === "subscription") {
            return { ...payment, payment_status: "canceled" };
          }
          return payment;
        });
        const updatedSubscriptions = userData.subscriptions.map((sub) => {
          return { ...sub, subscription_status: "canceled" };
        });
        setUserData({
          ...userData,
          payments: updatedPayments,
          subscriptions: updatedSubscriptions,
        });
      }
      setShowCancelModal(false);
    } catch (error) {
      console.error("Error canceling subscription:", error);
    } finally {
      setCancelingSubscription(false);
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
    (sub) =>
      sub.subscription_status === "active" || sub.subscription_status === "paid"
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

            {/* Subscription Card - similar to the image */}
            {activeSubscription && (
              <div className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-lg">
                <div className="p-6 border-b border-white/10 flex justify-between items-center">
                  <h2 className="text-xl font-semibold text-white">
                    Your Plan
                  </h2>
                  {userData.renewal_date && (
                    <span className="text-sm text-gray-400">
                      Renews {formatDate(activeSubscription.renewal_date)}
                    </span>
                  )}
                </div>
                <div className="p-6">
                  <div className="flex justify-between items-baseline mb-4">
                    <div>
                      <h3 className="font-semibold text-white text-lg">
                        {activeSubscription.subscription_tier_name ||
                          "Professional"}
                      </h3>
                      <p className="text-2xl font-bold text-white mt-1">
                        ${activeSubscription.subscription_amount.toFixed(2)}
                        /month
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        4 included users
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 text-sm font-medium rounded-full ${
                        activeSubscription.subscription_status === "active" ||
                        activeSubscription.subscription_status === "paid"
                          ? "bg-green-500/20 text-green-400"
                          : "bg-red-500/20 text-red-400"
                      }`}
                    >
                      {activeSubscription.subscription_status === "canceled"
                        ? "Canceled"
                        : "Active"}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-6 mt-6 border-t border-white/10">
                    <div>
                      <h4 className="text-sm font-medium text-gray-400">
                        Additional Users
                      </h4>
                      <p className="text-white mt-1">0 additional users</p>
                    </div>
                    <button
                      className="text-indigo-400 hover:text-indigo-300 text-sm"
                      onClick={() => {
                        /* Add user functionality */
                      }}
                    >
                      Add More
                    </button>
                  </div>

                  <div className="pt-6 mt-6 border-t border-white/10">
                    {activeSubscription.subscription_status === "active" ||
                    activeSubscription.subscription_status === "paid" ? (
                      <button
                        onClick={() => setShowCancelModal(true)}
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
                          Service/Plan
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
                      {[...(userData.payments || [])]
                        .sort((a, b) => {
                          // Sort by date descending
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
                              $
                              {payment.payment_amount?.toLocaleString() ??
                                "0.00"}
                            </td>
                            <td className="px-6 py-4">
                              <span
                                className={`px-2 py-1 text-xs font-medium rounded-full ${
                                  payment.payment_status === "completed" ||
                                  payment.payment_status === "paid"
                                    ? "bg-green-500/20 text-green-400"
                                    : payment.payment_status === "active"
                                    ? "bg-blue-500/20 text-blue-400"
                                    : payment.payment_status === "canceled"
                                    ? "bg-red-500/20 text-red-400"
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

      {/* Subscription Cancellation Modal */}
      {showCancelModal && (
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
                onClick={() => setShowCancelModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-gray-300 mb-4">
              Are you sure you want to cancel your subscription? You'll lose
              access to your Premium features at the end of your current billing
              period.
            </p>

            <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg mb-6">
              <p className="text-amber-300 text-sm">
                Your subscription will remain active until the end of your
                current billing cycle. You can reactivate your subscription
                anytime before it expires.
              </p>
            </div>

            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-4 py-2 border border-white/20 text-white hover:bg-white/[0.03] rounded-lg transition-colors"
                disabled={cancelingSubscription}
              >
                Keep Subscription
              </button>
              <button
                onClick={handleCancelSubscription}
                className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 rounded-lg flex items-center transition-colors"
                disabled={cancelingSubscription}
              >
                {cancelingSubscription && (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                )}
                Cancel Subscription
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
