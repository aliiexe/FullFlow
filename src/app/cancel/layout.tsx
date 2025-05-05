//// filepath: c:\Users\abour\Documents\ProjectsF\full-flow\src\app\cancel\layout.tsx
import React, { Suspense } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      {children}
    </Suspense>
  );
}