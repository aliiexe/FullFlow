'use client'
import { FC, useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';

const SECTION1_HEIGHT = 550;
const SECTION2_HEIGHT = 500; // Adjusted contact section height
const SCROLL_BOTTOM_THRESHOLD = 5;
const OPEN_DELAY = 100;

const SlidingFooter: FC = () => {
  const [open, setOpen] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const lastScrollY = useRef<number>(0);
  const openTimeout = useRef<number | null>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.style.maxHeight = `${SECTION1_HEIGHT}px`;
    }
    lastScrollY.current = window.scrollY;
  }, []);

  const clearOpenTimeout = () => {
    if (openTimeout.current) {
      clearTimeout(openTimeout.current);
      openTimeout.current = null;
    }
  };

  const setHeight = (isOpen: boolean) => {
    if (!containerRef.current) return;
    const targetHeight = isOpen ? SECTION1_HEIGHT + SECTION2_HEIGHT : SECTION1_HEIGHT;
    containerRef.current.style.maxHeight = `${targetHeight}px`;
  };

  const toggleOpen = (): void => {
    clearOpenTimeout();
    setOpen(prev => {
      const next = !prev;
      setHeight(next);
      return next;
    });
  };

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY;
      const scrollPos = currentY + window.innerHeight;
      const docHeight = document.documentElement.scrollHeight;
      const delta = currentY - lastScrollY.current;

      if (scrollPos >= docHeight - SCROLL_BOTTOM_THRESHOLD && delta > 0 && !open) {
        if (!openTimeout.current) {
          openTimeout.current = window.setTimeout(() => {
            setOpen(true);
            setHeight(true);
            window.setTimeout(() => {
              window.scrollBy({ top: SECTION2_HEIGHT, behavior: 'smooth' });
            }, 500);
            openTimeout.current = null;
          }, OPEN_DELAY);
        }
      } else if ((open || openTimeout.current) && delta < 0) {
        clearOpenTimeout();
        if (open) {
          setOpen(false);
          setHeight(false);
        }
      }

      lastScrollY.current = currentY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      clearOpenTimeout();
      window.removeEventListener('scroll', handleScroll);
    };
  }, [open]);

  return (
    <div className="footer-wrapper">
      <div ref={containerRef} className="footer-container">
        {/* Main Footer - Simplified Design */}
        <div className="section section1">
          <div className="footer-content">
            <div className="footer-company">
              <div className="footer-logo">
                <svg width="30" height="30" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M14 2C7.373 2 2 7.373 2 14C2 20.627 7.373 26 14 26C20.627 26 26 20.627 26 14C26 7.373 20.627 2 14 2Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 19C16.7614 19 19 16.7614 19 14C19 11.2386 16.7614 9 14 9C11.2386 9 9 11.2386 9 14C9 16.7614 11.2386 19 14 19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                  <path d="M14 6V2M22 14H26M14 22V26M6 14H2" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="footer-company-name">Full Flow</span>
              </div>
              <p className="footer-company-desc">
                Streamline your workflow with AI-powered automation.
              </p>
              <div className="footer-social">
                <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 4.01c-1 .49-1.98.689-3 .99-1.121-1.265-2.783-1.335-4.38-.737S11.977 6.323 12 8v1c-3.245.083-6.135-1.395-8-4 0 0-4.182 7.433 4 11-1.872 1.247-3.739 2.088-6 2 3.308 1.803 6.913 2.423 10.034 1.517 3.58-1.04 6.522-3.723 7.651-7.742a13.84 13.84 0 0 0 .497-3.753C20.18 7.773 21.692 5.25 22 4.009z"></path>
                  </svg>
                </a>
                <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                    <rect x="2" y="9" width="4" height="12"></rect>
                    <circle cx="4" cy="4" r="2"></circle>
                  </svg>
                </a>
                <a href="https://github.com" target="_blank" rel="noopener noreferrer" aria-label="GitHub">
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 19c-5 1.5-5-2.5-7-3m14 6v-3.87a3.37 3.37 0 0 0-.94-2.61c3.14-.35 6.44-1.54 6.44-7A5.44 5.44 0 0 0 20 4.77 5.07 5.07 0 0 0 19.91 1S18.73.65 16 2.48a13.38 13.38 0 0 0-7 0C6.27.65 5.09 1 5.09 1A5.07 5.07 0 0 0 5 4.77a5.44 5.44 0 0 0-1.5 3.78c0 5.42 3.3 6.61 6.44 7A3.37 3.37 0 0 0 9 18.13V22"></path>
                  </svg>
                </a>
              </div>
            </div>
            
            <div className="footer-links-columns">
              <div className="footer-links-group">
                <h4>Product</h4>
                <ul className="footer-links">
                  <li><a href="#features">Features</a></li>
                  <li><a href="#pricing">Pricing</a></li>
                  <li><a href="#integrations">Integrations</a></li>
                </ul>
              </div>
              
              <div className="footer-links-group">
                <h4>Resources</h4>
                <ul className="footer-links">
                  <li><a href="#blog">Blog</a></li>
                  <li><a href="#documentation">Documentation</a></li>
                  <li><a href="#guides">Guides</a></li>
                </ul>
              </div>
              
              <div className="footer-links-group">
                <h4>Company</h4>
                <ul className="footer-links">
                  <li><a href="#about">About</a></li>
                  <li><a href="#careers">Careers</a></li>
                  <li><a href="#contact">Contact</a></li>
                </ul>
              </div>
            </div>
            
            <div className="footer-newsletter">
              <div className="newsletter-form">
                <input type="email" placeholder="Enter your email" />
                <motion.button 
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="newsletter-btn"
                >
                  Subscribe
                </motion.button>
              </div>
              <motion.button className="contact-btn" onClick={toggleOpen}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ duration: 0.2 }}
              >
                Contact Us
              </motion.button>
            </div>
          </div>
          
          <div className="footer-bottom">
            <p className="copyright">© {new Date().getFullYear()} Full Flow. All rights reserved.</p>
            <div className="legal-links">
              <a href="#terms">Terms</a>
              <a href="#privacy">Privacy</a>
              <a href="#cookies">Cookies</a>
            </div>
          </div>
        </div>
        
        {/* Contact Form Section - Simplified */}
        <div className={`section section2 ${open ? 'visible' : ''}`}>
          <div className="contact-header">
            <h3>Get in Touch</h3>
            <motion.button 
              className="close-btn" 
              onClick={toggleOpen}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </motion.button>
          </div>
          
          <form className="contact-form">
            <div className="form-row">
              <div className="form-group">
                <input type="text" id="name" name="name" placeholder="Name" required />
              </div>
              
              <div className="form-group">
                <input type="email" id="email" name="email" placeholder="Email" required />
              </div>
            </div>
            
            <div className="form-group">
              <input type="text" id="subject" name="subject" placeholder="Subject" />
            </div>
            
            <div className="form-group">
              <textarea id="message" name="message" rows={4} placeholder="Your message" required></textarea>
            </div>
            
            <motion.button 
              type="submit" 
              className="submit-btn"
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
            >
              Send Message
            </motion.button>
          </form>
        </div>
      </div>

      <style jsx>{`
        .footer-wrapper {
          width: 100%;
        }
        
        .footer-container {
          width: 100%;
          overflow: hidden;
          background: rgba(13, 13, 20, 0.85);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          box-shadow: 0 -4px 24px rgba(0, 0, 0, 0.2);
          transition: max-height 0.5s cubic-bezier(0.25, 1, 0.5, 1);
          max-height: 0;
          z-index: 1000;
          color: #f8f9fa;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .section {
          padding: 40px 32px;
        }
        
        .section1 {
          display: flex; 
          flex-direction: column;
          align-items: stretch; 
          justify-content: space-between;
          min-height: ${SECTION1_HEIGHT}px; 
        }
        
        .footer-content {
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 40px;
        }
        
        /* Company section */
        .footer-company {
          flex: 1;
          min-width: 200px;
          max-width: 320px;
        }
        
        .footer-logo {
          display: flex;
          align-items: center;
          margin-bottom: 16px;
        }
        
        .footer-company-name {
          font-size: 20px;
          font-weight: 600;
          margin-left: 10px;
        }
        
        .footer-company-desc {
          margin-bottom: 20px;
          color: rgba(248, 249, 250, 0.7);
          font-size: 14px;
          line-height: 1.5;
        }
        
        .footer-social {
          display: flex;
          gap: 12px;
        }
        
        .footer-social a {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 32px;
          height: 32px;
          border-radius: 6px;
          background: rgba(255, 255, 255, 0.05);
          color: #f8f9fa;
          transition: all 0.2s ease;
        }
        
        .footer-social a:hover {
          background: rgba(255, 255, 255, 0.1);
          transform: translateY(-2px);
        }
        
        /* Links columns */
        .footer-links-columns {
          display: flex;
          gap: 40px;
          flex: 2;
          justify-content: space-around;
          max-width: 500px;
        }
        
        .footer-links-group h4 {
          font-size: 15px;
          font-weight: 600;
          margin-bottom: 16px;
          color: #f8f9fa;
        }
        
        .footer-links {
          list-style: none;
          padding: 0;
          margin: 0;
        }
        
        .footer-links li {
          margin-bottom: 10px;
        }
        
        .footer-links a {
          color: rgba(248, 249, 250, 0.6);
          text-decoration: none;
          font-size: 14px;
          transition: color 0.2s ease;
        }
        
        .footer-links a:hover {
          color: #f8f9fa;
        }
        
        /* Newsletter */
        .footer-newsletter {
          flex: 1;
          min-width: 240px;
          max-width: 320px;
        }
        
        .newsletter-form {
          display: flex;
          margin-bottom: 16px;
        }
        
        .newsletter-form input {
          flex: 1;
          padding: 10px 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px 0 0 6px;
          color: #f8f9fa;
          font-size: 14px;
        }
        
        .newsletter-form input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.2);
        }
        
        .newsletter-btn {
          padding: 10px 16px;
          background: linear-gradient(135deg, #7928CA, #FF0080);
          color: #fff;
          border: none;
          border-radius: 0 6px 6px 0;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .contact-btn {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.1);
          color: #f8f9fa;
          padding: 10px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          transition: all 0.2s ease;
          width: 100%;
        }
        
        .contact-btn:hover {
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
        }
        
        /* Footer bottom */
        .footer-bottom {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding-top: 24px;
          margin-top: 24px;
          border-top: 1px solid rgba(255, 255, 255, 0.05);
        }
        
        .copyright {
          font-size: 13px;
          color: rgba(248, 249, 250, 0.5);
        }
        
        .legal-links {
          display: flex;
          gap: 20px;
        }
        
        .legal-links a {
          color: rgba(248, 249, 250, 0.5);
          text-decoration: none;
          font-size: 13px;
          transition: color 0.2s ease;
        }
        
        .legal-links a:hover {
          color: #f8f9fa;
        }
        
        /* Contact Section Styles */
        .section2 {
          background: rgba(16, 16, 24, 0.9);
          min-height: ${SECTION2_HEIGHT}px;
          opacity: 0;
          transform: translateY(20px);
          transition: opacity 0.5s ease-out, transform 0.5s ease-out;
          max-width: 720px;
          margin: 0 auto;
        }
        
        .section2.visible {
          opacity: 1;
          transform: translateY(0);
        }
        
        .contact-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 32px;
        }
        
        .contact-header h3 {
          font-size: 24px;
          font-weight: 600;
          margin: 0;
        }
        
        .close-btn {
          background: transparent;
          color: #f8f9fa;
          border: none;
          width: 36px;
          height: 36px;
          border-radius: 6px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .close-btn:hover {
          background: rgba(255, 255, 255, 0.1);
        }
        
        /* Form styles */
        .contact-form {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        
        .form-row {
          display: flex;
          gap: 16px;
        }
        
        .form-group {
          flex: 1;
        }
        
        input, textarea {
          width: 100%;
          padding: 12px 16px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          color: #f8f9fa;
          font-size: 14px;
          transition: all 0.2s ease;
        }
        
        input:focus, textarea:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.2);
          background: rgba(255, 255, 255, 0.05);
        }
        
        .submit-btn {
          align-self: flex-start;
          background: linear-gradient(135deg, #7928CA, #FF0080);
          color: #fff;
          border: none;
          padding: 12px 28px;
          border-radius: 6px;
          font-weight: 500;
          font-size: 14px;
          cursor: pointer;
          margin-top: 8px;
          transition: all 0.2s ease;
        }
        
        @media (max-width: 900px) {
          .footer-content {
            flex-direction: column;
          }
          
          .footer-company, .footer-links-columns, .footer-newsletter {
            max-width: 100%;
          }
          
          .footer-links-columns {
            width: 100%;
          }
        }
        
        @media (max-width: 600px) {
          .section {
            padding: 32px 20px;
          }
          
          .footer-links-columns {
            gap: 24px;
          }
          
          .form-row {
            flex-direction: column;
          }
          
          .footer-bottom {
            flex-direction: column;
            gap: 16px;
            align-items: flex-start;
          }
          
          .submit-btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default SlidingFooter;