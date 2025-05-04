'use client';

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Check, Code, LucideIcon, MessageSquare, Settings, Zap, FileCode, BarChart, Workflow, Layers, CreditCard, GitPullRequest, Slack } from 'lucide-react';

// Process step type
interface ProcessStep {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  color: string;
}

// Tech stack item type
interface TechItem {
  id: string;
  name: string;
  description: string;
  icon: string; // SVG or path to image
  category: 'frontend' | 'backend' | 'design' | 'tools';
}

// Process steps data
const processSteps: ProcessStep[] = [
  {
    id: 'discovery',
    title: 'Discovery & Planning',
    description: 'We analyze your needs, define project scope, and create a detailed roadmap for implementation.',
    icon: MessageSquare,
    color: 'bg-[#222]',
    // color: 'bg-[#222]',
    // color: 'from-violet-600 to-purple-700',
  },
  {
    id: 'design',
    title: 'UI/UX Design',
    description: 'Our design team creates intuitive interfaces that delight users while achieving your business goals.',
    icon: Layers,
    color: 'bg-[#222]',
    // color: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'development',
    title: 'Development',
    description: 'Our engineers build your solution using modern technologies and best practices for performance and security.',
    icon: Code,
    color: 'bg-[#222]',
    // color: 'from-green-600 to-teal-700',
  },
  {
    id: 'testing',
    title: 'Testing & QA',
    description: 'Rigorous testing ensures your product works flawlessly across all devices and use cases.',
    icon: Settings,
    color: 'bg-[#222]',
    // color: 'from-orange-600 to-red-700',
  },
  {
    id: 'launch',
    title: 'Launch & Support',
    description: 'We deploy your solution to production and provide ongoing support to ensure continued success.',
    icon: Zap,
    color: 'bg-[#222]',
    // color: 'from-pink-600 to-rose-700',
  }
];

// Tech stack data
const techStack: TechItem[] = [
  {
    id: 'nextjs',
    name: 'Next.js',
    description: 'React framework for production with server-side rendering and static site generation',
    icon: '/icons/nextjs.svg',
    category: 'frontend'
  },
  {
    id: 'tailwind',
    name: 'Tailwind CSS',
    description: 'Utility-first CSS framework for rapid UI development',
    icon: '/icons/tailwind.svg',
    category: 'frontend'
  },
  {
    id: 'framer',
    name: 'Framer Motion',
    description: 'Production-ready motion library for React',
    icon: '/icons/framer.svg',
    category: 'frontend'
  },
  {
    id: 'threejs',
    name: 'React Three Fiber',
    description: 'React renderer for Three.js',
    icon: '/icons/threejs.svg',
    category: 'frontend'
  },
  {
    id: 'typescript',
    name: 'TypeScript',
    description: 'Strongly typed programming language that builds on JavaScript',
    icon: '/icons/typescript.svg',
    category: 'frontend'
  },
  {
    id: 'api',
    name: 'REST/GraphQL APIs',
    description: 'Flexible API integration for data exchange',
    icon: '/icons/api.svg',
    category: 'backend'
  }
];

// Integration steps - UNCHANGED as requested
const integrationSteps = [
  {
    id: 'payment',
    title: 'Payment Processing',
    description: 'Secure payment collection through Stripe',
    icon: CreditCard,
    color: 'bg-[#222]',
    // color: 'from-violet-600 to-purple-700',
  },
  {
    id: 'project',
    title: 'Project Management',
    description: 'Automated ticket creation in Jira',
    icon: GitPullRequest,
    color: 'bg-[#222]',
    // color: 'from-blue-600 to-indigo-700',
  },
  {
    id: 'notification',
    title: 'Team Notification',
    description: 'Instant team alerts via Slack',
    icon: Slack,
    color: 'bg-[#222]',
    // color: 'from-green-600 to-teal-700',
  }
];

