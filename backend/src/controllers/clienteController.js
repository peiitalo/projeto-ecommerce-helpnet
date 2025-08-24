const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const cryptoService = require('../services/cryptoService');
const { 
  validatePassword, 
  validateDocument, 
  validateEmail, 
  validateCEP 
} = require('../utils/validators');

exports.criarCliente = async (req, res) => {
  const {
    NomeCompleto,
    TipoPessoa,
    CPF_CNPJ,
    Email,
    senha, // Mudamos de SenhaHash para senha no payload
    RazaoSocial,
    Endereco,
    Cidade,
    Estado,
    CEP
  } = req.body;

  try {
    // Validações
    const errors = [];

    // Validar documento (CPF/CNPJ)
    const docValidation = validateDocument(CPF_CNPJ, TipoPessoa);
    if (!docValidation.isValid) {
      errors.push(...docValidation.errors);
    }

    // Validar email
    const emailValidation = validateEmail(Email);
    if (!emailValidation.isValid) {
      errors.push(...emailValidation.errors);
    }

    // Validar senha
    const passwordValidation = validatePassword(senha);
    if (!passwordValidation.isValid) {
      errors.push(...passwordValidation.errors);
    }

    // Validar CEP
    const cepValidation = validateCEP(CEP);
    if (!cepValidation.isValid) {
      errors.push(...cepValidation.errors);
    }

    if (errors.length > 0) {
      return res.status(400).json({ 
        success: false, 
        errors 
      });
    }

    // Criptografar senha
    const SenhaHash = await cryptoService.hashPassword(senha);

    // Criar cliente com dados formatados
    const cliente = await prisma.cliente.create({
      data: {
        NomeCompleto,
        TipoPessoa,
        CPF_CNPJ: docValidation.formatted,
        Email: Email.toLowerCase(),
        SenhaHash,
        RazaoSocial: RazaoSocial || null,
        enderecos: {
          create: [{
            Nome: Endereco,
            Cidade,
            UF: Estado.toUpperCase(),
            CEP: cepValidation.formatted,
          }]
        }
      },
      include: { 
        enderecos: true 
      }
    });

    // Remover dados sensíveis antes de enviar resposta
    const clienteResponse = {
      ...cliente,
      CPF_CNPJ: cryptoService.maskSensitiveData(
        cliente.CPF_CNPJ, 
        cliente.TipoPessoa === 'Física' ? 'cpf' : 'cnpj'
      ),
      SenhaHash: undefined
    };

    res.status(201).json({
      success: true,
      message: 'Cliente cadastrado com sucesso!',
      data: clienteResponse
    });

  } catch (error) {
    if (error.code === 'P2002') {
      // Erro de unique constraint
      const field = error.meta?.target?.[0];
      const message = field === 'Email' 
        ? 'Este email já está cadastrado.'
        : 'Este documento já está cadastrado.';
      
      return res.status(400).json({ 
        success: false, 
        errors: [message] 
      });
    }

    console.error('Erro ao criar cliente:', error);
    res.status(500).json({ 
      success: false, 
      errors: ['Erro interno do servidor'] 
    });
  }
};

// Exemplo de função para login (adicional)
exports.login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { Email: email.toLowerCase() }
    });

    if (!cliente) {
      return res.status(401).json({
        success: false,
        errors: ['Email ou senha inválidos']
      });
    }

    const senhaValida = await cryptoService.comparePassword(
      senha, 
      cliente.SenhaHash
    );

    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        errors: ['Email ou senha inválidos']
      });
    }

    // Aqui você pode gerar um token JWT se quiser
    res.json({
      success: true,
      message: 'Login realizado com sucesso!',
      data: {
        id: cliente.ClienteID,
        email: cliente.Email,
        nome: cliente.NomeCompleto
      }
    });

  } catch (error) {
    console.error('Erro ao fazer login:', error);
    res.status(500).json({
      success: false,
      errors: ['Erro interno do servidor']
    });
  }
};