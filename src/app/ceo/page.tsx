"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { DotPattern } from "@/components/magicui/dot-pattern";
import { cn } from "@/libs/utils";
import { Variants } from "framer-motion";

import {
  ChevronLeft,
  Calendar,
  ExternalLink,
  Award,
  GraduationCap,
} from "lucide-react";

const CEOPage = () => {
  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: {
        delay: 0.5 + i * 0.2,
        duration: 0.9,
        ease: [0.22, 1, 0.36, 1],
      },
    }),
  };

  const pulse: Variants = {
  initial: { opacity: 0.5, scale: 0.95 },
  animate: {
    opacity: [0.5, 0.8, 0.5],
    scale: [0.95, 1, 0.95],
    transition: {
      repeat: Infinity,
      repeatType: "reverse" as const,
      duration: 8,
      ease: "easeInOut",
    },
  },
};

  const paragraphs = [
    "Dr. Kaouter has been known to collaborate with AI stars like Fabrizio Romano to implement systems for test driven development for artificial intelligence at Mont-Cloud architecture at Oxford University. She is also a tutor at artificial-intelligence-cloud-and-edge-implementations at Oxford University.",
    'Dr. Kaouter KARBOUB is an assistant professor of computer science and artificial intelligence at the Moroccan Institute of Engineering Sciences. She received her PhD degree in microelectronics and Computer Sciences: Internet of Things, and Artificial Intelligence from Lorraine University France. She also holds an Engineering degree in Industrial Engineering and Logistic Operations from the High School of Electric and Mechanical Engineering in Morocco. She got High Honor degree for her dissertation "Contribution to improving medical care services using IoT and AI".',
    "She leads many non-profit associations to help women in the African world be involved in domains like AI for healthcare and education in cooperation with universities.",
    "She is interested in intelligent systems that operate in large, nondeterministic, nonstationary or only partially known domains.",
    "She believes that finding good solutions to these problems requires approaches that cut across many different fields and, consequently, her research draws on areas such as artificial intelligence, decision theory, and operations research.",
  ];

  useEffect(() => {
    document.body.style.backgroundColor = "#0f0f0f";
    window.scrollTo(0, 0);

    return () => {
      document.body.style.backgroundColor = "";
    };
  }, []);

  return (
    <main className="min-h-screen m-5 bg-[#0c0c14] flex flex-col pt-24 pb-20 relative">
      <div className="absolute inset-0 z-0">
        <DotPattern
          width={20}
          height={20}
          cx={1}
          cy={1}
          cr={1}
          className={cn(
            "text-primary/20",
            "[mask-image:radial-gradient(ellipse_at_center,white_10%,rgba(255,255,255,0.8)_30%,rgba(255,255,255,0.2)_70%,transparent_80%)]"
          )}
        />
      </div>

      <motion.div
        className="absolute top-40 right-[5%] w-80 h-80 rounded-full bg-indigo-600/10 blur-[120px] pointer-events-none"
        variants={pulse}
        initial="initial"
        animate="animate"
      />
      <motion.div
        className="absolute bottom-40 left-[10%] w-64 h-64 rounded-full bg-purple-600/10 blur-[100px] pointer-events-none"
        variants={pulse}
        initial="initial"
        animate="animate"
        style={{ animationDelay: "2s" }}
      />

      <div className="container max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6 }}
        >
          <Link
            href="/"
            className="inline-flex items-center text-indigo-400 hover:text-indigo-300 transition-colors mb-10"
          >
            <ChevronLeft className="h-5 w-5 mr-2" />
            <span>Back to Home</span>
          </Link>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          <div className="lg:col-span-4 order-2 lg:order-1">
            <motion.div
              className="sticky top-28 overflow-hidden"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="rounded-2xl border border-white/10 overflow-hidden bg-white/[0.03] backdrop-blur-md shadow-xl">
                <div className="relative w-full aspect-square overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent z-10 opacity-50" />
                  <Image
                    src="/images/ceo-profile.png"
                    alt="Dr. Kaouter KARBOUB"
                    width={500}
                    height={500}
                    className="object-cover w-full h-full transform hover:scale-105 transition-transform duration-1000"
                    priority
                  />
                </div>

                <div className="p-6 border-t border-white/10">
                  <motion.h1
                    className="text-2xl lg:text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.2, duration: 0.8 }}
                  >
                    Dr. Kaouter KARBOUB
                  </motion.h1>
                  <motion.div
                    className="text-indigo-400 text-lg mt-1"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.8 }}
                  >
                    CEO & AI Researcher
                  </motion.div>

                  {/* Added credentials with icons */}
                  <motion.div
                    className="mt-4 space-y-3 text-sm text-gray-400"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5, duration: 0.8 }}
                  >
                    <div className="flex items-center">
                      <GraduationCap className="w-4 h-4 mr-2 text-indigo-400" />
                      <span>PhD in AI & IoT, Lorraine University</span>
                    </div>
                    <div className="flex items-center">
                      <Award className="w-4 h-4 mr-2 text-indigo-400" />
                      <span>Professor, EMSI</span>
                    </div>
                    <div className="flex items-center">
                      <ExternalLink className="w-4 h-4 mr-2 text-indigo-400" />
                      <span>Oxford University Tutor</span>
                    </div>
                  </motion.div>
                </div>

                {/* Added contact button */}
                <motion.div
                  className="px-6 py-4 border-t border-white/10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.8 }}
                >
                  <a
                    href="https://calendly.com/kaouter-karboub"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center w-full px-4 py-2.5 rounded-lg bg-indigo-600/80 text-white font-medium hover:bg-indigo-600 transition-all"
                  >
                    <Calendar className="mr-2 h-4 w-4" />
                    Schedule a Meeting
                  </a>
                </motion.div>
              </div>
            </motion.div>
          </div>

          {/* Content section with enhanced styling */}
          <div className="lg:col-span-8 space-y-8 order-1 lg:order-2">
            <motion.h2
              className="text-3xl lg:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 mb-8"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8 }}
            >
              Pioneering AI Innovation & Leadership
            </motion.h2>

            {/* Biography paragraphs with improved staggered animation */}
            <div className="space-y-6">
              {paragraphs.map((paragraph, index) => (
                <motion.p
                  key={index}
                  className="text-gray-300 text-base lg:text-lg leading-relaxed"
                  custom={index}
                  initial="hidden"
                  animate="visible"
                  variants={fadeInUp}
                >
                  {paragraph}
                </motion.p>
              ))}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
};

export default CEOPage;
