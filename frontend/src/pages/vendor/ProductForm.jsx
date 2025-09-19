import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { produtoService, categoriaService } from '../../services/api';
import { log } from '../../utils/logger';
import {
  FaSave,
  FaTimes,
  FaImage,
  FaPlus,
  FaTrash,
  FaUpload,
  FaTruck,
  FaPercent,
  FaArrowLeft
} from 'react-icons/fa';
import {
  FiPackage,
  FiTag,
  FiDollarSign,
  FiBox,
  FiInfo,
  FiSettings
} from 'react-icons/fi';

function ProductForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const isEditing = Boolean(id);
  const isVendor = location.pathname.startsWith('/vendedor');
  const basePath = isVendor ? '/vendedor' : '/admin';
  // Escopo de empresa por vendedor
  const storedUser = (() => { try { return JSON.parse(localStorage.getItem('auth:user') || 'null'); } catch { return null; } })();
  const EMPRESA_ID_MVP = storedUser?.empresaId || 1;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('basic');

  // Estados do formulário
  const [formData, setFormData] = useState({
    nome: '',
    breveDescricao: '',
    descricao: '',
    preco: '',
    precoOriginal: '',
    estoque: '',
    categoriaId: '',
    sku: '',
    codBarras: '',
    peso: '',
    dimensoes: '',
    marca: '',
    modelo: '',
    cor: '',
    garantia: '',
    origem: 'Nacional',
    condicao: 'Novo',
    freteGratis: false,
    desconto: 0,
    prazoEntrega: '3-5 dias úteis',
    imagens: [],
    ativo: true
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    carregarDadosIniciais();
  }, []);

  useEffect(() => {
    if (isEditing && id) {
      carregarProduto();
    } else {
      generateSKU();
    }
  }, [isEditing, id]);

  const carregarDadosIniciais = async () => {
    try {
      const categoriasResponse = await categoriaService.listar();
      setCategories(categoriasResponse);
    } catch (error) {
      log.error('product_form_categories_error', { error: { message: error?.message } });
    }
  };

  const carregarProduto = async () => {
    try {
      setLoading(true);
      const produto = await produtoService.buscarPorId(id);
      
      // Mapear dados do produto para o formato do formulário
      setFormData({
        nome: produto.Nome || '',
        breveDescricao: produto.BreveDescricao || '',
        descricao: produto.Descricao || '',
        preco: produto.Preco?.toString() || '',
        precoOriginal: produto.PrecoOriginal?.toString() || '',
        estoque: produto.Estoque?.toString() || '',
        categoriaId: produto.CategoriaID?.toString() || '',
        sku: produto.SKU || '',
        codBarras: produto.CodBarras || '',
        peso: produto.Peso || '',
        dimensoes: produto.Dimensoes || '',
        marca: produto.Marca || '',
        modelo: produto.Modelo || '',
        cor: produto.Cor || '',
        garantia: produto.Garantia || '',
        origem: produto.Origem || 'Nacional',
        condicao: produto.Condicao || 'Novo',
        freteGratis: produto.FreteGratis || false,
        desconto: produto.Desconto || 0,
        prazoEntrega: produto.PrazoEntrega || '3-5 dias úteis',
        imagens: produto.Imagens || [],
        ativo: produto.Ativo !== undefined ? produto.Ativo : true
      });

      setImagePreview(produto.Imagens || []);
    } catch (error) {
      log.error('product_form_load_error', { id, error: { message: error?.message } });
      alert('Erro ao carregar produto. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const generateSKU = async () => {
    try {
      const response = await produtoService.gerarSKU();
      setFormData(prev => ({ ...prev, sku: response.sku }));
    } catch (error) {
      console.error('Erro ao gerar SKU:', error);
      // Fallback para geração local
      const timestamp = Date.now().toString().slice(-6);
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      setFormData(prev => ({ ...prev, sku: `PROD-${timestamp}-${randomNum}` }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    
    // Limpar erro do campo quando usuário começar a digitar
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);

    files.forEach(file => {
      // Validate file type
      if (!['image/jpeg', 'image/jpg', 'image/png'].includes(file.type)) {
        alert('Apenas imagens JPG e PNG são permitidas.');
        return;
      }

      // Validate file size (3-5 MB)
      const minSize = 3 * 1024 * 1024; // 3 MB
      const maxSize = 5 * 1024 * 1024; // 5 MB
      if (file.size < minSize || file.size > maxSize) {
        alert('A imagem deve ter entre 3MB e 5MB.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const newImage = e.target.result;
        setImagePreview(prev => [...prev, newImage]);
        setFormData(prev => ({
          ...prev,
          imagens: [...prev.imagens, newImage]
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index) => {
    setImagePreview(prev => prev.filter((_, i) => i !== index));
    setFormData(prev => ({
      ...prev,
      imagens: prev.imagens.filter((_, i) => i !== index)
    }));
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.nome.trim()) newErrors.nome = 'Nome é obrigatório';
    if (!formData.preco) newErrors.preco = 'Preço é obrigatório';
    if (!formData.categoriaId) newErrors.categoriaId = 'Categoria é obrigatória';
    if (!formData.estoque) newErrors.estoque = 'Estoque é obrigatório';
    if (!formData.sku.trim()) newErrors.sku = 'SKU é obrigatório';

    if (formData.preco && isNaN(parseFloat(formData.preco))) {
      newErrors.preco = 'Preço deve ser um número válido';
    }

    if (formData.precoOriginal && isNaN(parseFloat(formData.precoOriginal))) {
      newErrors.precoOriginal = 'Preço original deve ser um número válido';
    }

    if (formData.estoque && isNaN(parseInt(formData.estoque))) {
      newErrors.estoque = 'Estoque deve ser um número válido';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setSaving(true);
    
    try {
      // Preparar dados para envio
      const dadosProduto = {
        nome: formData.nome,
        breveDescricao: formData.breveDescricao,
        descricao: formData.descricao,
        preco: parseFloat(formData.preco),
        precoOriginal: formData.precoOriginal ? parseFloat(formData.precoOriginal) : null,
        estoque: parseInt(formData.estoque),
        categoriaId: parseInt(formData.categoriaId),
        sku: formData.sku,
        codBarras: formData.codBarras,
        peso: formData.peso,
        dimensoes: formData.dimensoes,
        marca: formData.marca,
        modelo: formData.modelo,
        cor: formData.cor,
        garantia: formData.garantia,
        origem: formData.origem,
        condicao: formData.condicao,
        freteGratis: formData.freteGratis,
        desconto: parseInt(formData.desconto),
        prazoEntrega: formData.prazoEntrega,
        imagens: formData.imagens,
        ativo: formData.ativo
      };

      if (isEditing) {
        if (isVendor) {
          await produtoService.atualizarVendedor(EMPRESA_ID_MVP, id, dadosProduto);
        } else {
          await produtoService.atualizar(id, dadosProduto);
        }
        alert('Produto atualizado com sucesso!');
      } else {
        if (isVendor) {
          await produtoService.criarVendedor(EMPRESA_ID_MVP, dadosProduto);
        } else {
          await produtoService.criar(dadosProduto);
        }
        alert('Produto criado com sucesso!');
      }
      
      // Redirecionar para lista de produtos
      navigate(`${basePath}/produtos`);
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert(`Erro ao ${isEditing ? 'atualizar' : 'criar'} produto: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'basic', label: 'Informações Básicas', icon: <FiInfo /> },
    { id: 'pricing', label: 'Preços e Estoque', icon: <FiDollarSign /> },
    { id: 'details', label: 'Detalhes do Produto', icon: <FiPackage /> },
    { id: 'images', label: 'Imagens', icon: <FaImage /> },
    { id: 'shipping', label: 'Entrega e Promoções', icon: <FaTruck /> }
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-slate-600">Carregando produto...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <button
              onClick={() => navigate(`${basePath}/produtos`)}
              className="p-2 text-slate-600 hover:text-blue-700 transition-colors"
            >
              <FaArrowLeft />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                {isEditing ? 'Editar Produto' : 'Novo Produto'}
              </h1>
              <p className="text-slate-600">
                {isEditing ? 'Atualize as informações do produto' : 'Preencha os dados do novo produto'}
              </p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Navegação das abas */}
          <div className="bg-white rounded-lg border border-slate-200 mb-6">
            <div className="border-b border-slate-200">
              <nav className="flex space-x-8 px-6">
                {tabs.map((tab) => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`flex items-center gap-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                      activeTab === tab.id
                        ? 'border-blue-500 text-blue-600'
                        : 'border-transparent text-slate-500 hover:text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {tab.icon}
                    {tab.label}
                  </button>
                ))}
              </nav>
            </div>

            <div className="p-6">
              {/* Aba Informações Básicas */}
              {activeTab === 'basic' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Nome do Produto *
                      </label>
                      <input
                        type="text"
                        name="nome"
                        value={formData.nome}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.nome ? 'border-red-300' : 'border-slate-200'
                        }`}
                        placeholder="Ex: Fone Bluetooth Premium"
                      />
                      {errors.nome && <p className="text-red-600 text-sm mt-1">{errors.nome}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Categoria *
                      </label>
                      <select
                        name="categoriaId"
                        value={formData.categoriaId}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.categoriaId ? 'border-red-300' : 'border-slate-200'
                        }`}
                      >
                        <option value="">Selecione uma categoria</option>
                        {categories.map(cat => (
                          <option key={cat.CategoriaID || cat.id} value={cat.CategoriaID || cat.id}>
                            {cat.Nome || cat.name}
                          </option>
                        ))}
                      </select>
                      {errors.categoriaId && <p className="text-red-600 text-sm mt-1">{errors.categoriaId}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Breve Descrição
                    </label>
                    <textarea
                      name="breveDescricao"
                      value={formData.breveDescricao}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Descrição curta do produto..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Descrição Detalhada
                    </label>
                    <textarea
                      name="descricao"
                      value={formData.descricao}
                      onChange={handleInputChange}
                      rows="4"
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Descreva o produto detalhadamente..."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        SKU *
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          name="sku"
                          value={formData.sku}
                          onChange={handleInputChange}
                          className={`flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.sku ? 'border-red-300' : 'border-slate-200'
                          }`}
                          placeholder="Ex: PROD-123456"
                        />
                        <button
                          type="button"
                          onClick={generateSKU}
                          className="px-3 py-2 text-sm bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                        >
                          Gerar
                        </button>
                      </div>
                      {errors.sku && <p className="text-red-600 text-sm mt-1">{errors.sku}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Código de Barras
                      </label>
                      <input
                        type="text"
                        name="codBarras"
                        value={formData.codBarras}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 7891234567890"
                      />
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        name="ativo"
                        checked={formData.ativo}
                        onChange={handleInputChange}
                        className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-700">Produto ativo</span>
                    </label>
                  </div>
                </div>
              )}

              {/* Aba Preços e Estoque */}
              {activeTab === 'pricing' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Preço Atual *
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          name="preco"
                          value={formData.preco}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.preco ? 'border-red-300' : 'border-slate-200'
                          }`}
                          placeholder="0,00"
                        />
                      </div>
                      {errors.preco && <p className="text-red-600 text-sm mt-1">{errors.preco}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Preço Original
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">R$</span>
                        <input
                          type="number"
                          step="0.01"
                          name="precoOriginal"
                          value={formData.precoOriginal}
                          onChange={handleInputChange}
                          className={`w-full pl-10 pr-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                            errors.precoOriginal ? 'border-red-300' : 'border-slate-200'
                          }`}
                          placeholder="0,00"
                        />
                      </div>
                      {errors.precoOriginal && <p className="text-red-600 text-sm mt-1">{errors.precoOriginal}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Estoque *
                      </label>
                      <input
                        type="number"
                        name="estoque"
                        value={formData.estoque}
                        onChange={handleInputChange}
                        className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                          errors.estoque ? 'border-red-300' : 'border-slate-200'
                        }`}
                        placeholder="0"
                        min="0"
                      />
                      {errors.estoque && <p className="text-red-600 text-sm mt-1">{errors.estoque}</p>}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">
                      Desconto (%)
                    </label>
                    <input
                      type="number"
                      name="desconto"
                      value={formData.desconto}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                      max="100"
                    />
                  </div>
                </div>
              )}

              {/* Aba Detalhes do Produto */}
              {activeTab === 'details' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Marca</label>
                      <input
                        type="text"
                        name="marca"
                        value={formData.marca}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: TechSound"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Modelo</label>
                      <input
                        type="text"
                        name="modelo"
                        value={formData.modelo}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: NoiseCancel Pro"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Cor</label>
                      <input
                        type="text"
                        name="cor"
                        value={formData.cor}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: Preto Fosco"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Peso</label>
                      <input
                        type="text"
                        name="peso"
                        value={formData.peso}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 280g"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Dimensões</label>
                      <input
                        type="text"
                        name="dimensoes"
                        value={formData.dimensoes}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 18 x 15 x 8 cm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Garantia</label>
                      <input
                        type="text"
                        name="garantia"
                        value={formData.garantia}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 2 anos"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Origem</label>
                      <select
                        name="origem"
                        value={formData.origem}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Nacional">Nacional</option>
                        <option value="Importado">Importado</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">Condição</label>
                      <select
                        name="condicao"
                        value={formData.condicao}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                      >
                        <option value="Novo">Novo</option>
                        <option value="Usado">Usado</option>
                        <option value="Recondicionado">Recondicionado</option>
                      </select>
                    </div>
                  </div>
                </div>
              )}

              {/* Aba Imagens */}
              {activeTab === 'images' && (
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-4">
                      Imagens do Produto
                    </label>
                    
                    {/* Upload de imagens */}
                    <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/jpg,image/png"
                        onChange={handleImageUpload}
                        className="hidden"
                        id="image-upload"
                      />
                      <label htmlFor="image-upload" className="cursor-pointer">
                        <FaUpload className="mx-auto h-12 w-12 text-slate-400 mb-4" />
                        <p className="text-slate-600 mb-2">Clique para fazer upload das imagens</p>
                        <p className="text-sm text-slate-500">Apenas JPG e PNG, 3-5 MB cada</p>
                      </label>
                    </div>

                    {/* Preview das imagens */}
                    {imagePreview.length > 0 && (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                        {imagePreview.map((image, index) => (
                          <div key={index} className="relative group">
                            <img
                              src={image}
                              alt={`Preview ${index + 1}`}
                              className="w-full h-32 object-cover rounded-lg border border-slate-200"
                            />
                            <button
                              type="button"
                              onClick={() => removeImage(index)}
                              className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <FaTimes className="text-xs" />
                            </button>
                            {index === 0 && (
                              <span className="absolute bottom-2 left-2 px-2 py-1 bg-blue-500 text-white text-xs rounded">
                                Principal
                              </span>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Aba Entrega e Promoções */}
              {activeTab === 'shipping' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-2">
                        Prazo de Entrega
                      </label>
                      <input
                        type="text"
                        name="prazoEntrega"
                        value={formData.prazoEntrega}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="Ex: 3-5 dias úteis"
                      />
                    </div>

                    <div className="flex items-center gap-4 pt-8">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          name="freteGratis"
                          checked={formData.freteGratis}
                          onChange={handleInputChange}
                          className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm font-medium text-slate-700">Frete grátis</span>
                      </label>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Botões de ação */}
          <div className="flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={() => navigate(`${basePath}/produtos`)}
              className="px-6 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <FaSave />
                  {isEditing ? 'Atualizar Produto' : 'Criar Produto'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ProductForm;