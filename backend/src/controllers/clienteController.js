// backend/src/controllers/clienteController.js
import prisma from "../config/prisma.js";
import cryptoService from "../services/cryptoService.js";
import { enviarEmailResetSenha, sendWelcomeEmail } from "../services/emailService.js";
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

// Helper function
const toUpperNoAccent = (str) => (str ? removerAcentos(str).toUpperCase() : str);

// Helper function for phone masking
const maskPhone = (phone) => {
  if (!phone) return null;
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
  if (digits.length === 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
  return phone; // fallback
};

// Helpers para tokens
const ACCESS_SECRET = process.env.JWT_SECRET || 'seu_segredo';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'seu_segredo_refresh';
const ACCESS_EXPIRES = process.env.JWT_ACCESS_EXPIRES || '15m';
const REFRESH_EXPIRES = process.env.JWT_REFRESH_EXPIRES || '30d';

function signAccess(payload) {
  return jwt.sign(payload, ACCESS_SECRET, { expiresIn: ACCESS_EXPIRES });
}
function signRefresh(payload) {
  return jwt.sign(payload, REFRESH_SECRET, { expiresIn: REFRESH_EXPIRES });
}
function setRefreshCookie(res, token) {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('refreshToken', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/clientes',
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 dias
  });
}
function clearRefreshCookie(res) {
  const isProd = process.env.NODE_ENV === 'production';
  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'none' : 'lax',
    path: '/api/clientes',
  });
}
function parseCookies(req) {
  const header = req.headers?.cookie || '';
  return Object.fromEntries(header.split(';').map(v => v.trim()).filter(Boolean).map(kv => {
    const idx = kv.indexOf('=');
    if (idx === -1) return [kv, ''];
    return [decodeURIComponent(kv.slice(0, idx)), decodeURIComponent(kv.slice(idx + 1))];
  }));
}

