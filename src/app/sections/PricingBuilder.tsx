'use client';
import React, { useState, useEffect } from 'react';
import { Check, Plus, ChevronDown, ChevronUp } from 'lucide-react';
import { motion } from 'framer-motion';

export type ServiceCategory = 'ai' | 'digital' | 'creative' | 'growth';

export interface Service {
  id: string;
  title: string;
  description: string;
  price: number;
  category: ServiceCategory;
  popular: boolean;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  features: string[];
  popular: boolean;
}

export const services: Service[] = [
  { id: 'ai-nlp', title: 'Natural Language Processing', description: 'Add language understanding capabilities to your applications', price: 2500, category: 'ai', popular: true },
  { id: 'ai-vision', title: 'Computer Vision', description: 'Image and video analysis for your applications', price: 3000, category: 'ai', popular: false },
  { id: 'digital-web', title: 'Web Application', description: 'Modern, responsive web applications built with Next.js', price: 5000, category: 'digital', popular: true },
  { id: 'creative-brand', title: 'Brand Identity', description: 'Complete brand identity development', price: 3500, category: 'creative', popular: true },
  { id: 'growth-analytics', title: 'Analytics Setup', description: 'Complete analytics and reporting setup', price: 1500, category: 'growth', popular: false }
];

export const subscriptionPlans: SubscriptionPlan[] = [
  { id: 'starter', name: 'Starter', description: 'For small businesses starting with AI', price: 999, features: ['1 AI Model', 'Basic Support', '5 User Accounts'], popular: false },
  { id: 'growth', name: 'Growth', description: 'For growing businesses', price: 2499, features: ['3 AI Models', 'Priority Support', '20 User Accounts', 'API Access'], popular: true },
  { id: 'enterprise', name: 'Enterprise', description: 'For large organizations', price: 4999, features: ['Unlimited AI Models', '24/7 Support', 'Unlimited Users', 'Dedicated Account Manager'], popular: false }
];

