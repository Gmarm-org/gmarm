import React, { useState, useRef } from 'react';

interface FileUploadProps {
  label: string;
  name: string;
  value?: string;
  onChange: (file: File | null, previewUrl?: string) => void;
  accept?: string;
  maxSize?: number; // en MB
  required?: boolean;
  disabled?: boolean;
  error?: string;
  className?: string;
  style?: React.CSSProperties;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  name,
  value,
  onChange,
  accept = 'image/*',
  maxSize = 5, // 5MB por defecto
  required = false,
  disabled = false,
  error,
  className = '',
  style = {}
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    // Validar tipo de archivo
    if (!file.type.startsWith('image/')) {
      onChange(null);
      return;
    }

    // Validar tamaño
    if (file.size > maxSize * 1024 * 1024) {
      onChange(null);
      return;
    }

    // Crear preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const url = e.target?.result as string;
      setPreviewUrl(url);
      onChange(file, url);
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleClick = () => {
    if (!disabled) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPreviewUrl(undefined);
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const containerStyle: React.CSSProperties = {
    border: `2px dashed ${dragActive ? '#3b82f6' : error ? '#ef4444' : '#d1d5db'}`,
    borderRadius: '0.5rem',
    padding: '1.5rem',
    textAlign: 'center',
    backgroundColor: dragActive ? '#eff6ff' : '#f9fafb',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.2s ease',
    ...style
  };

  const previewStyle: React.CSSProperties = {
    width: '100px',
    height: '100px',
    objectFit: 'cover',
    borderRadius: '0.5rem',
    border: '2px solid #e5e7eb',
    margin: '0 auto 1rem'
  };

  return (
    <div style={{ marginBottom: '1rem' }}>
      <label 
        style={{
          display: 'block',
          fontSize: '0.875rem',
          fontWeight: '500',
          color: '#374151',
          marginBottom: '0.5rem'
        }}
      >
        {label}
        {required && <span style={{ color: '#ef4444', marginLeft: '0.25rem' }}>*</span>}
      </label>
      
      <div
        className={className}
        style={containerStyle}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          name={name}
          accept={accept}
          onChange={handleChange}
          required={required}
          disabled={disabled}
          style={{ display: 'none' }}
        />
        
        {previewUrl ? (
          <div>
            <img src={previewUrl} alt="Preview" style={previewStyle} />
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0' }}>
              Imagen seleccionada
            </p>
            <button
              type="button"
              onClick={handleRemove}
              style={{
                background: '#ef4444',
                color: 'white',
                border: 'none',
                padding: '0.5rem 1rem',
                borderRadius: '0.375rem',
                fontSize: '0.875rem',
                cursor: 'pointer'
              }}
            >
              Cambiar imagen
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '2rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
              📷
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0' }}>
              {dragActive ? 'Suelta la imagen aquí' : 'Haz clic para seleccionar o arrastra una imagen'}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
              PNG, JPG, GIF hasta {maxSize}MB
            </p>
          </div>
        )}
      </div>
      
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

export default FileUpload; 