// backend/src/scripts/createSampleData.js
import prisma from '../config/prisma.js';
import cryptoService from '../services/cryptoService.js';

const sampleCategories = [
  { Nome: 'Casa e Decoração' },
  { Nome: 'Moda e Acessórios' },
  { Nome: 'Beleza e Saúde' },
  { Nome: 'Livros e Entretenimento' },
  { Nome: 'Eletrônicos' },
  { Nome: 'Outros' }
];

const sampleClients = [
  {
    NomeCompleto: 'João Silva Santos',
    TipoPessoa: 'Física',
    CPF_CNPJ: '123.456.789-01',
    Email: 'joao.silva@email.com',
    TelefoneCelular: '(11) 99999-0001',
    senha: 'Senha@123',
    endereco: {
      CEP: '01000-000',
      Cidade: 'São Paulo',
      UF: 'SP',
      Bairro: 'Centro',
      Numero: '123',
      Complemento: 'Apto 45'
    }
  },
  {
    NomeCompleto: 'Maria Oliveira Costa',
    TipoPessoa: 'Física',
    CPF_CNPJ: '234.567.890-12',
    Email: 'maria.oliveira@email.com',
    TelefoneCelular: '(21) 99999-0003',
    senha: 'Senha@123',
    endereco: {
      CEP: '20000-000',
      Cidade: 'Rio de Janeiro',
      UF: 'RJ',
      Bairro: 'Copacabana',
      Numero: '789',
      Complemento: 'Bloco B'
    }
  },
  {
    NomeCompleto: 'Carlos Eduardo Lima',
    TipoPessoa: 'Física',
    CPF_CNPJ: '345.678.901-23',
    Email: 'carlos.lima@email.com',
    TelefoneCelular: '(31) 99999-0005',
    senha: 'Senha@123',
    endereco: {
      CEP: '30000-000',
      Cidade: 'Belo Horizonte',
      UF: 'MG',
      Bairro: 'Savassi',
      Numero: '202',
      Complemento: 'Casa'
    }
  },
  {
    NomeCompleto: 'Ana Paula Rodrigues',
    TipoPessoa: 'Física',
    CPF_CNPJ: '456.789.012-34',
    Email: 'ana.rodrigues@email.com',
    TelefoneCelular: '(71) 99999-0007',
    senha: 'Senha@123',
    endereco: {
      CEP: '40000-000',
      Cidade: 'Salvador',
      UF: 'BA',
      Bairro: 'Pituba',
      Numero: '404',
      Complemento: 'Apto 67'
    }
  },
  {
    NomeCompleto: 'Roberto Fernandes',
    TipoPessoa: 'Física',
    CPF_CNPJ: '567.890.123-45',
    Email: 'roberto.fernandes@email.com',
    TelefoneCelular: '(41) 99999-0009',
    senha: 'Senha@123',
    endereco: {
      CEP: '80000-000',
      Cidade: 'Curitiba',
      UF: 'PR',
      Bairro: 'Batel',
      Numero: '606',
      Complemento: 'Cobertura'
    }
  }
];

