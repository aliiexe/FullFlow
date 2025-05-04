'use client'
import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function AboubakrNavBar() {
  // Keep existing state and refs
  const [navState, setNavState] = useState('expanded'); // 'expanded', 'collapsed', 'minimized'
  const [isOpen, setIsOpen] = useState(false);
  const [activeSection, setActiveSection] = useState('');
  const [windowWidth, setWindowWidth] = useState(0);
  const [mounted, setMounted] = useState(false);
  const prevScrollY = useRef(0);
  const scrollTimer = useRef<NodeJS.Timeout | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      // Clear any existing scroll timers
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
      
      // Close menu if scrolling and menu is open
      if (isOpen && Math.abs(currentScrollY - prevScrollY.current) > 30) {
        setIsOpen(false);
      }
      
      // Track active section
      const sections = ['hero', 'services', 'pricing', 'process', 'faq'];
      const scrollPosition = currentScrollY + 100; // Offset for better detection
      
      // Find the current section based on scroll position
      for (const section of sections) {
        const element = document.getElementById(section);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop && 
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(section);
            break;
          }
        }
      }
      
      if (currentScrollY > prevScrollY.current && currentScrollY > 100) {
        // Scrolling DOWN - collapse nav
        if (navState === 'expanded') {
          setNavState('collapsed');
          
          // Increased delay before minimizing to allow full transition viewing
          scrollTimer.current = setTimeout(() => {
            if (window.scrollY > prevScrollY.current) {
              setNavState('minimized');
              // Ensure menu closes when minimized
              if (isOpen) setIsOpen(false);
            }
          }, 1200); // Increased from 800ms to 1200ms
        } else if (navState === 'collapsed' && !isOpen) {
          // Add a small delay before minimizing from collapsed state
          scrollTimer.current = setTimeout(() => {
            setNavState('minimized');
            // Ensure menu closes when minimized
            if (isOpen) setIsOpen(false);
          }, 300);
        }
      } else if (currentScrollY < prevScrollY.current) {
        // Scrolling UP - expand nav
        if (navState === 'minimized') {
          setNavState('expanded');
          
          // Increased delay before expanding to allow full transition viewing
          scrollTimer.current = setTimeout(() => {
            if (window.scrollY < prevScrollY.current) {
              setNavState('collapsed');
            }
          }, 1200); // Increased from 800ms to 1200ms
        } else if (navState === 'collapsed' && !isOpen) {
          // Add small delay before expanding from collapsed state
          scrollTimer.current = setTimeout(() => {
            setNavState('expanded');
          }, 300);
        }
      }
      
      prevScrollY.current = currentScrollY;
    };

    // Modified throttled scroll handler to be more responsive but not too frequent
    let ticking = false;
    let lastScrollTime = 0;
    const scrollThrottle = 120; // ms between scroll events

    const onScroll = () => {
      const now = Date.now();
      if (!ticking && now - lastScrollTime > scrollThrottle) {
        lastScrollTime = now;
        window.requestAnimationFrame(() => {
          handleScroll();
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', onScroll);
    // Initial check for active section
    handleScroll();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('scroll', onScroll);
      if (scrollTimer.current) clearTimeout(scrollTimer.current);
    };
  }, [navState, isOpen]);

  // Other utility functions and variables remain the same
  const isMobile = windowWidth < 768;

  // Navigation items with their section IDs - matching the original NavBar
  const navItems = [
    { name: 'About', id: 'hero' },
    { name: 'Services', id: 'services' },
    { name: 'Plans', id: 'pricing' },
    { name: 'Process', id: 'process' },
    { name: 'FAQ', id: 'faq' }
  ];

  // Handle smooth scrolling
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80, // Offset for navbar height
        behavior: 'smooth'
      });
      
      setActiveSection(sectionId);
      
      // Close mobile menu
      if (isMobile) {
        setIsOpen(false);
      }
    }
  };

  const toggleNav = () => {
    // FIX: Modified this function to properly handle mobile menu state
    if (navState === 'minimized') {
      // First expand the nav before opening menu
      setNavState('expanded');
      // Small delay before opening menu
      setTimeout(() => {
        setIsOpen(true);
      }, 300);
    } else {
      // Simply toggle menu
      setIsOpen(!isOpen);
    }
  };

  // Enhanced motion variants with smoother transitions
  const navVariants = {
    expanded: {
      width: '90%',
      maxWidth: '1200px',
      height: '80px',
      borderRadius: '32px',
      x: 0,
    },
    collapsed: {
      width: '300px',
      height: '60px',
      borderRadius: '24px',
      x: 0,
    },
    minimized: {
      width: '50px',
      height: '50px',
      borderRadius: '50%',
      x: '45vw',
    }
  };

  const menuVariants = {
    closed: {
      opacity: 0,
      height: 0,
      transition: {
        staggerChildren: 0.05,
        staggerDirection: -1,
        when: "afterChildren",
        duration: 0.4,
        ease: [0.25, 1, 0.5, 1]
      }
    },
    open: {
      opacity: 1,
      height: 'auto',
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.1,
        when: "beforeChildren",
        duration: 0.4,
        ease: [0.25, 1, 0.5, 1]
      }
    }
  };

  const itemVariants = {
    open: { // FIX: Changed from "expanded" to "open" to match menuVariants
      opacity: 1,
      y: 0,
      transition: {
        type: "spring",
        stiffness: 300,
        damping: 24
      }
    },
    closed: { // FIX: Changed from "collapsed" to "closed" to match menuVariants
      opacity: 0,
      y: 10,
      transition: {
        duration: 0.2
      }
    }
  };

  // Calculate visual state based on both navState and isOpen
  const visualState = isOpen && isMobile 
    ? 'expanded'  // FIX: Always use expanded state when mobile menu is open
    : navState;

  return (
    <motion.nav
      className="fixed top-6 left-0 right-0 z-50 flex justify-center w-full px-4 pointer-events-none"
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.div
        ref={navRef}
        className={`pointer-events-auto flex ${isMobile ? 'flex-col w-full' : 'flex-row w-auto'} max-w-full overflow-hidden`}
        variants={navVariants}
        initial="expanded"
        animate={visualState}
        transition={{
          type: "spring",
          stiffness: 80, // Reduced from 150 for slower movement
          damping: 22, // Increased from 20 for smoother finish
          mass: 1.2, // Increased from 1 for more weightiness
          duration: 0.8 // Added explicit duration for slower animation
        }}
        style={{
          background: 'linear-gradient(142deg, rgba(255, 255, 255, 0.15) -61.21%, rgba(255, 255, 255, 0.05) 96.65%)',
          boxShadow: '0px 4px 24px -1px rgba(0, 0, 0, 0.20)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          padding: isMobile ? '12px 16px' : '8px 16px',
        }}
      >
        <AnimatePresence mode="wait">
          {(visualState !== 'minimized') ? (
            <div className="flex justify-between items-center w-full">
              {/* Logo Section */}
              <motion.div 
                className="text-white font-bold text-xl flex items-center"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
              >
                <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg" className="mr-2">
                  <path d="M14 2C7.373 2 2 7.373 2 14C2 20.627 7.373 26 14 26C20.627 26 26 20.627 26 14C26 7.373 20.627 2 14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 19C16.7614 19 19 16.7614 19 14C19 11.2386 16.7614 9 14 9C11.2386 9 9 11.2386 9 14C9 16.7614 11.2386 19 14 19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 6V2M22 14H26M14 22V26M6 14H2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                {visualState === 'expanded' && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                  >
                    Full Flow
                  </motion.span>
                )}
              </motion.div>

              {/* Navigation Items - Desktop */}
              {!isMobile ? (
                <div className="flex items-center gap-4 mx-auto">
                  {navItems.map((item, index) => (
                    <motion.button
                      key={item.name}
                      onClick={() => scrollToSection(item.id)}
                      className="text-white no-underline text-sm font-medium relative bg-transparent border-none cursor-pointer px-4 py-2 rounded-md overflow-hidden"
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ 
                        delay: 0.2 + index * 0.1,
                        duration: 0.5,
                        ease: [0.25, 1, 0.5, 1]
                      }}
                      whileTap={{ scale: 0.97 }}
                    >
                      <span className="relative z-10">{item.name}</span>
                      
                      {/* Background only for active state */}
                      <motion.div 
                        className="absolute inset-0 -z-10 rounded-md"
                        initial={{ backgroundColor: 'rgba(255, 255, 255, 0)', backdropFilter: 'blur(0px)' }}
                        animate={{ 
                          backgroundColor: activeSection === item.id 
                            ? 'rgba(255, 255, 255, 0.1)' 
                            : 'rgba(255, 255, 255, 0)',
                          backdropFilter: activeSection === item.id ? 'blur(8px)' : 'blur(0px)',
                        }}
                        whileHover={{ 
                          scale: 1.02,
                          backgroundColor: activeSection === item.id 
                            ? 'rgba(255, 255, 255, 0.15)' 
                            : 'rgba(255, 255, 255, 0)'
                        }}
                        transition={{ 
                          duration: 0.5, // Increased from 0.4
                          ease: [0.25, 1, 0.5, 1],
                        }}
                      />
                    </motion.button>
                  ))}
                </div>
              ) : (
                isOpen ? (
                  <motion.button
                    onClick={() => setIsOpen(false)}
                    className="bg-transparent border-none cursor-pointer p-0 z-10 w-6 h-6 flex items-center justify-center self-end"
                    whileHover={{ scale: 1.1, rotate: -90 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                  >
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M18 6L6 18M6 6L18 18" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </motion.button>
                ) : (
                  <motion.button
                    onClick={toggleNav}
                    className="bg-transparent border-none cursor-pointer z-10 p-0 flex flex-col items-center justify-center h-6 w-6"
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                  >
                    <motion.div className="w-5 h-0.5 bg-white my-0.5" />
                    <motion.div className="w-5 h-0.5 bg-white my-0.5" />
                    <motion.div className="w-5 h-0.5 bg-white my-0.5" />
                  </motion.button>
                )
              )}

              {/* CTA Button - Desktop */}
              {!isMobile && visualState === 'expanded' && (
                <motion.button
                  className="border border-white/30 rounded-full bg-transparent text-white py-1.5 px-4 text-sm font-medium cursor-pointer flex items-center gap-2 ml-4"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ 
                    delay: 0.4, 
                    duration: 0.5,
                    ease: [0.25, 1, 0.5, 1]
                  }}
                  whileHover={{ 
                    scale: 1.03, 
                    background: 'rgba(255, 255, 255, 0.1)' 
                  }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => scrollToSection('pricing')}
                >
                  Get Started
                  <motion.span
                    initial={{ x: 0 }}
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                  >
                    →
                  </motion.span>
                </motion.button>
              )}
            </div>
          ) : (
            <motion.button
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.5, ease: [0.25, 1, 0.5, 1] }}
              className="w-full h-full flex items-center justify-center"
              onClick={toggleNav}
              aria-label="Open navigation"
              key="minimized-button"
            >
              <svg width="20" height="14" viewBox="0 0 20 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M1 1H19M1 7H19M1 13H19" stroke="white" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </motion.button>
          )}
        </AnimatePresence>
        
        {/* Mobile Menu - FIX: Modified to ensure mobile menu shows properly */}
        <AnimatePresence>
          {isMobile && isOpen && (
            <motion.div
              variants={menuVariants}
              initial="closed"
              animate="open" 
              exit="closed"
              className="w-full overflow-hidden"
            >
              <motion.div
                className="flex flex-col w-full pt-6 pb-2 border-t border-white/10 mt-2"
              >
                {navItems.map((item) => (
                  <motion.button
                    key={item.name}
                    variants={itemVariants}
                    onClick={() => scrollToSection(item.id)}
                    className="text-white bg-transparent border-none no-underline py-3 px-4 text-base font-medium text-center relative overflow-hidden cursor-pointer mx-2 rounded-md"
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
                  >
                    <span className="relative z-10">{item.name}</span>
                    
                    {/* Background only for active state */}
                    <motion.div 
                      className="absolute inset-0 -z-10 rounded-md"
                      initial={{ backgroundColor: 'rgba(255, 255, 255, 0)', backdropFilter: 'blur(0px)' }}
                      animate={{ 
                        backgroundColor: activeSection === item.id 
                          ? 'rgba(255, 255, 255, 0.1)' 
                          : 'rgba(255, 255, 255, 0)',
                        backdropFilter: activeSection === item.id ? 'blur(8px)' : 'blur(0px)',
                      }}
                      whileHover={{ 
                        scale: 1.01
                      }}
                      transition={{ 
                        duration: 0.5,
                        ease: [0.25, 1, 0.5, 1] 
                      }}
                    />
                  </motion.button>
                ))}
                <motion.button
                  variants={itemVariants}
                  className="border border-white/30 rounded-full bg-transparent text-white py-2.5 px-4 text-sm font-medium cursor-pointer flex items-center justify-center gap-2 my-4 mx-auto w-4/5"
                  whileTap={{ scale: 0.98 }}
                  onClick={() => scrollToSection('pricing')}
                >
                  <motion.span className="relative z-10 flex items-center gap-2">
                    Get Started
                    <motion.span
                      initial={{ x: 0 }}
                      whileHover={{ x: 3 }}
                      transition={{ duration: 0.3, ease: [0.25, 1, 0.5, 1] }}
                    >
                      →
                    </motion.span>
                  </motion.span>
                  
                  {/* Animated background on hover */}
                  <motion.div 
                    className="absolute inset-0 -z-0"
                    initial={{ opacity: 0 }}
                    whileHover={{ 
                      opacity: 1, 
                      background: 'rgba(255, 255, 255, 0.1)' 
                    }}
                    transition={{ 
                      duration: 0.5,
                      ease: [0.25, 1, 0.5, 1]
                    }}
                  />
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.nav>
  );
}