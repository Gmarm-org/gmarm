import React, { useState } from 'react';
import type { ArmaImagen } from '../types';

interface ImageCarouselProps {
  imagenes: ArmaImagen[];
  imagenLegacy?: string; // URL de imagen legacy (fallback)
  armaNombre: string;
  className?: string;
}

/**
 * Componente de carrusel de imágenes para armas.
 * Muestra múltiples imágenes con navegación.
 */
const ImageCarousel: React.FC<ImageCarouselProps> = ({
  imagenes,
  imagenLegacy,
  armaNombre,
  className = ''
}) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [imageError, setImageError] = useState(false);
  
  // Crear array de URLs desde las imágenes o usar legacy
  const imageUrls = imagenes && imagenes.length > 0
    ? imagenes.map(img => img.urlImagen)
    : imagenLegacy ? [imagenLegacy] : [];
  
  const totalImages = imageUrls.length;
  const hasMultipleImages = totalImages > 1;
  
  const nextImage = () => {
    setCurrentImageIndex((prev) => (prev + 1) % totalImages);
    setImageError(false);
  };
  
  const prevImage = () => {
    setCurrentImageIndex((prev) => (prev - 1 + totalImages) % totalImages);
    setImageError(false);
  };
  
  const goToImage = (index: number) => {
    setCurrentImageIndex(index);
    setImageError(false);
  };
  
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
    // Silenciosamente cambiar a placeholder sin imprimir errores
    const target = e.target as HTMLImageElement;
    setImageError(true);
    // Prevenir que se intente cargar la imagen nuevamente
    target.style.display = 'none';
  };
  
  if (totalImages === 0) {
    // Sin imágenes - mostrar placeholder
    return (
      <div className={`relative bg-gray-100 ${className}`}>
        <div className="w-full h-48 flex items-center justify-center">
          <svg className="w-24 h-24 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="absolute bottom-2 left-0 right-0 text-center">
          <span className="text-xs text-gray-500">Sin imagen</span>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`relative group ${className}`}>
      {/* Imagen actual */}
      <div className="relative overflow-hidden">
        {!imageError ? (
          <img
            src={imageUrls[currentImageIndex]}
            alt={`${armaNombre} - Imagen ${currentImageIndex + 1}`}
            className="w-full h-48 object-cover rounded-t-2xl transition-opacity duration-300"
            onError={handleImageError}
          />
        ) : (
          <div className="w-full h-48 bg-gray-100 flex items-center justify-center rounded-t-2xl">
            <div className="text-center">
              <svg className="w-16 h-16 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span className="text-xs text-gray-500">Error al cargar imagen</span>
            </div>
          </div>
        )}
        
        {/* Indicador de múltiples imágenes */}
        {hasMultipleImages && (
          <div className="absolute top-3 right-3 bg-black/60 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm">
            {currentImageIndex + 1} / {totalImages}
          </div>
        )}
        
        {/* Botones de navegación - solo si hay múltiples imágenes */}
        {hasMultipleImages && (
          <>
            {/* Botón Anterior */}
            <button
              onClick={prevImage}
              className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
              aria-label="Imagen anterior"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            
            {/* Botón Siguiente */}
            <button
              onClick={nextImage}
              className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/50 hover:bg-black/70 text-white p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-200 backdrop-blur-sm"
              aria-label="Imagen siguiente"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        )}
      </div>
      
      {/* Indicadores de puntos - solo si hay múltiples imágenes */}
      {hasMultipleImages && (
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-1.5">
          {imageUrls.map((_, index) => (
            <button
              key={index}
              onClick={() => goToImage(index)}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                index === currentImageIndex
                  ? 'bg-white w-6'
                  : 'bg-white/50 hover:bg-white/75'
              }`}
              aria-label={`Ir a imagen ${index + 1}`}
            />
          ))}
        </div>
      )}
      
      {/* Descripción de la imagen (si existe) */}
      {imagenes && imagenes.length > 0 && imagenes[currentImageIndex]?.descripcion && (
        <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-3 rounded-b-2xl">
          <p className="text-xs text-white text-center line-clamp-2">
            {imagenes[currentImageIndex].descripcion}
          </p>
        </div>
      )}
    </div>
  );
};

export default ImageCarousel;

