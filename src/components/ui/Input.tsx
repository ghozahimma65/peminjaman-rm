import React, { forwardRef } from 'react';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  requiredIndicator?: boolean;
  rightElement?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({ label, error, requiredIndicator, rightElement, className = '', ...props }, ref) => {
  return (
    <div className={`form-group ${className}`.trim()}>
      {label && <label>{label} {requiredIndicator && <span className="text-danger">*</span>}</label>}
      <div className="input-wrap">
        <input 
          ref={ref}
          className={error ? 'has-error' : ''} 
          {...props} 
        />
        {rightElement && <div className="input-right-element">{rightElement}</div>}
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
});
Input.displayName = 'Input';
