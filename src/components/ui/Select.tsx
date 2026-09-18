import React, { forwardRef } from 'react';

export interface SelectOption {
  value: string | number;
  label: string;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  error?: string;
  requiredIndicator?: boolean;
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(({ label, options, error, requiredIndicator, placeholder, className = '', ...props }, ref) => {
  return (
    <div className={`form-group ${className}`.trim()}>
      {label && <label>{label} {requiredIndicator && <span className="text-danger">*</span>}</label>}
      <div className="input-wrap select-wrap">
        <select 
          ref={ref}
          className={error ? 'has-error' : ''} 
          {...props}
        >
          {placeholder && <option value="" disabled>{placeholder}</option>}
          {options.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      </div>
      {error && <span className="error-message">{error}</span>}
    </div>
  );
});
Select.displayName = 'Select';
