// src/components/TextMorphing/TextMorphing.tsx
'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type TextMorphingProps = {
  words: string[];
  interval?: number;
  className?: string;
};

export default function TextMorphing({
  words = ['Innovation', 'Solution', 'Scaling', 'Transformation', 'Intelligence', 'Expertise', 'Creativity', 'Strategy'],
  interval = 2000,
  className = 'text-3xl font-bold'
}: TextMorphingProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  useEffect(() => {
    const timer = setInterval(() => {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentIndex((prevIndex) => (prevIndex + 1) % words.length);
        setIsAnimating(false);
      }, 500); // Half of the transition time
    }, interval);
    
    return () => clearInterval(timer);
  }, [interval, words.length]);
  
  return (
    <div className={`relative ${className}`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
          className="bg-gradient-to-r from-purple-600 via-pink-500 to-yellow-400 bg-clip-text text-transparent inline-block"
        >
          {words[currentIndex]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

// Usage in hero section:
// 
// import TextMorphing from '@/components/TextMorphing/TextMorphing';
//
// <h1>
//   <span>AI powered</span>
//   <TextMorphing words={['Innovation', 'Solution', 'Scaling', 'Transformation', 'Intelligence', 'Expertise', 'Creativity', 'Strategy']} />
//   <span>on tap</span>
// </h1>