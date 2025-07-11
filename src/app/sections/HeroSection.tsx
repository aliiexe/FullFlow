'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import AnimatedText from '../animations/TextHover';
import { MorphingText } from '@/components/magicui/morphing-text';
import { DotPattern } from '@/components/magicui/dot-pattern';
import { cn } from "@/libs/utils";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { motion } from "framer-motion";
import { ShinyButton } from '@/components/magicui/shiny-button';

const HeroSection = () => {
  const rotatingWords = ["Innovation", "Solutions", "Scaling", "Intelligence", "Automation"];
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentWordIndex(prevIndex => (prevIndex + 1) % rotatingWords.length);
    }, 2000);
    console.log('CLERK_TELEMETRY_DEBUG:', process.env.CLERK_TELEMETRY_DEBUG);
    console.log('CLERK_TELEMETRY_DISABLED:', process.env.CLERK_TELEMETRY_DISABLED);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <section id='hero' className="relative min-h-screen flex items-center overflow-hidden py-20 sm:m-12 md:m-10 lg:m-10 sm:py-0 md:py-0 lg:py-0">
      <div className="absolute inset-0 z-0">
        <DotPattern
          width={20}
          height={20}
          cx={1}
          cy={1}
          cr={1}
          className={cn(
            "text-primary/20",
            "[mask-image:radial-gradient(ellipse_at_center,white_10%,rgba(255,255,255,0.8)_30%,rgba(255,255,255,0.2)_70%,transparent_80%)]",
          )}
        />
      </div>
      
      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-1 lg:items-center gap-10 md:grid-cols-12 md:gap-6 lg:gap-8 items-center">
          <motion.div
            className="md:col-span-8 lg:col-span-9"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
          >
            <motion.div 
              className="inline-flex items-center px-4 py-2 rounded-full border border-[#7F6DC5]/30 backdrop-blur-sm bg-white/5 mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3, duration: 0.5 }}
            >
              <div className="h-2 w-2 rounded-full bg-[#7F6DC5] mr-2"></div>
              <span className="text-sm text-[#7F6DC5] font-medium">End To End Tech Solutions</span>
            </motion.div>
            
            <motion.div 
              className="mb-8"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
            >
              <h1 className="text-4xl sm:text-5xl md:text-4xl lg:text-6xl font-bold leading-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 mb-4">
                AI powered 
                <span className="inline-block -ml-5 lg:-ml-0 pl-4 pr-2">
                  <MorphingText 
                    texts={rotatingWords}
                    className="bg-clip-text text-white md:ml-2"
                  />
                </span>
                <br />
                <span className="md:ml-1">on tap</span>
              </h1>
              
              <p className="text-base sm:text-lg md:text-xl text-zinc-300 mt-6 max-w-2xl leading-relaxed">
                Only pay for the pieces you need. Modular AI components 
                for businesses of all sizes.
              </p>
            </motion.div>
            
            <motion.div 
              className="mt-8 sm:mt-8 md:mt-10 flex flex-col sm:flex-row gap-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.5 }}
            >
              <a href="https://calendly.com/kaouter-karboub" target="_blank" rel="noopener noreferrer">
                <ShinyButton className="text-sm sm:text-base py-2.5 px-6">Schedule a Call</ShinyButton>
              </a>
              
              <Link href="/ceo">
                <button className="text-sm sm:text-base py-2.5 px-6 bg-black/40 hover:bg-black/60 border border-primary/20 text-white rounded-full transition-all duration-300 flex items-center gap-2">
                  Who is the CEO
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 17l9.2-9.2M17 17V7H7"/>
                  </svg>
                </button>
              </Link>
            </motion.div>
          </motion.div>
          
          <motion.div 
            className="hidden md:block md:col-span-4 lg:col-span-3 relative"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            <div className="relative w-full aspect-square max-w-lg ml-auto">
              {/* Empty space column */}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;