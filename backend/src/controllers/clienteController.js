// backend/src/controllers/clienteController.js
import prisma from "../config/prisma.js";
import cryptoService from "../services/cryptoService.js";
import removerAcentos from "remove-accents";
import {
  validatePassword,
  validateDocument,
  validateEmail,
  validateCEP,
  validateCodigoIBGE,
} from "../utils/validators.js";
import { logControllerError, logger } from "../utils/logger.js";
import jwt from 'jsonwebtoken'

export const criarCliente = async (req, res) => {
  const {
    NomeCompleto,
    TipoPessoa,
    CPF_CNPJ,
    TelefoneFixo,
    TelefoneCelular,
    Whatsapp,
    Email,
    InscricaoEstadual,
    InscricaoMunicipal,
    RazaoSocial,
    senha,
    Endereco,
    Numero,
    Complemento,
    Bairro,
    Cidade,
    Estado,
    CEP,
    CodigoIBGE,
    EnderecoCobranca,
    NumeroCobranca,
    ComplementoCobranca,
    BairroCobranca,
    CidadeCobranca,
    EstadoCobranca,
    CepCobranca,
    CodigoIBGECobranca,
    enderecoCobrancaIgualEntrega,
  } = req.body;

  try {
    const errors = [];

    if (!NomeCompleto || NomeCompleto.trim() === "") errors.push("Nome completo é obrigatório");
    if (!Email || Email.trim() === "") errors.push("Email é obrigatório");
    if (!senha || senha.trim() === "") errors.push("Senha é obrigatória");
    if (!CPF_CNPJ || CPF_CNPJ.trim() === "") errors.push("CPF/CNPJ é obrigatório");
    if (!TipoPessoa || TipoPessoa.trim() === "") errors.push("Tipo de pessoa é obrigatório");
    if (!CEP || CEP.trim() === "") errors.push("CEP é obrigatório");
    if (!Endereco || Endereco.trim() === "") errors.push("Endereço é obrigatório");
    if (!Numero || Numero.trim() === "") errors.push("Número é obrigatório");
    if (!Bairro || Bairro.trim() === "") errors.push("Bairro é obrigatório");
    if (!Cidade || Cidade.trim() === "") errors.push("Cidade é obrigatória");
    if (!Estado || Estado.trim() === "") errors.push("Estado é obrigatório");

    if (!enderecoCobrancaIgualEntrega) {
      if (!CepCobranca || CepCobranca.trim() === "") errors.push("CEP do endereço de cobrança é obrigatório");
      if (!EnderecoCobranca || EnderecoCobranca.trim() === "") errors.push("Endereço de cobrança é obrigatório");
      if (!NumeroCobranca || NumeroCobranca.trim() === "") errors.push("Número do endereço de cobrança é obrigatório");
      if (!BairroCobranca || BairroCobranca.trim() === "") errors.push("Bairro do endereço de cobrança é obrigatório");
      if (!CidadeCobranca || CidadeCobranca.trim() === "") errors.push("Cidade do endereço de cobrança é obrigatória");
      if (!EstadoCobranca || EstadoCobranca.trim() === "") errors.push("Estado do endereço de cobrança é obrigatório");
    }

    if (CPF_CNPJ) {
      const docValidation = validateDocument(CPF_CNPJ, TipoPessoa);
      if (!docValidation.isValid) errors.push(...docValidation.errors);
    }

    if (Email) {
      const emailValidation = validateEmail(Email);
      if (!emailValidation.isValid) errors.push(...emailValidation.errors);
    }

    if (senha) {
      const passwordValidation = validatePassword(senha);
      if (!passwordValidation.isValid) errors.push(...passwordValidation.errors);
    }

    if (CEP) {
      const cepValidation = validateCEP(CEP);
      if (!cepValidation.isValid) errors.push(...cepValidation.errors);
    }

    if (CepCobranca) {
      const cepCobrancaValidation = validateCEP(CepCobranca);
      if (!cepCobrancaValidation.isValid) errors.push(...cepCobrancaValidation.errors);
    }

    if (CodigoIBGE) {
      const codigoIBGEValidation = validateCodigoIBGE(CodigoIBGE);
      if (!codigoIBGEValidation.isValid) errors.push(...codigoIBGEValidation.errors);
    }

    if (CodigoIBGECobranca) {
      const codigoIBGECobrancaValidation = validateCodigoIBGE(CodigoIBGECobranca);
      if (!codigoIBGECobrancaValidation.isValid) errors.push(...codigoIBGECobrancaValidation.errors);
    }

    if (errors.length > 0) return res.status(400).json({ success: false, errors });

    const toUpperNoAccent = (str) => (str ? removerAcentos(str).toUpperCase() : str);

    const SenhaHash = await cryptoService.hashPassword(senha);
    const CpfCnpjHash = await cryptoService.hashPassword(validateDocument(CPF_CNPJ, TipoPessoa).formatted);

    // Implementação do cadastro de cliente
    const formattedDoc = validateDocument(CPF_CNPJ, TipoPessoa).formatted;

    // Gerar CodigoCliente incremental simples
    const ultimo = await prisma.cliente.findFirst({ select: { CodigoCliente: true }, orderBy: { CodigoCliente: 'desc' } });
    const CodigoCliente = (ultimo?.CodigoCliente ?? 1000) + 1;

    const novoCliente = await prisma.cliente.create({
      data: {
        CodigoCliente,
        NomeCompleto: toUpperNoAccent(NomeCompleto),
        TipoPessoa,
        CPF_CNPJ: formattedDoc,
        TelefoneFixo: TelefoneFixo || null,
        TelefoneCelular: TelefoneCelular || null,
        Whatsapp: Whatsapp || null,
        Email: Email.toLowerCase(),
        InscricaoEstadual: InscricaoEstadual || null,
        InscricaoMunicipal: InscricaoMunicipal || null,
        RazaoSocial: RazaoSocial ? toUpperNoAccent(RazaoSocial) : null,
        SenhaHash,
        // Define role com base no tipo de pessoa
        role: (TipoPessoa || '').toUpperCase() === 'JURIDICA' ? 'VENDEDOR' : 'CLIENTE',
      },
    });

    // Endereço de entrega
    await prisma.endereco.create({
      data: {
        ClienteID: novoCliente.ClienteID,
        Nome: 'Entrega',
        CEP: CEP,
        CodigoIBGE: CodigoIBGE || null,
        Cidade: toUpperNoAccent(Cidade),
        UF: toUpperNoAccent(Estado),
        Numero: Numero || null,
        Bairro: toUpperNoAccent(Bairro),
        Complemento: Complemento || null,
      },
    });

    // Endereço de cobrança (se diferente)
    if (!enderecoCobrancaIgualEntrega) {
      await prisma.endereco.create({
        data: {
          ClienteID: novoCliente.ClienteID,
          Nome: 'Cobranca',
          CEP: CepCobranca,
          CodigoIBGE: CodigoIBGECobranca || null,
          Cidade: toUpperNoAccent(CidadeCobranca),
          UF: toUpperNoAccent(EstadoCobranca),
          Numero: NumeroCobranca || null,
          Bairro: toUpperNoAccent(BairroCobranca),
          Complemento: ComplementoCobranca || null,
        },
      });
    }

    logger.info('criar_cliente_ok', { email: Email?.toLowerCase() });
    return res.status(201).json({
      success: true,
      message: 'Cliente cadastrado com sucesso',
      data: { ClienteID: novoCliente.ClienteID, CodigoCliente }
    });
  } catch (error) {
    logControllerError('criar_cliente_error', error, req);

    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      const message = field === "Email" ? "Este email já está cadastrado." : "Este documento já está cadastrado.";
      return res.status(400).json({ success: false, errors: [message] });
    }

    res.status(500).json({ success: false, errors: ["Erro interno do servidor"] });
  }
};

