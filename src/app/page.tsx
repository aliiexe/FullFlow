'use client';

import FloatingNavbar from '@/components/Navbar/Navbar';
import Footer from '@/components/Footer/Footer';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

// Words for text morphing animation
const words = [
  'Innovation',
  'Solutions',
  'Scaling',
  'Transformation',
  'Intelligence',
  'Expertise'
];

export default function Home() {
  const [currentWord, setCurrentWord] = useState(0);
  
  // Text morphing animation
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWord((prev) => (prev + 1) % words.length);
    }, 2500);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <main className="bg-gradient-to-b from-white via-gray-50 to-white min-h-screen">
      <FloatingNavbar />
      
      {/* Hero Section */}
      <div className="pt-36 pb-24 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="max-w-4xl">
          <motion.h1 
            className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="block">AI powered</span>
            <div className="h-16 md:h-20 overflow-hidden relative">
              <motion.div
                key={currentWord}
                initial={{ y: 50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -50, opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute w-full"
              >
                <span className="bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 bg-clip-text text-transparent">
                  {words[currentWord]}
                </span>
              </motion.div>
            </div>
            <span className="block">on tap</span>
          </motion.h1>
          
          <motion.p
            className="mt-6 text-lg md:text-xl text-gray-600 max-w-3xl"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
          >
            Only pay for the pieces you need. Build custom AI solutions with our expertise and flexible pricing model.
          </motion.p>
          
          <motion.div
            className="mt-12 flex flex-col sm:flex-row gap-5"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Primary CTA Button */}
            <motion.div
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="relative overflow-hidden rounded-xl shadow-md"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-purple-600 via-pink-500 to-indigo-600 animate-gradient-xy"></div>
              <button className="relative px-8 py-4 w-full sm:w-auto text-white font-medium">
                Build Your Solution
              </button>
            </motion.div>
            
            {/* Secondary CTA Button */}
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="px-8 py-4 bg-white text-gray-900 font-medium rounded-xl shadow-sm border border-gray-200"
            >
              See Our Work
            </motion.button>
          </motion.div>
        </div>
      </div>
      
      {/* Example Content Section to Show Scroll Effect */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-gray-900">Our Services</h2>
          <p className="mt-4 text-xl text-gray-600 max-w-2xl mx-auto">
            Discover how our AI-powered solutions can transform your business
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Service Card 1 */}
          <motion.div 
            className="bg-white rounded-2xl shadow-md p-8 border border-gray-100"
            whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="w-14 h-14 mb-6 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 16.5C14.4853 16.5 16.5 14.4853 16.5 12C16.5 9.51472 14.4853 7.5 12 7.5C9.51472 7.5 7.5 9.51472 7.5 12C7.5 14.4853 9.51472 16.5 12 16.5Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M2 12H4M20 12H22M12 2V4M12 20V22M4.93 4.93L6.34 6.34M17.66 17.66L19.07 19.07M19.07 4.93L17.66 6.34M6.34 17.66L4.93 19.07" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">AI-Enabled Solutions</h3>
            <p className="text-gray-600">Powerful AI solutions built to solve your specific business challenges.</p>
          </motion.div>
          
          {/* Service Card 2 */}
          <motion.div 
            className="bg-white rounded-2xl shadow-md p-8 border border-gray-100"
            whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="w-14 h-14 mb-6 rounded-xl bg-gradient-to-r from-pink-500 to-purple-600 text-white flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M10 20L14 4M18 8L22 12L18 16M6 16L2 12L6 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Digital Products & Web</h3>
            <p className="text-gray-600">Exceptional digital products and web solutions that deliver outstanding user experiences.</p>
          </motion.div>
          
          {/* Service Card 3 */}
          <motion.div 
            className="bg-white rounded-2xl shadow-md p-8 border border-gray-100"
            whileHover={{ y: -8, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
            transition={{ type: "spring", stiffness: 400, damping: 17 }}
          >
            <div className="w-14 h-14 mb-6 rounded-xl bg-gradient-to-r from-indigo-600 to-pink-500 text-white flex items-center justify-center">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M20 20V8M4 4V16M4 16H20M4 16H14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M20 8L14 14L10 10L4 16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-3">Growth & Support</h3>
            <p className="text-gray-600">Strategic growth services and ongoing support to ensure your success.</p>
          </motion.div>
        </div>
      </section>
      <Footer />
    </main>
  
  );
}