const sampleVendors = [
  {
    NomeCompleto: 'Empresa ABC Ltda',
    TipoPessoa: 'Jurídica',
    CPF_CNPJ: '12.345.678/0001-90',
    Email: 'contato@empresaabc.com.br',
    TelefoneCelular: '(11) 99999-0002',
    RazaoSocial: 'Empresa ABC Ltda',
    senha: 'Senha@123',
    endereco: {
      CEP: '02000-000',
      Cidade: 'São Paulo',
      UF: 'SP',
      Bairro: 'Vila Mariana',
      Numero: '456',
      Complemento: 'Sala 101'
    },
    empresa: {
      Nome: 'Empresa ABC Ltda',
      Documento: '12.345.678/0001-90',
      Email: 'contato@empresaabc.com.br',
      Telefone: '(11) 99999-0002'
    },
    vendedor: {
      Nome: 'Vendedor ABC'
    }
  },
  {
    NomeCompleto: 'Tech Solutions S.A.',
    TipoPessoa: 'Jurídica',
    CPF_CNPJ: '23.456.789/0001-01',
    Email: 'admin@techsolutions.com.br',
    TelefoneCelular: '(21) 99999-0004',
    RazaoSocial: 'Tech Solutions S.A.',
    senha: 'Senha@123',
    endereco: {
      CEP: '21000-000',
      Cidade: 'Rio de Janeiro',
      UF: 'RJ',
      Bairro: 'Barra da Tijuca',
      Numero: '101',
      Complemento: 'Torre A'
    },
    empresa: {
      Nome: 'Tech Solutions S.A.',
      Documento: '23.456.789/0001-01',
      Email: 'admin@techsolutions.com.br',
      Telefone: '(21) 99999-0004'
    },
    vendedor: {
      Nome: 'Vendedor Tech'
    }
  },
  {
    NomeCompleto: 'Comércio Geral Ltda',
    TipoPessoa: 'Jurídica',
    CPF_CNPJ: '34.567.890/0001-12',
    Email: 'vendas@comerciogeral.com.br',
    TelefoneCelular: '(31) 99999-0006',
    RazaoSocial: 'Comércio Geral Ltda',
    senha: 'Senha@123',
    endereco: {
      CEP: '31000-000',
      Cidade: 'Belo Horizonte',
      UF: 'MG',
      Bairro: 'Centro',
      Numero: '303',
      Complemento: 'Loja 5'
    },
    empresa: {
      Nome: 'Comércio Geral Ltda',
      Documento: '34.567.890/0001-12',
      Email: 'vendas@comerciogeral.com.br',
      Telefone: '(31) 99999-0006'
    },
    vendedor: {
      Nome: 'Vendedor Geral'
    }
  },
  {
    NomeCompleto: 'Indústria XYZ Ltda',
    TipoPessoa: 'Jurídica',
    CPF_CNPJ: '45.678.901/0001-23',
    Email: 'rh@industriaxyz.com.br',
    TelefoneCelular: '(71) 99999-0008',
    RazaoSocial: 'Indústria XYZ Ltda',
    senha: 'Senha@123',
    endereco: {
      CEP: '41000-000',
      Cidade: 'Salvador',
      UF: 'BA',
      Bairro: 'Imbuí',
      Numero: '505',
      Complemento: 'Galpão 2'
    },
    empresa: {
      Nome: 'Indústria XYZ Ltda',
      Documento: '45.678.901/0001-23',
      Email: 'rh@industriaxyz.com.br',
      Telefone: '(71) 99999-0008'
    },
    vendedor: {
      Nome: 'Vendedor XYZ'
    }
  },
  {
    NomeCompleto: 'Serviços Digitais Ltda',
    TipoPessoa: 'Jurídica',
    CPF_CNPJ: '56.789.012/0001-34',
    Email: 'suporte@servicosdigitais.com.br',
    TelefoneCelular: '(41) 99999-0010',
    RazaoSocial: 'Serviços Digitais Ltda',
    senha: 'Senha@123',
    endereco: {
      CEP: '81000-000',
      Cidade: 'Curitiba',
      UF: 'PR',
      Bairro: 'Centro Cívico',
      Numero: '707',
      Complemento: 'Andar 15'
    },
    empresa: {
      Nome: 'Serviços Digitais Ltda',
      Documento: '56.789.012/0001-34',
      Email: 'suporte@servicosdigitais.com.br',
      Telefone: '(41) 99999-0010'
    },
    vendedor: {
      Nome: 'Vendedor Digital'
    }
  }
];

