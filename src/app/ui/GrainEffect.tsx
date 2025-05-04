'use client';

import React, { useEffect, useState } from 'react';

export function GrainEffect() {
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <div 
      className="pointer-events-none fixed inset-0 z-50 h-full w-full overflow-hidden"
      aria-hidden="true"
    >
      <div 
        className="absolute inset-0 bg-noise opacity-20"
        style={{ 
          mixBlendMode: 'overlay'
        }}
      />
    </div>
  );
}