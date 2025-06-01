'use client';

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { Loader2, CreditCard, FileText, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function Dashboard() {
  const [projectDetails, setProjectDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const searchParams = useSearchParams();
  const email = searchParams.get('email');

  useEffect(() => {
    async function fetchProjectData() {
      if (!email) {
        setError("Email is required to access your dashboard");
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(`/api/dashboard/project?email=${encodeURIComponent(email)}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch project data');
        }
        
        const data = await response.json();
        setProjectDetails(data);
      } catch (err) {
        console.error('Error fetching project data:', err);
        setError('Unable to load your project information. Please try again later.');
      } finally {
        setLoading(false);
      }
    }

    fetchProjectData();
  }, [email]);

  const handleCancelSubscription = async () => {
    if (!projectDetails?.subscription?.id) return;
    
    try {
      const response = await fetch('/api/dashboard/cancel-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          subscriptionId: projectDetails.subscription.id,
          email 
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel subscription');
      }
      
      // Refresh project data to show updated subscription status
      const updatedData = await response.json();
      setProjectDetails({...projectDetails, subscription: updatedData.subscription});
    } catch (err) {
      console.error('Error cancelling subscription:', err);
      setError('Failed to cancel your subscription. Please try again later.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="mt-4 text-gray-500">Loading your project details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <AlertCircle className="w-16 h-16 text-red-500 mb-4" />
        <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
        <p className="text-gray-600 mb-8">{error}</p>
        <Link href="/" className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700">
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900">Project Dashboard</h1>
        </div>
      </header>
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {/* Project Info Card */}
        <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
          <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Project Information</h3>
          </div>
          <div className="px-4 py-5 sm:px-6">
            <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Project Key</dt>
                <dd className="mt-1 text-sm text-gray-900">{projectDetails?.projectKey || 'N/A'}</dd>
              </div>
              <div className="sm:col-span-1">
                <dt className="text-sm font-medium text-gray-500">Customer Email</dt>
                <dd className="mt-1 text-sm text-gray-900">{projectDetails?.email || 'N/A'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Jira Project</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a href={projectDetails?.jiraUrl} className="text-indigo-600 hover:text-indigo-500" target="_blank" rel="noopener noreferrer">
                    Access Jira Project
                  </a>
                </dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-sm font-medium text-gray-500">Slack Channel</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  <a href={projectDetails?.slackUrl} className="text-indigo-600 hover:text-indigo-500" target="_blank" rel="noopener noreferrer">
                    Access Slack Channel
                  </a>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Subscription Card */}
        {projectDetails?.subscription && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg mb-6">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Subscription Details</h3>
            </div>
            <div className="px-4 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-x-4 gap-y-8 sm:grid-cols-2">
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Plan</dt>
                  <dd className="mt-1 text-sm text-gray-900">{projectDetails?.subscription?.name || 'N/A'}</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Price</dt>
                  <dd className="mt-1 text-sm text-gray-900">${projectDetails?.subscription?.amount}/month</dd>
                </div>
                <div className="sm:col-span-1">
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      projectDetails?.subscription?.status === 'active' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {projectDetails?.subscription?.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm font-medium text-gray-500">Billing Period</dt>
                  <dd className="mt-1 text-sm text-gray-900">
                    {new Date(projectDetails?.subscription?.currentPeriodStart).toLocaleDateString()} - {
                      new Date(projectDetails?.subscription?.currentPeriodEnd).toLocaleDateString()
                    }
                  </dd>
                </div>
                {projectDetails?.subscription?.status === 'active' && (
                  <div className="sm:col-span-2">
                    <button
                      onClick={handleCancelSubscription}
                      className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-red-600 hover:bg-red-700"
                    >
                      Cancel Subscription
                    </button>
                  </div>
                )}
              </dl>
            </div>
          </div>
        )}

        {/* Services/Deliverables Card */}
        {projectDetails?.deliverables && projectDetails.deliverables.length > 0 && (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 border-b border-gray-200 sm:px-6">
              <h3 className="text-lg leading-6 font-medium text-gray-900">Purchased Services</h3>
            </div>
            <ul className="divide-y divide-gray-200">
              {projectDetails.deliverables.map((deliverable: any) => (
                <li key={deliverable.id} className="px-4 py-4 sm:px-6">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-indigo-600 truncate">{deliverable.name}</p>
                    <p className="text-sm text-gray-500">${deliverable.price}</p>
                  </div>
                  <div className="mt-2">
                    <p className="text-sm text-gray-500">{deliverable.description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </main>
    </div>
  );
}