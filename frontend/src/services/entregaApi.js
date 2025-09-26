// frontend/src/services/entregaApi.js
import { apiRequest } from './api.js';

const entregaApi = {
  // Cliente: buscar entrega de um pedido
  buscarEntregaCliente: (pedidoId) => {
    return apiRequest(`/entregas/cliente/${pedidoId}`);
  },

  // Vendedor: listar entregas
  listarEntregasVendedor: (params = {}) => {
    const queryString = new URLSearchParams(params).toString();
    return apiRequest(`/entregas/vendedor?${queryString}`);
  },

  // Vendedor: buscar entrega específica
  buscarEntregaVendedor: (pedidoId) => {
    return apiRequest(`/entregas/vendedor/${pedidoId}`);
  },

  // Vendedor: criar entrega
  criarEntrega: (dadosEntrega) => {
    return apiRequest('/entregas', {
      method: 'POST',
      body: JSON.stringify(dadosEntrega)
    });
  },

  // Vendedor: atualizar status da entrega
  atualizarStatusEntrega: (entregaId, dadosStatus) => {
    return apiRequest(`/entregas/${entregaId}/status`, {
      method: 'PUT',
      body: JSON.stringify(dadosStatus)
    });
  },

  // Vendedor: atualizar status da entrega por pedido
  atualizarStatusEntregaPorPedido: (pedidoId, status) => {
    return apiRequest(`/entregas/pedido/${pedidoId}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status })
    });
  }
};

export default entregaApi;