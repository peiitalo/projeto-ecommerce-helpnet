import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { FaUser, FaBuilding, FaEnvelope, FaLock, FaMapMarkerAlt, FaPhone, FaIdCard, FaCity, FaWhatsapp } from 'react-icons/fa';
import { FiArrowRight, FiArrowLeft, FiCheckCircle, FiLoader, FiEye, FiEyeOff } from 'react-icons/fi';
import { InputMask } from '@react-input/mask';

// Componente para a barra de progresso (agora responsiva)
const IndicadorEtapa = ({ etapaAtual, etapas }) => (
  <aside className="w-full md:w-1/3 lg:w-1/4 p-6 md:p-8 bg-white md:bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-200">
    <div className="md:sticky md:top-8">
      <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mb-2">Criar Conta</h1>
      <p className="text-slate-500 mb-8 hidden md:block">Siga os passos para se juntar a nós.</p>
      <nav>
        {/* Layout para Desktop */}
        <ul className="hidden md:block">
          {etapas.map((etapa, index) => (
            <li key={index} className="mb-6">
              <div className={`flex items-center transition-all duration-300 ${etapaAtual === index + 1 ? 'text-blue-600' : 'text-slate-400'}`}>
                <div className={`w-10 h-10 rounded-full border-2 flex items-center justify-center mr-4 ${etapaAtual >= index + 1 ? 'border-blue-600 bg-blue-600 text-white' : 'border-slate-300'}`}>
                  {etapaAtual > index + 1 ? <FiCheckCircle /> : etapa.icon}
                </div>
                <div>
                  <p className="text-xs uppercase font-semibold">Passo {index + 1}</p>
                  <p className="font-bold text-lg text-slate-700">{etapa.name}</p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {/* Layout para Mobile */}
        <div className="md:hidden flex items-center justify-between">
          <p className="font-bold text-slate-700">{etapas[etapaAtual - 1].name}</p>
          <p className="text-sm text-slate-500">Passo {etapaAtual} de {etapas.length}</p>
        </div>
      </nav>
    </div>
  </aside>
);

// Componente para a tela de seleção inicial
const SelecaoTipo = ({ onSelecionar }) => (
  <div className="w-full min-h-screen flex flex-col items-center justify-center text-center p-6 bg-slate-50 animate-fade-in">
    <h2 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
      Vamos Começar
    </h2>
    <p className="text-slate-500 mb-12 max-w-md">Para começar, selecione o tipo de conta que você deseja criar.</p>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
      <button
        onClick={() => onSelecionar("fisica")}
        className="group p-8 bg-white rounded-2xl shadow-lg border border-transparent hover:border-blue-500 hover:scale-105 transition-all duration-300"
      >
        <FaUser className="text-5xl text-blue-500 mx-auto mb-4 transition-colors" />
        <h3 className="text-2xl font-bold text-slate-800">Pessoa Física</h3>
        <p className="text-slate-500">Para contas pessoais e autônomas.</p>
      </button>
      <button
        onClick={() => onSelecionar("juridica")}
        className="group p-8 bg-white rounded-2xl shadow-lg border border-transparent hover:border-blue-500 hover:scale-105 transition-all duration-300"
      >
        <FaBuilding className="text-5xl text-blue-500 mx-auto mb-4 transition-colors" />
        <h3 className="text-2xl font-bold text-slate-800">Pessoa Jurídica</h3>
        <p className="text-slate-500">Para empresas e organizações.</p>
      </button>
    </div>
    {/* --- BOTÃO DE LOGIN ADICIONADO AQUI --- */}
    <div className="mt-12 text-center">
        <p className="text-slate-500">
            Já possui uma conta?{' '}
            <Link
                to="/login"
                className="font-semibold text-blue-600 hover:underline focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 rounded"
            >
                Faça Login
            </Link>
        </p>
    </div>
  </div>
);

// Nova tela de sucesso para exibir o código do cliente
const TelaSucesso = ({ codigoCliente }) => (
  <div className="w-full min-h-screen flex flex-col items-center justify-center text-center p-6 bg-slate-50 animate-fade-in">
    <FiCheckCircle className="text-7xl text-green-500 mb-6" />
    <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-800">
      Cadastro Realizado!
    </h2>
    <p className="text-slate-500 mb-8 max-w-md">Sua conta foi criada com sucesso. Guarde seu código de cliente em um local seguro.</p>
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
      <p className="text-slate-500 text-sm uppercase">Seu Código de Cliente</p>
      <p className="text-4xl font-mono font-bold text-blue-600 tracking-widest my-2">
        {codigoCliente}
      </p>
    </div>
    {/* --- BOTÃO "CONCLUIR" ATUALIZADO PARA "IR PARA LOGIN" --- */}
    <Link
      to="/login"
      className="mt-12 px-8 py-3 rounded-lg font-semibold text-white bg-gradient-to-r from-blue-600 to-sky-500 shadow-md hover:shadow-lg hover:scale-105 transition-all duration-300 inline-block"
    >
      Ir para Login
    </Link>
  </div>
);

function Cadastro() {
  const [tipoPessoa, setTipoPessoa] = useState("");
  const [etapaAtual, setEtapaAtual] = useState(1);
  const [dadosFormulario, setDadosFormulario] = useState({
    nome: "",
    email: "",
    senha: "",
    telefoneFixo: "",
    telefoneCelular: "",
    whatsapp: "",
    cpf: "",
    cnpj: "",
    razaoSocial: "",
    inscricaoEstadual: "",
    inscricaoMunicipal: "",
    endereco: "",
    numero: "",
    complemento: "",
    bairro: "",
    cidade: "",
    estado: "",
    cep: "",
    codigoIBGE: "",
    dataNascimento: "", // Adicionado para evitar erro no input de data
  });

  const [erros, setErros] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const [carregandoCep, setCarregandoCep] = useState(false);
  const [animacao, setAnimacao] = useState(false);
  const [mostrarSenha, setMostrarSenha] = useState(false);
  const [novoCodigoCliente, setNovoCodigoCliente] = useState(null);
  const [mostrarRegras, setMostrarRegras] = useState(false);
  const [temComprimento, setTemComprimento] = useState(false);
  const [temMaiuscula, setTemMaiuscula] = useState(false);
  const [temMinuscula, setTemMinuscula] = useState(false);
  const [temNumero, setTemNumero] = useState(false);
  const [temEspecial, setTemEspecial] = useState(false);

  useEffect(() => {
    setAnimacao(true);
    const timer = setTimeout(() => setAnimacao(false), 500);
    return () => clearTimeout(timer);
  }, [etapaAtual]);

  useEffect(() => {
    const senha = dadosFormulario.senha;
    setTemComprimento(senha.length >= 8);
    setTemMaiuscula(/[A-Z]/.test(senha));
    setTemMinuscula(/[a-z]/.test(senha));
    setTemNumero(/\d/.test(senha));
    setTemEspecial(/[^A-Za-z0-9]/.test(senha));
  }, [dadosFormulario.senha]);

  const proximaEtapa = () => {
    setErros([]); // Limpar erros ao avançar
    setEtapaAtual((prev) => prev + 1);
  };
  const etapaAnterior = () => {
    setErros([]); // Limpar erros ao voltar
    setEtapaAtual((prev) => prev - 1);
  };

  const buscarCep = async (cep) => {
    const cepLimpo = cep.replace(/\D/g, '');
    if (cepLimpo.length !== 8) return;

    setCarregandoCep(true);
    setErros([]);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cepLimpo}/json/`);
      const data = await response.json();
      if (data.erro) {
        setErros(["CEP não encontrado."]);
      } else {
        setDadosFormulario((prev) => ({
          ...prev,
          endereco: data.logradouro,
          bairro: data.bairro,
          cidade: data.localidade,
          estado: data.uf,
        }));
      }
    } catch (error) {
      setErros(["Erro ao buscar CEP."]);
    } finally {
      setCarregandoCep(false);
    }
  };

  // --- Funções de Máscara ---
  const mascararCPF = (value) => value.replace(/\D/g, '').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d{1,2})$/, '$1-$2');
  const mascararCNPJ = (value) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1.$2').replace(/(\d{3})(\d)/, '$1/$2').replace(/(\d{4})(\d{1,2})$/, '$1-$2');
  const mascararTelefone = (value) => value.replace(/\D/g, '').replace(/(\d{2})(\d)/, '($1) $2').replace(/(\d{5})(\d)/, '$1-$2').replace(/(-\d{4})\d+?$/, '$1');
  const mascararCEP = (value) => value.replace(/\D/g, '').replace(/(\d{5})(\d)/, '$1-$2');

  const lidarComAlteracao = (e) => {
    const { name, value } = e.target;
    let maskedValue = value;

    if (name === 'cpf') maskedValue = mascararCPF(value);
    else if (name === 'cnpj') maskedValue = mascararCNPJ(value);
    else if (name === 'cep') maskedValue = mascararCEP(value);
    else if (['telefoneCelular', 'whatsapp', 'telefoneFixo'].includes(name)) maskedValue = mascararTelefone(value);

    setDadosFormulario(prev => ({ ...prev, [name]: maskedValue }));

    if (name === 'cep') {
      buscarCep(value);
    }
  };

  const enviarFormulario = async () => {
    setCarregando(true);
    setErros([]);
    
    const payload = {
      NomeCompleto: tipoPessoa === "fisica" ? dadosFormulario.nome : dadosFormulario.razaoSocial,
      TipoPessoa: tipoPessoa === "fisica" ? "Física" : "Jurídica",
      CPF_CNPJ: tipoPessoa === "fisica" ? dadosFormulario.cpf : dadosFormulario.cnpj,
      Email: dadosFormulario.email,
      senha: dadosFormulario.senha,
      RazaoSocial: tipoPessoa === "juridica" ? dadosFormulario.razaoSocial : null,
      TelefoneFixo: dadosFormulario.telefoneFixo,
      TelefoneCelular: dadosFormulario.telefoneCelular,
      Whatsapp: dadosFormulario.whatsapp,
      InscricaoEstadual: dadosFormulario.inscricaoEstadual,
      InscricaoMunicipal: dadosFormulario.inscricaoMunicipal,
      Endereco: dadosFormulario.endereco,
      Numero: dadosFormulario.numero,
      Complemento: dadosFormulario.complemento,
      Bairro: dadosFormulario.bairro,
      Cidade: dadosFormulario.cidade,
      Estado: dadosFormulario.estado,
      CEP: dadosFormulario.cep,
      CodigoIBGE: dadosFormulario.codigoIBGE,
      // DataNascimento: dadosFormulario.dataNascimento, // Pode adicionar ao payload se necessário
    };

    try {
      const response = await fetch("http://localhost:3001/clientes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.errors?.join('\n') || 'Erro ao cadastrar');
      }

      // Define o código do cliente para exibir a tela de sucesso
      setNovoCodigoCliente(data.data.CodigoCliente);
      
    } catch (error) {
      setErros(Array.isArray(error.message.split('\n')) 
        ? error.message.split('\n') 
        : [error.message]);
    } finally {
      setCarregando(false);
    }
  };

  const lidarComFocoSenha = () => {
    setMostrarRegras(true);
  };

  const lidarComDesfocoSenha = () => {
    setMostrarRegras(false);
  };

  const etapas = [
    { name: "Identificação", icon: <FaIdCard /> },
    { name: "Contato", icon: <FaPhone /> },
    { name: "Endereço", icon: <FaMapMarkerAlt /> },
    { name: "Revisão", icon: <FiCheckCircle /> },
  ];

  // --- Estilos ---
  const classeGrupoInput = "relative mb-6";

  const classeInput = "w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-lg shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300";

  const classeIconeInput = "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400";

  const classeBotao = "px-6 py-3 rounded-lg font-semibold text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center gap-2";

  const classeBotaoPrimario = `${classeBotao} bg-gradient-to-r from-blue-600 to-sky-500`;
  
  const classeBotaoSecundario = `${classeBotao} bg-slate-500 hover:bg-slate-600`;

  const renderizarConteudoFormulario = () => {
    const classeAnimacao = animacao ? 'animate-fade-in' : '';
    switch (etapaAtual) {
      case 1: // Identificação
        return (
          <div className={classeAnimacao}>
            <h2 className="text-3xl font-bold mb-8 text-slate-800">{tipoPessoa === "fisica" ? "Seus Dados" : "Dados da Empresa"}</h2>
            {tipoPessoa === "fisica" ? (
              <>
                <div className={classeGrupoInput}><FaUser className={classeIconeInput} /><input className={classeInput} name="nome" placeholder="Nome Completo" value={dadosFormulario.nome} onChange={lidarComAlteracao} /></div>
                <div className={classeGrupoInput}><FaIdCard className={classeIconeInput} /><input className={classeInput} name="cpf" placeholder="CPF" value={dadosFormulario.cpf} onChange={lidarComAlteracao} maxLength="14" /></div>
                <div className={classeGrupoInput}><FaIdCard className={classeIconeInput} /><input type="date" className={classeInput} name="dataNascimento" placeholder="Data de Nascimento" value={dadosFormulario.dataNascimento} onChange={lidarComAlteracao} /></div>
              </>
            ) : (
              <>
                <div className={classeGrupoInput}><FaBuilding className={classeIconeInput} /><input className={classeInput} name="razaoSocial" placeholder="Razão Social" value={dadosFormulario.razaoSocial} onChange={lidarComAlteracao} /></div>
                <div className={classeGrupoInput}><FaIdCard className={classeIconeInput} /><input className={classeInput} name="cnpj" placeholder="CNPJ" value={dadosFormulario.cnpj} onChange={lidarComAlteracao} maxLength="18" /></div>
                <div className={classeGrupoInput}><FaIdCard className={classeIconeInput} /><input className={classeInput} name="inscricaoEstadual" placeholder="Inscrição Estadual (Opcional)" value={dadosFormulario.inscricaoEstadual} onChange={lidarComAlteracao} /></div>
                <div className={classeGrupoInput}><FaIdCard className={classeIconeInput} /><input className={classeInput} name="inscricaoMunicipal" placeholder="Inscrição Municipal (Opcional)" value={dadosFormulario.inscricaoMunicipal} onChange={lidarComAlteracao} /></div>
              </>
            )}
          </div>
        );
      case 2: // Contato
        return (
          <div className={classeAnimacao}>
            <h2 className="text-3xl font-bold mb-8 text-slate-800">Informações de Contato</h2>
            <div className={classeGrupoInput}><FaEnvelope className={classeIconeInput} /><input className={classeInput} type="email" name="email" placeholder="Seu melhor e-mail" value={dadosFormulario.email} onChange={lidarComAlteracao} /></div>
            <div className={`${classeGrupoInput} relative`}>
              <FaLock className={classeIconeInput} />
              <input 
                className={`${classeInput} pr-12`} 
                type={mostrarSenha ? "text" : "password"} 
                name="senha" 
                placeholder="Crie uma senha segura" 
                value={dadosFormulario.senha} 
                onChange={lidarComAlteracao} 
                onFocus={lidarComFocoSenha}
                onBlur={lidarComDesfocoSenha}
                aria-describedby="password-rules-tooltip"
              />
              <button type="button" onClick={() => setMostrarSenha(!mostrarSenha)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-blue-600 z-10">
                {mostrarSenha ? <FiEyeOff /> : <FiEye />}
              </button>

              {mostrarRegras && (
                <>
                  {/* Desktop / larger screens: tooltip flutuante à direita */}
                  <div id="password-rules-tooltip" className="absolute left-full top-1/2 -translate-y-1/2 ml-4 w-80 z-50 hidden md:block">
                    <div style={{ position: 'relative' }}>
                      <div style={{ position: 'absolute', left: '-8px', top: '50%', transform: 'translateY(-50%) rotate(45deg)', width: '16px', height: '16px', background: '#fff', borderTop: '1px solid #e2e8f0', borderLeft: '1px solid #e2e8f0' }} />
                      <div className="bg-white border border-slate-200 shadow-lg rounded-lg p-3">
                        <h4 className="text-sm font-semibold mb-2 text-slate-800">Regras para criar uma senha</h4>
                        <ul className="text-xs text-slate-600 space-y-1">
                          <li className="flex items-center gap-2">
                            <FiCheckCircle className={temComprimento ? 'text-green-500' : 'text-slate-400'} />
                            Pelo menos 8 caracteres
                          </li>
                          <li className="flex items-center gap-2">
                            <FiCheckCircle className={temMaiuscula ? 'text-green-500' : 'text-slate-400'} />
                            Ao menos uma letra maiúscula
                          </li>
                          <li className="flex items-center gap-2">
                            <FiCheckCircle className={temMinuscula ? 'text-green-500' : 'text-slate-400'} />
                            Ao menos uma letra minúscula
                          </li>
                          <li className="flex items-center gap-2">
                            <FiCheckCircle className={temNumero ? 'text-green-500' : 'text-slate-400'} />
                            Ao menos um número
                          </li>
                          <li className="flex items-center gap-2">
                            <FiCheckCircle className={temEspecial ? 'text-green-500' : 'text-slate-400'} />
                            Ao menos um caractere especial
                          </li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Mobile / small screens: bloco abaixo do input */}
                  <div className="block md:hidden mt-2 w-full">
                    <div className="bg-white border border-slate-200 shadow rounded-lg p-3">
                      <h4 className="text-sm font-semibold mb-2 text-slate-800">Regras para criar uma senha</h4>
                      <ul className="text-xs text-slate-600 space-y-1">
                        <li className="flex items-center gap-2">
                          <FiCheckCircle className={temComprimento ? 'text-green-500' : 'text-slate-400'} />
                          Pelo menos 8 caracteres
                        </li>
                        <li className="flex items-center gap-2">
                          <FiCheckCircle className={temMaiuscula ? 'text-green-500' : 'text-slate-400'} />
                          Ao menos uma letra maiúscula
                        </li>
                        <li className="flex items-center gap-2">
                          <FiCheckCircle className={temMinuscula ? 'text-green-500' : 'text-slate-400'} />
                          Ao menos uma letra minúscula
                        </li>
                        <li className="flex items-center gap-2">
                          <FiCheckCircle className={temNumero ? 'text-green-500' : 'text-slate-400'} />
                          Ao menos um número
                        </li>
                        <li className="flex items-center gap-2">
                          <FiCheckCircle className={temEspecial ? 'text-green-500' : 'text-slate-400'} />
                          Ao menos um caractere especial
                        </li>
                      </ul>
                    </div>
                  </div>
                </>
              )}
            </div>
            <div className={classeGrupoInput}><FaPhone className={classeIconeInput} /><input className={classeInput} type="tel" name="telefoneFixo" placeholder="Telefone Fixo (Opcional)" value={dadosFormulario.telefoneFixo} onChange={lidarComAlteracao} maxLength="15" /></div>
            <div className={classeGrupoInput}><FaPhone className={classeIconeInput} /><input className={classeInput} type="tel" name="telefoneCelular" placeholder="Celular com DDD" value={dadosFormulario.telefoneCelular} onChange={lidarComAlteracao} maxLength="15" /></div>
            <div className={classeGrupoInput}><FaWhatsapp className={classeIconeInput} /><input className={classeInput} type="tel" name="whatsapp" placeholder="WhatsApp (Opcional)" value={dadosFormulario.whatsapp} onChange={lidarComAlteracao} maxLength="15" /></div>
          </div>
        );
      case 3: // Endereço
        return (
          <div className={classeAnimacao}>
            <h2 className="text-3xl font-bold mb-8 text-slate-800">Endereço de Entrega</h2>
            <div className={classeGrupoInput}>
              <FaMapMarkerAlt className={classeIconeInput} />
              <InputMask
                mask="_____-___"
                replacement={{ _: /\d/ }}
                value={dadosFormulario.cep}
                onChange={lidarComAlteracao}
                name="cep"
                className={classeInput}
                placeholder="CEP"
              />
              {carregandoCep && <FiLoader className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-500" />}
            </div>
            <div className={classeGrupoInput}><FaMapMarkerAlt className={classeIconeInput} /><input className={classeInput} name="endereco" placeholder="Endereço" value={dadosFormulario.endereco} onChange={lidarComAlteracao} disabled={carregandoCep} /></div>
            <div className="grid grid-cols-2 gap-4">
              <div className={classeGrupoInput}><FaMapMarkerAlt className={classeIconeInput} /><input className={classeInput} name="numero" placeholder="Número" value={dadosFormulario.numero} onChange={lidarComAlteracao} /></div>
              <div className={classeGrupoInput}><FaMapMarkerAlt className={classeIconeInput} /><input className={classeInput} name="complemento" placeholder="Complemento" value={dadosFormulario.complemento} onChange={lidarComAlteracao} /></div>
            </div>
            <div className={classeGrupoInput}><FaMapMarkerAlt className={classeIconeInput} /><input className={classeInput} name="bairro" placeholder="Bairro" value={dadosFormulario.bairro} onChange={lidarComAlteracao} disabled={carregandoCep} /></div>
            <div className="grid grid-cols-3 gap-4">
              <div className={`${classeGrupoInput} col-span-2`}><FaCity className={classeIconeInput} /><input className={classeInput} name="cidade" placeholder="Cidade" value={dadosFormulario.cidade} onChange={lidarComAlteracao} disabled={carregandoCep} /></div>
              <div className={classeGrupoInput}><FaCity className={classeIconeInput} /><input className={classeInput} name="estado" placeholder="UF" value={dadosFormulario.estado} onChange={lidarComAlteracao} disabled={carregandoCep} /></div>
            </div>
            <div className={classeGrupoInput}><FaIdCard className={classeIconeInput} /><input className={classeInput} name="codigoIBGE" placeholder="Código IBGE (Opcional)" value={dadosFormulario.codigoIBGE} onChange={lidarComAlteracao} maxLength="7" /></div>
          </div>
        );
      case 4: // Revisão
        return (
          <div className={classeAnimacao}>
            <h2 className="text-3xl font-bold mb-8 text-slate-800">Revise seus Dados</h2>
            <div className="bg-slate-100 p-6 rounded-xl space-y-3 text-sm">
              {/* Dados Pessoais/Empresa */}
              <h3 className="font-bold text-slate-700 border-b pb-2 mb-2">Identificação</h3>
              {tipoPessoa === "fisica" ? (
                <>
                  <p className="flex justify-between"><span className="font-semibold text-slate-600">Nome:</span><span>{dadosFormulario.nome}</span></p>
                  <p className="flex justify-between"><span className="font-semibold text-slate-600">CPF:</span><span>{dadosFormulario.cpf}</span></p>
                </>
              ) : (
                <>
                  <p className="flex justify-between"><span className="font-semibold text-slate-600">Razão Social:</span><span>{dadosFormulario.razaoSocial}</span></p>
                  <p className="flex justify-between"><span className="font-semibold text-slate-600">CNPJ:</span><span>{dadosFormulario.cnpj}</span></p>
                </>
              )}
              {/* Contatos */}
              <h3 className="font-bold text-slate-700 border-b pb-2 mb-2 pt-4">Contato</h3>
              <p className="flex justify-between"><span className="font-semibold text-slate-600">Email:</span><span>{dadosFormulario.email}</span></p>
              <p className="flex justify-between"><span className="font-semibold text-slate-600">Celular:</span><span>{dadosFormulario.telefoneCelular}</span></p>
              {/* Endereço */}
              <h3 className="font-bold text-slate-700 border-b pb-2 mb-2 pt-4">Endereço</h3>
              <p className="flex justify-between"><span className="font-semibold text-slate-600">Endereço:</span><span>{`${dadosFormulario.endereco}, ${dadosFormulario.numero}`}</span></p>
              <p className="flex justify-between"><span className="font-semibold text-slate-600">Bairro:</span><span>{dadosFormulario.bairro}</span></p>
              <p className="flex justify-between"><span className="font-semibold text-slate-600">Cidade/UF:</span><span>{`${dadosFormulario.cidade} / ${dadosFormulario.estado}`}</span></p>
              <p className="flex justify-between"><span className="font-semibold text-slate-600">CEP:</span><span>{dadosFormulario.cep}</span></p>
              {dadosFormulario.codigoIBGE && (
                <p className="flex justify-between"><span className="font-semibold text-slate-600">Código IBGE:</span><span>{dadosFormulario.codigoIBGE}</span></p>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  // Lógica de renderização principal
  if (novoCodigoCliente) {
    return <TelaSucesso codigoCliente={novoCodigoCliente} />;
  }

  if (!tipoPessoa) {
    return <SelecaoTipo onSelecionar={setTipoPessoa} />;
  }

  return (
    <main className="min-h-screen bg-white text-slate-800 font-sans">
      <div className="flex flex-col md:flex-row min-h-screen">
        <IndicadorEtapa etapaAtual={etapaAtual} etapas={etapas} />
        <div className="w-full p-6 md:p-16 flex flex-col justify-center bg-slate-50"><div className="w-full max-w-lg mx-auto">
            {renderizarConteudoFormulario()}
            
            {/* Exibição de erros */}
            {erros.length > 0 && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-red-800 font-semibold mb-2">Corrija os seguintes erros:</h4>
                <ul className="text-red-700 text-sm space-y-1">
                  {erros.map((erro, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{erro}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            <div className="flex flex-col-reverse sm:flex-row sm:justify-between mt-12 gap-4">
              <button className={classeBotaoSecundario} onClick={etapaAtual === 1 ? () => setTipoPessoa("") : etapaAnterior} disabled={carregando}>
                <FiArrowLeft /> {etapaAtual === 1 ? "Trocar Tipo" : "Anterior"}
              </button>
              {etapaAtual < etapas.length ? (
                <button className={classeBotaoPrimario} onClick={proximaEtapa} disabled={carregando}>
                  Próxima <FiArrowRight />
                </button> 
              ) : (
                <button className={`${classeBotao} bg-green-600`} onClick={enviarFormulario} disabled={carregando}>
                  {carregando ? <FiLoader className="animate-spin" /> : <FiCheckCircle />}
                  Finalizar Cadastro
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}

export default Cadastro;
