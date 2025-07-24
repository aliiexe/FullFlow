'use client';

import { useState, useEffect } from 'react';

interface VideoPopupProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function VideoPopup({ isOpen, onClose }: VideoPopupProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsVisible(true);
      // Prevent body scroll when popup is open
      document.body.style.overflow = 'hidden';
    } else {
      setIsVisible(false);
      // Restore body scroll when popup is closed
      document.body.style.overflow = 'unset';
    }

    // Cleanup on unmount
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Blurred background overlay */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Video container */}
      <div className="relative z-10 w-full max-w-4xl mx-4">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-12 right-0 z-20 w-10 h-10 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-all duration-200 backdrop-blur-sm"
          aria-label="Close video"
        >
          <svg 
            className="w-6 h-6 text-white" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 18L18 6M6 6l12 12" 
            />
          </svg>
        </button>

        {/* Video player */}
        <div className="relative w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
          <video
            className="w-full h-full object-cover"
            controls
            autoPlay
            loop
            playsInline
          >
            <source src="/videos/mainPresentation.mp4" type="video/mp4" />
            Your browser does not support the video tag.
          </video>
        </div>
      </div>
    </div>
  );
} 