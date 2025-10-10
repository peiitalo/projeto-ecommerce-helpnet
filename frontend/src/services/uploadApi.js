// frontend/src/services/uploadApi.js
import { apiRequest, API_BASE_URL } from './api.js';
import { log } from '../utils/logger.js';

// Correção: Padronização da URL base da API usando a mesma configuração do api.js (proxy /api)

// Serviço para upload de imagens
export const uploadApi = {
  // Upload de múltiplas imagens
  uploadImages: async (files) => {
    const fileArray = Array.from(files);
    log.info('uploadApi: Starting image upload', {
      fileCount: fileArray.length,
      totalSize: fileArray.reduce((sum, file) => sum + file.size, 0)
    });

    const formData = new FormData();

    // Adicionar cada arquivo ao FormData
    fileArray.forEach((file) => {
      log.debug('uploadApi: Adding file to upload', {
        name: file.name,
        size: file.size,
        type: file.type
      });
      formData.append('images', file);
    });

    try {
      const response = await fetch(`${API_BASE_URL}/upload/images`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: formData
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        log.error('uploadApi: Upload failed', {
          status: response.status,
          error: errorData.error
        });
        throw new Error(errorData.error || 'Erro no upload das imagens');
      }

      const result = await response.json();
      log.info('uploadApi: Upload successful', {
        uploadedCount: result.images?.length || 0
      });
      return result;
    } catch (error) {
      log.error('uploadApi: Upload error', { error: error.message });
      throw error;
    }
  },

  // Deletar imagem
  deleteImage: async (filename) => {
    return apiRequest(`/upload/images/${filename}`, {
      method: 'DELETE'
    });
  }
};

export default uploadApi;