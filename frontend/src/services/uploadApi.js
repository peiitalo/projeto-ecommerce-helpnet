// frontend/src/services/uploadApi.js
import { apiRequest } from './api.js';

// URL base da API (importada do api.js)
const API_BASE_URL = (import.meta?.env?.VITE_API_BASE_URL) || ((typeof window !== 'undefined' && window?.location) ? `${window.location.protocol}//${window.location.hostname}:${3001}/api` : 'http://localhost:3001/api');

// Serviço para upload de imagens
export const uploadApi = {
  // Upload de múltiplas imagens
  uploadImages: async (files) => {
    const formData = new FormData();

    // Adicionar cada arquivo ao FormData
    Array.from(files).forEach((file, index) => {
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
        throw new Error(errorData.error || 'Erro no upload das imagens');
      }

      return await response.json();
    } catch (error) {
      console.error('Erro no upload:', error);
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