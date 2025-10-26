import React, { useState, useRef } from 'react';

interface DocumentUploadProps {
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
  documentType?: string;
}

const DocumentUpload: React.FC<DocumentUploadProps> = ({
  label,
  name,
  value,
  onChange,
  accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png,.webp',
  maxSize = 10, // 10MB por defecto para documentos
  required = false,
  disabled = false,
  error,
  className = '',
  style = {},
  documentType
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | undefined>(value);
  const [fileName, setFileName] = useState<string>('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    // Validar tamaño
    if (file.size > maxSize * 1024 * 1024) {
      alert(`El archivo es demasiado grande. Máximo ${maxSize}MB permitido.`);
      onChange(null);
      return;
    }

    setFileName(file.name);

    // Crear preview solo para imágenes
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const url = e.target?.result as string;
        setPreviewUrl(url);
        onChange(file, url);
      };
      reader.readAsDataURL(file);
    } else {
      // Para documentos no-imagen, solo mostrar el nombre
      setPreviewUrl(undefined);
      onChange(file);
    }
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
    setFileName('');
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'jpg':
      case 'jpeg':
      case 'png':
      case 'webp':
        return '🖼️';
      default:
        return '📎';
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
        {documentType && (
          <span style={{ fontSize: '0.75rem', color: '#6b7280', marginLeft: '0.5rem' }}>
            ({documentType})
          </span>
        )}
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
              {fileName || 'Documento seleccionado'}
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
              Cambiar documento
            </button>
          </div>
        ) : fileName ? (
          <div>
            <div style={{ fontSize: '2rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
              {getFileIcon(fileName)}
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0' }}>
              {fileName}
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
              Cambiar documento
            </button>
          </div>
        ) : (
          <div>
            <div style={{ fontSize: '2rem', color: '#9ca3af', marginBottom: '0.5rem' }}>
              📎
            </div>
            <p style={{ fontSize: '0.875rem', color: '#6b7280', margin: '0.5rem 0' }}>
              {dragActive ? 'Suelta el documento aquí' : 'Haz clic para seleccionar o arrastra un documento'}
            </p>
            <p style={{ fontSize: '0.75rem', color: '#9ca3af', margin: 0 }}>
              PDF, DOC, JPG, PNG hasta {maxSize}MB
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

export default DocumentUpload;
