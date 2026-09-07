'use client';

import { ReactNode } from 'react';

interface SafeAnimatePresenceProps {
  children: ReactNode;
  mode?: "wait" | "sync";
  initial?: boolean;
}

export default function SafeAnimatePresence({ 
  children, 
  mode = "wait",
  initial = true 
}: SafeAnimatePresenceProps) {
  // Simple fallback that just renders children without animations
  // This avoids all framer-motion import issues
  return <div className="contents">{children}</div>;
}
