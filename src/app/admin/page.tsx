"use client";

import React, { useEffect, useState, useCallback, useRef } from "react";
import { BarChart2, DollarSign, Users, Layers, ChevronLeft, ChevronRight, GripVertical, X as XIcon, Plus, CheckCircle, Circle, AlertCircle, Loader2 } from "lucide-react";
import { Listbox } from '@headlessui/react';
import { Check, ChevronsUpDown } from 'lucide-react';
import { Fragment } from 'react';
import { useAuth } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useMemo } from 'react';
import { io } from 'socket.io-client';

interface Project {
  id: string;
  projectkey: string;
  jiraurl: string;
  slackurl: string;
  description?: string;
  status?: string;
  current_step?: number;
  steps?: any;
  updated_at?: string;
  user_id?: string;
  client_email?: string; // Added for new card layout
}

const ADMIN_TABS = [
  { key: "projects", label: "Projects", icon: Layers },
  { key: "insights", label: "Insights", icon: BarChart2 },
  { key: "subscriptions", label: "Subscriptions", icon: Users },
];

export default function AdminDashboard() {
  // All hooks at the top
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [projectDetail, setProjectDetail] = useState<Project | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeTab, setActiveTab] = useState("projects");
  const [editStatus, setEditStatus] = useState<string>("");
  const [editDescription, setEditDescription] = useState<string>("");
  const [editSteps, setEditSteps] = useState<any[]>([]);
  const [editCurrentStep, setEditCurrentStep] = useState<number>(0);
  const [newStepName, setNewStepName] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchKey, setSearchKey] = useState('');
  const [users, setUsers] = useState<{ id: string; email: string }[]>([]);
  const [role, setRole] = useState<string | undefined>(undefined);
  const { userId, isLoaded, isSignedIn } = useAuth();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [insights, setInsights] = useState<any>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  const [insightsError, setInsightsError] = useState<string | null>(null);

  // WebSocket connection effect (must be before any early returns)
  useEffect(() => {
    const socket = io(process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000');
    socket.on('connect', () => {
      console.log('WebSocket connected!');
    });
    // Optionally, listen for events here
    // socket.on('project_updated', (data) => { ... });
    return () => {
      socket.disconnect();
    };
  }, []);

  // All useCallback hooks at the top
  const handleViewEdit = useCallback(async (projectId: string) => {
    setSelectedProjectId(projectId);
    setModalOpen(true);
    setModalLoading(true);
    setModalError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/project-infos/${projectId}`);
      if (!res.ok) throw new Error("Failed to fetch project details");
      const data = await res.json();
      setProjectDetail(data.project);
      setEditStatus(data.project.status || "not_started");
      setEditDescription(data.project.description || "");
      setEditSteps(Array.isArray(data.project.steps) ? data.project.steps : []);
      setEditCurrentStep(typeof data.project.current_step === "number" ? data.project.current_step : 0);
    } catch (err) {
      setModalError((err as Error).message);
    } finally {
      setModalLoading(false);
    }
  }, []);
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setProjectDetail(null);
    setSelectedProjectId(null);
    setModalError(null);
  }, []);
  const handleStepNameChange = useCallback((idx: number, name: string) => {
    setEditSteps(steps => steps.map((step, i) => i === idx ? { ...step, name } : step));
  }, []);
  const handleStepCompletedToggle = useCallback((idx: number) => {
    setEditSteps(steps => steps.map((step, i) => i === idx ? { ...step, completed: !step.completed } : step));
  }, []);
  const handleRemoveStep = useCallback((idx: number) => {
    setEditSteps(steps => steps.filter((_, i) => i !== idx));
    if (editCurrentStep >= idx && editCurrentStep > 0) setEditCurrentStep(editCurrentStep - 1);
  }, [editCurrentStep]);
  const handleAddStep = useCallback(() => {
    if (newStepName.trim() === "") return;
    setEditSteps(steps => [...steps, { name: newStepName, completed: false }]);
    setNewStepName("");
  }, [newStepName]);
  const handleMoveStep = useCallback((from: number, to: number) => {
    if (to < 0 || to >= editSteps.length) return;
    const updated = [...editSteps];
    const [moved] = updated.splice(from, 1);
    updated.splice(to, 0, moved);
    setEditSteps(updated);
    if (editCurrentStep === from) setEditCurrentStep(to);
    else if (editCurrentStep === to) setEditCurrentStep(from);
  }, [editSteps, editCurrentStep]);
  const handleSetCurrentStep = useCallback((idx: number) => setEditCurrentStep(idx), []);
  const handleSave = useCallback(async () => {
    if (!projectDetail) return;
    setSaving(true);
    setSaveError(null);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const patchStatus =
        editStatus === 'not_started' ? 'not_started' :
        editStatus === 'completed' ? 'completed' :
        'in_progress';
      const patchCurrentStep =
        editStatus.startsWith('step_') ? parseInt(editStatus.replace('step_', '')) :
        editStatus === 'completed' ? editSteps.length - 1 : 0;

      const res = await fetch(`${apiUrl}/api/project-infos/${projectDetail.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: patchStatus,
          description: editDescription,
          steps: editSteps,
          current_step: patchCurrentStep,
        }),
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to update project");
      }
      // Refresh project list
      const updated = { ...projectDetail, status: patchStatus, description: editDescription, steps: editSteps, current_step: patchCurrentStep };
      setProjectDetail(updated);
      setProjects(projects => projects.map(p => p.id === updated.id ? updated : p));
      closeModal();
    } catch (err) {
      setSaveError((err as Error).message);
    } finally {
      setSaving(false);
    }
  }, [projectDetail, editStatus, editDescription, editSteps, closeModal]);

  // All useEffect hooks at the top
  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/sign-in?redirect=/dashboard");
    }
  }, [isLoaded, isSignedIn, router]);
  useEffect(() => {
    const fetchProjects = async () => {
      setLoading(true);
      setError(null);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/project-infos`);
        if (!res.ok) throw new Error("Failed to fetch projects");
        const data = await res.json();
        setProjects(data.projects || []);
      } catch (err) {
        setError((err as Error).message);
      } finally {
        setLoading(false);
      }
    };
    fetchProjects();
  }, []);
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
        const res = await fetch(`${apiUrl}/api/users/all`);
        if (!res.ok) return;
        const data = await res.json();
        setUsers(data.users || []);
      } catch {}
    };
    fetchUsers();
  }, []);
  useEffect(() => {
    // Fetch user role on mount
    const fetchRole = async () => {
      if (!isLoaded || !isSignedIn || !userId) return;
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "https://api.example.com";
        const response = await fetch(`${apiUrl}/api/users?clerk_id=${userId}`);
        if (!response.ok) return;
        const result = await response.json();
        setRole(result.data?.role);
        if (result.data?.role !== 'admin') {
          router.replace("/");
        }
      } catch {}
    };
    fetchRole();
  }, [isLoaded, isSignedIn, userId, router]);
  useEffect(() => {
    // Keyboard shortcut: Ctrl+B to toggle sidebar
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'b') {
        e.preventDefault();
        setSidebarOpen(open => !open);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  useEffect(() => {
    const stored = localStorage.getItem('adminSidebarOpen');
    if (stored !== null) {
      setSidebarOpen(stored === 'true');
    }
  }, []);
  useEffect(() => {
    localStorage.setItem('adminSidebarOpen', sidebarOpen ? 'true' : 'false');
  }, [sidebarOpen]);

  // Fetch insights when Insights tab is active
  useEffect(() => {
    if (activeTab === 'insights') {
      setInsightsLoading(true);
      setInsightsError(null);
      fetch('/api/admin/insights')
        .then(res => {
          if (!res.ok) throw new Error('Failed to fetch insights');
          return res.json();
        })
        .then(data => setInsights(data))
        .catch(err => setInsightsError(err.message))
        .finally(() => setInsightsLoading(false));
    }
  }, [activeTab]);

  // Compute dynamic status options based on steps
  const getStatusOptions = () => {
    if (!editSteps || editSteps.length === 0) {
      return [{ value: 'not_started', label: 'Not Started' }];
    }
    const stepOptions = editSteps.map((step, idx) => ({ value: `step_${idx}`, label: step.name }));
    return [
      { value: 'not_started', label: 'Not Started' },
      ...stepOptions,
      { value: 'completed', label: 'Completed' },
    ];
  };
  const statusOptions = getStatusOptions();

  // When status changes, update current_step and steps completion
  const handleStatusChange = (value: string) => {
    setEditStatus(value);
    if (value === 'not_started') {
      setEditCurrentStep(0);
      setEditSteps(steps => steps.map((step, i) => ({ ...step, completed: false })));
    } else if (value.startsWith('step_')) {
      const idx = parseInt(value.replace('step_', ''));
      setEditCurrentStep(idx);
      setEditSteps(steps => steps.map((step, i) => ({ ...step, completed: i < idx })));
    } else if (value === 'completed') {
      setEditCurrentStep(editSteps.length - 1);
      setEditSteps(steps => steps.map(step => ({ ...step, completed: true })));
    }
  };

  // When steps change, sync status if needed
  useEffect(() => {
    // If no steps, force status to 'not_started'
    if (!editSteps || editSteps.length === 0) {
      setEditStatus('not_started');
      setEditCurrentStep(0);
      return;
    }
    // If status is a step that no longer exists, reset
    if (editStatus.startsWith('step_')) {
      const idx = parseInt(editStatus.replace('step_', ''));
      if (idx >= editSteps.length) {
        setEditStatus('not_started');
        setEditCurrentStep(0);
      }
    }
    // If status is 'completed' but not all steps are completed, reset
    if (editStatus === 'completed' && editSteps.some(s => !s.completed)) {
      setEditStatus('not_started');
      setEditCurrentStep(0);
    }
  }, [editSteps]);

  // Compute all unique step names (case-insensitive) from all projects for the filter
  const stepNameMap = new Map<string, string>();
  projects.forEach(p => {
    if (Array.isArray(p.steps)) {
      p.steps.forEach(s => {
        const key = s.name.trim().toLowerCase();
        if (key && !stepNameMap.has(key)) {
          // Capitalize for display
          stepNameMap.set(key, key.charAt(0).toUpperCase() + key.slice(1));
        }
      });
    }
  });
  const allStepNames = Array.from(stepNameMap.entries()); // [ [value, label], ... ]
  const filterStatusOptions = [
    { value: 'all', label: 'All' },
    { value: 'not_started', label: 'Not Started' },
    ...allStepNames.map(([value, label]) => ({ value, label })),
    { value: 'completed', label: 'Completed' },
  ];

  // Filter projects by status and search
  const filteredProjects = projects.filter(project => {
    // Status filter
    let matchesStatus = filterStatus === 'all';
    if (!matchesStatus) {
      if (filterStatus === 'not_started') matchesStatus = project.status === 'not_started';
      else if (filterStatus === 'completed') matchesStatus = project.status === 'completed';
      else {
        // Match by lowercased step name
        const stepName = filterStatus;
        matchesStatus =
          project.steps &&
          typeof project.current_step === 'number' &&
          project.steps[project.current_step]?.name.trim().toLowerCase() === stepName;
      }
    }
    // Search filter
    let matchesSearch = true;
    if (searchKey.trim() !== '') {
      // Only compare the part after 'PRJ'
      const key = project.projectkey?.toLowerCase() || '';
      matchesSearch = key.startsWith('prj') && key.slice(3).startsWith(searchKey.trim().toLowerCase());
    }
    return matchesStatus && matchesSearch;
  });

  // Add a variable for sidebar width (for padding)
  const sidebarWidth = sidebarOpen ? 'pl-0 sm:pl-5 pr-0 sm:pr-5' : 'pl-0 sm:pl-5 pr-0 sm:pr-5';

  // Helper to get client email from user_id if not present
  const getClientEmail = (project: Project) => {
    if (project.client_email) return project.client_email;
    if (project.user_id && users.length > 0) {
      const user = users.find(u => u.id === project.user_id);
      if (user) return user.email;
    }
    return 'Unknown';
  };

  // Show loading spinner until role is loaded
  if (typeof role === 'undefined') {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#0c0c14]">
        <Loader2 className="w-10 h-10 text-indigo-500 animate-spin" />
        <p className="mt-4 text-gray-300">Checking permissions...</p>
      </div>
    );
  }

  // Only after role is loaded, check for forbidden
  if (role === 'client') {
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

  return (
    <div className="min-h-screen bg-[#0c0c14] text-white flex">
      {/* Sidebar */}
      <aside
        ref={sidebarRef}
        className={`transition-all duration-300 bg-[#181824]/90 border-r border-white/10 shadow-lg h-screen sticky top-0 z-40 flex flex-col ${
          sidebarOpen ? "w-64" : "w-16"
        }`}
      >
        <div className="flex items-center justify-between px-4 py-4 border-b border-white/10">
          <span className={`font-bold text-lg text-white transition-opacity duration-200 ${sidebarOpen ? "opacity-100" : "opacity-0 w-0 overflow-hidden"}`}></span>
          <button
            className="p-2 rounded hover:bg-white/10 transition-colors"
            onClick={() => setSidebarOpen((open) => !open)}
            aria-label={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
          >
            {sidebarOpen ? <ChevronLeft className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />}
          </button>
        </div>
        <nav className="flex-1 px-2 py-4 space-y-2">
          {ADMIN_TABS.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                className={`flex items-center gap-3 w-full px-3 py-3 rounded-lg transition-colors border border-transparent hover:bg-white/[0.06] text-left ${
                  activeTab === tab.key ? "bg-white/[0.08] border-indigo-500" : ""
                }`}
                onClick={() => setActiveTab(tab.key)}
              >
                <Icon className="w-5 h-5 text-indigo-400" />
                {sidebarOpen && <span className="font-medium text-white">{tab.label}</span>}
              </button>
            );
          })}
        </nav>
      </aside>
      {/* Main Content */}
      <div className={`flex-1 transition-all duration-300 ${sidebarWidth}`}>
        <header className="border-b border-white/10 backdrop-blur-md bg-black/20">
          <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
          </div>
        </header>
        <main className="max-w-7xl mx-auto pt-8 px-4 sm:px-8 lg:px-12">
          {/* Only render the active tab's content */}
          {activeTab === "projects" && (
            <div className="mb-8 mt-4">
              <h2 className="text-xl font-semibold text-white mb-6 mt-4">Projects</h2>
              <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:gap-6 mb-8">
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-sm text-gray-400 font-medium" htmlFor="status-filter">Status</label>
                  <div className="w-full sm:w-56">
                    <Listbox value={filterStatus} onChange={setFilterStatus} as={Fragment}>
                      <div className="relative">
                        <Listbox.Button id="status-filter" className="w-full rounded bg-white/[0.04] text-white px-3 py-1.5 border border-white/10 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all text-base h-10">
                          {filterStatusOptions.find(o => o.value === filterStatus)?.label}
                          <ChevronsUpDown className="w-4 h-4 text-gray-400 ml-2" />
                        </Listbox.Button>
                        <Listbox.Options className="absolute mt-1 w-full bg-[#181824] border border-white/10 rounded shadow-lg z-10">
                          {filterStatusOptions.map(option => (
                            <Listbox.Option
                              key={option.value}
                              value={option.value}
                              className={({ active }) =>
                                `cursor-pointer select-none px-4 py-2 ${
                                  active ? 'bg-indigo-600/20 text-indigo-300' : 'text-white'
                                }`
                              }
                            >
                              {({ selected }) => (
                                <span className="flex items-center">
                                  {selected && <Check className="w-4 h-4 text-indigo-400 mr-2" />}
                                  {option.label}
                                </span>
                              )}
                            </Listbox.Option>
                          ))}
                        </Listbox.Options>
                      </div>
                    </Listbox>
                  </div>
                </div>
                <div className="flex-1 flex flex-col gap-2">
                  <label className="text-sm text-gray-400 font-medium" htmlFor="project-search">Project Key</label>
                  <div className="flex w-full sm:w-56 items-center">
                    <span className="bg-white/[0.08] text-white px-5 py-1.5 rounded-l-lg border border-white/10 border-r-0 font-mono text-base h-10 flex items-center">PRJ</span>
                    <input
                      id="project-search"
                      type="text"
                      className="flex-1 bg-white/[0.04] text-white px-3 py-1.5 rounded-r-lg border border-white/10 border-l-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder-gray-400 text-base font-mono h-10"
                      placeholder="Type project key here"
                      value={searchKey}
                      onChange={e => {
                        const val = e.target.value.replace(/[^a-zA-Z0-9]/g, '').slice(0, 6);
                        setSearchKey(val);
                      }}
                    />
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 px-0 sm:px-2 md:px-0">
                {loading ? (
                  <div className="col-span-full flex items-center justify-center h-32">
                    <span className="text-gray-400">Loading projects...</span>
                  </div>
                ) : error ? (
                  <div className="col-span-full flex items-center justify-center h-32">
                    <span className="text-red-400">{error}</span>
                  </div>
                ) : filteredProjects.length === 0 ? (
                  <div className="col-span-full flex items-center justify-center h-32">
                    <span className="text-gray-400">No projects found.</span>
                  </div>
                ) : (
                  filteredProjects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-2xl border border-white/10 bg-white/[0.03] shadow-lg p-6 flex flex-col gap-4 relative"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-mono text-lg text-indigo-300">{project.projectkey}</span>
                        <span className={`px-3 py-1 text-xs font-medium rounded-full ${
                          project.status === "completed"
                            ? "bg-green-500/20 text-green-400"
                            : project.status === "in_progress"
                            ? "bg-blue-500/20 text-blue-400"
                            : "bg-amber-500/20 text-amber-400"
                        }`}>
                          {
                            project.status === 'not_started' ? 'Not Started' :
                            project.status === 'completed' ? 'Completed' :
                            (project.steps && typeof project.current_step === 'number' && project.steps[project.current_step]?.name)
                              ? project.steps[project.current_step].name
                              : 'In Progress'
                          }
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 mb-2">
                        <div className="text-xs text-gray-400">Client Email</div>
                        <div className="text-white text-sm break-all">{getClientEmail(project)}</div>
                      </div>
                      <div className="flex gap-2 mb-2">
                        {project.jiraurl && (
                          <a
                            href={project.jiraurl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg transition-colors text-sm gap-2"
                          >
                            <BarChart2 className="w-4 h-4" /> Jira
                          </a>
                        )}
                        {project.slackurl && (
                          <a
                            href={project.slackurl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center px-4 py-2 bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/30 rounded-lg transition-colors text-sm gap-2"
                          >
                            <BarChart2 className="w-4 h-4" /> Slack
                          </a>
                        )}
                      </div>
                      <button
                        className="mt-auto px-4 py-2 bg-indigo-600/80 text-white rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                        onClick={() => handleViewEdit(project.id)}
                      >
                        View / Edit
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
          {activeTab === "insights" && (
            <div className="mb-8 p-4">
              <h2 className="text-xl font-semibold text-white mb-4">Insights</h2>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 shadow-lg flex flex-col gap-8 min-h-[200px]">
                {insightsLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <span className="text-gray-400">Loading insights...</span>
                  </div>
                ) : insightsError ? (
                  <div className="flex items-center justify-center h-32">
                    <span className="text-red-400">{insightsError}</span>
                  </div>
                ) : insights ? (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                      <InsightCard label="Total Purchases" value={insights.totalPurchases} icon={<DollarSign className="w-6 h-6 text-indigo-400" />} />
                      <InsightCard label="Total Revenue" value={`$${Number(insights.totalRevenue).toLocaleString()}`} icon={<DollarSign className="w-6 h-6 text-green-400" />} />
                      <InsightCard label="Total Projects" value={insights.totalProjects} icon={<Layers className="w-6 h-6 text-blue-400" />} />
                      <InsightCard label="Active Clients" value={insights.totalActiveClients} icon={<Users className="w-6 h-6 text-amber-400" />} />
                      {/* <InsightCard label="New Projects This Month" value={insights.newProjectsThisMonth} icon={<Plus className="w-6 h-6 text-indigo-400" />} /> */}
                      {/* <InsightCard label="Active Subscriptions" value={insights.activeSubscriptions} icon={<CheckCircle className="w-6 h-6 text-green-400" />} /> */}
                      {/* <InsightCard label="Most Popular Status" value={insights.mostPopularStatus ? insights.mostPopularStatus.replace('_', ' ') : 'N/A'} icon={<BarChart2 className="w-6 h-6 text-blue-400" />} /> */}
                      {/* <InsightCard label="Avg. Completion Time (days)" value={insights.avgCompletionDays ? insights.avgCompletionDays.toFixed(1) : 'N/A'} icon={<Loader2 className="w-6 h-6 text-indigo-400" />} /> */}
                    </div>
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Projects by Status</h3>
                        <ul className="space-y-2">
                          {Object.entries(insights.statusCounts || {}).map(([status, count]) => (
                            <li key={status} className="flex justify-between items-center bg-white/[0.04] rounded px-4 py-2">
                              <span className="capitalize text-white">{status.replace('_', ' ')}</span>
                              <span className="font-mono text-indigo-300">{String(count)}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Top Clients (by Projects)</h3>
                        <ul className="space-y-2">
                          {insights.topClients && insights.topClients.length > 0 ? insights.topClients.map((client: any) => (
                            <li key={client.userId} className="flex justify-between items-center bg-white/[0.04] rounded px-4 py-2">
                              <span className="text-white">{client.email}</span>
                              <span className="font-mono text-indigo-300">{client.projectCount} projects</span>
                            </li>
                          )) : <li className="text-gray-400">No data</li>}
                        </ul>
                      </div>
                    </div>
                    <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Top Revenue Clients</h3>
                        <ul className="space-y-2">
                          {insights.topRevenueClients && insights.topRevenueClients.length > 0 ? insights.topRevenueClients.map((client: any) => (
                            <li key={client.userId} className="flex justify-between items-center bg-white/[0.04] rounded px-4 py-2">
                              <span className="text-white">{client.email}</span>
                              <span className="font-mono text-green-300">${Number(client.revenue).toLocaleString()}</span>
                            </li>
                          )) : <li className="text-gray-400">No data</li>}
                        </ul>
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-white mb-2">Clients With No Active Projects</h3>
                        <div className="flex items-center gap-2 bg-white/[0.04] rounded px-4 py-2">
                          <span className="font-mono text-indigo-300 text-lg">{insights.numClientsWithNoActiveProjects}</span>
                          <span className="text-white">clients</span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-white mb-2">Monthly Revenue Trend (Last 6 Months)</h3>
                      <ul className="flex flex-wrap gap-4">
                        {insights.monthlyRevenue && Object.entries(insights.monthlyRevenue).map(([month, revenue]) => (
                          <li key={month} className="flex flex-col items-center bg-white/[0.04] rounded px-4 py-2 min-w-[100px]">
                            <span className="font-mono text-indigo-300">{month}</span>
                            <span className="font-mono text-green-300">${Number(revenue).toLocaleString()}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="mt-8">
                      <h3 className="text-lg font-semibold text-white mb-2">Recent Purchases</h3>
                      <ul className="space-y-2">
                        {insights.recentPurchases && insights.recentPurchases.length > 0 ? insights.recentPurchases.map((purchase: any, idx: number) => (
                          <li key={purchase.id || idx} className="flex flex-col sm:flex-row sm:justify-between sm:items-center bg-white/[0.04] rounded px-4 py-2">
                            <span className="text-white">{purchase.email || purchase.user_email || 'Unknown'}</span>
                            <span className="font-mono text-indigo-300">${Number(purchase.amount).toLocaleString()}</span>
                            <span className="text-xs text-gray-400">{purchase.payment_date ? new Date(purchase.payment_date).toLocaleString() : ''}</span>
                          </li>
                        )) : <li className="text-gray-400">No recent purchases</li>}
                      </ul>
                    </div>
                  </>
                ) : (
                  <span className="text-gray-400">No insights data available.</span>
                )}
              </div>
            </div>
          )}
          {activeTab === "subscriptions" && (
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-white mb-4">Subscriptions</h2>
              <div className="rounded-xl border border-white/10 bg-white/[0.03] p-8 shadow-lg flex items-center justify-center min-h-[200px]">
                <span className="text-gray-400">Subscriptions coming soon...</span>
              </div>
            </div>
          )}
          {/* Modal for project detail/edit (remains outside tab switch) */}
          {modalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
              <div className="bg-[#181824] rounded-xl shadow-2xl max-w-lg w-full p-8 relative border border-white/10 max-h-[80vh] overflow-y-auto">
                <button
                  className="absolute top-4 right-4 text-gray-400 hover:text-white text-xl"
                  onClick={closeModal}
                  aria-label="Close"
                >
                  &times;
                </button>
                {modalLoading ? (
                  <div className="flex items-center justify-center h-32">
                    <span className="text-gray-400">Loading project details...</span>
                  </div>
                ) : modalError ? (
                  <div className="flex items-center justify-center h-32">
                    <span className="text-red-400">{modalError}</span>
                  </div>
                ) : projectDetail ? (
                  <div>
                    <h2 className="text-2xl font-bold mb-4">Edit Project</h2>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Project Key</label>
                      <div className="font-mono text-indigo-300 bg-white/[0.04] rounded px-3 py-2">{projectDetail.projectkey}</div>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Status</label>
                      <Listbox value={editStatus} onChange={handleStatusChange}>
                        <div className="relative">
                          <Listbox.Button className="w-full rounded bg-white/[0.04] text-white px-3 py-2 border border-white/10 flex justify-between items-center focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all">
                            {statusOptions.find(o => o.value === editStatus)?.label}
                            <ChevronsUpDown className="w-4 h-4 text-gray-400 ml-2" />
                          </Listbox.Button>
                          <Listbox.Options className="absolute mt-1 w-full bg-[#181824] border border-white/10 rounded shadow-lg z-10">
                            {statusOptions.map(option => (
                              <Listbox.Option
                                key={option.value}
                                value={option.value}
                                className={({ active }) =>
                                  `cursor-pointer select-none px-4 py-2 ${
                                    active ? 'bg-indigo-600/20 text-indigo-300' : 'text-white'
                                  }`
                                }
                              >
                                {({ selected }) => (
                                  <span className="flex items-center">
                                    {selected && <Check className="w-4 h-4 text-indigo-400 mr-2" />}
                                    {option.label}
                                  </span>
                                )}
                              </Listbox.Option>
                            ))}
                          </Listbox.Options>
                        </div>
                      </Listbox>
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Description</label>
                      <textarea
                        className="w-full rounded bg-white/[0.04] text-white px-3 py-2 border border-white/10 focus:outline-none"
                        value={editDescription}
                        onChange={e => setEditDescription(e.target.value)}
                        rows={3}
                      />
                    </div>
                    {/* Step Editor */}
                    <div className="mb-4">
                      <label className="block text-sm font-medium text-gray-400 mb-1">Steps</label>
                      <div className="space-y-2">
                        {editSteps.map((step, idx) => (
                          <div key={idx} className={`flex items-center gap-2 p-2 rounded-lg ${editCurrentStep === idx ? "bg-indigo-900/30 border border-indigo-500" : "bg-white/[0.02] border border-white/10"}`}>
                            <button type="button" onClick={() => handleMoveStep(idx, idx - 1)} disabled={idx === 0} className="text-gray-400 hover:text-white focus:outline-none"><GripVertical className="w-4 h-4" /></button>
                            <input
                              className="flex-1 bg-transparent border-none outline-none text-white px-2 py-1 rounded"
                              value={step.name}
                              onChange={e => handleStepNameChange(idx, e.target.value)}
                            />
                            <button type="button" onClick={() => handleStepCompletedToggle(idx)} className="text-green-400 hover:text-green-300 focus:outline-none">
                              {step.completed ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                            </button>
                            <button type="button" onClick={() => handleSetCurrentStep(idx)} className={`text-indigo-400 hover:text-indigo-300 focus:outline-none ${editCurrentStep === idx ? "font-bold" : ""}`}>Step</button>
                            <button type="button" onClick={() => handleRemoveStep(idx)} className="text-red-400 hover:text-red-300 focus:outline-none"><XIcon className="w-5 h-5" /></button>
                          </div>
                        ))}
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            className="flex-1 bg-white/[0.04] text-white px-2 py-1 rounded border border-white/10 focus:outline-none"
                            placeholder="Add new step..."
                            value={newStepName}
                            onChange={e => setNewStepName(e.target.value)}
                            onKeyDown={e => { if (e.key === "Enter") handleAddStep(); }}
                          />
                          <button type="button" onClick={handleAddStep} className="px-2 py-1 bg-indigo-600/80 text-white rounded-lg hover:bg-indigo-700 transition-colors flex items-center gap-1"><Plus className="w-4 h-4" /> Add</button>
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 mt-2">Click <span className="text-indigo-400 font-semibold">Step</span> to set the current step. Use <span className="text-green-400 font-semibold">✓</span> to mark as completed.</div>
                    </div>
                    <div className="flex justify-end mt-6 gap-2">
                      <button
                        className="px-4 py-2 rounded-lg bg-gray-600/80 text-white hover:bg-gray-700 transition-colors"
                        onClick={closeModal}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 rounded-lg bg-indigo-600/80 text-white hover:bg-indigo-700 transition-colors font-semibold"
                        onClick={handleSave}
                        disabled={saving}
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                    </div>
                    {saveError && <div className="text-red-400 text-sm mt-2 text-center">{saveError}</div>}
                  </div>
                ) : null}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

function InsightCard({ label, value, icon }: { label: string; value: any; icon: React.ReactNode }) {
  return (
    <div className="flex flex-col items-center justify-center bg-white/[0.06] rounded-xl p-6 shadow border border-white/10">
      <div className="mb-2">{icon}</div>
      <div className="text-2xl font-bold text-white mb-1">{value}</div>
      <div className="text-sm text-gray-400 font-medium">{label}</div>
    </div>
  );
} 