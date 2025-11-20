import { useState, useEffect } from 'react';
import { FiX, FiPlus, FiTrash2 } from 'react-icons/fi';
import cupomApi from '../services/cupomApi.js';

function CouponModal({ isOpen, onClose, onSuccess, editingCoupon = null }) {
  const [loading, setLoading] = useState(false);
  const [clients, setClients] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    nome: '',
    codigo: '',
    tipo: 'publico',
    descontoTipo: 'porcentagem',
    descontoValor: '',
    dataExpiracao: '',
    limiteUso: '',
    usoPorCliente: '',
    categoriaId: '',
    valorMinimo: '',
    clientesEspecificos: []
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      loadClients();
      loadCategories();
      if (editingCoupon) {
        populateFormWithCoupon(editingCoupon);
      } else {
        resetForm();
      }
    }
  }, [isOpen, editingCoupon]);

  const loadClients = async () => {
    try {
      const response = await cupomApi.listarClientesDisponiveis();
      setClients(response.clientes || []);
    } catch (error) {
      console.error('Erro ao carregar clientes:', error);
    }
  };

  const loadCategories = async () => {
    try {
      // Assuming there's a categories API
      const response = await fetch('/api/categorias');
      const data = await response.json();
      setCategories(data || []);
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nome: '',
      codigo: '',
      tipo: 'publico',
      descontoTipo: 'porcentagem',
      descontoValor: '',
      dataExpiracao: '',
      limiteUso: '',
      usoPorCliente: '',
      categoriaId: '',
      valorMinimo: '',
      clientesEspecificos: []
    });
    setErrors({});
  };

  const populateFormWithCoupon = (coupon) => {
    setFormData({
      nome: coupon.Nome || '',
      codigo: coupon.Codigo || '',
      tipo: coupon.Tipo || 'publico',
      descontoTipo: coupon.DescontoTipo || 'porcentagem',
      descontoValor: coupon.DescontoValor ? coupon.DescontoValor.toString() : '',
      dataExpiracao: coupon.DataExpiracao ? new Date(coupon.DataExpiracao).toISOString().slice(0, 16) : '',
      limiteUso: coupon.LimiteUso ? coupon.LimiteUso.toString() : '',
      usoPorCliente: coupon.UsoPorCliente ? coupon.UsoPorCliente.toString() : '',
      categoriaId: coupon.Restricoes?.categoriaId ? coupon.Restricoes.categoriaId.toString() : '',
      valorMinimo: coupon.Restricoes?.valorMinimo ? coupon.Restricoes.valorMinimo.toString() : '',
      clientesEspecificos: coupon.cuponsCliente ? coupon.cuponsCliente.map(cc => cc.cliente.ClienteID) : []
    });
    setErrors({});
  };

  const handleInputChange = (field, value) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error for this field
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: null
      }));
    }
  };

  const handleClientToggle = (clientId) => {
    setFormData(prev => ({
      ...prev,
      clientesEspecificos: prev.clientesEspecificos.includes(clientId)
        ? prev.clientesEspecificos.filter(id => id !== clientId)
        : [...prev.clientesEspecificos, clientId]
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.codigo.trim()) newErrors.codigo = 'Código é obrigatório';
    if (!formData.descontoValor || formData.descontoValor <= 0) {
      newErrors.descontoValor = 'Valor do desconto deve ser maior que zero';
    }

    if (formData.descontoTipo === 'porcentagem' && formData.descontoValor > 100) {
      newErrors.descontoValor = 'Percentual não pode ser maior que 100%';
    }

    if (formData.tipo === 'especifico' && formData.clientesEspecificos.length === 0) {
      newErrors.clientesEspecificos = 'Selecione pelo menos um cliente';
    }

    if (formData.dataExpiracao && new Date(formData.dataExpiracao) <= new Date()) {
      newErrors.dataExpiracao = 'Data de expiração deve ser futura';
    }

    if (formData.valorMinimo && formData.valorMinimo <= 0) {
      newErrors.valorMinimo = 'Valor mínimo deve ser maior que zero';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setLoading(true);
    try {
      const submitData = {
        ...formData,
        descontoValor: parseFloat(formData.descontoValor),
        limiteUso: formData.limiteUso ? parseInt(formData.limiteUso) : null,
        usoPorCliente: formData.usoPorCliente ? parseInt(formData.usoPorCliente) : null,
        valorMinimo: formData.valorMinimo ? parseFloat(formData.valorMinimo) : null,
        categoriaId: formData.categoriaId ? parseInt(formData.categoriaId) : null,
        restricoes: {
          categoriaId: formData.categoriaId ? parseInt(formData.categoriaId) : null,
          valorMinimo: formData.valorMinimo ? parseFloat(formData.valorMinimo) : null
        }
      };

      if (editingCoupon) {
        await cupomApi.atualizar(editingCoupon.CupomID, submitData);
      } else {
        await cupomApi.criar(submitData);
      }
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar cupom:', error);
      setErrors({ submit: error.message || `Erro ao ${editingCoupon ? 'atualizar' : 'criar'} cupom` });
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {editingCoupon ? 'Editar Cupom' : 'Criar Novo Cupom'}
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {errors.submit && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <p className="text-red-800">{errors.submit}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Nome do Cupom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Cupom *
              </label>
              <input
                type="text"
                value={formData.nome}
                onChange={(e) => handleInputChange('nome', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.nome ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: Desconto de 10%"
              />
              {errors.nome && <p className="text-red-600 text-sm mt-1">{errors.nome}</p>}
            </div>

            {/* Código do Cupom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Código do Cupom *
              </label>
              <input
                type="text"
                value={formData.codigo}
                onChange={(e) => handleInputChange('codigo', e.target.value.toUpperCase())}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.codigo ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: DESCONTO10"
              />
              {errors.codigo && <p className="text-red-600 text-sm mt-1">{errors.codigo}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tipo de Distribuição */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Distribuição *
              </label>
              <select
                value={formData.tipo}
                onChange={(e) => handleInputChange('tipo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="publico">Público (todos os clientes)</option>
                <option value="especifico">Específico (clientes selecionados)</option>
              </select>
            </div>

            {/* Tipo de Desconto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tipo de Desconto *
              </label>
              <select
                value={formData.descontoTipo}
                onChange={(e) => handleInputChange('descontoTipo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="porcentagem">Percentual (%)</option>
                <option value="valor_fixo">Valor Fixo (R$)</option>
                <option value="frete_gratis">Frete Grátis</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Valor do Desconto */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor do Desconto *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.descontoValor}
                onChange={(e) => handleInputChange('descontoValor', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.descontoValor ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder={formData.descontoTipo === 'porcentagem' ? '10' : '10.00'}
                disabled={formData.descontoTipo === 'frete_gratis'}
              />
              {errors.descontoValor && <p className="text-red-600 text-sm mt-1">{errors.descontoValor}</p>}
            </div>

            {/* Data de Expiração */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Data de Expiração
              </label>
              <input
                type="datetime-local"
                value={formData.dataExpiracao}
                onChange={(e) => handleInputChange('dataExpiracao', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.dataExpiracao ? 'border-red-300' : 'border-gray-300'
                }`}
              />
              {errors.dataExpiracao && <p className="text-red-600 text-sm mt-1">{errors.dataExpiracao}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Limite de Uso Total */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Limite de Uso Total
              </label>
              <input
                type="number"
                min="1"
                value={formData.limiteUso}
                onChange={(e) => handleInputChange('limiteUso', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Deixe vazio para ilimitado"
              />
            </div>

            {/* Uso por Cliente */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Uso por Cliente
              </label>
              <input
                type="number"
                min="1"
                value={formData.usoPorCliente}
                onChange={(e) => handleInputChange('usoPorCliente', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="1"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Categoria Específica */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoria Específica
              </label>
              <select
                value={formData.categoriaId}
                onChange={(e) => handleInputChange('categoriaId', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todas as categorias</option>
                {categories.map(category => (
                  <option key={category.CategoriaID} value={category.CategoriaID}>
                    {category.Nome}
                  </option>
                ))}
              </select>
            </div>

            {/* Valor Mínimo da Compra */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Valor Mínimo da Compra (R$)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={formData.valorMinimo}
                onChange={(e) => handleInputChange('valorMinimo', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.valorMinimo ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Ex: 50.00"
              />
              {errors.valorMinimo && <p className="text-red-600 text-sm mt-1">{errors.valorMinimo}</p>}
            </div>
          </div>

          {/* Seleção de Clientes (apenas para cupons específicos) */}
          {formData.tipo === 'especifico' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Selecionar Clientes *
              </label>
              <div className="border border-gray-300 rounded-lg max-h-48 overflow-y-auto">
                {clients.length > 0 ? (
                  clients.map(client => (
                    <div
                      key={client.ClienteID}
                      className="flex items-center p-3 border-b border-gray-200 last:border-b-0 hover:bg-gray-50"
                    >
                      <input
                        type="checkbox"
                        id={`client-${client.ClienteID}`}
                        checked={formData.clientesEspecificos.includes(client.ClienteID)}
                        onChange={() => handleClientToggle(client.ClienteID)}
                        className="mr-3"
                      />
                      <label
                        htmlFor={`client-${client.ClienteID}`}
                        className="flex-1 cursor-pointer"
                      >
                        <div className="font-medium text-gray-900">{client.NomeCompleto}</div>
                        <div className="text-sm text-gray-500">{client.Email}</div>
                      </label>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-gray-500">
                    Nenhum cliente encontrado
                  </div>
                )}
              </div>
              {errors.clientesEspecificos && (
                <p className="text-red-600 text-sm mt-1">{errors.clientesEspecificos}</p>
              )}
            </div>
          )}

          {/* Botões */}
          <div className="flex justify-end gap-3 pt-6 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              disabled={loading}
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? (editingCoupon ? 'Atualizando...' : 'Criando...') : (editingCoupon ? 'Atualizar Cupom' : 'Criar Cupom')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default CouponModal;