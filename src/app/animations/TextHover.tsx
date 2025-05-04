'use client';
import React, { useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';

interface AnimatedTextProps {
  text: string;
  duration?: number;
  stagger?: number;
  className?: string;
  animateOnLoad?: boolean;
  animateOnHover?: boolean;
}

const AnimatedText: React.FC<AnimatedTextProps> = ({
  text,
  duration = 0.25,
  stagger = 0.025,
  className = '',
  animateOnLoad = false,
  animateOnHover = true
}) => {
  const [isHovering, setIsHovering] = useState(false);
  
  // Create animation variants
  const containerVariants = {
    initial: {},
    animate: {}
  };
  
  const topTextVariants = {
    initial: { y: 0 },
    animate: { y: "-100%" }
  };
  
  const bottomTextVariants = {
    initial: { y: "100%" },
    animate: { y: 0 }
  };

  return (
    <motion.div
      className={`relative block overflow-hidden ${className}`}
      onHoverStart={() => animateOnHover && setIsHovering(true)}
      onHoverEnd={() => animateOnHover && setIsHovering(false)}
      initial="initial"
      animate={isHovering || animateOnLoad ? "animate" : "initial"}
    >
      <div>
        {text.split("").map((letter, i) => (
          <motion.span
            key={`top-${text}-${i}`}
            variants={topTextVariants}
            transition={{
              duration: duration,
              ease: "easeInOut",
              delay: stagger * i,
            }}
            className='inline-block'
          >
            {letter}
          </motion.span>
        ))}
      </div>
      
      <div className="absolute inset-0">
        {text.split("").map((letter, i) => (
          <motion.span
            key={`bottom-${text}-${i}`}
            variants={bottomTextVariants}
            transition={{
              duration: duration,
              ease: "easeInOut",
              delay: stagger * i,
            }}
            className='inline-block'
          >
            {letter}
          </motion.span>
        ))}
      </div>
    </motion.div>
  );
};

export default AnimatedText;