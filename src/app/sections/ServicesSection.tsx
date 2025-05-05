"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Code, Palette, Rocket, BarChart, Loader2 } from "lucide-react"

// Define interfaces based on your API schema
interface Category {
  id: string
  name: string
  description: string | null
  base_id: string | null
  order_position: number | null
  created_at: string
  updated_at: string
}

interface Deliverable {
  id: string
  service_category_id: string
  name: string
  description: string | null
  base_price: number | null
  is_active: boolean
  complexity_level: string | null
  created_at: string
  updated_at: string
  service_category: {
    id: string
    name: string
    base_id: string | null
    created_at: string
    updated_at: string
    description: string | null
    order_position: number | null
  }
}

// Service data structure after processing API responses
interface ServiceData {
  id: string
  title: string
  description: string | null
  icon: React.ReactNode
  details: string[]
}

interface ServiceCardProps {
  title: string
  description: string | null
  icon: React.ReactNode
  details: string[]
  isExpanded: boolean
  toggleExpand: () => void
}

// Map category name to icon
const getCategoryIcon = (categoryName: string): React.ReactNode => {
  switch (categoryName) {
    case "AI-Enabled Solutions":
      return <Code className="text-white" size={24} />
    case "Digital Products & Web":
      return <Rocket className="text-white" size={24} />
    case "Creative & Branding":
      return <Palette className="text-white" size={24} />
    case "Growth & Support":
      return <BarChart className="text-white" size={24} />
    default:
      return <Code className="text-white" size={24} />
  }
}

function ServiceCard({ title, description, icon, details, isExpanded, toggleExpand }: ServiceCardProps) {
  return (
    <motion.div
      className="backdrop-blur-md rounded-xl p-8 cursor-pointer border border-white/10 transition-all duration-300 bg-white/[0.03] hover:bg-white/[0.06]"
      whileHover={{ y: -5 }}
      onClick={toggleExpand}
      transition={{ 
        duration: 0.3, 
        y: { 
          type: "tween", 
          ease: "easeOut"
        }
      }}
    >
      <div className="flex items-start justify-between mb-5">
        <div className="p-4 rounded-full bg-white/5">{icon}</div>
        <motion.div 
          animate={{ rotate: isExpanded ? 180 : 0 }} 
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="bg-white/5 p-1.5 rounded-full"
        >
          <ChevronDown className="text-white w-5 h-5" />
        </motion.div>
      </div>

      <h3 className="text-2xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-gray-300 mb-4 text-base">{description || ""}</p>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ 
              height: { 
                duration: 0.3,
                ease: "easeInOut"
              },
              opacity: {
                duration: 0.2,
                ease: "easeInOut",
                delay: isExpanded ? 0.1 : 0
              }
            }}
            style={{ overflow: "hidden" }}
            className="will-change-[height]"
          >
            <ul className="space-y-3 mt-5 text-gray-300">
              {details.map((detail, index) => (
                <li key={index} className="flex items-start">
                  <span className="text-indigo-400 mr-2">•</span>
                  <span>{detail}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function Services() {
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

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
        const categoriesData = await categoriesResponse.json();
        
        // Fetch deliverables
        const deliverablesResponse = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/deliverables`);
        if (!deliverablesResponse.ok) {
          throw new Error('Failed to fetch deliverables');
        }
        const deliverablesData = await deliverablesResponse.json();
        
        // Process data to match your component's expected format
        const processedServices = categoriesData.map((category: Category) => {
          // Find all deliverables for this category
          const categoryDeliverables = deliverablesData.filter(
            (deliverable: Deliverable) => deliverable.service_category_id === category.id
          );
          
          // Extract just the names of the deliverables
          const deliverableNames = categoryDeliverables.map((d: Deliverable) => d.name);
          
          // Create description fallback if it's null
          const fallbackDescription = 
            category.name === "AI-Enabled Solutions" ? "Custom AI solutions tailored to your business needs" :
            category.name === "Digital Products & Web" ? "High-performance digital experiences" :
            category.name === "Creative & Branding" ? "Compelling visual identities and experiences" :
            category.name === "Growth & Support" ? "Ongoing optimization and maintenance" :
            "Professional services to enhance your business";
          
          return {
            id: category.id,
            title: category.name,
            description: category.description || fallbackDescription,
            icon: getCategoryIcon(category.name),
            details: deliverableNames.length > 0 ? deliverableNames : ["No deliverables available"],
          };
        });
        
        setServices(processedServices);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load services. Please try again later.');
        
        // Fallback to default data
        setServices([
          {
            id: "1",
            title: "AI-Enabled Solutions",
            description: "Custom AI solutions tailored to your business needs",
            icon: <Code className="text-white" size={24} />,
            details: [
              "Natural Language Processing",
              "Computer Vision Applications",
              "Predictive Analytics",
              "Custom ML Model Development",
              "AI Integration with Existing Systems",
            ],
          },
          // Add your other default services here
        ]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Loading state
  if (isLoading) {
    return (
      <section id="services" className="py-28 px-6 relative">
        <div className="container max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
          <Loader2 className="w-12 h-12 text-indigo-500 animate-spin" />
          <p className="mt-4 text-white">Loading services...</p>
        </div>
      </section>
    );
  }

  // Error state
  if (error) {
    return (
      <section id="services" className="py-28 px-6 relative">
        <div className="container max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[400px]">
          <p className="text-red-500 text-xl">{error}</p>
        </div>
      </section>
    );
  }

  return (
    <section id="services" className="py-28 px-6 relative">
      <div className="container max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          viewport={{ once: true, margin: "-100px" }}
          className="text-center mb-20"
        >
          <h2 className="text-white text-4xl md:text-5xl font-bold mb-4">Core Services</h2>
          <p className="text-xl text-white max-w-3xl mx-auto">
            From concept to execution, we deliver end-to-end AI solutions
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-7">
          {services.map((service, index) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              viewport={{ once: true }}
            >
              <ServiceCard
                title={service.title}
                description={service.description}
                icon={service.icon}
                details={service.details}
                isExpanded={expandedIndex === index}
                toggleExpand={() => toggleExpand(index)}
              />
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}