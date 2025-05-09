'use client';
import React, { useState } from 'react';
import { motion } from "framer-motion";
import { cn } from "@/libs/utils";
import { DotPattern } from '@/components/magicui/dot-pattern';
import Link from 'next/link';
import Image from 'next/image';

const ProofElementsSection = () => {
  const [activeVideo, setActiveVideo] = useState(null);

  const closeVideo = () => setActiveVideo(null);

  return (
    <section className="relative py-24 md:py-32 overflow-hidden">
      <div className="absolute inset-0 z-0">
        <DotPattern
          width={24}
          height={24}
          cx={1}
          cy={1}
          cr={1}
          className={cn(
            "text-primary/10",
            "[mask-image:radial-gradient(ellipse_at_center,white_0%,rgba(255,255,255,0.6)_20%,rgba(255,255,255,0.1)_60%,transparent_100%)]",
          )}
        />
      </div>
      
      <div className="container max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
            Proof of Excellence
          </h2>
          <p className="mt-4 text-xl text-zinc-300 max-w-3xl mx-auto">
            Explore our case studies, demonstrations, and client success stories that highlight our expertise and results.
          </p>
          
          <Link 
            href="/portfolio"
            className="inline-block mt-6 px-8 py-3 rounded-full bg-gradient-to-r from-primary to-primary/50 hover:opacity-90 text-white font-medium transition-all"
          >
            View Recent Work
          </Link>
        </motion.div>

        {/* Bento Grid Layout */}
        <div className="max-w-7xl mx-auto mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
            {/* Row 1: Two cards */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="relative h-80 md:h-96 overflow-hidden rounded-2xl bg-zinc-800/40 backdrop-blur-sm col-span-1 md:col-span-2"
            >
              <div className="relative w-full h-full">
                <Image
                  src="/images/portfolio/portfolio1.png"
                  alt="Portfolio project"
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="relative h-80 md:h-96 overflow-hidden rounded-2xl bg-zinc-800/40 backdrop-blur-sm"
            >
              <div className="relative w-full h-full">
                <Image
                  src="/images/portfolio/portfolio2.png"
                  alt="Portfolio project"
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </motion.div>

            {/* Row 2: Video + Large Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="relative h-80 md:h-96 overflow-hidden rounded-2xl bg-zinc-800/40 backdrop-blur-sm"
            >
              <button 
                onClick={() => setActiveVideo('/videos/product-demo.mp4')}
                className="block w-full h-full relative"
              >
                <Image
                  src="/images/portfolio/portfolio3.png"
                  alt="Video thumbnail"
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/10 backdrop-blur-md p-5 rounded-full transition-transform duration-300 hover:scale-110">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 5V19L19 12L8 5Z" fill="white"/>
                    </svg>
                  </div>
                </div>
              </button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="relative h-80 md:h-96 overflow-hidden rounded-2xl bg-zinc-800/40 backdrop-blur-sm col-span-1 md:col-span-2"
            >
              <div className="relative w-full h-full">
                <Image
                  src="/images/portfolio/portfolio4.png"
                  alt="Portfolio project"
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </motion.div>

            {/* Row 3: Two Cards (One Image, One Video) */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="relative h-80 md:h-96 overflow-hidden rounded-2xl bg-zinc-800/40 backdrop-blur-sm"
            >
              <div className="relative w-full h-full">
                <Image
                  src="/images/portfolio/portfolio5.png"
                  alt="Portfolio project"
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
              </div>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="relative h-80 md:h-96 overflow-hidden rounded-2xl bg-zinc-800/40 backdrop-blur-sm"
            >
              <button 
                onClick={() => setActiveVideo('/videos/testimonial.mp4')}
                className="block w-full h-full relative"
              >
                <Image
                  src="/images/portfolio/portfolio6.png"
                  alt="Video thumbnail"
                  fill
                  className="object-cover transition-transform duration-500 hover:scale-105"
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="bg-white/10 backdrop-blur-md p-5 rounded-full transition-transform duration-300 hover:scale-110">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M8 5V19L19 12L8 5Z" fill="white"/>
                    </svg>
                  </div>
                </div>
              </button>
            </motion.div>
            
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.6 }}
              className="relative h-80 md:h-96 overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-primary/80 to-primary/50"
            >
              <div className="absolute inset-0 backdrop-blur-[2px]">
                <div className="absolute -right-16 -top-16 w-64 h-64 rounded-full bg-[#E6B31E]/20 blur-3xl"></div>
                <div className="absolute -left-16 -bottom-16 w-64 h-64 rounded-full bg-white/10 blur-3xl"></div>
              </div>
              <div className="flex items-center justify-center h-full w-full p-6 md:p-10 relative z-10">
                <motion.div 
                  initial={{ scale: 0.95 }}
                  whileInView={{ scale: 1 }}
                  transition={{ 
                    duration: 0.8,
                    type: "spring", 
                    stiffness: 100 
                  }}
                  className="text-center"
                >
                  <h3 className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-200 mb-6">
                    Ready to work together?
                  </h3>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                  >
                    <Link 
                      href="/contact" 
                      className="inline-flex text-white items-center gap-2 px-8 py-4 bg-black/80 backdrop-blur-sm rounded-full font-medium hover:bg-black transition-all shadow-lg shadow-black/30 border border-white/10"
                    >
                      <span>Get in touch</span>
                      <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M4.16669 10H15.8334" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        <path d="M10 4.16667L15.8333 10L10 15.8333" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </Link>
                  </motion.div>
                </motion.div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Video Overlay */}
      {activeVideo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center backdrop-blur-lg bg-black/80">
          <div className="relative w-full max-w-5xl">
            <button 
              onClick={closeVideo}
              className="absolute -top-16 right-0 text-white hover:text-gray-300"
            >
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M18 6L6 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <video 
              src={activeVideo} 
              controls 
              autoPlay
              className="w-full rounded-lg shadow-2xl"
            />
          </div>
        </div>
      )}
    </section>
  );
};

export default ProofElementsSection;