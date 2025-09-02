const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const cryptoService = require("../services/cryptoService");
const removerAcentos = require("remove-accents");
const {
  validatePassword,
  validateDocument,
  validateEmail,
  validateCEP,
  validateCodigoIBGE,
} = require("../utils/validators");

exports.criarCliente = async (req, res) => {
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
  } = req.body;

  try {
    const errors = [];

    if (!NomeCompleto || NomeCompleto.trim() === "") {
      errors.push("Nome completo é obrigatório");
    }
    if (!Email || Email.trim() === "") {
      errors.push("Email é obrigatório");
    }
    if (!senha || senha.trim() === "") {
      errors.push("Senha é obrigatória");
    }
    if (!CPF_CNPJ || CPF_CNPJ.trim() === "") {
      errors.push("CPF/CNPJ é obrigatório");
    }
    if (!TipoPessoa || TipoPessoa.trim() === "") {
      errors.push("Tipo de pessoa é obrigatório");
    }
    if (!CEP || CEP.trim() === "") {
      errors.push("CEP é obrigatório");
    }
    if (!Endereco || Endereco.trim() === "") {
      errors.push("Endereço é obrigatório");
    }
    if (!Numero || Numero.trim() === "") {
      errors.push("Número é obrigatório");
    }
    if (!Bairro || Bairro.trim() === "") {
      errors.push("Bairro é obrigatório");
    }
    if (!Cidade || Cidade.trim() === "") {
      errors.push("Cidade é obrigatória");
    }
    if (!Estado || Estado.trim() === "") {
      errors.push("Estado é obrigatório");
    }


    let docValidation = null;
    if (CPF_CNPJ && CPF_CNPJ.trim() !== "") {
      docValidation = validateDocument(CPF_CNPJ, TipoPessoa);
      if (!docValidation.isValid) {
        errors.push(...docValidation.errors);
      }
    }

    if (Email && Email.trim() !== "") {
      const emailValidation = validateEmail(Email);
      if (!emailValidation.isValid) {
        errors.push(...emailValidation.errors);
      }
    }

    if (senha && senha.trim() !== "") {
      const passwordValidation = validatePassword(senha);
      if (!passwordValidation.isValid) {
        errors.push(...passwordValidation.errors);
      }
    }

    let cepValidation = null;
    if (CEP && CEP.trim() !== "") {
      cepValidation = validateCEP(CEP);
      if (!cepValidation.isValid) {
        errors.push(...cepValidation.errors);
      }
    }

    let codigoIBGEValidation = null;
    if (CodigoIBGE) {
      codigoIBGEValidation = validateCodigoIBGE(CodigoIBGE);
      if (!codigoIBGEValidation.isValid) {
        errors.push(...codigoIBGEValidation.errors);
      }
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors,
      });
    }

    function toUpperNoAccent(str) {
      if (!str) return str;
      return removeAccents(str).toUpperCase();
    }

    const SenhaHash = await cryptoService.hashPassword(senha);
    const CpfCnpjHash = await cryptoService.hashPassword(
      docValidation.formatted
    );

    let cliente;
    let tentativas = 0;
    const maxTentativas = 5;

    while (tentativas < maxTentativas) {
      try {
        const ultimoCliente = await prisma.cliente.findFirst({
          orderBy: { CodigoCliente: "desc" },
          select: { CodigoCliente: true },
        });

        let proximoCodigoCliente = 100000;
        if (ultimoCliente && ultimoCliente.CodigoCliente >= 100000) {
          proximoCodigoCliente = ultimoCliente.CodigoCliente + 1;
        }

        cliente = await prisma.cliente.create({
          data: {
            CodigoCliente: proximoCodigoCliente,
            NomeCompleto,
            TipoPessoa,
            CPF_CNPJ: CpfCnpjHash,
            TelefoneFixo: TelefoneFixo || null,
            TelefoneCelular: TelefoneCelular || null,
            Whatsapp: Whatsapp || null,
            Email: Email.toLowerCase(),
            InscricaoEstadual: InscricaoEstadual || null,
            InscricaoMunicipal: InscricaoMunicipal || null,
            RazaoSocial: RazaoSocial || null,
            SenhaHash,
            enderecos: {
              create: [
                {
                  Nome: Endereco,
                  Numero: Numero,
                  Complemento: Complemento || null,
                  Bairro: Bairro,
                  Cidade: Cidade,
                  UF: Estado.toUpperCase(),
                  CEP: cepValidation.formatted,
                  CodigoIBGE: codigoIBGEValidation?.formatted || null,
                },
              ],
            },
          },
          include: {
            enderecos: true,
          },
        });

        break;
      } catch (createError) {
        if (
          createError.code === "P2002" &&
          createError.meta?.target?.includes("CodigoCliente")
        ) {
          tentativas++;
          if (tentativas >= maxTentativas) {
            throw new Error(
              "Erro ao gerar código de cliente único. Tente novamente."
            );
          }
          continue;
        }

        throw createError;
      }
    }

    const clienteResponse = {
      ...cliente,
      CPF_CNPJ: "Informação Protegida",
      SenhaHash: undefined,
    };

    res.status(201).json({
      success: true,
      message: "Cliente cadastrado com sucesso!",
      data: clienteResponse,
    });
  } catch (error) {
    if (error.code === "P2002") {
      const field = error.meta?.target?.[0];
      const message =
        field === "Email"
          ? "Este email já está cadastrado."
          : "Este documento já está cadastrado.";

      return res.status(400).json({
        success: false,
        errors: [message],
      });
    }

    console.error("Erro ao criar cliente:", error);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"],
    });
  }
};

exports.login = async (req, res) => {
  const { email, senha } = req.body;

  try {
    const cliente = await prisma.cliente.findUnique({
      where: { Email: email.toLowerCase() },
    });

    if (!cliente) {
      return res.status(401).json({
        success: false,
        errors: ["Email ou senha inválidos"],
      });
    }

    const senhaValida = await cryptoService.comparePassword(
      senha,
      cliente.SenhaHash
    );

    if (!senhaValida) {
      return res.status(401).json({
        success: false,
        errors: ["Email ou senha inválidos"],
      });
    }

    res.json({
      success: true,
      message: "Login realizado com sucesso!",
      data: {
        id: cliente.ClienteID,
        email: cliente.Email,
        nome: cliente.NomeCompleto,
      },
    });
  } catch (error) {
    console.error("Erro ao fazer login:", error);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"],
    });
  }
};
