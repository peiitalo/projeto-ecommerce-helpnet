import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import VendorLayout from '../../layouts/VendorLayout';
import { useAuth } from '../../context/AuthContext';
import { useNotification } from '../../context/NotificationContext';
import { produtoService, categoriaService } from '../../services/api';
import { uploadApi } from '../../services/uploadApi';
import { FiSave, FiX, FiUpload, FiTrash2 } from 'react-icons/fi';

function ProductForm() {
  const { user } = useAuth();
  const { showSuccess, showError, showInfo } = useNotification();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;

  const [formData, setFormData] = useState({
    nome: '',
    descricao: '',
    breveDescricao: '',
    preco: '',
    precoOriginal: '',
    estoque: '',
    categoriaId: '',
    codBarras: '',
    sku: '',
    peso: '',
    dimensoes: '',
    marca: '',
    modelo: '',
    cor: '',
    garantia: '',
    origem: 'Nacional',
    condicao: 'Novo',
    freteGratis: false,
    desconto: '',
    prazoEntrega: '',
    imagens: [],
    ativo: true
  });

  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    loadCategories();
    if (isEditing) {
      loadProduct();
    }
  }, [isEditing, id]);

  const loadCategories = async () => {
    try {
      const data = await categoriaService.listar();
      // Ajuste para o formato correto da resposta da API
      setCategories(Array.isArray(data) ? data : (data.categorias || []));
    } catch (error) {
      console.error('Erro ao carregar categorias:', error);
    }
  };

  const loadProduct = async () => {
    if (!user?.empresaId) return;

    try {
      setLoading(true);
      const response = await produtoService.buscarPorId(id);
      const product = response;

      // Check if product belongs to vendor's company
      if (product.empresa?.EmpresaID !== user.empresaId) {
        showError('Você não tem permissão para editar este produto.');
        navigate('/vendedor/produtos');
        return;
      }

      // Filtrar URLs de blob inválidas (de produtos antigos)
      const validImages = (product.Imagens || []).filter(img =>
        img && !img.startsWith('blob:') && img.trim() !== ''
      );

      setFormData({
        nome: product.Nome || '',
        descricao: product.Descricao || '',
        breveDescricao: product.BreveDescricao || '',
        preco: product.Preco?.toString() || '',
        precoOriginal: product.PrecoOriginal?.toString() || '',
        estoque: product.Estoque?.toString() || '',
        categoriaId: product.CategoriaID?.toString() || '',
        codBarras: product.CodBarras || '',
        sku: product.SKU || '',
        peso: product.Peso || '',
        dimensoes: product.Dimensoes || '',
        marca: product.Marca || '',
        modelo: product.Modelo || '',
        cor: product.Cor || '',
        garantia: product.Garantia || '',
        origem: product.Origem || 'Nacional',
        condicao: product.Condicao || 'Novo',
        freteGratis: product.FreteGratis || false,
        desconto: product.Desconto?.toString() || '',
        prazoEntrega: product.PrazoEntrega || '',
        imagens: validImages,
        ativo: product.Ativo ?? true
      });
    } catch (error) {
      console.error('Erro ao carregar produto:', error);
      showError('Erro ao carregar produto');
      navigate('/vendedor/produtos');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    try {
      // Mostrar feedback de upload
      showInfo('Enviando imagens...');

      // Fazer upload das imagens para o servidor
      const uploadResult = await uploadApi.uploadImages(files);

      if (uploadResult.success) {
        // Adicionar URLs das imagens salvas ao formulário
        setFormData(prev => ({
          ...prev,
          imagens: [...prev.imagens, ...uploadResult.images]
        }));

        showSuccess(`${files.length} imagem(ns) enviada(s) com sucesso!`);
      } else {
        throw new Error(uploadResult.error || 'Erro no upload');
      }
    } catch (error) {
      console.error('Erro no upload:', error);
      showError(`Erro ao enviar imagens: ${error.message}`);
    }

    // Limpar o input para permitir seleção dos mesmos arquivos novamente
    e.target.value = '';
  };

  const removeImage = async (index) => {
    const imageUrl = formData.imagens[index];

    // Se for uma imagem do servidor (não blob), tentar deletar do servidor
    if (imageUrl && imageUrl.startsWith('/uploads/')) {
      try {
        const filename = imageUrl.split('/').pop();
        await uploadApi.deleteImage(filename);
        showInfo('Imagem removida do servidor');
      } catch (error) {
        console.error('Erro ao deletar imagem do servidor:', error);
        // Não bloquear a remoção local mesmo se falhar no servidor
      }
    }

    // Remover da lista local
    setFormData(prev => ({
      ...prev,
      imagens: prev.imagens.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.preco || parseFloat(formData.preco) <= 0) newErrors.preco = 'Preço deve ser maior que zero';
    if (!formData.categoriaId) newErrors.categoriaId = 'Categoria é obrigatória';
    if (!formData.sku.trim()) newErrors.sku = 'SKU é obrigatório';
    if (formData.estoque && parseInt(formData.estoque) < 0) newErrors.estoque = 'Estoque não pode ser negativo';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    if (!user?.empresaId) {
      showError('Erro: Empresa não identificada');
      return;
    }

    try {
      setSaving(true);

      const submitData = {
        ...formData,
        preco: parseFloat(formData.preco),
        precoOriginal: formData.precoOriginal ? parseFloat(formData.precoOriginal) : null,
        estoque: parseInt(formData.estoque) || 0,
        categoriaId: parseInt(formData.categoriaId),
        desconto: parseInt(formData.desconto) || 0,
        empresaId: user.empresaId,
        vendedorId: user.vendedorId
      };

      if (isEditing) {
        await produtoService.atualizar(id, submitData);
        showSuccess('Produto atualizado com sucesso!');
      } else {
        await produtoService.criar(submitData);
        showSuccess('Produto criado com sucesso!');
      }

      navigate('/vendedor/produtos');
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      showError(`Erro ao ${isEditing ? 'atualizar' : 'criar'} produto: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <VendorLayout>
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </VendorLayout>
    );
  }

  return (
    <VendorLayout>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? 'Editar Produto' : 'Novo Produto'}
          </h1>
          <p className="mt-2 text-gray-600">
            {isEditing ? 'Atualize as informações do produto' : 'Preencha as informações para cadastrar um novo produto'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Informações Básicas */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Informações Básicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nome do Produto *
                </label>
                <input
                  type="text"
                  name="nome"
                  value={formData.nome}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.nome ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Nome do produto"
                />
                {errors.nome && <p className="mt-1 text-sm text-red-600">{errors.nome}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  SKU *
                </label>
                <input
                  type="text"
                  name="sku"
                  value={formData.sku}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.sku ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="Código SKU único"
                />
                {errors.sku && <p className="mt-1 text-sm text-red-600">{errors.sku}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço *
                </label>
                <input
                  type="number"
                  name="preco"
                  value={formData.preco}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.preco ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0.00"
                />
                {errors.preco && <p className="mt-1 text-sm text-red-600">{errors.preco}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Preço Original
                </label>
                <input
                  type="number"
                  name="precoOriginal"
                  value={formData.precoOriginal}
                  onChange={handleInputChange}
                  step="0.01"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Estoque
                </label>
                <input
                  type="number"
                  name="estoque"
                  value={formData.estoque}
                  onChange={handleInputChange}
                  min="0"
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.estoque ? 'border-red-500' : 'border-gray-300'
                  }`}
                  placeholder="0"
                />
                {errors.estoque && <p className="mt-1 text-sm text-red-600">{errors.estoque}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Categoria *
                </label>
                <select
                  name="categoriaId"
                  value={formData.categoriaId}
                  onChange={handleInputChange}
                  className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.categoriaId ? 'border-red-500' : 'border-gray-300'
                  }`}
                >
                  <option value="">Selecione uma categoria</option>
                  {categories.map(category => (
                    <option key={category.CategoriaID} value={category.CategoriaID}>
                      {category.Nome}
                    </option>
                  ))}
                </select>
                {errors.categoriaId && <p className="mt-1 text-sm text-red-600">{errors.categoriaId}</p>}
              </div>
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição Breve
              </label>
              <input
                type="text"
                name="breveDescricao"
                value={formData.breveDescricao}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descrição curta do produto"
              />
            </div>

            <div className="mt-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Descrição Completa
              </label>
              <textarea
                name="descricao"
                value={formData.descricao}
                onChange={handleInputChange}
                rows={4}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Descrição detalhada do produto"
              />
            </div>
          </div>

          {/* Especificações Técnicas */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Especificações Técnicas</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Marca</label>
                <input
                  type="text"
                  name="marca"
                  value={formData.marca}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Modelo</label>
                <input
                  type="text"
                  name="modelo"
                  value={formData.modelo}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Cor</label>
                <input
                  type="text"
                  name="cor"
                  value={formData.cor}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Peso (kg)</label>
                <input
                  type="text"
                  name="peso"
                  value={formData.peso}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Dimensões</label>
                <input
                  type="text"
                  name="dimensoes"
                  value={formData.dimensoes}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="LxAxP (cm)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Garantia</label>
                <input
                  type="text"
                  name="garantia"
                  value={formData.garantia}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 1 ano"
                />
              </div>
            </div>
          </div>

          {/* Imagens */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Imagens do Produto</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload de Imagens
                </label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {formData.imagens.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {formData.imagens.map((image, index) => (
                    <div key={index} className="relative">
                      <img
                        src={image}
                        alt={`Produto ${index + 1}`}
                        className="w-full h-24 object-cover rounded-lg border border-gray-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(index)}
                        className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700"
                      >
                        <FiTrash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Configurações */}
          <div className="bg-white border border-gray-200 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Configurações</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="ativo"
                  checked={formData.ativo}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Produto ativo
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="freteGratis"
                  checked={formData.freteGratis}
                  onChange={handleInputChange}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label className="ml-2 block text-sm text-gray-900">
                  Frete grátis
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Desconto (%)
                </label>
                <input
                  type="number"
                  name="desconto"
                  value={formData.desconto}
                  onChange={handleInputChange}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prazo de Entrega
                </label>
                <input
                  type="text"
                  name="prazoEntrega"
                  value={formData.prazoEntrega}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Ex: 5-10 dias úteis"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => navigate('/vendedor/produtos')}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <FiX className="w-4 h-4" />
              <span>Cancelar</span>
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center space-x-2"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Salvando...</span>
                </>
              ) : (
                <>
                  <FiSave className="w-4 h-4" />
                  <span>{isEditing ? 'Atualizar Produto' : 'Criar Produto'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </VendorLayout>
  );
}

export default ProductForm;