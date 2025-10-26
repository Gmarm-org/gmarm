import React from 'react';

interface FormFieldProps {
  label: string;
  name: string;
  type?: 'text' | 'email' | 'tel' | 'number' | 'select' | 'textarea';
  value: string | number;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  options?: { value: string; label: string }[];
  maxLength?: number;
  pattern?: string;
  inputMode?: 'text' | 'email' | 'tel' | 'numeric' | 'decimal';
  className?: string;
  style?: React.CSSProperties;
}

const FormField: React.FC<FormFieldProps> = ({
  label,
  name,
  type = 'text',
  value,
  onChange,
  onBlur,
  placeholder,
  required = false,
  disabled = false,
  readOnly = false,
  error,
  options = [],
  maxLength,
  pattern,
  inputMode,
  className = '',
  style = {}
}) => {
  const baseInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '0.5rem',
    fontSize: '0.875rem',
    border: `1px solid ${error ? '#ef4444' : '#d1d5db'}`,
    borderRadius: '0.375rem',
    backgroundColor: disabled || readOnly ? '#f9fafb' : 'white',
    color: disabled || readOnly ? '#6b7280' : '#1f2937',
    ...style
  };

  const renderInput = () => {
    switch (type) {
      case 'select':
        return (
          <select
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            disabled={disabled}
            required={required}
            style={baseInputStyle}
            className={className}
          >
            <option value="">Seleccionar...</option>
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        );

      case 'textarea':
        return (
          <textarea
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            maxLength={maxLength}
            style={{
              ...baseInputStyle,
              minHeight: '80px',
              resize: 'vertical'
            }}
            className={className}
          />
        );

      default:
        return (
          <input
            type={type}
            name={name}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            required={required}
            disabled={disabled}
            readOnly={readOnly}
            maxLength={maxLength}
            pattern={pattern}
            inputMode={inputMode}
            style={baseInputStyle}
            className={className}
          />
        );
    }
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label 
        htmlFor={name}
        style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '0.25rem'
        }}
      >
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
      </label>
      
      {renderInput()}
      
      {error && (
        <p style={{
          fontSize: '0.75rem',
          color: '#ef4444',
          marginTop: '0.25rem',
          marginBottom: 0
        }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default FormField; 