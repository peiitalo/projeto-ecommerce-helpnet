import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  FaUser,
  FaBuilding,
  FaEnvelope,
  FaMapMarkerAlt,
  FaPhone,
  FaIdCard,
  FaCity,
  FaWhatsapp,
  FaLock,
} from "react-icons/fa";
import {
  FiArrowRight,
  FiArrowLeft,
  FiCheckCircle,
  FiLoader,
} from "react-icons/fi";
import { InputMask } from "@react-input/mask";
import InputSenha from "../components/cadastro/InputSenha";
import InputConfirmarSenha from "../components/cadastro/InputConfirmarSenha";
import {
  mascararCPF,
  mascararCNPJ,
  mascararTelefone,
  mascararCEP,
} from "../utils/mascaras";
import {
  validatePassword,
  validateDocument,
  validateEmail,
  validateCEP,
  validateCodigoIBGE,
} from "../utils/validations";
import { useBuscarCep } from "../hooks/useBuscarCep";
import { criarCliente } from "../services/clientesApi";

const IndicadorEtapa = ({ etapaAtual, etapas }) => (
  <aside className="w-full md:w-1/3 lg:w-1/4 p-4 sm:p-6 md:p-8 bg-white md:bg-slate-50/50 border-b md:border-b-0 md:border-r border-slate-200">
    <div className="md:sticky md:top-8">
      <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-800 mb-2">
        Criar Conta
      </h1>
      <p className="text-slate-500 mb-6 md:mb-8 hidden md:block">
        Siga os passos para se juntar a nós.
      </p>
      <nav>
        {/* Layout para Desktop */}
        <ul className="hidden md:block">
          {etapas.map((etapa, index) => (
            <li key={index} className="mb-4 lg:mb-6">
              <div
                className={`flex items-center transition-all duration-300 ${
                  etapaAtual === index + 1 ? "text-blue-600" : "text-slate-400"
                }`}
              >
                <div
                  className={`w-8 h-8 lg:w-10 lg:h-10 rounded-full border-2 flex items-center justify-center mr-3 lg:mr-4 text-sm lg:text-base ${
                    etapaAtual >= index + 1
                      ? "border-blue-600 bg-blue-600 text-white"
                      : "border-slate-300"
                  }`}
                >
                  {etapaAtual > index + 1 ? <FiCheckCircle /> : etapa.icon}
                </div>
                <div>
                  <p className="text-xs uppercase font-semibold">
                    Passo {index + 1}
                  </p>
                  <p className="font-bold text-base lg:text-lg text-slate-700">
                    {etapa.name}
                  </p>
                </div>
              </div>
            </li>
          ))}
        </ul>
        {/* Layout para Mobile */}
        <div className="md:hidden">
          <div className="flex items-center justify-between mb-4">
            <p className="font-bold text-slate-700 text-base sm:text-lg">
              {etapas[etapaAtual - 1].name}
            </p>
            <p className="text-xs sm:text-sm text-slate-500">
              Passo {etapaAtual} de {etapas.length}
            </p>
          </div>
          {/* Barra de progresso mobile */}
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-blue-600 to-sky-500 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(etapaAtual / etapas.length) * 100}%` }}
            ></div>
          </div>
        </div>
      </nav>
    </div>
  </aside>
);

const SelecaoTipo = ({ onSelecionar }) => (
  <div className="w-full min-h-screen flex flex-col items-center justify-center text-center p-4 sm:p-6 bg-slate-50 animate-fade-in">
    <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-sky-500 bg-clip-text text-transparent">
      Vamos Começar
    </h2>
    <p className="text-slate-500 mb-8 sm:mb-12 max-w-md text-sm sm:text-base">
      Para começar, selecione o tipo de conta que você deseja criar.
    </p>
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 w-full max-w-2xl">
      <button
        onClick={() => onSelecionar("fisica")}
        className="group p-6 sm:p-8 bg-white rounded-2xl shadow-lg border border-transparent hover:border-blue-500 hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      >
        <FaUser className="text-4xl sm:text-5xl text-blue-500 mx-auto mb-4 transition-colors" />
        <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
          Pessoa Física
        </h3>
        <p className="text-slate-500 text-sm sm:text-base">
          Para contas pessoais e autônomas.
        </p>
      </button>
      <button
        onClick={() => onSelecionar("juridica")}
        className="group p-6 sm:p-8 bg-white rounded-2xl shadow-lg border border-transparent hover:border-blue-500 hover:scale-105 active:scale-95 transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2"
      >
        <FaBuilding className="text-4xl sm:text-5xl text-blue-500 mx-auto mb-4 transition-colors" />
        <h3 className="text-xl sm:text-2xl font-bold text-slate-800 mb-2">
          Pessoa Jurídica
        </h3>
        <p className="text-slate-500 text-sm sm:text-base">
          Para empresas e organizações.
        </p>
      </button>
    </div>
    <div className="mt-8 sm:mt-12 text-center">
      <p className="text-slate-500 text-sm sm:text-base">
        Já possui uma conta?{" "}
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

const TelaSucesso = ({ codigoCliente }) => (
  <div className="w-full min-h-screen flex flex-col items-center justify-center text-center p-6 bg-slate-50 animate-fade-in">
    <FiCheckCircle className="text-7xl text-green-500 mb-6" />
    <h2 className="text-4xl md:text-5xl font-bold mb-4 text-slate-800">
      Cadastro Realizado!
    </h2>
    <p className="text-slate-500 mb-8 max-w-md">
      Sua conta foi criada com sucesso. Guarde seu código de cliente em um local
      seguro.
    </p>
    <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
      <p className="text-slate-500 text-sm uppercase">Seu Código de Cliente</p>
      <p className="text-4xl font-mono font-bold text-blue-600 tracking-widest my-2">
        {codigoCliente}
      </p>
    </div>
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
    confirmarSenha: "",
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
    dataNascimento: "",
    enderecoCobranca: "",
    numeroCobranca: "",
    complementoCobranca: "",
    bairroCobranca: "",
    cidadeCobranca: "",
    estadoCobranca: "",
    cepCobranca: "",
    codigoIBGECobranca: "",
  });
  const [erros, setErros] = useState([]);
  const [carregando, setCarregando] = useState(false);
  const { buscarCep, carregandoCep } = useBuscarCep();
  const [animacao, setAnimacao] = useState(false);
  const [novoCodigoCliente, setNovoCodigoCliente] = useState(null);
  const [enderecoCobrancaIgualEntrega, setEnderecoCobrancaIgualEntrega] =
    useState(true);

  useEffect(() => {
    setAnimacao(true);
    const timer = setTimeout(() => setAnimacao(false), 500);
    return () => clearTimeout(timer);
  }, [etapaAtual]);

  const validarEtapa = () => {
    const errosValidacao = [];

    if (etapaAtual === 1) {
      if (tipoPessoa === "fisica") {
        if (!dadosFormulario.nome.trim())
          errosValidacao.push("Nome Completo é obrigatório.");
        if (!dadosFormulario.cpf.trim())
          errosValidacao.push("CPF é obrigatório.");
        else {
          const { isValid, errors } = validateDocument(
            dadosFormulario.cpf,
            "fisica"
          );
          if (!isValid) errosValidacao.push(...errors);
        }
      } else if (tipoPessoa === "juridica") {
        if (!dadosFormulario.razaoSocial.trim())
          errosValidacao.push("Razão Social é obrigatória.");
        if (!dadosFormulario.cnpj.trim())
          errosValidacao.push("CNPJ é obrigatório.");
        else {
          const { isValid, errors } = validateDocument(
            dadosFormulario.cnpj,
            "juridica"
          );
          if (!isValid) errosValidacao.push(...errors);
        }
      }
    } else if (etapaAtual === 2) {
      if (!dadosFormulario.email.trim())
        errosValidacao.push("Email é obrigatório.");
      else {
        const { isValid, errors } = validateEmail(dadosFormulario.email);
        if (!isValid) errosValidacao.push(...errors);
      }

      if (!dadosFormulario.senha.trim())
        errosValidacao.push("Senha é obrigatória.");
      else {
        const { isValid, errors } = validatePassword(dadosFormulario.senha);
        if (!isValid) errosValidacao.push(...errors);
      }

      if (dadosFormulario.senha !== dadosFormulario.confirmarSenha)
        errosValidacao.push("As senhas não coincidem.");

      if (!dadosFormulario.telefoneCelular.trim())
        errosValidacao.push("Celular com DDD é obrigatório.");

      if (!enderecoCobrancaIgualEntrega) {
        if (!dadosFormulario.cepCobranca.trim())
          errosValidacao.push("CEP do endereço de cobrança é obrigatório.");
        else {
          const { isValid, errors } = validateCEP(dadosFormulario.cepCobranca);
          if (!isValid) errosValidacao.push(...errors);
        }
        if (!dadosFormulario.enderecoCobranca.trim())
          errosValidacao.push("Endereço de cobrança é obrigatório.");
        if (!dadosFormulario.numeroCobranca.trim())
          errosValidacao.push("Número do endereço de cobrança é obrigatório.");
        if (!dadosFormulario.bairroCobranca.trim())
          errosValidacao.push("Bairro do endereço de cobrança é obrigatório.");
        if (!dadosFormulario.cidadeCobranca.trim())
          errosValidacao.push("Cidade do endereço de cobrança é obrigatória.");
        if (!dadosFormulario.estadoCobranca.trim())
          errosValidacao.push("Estado do endereço de cobrança é obrigatório.");
        if (dadosFormulario.codigoIBGECobranca.trim()) {
          const { isValid, errors } = validateCodigoIBGE(
            dadosFormulario.codigoIBGECobranca
          );
          if (!isValid) errosValidacao.push(...errors);
        }
      }
    } else if (etapaAtual === 3) {
      if (!dadosFormulario.cep.trim())
        errosValidacao.push("CEP é obrigatório.");
      else {
        const { isValid, errors } = validateCEP(dadosFormulario.cep);
        if (!isValid) errosValidacao.push(...errors);
      }

      if (!dadosFormulario.endereco.trim())
        errosValidacao.push("Endereço é obrigatório.");
      if (!dadosFormulario.numero.trim())
        errosValidacao.push("Número é obrigatório.");
      if (!dadosFormulario.bairro.trim())
        errosValidacao.push("Bairro é obrigatório.");
      if (!dadosFormulario.cidade.trim())
        errosValidacao.push("Cidade é obrigatória.");
      if (!dadosFormulario.estado.trim())
        errosValidacao.push("Estado é obrigatório.");

      if (dadosFormulario.codigoIBGE.trim()) {
        const { isValid, errors } = validateCodigoIBGE(
          dadosFormulario.codigoIBGE
        );
        if (!isValid) errosValidacao.push(...errors);
      }
    }
    if (errosValidacao.length > 0) {
      console.error("Erros de validação:", errosValidacao); // log dos erros de validação
    }
    return errosValidacao;
  };

  const proximaEtapa = () => {
    const errosValidacao = validarEtapa();
    if (errosValidacao.length > 0) {
      setErros(errosValidacao);
      return;
    }
    setErros([]);
    setEtapaAtual((prev) => prev + 1);
  };

  const etapaAnterior = () => {
    setErros([]);
    setEtapaAtual((prev) => prev - 1);
  };

  const lidarComAlteracao = async (e) => {
    const { name, value } = e.target;
    let valorMascarado = value;

    if (name === "cpf") valorMascarado = mascararCPF(value);
    else if (name === "cnpj") valorMascarado = mascararCNPJ(value);
    else if (name === "cep") valorMascarado = mascararCEP(value);
    else if (name === "cepCobranca") valorMascarado = mascararCEP(value);
    else if (["telefoneCelular", "whatsapp", "telefoneFixo"].includes(name))
      valorMascarado = mascararTelefone(value);

    setDadosFormulario((prev) => ({ ...prev, [name]: valorMascarado }));

    // Only trigger CEP search for CEP fields when they have the complete masked value
    if (name === "cep" && value.length === 9) { // CEP format: XXXXX-XXX = 9 characters
      const resultado = await buscarCep(value);
      if (resultado?.erro) {
        console.error("CEP não encontrado:", value); // log do CEP inválido
        setErros(["CEP não encontrado."]);
      } else if (resultado) {
        setErros([]);
        setDadosFormulario((prev) => ({
          ...prev,
          endereco: resultado.endereco,
          bairro: resultado.bairro,
          cidade: resultado.cidade,
          estado: resultado.estado,
        }));
      }
    }
    if (name === "cepCobranca" && value.length === 9) { // CEP format: XXXXX-XXX = 9 characters
      const resultado = await buscarCep(value);
      if (resultado?.erro) {
        console.error("CEP de cobrança não encontrado:", value); // log do CEP cobrança inválido
        setErros(["CEP de cobrança não encontrado."]);
      } else if (resultado) {
        setErros([]);
        setDadosFormulario((prev) => ({
          ...prev,
          enderecoCobranca: resultado.endereco,
          bairroCobranca: resultado.bairro,
          cidadeCobranca: resultado.cidade,
          estadoCobranca: resultado.estado,
        }));
      }
    }
  };

  const enviarFormulario = async () => {
    setCarregando(true);
    setErros([]);

    const dadosCliente = {
      NomeCompleto:
        tipoPessoa === "fisica"
          ? dadosFormulario.nome
          : dadosFormulario.razaoSocial,
      TipoPessoa: tipoPessoa === "fisica" ? "Física" : "Jurídica",
      CPF_CNPJ:
        tipoPessoa === "fisica" ? dadosFormulario.cpf : dadosFormulario.cnpj,
      Email: dadosFormulario.email,
      senha: dadosFormulario.senha,
      RazaoSocial:
        tipoPessoa === "juridica" ? dadosFormulario.razaoSocial : null,
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
      EnderecoCobranca: dadosFormulario.enderecoCobranca,
      NumeroCobranca: dadosFormulario.numeroCobranca,
      ComplementoCobranca: dadosFormulario.complementoCobranca,
      BairroCobranca: dadosFormulario.bairroCobranca,
      CidadeCobranca: dadosFormulario.cidadeCobranca,
      EstadoCobranca: dadosFormulario.estadoCobranca,
      CepCobranca: dadosFormulario.cepCobranca,
      CodigoIBGECobranca: dadosFormulario.codigoIBGECobranca,
      enderecoCobrancaIgualEntrega: enderecoCobrancaIgualEntrega,
    };

    try {
      const dados = await criarCliente(dadosCliente);
      setNovoCodigoCliente(dados.data.CodigoCliente);
    } catch (error) {
      console.error("Erro ao criar cliente:", error); // <-- log do erro completo
      setErros(
        Array.isArray(error.message.split("\n"))
          ? error.message.split("\n")
          : [error.message]
      );
    } finally {
      setCarregando(false);
    }
  };

  const etapas = [
    { name: "Identificação", icon: <FaIdCard /> },
    { name: "Contato", icon: <FaPhone /> },
    { name: "Endereço", icon: <FaMapMarkerAlt /> },
    { name: "Revisão", icon: <FiCheckCircle /> },
  ];

  const classeGrupoInput = "relative mb-6";

  const classeInput =
    "w-full pl-12 pr-4 py-3 bg-white border-2 border-slate-200 rounded-lg shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300";

  const classeIconeInput =
    "absolute left-4 top-1/2 -translate-y-1/2 text-slate-400";

  const classeBotao =
    "px-6 py-3 rounded-lg font-semibold text-white shadow-md hover:shadow-lg hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 transition-all duration-300 flex items-center justify-center gap-2";

  const classeBotaoPrimario = `${classeBotao} bg-gradient-to-r from-blue-600 to-sky-500`;

  const classeBotaoSecundario = `${classeBotao} bg-slate-500 hover:bg-slate-600`;

  const renderizarConteudoFormulario = () => {
    const classeAnimacao = animacao ? "animate-fade-in" : "";
    switch (etapaAtual) {
      case 1:
        return (
          <div className={classeAnimacao}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-slate-800">
              {tipoPessoa === "fisica" ? "Seus Dados" : "Dados da Empresa"}
            </h2>
            {tipoPessoa === "fisica" ? (
              <>
                <div className={classeGrupoInput}>
                  <FaUser className={classeIconeInput} />
                  <input
                    className={classeInput}
                    name="nome"
                    placeholder="Nome Completo"
                    value={dadosFormulario.nome}
                    onChange={lidarComAlteracao}
                  />
                </div>
                <div className={classeGrupoInput}>
                  <FaIdCard className={classeIconeInput} />
                  <input
                    className={classeInput}
                    name="cpf"
                    placeholder="CPF"
                    value={dadosFormulario.cpf}
                    onChange={lidarComAlteracao}
                    maxLength="14"
                  />
                </div>
              </>
            ) : (
              <>
                <div className={classeGrupoInput}>
                  <FaBuilding className={classeIconeInput} />
                  <input
                    className={classeInput}
                    name="razaoSocial"
                    placeholder="Razão Social"
                    value={dadosFormulario.razaoSocial}
                    onChange={lidarComAlteracao}
                  />
                </div>
                <div className={classeGrupoInput}>
                  <FaIdCard className={classeIconeInput} />
                  <input
                    className={classeInput}
                    name="cnpj"
                    placeholder="CNPJ"
                    value={dadosFormulario.cnpj}
                    onChange={lidarComAlteracao}
                    maxLength="18"
                  />
                </div>
                <div className={classeGrupoInput}>
                  <FaIdCard className={classeIconeInput} />
                  <input
                    className={classeInput}
                    name="inscricaoEstadual"
                    placeholder="Inscrição Estadual (Opcional)"
                    value={dadosFormulario.inscricaoEstadual}
                    onChange={lidarComAlteracao}
                  />
                </div>
                <div className={classeGrupoInput}>
                  <FaIdCard className={classeIconeInput} />
                  <input
                    className={classeInput}
                    name="inscricaoMunicipal"
                    placeholder="Inscrição Municipal (Opcional)"
                    value={dadosFormulario.inscricaoMunicipal}
                    onChange={lidarComAlteracao}
                  />
                </div>
              </>
            )}
          </div>
        );
      case 2:
        return (
          <div className={classeAnimacao}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-slate-800">
              Informações de Contato
            </h2>
            <div className={classeGrupoInput}>
              <FaEnvelope className={classeIconeInput} />
              <input
                className={classeInput}
                type="email"
                name="email"
                placeholder="Seu melhor e-mail"
                value={dadosFormulario.email}
                onChange={lidarComAlteracao}
              />
            </div>
            <InputSenha
              valor={dadosFormulario.senha}
              aoAlterar={lidarComAlteracao}
              classeInput={classeInput}
              classeIcone={classeIconeInput}
              classeGrupo={classeGrupoInput}
            />
            <InputConfirmarSenha
              classeGrupo={classeGrupoInput}
              classeIcone={classeIconeInput}
              classeInput={classeInput}
              valor={dadosFormulario.confirmarSenha}
              aoAlterar={lidarComAlteracao}
            />

            <div className={classeGrupoInput}>
              <FaPhone className={classeIconeInput} />
              <input
                className={classeInput}
                type="tel"
                name="telefoneFixo"
                placeholder="Telefone Fixo (Opcional)"
                value={dadosFormulario.telefoneFixo}
                onChange={lidarComAlteracao}
                maxLength="15"
              />
            </div>
            <div className={classeGrupoInput}>
              <FaPhone className={classeIconeInput} />
              <input
                className={classeInput}
                type="tel"
                name="telefoneCelular"
                placeholder="Celular com DDD"
                value={dadosFormulario.telefoneCelular}
                onChange={lidarComAlteracao}
                maxLength="15"
              />
            </div>
            <div className={classeGrupoInput}>
              <FaWhatsapp className={classeIconeInput} />
              <input
                className={classeInput}
                type="tel"
                name="whatsapp"
                placeholder="WhatsApp (Opcional)"
                value={dadosFormulario.whatsapp}
                onChange={lidarComAlteracao}
                maxLength="15"
              />
            </div>
          </div>
        );
      case 3:
        return (
          <div className={classeAnimacao}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-slate-800">
              Endereço de Entrega
            </h2>
            {/* Formulário endereço de entrega */}
            <div className={classeGrupoInput}>
              <FaMapMarkerAlt className={classeIconeInput} />
              <InputMask
                mask="99999-999"
                replacement={{ 9: /\d/ }}
                value={dadosFormulario.cep}
                onChange={lidarComAlteracao}
                name="cep"
                className={classeInput}
                placeholder="CEP"
              />
              {carregandoCep && (
                <FiLoader className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-500" />
              )}
            </div>
            <div className={classeGrupoInput}>
              <FaMapMarkerAlt className={classeIconeInput} />
              <input
                className={classeInput}
                name="endereco"
                placeholder="Endereço"
                value={dadosFormulario.endereco}
                onChange={lidarComAlteracao}
                disabled={carregandoCep}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className={classeGrupoInput}>
                <FaMapMarkerAlt className={classeIconeInput} />
                <input
                  className={classeInput}
                  name="numero"
                  placeholder="Número"
                  value={dadosFormulario.numero}
                  onChange={lidarComAlteracao}
                />
              </div>
              <div className={classeGrupoInput}>
                <FaMapMarkerAlt className={classeIconeInput} />
                <input
                  className={classeInput}
                  name="complemento"
                  placeholder="Complemento"
                  value={dadosFormulario.complemento}
                  onChange={lidarComAlteracao}
                />
              </div>
            </div>
            <div className={classeGrupoInput}>
              <FaMapMarkerAlt className={classeIconeInput} />
              <input
                className={classeInput}
                name="bairro"
                placeholder="Bairro"
                value={dadosFormulario.bairro}
                onChange={lidarComAlteracao}
                disabled={carregandoCep}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className={`${classeGrupoInput} sm:col-span-2`}>
                <FaCity className={classeIconeInput} />
                <input
                  className={classeInput}
                  name="cidade"
                  placeholder="Cidade"
                  value={dadosFormulario.cidade}
                  onChange={lidarComAlteracao}
                  disabled={carregandoCep}
                />
              </div>
              <div className={classeGrupoInput}>
                <FaCity className={classeIconeInput} />
                <input
                  className={classeInput}
                  name="estado"
                  placeholder="UF"
                  value={dadosFormulario.estado}
                  onChange={lidarComAlteracao}
                  disabled={carregandoCep}
                />
              </div>
            </div>
            <div className={classeGrupoInput}>
              <FaIdCard className={classeIconeInput} />
              <input
                className={classeInput}
                name="codigoIBGE"
                placeholder="Código IBGE (Opcional)"
                value={dadosFormulario.codigoIBGE}
                onChange={lidarComAlteracao}
                maxLength="7"
              />
            </div>

            {/* Checkbox para endereço de cobrança */}
            <label className="flex items-center gap-2 mb-4">
              <input
                type="checkbox"
                checked={enderecoCobrancaIgualEntrega}
                onChange={() =>
                  setEnderecoCobrancaIgualEntrega(!enderecoCobrancaIgualEntrega)
                }
                className="w-5 h-5"
              />
              <span>Este também será seu endereço de cobrança</span>
            </label>

            {/* Formulário endereço de cobrança, só aparece se checkbox desmarcada */}
            {!enderecoCobrancaIgualEntrega && (
              <>
                <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-slate-800">
                  Endereço de Cobrança
                </h2>
                <div className={classeGrupoInput}>
                  <FaMapMarkerAlt className={classeIconeInput} />
                  <InputMask
                    mask="99999-999"
                    replacement={{ 9: /\d/ }}
                    value={dadosFormulario.cepCobranca}
                    onChange={lidarComAlteracao}
                    name="cepCobranca"
                    className={classeInput}
                    placeholder="CEP"
                  />
                  {carregandoCep && (
                    <FiLoader className="absolute right-4 top-1/2 -translate-y-1/2 animate-spin text-blue-500" />
                  )}
                </div>
                <div className={classeGrupoInput}>
                  <FaMapMarkerAlt className={classeIconeInput} />
                  <input
                    className={classeInput}
                    name="enderecoCobranca"
                    placeholder="Endereço"
                    value={dadosFormulario.enderecoCobranca}
                    onChange={lidarComAlteracao}
                    disabled={carregandoCep}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className={classeGrupoInput}>
                    <FaMapMarkerAlt className={classeIconeInput} />
                    <input
                      className={classeInput}
                      name="numeroCobranca"
                      placeholder="Número"
                      value={dadosFormulario.numeroCobranca}
                      onChange={lidarComAlteracao}
                    />
                  </div>
                  <div className={classeGrupoInput}>
                    <FaMapMarkerAlt className={classeIconeInput} />
                    <input
                      className={classeInput}
                      name="complementoCobranca"
                      placeholder="Complemento"
                      value={dadosFormulario.complementoCobranca}
                      onChange={lidarComAlteracao}
                    />
                  </div>
                </div>
                <div className={classeGrupoInput}>
                  <FaMapMarkerAlt className={classeIconeInput} />
                  <input
                    className={classeInput}
                    name="bairroCobranca"
                    placeholder="Bairro"
                    value={dadosFormulario.bairroCobranca}
                    onChange={lidarComAlteracao}
                    disabled={carregandoCep}
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className={`${classeGrupoInput} sm:col-span-2`}>
                    <FaCity className={classeIconeInput} />
                    <input
                      className={classeInput}
                      name="cidadeCobranca"
                      placeholder="Cidade"
                      value={dadosFormulario.cidadeCobranca}
                      onChange={lidarComAlteracao}
                      disabled={carregandoCep}
                    />
                  </div>
                  <div className={classeGrupoInput}>
                    <FaCity className={classeIconeInput} />
                    <input
                      className={classeInput}
                      name="estadoCobranca"
                      placeholder="UF"
                      value={dadosFormulario.estadoCobranca}
                      onChange={lidarComAlteracao}
                      disabled={carregandoCep}
                    />
                  </div>
                </div>
                <div className={classeGrupoInput}>
                  <FaIdCard className={classeIconeInput} />
                  <input
                    className={classeInput}
                    name="codigoIBGECobranca"
                    placeholder="Código IBGE (Opcional)"
                    value={dadosFormulario.codigoIBGECobranca}
                    onChange={lidarComAlteracao}
                    maxLength="7"
                  />
                </div>
              </>
            )}
          </div>
        );
      case 4:
        return (
          <div className={classeAnimacao}>
            <h2 className="text-2xl sm:text-3xl font-bold mb-6 sm:mb-8 text-slate-800">
              Revise seus Dados
            </h2>
            <div className="bg-slate-100 p-4 sm:p-6 rounded-xl space-y-3 text-sm">
              {/* Dados Pessoais/Empresa */}
              <h3 className="font-bold text-slate-700 border-b pb-2 mb-2">
                Identificação
              </h3>
              {tipoPessoa === "fisica" ? (
                <>
                  <p className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="font-semibold text-slate-600">Nome:</span>
                    <span className="break-words">{dadosFormulario.nome}</span>
                  </p>
                  <p className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="font-semibold text-slate-600">CPF:</span>
                    <span>{dadosFormulario.cpf}</span>
                  </p>
                </>
              ) : (
                <>
                  <p className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="font-semibold text-slate-600">
                      Razão Social:
                    </span>
                    <span className="break-words">
                      {dadosFormulario.razaoSocial}
                    </span>
                  </p>
                  <p className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                    <span className="font-semibold text-slate-600">CNPJ:</span>
                    <span>{dadosFormulario.cnpj}</span>
                  </p>
                </>
              )}
              {/* Contatos */}
              <h3 className="font-bold text-slate-700 border-b pb-2 mb-2 pt-4">
                Contato
              </h3>
              <p className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="font-semibold text-slate-600">Email:</span>
                <span className="break-all">{dadosFormulario.email}</span>
              </p>
              <p className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="font-semibold text-slate-600">Celular:</span>
                <span>{dadosFormulario.telefoneCelular}</span>
              </p>
              {/* Endereço */}
              <h3 className="font-bold text-slate-700 border-b pb-2 mb-2 pt-4">
                Endereço
              </h3>
              <p className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="font-semibold text-slate-600">Endereço:</span>
                <span className="break-words">{`${dadosFormulario.endereco}, ${dadosFormulario.numero}`}</span>
              </p>
              <p className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="font-semibold text-slate-600">Bairro:</span>
                <span className="break-words">{dadosFormulario.bairro}</span>
              </p>
              <p className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="font-semibold text-slate-600">Cidade/UF:</span>
                <span className="break-words">{`${dadosFormulario.cidade} / ${dadosFormulario.estado}`}</span>
              </p>
              <p className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                <span className="font-semibold text-slate-600">CEP:</span>
                <span>{dadosFormulario.cep}</span>
              </p>
              {dadosFormulario.codigoIBGE && (
                <p className="flex flex-col sm:flex-row sm:justify-between gap-1 sm:gap-0">
                  <span className="font-semibold text-slate-600">
                    Código IBGE:
                  </span>
                  <span>{dadosFormulario.codigoIBGE}</span>
                </p>
              )}
            </div>
          </div>
        );
      default:
        return null;
    }
  };

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
        <div className="w-full p-6 md:p-16 flex flex-col justify-center bg-slate-50">
          <div className="w-full max-w-lg mx-auto">
            {renderizarConteudoFormulario()}

            {/* Exibição de erros */}
            {erros.length > 0 && (
              <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <h4 className="text-red-800 font-semibold mb-2">
                  Corrija os seguintes erros:
                </h4>
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
              <button
                className={classeBotaoSecundario}
                onClick={
                  etapaAtual === 1 ? () => setTipoPessoa("") : etapaAnterior
                }
                disabled={carregando}
              >
                <FiArrowLeft /> {etapaAtual === 1 ? "Trocar Tipo" : "Anterior"}
              </button>
              {etapaAtual < etapas.length ? (
                <button
                  className={classeBotaoPrimario}
                  onClick={proximaEtapa}
                  disabled={carregando}
                >
                  Próxima <FiArrowRight />
                </button>
              ) : (
                <button
                  className={`${classeBotao} bg-green-600`}
                  onClick={enviarFormulario}
                  disabled={carregando}
                >
                  {carregando ? (
                    <FiLoader className="animate-spin" />
                  ) : (
                    <FiCheckCircle />
                  )}
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
