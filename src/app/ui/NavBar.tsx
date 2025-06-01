"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";

const AnimatedText = ({ text }: { text: string }) => {
  return (
    <span>
      {text.split("").map((char, idx) => (
        <span
          key={idx}
          className="animated-char"
          style={
            char === " " ? { display: "inline-block", width: "0.5em" } : {}
          }
        >
          {char === " " ? "\u00A0" : char}
        </span>
      ))}
    </span>
  );
};

const NavBar = () => {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(0);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    setMounted(true);
    setWindowWidth(window.innerWidth);

    const handleResize = () => {
      setWindowWidth(window.innerWidth);
      if (window.innerWidth > 768) {
        setIsOpen(false);
      }
    };

    window.addEventListener("resize", handleResize);

    // Add scroll event listener to track active section
    const handleScroll = () => {
      const sections = ["hero", "services", "pricing", "process", "faq"];
      const scrollPosition = window.scrollY + 100; // Offset for better detection

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
    };

    window.addEventListener("scroll", handleScroll);
    // Initial check for active section
    handleScroll();

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  const isMobile = windowWidth <= 768;

  // Navigation items with their section IDs
  const navItems = [
    { name: "About", id: "hero" },
    { name: "Services", id: "services" },
    { name: "Plans", id: "pricing" },
    { name: "Process", id: "process" },
    { name: "Our projects", id: "our-projects" },
    { name: "FAQ", id: "faq" },
  ];

  // Handle smooth scrolling
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId);
    if (element) {
      window.scrollTo({
        top: element.offsetTop - 80, // Offset for navbar height
        behavior: "smooth",
      });

      setActiveSection(sectionId);

      // Close mobile menu
      if (isMobile) {
        setIsOpen(false);
      }
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
        duration: 0.3,
        ease: "easeInOut",
      },
    },
    open: {
      opacity: 1,
      height: "auto",
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
        when: "beforeChildren",
        duration: 0.3,
        ease: "easeInOut",
      },
    },
  };

  const itemVariants = {
    closed: {
      opacity: 0,
      y: 20,
      transition: { duration: 0.2, ease: "easeInOut" },
    },
    open: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.2, ease: "easeInOut" },
    },
  };

  return (
    <motion.nav
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: mounted ? 1 : 0, y: 0 }}
      transition={{ duration: 0.5, ease: "easeInOut" }}
      className="fixed top-4 left-0 right-0 z-50 flex justify-center w-full px-4"
    >
      <motion.div
        className={`flex items-center justify-between ${
          isMobile ? "flex-col w-full" : "flex-row w-auto"
        } max-w-full overflow-hidden`}
        style={{
          borderRadius: isMobile && isOpen ? "16px" : "20px",
          background:
            "linear-gradient(142deg, rgba(255, 255, 255, 0.15) -61.21%, rgba(255, 255, 255, 0.05) 96.65%)",
          boxShadow: "0px 4px 24px -1px rgba(0, 0, 0, 0.20)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          padding: isMobile ? "12px 16px" : "10px 20px",
        }}
        animate={
          isMobile && isOpen
            ? { borderRadius: "16px" }
            : { borderRadius: "20px" }
        }
        transition={{ duration: 0.3, ease: "easeInOut" }}
      >
        <div className="flex justify-between gap-10 items-center w-full">
          {/* Logo section */}
          <div className="flex-shrink-0">
            <Link href="/" className="flex items-center">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="pl-2"
              >
                <Image
                  src="/FullFlowLogo.svg"
                  alt="FullFlow Logo"
                  width={isMobile ? 85 : 95}
                  height={isMobile ? 25 : 28}
                  className="object-contain"
                />
              </motion.div>
            </Link>
          </div>

          {/* Navigation Links - desktop only */}
          {!isMobile && (
            <div className="flex items-center justify-center gap-3 mx-6">
              {navItems.map((item) => (
                <motion.button
                  key={item.name}
                  onClick={() => scrollToSection(item.id)}
                  className={`text-white no-underline text-base font-medium relative bg-transparent border-none cursor-pointer px-3 py-2 rounded-lg transition-all duration-300 ${
                    activeSection === item.id ? "bg-white/20 shadow-md" : ""
                  }`}
                  whileHover={{
                    backgroundColor:
                      activeSection === item.id
                        ? "rgba(255, 255, 255, 0.25)"
                        : "rgba(255, 255, 255, 0.1)",
                  }}
                  whileTap={{ scale: 0.95 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <AnimatedText text={item.name} />
                </motion.button>
              ))}
            </div>
          )}

          {/* CTA Button or Mobile Menu Toggle */}
          <div className="flex-shrink-0">
            {isMobile ? (
              isOpen ? (
                <motion.button
                  onClick={() => setIsOpen(false)}
                  className="bg-transparent border-none cursor-pointer p-0 z-10 w-6 h-6 flex items-center justify-center self-end"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M18 6L6 18M6 6L18 18"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </motion.button>
              ) : (
                <motion.button
                  onClick={() => setIsOpen(!isOpen)}
                  className="bg-transparent border-none cursor-pointer z-10 p-0 flex flex-col items-center justify-center h-6 w-6"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <motion.div className="w-5 h-0.5 bg-white my-0.5" />
                  <motion.div className="w-5 h-0.5 bg-white my-0.5" />
                  <motion.div className="w-5 h-0.5 bg-white my-0.5" />
                </motion.button>
              )
            ) : (
              <motion.button
                className="border border-white/30 rounded-lg bg-white/10 text-white py-2 px-5 text-base font-medium cursor-pointer flex items-center gap-2"
                whileHover={{
                  scale: 1.03,
                  background: "rgba(255, 255, 255, 0.2)",
                }}
                whileTap={{ scale: 0.95 }}
                transition={{ duration: 0.2, ease: "easeInOut" }}
                onClick={() => scrollToSection("pricing")}
              >
                Get Started
                <motion.span
                  initial={{ x: 0 }}
                  whileHover={{ x: 3 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  →
                </motion.span>
              </motion.button>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobile && (
            <motion.div
              variants={menuVariants}
              initial="closed"
              animate={isOpen ? "open" : "closed"}
              exit="closed"
              className="w-full overflow-hidden"
            >
              <motion.div
                className={`flex flex-col w-full ${
                  isOpen
                    ? "pt-8 pb-4 border-t border-white/10 mt-4"
                    : "p-0 border-none mt-0"
                }`}
              >
                {navItems.map((item) => (
                  <motion.button
                    key={item.name}
                    variants={itemVariants}
                    onClick={() => scrollToSection(item.id)}
                    className={`text-white bg-transparent border-none no-underline py-3 px-5 text-base font-medium text-center relative overflow-hidden cursor-pointer mx-3 my-1 rounded-lg transition-all duration-300 ${
                      activeSection === item.id ? "bg-white/20 shadow-md" : ""
                    }`}
                    whileHover={{
                      backgroundColor: "rgba(255, 255, 255, 0.15)",
                    }}
                    whileTap={{ scale: 0.98 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <AnimatedText text={item.name} />
                  </motion.button>
                ))}
                <motion.button
                  variants={itemVariants}
                  className="border border-white/30 rounded-lg bg-white/10 text-white py-3 px-6 text-base font-medium cursor-pointer flex items-center justify-center gap-3 my-6 mx-auto w-4/5"
                  whileHover={{
                    scale: 1.02,
                    background: "rgba(255, 255, 255, 0.2)",
                  }}
                  whileTap={{ scale: 0.98 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                  onClick={() => scrollToSection("pricing")}
                >
                  Get Started
                  <motion.span
                    initial={{ x: 0 }}
                    whileHover={{ x: 3 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    →
                  </motion.span>
                </motion.button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </motion.nav>
  );
};

export default NavBar;