const sampleProducts = [
  // For Vendor 1: Casa e Decoração, Moda e Acessórios, Beleza e Saúde, Livros e Entretenimento, Eletrônicos
  [
    { Nome: 'Vaso Decorativo', Descricao: 'Vaso para decoração elegante', Preco: 49.90, Estoque: 20, SKU: 'CASA-ABC-001', CategoriaNome: 'Casa e Decoração', Imagens: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'], Desconto: 10, FreteGratis: false },
    { Nome: 'Camiseta Básica', Descricao: 'Camiseta confortável de algodão', Preco: 29.90, Estoque: 100, SKU: 'MODA-ABC-001', CategoriaNome: 'Moda e Acessórios', Imagens: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'], Desconto: 0, FreteGratis: false },
    { Nome: 'Creme Hidratante', Descricao: 'Creme para pele facial', Preco: 25.00, Estoque: 80, SKU: 'BEA-ABC-001', CategoriaNome: 'Beleza e Saúde', Imagens: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400'], Desconto: 15, FreteGratis: true },
    { Nome: 'Livro de Ficção', Descricao: 'Romance emocionante best-seller', Preco: 39.90, Estoque: 30, SKU: 'LIV-ABC-001', CategoriaNome: 'Livros e Entretenimento', Imagens: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'], Desconto: 0, FreteGratis: false },
    { Nome: 'Smartphone XYZ', Descricao: 'Smartphone de última geração', Preco: 1500.00, Estoque: 50, SKU: 'ELE-ABC-001', CategoriaNome: 'Eletrônicos', Imagens: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'], Desconto: 5, FreteGratis: false }
  ],
  // Vendor 2: Beleza e Saúde, Eletrônicos, Livros e Entretenimento, Casa e Decoração, Moda e Acessórios
  [
    { Nome: 'Vitamina C', Descricao: 'Suplemento vitamínico natural', Preco: 45.00, Estoque: 70, SKU: 'BEA-TECH-001', CategoriaNome: 'Beleza e Saúde', Imagens: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'], Desconto: 20, FreteGratis: false },
    { Nome: 'Fone de Ouvido', Descricao: 'Fone sem fio Bluetooth', Preco: 199.90, Estoque: 45, SKU: 'ELE-TECH-001', CategoriaNome: 'Eletrônicos', Imagens: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'], Desconto: 0, FreteGratis: true },
    { Nome: 'Livro Técnico', Descricao: 'Livro sobre programação avançada', Preco: 59.90, Estoque: 25, SKU: 'LIV-TECH-001', CategoriaNome: 'Livros e Entretenimento', Imagens: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400'], Desconto: 10, FreteGratis: false },
    { Nome: 'Jogo de Talheres', Descricao: 'Talheres inox premium', Preco: 39.90, Estoque: 60, SKU: 'CASA-TECH-001', CategoriaNome: 'Casa e Decoração', Imagens: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'], Desconto: 0, FreteGratis: false },
    { Nome: 'Calça Jeans', Descricao: 'Calça jeans confortável', Preco: 89.90, Estoque: 80, SKU: 'MODA-TECH-001', CategoriaNome: 'Moda e Acessórios', Imagens: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'], Desconto: 25, FreteGratis: false }
  ],
  // Vendor 3: Livros e Entretenimento, Casa e Decoração, Eletrônicos, Beleza e Saúde, Moda e Acessórios
  [
    { Nome: 'E-book', Descricao: 'Livro digital interativo', Preco: 9.90, Estoque: 500, SKU: 'LIV-GERAL-001', CategoriaNome: 'Livros e Entretenimento', Imagens: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'], Desconto: 0, FreteGratis: true },
    { Nome: 'Cortina', Descricao: 'Cortina para janela moderna', Preco: 69.90, Estoque: 25, SKU: 'CASA-GERAL-001', CategoriaNome: 'Casa e Decoração', Imagens: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'], Desconto: 30, FreteGratis: false },
    { Nome: 'Tablet', Descricao: 'Tablet Android de alta performance', Preco: 899.90, Estoque: 35, SKU: 'ELE-GERAL-001', CategoriaNome: 'Eletrônicos', Imagens: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400'], Desconto: 15, FreteGratis: false },
    { Nome: 'Shampoo', Descricao: 'Shampoo para cabelos secos', Preco: 12.90, Estoque: 120, SKU: 'BEA-GERAL-001', CategoriaNome: 'Beleza e Saúde', Imagens: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400'], Desconto: 0, FreteGratis: false },
    { Nome: 'Vestido', Descricao: 'Vestido elegante para festas', Preco: 149.90, Estoque: 40, SKU: 'MODA-GERAL-001', CategoriaNome: 'Moda e Acessórios', Imagens: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'], Desconto: 20, FreteGratis: true }
  ],
  // Vendor 4: Eletrônicos, Beleza e Saúde, Casa e Decoração, Livros e Entretenimento, Moda e Acessórios
  [
    { Nome: 'Mouse Gamer', Descricao: 'Mouse óptico para jogos', Preco: 79.90, Estoque: 60, SKU: 'ELE-XYZ-001', CategoriaNome: 'Eletrônicos', Imagens: ['https://images.unsplash.com/photo-1527814050087-3793815479db?w=400'], Desconto: 5, FreteGratis: false },
    { Nome: 'Termômetro', Descricao: 'Termômetro digital infravermelho', Preco: 29.90, Estoque: 50, SKU: 'BEA-XYZ-001', CategoriaNome: 'Beleza e Saúde', Imagens: ['https://images.unsplash.com/photo-1585435557343-3b092031e2bb?w=400'], Desconto: 0, FreteGratis: true },
    { Nome: 'Almofada Decorativa', Descricao: 'Almofada para sofá', Preco: 34.90, Estoque: 75, SKU: 'CASA-XYZ-001', CategoriaNome: 'Casa e Decoração', Imagens: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'], Desconto: 10, FreteGratis: false },
    { Nome: 'Revista de Moda', Descricao: 'Revista mensal de moda', Preco: 19.90, Estoque: 200, SKU: 'LIV-XYZ-001', CategoriaNome: 'Livros e Entretenimento', Imagens: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400'], Desconto: 0, FreteGratis: false },
    { Nome: 'Óculos de Sol', Descricao: 'Óculos de sol estilosos', Preco: 99.90, Estoque: 30, SKU: 'MODA-XYZ-001', CategoriaNome: 'Moda e Acessórios', Imagens: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400'], Desconto: 15, FreteGratis: false }
  ],
  // Vendor 5: Moda e Acessórios, Eletrônicos, Beleza e Saúde, Casa e Decoração, Livros e Entretenimento
  [
    { Nome: 'Bolsa Feminina', Descricao: 'Bolsa de couro sintético', Preco: 129.90, Estoque: 25, SKU: 'MODA-DIG-001', CategoriaNome: 'Moda e Acessórios', Imagens: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'], Desconto: 25, FreteGratis: false },
    { Nome: 'Carregador Portátil', Descricao: 'Power bank de 10000mAh', Preco: 89.90, Estoque: 40, SKU: 'ELE-DIG-001', CategoriaNome: 'Eletrônicos', Imagens: ['https://images.unsplash.com/photo-1609594040184-41ac6e0351a0?w=400'], Desconto: 0, FreteGratis: true },
    { Nome: 'Máscara Facial', Descricao: 'Máscara de hidratação profunda', Preco: 15.90, Estoque: 150, SKU: 'BEA-DIG-001', CategoriaNome: 'Beleza e Saúde', Imagens: ['https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400'], Desconto: 10, FreteGratis: false },
    { Nome: 'Quadro Decorativo', Descricao: 'Quadro abstrato para parede', Preco: 79.90, Estoque: 15, SKU: 'CASA-DIG-001', CategoriaNome: 'Casa e Decoração', Imagens: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'], Desconto: 0, FreteGratis: false },
    { Nome: 'Jogo de Tabuleiro', Descricao: 'Jogo de estratégia familiar', Preco: 49.90, Estoque: 35, SKU: 'LIV-DIG-001', CategoriaNome: 'Livros e Entretenimento', Imagens: ['https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400'], Desconto: 20, FreteGratis: true }
  ]
];

async function createSampleData() {
  console.log('🚀 Iniciando criação de dados de exemplo...');
  console.log('Database URL:', process.env.DATABASE_URL ? 'Set' : 'Not set');

  try {
    // Create categories
    console.log('\n📂 Criando categorias...');
    for (const cat of sampleCategories) {
      const existing = await prisma.categoria.findFirst({ where: { Nome: cat.Nome } });
      if (!existing) {
        await prisma.categoria.create({ data: cat });
        console.log(`✅ Categoria criada: ${cat.Nome}`);
      } else {
        console.log(`⚠️  Categoria ${cat.Nome} já existe`);
      }
    }

    // Create clients
    console.log('\n👥 Criando clientes...');
    for (const [index, clientData] of sampleClients.entries()) {
      try {
        console.log(`📝 Criando cliente ${index + 1}: ${clientData.NomeCompleto}`);

        const clienteExistente = await prisma.cliente.findFirst({
          where: {
            OR: [
              { Email: clientData.Email },
              { CPF_CNPJ: clientData.CPF_CNPJ }
            ]
          }
        });

        if (clienteExistente) {
          console.log(`⚠️  Cliente ${clientData.Email} já existe, pulando...`);
          continue;
        }

        const SenhaHash = await cryptoService.hashPassword(clientData.senha);

        const ultimo = await prisma.cliente.findFirst({
          select: { CodigoCliente: true },
          orderBy: { CodigoCliente: 'desc' }
        });
        const CodigoCliente = (ultimo?.CodigoCliente ?? 1000) + 1;

        const novoCliente = await prisma.cliente.create({
          data: {
            CodigoCliente,
            NomeCompleto: clientData.NomeCompleto.toUpperCase(),
            TipoPessoa: clientData.TipoPessoa,
            CPF_CNPJ: clientData.CPF_CNPJ,
            TelefoneCelular: clientData.TelefoneCelular,
            Email: clientData.Email.toLowerCase(),
            SenhaHash,
            role: 'CLIENTE',
          }
        });

        await prisma.endereco.create({
          data: {
            ClienteID: novoCliente.ClienteID,
            Nome: 'Principal',
            CEP: clientData.endereco.CEP,
            Cidade: clientData.endereco.Cidade.toUpperCase(),
            UF: clientData.endereco.UF.toUpperCase(),
            Bairro: clientData.endereco.Bairro.toUpperCase(),
            Numero: clientData.endereco.Numero,
            Complemento: clientData.endereco.Complemento || null,
          }
        });

        console.log(`✅ Cliente criado: ${clientData.NomeCompleto} (CLIENTE)`);

      } catch (error) {
        console.error(`❌ Erro ao criar cliente ${clientData.NomeCompleto}:`, error.message);
      }
    }

    // Create vendors
    console.log('\n🏪 Criando vendedores...');
    const createdVendors = [];
    for (const [index, vendorData] of sampleVendors.entries()) {
      try {
        console.log(`📝 Criando vendedor ${index + 1}: ${vendorData.NomeCompleto}`);

        const clienteExistente = await prisma.cliente.findFirst({
          where: {
            OR: [
              { Email: vendorData.Email },
              { CPF_CNPJ: vendorData.CPF_CNPJ }
            ]
          }
        });

        if (clienteExistente) {
          console.log(`⚠️  Vendedor ${vendorData.Email} já existe, pulando...`);
          continue;
        }

        const SenhaHash = await cryptoService.hashPassword(vendorData.senha);

        const ultimo = await prisma.cliente.findFirst({
          select: { CodigoCliente: true },
          orderBy: { CodigoCliente: 'desc' }
        });
        const CodigoCliente = (ultimo?.CodigoCliente ?? 1000) + 1;

        const novoCliente = await prisma.cliente.create({
          data: {
            CodigoCliente,
            NomeCompleto: vendorData.NomeCompleto.toUpperCase(),
            TipoPessoa: vendorData.TipoPessoa,
            CPF_CNPJ: vendorData.CPF_CNPJ,
            TelefoneCelular: vendorData.TelefoneCelular,
            Email: vendorData.Email.toLowerCase(),
            RazaoSocial: vendorData.RazaoSocial ? vendorData.RazaoSocial.toUpperCase() : null,
            SenhaHash,
            role: 'VENDEDOR',
          }
        });

        await prisma.endereco.create({
          data: {
            ClienteID: novoCliente.ClienteID,
            Nome: 'Principal',
            CEP: vendorData.endereco.CEP,
            Cidade: vendorData.endereco.Cidade.toUpperCase(),
            UF: vendorData.endereco.UF.toUpperCase(),
            Bairro: vendorData.endereco.Bairro.toUpperCase(),
            Numero: vendorData.endereco.Numero,
            Complemento: vendorData.endereco.Complemento || null,
          }
        });

        // Create Empresa
        const empresa = await prisma.empresa.create({
          data: vendorData.empresa
        });

        // Create Vendedor
        const vendedor = await prisma.vendedor.create({
          data: {
            Nome: vendorData.vendedor.Nome,
            Email: vendorData.Email.toLowerCase(),
            SenhaHash,
            EmpresaID: empresa.EmpresaID,
          }
        });

        // Create EnderecoVendedor
        await prisma.enderecoVendedor.create({
          data: {
            VendedorID: vendedor.VendedorID,
            Nome: 'Principal',
            CEP: vendorData.endereco.CEP,
            Cidade: vendorData.endereco.Cidade.toUpperCase(),
            UF: vendorData.endereco.UF.toUpperCase(),
            Bairro: vendorData.endereco.Bairro.toUpperCase(),
            Numero: vendorData.endereco.Numero,
            Complemento: vendorData.endereco.Complemento || null,
          }
        });

        createdVendors.push(vendedor);
        console.log(`✅ Vendedor criado: ${vendorData.NomeCompleto} (VENDEDOR)`);

      } catch (error) {
        console.error(`❌ Erro ao criar vendedor ${vendorData.NomeCompleto}:`, error.message);
      }
    }

    // Create products for each vendor
    console.log('\n📦 Criando produtos...');
    for (const [vendorIndex, products] of sampleProducts.entries()) {
      const vendedor = createdVendors[vendorIndex];
      if (!vendedor) continue;

      for (const productData of products) {
        try {
          const existingProduct = await prisma.produto.findUnique({
            where: { SKU: productData.SKU }
          });

          if (existingProduct) {
            console.log(`⚠️  Produto ${productData.SKU} já existe, pulando...`);
            continue;
          }

          const categoria = await prisma.categoria.findFirst({
            where: { Nome: productData.CategoriaNome }
          });

          if (!categoria) {
            console.log(`⚠️  Categoria ${productData.CategoriaNome} não encontrada, pulando produto ${productData.Nome}`);
            continue;
          }

          await prisma.produto.create({
            data: {
              Nome: productData.Nome,
              Descricao: productData.Descricao,
              Preco: productData.Preco,
              Estoque: productData.Estoque,
              CategoriaID: categoria.CategoriaID,
              VendedorID: vendedor.VendedorID,
              SKU: productData.SKU,
              Ativo: true,
              Desconto: productData.Desconto,
              FreteGratis: productData.FreteGratis,
              Imagens: productData.Imagens
            }
          });

          console.log(`✅ Produto criado: ${productData.Nome} (SKU: ${productData.SKU})`);

        } catch (error) {
          console.error(`❌ Erro ao criar produto ${productData.Nome}:`, error.message);
        }
      }
    }

    console.log('\n🎉 Criação de dados de exemplo concluída!');

    // Summary
    const totalClientes = await prisma.cliente.count();
    const clientesFisicos = await prisma.cliente.count({ where: { TipoPessoa: 'Física' } });
    const clientesJuridicos = await prisma.cliente.count({ where: { TipoPessoa: 'Jurídica' } });
    const totalProdutos = await prisma.produto.count();
    const totalCategorias = await prisma.categoria.count();

    console.log(`\n📊 Resumo:`);
    console.log(`Total de clientes: ${totalClientes}`);
    console.log(`Pessoas Físicas: ${clientesFisicos}`);
    console.log(`Pessoas Jurídicas: ${clientesJuridicos}`);
    console.log(`Total de produtos: ${totalProdutos}`);
    console.log(`Total de categorias: ${totalCategorias}`);

  } catch (error) {
    console.error('❌ Erro geral na criação de dados:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleData();

export default createSampleData;