const PricingBuilder: React.FC = () => {
  const [pricingModel, setPricingModel] = useState<'perService' | 'subscription'>('perService');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<ServiceCategory | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);

  useEffect(() => {
    const calculateTotal = () =>
      selectedServices.reduce((sum, id) => {
        const svc = services.find(s => s.id === id);
        return sum + (svc?.price || 0);
      }, 0);
    setTotalPrice(calculateTotal());
  }, [selectedServices]);

  const toggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleCategory = (cat: ServiceCategory) => {
    setExpandedCategory(expandedCategory === cat ? null : cat);
  };

  const categorized: Record<ServiceCategory, Service[]> = {
    ai: services.filter(s => s.category === 'ai'),
    digital: services.filter(s => s.category === 'digital'),
    creative: services.filter(s => s.category === 'creative'),
    growth: services.filter(s => s.category === 'growth')
  };

  const getRecommendations = (): Service[] => {
    if (!selectedServices.length) return [];
    const selectedCats = selectedServices.map(id => services.find(s => s.id === id)?.category);
    return services.filter(s => !selectedServices.includes(s.id) && !selectedCats.includes(s.category) && s.popular).slice(0, 2);
  };

  const recommendations = getRecommendations();

  return (
    <section id="pricing" className="py-28 px-6 relative w-full">
      <div className="container max-w-7xl mx-auto w-full">
        {/* Header & Toggle */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: '-100px' }}
          className="text-center mb-20"
        >
          <h2 className="text-white text-4xl md:text-5xl font-bold mb-4">Flexible Pricing</h2>
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            Choose only what you need. Our transparent pricing ensures you never pay for services you don't use.
          </p>
        </motion.div>

        <div className="flex justify-center mb-12 w-full">
          <div className="backdrop-blur-md rounded-lg p-1 shadow-md inline-flex border border-white/10 bg-white/[0.03] w-full max-w-md">
            <button
              onClick={() => setPricingModel('perService')}
              className={`flex-1 px-6 py-3 rounded-md text-sm font-medium ${
                pricingModel === 'perService' ? 'bg-indigo-600/80 text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'
              } transition-colors`}
            >
              Pay Per Deliverable
            </button>
            <button
              onClick={() => setPricingModel('subscription')}
              className={`flex-1 px-6 py-3 rounded-md text-sm font-medium ${
                pricingModel === 'subscription' ? 'bg-indigo-600/80 text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'
              } transition-colors`}
            >
              Subscription
            </button>
          </div>
        </div>

        {pricingModel === 'perService' ? (
          <div className="flex flex-col lg:flex-row backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden shadow-lg w-full">
            {/* Service Selection */}
            <div className="flex-1 border-r border-white/10 p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Select Your Deliverables</h3>
              <div className="space-y-4">
                {Object.entries(categorized).map(([cat, list]) => (
                  <motion.div key={cat} className="border border-white/10 rounded-lg overflow-hidden backdrop-blur-sm w-full">
                    <button
                      onClick={() => toggleCategory(cat as ServiceCategory)}
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-white/[0.03] transition-colors"
                    >
                      <span className="font-medium text-white">
                        {cat === 'ai' && 'AI-Enabled Solutions'}
                        {cat === 'digital' && 'Digital Products & Web'}
                        {cat === 'creative' && 'Creative & Branding'}
                        {cat === 'growth' && 'Growth & Support'}
                      </span>
                      {expandedCategory === cat ? <ChevronUp className="h-5 w-5 text-indigo-300" /> : <ChevronDown className="h-5 w-5 text-indigo-300" />}
                    </button>
                    {expandedCategory === cat && (
                      <div className="border-t border-white/10 p-4 w-full">
                        <div className="space-y-3">
                          {list.map(service => (
                            <div
                              key={service.id}
                              className={`flex items-start p-3 rounded-lg cursor-pointer transition-colors w-full ${
                                selectedServices.includes(service.id) ? 'bg-indigo-600/20' : 'hover:bg-white/[0.03]'
                              }`}
                              onClick={() => toggleService(service.id)}
                            >
                              <div className="w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center mr-3 mt-0.5">
                                {selectedServices.includes(service.id) ? (
                                  <div className="bg-indigo-600 border-indigo-600 w-full h-full flex items-center justify-center">
                                    <Check className="h-3 w-3 text-white" />
                                  </div>
                                ) : (
                                  <div className="border-white/30 w-full h-full" />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <h4 className="font-medium text-white">{service.title}</h4>
                                  {service.popular ? (
                                    <span className="ml-2 px-2 py-0.5 whitespace-nowrap bg-indigo-900/50 text-indigo-200 text-xs rounded-full border border-indigo-500/30">Popular</span>
                                  ) : (
                                    <span className="ml-2 px-2 py-0.5 invisible" />
                                  )}
                                </div>
                                <p className="text-sm text-gray-300 mt-1">{service.description}</p>
                                <span className="font-semibold text-indigo-200 mt-1 block">${service.price.toLocaleString()}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
              {recommendations.length > 0 && (
                <div className="mt-8 pt-6 border-t border-white/10 w-full">
                  <h4 className="font-medium text-white mb-4">Recommended Services</h4>
                  <div className="space-y-3">
                    {recommendations.map(service => (
                      <div
                        key={service.id}
                        className="flex items-start p-3 rounded-lg border border-indigo-500/30 bg-indigo-600/10 cursor-pointer hover:bg-indigo-600/20 transition-colors w-full"
                        onClick={() => toggleService(service.id)}
                      >
                        <Plus className="h-3 w-3 text-indigo-300 mr-3 mt-0.5 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <h4 className="font-medium text-white">{service.title}</h4>
                            <span className="font-semibold text-indigo-200 ml-2">${service.price.toLocaleString()}</span>
                          </div>
                          <p className="text-sm text-gray-300 mt-1">{service.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            {/* Order Summary */}
            <div className="w-full lg:w-1/3 bg-white/[0.02] backdrop-blur-md p-8">
              <h3 className="text-2xl font-bold text-white mb-6">Your Solution</h3>
              {selectedServices.length === 0 ? (
                <div className="text-center py-10">
                  <p className="text-gray-400 mb-4">No services selected yet</p>
                  <p className="text-sm text-gray-500">Select services from the left to build your custom solution</p>
                </div>
              ) : (
                <>
                  <div className="mb-6 space-y-4">
                    {selectedServices.map(id => {
                      const svc = services.find(s => s.id === id);
                      return svc ? (
                        <div
                          key={svc.id}
                          className="flex justify-between w-full cursor-pointer hover:bg-white/[0.03] p-2 rounded-md"
                          onClick={() => toggleService(svc.id)}
                        >
                          <span className="text-gray-300">{svc.title}</span>
                          <span className="font-medium text-indigo-200">${svc.price.toLocaleString()}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                  <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center w-full">
                    <span className="font-bold text-lg text-white">Total</span>
                    <span className="font-bold text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">${totalPrice.toLocaleString()}</span>
                  </div>
                  <button className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white text-lg font-medium rounded-lg hover:from-indigo-500 hover:to-indigo-600 transition-all shadow-lg shadow-indigo-900/50 mt-6">Get Started</button>
                  <p className="text-sm text-gray-400 mt-4 text-center">No commitment. Start building today.</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full">
            {subscriptionPlans.map(plan => (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true }}
                className={`backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-700/20 hover:-translate-y-1 w-full ${
                  plan.popular ? 'border-indigo-500/50 shadow-lg shadow-indigo-700/20 relative' : ''
                }`}
              >
                {plan.popular && (
                  <div className="absolute top-0 right-0 bg-indigo-600/80 text-white text-xs font-semibold px-3 py-1 rounded-bl">
                    Most Popular
                  </div>
                )}
                <div className="p-8 w-full">
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-300 mb-6">{plan.description}</p>
                  <div className="mb-6 flex items-baseline">
                    <span className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">${plan.price}</span>
                    <span className="text-gray-400 ml-1">/month</span>
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat, i) => (
                      <li key={i} className="flex items-start">
                        <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-indigo-400" />
                        <span className="text-gray-300">{feat}</span>
                      </li>
                    ))}
                  </ul>
                  <button
                    className={`w-full py-3 rounded-lg font-medium transition-colors ${
                      plan.popular
                        ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white hover:from-indigo-500 hover:to-indigo-600 shadow-lg shadow-indigo-900/30'
                        : 'bg-white/10 text-white hover:bg-white/20 border border-white/10'
                    }`}
                  >
                    Choose Plan
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default PricingBuilder;
