'use client'
import { FC, useState, useRef, useEffect } from 'react';

const SECTION1_HEIGHT = 500; // px, adjust as needed
const SECTION2_HEIGHT = 1000; // px, adjust as needed
const SCROLL_BOTTOM_THRESHOLD = 5; // px from bottom
const OPEN_DELAY = 100; // ms delay before auto-open

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
            // Wait for max-height transition (700ms) then smooth scroll
            window.setTimeout(() => {
              window.scrollBy({ top: SECTION2_HEIGHT, behavior: 'smooth' });
            }, 200);
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
        <div className="section section1">
          <button className="contact-btn" onClick={toggleOpen}>Contact</button>
        </div>
        <div className={`section section2 ${open ? 'visible' : ''}`}>
          <button className="close-btn" onClick={toggleOpen}>Close</button>
          <div className="content">
            <h3>Contact Us</h3>
            <form>
              <label>Name:<input type="text" name="name" /></label>
              <label>Email:<input type="email" name="email" /></label>
              <label>Message:<textarea name="message" /></label>
              <button type="submit">Send</button>
            </form>
          </div>
        </div>
      </div>

      <style jsx>{`
        .footer-wrapper { width: 100%; }
        .footer-container {
          position: static;
          width: 100%;
          overflow: hidden;
          background: #f8f8f8;
          box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
          transition: max-height 0.7s cubic-bezier(0.25,0.46,0.45,0.94);
          max-height: 0;
          z-index: 1000;
        }
        .section { padding: 16px; }
        .section1 {
          display: flex; align-items: center; justify-content: center;
          height: ${SECTION1_HEIGHT}px; background: #111; color: #fff;
        }
        .contact-btn {
          background: #fff; color: #111; border: none;
          padding: 12px 24px; border-radius: 4px; font-weight: 500;
          font-size: 1.08rem; cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        .contact-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
        .section2 {
          background: #fff; height: ${SECTION2_HEIGHT}px;
          opacity: 0; transform: translateY(30px);
          transition: opacity 1s ease-out, transform 1s ease-out;
        }
        .section2.visible { opacity: 1; transform: translateY(0); }
        .close-btn {
          background: #111; color: #fff; border: none;
          padding: 8px 16px; border-radius: 4px; cursor: pointer;
          margin-bottom: 16px;
          transition: background 0.3s ease;
        }
        .close-btn:hover { background: #333; }
        .content { max-width: 600px; margin: 0 auto; }
        h3 { margin-bottom: 24px; font-size: 1.5rem; }
        form { display: flex; flex-direction: column; gap: 16px; }
        label { font-size: 14px; color: #666; display: flex; flex-direction: column; }
        input, textarea {
          padding: 12px; border: 1px solid #ddd; border-radius: 4px;
          font-size: 14px;
        }
        input:focus, textarea:focus { outline: none; border-color: #111; }
        button[type='submit'] {
          align-self: flex-start; background: #111; color: #fff;
          border: none; padding: 12px 24px; border-radius: 4px;
          font-weight: 500; cursor: pointer;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
        }
        button[type='submit']:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.1); }
      `}</style>
    </div>
  );
};

export default SlidingFooter;
