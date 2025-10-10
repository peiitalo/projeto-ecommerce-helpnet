/**
 * Utilitários para manipulação de imagens
 * Centraliza a lógica de construção de URLs de imagens
 *
 * PADRONIZAÇÃO DE URLs DE IMAGEM:
 * - Todas as imagens agora usam /api/uploads via proxy do Vite
 * - O proxy do Vite mapeia /api para o backend, garantindo consistência
 * - Removidas URLs diretas como http://localhost:3001/uploads
 * - Função buildImageUrl padronizada em todo o frontend
 */

import { log } from './logger.js';

/**
 * Constrói URL completa para imagem do produto
 * @param {string} imagePath - Caminho da imagem
 * @returns {string} URL completa da imagem
 */
export const buildImageUrl = (imagePath) => {
   if (!imagePath) {
     log.debug('buildImageUrl: No image path provided, using placeholder');
     return '/placeholder-image.svg';
   }

   // Se já é uma URL completa, retornar como está
   if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
     log.debug('buildImageUrl: Absolute URL detected, returning as-is', { imagePath });
     return imagePath;
   }

   // Se é um blob URL, retornar como está
   if (imagePath.startsWith('blob:')) {
     log.debug('buildImageUrl: Blob URL detected, returning as-is', { imagePath });
     return imagePath;
   }

   // Se é um data URL, retornar como está
   if (imagePath.startsWith('data:')) {
     log.debug('buildImageUrl: Data URL detected, returning as-is');
     return imagePath;
   }

   // Padronização: sempre usar /api/uploads via proxy do Vite
   // O proxy do Vite mapeia /api para o backend, garantindo consistência
   let cleanPath = imagePath;

   // Remover prefixos existentes se houver
   if (imagePath.startsWith('/uploads/')) {
     cleanPath = imagePath.slice(8); // Remove '/uploads/'
   } else if (imagePath.startsWith('uploads/')) {
     cleanPath = imagePath.slice(8); // Remove 'uploads/'
   } else if (imagePath.startsWith('/')) {
     cleanPath = imagePath.slice(1); // Remove barra inicial
   }

   // Correção: remover barras iniciais de cleanPath para evitar duplicação (ex: /api/uploads//products/)
   // Isso trata casos onde o caminho original tem prefixos malformados como '/uploads//products/'
   cleanPath = cleanPath.replace(/^\/+/, '');

   const finalUrl = `/api/uploads/${cleanPath}`;
   log.debug('buildImageUrl: Built relative URL', { originalPath: imagePath, finalUrl });

   // Validação adicional: garantir que a URL final seja segura
   try {
     const url = new URL(finalUrl, window.location.origin);
     if (url.protocol !== 'http:' && url.protocol !== 'https:') {
       log.warn('buildImageUrl: Invalid protocol in final URL', { finalUrl });
       return '/placeholder-image.svg';
     }
   } catch (error) {
     log.warn('buildImageUrl: Invalid URL format', { finalUrl, error: error.message });
     return '/placeholder-image.svg';
   }

   return finalUrl;
 };

/**
 * Constrói array de URLs para múltiplas imagens
 * @param {Array} images - Array de caminhos de imagens
 * @returns {Array} Array de URLs completas
 */
export const buildImageUrls = (images) => {
  if (!Array.isArray(images)) return [];
  return images.map(img => buildImageUrl(img));
};

/**
 * Obtém a primeira imagem válida de um array
 * @param {Array} images - Array de caminhos de imagens
 * @returns {string} URL da primeira imagem válida ou placeholder
 */
export const getFirstValidImage = (images) => {
  if (!Array.isArray(images) || images.length === 0) {
    return '/placeholder-image.svg';
  }
  
  // Filtrar imagens válidas (não blob URLs inválidas)
  const validImages = images.filter(img => 
    img && 
    !img.startsWith('blob:') && 
    img.trim() !== '' &&
    img !== 'null' &&
    img !== 'undefined'
  );
  
  if (validImages.length === 0) {
    return '/placeholder-image.svg';
  }
  
  return buildImageUrl(validImages[0]);
};

/**
 * Verifica se uma imagem é válida
 * @param {string} imagePath - Caminho da imagem
 * @returns {boolean} True se a imagem é válida
 */
export const isValidImage = (imagePath) => {
  if (!imagePath) return false;
  if (imagePath.startsWith('blob:')) return false;
  if (imagePath.trim() === '') return false;
  if (imagePath === 'null' || imagePath === 'undefined') return false;
  return true;
};

/**
 * Gera placeholder SVG para produtos sem imagem
 * @param {string} text - Texto para exibir no placeholder
 * @returns {string} SVG como string
 */
export const generatePlaceholderSVG = (text = 'Sem imagem') => {
  return `data:image/svg+xml;base64,${btoa(`
    <svg width="300" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="100%" height="100%" fill="#f3f4f6"/>
      <text x="50%" y="50%" text-anchor="middle" dy=".3em" fill="#9ca3af" font-family="Arial, sans-serif" font-size="14">
        ${text}
      </text>
    </svg>
  `)}`;
};

/**
 * Verifica se uma URL de imagem está acessível
 * @param {string} url - URL da imagem a ser verificada
 * @param {number} timeout - Timeout em ms (padrão: 5000)
 * @returns {Promise<boolean>} True se a imagem está acessível
 */
export const checkImageAvailability = (url, timeout = 5000) => {
  return new Promise((resolve) => {
    if (!url || typeof url !== 'string') {
      log.debug('checkImageAvailability: Invalid URL provided', { url });
      resolve(false);
      return;
    }

    // Para URLs blob e data, considerar sempre disponíveis
    if (url.startsWith('blob:') || url.startsWith('data:')) {
      resolve(true);
      return;
    }

    const img = new Image();
    let timeoutId;

    const cleanup = () => {
      img.onload = null;
      img.onerror = null;
      if (timeoutId) clearTimeout(timeoutId);
    };

    img.onload = () => {
      cleanup();
      log.debug('checkImageAvailability: Image is available', { url });
      resolve(true);
    };

    img.onerror = () => {
      cleanup();
      log.debug('checkImageAvailability: Image is not available', { url });
      resolve(false);
    };

    // Timeout para evitar espera infinita
    timeoutId = setTimeout(() => {
      cleanup();
      log.debug('checkImageAvailability: Image check timed out', { url, timeout });
      resolve(false);
    }, timeout);

    img.src = url;
  });
};

/**
 * Verifica conectividade de rede básica
 * @returns {Promise<boolean>} True se há conectividade
 */
export const checkNetworkConnectivity = async () => {
  try {
    // Tentar fazer uma requisição HEAD para um endpoint pequeno
    const response = await fetch('/api/health', {
      method: 'HEAD',
      cache: 'no-cache',
      signal: AbortSignal.timeout(3000)
    });
    return response.ok;
  } catch (error) {
    log.debug('checkNetworkConnectivity: Network check failed', { error: error.message });
    return navigator.onLine; // Fallback para navigator.onLine
  }
};
