'use client';

import { ReactNode } from 'react';

interface SimpleMotionDivProps {
  children?: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  initial?: any;
  animate?: any;
  exit?: any;
  transition?: any;
  layout?: boolean;
  layoutId?: string;
  whileHover?: any;
  whileTap?: any;
  whileInView?: any;
  drag?: boolean | "x" | "y";
  dragConstraints?: any;
  onClick?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseEnter?: (event: React.MouseEvent<HTMLDivElement>) => void;
  onMouseLeave?: (event: React.MouseEvent<HTMLDivElement>) => void;
  id?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
  role?: string;
}

// Simple fallback that renders a regular div for development
// This completely avoids framer-motion imports during development
export default function SimpleMotionDiv({ 
  children,
  className,
  style,
  onClick,
  onMouseEnter,
  onMouseLeave,
  id,
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
  role,
}: SimpleMotionDivProps) {
  return (
    <div 
      className={className} 
      style={style}
      onClick={onClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      id={id}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      role={role}
    >
      {children}
    </div>
  );
}
