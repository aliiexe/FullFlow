'use client'
import { useState, useEffect, useRef } from 'react';

export default function AboubakrNavBar() {
  const [collapsed, setCollapsed] = useState(false);
  const [stage2, setStage2] = useState(false);
  const [open, setOpen] = useState(false);
  const prevY = useRef(0);
  const stage2Timer = useRef<NodeJS.Timeout | null>(null);

  // 1. Detect scroll direction for collapse/expand
  useEffect(() => {
    const handleScroll = () => {
      const y = window.pageYOffset;
      if (y > prevY.current) {
        // scrolling down: start collapse stage1
        setCollapsed(true);
        setOpen(false);
        // Start stage2 after collapse animation
        if (stage2Timer.current) clearTimeout(stage2Timer.current);
        stage2Timer.current = setTimeout(() => setStage2(true), 1000);
      } else {
        // scrolling up: reverse the animations
        if (stage2Timer.current) clearTimeout(stage2Timer.current);
        setStage2(false);
        // Wait for stage2 to complete before expanding
        setTimeout(() => setCollapsed(false), 1000);
      }
      prevY.current = y;
    };
    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (stage2Timer.current) clearTimeout(stage2Timer.current);
    };
  }, []);

  // 3. Toggle open/close on click
  const toggle = () => {
    if (open) {
      // closing: collapse stage1 again
      setOpen(false);
      setCollapsed(true);
      // Start stage2 after collapse
      if (stage2Timer.current) clearTimeout(stage2Timer.current);
      stage2Timer.current = setTimeout(() => setStage2(true), 1000);
    } else {
      // opening: reset both collapse stages immediately
      if (stage2Timer.current) clearTimeout(stage2Timer.current);
      setStage2(false);
      setCollapsed(false);
      setOpen(true);
    }
  };

  return (
    <header
      className={`navbar-fixed ${stage2 ? 'navbar-stage2' : ''}`}
    >
      <nav className={`navbar-content ${collapsed && !open ? 'navbar-collapsed' : ''}`}>
        {(!collapsed || open) ? (
          <>
            {/* Full navbar content here */}
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
        ) : (
          <button onClick={toggle} className="navbar-toggle-btn" aria-label="Toggle menu">
            ☰
          </button>
        )}
      </nav>
    </header>
  );
}