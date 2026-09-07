'use client';

import { ReactNode } from 'react';

interface SimpleAnimatePresenceProps {
  children: ReactNode;
  mode?: "wait" | "sync";
  initial?: boolean;
}

// Simple fallback that just renders children without any animation
// This completely avoids framer-motion imports during development
export default function SimpleAnimatePresence({ children }: SimpleAnimatePresenceProps) {
  return <>{children}</>;
}
