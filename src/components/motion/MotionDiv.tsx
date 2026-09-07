'use client';

import { HTMLAttributes } from 'react';

interface MotionDivProps extends HTMLAttributes<HTMLDivElement> {}

export default function MotionDiv({ children, ...props }: MotionDivProps) {
  return <div {...props}>{children}</div>;
}
