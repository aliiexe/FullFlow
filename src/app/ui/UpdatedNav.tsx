'use client'
import { useState, useEffect, useRef } from 'react';

export default function NavBar() {
  const [collapsed, setCollapsed] = useState(false);
  const [squareStage, setSquareStage] = useState(false);
  const [circleStage, setCircleStage] = useState(false);
  const [stage2, setStage2] = useState(false);
  const [open, setOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const prevY = useRef(0);
  const squareTimer = useRef<NodeJS.Timeout | null>(null);
  const circleTimer = useRef<NodeJS.Timeout | null>(null);
  const stage2Timer = useRef<NodeJS.Timeout | null>(null);

  // Check if mobile on mount and when window resizes
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    // Initial check
    checkMobile();
    
    // Add resize listener
    window.addEventListener('resize', checkMobile);
    
    return () => {
      window.removeEventListener('resize', checkMobile);
    };
  }, []);

  // 1. Detect scroll direction for collapse/expand (desktop only)
  useEffect(() => {
    // Skip this effect on mobile
    if (isMobile) return;
    
    const handleScroll = () => {
      const y = window.pageYOffset;
      if (y > prevY.current) {
        // scrolling down: start multi-stage collapse animation
        setOpen(false);
        
        // Step 1: Collapse to square
        setCollapsed(true);
        
        // Step 2: Square to circle after delay
        if (squareTimer.current) clearTimeout(squareTimer.current);
        squareTimer.current = setTimeout(() => {
          setSquareStage(true);
          
          // Step 3: Start circle-to-right movement after circle animation
          if (circleTimer.current) clearTimeout(circleTimer.current);
          circleTimer.current = setTimeout(() => {
            setCircleStage(true);
            
            // Step 4: Start right movement animation
            if (stage2Timer.current) clearTimeout(stage2Timer.current);
            stage2Timer.current = setTimeout(() => setStage2(true), 400);
          }, 100);
        }, 400);
      } else {
        // scrolling up: reverse the animations in sequence
        
        // Step 1: Reset right position
        if (stage2Timer.current) clearTimeout(stage2Timer.current);
        setStage2(false);
        
        // Step 2: Reset circle shape after movement completes
        setTimeout(() => {
          setCircleStage(false);
          
          // Step 3: Reset square shape after circle animation
          setTimeout(() => {
            setSquareStage(false);
            
            // Step 4: Expand to full navbar after square animation
            setTimeout(() => setCollapsed(false), 400);
          }, 400);
        }, 400);
      }
      prevY.current = y;
    };
    
    window.addEventListener('scroll', handleScroll);
    
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (squareTimer.current) clearTimeout(squareTimer.current);
      if (circleTimer.current) clearTimeout(circleTimer.current);
      if (stage2Timer.current) clearTimeout(stage2Timer.current);
    };
  }, [isMobile]);

  // 3. Toggle open/close on click
  const toggle = () => {
    if (isMobile) {
      // Simple toggle for mobile
      setOpen(!open);
    } else {
      // Desktop animation behavior
      if (open) {
        // closing: multi-stage collapse animation
        setOpen(false);
        
        // Step 1: Collapse to square
        setCollapsed(true);
        
        // Step 2: Square to circle
        if (squareTimer.current) clearTimeout(squareTimer.current);
        squareTimer.current = setTimeout(() => {
          setSquareStage(true);
          
          // Step 3: Start circle-to-right movement
          if (circleTimer.current) clearTimeout(circleTimer.current);
          circleTimer.current = setTimeout(() => {
            setCircleStage(true);
            
            // Step 4: Move to right
            if (stage2Timer.current) clearTimeout(stage2Timer.current);
            stage2Timer.current = setTimeout(() => setStage2(true), 400);
          }, 400);
        }, 400);
      } else {
        // opening: reset all collapse stages in sequence
        
        // Step 1: Reset right position
        if (stage2Timer.current) clearTimeout(stage2Timer.current);
        setStage2(false);
        
        // Step 2: Reset circle shape
        setTimeout(() => {
          setCircleStage(false);
          
          // Step 3: Reset square shape
          setTimeout(() => {
            setSquareStage(false);
            
            // Step 4: Expand to full navbar
            setTimeout(() => {
              setCollapsed(false);
              setOpen(true);
            }, 400);
          }, 400);
        }, 400);
      }
    }
  };

  // Mobile navbar classes
  const mobileNavClasses = isMobile
    ? `mobile-navbar ${open ? 'mobile-navbar-open' : ''}`
    : '';

  // Desktop navbar animation classes
  const desktopNavClasses = !isMobile
    ? `${stage2 ? 'navbar-stage2' : ''}`
    : '';
    
  // Desktop navbar content animation classes
  const navbarContentClasses = !isMobile 
    ? `${collapsed && !open ? 'navbar-collapsed' : ''} ${squareStage ? 'navbar-square' : ''} ${circleStage ? 'navbar-circle' : ''}`
    : '';

  return (
    <header className={`navbar-fixed ${desktopNavClasses} ${mobileNavClasses}`}>
      {/* Main navbar container */}
      <nav className={`navbar-content ${navbarContentClasses}`}>
        {/* Mobile toggle button - always visible on mobile */}
        {isMobile && (
          <div className="mobile-navbar-header">
            <div className="navbar-logo">FullFlow</div>
            <button 
              onClick={toggle} 
              className="navbar-toggle-btn" 
              aria-label="Toggle menu"
            >
              {open ? '✕' : '☰'}
            </button>
          </div>
        )}

        {/* Desktop navigation - shown when not collapsed or when open */}
        {(!isMobile && (!collapsed || open)) ? (
          <>
            <div className="navbar-logo">FullFlow</div>
            <ul className="navbar-menu">
              <li><a href="#">Services</a></li>
              <li><a href="#">Features</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
            <div className="navbar-actions">
              <a href="#" className="navbar-login">Login</a>
              <a href="#" className="navbar-cta">Sign Up</a>
            </div>
          </>
        ) : !isMobile && (
          <button onClick={toggle} className="navbar-toggle-btn" aria-label="Toggle menu">
            ☰
          </button>
        )}

        {/* Mobile navigation links - shown only when open */}
        {isMobile && open && (
          <div className="mobile-navbar-content">
            <ul className="mobile-navbar-menu">
              <li><a href="#">Services</a></li>
              <li><a href="#">Features</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">Blog</a></li>
            </ul>
            <div className="mobile-navbar-actions">
              <a href="#" className="navbar-login">Login</a>
              <a href="#" className="navbar-cta">Sign Up</a>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}