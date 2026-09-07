'use client';

import { ReactNode, HTMLAttributes } from 'react';

interface SafeMotionDivProps extends HTMLAttributes<HTMLDivElement> {
  children?: ReactNode;
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
  variants?: any;
  whileHover?: any;
  whileTap?: any;
  whileInView?: any;
  layoutId?: string;
  layout?: boolean | string;
  drag?: boolean | "x" | "y";
  dragConstraints?: any;
}

export default function SafeMotionDiv({ 
  children, 
  initial, 
  animate, 
  exit, 
  transition, 
  variants, 
  whileHover, 
  whileTap, 
  whileInView, 
  layoutId, 
  layout,
  drag,
  dragConstraints,
  ...props 
}: SafeMotionDivProps) {
  // Simple fallback that just renders a div without animations
  return <div {...props}>{children}</div>;
}
