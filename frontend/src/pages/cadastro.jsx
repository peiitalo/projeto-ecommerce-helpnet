import { useState } from "react";
import { FaUser, FaBuilding, FaEnvelope, FaLock, FaMapMarkerAlt, FaPhone, FaWhatsapp } from 'react-icons/fa';

function Cadastro() {
  const [tipoPessoa, setTipoPessoa] = useState("");
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [formData, setFormData] = useState({
    nome: "",
    email: "",
    senha: "",
    // Contatos
    telefoneFixo: "",
    telefoneCelular: "",
    whatsapp: "",
    // Documentos
    cpf: "",
    cnpj: "",
    razaoSocial: "",
    inscricaoEstadual: "",
    inscricaoMunicipal: "",
    // Endereço
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
  });

  const [errors, setErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingCep, setLoadingCep] = useState(false);

  // Definições das classes CSS
  const inputClass = `
    block w-full px-4 py-3 mb-4 
    bg-white/50 backdrop-blur-md
    border border-gray-200 
    rounded-xl
    shadow-sm 
    placeholder:text-gray-400
    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
    transition-all duration-300
  `;

  const buttonClass = `
    px-6 py-3 
    rounded-xl
    font-semibold 
    text-white
    shadow-lg
    hover:shadow-xl
    hover:scale-105 
    active:scale-95
    disabled:opacity-50
    disabled:cursor-not-allowed
    disabled:hover:scale-100
    focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2
    transition-all duration-300
  `;

  const cardClass = `
    w-full max-w-md
    mx-auto p-8
    bg-white/80 backdrop-blur-xl
    rounded-2xl
    shadow-2xl
    border border-gray-100
    transition-all duration-500
    animate-fade-in
  `;

  const buttonSendClass = `
    ${buttonClass}
    bg-gradient-to-r from-green-500 to-green-700
    hover:from-green-600 hover:to-green-800
  `;

  const buscarCep = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    
    if (cepLimpo.length !== 8) {
      return;
    }

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();

      if (data.erro) {
        setErrors(["CEP não encontrado"]);
        return;
      }

      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || prev.endereco,
        bairro: data.bairro || prev.bairro,
        cidade: data.localidade || prev.cidade,
        estado: data.uf || prev.estado,
      }));
      
      setErrors([]);
    } catch (error) {
      setErrors(["Erro ao buscar CEP"]);
    } finally {
      setLoadingCep(false);
    }
  };

  const proximaEtapa = () => {
    setErrors([]);
    
    // Validações básicas antes de avançar
    if (etapaAtual === 1) {
      const etapa1Errors = [];
      if (tipoPessoa === "fisica") {
        if (!formData.nome) etapa1Errors.push("Nome é obrigatório");
        if (!formData.cpf) etapa1Errors.push("CPF é obrigatório");
      } else {
        if (!formData.razaoSocial) etapa1Errors.push("Razão Social é obrigatória");
        if (!formData.cnpj) etapa1Errors.push("CNPJ é obrigatório");
      }
      if (!formData.email) etapa1Errors.push("Email é obrigatório");
      if (!formData.senha) etapa1Errors.push("Senha é obrigatória");
      
      if (etapa1Errors.length > 0) {
        setErrors(etapa1Errors);
        return;
      }
    }

    if (etapaAtual === 2) {
      const etapa2Errors = [];
      if (!formData.telefoneFixo && !formData.telefoneCelular && !formData.whatsapp) {
        etapa2Errors.push("Pelo menos um telefone é obrigatório");
      }
      if (formData.telefoneCelular && formData.telefoneCelular.length < 10) {
        etapa2Errors.push("Telefone Celular deve ter pelo menos 10 dígitos");
      }
      if (formData.whatsapp && formData.whatsapp.length < 10) {
        etapa2Errors.push("WhatsApp deve ter pelo menos 10 dígitos");
      }

      if (etapa2Errors.length > 0) {
        setErrors(etapa2Errors);
        return;
      }
    }

    if (etapaAtual === 3) {
      const etapa3Errors = [];
      if (!formData.endereco) etapa3Errors.push("Endereço é obrigatório");
      if (!formData.numero) etapa3Errors.push("Número é obrigatório");
      if (!formData.bairro) etapa3Errors.push("Bairro é obrigatório");
      if (!formData.cidade) etapa3Errors.push("Cidade é obrigatória");
      if (!formData.estado) etapa3Errors.push("Estado é obrigatório");
      if (!formData.cep) etapa3Errors.push("CEP é obrigatório");

      if (etapa3Errors.length > 0) {
        setErrors(etapa3Errors);
        return;
      }
    }

    setEtapaAtual((prev) => prev + 1);
  };

  const etapaAnterior = () => {
    setErrors([]);
    setEtapaAtual((prev) => prev - 1);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Buscar CEP quando completar 8 dígitos
    if (name === 'cep' && value.replace(/\D/g, '').length === 8) {
      buscarCep(value);
    }
  };

  const enviarFormulario = async () => {
    setLoading(true);
    setErrors([]);

    try {
      const payload = {
        NomeCompleto: tipoPessoa === "fisica" ? formData.nome : formData.razaoSocial,
        TipoPessoa: tipoPessoa === "fisica" ? "Física" : "Jurídica",
        CPF_CNPJ: tipoPessoa === "fisica" ? formData.cpf : formData.cnpj,
        Email: formData.email,
        senha: formData.senha, // Backend vai criptografar
        RazaoSocial: tipoPessoa === "juridica" ? formData.razaoSocial : null,
        Endereco: formData.endereco,
        Numero: formData.numero,
        Complemento: formData.complemento,
        Bairro: formData.bairro,
        Cidade: formData.cidade,
        Estado: formData.estado,
        CEP: formData.cep,
        TelefoneFixo: formData.telefoneFixo,
        TelefoneCelular: formData.telefoneCelular,
        Whatsapp: formData.whatsapp,
      };

      const response = await fetch("http://localhost:3001/api/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.join('\n') || 'Erro ao cadastrar');
      }

      alert("Cadastro realizado com sucesso!");
      // Opcional: redirecionar para login
      
    } catch (error) {
      setErrors(Array.isArray(error.message.split('\n')) 
        ? error.message.split('\n') 
        : [error.message]);
    } finally {
      setLoading(false);
    }
  };

  const ProgressBar = () => (
    <div className="mb-8">
      <div className="flex justify-between mb-2">
        {[1, 2, 3, 4].map((step) => (
          <div
            key={step}
            className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step <= etapaAtual
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-500"
            } transition-colors duration-300`}
          >
            {step}
          </div>
        ))}
      </div>
      <div className="h-2 bg-gray-200 rounded-full">
        <div
          className="h-full bg-blue-600 rounded-full transition-all duration-500"
          style={{ width: `${((etapaAtual - 1) / 3) * 100}%` }}
        />
      </div>
    </div>
  );

  const ErrorMessages = () => {
    if (errors.length === 0) return null;
    
    return (
      <div className="mb-4 p-4 bg-red-50 border-l-4 border-red-500 rounded">
        {errors.map((error, index) => (
          <p key={index} className="text-red-700 text-sm">
            {error}
          </p>
        ))}
      </div>
    );
  };

  const renderFormularioFisica = () => (
    <div className="space-y-4">
      <div className="relative">
        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={inputClass + " pl-10"}
          type="text"
          name="nome"
          placeholder="Nome Completo"
          value={formData.nome}
          onChange={handleChange}
        />
      </div>
      <div className="relative">
        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={inputClass + " pl-10"}
          type="text"
          name="cpf"
          placeholder="CPF"
          value={formData.cpf}
          onChange={handleChange}
        />
      </div>
      <div className="relative">
        <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={inputClass + " pl-10"}
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />
      </div>
      <div className="relative">
        <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={inputClass + " pl-10"}
          type="password"
          name="senha"
          placeholder="Senha"
          value={formData.senha}
          onChange={handleChange}
        />
      </div>
    </div>
  );

  const renderFormularioJuridica = () => (
    <div className="space-y-4">
      <div className="relative">
        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={inputClass + " pl-10"}
          type="text"
          name="razaoSocial"
          placeholder="Razão Social"
          value={formData.razaoSocial}
          onChange={handleChange}
        />
      </div>
      <div className="relative">
        <FaUser className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={inputClass + " pl-10"}
          type="text"
          name="cnpj"
          placeholder="CNPJ"
          value={formData.cnpj}
          onChange={handleChange}
        />
      </div>
      <div className="relative">
        <FaEnvelope className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={inputClass + " pl-10"}
          type="email"
          name="email"
          placeholder="Email"
          value={formData.email}
          onChange={handleChange}
        />
      </div>
      <div className="relative">
        <FaLock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={inputClass + " pl-10"}
          type="password"
          name="senha"
          placeholder="Senha"
          value={formData.senha}
          onChange={handleChange}
        />
      </div>
    </div>
  );

  const renderFormularioContato = () => (
    <div className="space-y-4">
      <div className="relative">
        <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={inputClass + " pl-10"}
          type="tel"
          name="telefoneFixo"
          placeholder="Telefone Fixo"
          value={formData.telefoneFixo}
          onChange={handleChange}
        />
      </div>
      <div className="relative">
        <FaPhone className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={inputClass + " pl-10"}
          type="tel"
          name="telefoneCelular"
          placeholder="Telefone Celular"
          value={formData.telefoneCelular}
          onChange={handleChange}
        />
      </div>
      <div className="relative">
        <FaWhatsapp className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={inputClass + " pl-10"}
          type="tel"
          name="whatsapp"
          placeholder="WhatsApp"
          value={formData.whatsapp}
          onChange={handleChange}
        />
      </div>
    </div>
  );

  const renderFormularioEndereco = () => (
    <div className="space-y-4">
      <div className="relative">
        <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={inputClass + " pl-10"}
          type="text"
          name="cep"
          placeholder="CEP"
          value={formData.cep}
          onChange={handleChange}
        />
      </div>
      <div className="relative">
        <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={inputClass + " pl-10"}
          type="text"
          name="endereco"
          placeholder="Endereço"
          value={formData.endereco}
          onChange={handleChange}
          disabled={loadingCep}
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="relative">
          <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className={inputClass + " pl-10"}
            type="text"
            name="numero"
            placeholder="Número"
            value={formData.numero}
            onChange={handleChange}
          />
        </div>
        <div className="relative">
          <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className={inputClass + " pl-10"}
            type="text"
            name="complemento"
            placeholder="Complemento"
            value={formData.complemento}
            onChange={handleChange}
          />
        </div>
      </div>
      <div className="relative">
        <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={inputClass + " pl-10"}
          type="text"
          name="bairro"
          placeholder="Bairro"
          value={formData.bairro}
          onChange={handleChange}
          disabled={loadingCep}
        />
      </div>
      <div className="relative">
        <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={inputClass + " pl-10"}
          type="text"
          name="cidade"
          placeholder="Cidade"
          value={formData.cidade}
          onChange={handleChange}
          disabled={loadingCep}
        />
      </div>
      <div className="relative">
        <FaMapMarkerAlt className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          className={inputClass + " pl-10"}
          type="text"
          name="estado"
          placeholder="Estado"
          value={formData.estado}
          onChange={handleChange}
          disabled={loadingCep}
        />
      </div>
    </div>
  );

  const renderEtapa = () => {
    if (!tipoPessoa) {
      return (
        <div className={cardClass}>
          <h2 className="text-3xl font-bold mb-8 text-center bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent">
            Escolha o tipo de cadastro
          </h2>
          <div className="grid grid-cols-2 gap-6">
            <button
              className={`${buttonClass} bg-gradient-to-r from-blue-500 to-blue-700`}
              onClick={() => setTipoPessoa("fisica")}
            >
              <div className="flex flex-col items-center gap-2">
                <FaUser className="text-2xl" />
                <span>Pessoa Física</span>
              </div>
            </button>
            <button
              className={`${buttonClass} bg-gradient-to-r from-blue-500 to-blue-700`}
              onClick={() => setTipoPessoa("juridica")}
            >
              <div className="flex flex-col items-center gap-2">
                <FaBuilding className="text-2xl" />
                <span>Pessoa Jurídica</span>
              </div>
            </button>
          </div>
        </div>
      );
    }

    switch (etapaAtual) {
      case 1:
        return (
          <div className={cardClass}>
            <ProgressBar />
            <h2 className="text-2xl font-bold mb-6 text-gray-800">
              {tipoPessoa === "fisica" ? "Dados Pessoais" : "Dados da Empresa"}
            </h2>
            <ErrorMessages />
            {tipoPessoa === "fisica" ? renderFormularioFisica() : renderFormularioJuridica()}
            <div className="flex justify-between mt-8">
              <button
                className={`${buttonClass} bg-gray-500 hover:bg-gray-600`}
                onClick={() => setTipoPessoa("")}
              >
                Voltar
              </button>
              <button
                className={`${buttonClass} bg-gradient-to-r from-blue-500 to-blue-700`}
                onClick={proximaEtapa}
              >
                Próxima
              </button>
            </div>
          </div>
        );
      case 2:
        return (
          <div className={cardClass}>
            <ProgressBar />
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Contato</h2>
            <ErrorMessages />
            {renderFormularioContato()}
            <div className="flex justify-between mt-8">
              <button
                className={`${buttonClass} bg-gray-500 hover:bg-gray-600`}
                onClick={etapaAnterior}
              >
                Anterior
              </button>
              <button
                className={`${buttonClass} bg-gradient-to-r from-blue-500 to-blue-700`}
                onClick={proximaEtapa}
              >
                Próxima
              </button>
            </div>
          </div>
        );
      case 3:
        return (
          <div className={cardClass}>
            <ProgressBar />
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Endereço</h2>
            <ErrorMessages />
            {renderFormularioEndereco()}
            <div className="flex justify-between mt-8">
              <button
                className={`${buttonClass} bg-gray-500 hover:bg-gray-600`}
                onClick={etapaAnterior}
              >
                Anterior
              </button>
              <button
                className={`${buttonClass} bg-gradient-to-r from-blue-500 to-blue-700`}
                onClick={proximaEtapa}
              >
                Próxima
              </button>
            </div>
          </div>
        );
      case 4:
        return (
          <div className={cardClass}>
            <ProgressBar />
            <h2 className="text-2xl font-bold mb-6 text-gray-800">Confirmação</h2>
            <ErrorMessages />
            <div className="bg-gray-50 p-6 rounded-xl space-y-3">
              {/* Dados Pessoais/Empresa */}
              {tipoPessoa === "fisica" ? (
                <>
                  <p className="flex justify-between">
                    <span className="font-semibold text-gray-600">Nome:</span>
                    <span>{formData.nome}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-semibold text-gray-600">CPF:</span>
                    <span>{formData.cpf}</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="flex justify-between">
                    <span className="font-semibold text-gray-600">Razão Social:</span>
                    <span>{formData.razaoSocial}</span>
                  </p>
                  <p className="flex justify-between">
                    <span className="font-semibold text-gray-600">CNPJ:</span>
                    <span>{formData.cnpj}</span>
                  </p>
                </>
              )}
              
              {/* Contatos */}
              <p className="flex justify-between">
                <span className="font-semibold text-gray-600">Email:</span>
                <span>{formData.email}</span>
              </p>
              {formData.telefoneFixo && (
                <p className="flex justify-between">
                  <span className="font-semibold text-gray-600">Telefone Fixo:</span>
                  <span>{formData.telefoneFixo}</span>
                </p>
              )}
              {formData.telefoneCelular && (
                <p className="flex justify-between">
                  <span className="font-semibold text-gray-600">Celular:</span>
                  <span>{formData.telefoneCelular}</span>
                </p>
              )}
              {formData.whatsapp && (
                <p className="flex justify-between">
                  <span className="font-semibold text-gray-600">WhatsApp:</span>
                  <span>{formData.whatsapp}</span>
                </p>
              )}
              
              {/* Endereço */}
              <p className="flex justify-between">
                <span className="font-semibold text-gray-600">CEP:</span>
                <span>{formData.cep}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold text-gray-600">Endereço:</span>
                <span>{`${formData.endereco}, ${formData.numero}`}</span>
              </p>
              {formData.complemento && (
                <p className="flex justify-between">
                  <span className="font-semibold text-gray-600">Complemento:</span>
                  <span>{formData.complemento}</span>
                </p>
              )}
              <p className="flex justify-between">
                <span className="font-semibold text-gray-600">Bairro:</span>
                <span>{formData.bairro}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold text-gray-600">Cidade:</span>
                <span>{formData.cidade}</span>
              </p>
              <p className="flex justify-between">
                <span className="font-semibold text-gray-600">Estado:</span>
                <span>{formData.estado}</span>
              </p>
            </div>
            <div className="flex justify-between mt-8">
              <button
                className={`${buttonClass} bg-gray-500 hover:bg-gray-600`}
                onClick={etapaAnterior}
                disabled={loading}
              >
                Anterior
              </button>
              <button
                className={buttonSendClass}
                onClick={enviarFormulario}
                disabled={loading}
              >
                {loading ? "Cadastrando..." : "Confirmar Cadastro"}
              </button>
            </div>
          </div>
        );
      default:
        return <p>Etapa desconhecida</p>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-50 p-6 flex items-center justify-center">
      {renderEtapa()}
    </div>
  );
}

export default Cadastro;