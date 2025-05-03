// EnhancedFooter.jsx
'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { 
  motion, 
  useInView, 
  useAnimation, 
  AnimatePresence,
  useMotionTemplate,
  useMotionValue 
} from 'framer-motion';
import { 
  ArrowUpRight, 
  Mail, 
  MapPin, 
  Phone, 
  Linkedin, 
  Twitter, 
  Instagram, 
  Github, 
  ArrowRight, 
  ChevronUp,
  Heart,
  ExternalLink,
  Send,
  Sparkles
} from 'lucide-react';

const EnhancedFooter = () => {
  const footerRef = useRef<HTMLDivElement>(null);
  const newsletterRef = useRef<HTMLDivElement>(null);
  const isInView = useInView(footerRef, { once: false, amount: 0.1 });
  const isNewsletterInView = useInView(newsletterRef, { once: true, amount: 0.5 });
  const controls = useAnimation();
  const newsletterControls = useAnimation();
  const [email, setEmail] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [cursorHovering, setCursorHovering] = useState(false);
  
  // Mouse follower values
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  
  // Handle mouse movement for spotlight effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const { clientX, clientY } = e;
      const footerElement = footerRef.current;
      
      if (footerElement) {
        const rect = footerElement.getBoundingClientRect();
        const x = clientX - rect.left;
        const y = clientY - rect.top;
        
        setMousePosition({ x, y });
        mouseX.set(clientX);
        mouseY.set(clientY);
      }
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [mouseX, mouseY]);

  // Handle scroll to top visibility
  useEffect(() => {
    const handleScroll = () => {
      setShowScrollTop(window.scrollY > 300);
    };
    
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Handle scroll to top action
  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Handle animation controls
  useEffect(() => {
    if (isInView) {
      controls.start('visible');
    } else {
      controls.start('hidden');
    }
    
    if (isNewsletterInView) {
      newsletterControls.start('visible');
    }
  }, [isInView, isNewsletterInView, controls, newsletterControls]);

  // Handle newsletter submission
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (email && email.includes('@')) {
      setIsSubmitted(true);
      setEmail('');
      
      // Create confetti effect
      createConfetti();
      
      setTimeout(() => setIsSubmitted(false), 5000);
    }
  };
  
  // Create confetti effect
  const createConfetti = () => {
    if (!newsletterRef.current || !footerRef.current) return;
    
    const confettiContainer = document.createElement('div');
    confettiContainer.style.position = 'absolute';
    confettiContainer.style.top = '0';
    confettiContainer.style.left = '0';
    confettiContainer.style.width = '100%';
    confettiContainer.style.height = '100%';
    confettiContainer.style.pointerEvents = 'none';
    confettiContainer.style.zIndex = '50';
    
    const buttonRect = newsletterRef.current.getBoundingClientRect();
    const footerRect = footerRef.current.getBoundingClientRect();
    
    const buttonCenterX = buttonRect.left + buttonRect.width / 2 - footerRect.left;
    const buttonTopY = buttonRect.top - footerRect.top;
    
    // Create confetti pieces
    for (let i = 0; i < 50; i++) {
      const confetti = document.createElement('div');
      confetti.style.position = 'absolute';
      confetti.style.left = `${buttonCenterX}px`;
      confetti.style.top = `${buttonTopY}px`;
      confetti.style.width = `${Math.random() * 10 + 5}px`;
      confetti.style.height = `${Math.random() * 10 + 5}px`;
      confetti.style.backgroundColor = `hsl(${Math.random() * 360}, 100%, 70%)`;
      confetti.style.borderRadius = `${Math.random() > 0.5 ? '50%' : '0'}`;
      confetti.style.opacity = `${Math.random() * 0.6 + 0.4}`;
      
      // Animation
      const angle = Math.random() * Math.PI * 2;
      const velocity = Math.random() * 150 + 50;
      const vx = Math.cos(angle) * velocity;
      const vy = Math.sin(angle) * velocity;
      
      // Apply animation
      confetti.animate(
        [
          { transform: 'translate(0, 0) rotate(0deg)', opacity: 1 },
          { transform: `translate(${vx}px, ${vy}px) rotate(${Math.random() * 720 - 360}deg)`, opacity: 0 }
        ],
        {
          duration: Math.random() * 1500 + 1000,
          easing: 'cubic-bezier(0.11, 0.29, 0.18, 0.98)'
        }
      );
      
      confettiContainer.appendChild(confetti);
    }
    
    footerRef.current.appendChild(confettiContainer);
    
    // Remove the container after animation is done
    setTimeout(() => {
      if (footerRef.current && footerRef.current.contains(confettiContainer)) {
        footerRef.current.removeChild(confettiContainer);
      }
    }, 3000);
  };

  // Animation variants
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: { 
        type: 'spring', 
        stiffness: 100, 
        damping: 10 
      },
    },
  };

  const lineVariants = {
    hidden: { scaleX: 0, originX: 0 },
    visible: { 
      scaleX: 1,
      transition: { 
        duration: 0.8, 
        ease: [0.22, 1, 0.36, 1] 
      },
    },
  };

  const backgroundShimmerVariants = {
    hidden: { backgroundPosition: '200% 0' },
    visible: { 
      backgroundPosition: '-200% 0',
      transition: { 
        repeat: Infinity, 
        duration: 15, 
        ease: 'linear'
      },
    },
  };

  const floatingVariants = {
    initial: { y: 0 },
    animate: {
      y: [-5, 5, -5],
      transition: {
        duration: 6,
        repeat: Infinity,
        ease: "easeInOut"
      }
    }
  };

  const scrollButtonVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.3,
        ease: "easeOut"
      }
    },
    exit: {
      opacity: 0,
      y: 20,
      transition: {
        duration: 0.2
      }
    }
  };

  const linkHoverVariants = {
    initial: { width: 0 },
    hover: { 
      width: "100%",
      transition: { 
        duration: 0.3, 
        ease: "easeInOut" 
      }
    }
  };

  const socialIconVariants = {
    hover: {
      y: -5,
      scale: 1.1,
      color: "#fff",
      boxShadow: "0 0 20px rgba(99, 102, 241, 0.8)",
      transition: {
        type: "spring",
        stiffness: 400,
        damping: 10
      }
    }
  };
  
  const newsletterVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut"
      }
    }
  };
  
  const buttonVariants = {
    hover: { 
      scale: 1.03,
      boxShadow: "0 10px 25px -5px rgba(99, 102, 241, 0.4)",
    },
    tap: { 
      scale: 0.97,
    },
    success: {
      backgroundColor: "#22c55e",
      transition: { duration: 0.3 }
    }
  };
  
  const sparkleVariants = {
    hidden: { opacity: 0, scale: 0 },
    visible: { 
      opacity: [0, 1, 0],
      scale: [0, 1, 0],
      transition: {
        duration: 2,
        repeat: Infinity,
        repeatType: "loop",
        ease: "easeInOut",
        times: [0, 0.5, 1]
      }
    }
  };

  // Stagger in the grid items
  const staggerGridItems = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
        delayChildren: 0.3,
      },
    },
  };
  
  // Grid item animation
  const gridItemVariants = {
    hidden: { 
      y: 20, 
      opacity: 0,
      filter: "blur(10px)",
    },
    visible: {
      y: 0,
      opacity: 1,
      filter: "blur(0px)",
      transition: { 
        type: 'spring', 
        stiffness: 70, 
        damping: 15 
      },
    },
  };

  return (
    <footer 
      ref={footerRef} 
      className="relative overflow-hidden bg-gradient-to-br from-gray-900 via-gray-950 to-black text-white py-24"
      onMouseEnter={() => setCursorHovering(true)}
      onMouseLeave={() => setCursorHovering(false)}
    >
      {/* Spotlight gradient effect */}
      <div 
        className="pointer-events-none absolute inset-0 opacity-30 mix-blend-soft-light"
        style={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(120, 119, 198, 0.15), transparent 40%)`,
        }}
      />
      
      {/* Animated particles */}
      <div className="absolute inset-0 overflow-hidden">
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ 
              x: `${Math.random() * 100}%`, 
              y: `${Math.random() * 100}%`, 
              opacity: 0.1 + (Math.random() * 0.3) 
            }}
            animate={{
              y: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
              x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`],
            }}
            transition={{
              duration: 10 + (Math.random() * 20),
              repeat: Infinity,
              repeatType: "reverse",
              ease: "linear"
            }}
            className="absolute rounded-full blur-xl opacity-[0.05]"
            style={{
              width: `${Math.floor(Math.random() * 16) + 8}px`,
              height: `${Math.floor(Math.random() * 16) + 8}px`,
              background: `hsl(${Math.floor(Math.random() * 60) + 230}, 100%, 70%)`,
            }}
          />
        ))}
      </div>

      {/* Animated gradient background */}
      <motion.div 
        className="absolute inset-0 opacity-10"
        variants={backgroundShimmerVariants}
        initial="hidden"
        animate="visible"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)',
          backgroundSize: '200% 100%'
        }}
      />
      
      {/* Moving gradient orbs */}
      <div className="absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute w-96 h-96 rounded-full opacity-10 blur-3xl"
          style={{
            background: "linear-gradient(to right, #4f46e5, #7c3aed)",
            top: "-10%",
            right: "-10%",
          }}
          animate={{
            x: [0, 100, 0],
            y: [0, 50, 0],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
        <motion.div
          className="absolute w-80 h-80 rounded-full opacity-10 blur-3xl"
          style={{
            background: "linear-gradient(to right, #4338ca, #7e22ce)",
            bottom: "-15%",
            left: "-5%",
          }}
          animate={{
            x: [0, -70, 0],
            y: [0, 100, 0],
          }}
          transition={{
            duration: 30,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      </div>

      {/* Glowing border top */}
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-600 to-transparent opacity-30"></div>

      <div className="container mx-auto px-6 relative z-10">
        {/* Newsletter signup section (NEW) */}
        <motion.div
          ref={newsletterRef}
          variants={newsletterVariants}
          initial="hidden"
          animate={newsletterControls}
          className="mb-20 p-6 sm:p-8 bg-gradient-to-br from-gray-800/70 to-gray-900/70 rounded-2xl backdrop-blur-md border border-indigo-900/40 shadow-xl"
        >
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="mb-6 md:mb-0 md:mr-8 max-w-md">
              <motion.h3 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="text-2xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-indigo-300 to-purple-300"
              >
                Join Our Newsletter
              </motion.h3>
              <motion.p 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4, duration: 0.6 }}
                className="text-gray-400"
              >
                Stay updated with the latest design trends, AI innovations, and exclusive offers.
              </motion.p>
            </div>
            
            <motion.form 
              onSubmit={handleSubmit}
              className="w-full md:w-auto flex-1 flex flex-col sm:flex-row gap-3 items-center"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.6, duration: 0.6 }}
            >
              <div className="relative w-full sm:w-auto flex-1">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="w-full pl-4 pr-12 py-3.5 bg-gray-900/60 border border-gray-700 focus:border-indigo-500 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 transition-all"
                  required
                />
                <Mail className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-500" size={18} />
              </div>
              
              <motion.button
                type="submit"
                className={`w-full sm:w-auto px-6 py-3.5 font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${isSubmitted ? 'bg-green-600' : 'bg-indigo-600 hover:bg-indigo-500'}`}
                variants={buttonVariants}
                animate={isSubmitted ? "success" : "visible"}
                whileHover="hover"
                whileTap="tap"
              >
                {isSubmitted ? (
                  <>
                    <span>Subscribed!</span>
                    <Heart size={18} className="ml-1 animate-pulse" />
                  </>
                ) : (
                  <>
                    <span>Subscribe</span>
                    <Send size={18} className="ml-1" />
                  </>
                )}
              </motion.button>
            </motion.form>
          </div>
        </motion.div>

        {/* Main footer grid */}
        <motion.div 
          variants={staggerGridItems}
          initial="hidden"
          animate={controls}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12"
        >
          {/* Company Info */}
          <motion.div variants={gridItemVariants} className="col-span-1 md:col-span-2 lg:col-span-1">
            <motion.div 
              className="mb-4 relative inline-block"
              variants={floatingVariants}
              initial="initial"
              animate="animate"
            >
              <span className="text-3xl font-bold bg-gradient-to-r from-indigo-400 via-purple-500 to-pink-500 bg-clip-text text-transparent">
                DesignFlow
              </span>
              {/* Animated sparkles around logo */}
              {[...Array(3)].map((_, i) => (
                <motion.div 
                  key={i}
                  variants={sparkleVariants}
                  initial="hidden"
                  animate="visible"
                  custom={i}
                  className="absolute"
                  style={{
                    top: `${Math.random() * 100}%`,
                    left: `${Math.random() * 100}%`,
                    width: "8px",
                    height: "8px",
                    borderRadius: "50%",
                    background: "white",
                  }}
                >
                  <Sparkles size={8} className="text-white" />
                </motion.div>
              ))}
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 1, duration: 0.8, ease: "easeInOut" }}
                className="absolute -bottom-1 left-0 h-[2px] bg-gradient-to-r from-indigo-500 to-purple-500"
              />
            </motion.div>
            <p className="text-gray-400 mb-8 max-w-xs">
              AI powered innovation on tap. 
              Only pay for the pieces you need.
            </p>
            <div className="flex space-x-5">
              {[
                { icon: <Linkedin size={20} />, href: "https://linkedin.com" },
                { icon: <Twitter size={20} />, href: "https://twitter.com" },
                { icon: <Instagram size={20} />, href: "https://instagram.com" },
                { icon: <Github size={20} />, href: "https://github.com" }
              ].map((social, index) => (
                <motion.a 
                  key={index}
                  href={social.href} 
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gray-400 hover:text-white transition-all"
                  variants={socialIconVariants}
                  whileHover="hover"
                >
                  <motion.div 
                    className="p-3 bg-gray-800/50 rounded-full backdrop-blur-sm"
                    whileHover={{ 
                      boxShadow: '0 0 15px rgba(79, 70, 229, 0.6)',
                      backgroundColor: 'rgba(79, 70, 229, 0.2)' 
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    {social.icon}
                  </motion.div>
                </motion.a>
              ))}
            </div>
          </motion.div>

          {/* Services */}
          <motion.div variants={gridItemVariants}>
            <h3 className="text-lg font-medium mb-5 relative inline-block">
              Services
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 1.2, duration: 0.5, ease: "easeInOut" }}
                className="absolute -bottom-1 left-0 h-[2px] bg-gradient-to-r from-indigo-500 to-transparent"
              />
            </h3>
            <ul className="space-y-4">
              {[
                { title: 'AI-Enabled Solutions', href: '/services/ai-solutions' },
                { title: 'Digital Products & Web', href: '/services/digital-products' },
                { title: 'Creative & Branding', href: '/services/creative' },
                { title: 'Growth & Support', href: '/services/growth' },
              ].map((link, index) => (
                <motion.li 
                  key={index}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * index + 1.5, duration: 0.4 }}
                >
                  <Link href={link.href} className="group block">
                    <div className="flex items-center p-3 rounded-lg transition-all duration-300 hover:bg-indigo-900/20">
                      <div className="mr-3 bg-indigo-900/30 p-2 rounded-lg text-indigo-400 group-hover:bg-indigo-600/30 transition-all duration-300">
                        <ExternalLink size={14} />
                      </div>
                      <span className="text-gray-400 group-hover:text-white transition-colors">
                        {link.title}
                      </span>
                      <motion.div 
                        initial={{ x: -5, opacity: 0 }} 
                        whileHover={{ x: 0, opacity: 1 }}
                        className="ml-auto"
                      >
                        <ArrowRight size={16} className="text-indigo-400" />
                      </motion.div>
                    </div>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Company */}
          <motion.div variants={gridItemVariants}>
            <h3 className="text-lg font-medium mb-5 relative inline-block">
              Company
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 1.4, duration: 0.5, ease: "easeInOut" }}
                className="absolute -bottom-1 left-0 h-[2px] bg-gradient-to-r from-indigo-500 to-transparent"
              />
            </h3>
            <ul className="space-y-4">
              {[
                { title: 'About Us', href: '/about' },
                { title: 'Case Studies', href: '/case-studies' },
                { title: 'Careers', href: '/careers' },
                { title: 'Blog', href: '/blog' },
                { title: 'Privacy Policy', href: '/privacy' },
              ].map((link, index) => (
                <motion.li 
                  key={index}
                  initial={{ x: -10, opacity: 0 }}
                  animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.1 * index + 1.5, duration: 0.4 }}
                >
                  <Link href={link.href} className="group block">
                    <div className="flex items-center p-3 rounded-lg transition-all duration-300 hover:bg-indigo-900/20">
                      <span className="text-gray-400 group-hover:text-white transition-colors">
                        {link.title}
                      </span>
                      <motion.span 
                        initial={{ x: -10, opacity: 0 }} 
                        whileHover={{ x: 0, opacity: 1 }}
                        className="ml-auto text-indigo-400"
                      >
                        <ArrowRight size={16} />
                      </motion.span>
                    </div>
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.div>

          {/* Contact */}
          <motion.div variants={gridItemVariants}>
            <h3 className="text-lg font-medium mb-5 relative inline-block">
              Contact
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ delay: 1.6, duration: 0.5, ease: "easeInOut" }}
                className="absolute -bottom-1 left-0 h-[2px] bg-gradient-to-r from-indigo-500 to-transparent"
              />
            </h3>
            <ul className="space-y-5">
              <motion.li 
                className="group"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <div className="flex items-start">
                  <motion.div 
                    whileHover={{ scale: 1.1, color: "#818cf8" }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="bg-indigo-900/30 p-2 rounded-lg mr-3 mt-0.5 flex-shrink-0"
                  >
                    <MapPin size={18} className="text-indigo-400" />
                  </motion.div>
                  <div>
                    <span className="text-gray-400 group-hover:text-white transition-colors block">
                      123 Innovation Street
                    </span>
                    <span className="text-gray-500 text-sm">
                      Tech City, 10001
                    </span>
                  </div>
                </div>
              </motion.li>
              <motion.li 
                className="group"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <div className="flex items-center">
                  <motion.div 
                    whileHover={{ scale: 1.1, color: "#818cf8" }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="bg-indigo-900/30 p-2 rounded-lg mr-3 flex-shrink-0"
                  >
                    <Mail size={18} className="text-indigo-400" />
                  </motion.div>
                  <a href="mailto:hello@designflow.ai" className="text-gray-400 group-hover:text-white transition-colors relative">
                    hello@designflow.ai
                    <motion.div 
                      variants={linkHoverVariants}
                      initial="initial"
                      whileHover="hover"
                      className="absolute bottom-0 left-0 h-px bg-indigo-400"
                    />
                  </a>
                </div>
              </motion.li>
              <motion.li 
                className="group"
                whileHover={{ x: 5 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
              >
                <div className="flex items-center">
                  <motion.div 
                    whileHover={{ scale: 1.1, color: "#818cf8" }}
                    transition={{ type: "spring", stiffness: 400, damping: 10 }}
                    className="bg-indigo-900/30 p-2 rounded-lg mr-3 flex-shrink-0"
                  >
                    <Phone size={18} className="text-indigo-400" />
                  </motion.div>
                  <a href="tel:+123456789" className="text-gray-400 group-hover:text-white transition-colors relative">
                    +1 (234) 567-8900
                    <motion.div 
                      variants={linkHoverVariants}
                      initial="initial"
                      whileHover="hover"
                      className="absolute bottom-0 left-0 h-px bg-indigo-400"
                    />
                  </a>
                </div>
              </motion.li>
            </ul>
            
            {/* Interactive map preview (NEW) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 2, duration: 0.5 }}
              className="mt-8 relative overflow-hidden rounded-lg h-36 border border-indigo-900/30"
            >
              <div className="absolute inset-0 bg-indigo-900/10 backdrop-blur-sm z-10"></div>
              <div 
                className="absolute inset-0 bg-gray-900"
                style={{
                  backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%234f46e5' fill-opacity='0.05' fill-rule='evenodd'/%3E%3C/svg%3E")`,
                }}
              ></div>
              
              {/* Map marker pulse animation */}
              <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-20">
                <div className="relative">
                  <span className="flex h-5 w-5">
                    <span className="absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75 animate-ping"></span>
                    <span className="relative inline-flex rounded-full h-5 w-5 bg-indigo-500"></span>
                  </span>
                </div>
              </div>
              
              {/* View on map button */}
              <div className="absolute bottom-2 right-2 z-20">
                <a 
                  href="https://maps.google.com" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs bg-indigo-600/80 hover:bg-indigo-600 px-2 py-1 rounded-md backdrop-blur-sm text-white flex items-center gap-1 transition-colors"
                >
                  <MapPin size={10} />
                  <span>View on map</span>
                </a>
                </div>
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Footer bottom section with copyright */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate={controls}
          className="mt-20 pt-10 border-t border-gray-800/50"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <motion.div 
              variants={itemVariants} 
              className="text-sm text-gray-400"
            >
              <span>© {new Date().getFullYear()} DesignFlow. All rights reserved.</span>
              <motion.div
                variants={lineVariants}
                className="h-px w-full bg-gradient-to-r from-indigo-500 to-transparent mt-1 opacity-50"
              />
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="flex items-center gap-6 text-sm text-gray-500"
            >
              <Link href="/terms" className="hover:text-white transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-white transition-colors">
                Privacy Policy
              </Link>
              <Link href="/faq" className="hover:text-white transition-colors">
                FAQs
              </Link>
            </motion.div>
            
            <motion.div 
              variants={itemVariants}
              className="flex items-center text-sm text-gray-500"
            >
              <span>Crafted with </span>
              <Heart size={14} className="mx-1 text-pink-500" />
              <span> in Tech City</span>
            </motion.div>
          </div>
        </motion.div>
      </div>
      
      {/* Scroll to top button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            onClick={scrollToTop}
            className="fixed bottom-8 right-8 z-50 p-3 bg-indigo-600 hover:bg-indigo-500 rounded-full shadow-lg text-white"
            variants={scrollButtonVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <ChevronUp size={24} />
            
            {/* Button glow effect */}
            <motion.span
              className="absolute inset-0 rounded-full"
              animate={{ 
                boxShadow: ['0 0 0 0 rgba(99, 102, 241, 0)', '0 0 0 8px rgba(99, 102, 241, 0)'],
                opacity: [0.8, 0]
              }}
              transition={{ 
                repeat: Infinity, 
                duration: 2,
                repeatType: "loop" as const
              }}
            />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Mouse follower effect for desktop */}
      {cursorHovering && (
        <motion.div
          className="fixed hidden md:block w-8 h-8 rounded-full pointer-events-none z-50 backdrop-blur-sm bg-indigo-600/20 mix-blend-screen border border-indigo-400/20"
          style={{
            left: -20,
            top: -20,
            x: mouseX,
            y: mouseY,
          }}
          animate={{
            scale: [0.8, 1.2, 0.8],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{
            duration: 2,
            ease: "easeInOut",
            repeat: Infinity,
            repeatType: "loop" as const
          }}
        />
      )}
    </footer>
  );
};

export default EnhancedFooter;