export const login = async (req, res) => {
  const { email, senha } = req.body || {};

  try {
    // Validação básica para evitar exceptions e retornar erros claros
    const errors = [];
    if (!email || typeof email !== 'string' || !email.trim()) errors.push('Email é obrigatório');
    if (!senha || typeof senha !== 'string' || !senha.trim()) errors.push('Senha é obrigatória');
    if (errors.length) return res.status(400).json({ success: false, errors });

    const cliente = await prisma.cliente.findUnique({ where: { Email: email.toLowerCase() } });
    if (!cliente) return res.status(401).json({ success: false, errors: ["Email ou senha inválidos"] });

    const senhaValida = await cryptoService.comparePassword(senha, cliente.SenhaHash);
    if (!senhaValida) return res.status(401).json({ success: false, errors: ["Email ou senha inválidos"] });

    // Determina role/tipo e informações de vendedor/empresa (se aplicável)
    const tipoPessoa = (cliente.TipoPessoa || '').toUpperCase();
    const inferredRole = cliente.role || (tipoPessoa === 'JURIDICA' ? 'VENDEDOR' : 'CLIENTE');

    // Se for vendedor (por role ou por ser pessoa jurídica), tenta achar vínculo por email na tabela Vendedor
    let vendedorInfo = null;
    if (inferredRole === 'VENDEDOR' || tipoPessoa === 'JURIDICA') {
      vendedorInfo = await prisma.vendedor.findUnique({
        where: { Email: cliente.Email },
        select: { VendedorID: true, EmpresaID: true }
      });
    }

    const tokenPayload = {
      id: cliente.ClienteID,
      email: cliente.Email,
      role: inferredRole,
      tipoPessoa: cliente.TipoPessoa || null,
      empresaId: vendedorInfo?.EmpresaID || null,
      vendedorId: vendedorInfo?.VendedorID || null,
    };

    const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo';
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

    // Sugestão de redirecionamento baseada em tipo/role
    const redirectTo = (inferredRole === 'VENDEDOR' || tipoPessoa === 'JURIDICA')
      ? '/vendedor/dashboard'
      : '/';

    logger.info('login_ok', { id: cliente.ClienteID, email: cliente.Email, role: inferredRole });
    res.json({
      success: true,
      message: 'Login realizado com sucesso!',
      data: {
        id: cliente.ClienteID,
        email: cliente.Email,
        nome: cliente.NomeCompleto,
        role: inferredRole,
        tipoPessoa: cliente.TipoPessoa || null,
        vendor: vendedorInfo ? { empresaId: vendedorInfo.EmpresaID, vendedorId: vendedorInfo.VendedorID } : null,
        token,
        redirectTo,
      },
    });
  } catch (error) {
    logControllerError('login_error', error, req);
    res.status(500).json({ success: false, errors: ["Erro interno do servidor"] });
  }
};

export const autoLoginClient = async (req, res) => {
  const { user } = req;
  const client = await prisma.cliente.findUnique({ where: { ClienteID: user.id}})

  if (!client) throw new Error("Cliente não encontrado")

  // Repassa dados de sessão úteis para o frontend decidir rotas
  res.json({
    success: true,
    message: "Auto login realizado com sucesso!",
    data: {
      id: client.ClienteID,
      email: client.Email,
      nome: client.NomeCompleto,
      role: user.role || client.role,
      tipoPessoa: client.TipoPessoa || null,
      empresaId: user.empresaId || null,
      vendedorId: user.vendedorId || null,
      redirectTo: (user.role === 'VENDEDOR' || (client.TipoPessoa || '').toUpperCase() === 'JURIDICA') ? '/vendedor/dashboard' : '/',
    }
  });
}
