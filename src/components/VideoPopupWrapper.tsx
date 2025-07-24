'use client';

import { useState, useEffect } from 'react';
import VideoPopup from './VideoPopup';

interface VideoPopupWrapperProps {
  children: React.ReactNode;
}

export default function VideoPopupWrapper({ children }: VideoPopupWrapperProps) {
  const [showPopup, setShowPopup] = useState(false);
  const [hasShownPopup, setHasShownPopup] = useState(false);

  useEffect(() => {
    // Check if we've already shown the popup in this session
    const hasShown = sessionStorage.getItem('hasShownVideoPopup');
    
    if (!hasShown) {
      // Show popup after a short delay to let the page load
      const timer = setTimeout(() => {
        setShowPopup(true);
        setHasShownPopup(true);
        sessionStorage.setItem('hasShownVideoPopup', 'true');
      }, 1000); // 1 second delay

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClosePopup = () => {
    setShowPopup(false);
  };

  return (
    <>
      {children}
      <VideoPopup isOpen={showPopup} onClose={handleClosePopup} />
    </>
  );
} 