const ProcessSection: React.FC = () => {
  const [activeStep, setActiveStep] = useState<string>('discovery');
  const [activeTechCategory, setActiveTechCategory] = useState<'frontend' | 'backend' | 'design' | 'tools'>('frontend');

  return (
    <section id='process' className="py-28 px-6 relative w-full">
      <div className="container max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-20"
        >
          <h2 className="text-white text-4xl md:text-5xl font-bold mb-4">Our Process & Technology</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            We combine cutting-edge technology with a proven process to deliver exceptional results for your business.
          </p>
        </motion.div>

        {/* Removed Project Implementation Process section as requested */}

        {/* Client Journey - Redesigned as minimalist timeline */}
        <div className="mb-32">
          <h3 className="text-white text-2xl md:text-3xl font-bold mb-12 text-center">
            Your Journey With Us
          </h3>

          <div className="relative max-w-4xl mx-auto">
            {/* Vertical line for timeline */}
            <div className="absolute left-6 md:left-1/2 top-0 bottom-0 w-px bg-indigo-500/30 transform md:-translate-x-px"></div>
            
            {processSteps.map((step, index) => (
              <motion.div
                key={step.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                whileInView={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                viewport={{ once: true }}
                className={`flex items-start mb-16 last:mb-0 ${
                  index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'
                }`}
              >
                {/* Timeline dot */}
                <div className="absolute left-6 md:left-1/2 transform -translate-x-1/2 mt-6">
                  <div className={`w-3 h-3 rounded-full bg-gradient-to-br ${step.color} border-2 border-black`}></div>
                </div>
                
                {/* Content card */}
                <div className={`ml-14 md:ml-0 md:w-1/2 ${
                  index % 2 === 0 ? 'md:pr-12' : 'md:pl-12'
                }`}>
                  <div className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] p-6">
                    <div className="flex items-start">
                      <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mr-4 flex-shrink-0`}>
                        <step.icon className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <span className="inline-block bg-white/10 text-white text-xs font-bold rounded-full px-3 py-1 mb-1">
                          Step {index + 1}
                        </span>
                        <h4 className="text-white text-lg font-bold mb-2">{step.title}</h4>
                        <p className="text-gray-300 text-sm">{step.description}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

{/*         
        <div className="mb-32">
          <h3 className="text-white text-2xl md:text-3xl font-bold mb-12 text-center">
            Our Technical Stack
          </h3>

          <div className="mb-8 flex justify-center">
            <div className="backdrop-blur-md rounded-lg p-1 shadow-md inline-flex border border-white/10 bg-white/[0.03]">
              <button
                onClick={() => setActiveTechCategory('frontend')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeTechCategory === 'frontend' ? 'bg-indigo-600/80 text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'
                } transition-colors`}
              >
                Frontend
              </button>
              <button
                onClick={() => setActiveTechCategory('backend')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeTechCategory === 'backend' ? 'bg-indigo-600/80 text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'
                } transition-colors`}
              >
                Backend
              </button>
              <button
                onClick={() => setActiveTechCategory('design')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeTechCategory === 'design' ? 'bg-indigo-600/80 text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'
                } transition-colors`}
              >
                Design
              </button>
              <button
                onClick={() => setActiveTechCategory('tools')}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  activeTechCategory === 'tools' ? 'bg-indigo-600/80 text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'
                } transition-colors`}
              >
                Tools
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {techStack
              .filter(tech => tech.category === activeTechCategory)
              .map((tech, index) => (
                <motion.div
                  key={tech.id}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] p-6"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className="w-16 h-16 rounded-full bg-[#222] flex items-center justify-center mb-4">
                      <FileCode className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-white text-lg font-bold mb-2">{tech.name}</h4>
                    <p className="text-gray-300 text-sm">{tech.description}</p>
                  </div>
                </motion.div>
              ))}
          </div>
        </div> */}

        {/* Integration Flow - UNCHANGED as requested */}
        <div>
          <h3 className="text-white text-2xl md:text-3xl font-bold mb-12 text-center">
            Seamless Integrations
          </h3>

          <div className="flex flex-col md:flex-row items-center md:items-start justify-center space-y-6 md:space-y-0 md:space-x-6">
            {integrationSteps.map((step, index) => (
              <React.Fragment key={step.id}>
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.2 }}
                  viewport={{ once: true }}
                  className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] p-6 w-full md:w-64"
                >
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-16 h-16 rounded-full bg-gradient-to-br ${step.color} flex items-center justify-center mb-4`}>
                      <step.icon className="w-8 h-8 text-white" />
                    </div>
                    <h4 className="text-white text-lg font-bold mb-2">{step.title}</h4>
                    <p className="text-gray-300 text-sm">{step.description}</p>
                  </div>
                </motion.div>
                
                {index < integrationSteps.length - 1 && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    whileInView={{ opacity: 1 }}
                    transition={{ duration: 0.5, delay: index * 0.2 + 0.1 }}
                    viewport={{ once: true }}
                    className="hidden md:block"
                  >
                    <ArrowRight className="w-6 h-6 text-indigo-400 mt-16" />
                  </motion.div>
                )}
              </React.Fragment>
            ))}
          </div>
          
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
            viewport={{ once: true }}
            className="mt-12 backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] p-6 text-center max-w-2xl mx-auto"
          >
            <h4 className="text-white text-lg font-bold mb-2">End-to-End Automation</h4>
            <p className="text-gray-300">
              From payment processing to project creation and team communication, our workflow seamlessly connects all services without manual intervention.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default ProcessSection;