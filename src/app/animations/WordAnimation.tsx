'use client';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {motion, useAnimation} from 'framer-motion';
import { init } from 'next/dist/compiled/webpack/webpack';

const HeroSection = () => {
  const texts = "Innovations";
  const DURATION = 0.25;
  const STAGGER = 0.025;

  return (
    <section className="py-12 md:py-16 lg:py-20 overflow-hidden">
      <div className="px-6 sm:px-8 md:px-12 lg:px-24">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8 lg:gap-10">
          <div className="md:col-span-6 lg:col-span-5">
            <div className="text-white">
              <div className="flex flex-col mb-4 md:mb-6">
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight font-['Google_Sans',sans-serif]">
                  AI Powered
                </h1>
                
                <motion.h2
                  initial="initial"
                  whileHover="hovered"
                  className='relative block overflow-hidden text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight font-["Google_Sans",sans-serif] min-h-[1.2em]'
                >
                  <div>
                    {texts.split("").map((l, i) => {
                      return (
                        <motion.span
                          key={i}
                          variants={{
                            initial: { y: 0 },
                            hovered: { y: "-100%" },
                          }}
                          transition={{
                            duration: DURATION,
                            ease: "easeInOut",
                            delay: STAGGER * i,
                          }}
                          className='inline-block'
                        >
                          {l}
                        </motion.span>
                      );
                    })}
                  </div>
                  <div className="absolute inset-0">
                    {texts.split("").map((l, i) => {
                      return (
                        <motion.span
                          key={i}
                          variants={{
                            initial: { y: "100%" },
                            hovered: { y: 0 },
                          }}
                          transition={{
                            duration: DURATION,
                            ease: "easeInOut",
                            delay: STAGGER * i,
                          }}
                          className='inline-block'
                        >
                          {l}
                        </motion.span>
                      );
                    })}
                  </div>
                </motion.h2>

                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold leading-tight font-['Google_Sans',sans-serif]">
                  On Tap
                </h2>
              </div>
              
              <div className="text-sm sm:text-base md:text-lg text-zinc-300 mb-6 md:mb-8 max-w-2xl font-['Google_Sans',sans-serif]">
                Only pay for the pieces you need
              </div>
              
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 mt-2 sm:mt-4">
                <Link href="/demo" 
                  className="flex items-center justify-center px-5 py-2.5 sm:px-6 sm:py-3 bg-white hover:bg-amber-400 text-black font-medium rounded-full transition-all duration-200 text-sm sm:text-base min-w-[140px] sm:min-w-[160px] font-['Google_Sans',sans-serif]">
                  Get started
                </Link>
                
                <Link href="/pricing" 
                  className="flex items-center justify-center px-5 py-2.5 sm:px-6 sm:py-3 border border-white hover:border-amber-500 text-white font-medium rounded-full transition-all duration-200 text-sm sm:text-base min-w-[140px] sm:min-w-[160px] font-['Google_Sans',sans-serif]">
                  View pricing
                </Link>
              </div>
            </div>
          </div>
          
          <div className="hidden lg:block lg:col-span-7 relative">
            <div className="absolute inset-0">
              <div className="h-full w-full"></div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;