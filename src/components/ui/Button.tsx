import React from 'react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  isLoading?: boolean;
}

export function Button({ variant = 'primary', isLoading, children, className = '', disabled, ...props }: ButtonProps) {
  const baseClass = 'btn';
  const variantClass = `btn-${variant}`;
  const loadingClass = isLoading ? 'btn-loading' : '';
  
  return (
    <button 
      className={`${baseClass} ${variantClass} ${loadingClass} ${className}`.trim()} 
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && <span className="spinner"></span>}
      <span className="btn-text">{children}</span>
    </button>
  );
}
