'use client';
import React, { useState, useEffect } from 'react';
import { Check, Plus, ChevronDown, ChevronUp, Loader2, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import CheckoutButton from '../api/payment/CheckoutButton';

// Define types based on your API schema
export type ServiceCategory = 'ai' | 'digital' | 'creative' | 'growth';

interface Category {
  id: string;
  name: string;
  description: string | null;
  base_id: string | null;
  order_position: number | null;
  created_at: string;
  updated_at: string;
}

interface Deliverable {
  id: string;
  service_category_id: string;
  name: string;
  description: string | null;
  base_price: number | null;
  is_active: boolean;
  complexity_level: string | null;
  created_at: string;
  updated_at: string;
  service_category: {
    id: string;
    name: string;
    base_id: string | null;
    created_at: string;
    updated_at: string;
    description: string | null;
    order_position: number | null;
  };
}

export interface Service {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  category: ServiceCategory;
  categoryId: string;
}

// Update the SubscriptionPlan interface to match the API response
export interface SubscriptionPlan {
  id: string;
  name: string;
  description: string;
  monthly_price: number;
  yearly_price: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Default subscription plans (fallback)
const defaultSubscriptionPlans = [
  { 
    id: 'starter', 
    name: 'Starter', 
    description: 'For small businesses starting with AI', 
    monthly_price: 999, 
    yearly_price: 9999,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: 'growth', 
    name: 'Growth', 
    description: 'For growing businesses', 
    monthly_price: 2499, 
    yearly_price: 24990,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  { 
    id: 'enterprise', 
    name: 'Enterprise', 
    description: 'For large organizations', 
    monthly_price: 4999, 
    yearly_price: 49990,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

// Helper function to map API category names to ServiceCategory type
const mapCategoryNameToType = (name: string): ServiceCategory => {
  switch (name) {
    case 'AI-Enabled Solutions': return 'ai';
    case 'Digital Products & Web': return 'digital';
    case 'Creative & Branding': return 'creative';
    case 'Growth & Support': return 'growth';
    default: return 'ai';
  }
};

const PricingBuilder: React.FC = () => {
  const [pricingModel, setPricingModel] = useState<'perService' | 'subscription'>('perService');
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [expandedCategory, setExpandedCategory] = useState<ServiceCategory | null>(null);
  const [totalPrice, setTotalPrice] = useState(0);
  const [services, setServices] = useState<Service[]>([]);
  const [subscriptionPlans, setSubscriptionPlans] = useState<SubscriptionPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [showSubscriptionCheckout, setShowSubscriptionCheckout] = useState(false);

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Fetch categories
        const categoriesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/categories`);
        if (!categoriesResponse.ok) {
          throw new Error('Failed to fetch categories');
        }
        const categoriesData: Category[] = await categoriesResponse.json();
        
        // Fetch deliverables
        const deliverablesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/deliverables`);
        if (!deliverablesResponse.ok) {
          throw new Error('Failed to fetch deliverables');
        }
        const deliverablesData: Deliverable[] = await deliverablesResponse.json();
        
        // Fetch subscription tiers
        const subsResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/subscription-tiers`);
        if (!subsResponse.ok) {
          throw new Error('Failed to fetch subscription tiers');
        }
        const subscriptionData = await subsResponse.json();
        
        // Process data to match your component's expected format
        const processedServices: Service[] = deliverablesData
            .filter(deliverable => deliverable.is_active)
            .map((deliverable) => {
                // Find the category for this deliverable
                const category = categoriesData.find(
                cat => cat.id === deliverable.service_category_id
                ) || deliverable.service_category;
                
                return {
                id: deliverable.id,
                title: deliverable.name,
                description: deliverable.description || `Professional ${deliverable.name} service tailored to your needs`,
                price: deliverable.base_price || 1500, // Fallback price if null
                category: mapCategoryNameToType(category.name),
                categoryId: deliverable.service_category_id
                };
            });
        
        setServices(processedServices);
        setSubscriptionPlans(subscriptionData.filter((plan: any) => plan.is_active));
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load services. Please try again later.');
        
        // Fallback to default data
        setServices([
          { id: 'ai-nlp', title: 'Natural Language Processing', description: 'Add language understanding capabilities to your applications', price: 2500, category: 'ai', categoryId: 'ai-cat' },
          { id: 'ai-vision', title: 'Computer Vision', description: 'Image and video analysis for your applications', price: 3000, category: 'ai', categoryId: 'ai-cat' },
          { id: 'digital-web', title: 'Web Application', description: 'Modern, responsive web applications built with Next.js', price: 5000, category: 'digital', categoryId: 'digital-cat' },
          { id: 'creative-brand', title: 'Brand Identity', description: 'Complete brand identity development', price: 3500, category: 'creative', categoryId: 'creative-cat' },
          { id: 'growth-analytics', title: 'Analytics Setup', description: 'Complete analytics and reporting setup', price: 1500, category: 'growth', categoryId: 'growth-cat' }
        ]);
        
        // Use default subscription plans as fallback
        setSubscriptionPlans(defaultSubscriptionPlans);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const calculateTotal = () =>
      selectedServices.reduce((sum, id) => {
        const svc = services.find(s => s.id === id);
        return sum + (svc?.price || 0);
      }, 0);
    setTotalPrice(calculateTotal());
  }, [selectedServices, services]);

  const toggleService = (id: string) => {
    setSelectedServices(prev =>
      prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]
    );
  };

  const toggleCategory = (cat: ServiceCategory) => {
    setExpandedCategory(expandedCategory === cat ? null : cat);
  };

  const selectSubscription = (planId: string) => {
    setSelectedSubscriptionId(planId);
    setShowSubscriptionCheckout(true);
  };

  const backToSubscriptionSelection = () => {
    setSelectedSubscriptionId(null);
    setShowSubscriptionCheckout(false);
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
    
    // Find all services from non-selected categories
    const eligibleServices = services.filter(s => 
        !selectedServices.includes(s.id) && !selectedCats.includes(s.category)
    );
    
    // If no eligible services are found, return empty array
    if (eligibleServices.length === 0) return [];
    
    // Shuffle the eligible services array
    const shuffled = [...eligibleServices].sort(() => Math.random() - 0.5);
    
    // Return up to 2 random services
    return shuffled.slice(0, 2);
  };

  const recommendations = getRecommendations();

  // Find selected subscription plan
  const selectedPlan = subscriptionPlans.find(plan => plan.id === selectedSubscriptionId);

  // Loading state
  if (isLoading) {
    return (
      <section id="pricing" className="py-28 px-6 relative w-full">
        <div className="container max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          <p className="mt-4 text-white">Loading pricing options...</p>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section id="pricing" className="py-28 px-6 relative w-full">
        <div className="container max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-red-500 text-xl">{error}</p>
        </div>
      </section>
    );
  }

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
              onClick={() => {
                setPricingModel('perService');
                setSelectedSubscriptionId(null);
                setShowSubscriptionCheckout(false);
              }}
              className={`flex-1 px-6 py-3 rounded-md text-sm font-medium ${
                pricingModel === 'perService' ? 'bg-indigo-600/80 text-white' : 'text-gray-300 hover:text-white hover:bg-white/5'
              } transition-colors`}
            >
              Pay Per Deliverable
            </button>
            <button
              onClick={() => {
                setPricingModel('subscription');
                setSelectedSubscriptionId(null);
                setShowSubscriptionCheckout(false);
              }}
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
                  <motion.div 
                    key={cat} 
                    className="border border-white/10 rounded-lg overflow-hidden backdrop-blur-sm w-full"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                  >
                    {list.length > 0 && (
                      <>
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
                                    </div>
                                    <p className="text-sm text-gray-300 mt-1">{service.description}</p>
                                    <span className="font-semibold text-indigo-200 mt-1 block">${service.price?.toLocaleString() ?? 'Custom pricing'}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
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
                            <span className="font-semibold text-indigo-200 ml-2">${service.price?.toLocaleString() ?? 'Custom'}</span>
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
                          <span className="font-medium text-indigo-200">${svc.price?.toLocaleString() ?? 'Custom'}</span>
                        </div>
                      ) : null;
                    })}
                  </div>
                  <div className="mt-6 pt-6 border-t border-white/10 flex justify-between items-center w-full">
                    <span className="font-bold text-lg text-white">Total</span>
                    <span className="font-bold text-2xl bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">${totalPrice.toLocaleString()}</span>
                  </div>
                  <div className="mt-6">
                    <CheckoutButton 
                      selectedServices={selectedServices} 
                      totalPrice={totalPrice}
                      isSubscription={false}
                    />
                  </div>
                  <p className="text-sm text-gray-400 mt-4 text-center">No commitment. Start building today.</p>
                </>
              )}
            </div>
          </div>
        ) : (
          <AnimatePresence mode="wait">
            {!showSubscriptionCheckout ? (
              <motion.div 
                key="plan-selection"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full"
              >
                {subscriptionPlans.map((plan) => (
                  <motion.div
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    viewport={{ once: true }}
                    className="backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-indigo-700/20 hover:-translate-y-1 w-full"
                  >
                    <div className="p-8 w-full">
                      <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                      <p className="text-gray-300 mb-6">{plan.description || `${plan.name} subscription tier`}</p>
                      <div className="mb-6 flex items-baseline">
                        <span className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">${plan.monthly_price}</span>
                        <span className="text-gray-400 ml-1">/month</span>
                      </div>
                      <ul className="space-y-3 mb-8">
                        <li className="flex items-start">
                          <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-indigo-400" />
                          <span className="text-gray-300">Full access to all features</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-indigo-400" />
                          <span className="text-gray-300">Priority customer support</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-indigo-400" />
                          <span className="text-gray-300">Regular updates</span>
                        </li>
                      </ul>
                      <button
                        onClick={() => selectSubscription(plan.id)}
                        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-indigo-700 
                          text-white text-lg font-medium rounded-lg transition-all shadow-lg 
                          shadow-indigo-900/50 flex items-center justify-center
                          hover:from-indigo-500 hover:to-indigo-600"
                      >
                        Choose Plan
                      </button>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="subscription-checkout"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="w-full max-w-xl mx-auto backdrop-blur-md rounded-xl border border-white/10 bg-white/[0.03] p-8"
              >
                {selectedPlan && (
                  <>
                    <button 
                      onClick={backToSubscriptionSelection}
                      className="mb-6 text-indigo-400 hover:text-indigo-300 flex items-center"
                    >
                      <ArrowRight className="w-4 h-4 mr-2 rotate-180" />
                      Back to plans
                    </button>
                    
                    <h3 className="text-2xl font-bold text-white mb-4">Subscribe to {selectedPlan.name}</h3>
                    
                    <div className="mb-6 flex items-baseline">
                      <span className="text-4xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
                        ${selectedPlan.monthly_price}
                      </span>
                      <span className="text-gray-400 ml-1">/month</span>
                    </div>
                    
                    <div className="mb-8">
                      <p className="text-gray-300 mb-4">{selectedPlan.description}</p>
                      <ul className="space-y-3">
                        <li className="flex items-start">
                          <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-indigo-400" />
                          <span className="text-gray-300">Full access to all features</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-indigo-400" />
                          <span className="text-gray-300">Priority customer support</span>
                        </li>
                        <li className="flex items-start">
                          <Check className="h-5 w-5 mr-2 flex-shrink-0 mt-0.5 text-indigo-400" />
                          <span className="text-gray-300">Regular updates</span>
                        </li>
                      </ul>
                    </div>
                    
                    <CheckoutButton 
                      selectedServices={[]} // Adding a dummy ID to pass validation
                      totalPrice={selectedPlan.monthly_price}
                      subscriptionId={selectedPlan.id}
                      isSubscription={true}
                    />
                  </>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        )}
      </div>
    </section>
  );
};

export default PricingBuilder;