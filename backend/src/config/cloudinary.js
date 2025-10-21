import { v2 as cloudinary } from 'cloudinary';

// Configuração do Cloudinary
const cloudinaryConfig = {
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || 'demo',
  api_key: process.env.CLOUDINARY_API_KEY || 'demo',
  api_secret: process.env.CLOUDINARY_API_SECRET || 'demo',
};

cloudinary.config(cloudinaryConfig);

// Verificar se as configurações estão definidas
if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('⚠️  Cloudinary não configurado. Configure as variáveis CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY e CLOUDINARY_API_SECRET no arquivo .env');
}

// Opções de upload otimizadas para imagens de produtos
const uploadOptions = {
  folder: 'products', // Pasta no Cloudinary
  quality: 'auto', // Otimização automática de qualidade
  format: 'auto', // Formato automático (WebP, AVIF, etc.)
  width: 800, // Largura máxima
  height: 800, // Altura máxima
  crop: 'limit', // Redimensionar mantendo proporção, sem cortar
  // eager: [ // Transformações adicionais para diferentes tamanhos
  //   { width: 400, height: 400, crop: 'fill' },
  //   { width: 200, height: 200, crop: 'fill' }
  // ],
  // allowed_formats: ['jpg', 'png', 'webp', 'gif'], // Formatos permitidos
  // max_bytes: 5 * 1024 * 1024, // 5MB máximo
};

// Função auxiliar para upload de imagem
const uploadImage = async (filePath, options = {}) => {
  try {
    const result = await cloudinary.uploader.upload(filePath, {
      ...uploadOptions,
      ...options, // Permite sobrescrever opções
    });
    return result;
  } catch (error) {
    console.error('Erro no upload para Cloudinary:', error);
    throw error;
  }
};

// Função para deletar imagem
const deleteImage = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result;
  } catch (error) {
    console.error('Erro ao deletar imagem do Cloudinary:', error);
    throw error;
  }
};

export { cloudinary, uploadOptions, uploadImage, deleteImage };