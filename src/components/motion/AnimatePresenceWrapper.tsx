'use client';

import { ReactNode } from 'react';

interface AnimatePresenceWrapperProps {
  children: ReactNode;
  mode?: "wait" | "sync";
  initial?: boolean;
}

export default function AnimatePresenceWrapper({ 
  children, 
  mode = "wait",
  initial = true 
}: AnimatePresenceWrapperProps) {
  return <div className="contents">{children}</div>;
}
