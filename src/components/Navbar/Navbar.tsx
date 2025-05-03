'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';

// Navigation items
const navigationItems = [
  { name: 'Services', href: '/services' },
  { name: 'Process', href: '/process' },
  { name: 'Work', href: '/work' },
  { name: 'About', href: '/about' },
  { name: 'Plans', href: '/plans' },
  { name: 'FAQs', href: '/faqs' },
];

export default function Navbar() {
  const [activeItem, setActiveItem] = useState<string | null>(null);
  const [isScrolled, setIsScrolled] = useState(false);

  // Handle scroll events
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 flex justify-center items-center w-full px-4 sm:px-6 py-4"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <div 
        className={`
          w-full max-w-6xl flex justify-center items-center py-3 px-6 md:px-10
          ${isScrolled ? 'bg-[#1e1e2a]/90' : 'bg-[#1e1e2a]/80'} 
          backdrop-blur-lg rounded-full border border-[#ffffff20]
          transition-all duration-300 ease-in-out
        `}
        style={{
          boxShadow: isScrolled 
            ? '0 10px 30px -10px rgba(0, 0, 0, 0.3)' 
            : '0 10px 20px -10px rgba(0, 0, 0, 0.2)'
        }}
      >
        {/* Navigation Links */}
        <nav className="flex items-center justify-center space-x-6 md:space-x-10">
          {navigationItems.map((item) => (
            <Link 
              key={item.name} 
              href={item.href}
              className="relative px-1 py-2"
              onMouseEnter={() => setActiveItem(item.name)}
              onMouseLeave={() => setActiveItem(null)}
            >
              <motion.span 
                className="text-white/90 font-medium relative z-10 text-sm md:text-base"
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                {item.name}
              </motion.span>
              
              {/* Elegant hover animation */}
              <motion.span 
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-pink-400 via-purple-400 to-indigo-400 rounded-full"
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{ 
                  scaleX: activeItem === item.name ? 1 : 0,
                  opacity: activeItem === item.name ? 1 : 0,
                }}
                transition={{ duration: 0.2 }}
              />
              
              {/* Subtle glow effect on hover */}
              <motion.span
                className="absolute inset-0 rounded-full"
                initial={{ opacity: 0 }}
                animate={{ 
                  opacity: activeItem === item.name ? 0.1 : 0,
                  backgroundColor: '#8a64eb',
                }}
                transition={{ duration: 0.3 }}
              />
            </Link>
          ))}
        </nav>
        
        {/* CTA Button */}
        <motion.div
          className="absolute right-3 md:right-5"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3, duration: 0.5 }}
        >
          <motion.button
            className="
              relative overflow-hidden group
              bg-gradient-to-br from-purple-500 to-pink-600 
              hover:from-purple-600 hover:to-pink-700
              text-white font-medium rounded-full px-6 py-2.5
              text-sm md:text-base transition-all duration-300
              flex items-center
            "
            whileHover={{ 
              boxShadow: '0 0 15px rgba(138, 100, 235, 0.5)',
              transition: { duration: 0.2 }
            }}
            whileTap={{ scale: 0.98 }}
          >
            <span>Get Started</span>
            
            {/* Arrow icon with animation */}
            <motion.svg 
              width="20" 
              height="20" 
              viewBox="0 0 24 24" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
              className="ml-2"
              initial={{ x: 0 }}
              whileHover={{ x: 3 }}
              transition={{ repeat: Infinity, duration: 0.8, repeatType: "reverse" }}
            >
              <path 
                d="M5 12H19M19 12L12 5M19 12L12 19" 
                stroke="currentColor" 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              />
            </motion.svg>
            
            {/* Shimmering effect */}
            <motion.span
              className="absolute top-0 -right-full h-full w-1/2 z-5 block transform -skew-x-12 bg-gradient-to-r from-transparent to-white opacity-40 group-hover:animate-shimmer"
              style={{
                animation: 'shimmer 1.5s infinite'
              }}
            />
          </motion.button>
        </motion.div>
      </div>
    </motion.header>
  );
}

