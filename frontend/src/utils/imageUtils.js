/**
 * Utilitários para manipulação de imagens
 * Centraliza a lógica de construção de URLs de imagens
 */

/**
 * Constrói URL completa para imagem do produto
 * @param {string} imagePath - Caminho da imagem
 * @returns {string} URL completa da imagem
 */
export const buildImageUrl = (imagePath) => {
  if (!imagePath) return '/placeholder-image.svg';

  // Se já é uma URL completa, retornar como está
  if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
    return imagePath;
  }

  // Se é um blob URL, retornar como está
  if (imagePath.startsWith('blob:')) {
    return imagePath;
  }

  // Se é um data URL, retornar como está
  if (imagePath.startsWith('data:')) {
    return imagePath;
  }

  // Get base URL from environment or default
  const baseUrl = (import.meta?.env?.VITE_API_BASE_URL || 'http://localhost:3001').replace('/api', '');

  // Se começa com /uploads, usar diretamente com base URL
  if (imagePath.startsWith('/uploads/')) {
    return `${baseUrl}${imagePath}`;
  }

  // Se começa com uploads/, adicionar barra inicial e base URL
  if (imagePath.startsWith('uploads/')) {
    return `${baseUrl}/${imagePath}`;
  }

  // Para outros casos, assumir que precisa do prefixo /uploads/
  const cleanPath = imagePath.startsWith('/') ? imagePath.slice(1) : imagePath;
  return `${baseUrl}/uploads/${cleanPath}`;
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
