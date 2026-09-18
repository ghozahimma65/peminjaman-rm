import React from 'react';

export type BadgeVariant = 'success' | 'danger' | 'warning' | 'info' | 'default';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span className={`badge-ui badge-${variant} ${className}`.trim()}>
      {children}
    </span>
  );
}