/**
 * Cria um novo cliente no sistema com validações completas.
 * Realiza cadastro de cliente, endereços e vinculação automática a vendedor se pessoa jurídica.
 * @param {Object} req - Requisição Express
 * @param {Object} req.body - Dados do cliente e endereços
 * @param {Object} res - Resposta Express
 * @returns {Object} JSON com sucesso ou erros de validação
 */
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

    // Funções auxiliares para mascarar telefones
    const maskPhone = (phone) => {
      if (!phone) return null;
      const digits = phone.replace(/\D/g, '');
      if (digits.length === 10) return `(${digits.slice(0,2)}) ${digits.slice(2,6)}-${digits.slice(6)}`;
      if (digits.length === 11) return `(${digits.slice(0,2)}) ${digits.slice(2,7)}-${digits.slice(7)}`;
      return phone; // fallback
    };

    const SenhaHash = await cryptoService.hashPassword(senha);
    const CpfCnpjHash = await cryptoService.hashPassword(validateDocument(CPF_CNPJ, TipoPessoa).formatted);

    // Implementação do cadastro de cliente
    const formattedDoc = validateDocument(CPF_CNPJ, TipoPessoa).formatted;

    // Gerar CodigoCliente incremental simples
    const ultimo = await prisma.cliente.findFirst({ select: { CodigoCliente: true }, orderBy: { CodigoCliente: 'desc' } });
    const CodigoCliente = (ultimo?.CodigoCliente ?? 1000) + 1;

    // Define role conforme tipo de pessoa (Jurídica -> VENDEDOR, Física -> CLIENTE)
    const tipoPessoaNorm = removerAcentos((TipoPessoa || '')).toUpperCase();
    const role = (tipoPessoaNorm === 'JURIDICA') ? 'VENDEDOR' : 'CLIENTE';

    const novoCliente = await prisma.cliente.create({
      data: {
        CodigoCliente,
        NomeCompleto: toUpperNoAccent(NomeCompleto),
        TipoPessoa,
        CPF_CNPJ: formattedDoc,
        TelefoneFixo: maskPhone(TelefoneFixo),
        TelefoneCelular: maskPhone(TelefoneCelular),
        Whatsapp: maskPhone(Whatsapp),
        Email: Email.toLowerCase(),
        InscricaoEstadual: InscricaoEstadual || null,
        InscricaoMunicipal: InscricaoMunicipal || null,
        RazaoSocial: RazaoSocial ? toUpperNoAccent(RazaoSocial) : null,
        SenhaHash,
        role,
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

    // Enviar email de boas-vindas
    try {
      await sendWelcomeEmail({
        nome: novoCliente.NomeCompleto,
        email: novoCliente.Email
      });
      logger.info('email_boas_vindas_enviado', { clienteId: novoCliente.ClienteID });
    } catch (emailError) {
      logger.warn('erro_email_boas_vindas', { clienteId: novoCliente.ClienteID, error: emailError.message });
      // Não falhar o cadastro por erro no email
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
    // Garante que possamos setar cookie
    if (typeof res.cookie !== 'function') {
      res.cookie = function(name, value, options) {
        // fallback: set header manualmente
        const serialized = `${encodeURIComponent(name)}=${encodeURIComponent(value)}; Path=${options?.path || '/'}; HttpOnly; Max-Age=${Math.floor((options?.maxAge || 0)/1000)}` + (options?.secure ? '; Secure' : '') + (options?.sameSite ? `; SameSite=${options.sameSite}` : '');
        const prev = res.getHeader('Set-Cookie');
        const next = Array.isArray(prev) ? prev.concat(serialized) : (prev ? [prev, serialized] : [serialized]);
        res.setHeader('Set-Cookie', next);
      }
    }
    // Validação básica para evitar exceptions e retornar erros claros
    const errors = [];
    if (!email || typeof email !== 'string' || !email.trim()) errors.push('Email/CPF/CNPJ ou telefone é obrigatório');
    if (!senha || typeof senha !== 'string' || !senha.trim()) errors.push('Senha é obrigatória');
    if (errors.length) return res.status(400).json({ success: false, errors });

    // Suporte a login por email, CPF/CNPJ ou telefone (fixo/celular/whatsapp)
    const identifierRaw = email.trim();
    const onlyDigits = (s) => s.replace(/\D+/g, '');
    const idDigits = onlyDigits(identifierRaw);

    const maskCPF = (d) => `${d.slice(0,3)}.${d.slice(3,6)}.${d.slice(6,9)}-${d.slice(9,11)}`;
    const maskCNPJ = (d) => `${d.slice(0,2)}.${d.slice(2,5)}.${d.slice(5,8)}/${d.slice(8,12)}-${d.slice(12,14)}`;
    const maskPhone10 = (d) => `(${d.slice(0,2)}) ${d.slice(2,6)}-${d.slice(6,10)}`;
    const maskPhone11 = (d) => `(${d.slice(0,2)}) ${d.slice(2,7)}-${d.slice(7,11)}`;

    let cliente = null;

    // 1) Tenta por email
    if (identifierRaw.includes('@')) {
      cliente = await prisma.cliente.findUnique({ where: { Email: identifierRaw.toLowerCase() } });
    }

    // 2) Tenta por CPF (11 dígitos) com máscara exata
    if (!cliente && idDigits.length === 11) {
      const cpfMasked = maskCPF(idDigits);
      cliente = await prisma.cliente.findFirst({ where: { CPF_CNPJ: cpfMasked } });
      // Se não encontrou por CPF, tenta telefone 11 dígitos
      if (!cliente) {
        const phoneMasked = maskPhone11(idDigits);
        cliente = await prisma.cliente.findFirst({
          where: {
            OR: [
              { TelefoneFixo: phoneMasked },
              { TelefoneCelular: phoneMasked },
              { Whatsapp: phoneMasked },
            ],
          },
        });
      }
    }

    // 3) Tenta por CNPJ (14 dígitos) com máscara exata
    if (!cliente && idDigits.length === 14) {
      const cnpjMasked = maskCNPJ(idDigits);
      cliente = await prisma.cliente.findFirst({ where: { CPF_CNPJ: cnpjMasked } });
    }

    // 4) Tenta por telefone 10 dígitos
    if (!cliente && idDigits.length === 10) {
      const phoneMasked = maskPhone10(idDigits);
      cliente = await prisma.cliente.findFirst({
        where: {
          OR: [
            { TelefoneFixo: phoneMasked },
            { TelefoneCelular: phoneMasked },
            { Whatsapp: phoneMasked },
          ],
        },
      });
    }

    if (!cliente) return res.status(401).json({ success: false, errors: ["Credenciais inválidas"] });

    const senhaValida = await cryptoService.comparePassword(senha, cliente.SenhaHash);
    if (!senhaValida) return res.status(401).json({ success: false, errors: ["Email ou senha inválidos"] });

    // Determina role/tipo e informações de vendedor/empresa (se aplicável)
    const tipoPessoa = removerAcentos((cliente.TipoPessoa || '')).toUpperCase();
    // Força pessoa jurídica a ser tratada como VENDEDOR (independente do valor salvo em role)
    const inferredRole = (tipoPessoa === 'JURIDICA') ? 'VENDEDOR' : (cliente.role || 'CLIENTE');

    // Se for vendedor (por role ou por ser pessoa jurídica), tenta achar vínculo por email na tabela Vendedor
    let vendedorInfo = null;
    const shouldVendorize = inferredRole === 'VENDEDOR' || tipoPessoa === 'JURIDICA';
    if (shouldVendorize) {
      // Tenta achar vínculo existente por email
      vendedorInfo = await prisma.vendedor.findUnique({
        where: { Email: cliente.Email },
        select: { VendedorID: true, EmpresaID: true }
      });

      // Se não houver vínculo e CNPJ não for real (fase MVP), cria Empresa placeholder e associa Vendedor
      if (!vendedorInfo) {
        // Garante Empresa placeholder
        let empresa = await prisma.empresa.findUnique({ where: { Documento: 'MVP-DEFAULT' }, select: { EmpresaID: true } });
        if (!empresa) {
          empresa = await prisma.empresa.create({
            data: { Nome: 'Empresa MVP', Documento: 'MVP-DEFAULT' },
            select: { EmpresaID: true }
          });
        }

        const vendedorNomeBase = (cliente.RazaoSocial || cliente.NomeCompleto || '').toString();
        const vendedorNome = vendedorNomeBase ? removerAcentos(vendedorNomeBase).toUpperCase() : 'VENDEDOR';

        // Cria vínculo de vendedor usando o mesmo email do cliente
        vendedorInfo = await prisma.vendedor.create({
          data: {
            Nome: vendedorNome,
            Email: cliente.Email,
            SenhaHash: cliente.SenhaHash, // reaproveita hash do cliente para MVP
            EmpresaID: empresa.EmpresaID,
          },
          select: { VendedorID: true, EmpresaID: true }
        });
      }
    }

    // Normaliza role para o frontend (minúsculas)
    const roleLower = inferredRole.toLowerCase();

    const tokenPayload = {
      id: cliente.ClienteID,
      email: cliente.Email,
      role: roleLower,
      tipoPessoa: cliente.TipoPessoa || null,
      empresaId: vendedorInfo?.EmpresaID || null,
      vendedorId: vendedorInfo?.VendedorID || null,
    };

    const accessToken = signAccess(tokenPayload);
    const refreshToken = signRefresh({ id: tokenPayload.id });

    // seta cookie httpOnly com refresh
    setRefreshCookie(res, refreshToken);

    // Sugestão de redirecionamento baseada em tipo/role (alinha com rotas do frontend)
    const redirectTo = (roleLower === 'vendedor' || tipoPessoa === 'JURIDICA')
      ? '/vendedor'
      : '/home';

    logger.info('login_ok', { id: cliente.ClienteID, email: cliente.Email, role: roleLower });
    res.json({
      success: true,
      message: 'Login realizado com sucesso!',
      data: {
        id: cliente.ClienteID,
        email: cliente.Email,
        nome: cliente.NomeCompleto,
        role: roleLower,
        tipoPessoa: cliente.TipoPessoa || null,
        // Inclui no topo para facilitar consumo no frontend
        empresaId: vendedorInfo?.EmpresaID || null,
        vendedorId: vendedorInfo?.VendedorID || null,
        // Mantém objeto vendor para compatibilidade
        vendor: vendedorInfo ? { empresaId: vendedorInfo.EmpresaID, vendedorId: vendedorInfo.VendedorID } : null,
        accessToken,
        redirectTo,
      },
    });
  } catch (error) {
    logControllerError('login_error', error, req);
    res.status(500).json({ success: false, errors: ["Erro interno do servidor"] });
  }
};

export const refreshToken = async (req, res) => {
  try {
    const cookies = parseCookies(req);
    const token = cookies['refreshToken'];
    if (!token) return res.status(401).json({ success: false, errors: ['Refresh token ausente'] });

    const payload = jwt.verify(token, REFRESH_SECRET);

    // Carrega o cliente mínimo para reemitir access (e possíveis flags)
    const client = await prisma.cliente.findUnique({ where: { ClienteID: payload.id } });
    if (!client) return res.status(401).json({ success: false, errors: ['Cliente não encontrado'] });

    // Opcional: rotacionar refresh
    const newRefresh = signRefresh({ id: client.ClienteID });
    setRefreshCookie(res, newRefresh);

    // Reconstroi payload do access
    const tipoPessoa = (client.TipoPessoa || '').toUpperCase();
    const roleLower = (tipoPessoa === 'JURIDICA' ? 'VENDEDOR' : (client.role || 'CLIENTE')).toLowerCase();

    // Busca vínculo vendedor, se aplicável (leve)
    let vendedorInfo = null;
    if (roleLower === 'vendedor') {
      vendedorInfo = await prisma.vendedor.findUnique({ where: { Email: client.Email }, select: { VendedorID: true, EmpresaID: true } });
    }

    const access = signAccess({
      id: client.ClienteID,
      email: client.Email,
      role: roleLower,
      tipoPessoa: client.TipoPessoa || null,
      empresaId: vendedorInfo?.EmpresaID || null,
      vendedorId: vendedorInfo?.VendedorID || null,
    });

    res.json({ success: true, data: { accessToken: access } });
  } catch (err) {
    return res.status(401).json({ success: false, errors: ['Refresh inválido ou expirado'] });
  }
}

export const logout = async (req, res) => {
  try {
    clearRefreshCookie(res);
    res.json({ success: true, message: 'Logout realizado' });
  } catch {
    res.json({ success: true, message: 'Logout realizado' });
  }
}

export const autoLoginClient = async (req, res) => {
  const { user } = req;
  const client = await prisma.cliente.findUnique({ where: { ClienteID: user.id}})

  if (!client) return res.status(401).json({ success: false, errors: ['Cliente não encontrado'] });

  // Normaliza role para minúsculas quando vier do banco (VENDEDOR/CLIENTE)
  const clientRole = (user.role || client.role || '').toString().toLowerCase();
  const tipoPessoa = (client.TipoPessoa || '').toUpperCase();

  // Reemite Access curto na verificação do auto-login (opcional)
  const newAccess = signAccess({
    id: client.ClienteID,
    email: client.Email,
    role: clientRole,
    tipoPessoa: client.TipoPessoa || null,
    empresaId: user.empresaId || null,
    vendedorId: user.vendedorId || null,
  });

  res.json({
    success: true,
    message: "Auto login realizado com sucesso!",
    data: {
      id: client.ClienteID,
      email: client.Email,
      nome: client.NomeCompleto,
      role: clientRole,
      tipoPessoa: client.TipoPessoa || null,
      empresaId: user.empresaId || null,
      vendedorId: user.vendedorId || null,
      accessToken: newAccess,
      redirectTo: (clientRole === 'vendedor' || tipoPessoa === 'JURIDICA') ? '/vendedor' : '/home',
    }
  });
};

export const buscarPerfil = async (req, res) => {
  try {
    const { user } = req;
    const cliente = await prisma.cliente.findUnique({
      where: { ClienteID: user.id },
      select: {
        ClienteID: true,
        CodigoCliente: true,
        NomeCompleto: true,
        TipoPessoa: true,
        CPF_CNPJ: true,
        TelefoneFixo: true,
        TelefoneCelular: true,
        Whatsapp: true,
        Email: true,
        InscricaoEstadual: true,
        InscricaoMunicipal: true,
        RazaoSocial: true,
        DataCadastro: true,
        role: true,
        enderecos: {
          select: {
            EnderecoID: true,
            Nome: true,
            Complemento: true,
            CEP: true,
            Cidade: true,
            UF: true,
            Numero: true,
            Bairro: true,
            TipoEndereco: true,
          },
        },
      },
    });

    if (!cliente) {
      return res.status(404).json({ success: false, errors: ['Cliente não encontrado'] });
    }

    logger.info('buscar_perfil_ok', { clienteId: user.id });
    res.json({ success: true, cliente });
  } catch (error) {
    logControllerError('buscar_perfil_error', error, req);
    res.status(500).json({ success: false, errors: ["Erro interno do servidor"] });
  }
};

export const listarEnderecos = async (req, res) => {
  try {
    const { user } = req;
    const enderecos = await prisma.endereco.findMany({
      where: { ClienteID: user.id },
      select: {
        EnderecoID: true,
        Nome: true,
        Complemento: true,
        CEP: true,
        Cidade: true,
        UF: true,
        Numero: true,
        Bairro: true,
      },
    });

    logger.info('listar_enderecos_ok', { clienteId: user.id, total: enderecos.length });
    res.json({ enderecos });
  } catch (error) {
    logControllerError('listar_enderecos_error', error, req);
    res.status(500).json({ error: "Erro ao listar endereços" });
  }
};

export const atualizarPerfil = async (req, res) => {
  const {
    NomeCompleto,
    Email,
    TelefoneCelular,
    TelefoneFixo,
    Whatsapp,
    RazaoSocial,
    InscricaoEstadual,
    InscricaoMunicipal
  } = req.body;

  try {
    const { user } = req;

    // Validações básicas
    const errors = [];
    if (!NomeCompleto || NomeCompleto.trim() === "") errors.push("Nome completo é obrigatório");
    if (!Email || Email.trim() === "") errors.push("Email é obrigatório");

    if (Email) {
      const emailValidation = validateEmail(Email);
      if (!emailValidation.isValid) errors.push(...emailValidation.errors);
    }

    if (errors.length > 0) return res.status(400).json({ success: false, errors });

    // Atualizar cliente
    const clienteAtualizado = await prisma.cliente.update({
      where: { ClienteID: user.id },
      data: {
        NomeCompleto: toUpperNoAccent(NomeCompleto),
        Email: Email.toLowerCase(),
        TelefoneCelular: TelefoneCelular ? maskPhone(TelefoneCelular) : null,
        TelefoneFixo: TelefoneFixo ? maskPhone(TelefoneFixo) : null,
        Whatsapp: Whatsapp ? maskPhone(Whatsapp) : null,
        RazaoSocial: RazaoSocial ? toUpperNoAccent(RazaoSocial) : null,
        InscricaoEstadual: InscricaoEstadual || null,
        InscricaoMunicipal: InscricaoMunicipal || null,
      },
      select: {
        ClienteID: true,
        CodigoCliente: true,
        NomeCompleto: true,
        TipoPessoa: true,
        CPF_CNPJ: true,
        TelefoneFixo: true,
        TelefoneCelular: true,
        Whatsapp: true,
        Email: true,
        InscricaoEstadual: true,
        InscricaoMunicipal: true,
        RazaoSocial: true,
        DataCadastro: true,
        role: true,
      },
    });

    logger.info('atualizar_perfil_ok', { clienteId: user.id });
    res.json({ success: true, message: 'Perfil atualizado com sucesso', cliente: clienteAtualizado });
  } catch (error) {
    logControllerError('atualizar_perfil_error', error, req);

    if (error.code === "P2002") {
      return res.status(400).json({ success: false, errors: ["Este email já está sendo usado por outro usuário"] });
    }

    res.status(500).json({ success: false, errors: ["Erro interno do servidor"] });
  }
};

export const validarSenhaAtual = async (req, res) => {
  const { senhaAtual } = req.body;

  try {
    const { user } = req;

    // Validações básicas
    const errors = [];
    if (!senhaAtual || senhaAtual.trim() === "") errors.push("Senha atual é obrigatória");

    if (errors.length > 0) return res.status(400).json({ success: false, errors });

    // Buscar cliente atual
    const cliente = await prisma.cliente.findUnique({
      where: { ClienteID: user.id },
      select: { SenhaHash: true }
    });

    if (!cliente) {
      return res.status(404).json({ success: false, errors: ["Cliente não encontrado"] });
    }

    // Verificar senha atual
    const senhaAtualValida = await cryptoService.comparePassword(senhaAtual, cliente.SenhaHash);

    logger.info('validar_senha_atual_ok', { clienteId: user.id, valida: senhaAtualValida });
    res.json({ success: true, valida: senhaAtualValida });
  } catch (error) {
    logControllerError('validar_senha_atual_error', error, req);
    res.status(500).json({ success: false, errors: ["Erro interno do servidor"] });
  }
};

export const alterarSenha = async (req, res) => {
  const { senhaAtual, novaSenha } = req.body;

  try {
    const { user } = req;

    // Validações básicas
    const errors = [];
    if (!senhaAtual || senhaAtual.trim() === "") errors.push("Senha atual é obrigatória");
    if (!novaSenha || novaSenha.trim() === "") errors.push("Nova senha é obrigatória");

    if (novaSenha) {
      const passwordValidation = validatePassword(novaSenha);
      if (!passwordValidation.isValid) errors.push(...passwordValidation.errors);
    }

    if (errors.length > 0) return res.status(400).json({ success: false, errors });

    // Buscar cliente atual
    const cliente = await prisma.cliente.findUnique({
      where: { ClienteID: user.id },
      select: { SenhaHash: true }
    });

    if (!cliente) {
      return res.status(404).json({ success: false, errors: ["Cliente não encontrado"] });
    }

    // Verificar senha atual
    const senhaAtualValida = await cryptoService.comparePassword(senhaAtual, cliente.SenhaHash);
    if (!senhaAtualValida) {
      return res.status(400).json({ success: false, errors: ["Senha atual incorreta"] });
    }

    // Hash da nova senha
    const novaSenhaHash = await cryptoService.hashPassword(novaSenha);

    // Atualizar senha
    await prisma.cliente.update({
      where: { ClienteID: user.id },
      data: { SenhaHash: novaSenhaHash },
    });

    logger.info('alterar_senha_ok', { clienteId: user.id });
    res.json({ success: true, message: 'Senha alterada com sucesso' });
  } catch (error) {
    logControllerError('alterar_senha_error', error, req);
    res.status(500).json({ success: false, errors: ["Erro interno do servidor"] });
  }
};

export const criarEndereco = async (req, res) => {
  const {
    Nome,
    Complemento,
    CEP,
    Cidade,
    UF,
    TipoEndereco,
    Numero,
    Bairro
  } = req.body;

  try {
    const { user } = req;

    // Validações básicas
    const errors = [];
    if (!Nome || Nome.trim() === "") errors.push("Nome do endereço é obrigatório");
    if (!CEP || CEP.trim() === "") errors.push("CEP é obrigatório");
    if (!Cidade || Cidade.trim() === "") errors.push("Cidade é obrigatória");
    if (!UF || UF.trim() === "") errors.push("UF é obrigatória");
    if (!Bairro || Bairro.trim() === "") errors.push("Bairro é obrigatório");

    if (CEP) {
      const cepValidation = validateCEP(CEP);
      if (!cepValidation.isValid) errors.push(...cepValidation.errors);
    }

    if (errors.length > 0) return res.status(400).json({ success: false, errors });

    // Criar endereço
    const novoEndereco = await prisma.endereco.create({
      data: {
        ClienteID: user.id,
        Nome: toUpperNoAccent(Nome),
        Complemento: Complemento || null,
        CEP: CEP,
        Cidade: toUpperNoAccent(Cidade),
        UF: toUpperNoAccent(UF),
        TipoEndereco: TipoEndereco || 'Residencial',
        Numero: Numero || null,
        Bairro: toUpperNoAccent(Bairro),
      },
      select: {
        EnderecoID: true,
        Nome: true,
        Complemento: true,
        CEP: true,
        Cidade: true,
        UF: true,
        TipoEndereco: true,
        Numero: true,
        Bairro: true,
      },
    });

    logger.info('criar_endereco_ok', { clienteId: user.id, enderecoId: novoEndereco.EnderecoID });
    res.status(201).json({ success: true, message: 'Endereço criado com sucesso', endereco: novoEndereco });
  } catch (error) {
    logControllerError('criar_endereco_error', error, req);
    res.status(500).json({ success: false, errors: ["Erro interno do servidor"] });
  }
};

export const atualizarEndereco = async (req, res) => {
  const { id } = req.params;
  const {
    Nome,
    Complemento,
    CEP,
    Cidade,
    UF,
    TipoEndereco,
    Numero,
    Bairro
  } = req.body;

  try {
    const { user } = req;

    // Verificar se o endereço pertence ao cliente
    const enderecoExistente = await prisma.endereco.findFirst({
      where: { EnderecoID: parseInt(id), ClienteID: user.id }
    });

    if (!enderecoExistente) {
      return res.status(404).json({ success: false, errors: ["Endereço não encontrado"] });
    }

    // Validações básicas
    const errors = [];
    if (!Nome || Nome.trim() === "") errors.push("Nome do endereço é obrigatório");
    if (!CEP || CEP.trim() === "") errors.push("CEP é obrigatório");
    if (!Cidade || Cidade.trim() === "") errors.push("Cidade é obrigatória");
    if (!UF || UF.trim() === "") errors.push("UF é obrigatória");
    if (!Bairro || Bairro.trim() === "") errors.push("Bairro é obrigatório");

    if (CEP) {
      const cepValidation = validateCEP(CEP);
      if (!cepValidation.isValid) errors.push(...cepValidation.errors);
    }

    if (errors.length > 0) return res.status(400).json({ success: false, errors });

    // Atualizar endereço
    const enderecoAtualizado = await prisma.endereco.update({
      where: { EnderecoID: parseInt(id) },
      data: {
        Nome: toUpperNoAccent(Nome),
        Complemento: Complemento || null,
        CEP: CEP,
        Cidade: toUpperNoAccent(Cidade),
        UF: toUpperNoAccent(UF),
        TipoEndereco: TipoEndereco || 'Residencial',
        Numero: Numero || null,
        Bairro: toUpperNoAccent(Bairro),
      },
      select: {
        EnderecoID: true,
        Nome: true,
        Complemento: true,
        CEP: true,
        Cidade: true,
        UF: true,
        TipoEndereco: true,
        Numero: true,
        Bairro: true,
      },
    });

    logger.info('atualizar_endereco_ok', { clienteId: user.id, enderecoId: id });
    res.json({ success: true, message: 'Endereço atualizado com sucesso', endereco: enderecoAtualizado });
  } catch (error) {
    logControllerError('atualizar_endereco_error', error, req);
    res.status(500).json({ success: false, errors: ["Erro interno do servidor"] });
  }
};

export const excluirEndereco = async (req, res) => {
  const { id } = req.params;

  try {
    const { user } = req;

    // Verificar se o endereço pertence ao cliente
    const enderecoExistente = await prisma.endereco.findFirst({
      where: { EnderecoID: parseInt(id), ClienteID: user.id }
    });

    if (!enderecoExistente) {
      return res.status(404).json({ success: false, errors: ["Endereço não encontrado"] });
    }

    // Excluir endereço
    await prisma.endereco.delete({
      where: { EnderecoID: parseInt(id) }
    });

    logger.info('excluir_endereco_ok', { clienteId: user.id, enderecoId: id });
    res.json({ success: true, message: 'Endereço excluído com sucesso' });
  } catch (error) {
    logControllerError('excluir_endereco_error', error, req);
    res.status(500).json({ success: false, errors: ["Erro interno do servidor"] });
  }
};

export const definirEnderecoPadrao = async (req, res) => {
  const { id } = req.params;

  try {
    const { user } = req;

    // Verificar se o endereço pertence ao cliente
    const enderecoExistente = await prisma.endereco.findFirst({
      where: { EnderecoID: parseInt(id), ClienteID: user.id }
    });

    if (!enderecoExistente) {
      return res.status(404).json({ success: false, errors: ["Endereço não encontrado"] });
    }

    // Por enquanto, apenas confirmar que o endereço existe
    // Futuramente pode implementar lógica de endereço padrão
    logger.info('definir_endereco_padrao_ok', { clienteId: user.id, enderecoId: id });
    res.json({ success: true, message: 'Endereço definido como padrão' });
  } catch (error) {
    logControllerError('definir_endereco_padrao_error', error, req);
    res.status(500).json({ success: false, errors: ["Erro interno do servidor"] });
  }
};

export const solicitarResetSenha = async (req, res) => {
  const { email } = req.body;

  try {
    const errors = [];
    if (!email || email.trim() === "") errors.push("Email é obrigatório");

    if (email && !validateEmail(email).isValid) errors.push("Email inválido");

    if (errors.length > 0) return res.status(400).json({ success: false, errors });

    // Buscar cliente
    const cliente = await prisma.cliente.findUnique({
      where: { Email: email.toLowerCase() }
    });

    if (!cliente) {
      // Não revelar se o email existe ou não por segurança
      return res.json({ success: true, message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.' });
    }

    // Gerar token único
    const resetToken = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hora

    // Salvar token na tabela dedicada
    await prisma.passwordResetToken.create({
      data: {
        ClienteID: cliente.ClienteID,
        Token: resetToken,
        ExpiresAt: expiresAt
      }
    });

    // Enviar email com o token
    try {
      await enviarEmailResetSenha(email, resetToken);
      logger.info('solicitar_reset_senha_email_enviado', { email: email.toLowerCase() });
    } catch (emailError) {
      logger.error('solicitar_reset_senha_email_error', { email: email.toLowerCase(), error: emailError.message });
      // Em produção, falhar se não conseguir enviar email
      if (process.env.NODE_ENV === 'production') {
        return res.status(500).json({ success: false, errors: ["Erro ao enviar email de redefinição. Tente novamente mais tarde."] });
      }
      // Em desenvolvimento, apenas logar o erro mas continuar
    }

    logger.info('solicitar_reset_senha_ok', { email: email.toLowerCase() });
    res.json({ success: true, message: 'Se o email estiver cadastrado, você receberá instruções para redefinir sua senha.' });
  } catch (error) {
    logControllerError('solicitar_reset_senha_error', error, req);
    res.status(500).json({ success: false, errors: ["Erro interno do servidor"] });
  }
};

export const resetarSenha = async (req, res) => {
  const { token, novaSenha } = req.body;

  try {
    const errors = [];
    if (!token || token.trim() === "") errors.push("Token é obrigatório");
    if (!novaSenha || novaSenha.trim() === "") errors.push("Nova senha é obrigatória");

    if (novaSenha && !validatePassword(novaSenha).isValid) {
      errors.push(...validatePassword(novaSenha).errors);
    }

    if (errors.length > 0) return res.status(400).json({ success: false, errors });

    // Buscar token válido e não usado
    const resetToken = await prisma.passwordResetToken.findFirst({
      where: {
        Token: token,
        Used: false,
        ExpiresAt: {
          gt: new Date()
        }
      },
      include: {
        cliente: true
      }
    });

    if (!resetToken) {
      return res.status(400).json({ success: false, errors: ["Token inválido ou expirado"] });
    }

    // Hash da nova senha
    const novaSenhaHash = await cryptoService.hashPassword(novaSenha);

    // Atualizar senha e marcar token como usado
    await prisma.$transaction([
      prisma.cliente.update({
        where: { ClienteID: resetToken.ClienteID },
        data: { SenhaHash: novaSenhaHash },
      }),
      prisma.passwordResetToken.update({
        where: { TokenID: resetToken.TokenID },
        data: { Used: true }
      })
    ]);

    logger.info('resetar_senha_ok', { clienteId: resetToken.ClienteID });
    res.json({ success: true, message: 'Senha redefinida com sucesso' });
  } catch (error) {
    logControllerError('resetar_senha_error', error, req);
    res.status(500).json({ success: false, errors: ["Erro interno do servidor"] });
  }
};
