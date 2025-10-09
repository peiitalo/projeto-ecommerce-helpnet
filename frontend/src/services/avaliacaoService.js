// frontend/src/services/avaliacaoService.js
import { baseUrl } from '../config/api.js';

const avaliacaoService = {
  // Listar avaliações de um produto
  async listarPorProduto(produtoId) {
    try {
      const response = await fetch(`${baseUrl}/api/avaliacoes/produto/${produtoId}`);
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao listar avaliações:', error);
      throw error;
    }
  },

  // Obter minha avaliação de um produto
  async minhaAvaliacao(produtoId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseUrl}/api/avaliacoes/me/produto/${produtoId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) {
        throw new Error(`Erro ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error('Erro ao obter minha avaliação:', error);
      throw error;
    }
  },

  // Avaliar um produto
  async avaliar(produtoId, nota, comentario) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseUrl}/api/avaliacoes/produto/${produtoId}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          nota: parseInt(nota),
          comentario: comentario || null
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.erro || `Erro ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao avaliar produto:', error);
      throw error;
    }
  },

  // Remover avaliação
  async remover(produtoId) {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`${baseUrl}/api/avaliacoes/produto/${produtoId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.erro || `Erro ${response.status}: ${response.statusText}`);
      }
      
      return await response.json();
    } catch (error) {
      console.error('Erro ao remover avaliação:', error);
      throw error;
    }
  }
};

export default avaliacaoService;
