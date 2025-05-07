'use client';
import React from 'react';
import { motion } from "framer-motion";
import { cn } from "@/libs/utils";
import { DotPattern } from '@/components/magicui/dot-pattern';

const TeamCompositionSection = () => {
  const teamComposition = [
    {
      percentage: '45%',
      title: 'Mobile Apps & AI Experts',
      description: 'Skilled developers crafting next-gen mobile experiences with advanced AI integration capabilities.'
    },
    {
      percentage: '30%',
      title: 'Web & Digital Product Designers',
      description: 'UI/UX specialists who transform concepts into intuitive, engaging digital products.'
    },
    {
      percentage: '15%',
      title: 'Cloud & Infrastructure Specialists',
      description: 'Engineers ensuring your solutions are scalable, secure, and built on solid architecture.'
    },
    {
      percentage: '10%',
      title: 'Marketing & Growth Strategists',
      description: 'Experts who align technology with business goals to drive measurable growth.'
    }
  ];

  return (
    <section className="relative py-20 md:py-28 overflow-hidden">
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
      
      <div className="container max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300">
            Elite Team Composition
          </h2>
          <p className="mt-4 text-xl text-zinc-300 max-w-3xl mx-auto">
            Our interdisciplinary team brings diverse expertise to deliver complete solutions tailored to your needs.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          {teamComposition.map((item, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="relative backdrop-blur-sm rounded-2xl overflow-hidden"
              style={{
                background: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.05), rgba(255, 255, 255, 0.02))',
                border: '1px solid rgba(255, 255, 255, 0.1)',
              }}
            >
              <div className="absolute top-0 right-0 w-28 h-28 rounded-bl-[56px] opacity-30"
                   style={{
                     background: `linear-gradient(135deg, 
                       ${index === 0 ? '#FF0080' : index === 1 ? '#F352F0' : index === 2 ? '#FF7600' : '#FFCC00'}, 
                       trasparent)`,
                   }} />
              
              <div className="p-8 md:p-10 h-full flex flex-col">
                <h3 className="text-6xl md:text-7xl lg:text-6xl font-bold mb-3 bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-300 opacity-70"
                    style={{
                        backgroundImage: `linear-gradient(135deg, 
                          ${index === 0 ? '#FF0080' : index === 1 ? '#F352F0' : index === 2 ? '#FF7600' : '#FFCC00'}, 
                          transparent)`,
                      }}
                >
                  {item.percentage}
                </h3>
                <h4 className="text-2xl font-semibold text-white mb-4">{item.title}</h4>
                <p className="text-base text-zinc-300 mt-auto leading-relaxed">{item.description}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TeamCompositionSection;