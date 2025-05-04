"use client"

import type React from "react"
import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { ChevronDown, Code, Palette, Rocket, BarChart } from "lucide-react"

interface ServiceCardProps {
  title: string
  description: string
  icon: React.ReactNode
  details: string[]
  isExpanded: boolean
  toggleExpand: () => void
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
      <p className="text-gray-300 mb-4 text-base">{description}</p>

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

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  const services = [
    {
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
    {
      title: "Digital Products & Web",
      description: "High-performance digital experiences",
      icon: <Rocket className="text-white" size={24} />,
      details: [
        "Next.js Web Applications",
        "Progressive Web Apps",
        "Mobile-First Experiences",
        "API Development",
        "Performance Optimization",
      ],
    },
    {
      title: "Creative & Branding",
      description: "Compelling visual identities and experiences",
      icon: <Palette className="text-white" size={24} />,
      details: [
        "Brand Identity Development",
        "UI/UX Design",
        "Motion Design",
        "Content Strategy",
        "Visual Storytelling",
      ],
    },
    {
      title: "Growth & Support",
      description: "Ongoing optimization and maintenance",
      icon: <BarChart className="text-white" size={24} />,
      details: [
        "Performance Monitoring",
        "Conversion Optimization",
        "Technical Support",
        "Training & Documentation",
        "Continuous Improvement",
      ],
    },
  ]

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
              key={index}
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