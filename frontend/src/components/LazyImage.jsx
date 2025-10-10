// frontend/src/components/LazyImage.jsx
// Optimized image component with lazy loading and performance features

import React, { useState, useRef, useEffect } from 'react';
import { log } from '../utils/logger.js';
import { checkImageAvailability } from '../utils/imageUtils.js';

/**
 * Optimized image component with lazy loading, error handling, and performance features
 * Reduces initial page load time and improves perceived performance
 */
const LazyImage = ({
  src,
  alt,
  className = '',
  placeholder = '/placeholder-image.png',
  fallback = '/placeholder-image.svg',
  onLoad,
  onError,
  maxRetries = 2,
  retryDelay = 1000,
  ...props
}) => {
  const [isInView, setIsInView] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [isRetrying, setIsRetrying] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const imgRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            log.info('LazyImage: Image entered viewport', { src, alt });

            // Verificar disponibilidade da imagem antes de tentar carregar
            if (src && !src.startsWith('blob:') && !src.startsWith('data:')) {
              const isAvailable = await checkImageAvailability(src, 3000);
              if (!isAvailable) {
                log.warn('LazyImage: Image not available, using fallback', { src, alt });
                setHasError(true);
                observer.disconnect();
                return;
              }
            }

            setIsInView(true);
            observer.disconnect();
          }
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px' // Start loading 50px before entering viewport
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, alt]);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => {
      log.info('LazyImage: Network connection restored', { src, alt });
      setIsOnline(true);
      // Reset error state if we were offline
      if (hasError && retryCount < maxRetries) {
        setHasError(false);
        setRetryCount(0);
      }
    };

    const handleOffline = () => {
      log.warn('LazyImage: Network connection lost', { src, alt });
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [src, alt, hasError, retryCount, maxRetries]);

  // Handle image load
  const handleLoad = () => {
    log.info('LazyImage: Image loaded successfully', { src, alt, retryCount });
    setIsLoaded(true);
    setRetryCount(0); // Reset retry count on success
    onLoad?.();
  };

  // Handle retry logic
  const attemptRetry = () => {
    if (retryCount < maxRetries) {
      setIsRetrying(true);
      setRetryCount(prev => prev + 1);
      log.info('LazyImage: Retrying image load', {
        src,
        alt,
        attempt: retryCount + 1,
        maxRetries
      });

      setTimeout(() => {
        setIsRetrying(false);
        // Force re-render by updating a dummy state
        setHasError(false);
      }, retryDelay);
    } else {
      log.warn('LazyImage: Max retries reached, using fallback', {
        src,
        alt,
        maxRetries
      });
      setHasError(true);
    }
  };


  // Determine which image source to use
  const imageSrc = hasError || !isOnline ? fallback : (isRetrying ? placeholder : (isInView ? src : placeholder));

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Placeholder/Loading state */}
      {!isLoaded && !hasError && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      )}

      {/* Main image */}
      <img
        ref={imgRef}
        src={imageSrc}
        alt={alt}
        className={`w-full h-full object-cover transition-opacity duration-300 ${
          isLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        onLoad={handleLoad}
        onError={(e) => {
          // Check if we should retry
          if (retryCount < maxRetries && !isRetrying) {
            log.warn('LazyImage: Failed to load image, attempting retry', {
              src,
              alt,
              attempt: retryCount + 1,
              maxRetries,
              error: e?.message || 'Unknown error'
            });
            attemptRetry();
          } else {
            log.warn('LazyImage: Failed to load image, using fallback', {
              src,
              alt,
              fallback,
              retryCount,
              maxRetries,
              error: e?.message || 'Unknown error'
            });
            setHasError(true);
            // Set fallback image directly on error
            e.target.src = fallback;
            onError?.(e);
          }
        }}
        loading="lazy"
        decoding="async"
        {...props}
      />

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 bg-slate-100 flex items-center justify-center">
          <div className="text-center text-slate-500">
            <svg className="w-12 h-12 mx-auto mb-2 opacity-50" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
            </svg>
            <p className="text-sm">
              {!isOnline ? 'Sem conexão - imagem indisponível' : 'Imagem não disponível'}
            </p>
            {!isOnline && (
              <p className="text-xs text-slate-400 mt-1">
                Tente novamente quando conectar à internet
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Optimized image component for product images with WebP support
 */
export const ProductImage = ({
  images = [],
  alt,
  className = '',
  size = 'medium',
  ...props
}) => {
  // Determine image size for responsive loading
  const sizeMap = {
    small: { width: 150, height: 150 },
    medium: { width: 300, height: 300 },
    large: { width: 600, height: 600 }
  };

  const dimensions = sizeMap[size] || sizeMap.medium;

  // Find best image quality (prefer WebP, then original)
  const bestImage = images.find(img => img.includes('.webp')) || images[0] || '/placeholder-image.png';

  return (
    <LazyImage
      src={bestImage}
      alt={alt}
      className={className}
      width={dimensions.width}
      height={dimensions.height}
      {...props}
    />
  );
};

/**
 * Background image component for hero sections
 */
export const BackgroundImage = ({
  src,
  children,
  className = '',
  overlay = true,
  ...props
}) => {
  const [isLoaded, setIsLoaded] = useState(false);

  return (
    <div className={`relative ${className}`}>
      <LazyImage
        src={src}
        alt=""
        className="absolute inset-0 w-full h-full object-cover"
        onLoad={() => setIsLoaded(true)}
        {...props}
      />

      {/* Loading overlay */}
      {!isLoaded && (
        <div className="absolute inset-0 bg-slate-200 animate-pulse" />
      )}

      {/* Content overlay */}
      {overlay && (
        <div className="absolute inset-0 bg-black/20" />
      )}

      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
};

export default LazyImage;