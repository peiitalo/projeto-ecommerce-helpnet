// frontend/src/hooks/usePerformance.js
// Performance optimization hooks for React components

import { useMemo, useCallback, useRef, useEffect, useState } from 'react';

/**
 * Hook para memoização de callbacks com dependências
 * Evita re-criação desnecessária de funções
 */
export const useOptimizedCallback = (callback, deps) => {
  return useCallback(callback, deps);
};

/**
 * Hook para memoização de valores computados
 * Similar ao useMemo mas com melhor tipagem
 */
export const useOptimizedMemo = (factory, deps) => {
  return useMemo(factory, deps);
};

/**
 * Hook para debouncing de funções
 * Útil para busca em tempo real e resize handlers
 */
export const useDebounce = (callback, delay = 300) => {
  const timeoutRef = useRef(null);

  const debouncedCallback = useCallback((...args) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(...args);
    }, delay);
  }, [callback, delay]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return debouncedCallback;
};

/**
 * Hook para throttling de funções
 * Útil para scroll handlers e resize events
 */
export const useThrottle = (callback, delay = 100) => {
  const lastCallRef = useRef(0);

  const throttledCallback = useCallback((...args) => {
    const now = Date.now();
    if (now - lastCallRef.current >= delay) {
      lastCallRef.current = now;
      callback(...args);
    }
  }, [callback, delay]);

  return throttledCallback;
};

/**
 * Hook para lazy loading de imagens
 * Carrega imagens apenas quando entram no viewport
 */
export const useLazyImage = (src, placeholder = '') => {
  const [imageSrc, setImageSrc] = useState(placeholder);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            img.onload = () => {
              setImageSrc(src);
              setIsLoading(false);
            };
            img.onerror = () => {
              setHasError(true);
              setIsLoading(false);
            };
            img.src = src;
            observer.disconnect();
          }
        });
      },
      { threshold: 0.1 }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src]);

  return { imageSrc, isLoading, hasError, imgRef };
};

/**
 * Hook para performance monitoring
 * Rastreia tempo de renderização e interações
 */
export const usePerformanceMonitor = (componentName) => {
  const renderCountRef = useRef(0);
  const startTimeRef = useRef(performance.now());

  useEffect(() => {
    renderCountRef.current += 1;
    const renderTime = performance.now() - startTimeRef.current;

    // Log performance metrics (only in development)
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] Render #${renderCountRef.current} - ${renderTime.toFixed(2)}ms`);
    }

    startTimeRef.current = performance.now();
  });

  // Track user interactions
  const trackInteraction = useCallback((action, data = {}) => {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${componentName}] ${action}`, data);
    }

    // Could send to analytics service in production
    // analytics.track(action, { component: componentName, ...data });
  }, [componentName]);

  return { trackInteraction, renderCount: renderCountRef.current };
};

/**
 * Hook para virtualização de listas grandes
 * Renderiza apenas itens visíveis para melhor performance
 */
export const useVirtualList = (items, itemHeight = 50, containerHeight = 400) => {
  const [scrollTop, setScrollTop] = useState(0);

  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight);
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    );

    return items.slice(startIndex, endIndex).map((item, index) => ({
      ...item,
      index: startIndex + index,
      style: {
        position: 'absolute',
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        width: '100%'
      }
    }));
  }, [items, scrollTop, itemHeight, containerHeight]);

  const totalHeight = items.length * itemHeight;

  const handleScroll = useOptimizedCallback((e) => {
    setScrollTop(e.target.scrollTop);
  }, []);

  return {
    visibleItems,
    totalHeight,
    onScroll: handleScroll,
    containerStyle: {
      height: containerHeight,
      overflow: 'auto',
      position: 'relative'
    }
  };
};

/**
 * Hook para preload de recursos
 * Carrega recursos críticos antecipadamente
 */
export const usePreload = (resources = []) => {
  useEffect(() => {
    resources.forEach((resource) => {
      if (resource.type === 'image') {
        const img = new Image();
        img.src = resource.src;
      } else if (resource.type === 'script') {
        const link = document.createElement('link');
        link.rel = 'preload';
        link.as = 'script';
        link.href = resource.src;
        document.head.appendChild(link);
      }
    });
  }, [resources]);
};

/**
 * Hook para detectar mudanças de performance
 * Alerta quando componentes ficam lentos
 */
export const usePerformanceWarning = (threshold = 16) => {
  const lastRenderRef = useRef(performance.now());

  useEffect(() => {
    const now = performance.now();
    const renderTime = now - lastRenderRef.current;

    if (renderTime > threshold) {
      console.warn(`Performance warning: Render took ${renderTime.toFixed(2)}ms (threshold: ${threshold}ms)`);
    }

    lastRenderRef.current = now;
  });
};