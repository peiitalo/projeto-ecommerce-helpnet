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

    // Define role conforme tipo de pessoa (Jurídica -> VENDEDOR, Física -> CLIENTE)
    const tipoPessoaNorm = removerAcentos((TipoPessoa || '')).toUpperCase();
    const role = (tipoPessoaNorm === 'JURIDICA') ? 'VENDEDOR' : 'CLIENTE';

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

    const JWT_SECRET = process.env.JWT_SECRET || 'seu_segredo';
    const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '7d' });

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

  // Normaliza role para minúsculas quando vier do banco (VENDEDOR/CLIENTE)
  const clientRole = (user.role || client.role || '').toString().toLowerCase();
  const tipoPessoa = (client.TipoPessoa || '').toUpperCase();

  // Repassa dados de sessão úteis para o frontend decidir rotas
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
      redirectTo: (clientRole === 'vendedor' || tipoPessoa === 'JURIDICA') ? '/vendedor' : '/home',
    }
  });
}
