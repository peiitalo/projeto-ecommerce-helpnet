// backend/src/scripts/createVendorsAndProducts.js
import prisma from '../config/prisma.js';
import cryptoService from '../services/cryptoService.js';

const vendorProducts = {
  // Empresa ABC Ltda
  'contato@empresaabc.com.br': [
    {
      nome: 'Notebook Dell Inspiron 15',
      descricao: 'Notebook com processador Intel Core i5, 8GB RAM, SSD 256GB',
      breveDescricao: 'Notebook completo para trabalho e estudos',
      preco: 2999.99,
      precoOriginal: 3499.99,
      estoque: 15,
      categoriaId: 1, // Eletrônicos
      sku: 'NOTE-DELL-I5-001',
      peso: '2.5',
      dimensoes: '35x25x2',
      marca: 'Dell',
      modelo: 'Inspiron 15 3000',
      cor: 'Preto',
      garantia: '12 meses'
    },
    {
      nome: 'Mouse Óptico Logitech',
      descricao: 'Mouse ergonômico com sensor óptico de alta precisão',
      breveDescricao: 'Mouse confortável para uso prolongado',
      preco: 49.90,
      estoque: 50,
      categoriaId: 1, // Eletrônicos
      sku: 'MOUSE-LOG-M170-001',
      peso: '0.1',
      dimensoes: '10x6x4',
      marca: 'Logitech',
      modelo: 'M170',
      cor: 'Preto',
      garantia: '6 meses'
    },
    {
      nome: 'Teclado Mecânico RGB',
      descricao: 'Teclado mecânico com iluminação RGB personalizável',
      breveDescricao: 'Teclado gamer com switches mecânicos',
      preco: 299.99,
      estoque: 25,
      categoriaId: 1, // Eletrônicos
      sku: 'TECL-MEC-RGB-001',
      peso: '1.2',
      dimensoes: '45x15x3',
      marca: 'Redragon',
      modelo: 'K552',
      cor: 'Preto',
      garantia: '12 meses'
    },
    {
      nome: 'Monitor 24" Full HD',
      descricao: 'Monitor LED 24 polegadas com resolução Full HD',
      breveDescricao: 'Monitor para trabalho e jogos',
      preco: 699.99,
      precoOriginal: 899.99,
      estoque: 12,
      categoriaId: 1, // Eletrônicos
      sku: 'MON-24-FHD-001',
      peso: '3.5',
      dimensoes: '55x40x15',
      marca: 'Samsung',
      modelo: 'S24F350',
      cor: 'Preto',
      garantia: '24 meses'
    },
    {
      nome: 'Fone de Ouvido Bluetooth',
      descricao: 'Fone de ouvido sem fio com cancelamento de ruído',
      breveDescricao: 'Som de alta qualidade com bateria de longa duração',
      preco: 199.99,
      estoque: 30,
      categoriaId: 1, // Eletrônicos
      sku: 'FONE-BT-CANC-001',
      peso: '0.3',
      dimensoes: '20x18x8',
      marca: 'Sony',
      modelo: 'WH-CH510',
      cor: 'Preto',
      garantia: '12 meses'
    }
  ],

  // Tech Solutions S.A.
  'admin@techsolutions.com.br': [
    {
      nome: 'Smartphone Samsung Galaxy A54',
      descricao: 'Smartphone Android com câmera de 50MP e tela AMOLED',
      breveDescricao: 'Celular intermediário com ótimo custo-benefício',
      preco: 1899.99,
      precoOriginal: 2199.99,
      estoque: 20,
      categoriaId: 1, // Eletrônicos
      sku: 'CEL-SAMS-A54-001',
      peso: '0.2',
      dimensoes: '16x8x1',
      marca: 'Samsung',
      modelo: 'Galaxy A54',
      cor: 'Branco',
      garantia: '12 meses'
    },
    {
      nome: 'Carregador Turbo 65W',
      descricao: 'Carregador rápido USB-C com tecnologia Quick Charge',
      breveDescricao: 'Carregamento ultra-rápido para dispositivos móveis',
      preco: 89.90,
      estoque: 40,
      categoriaId: 1, // Eletrônicos
      sku: 'CARREG-TURBO-65W-001',
      peso: '0.15',
      dimensoes: '8x6x3',
      marca: 'Xiaomi',
      modelo: '65W Turbo',
      cor: 'Branco',
      garantia: '6 meses'
    },
    {
      nome: 'Cabo USB-C 2m',
      descricao: 'Cabo USB-C para transferência de dados e carregamento',
      breveDescricao: 'Cabo resistente com alta velocidade de transmissão',
      preco: 29.90,
      estoque: 100,
      categoriaId: 1, // Eletrônicos
      sku: 'CABO-USBC-2M-001',
      peso: '0.05',
      dimensoes: '200x1x1',
      marca: 'Baseus',
      modelo: 'USB-C 2.0',
      cor: 'Preto',
      garantia: '3 meses'
    },
    {
      nome: 'Película de Vidro Temperado',
      descricao: 'Película de proteção para tela de smartphones',
      breveDescricao: 'Proteção completa contra arranhões e quedas',
      preco: 19.90,
      estoque: 80,
      categoriaId: 1, // Eletrônicos
      sku: 'PELICULA-VIDRO-001',
      peso: '0.01',
      dimensoes: '15x8x0.1',
      marca: 'Generic',
      modelo: 'Vidro Temperado',
      cor: 'Transparente',
      garantia: '1 mês'
    },
    {
      nome: 'Capinha Silicone para Celular',
      descricao: 'Capinha protetora em silicone com design elegante',
      breveDescricao: 'Proteção contra impactos e deslizes',
      preco: 39.90,
      estoque: 60,
      categoriaId: 1, // Eletrônicos
      sku: 'CAPINHA-SILICONE-001',
      peso: '0.03',
      dimensoes: '16x8x1',
      marca: 'Generic',
      modelo: 'Silicone Premium',
      cor: 'Rosa',
      garantia: '3 meses'
    }
  ],

  // Comércio Geral Ltda
  'vendas@comerciogeral.com.br': [
    {
      nome: 'Cadeira Gamer Ergonômica',
      descricao: 'Cadeira para jogos com ajuste de altura e inclinação',
      breveDescricao: 'Conforto máximo para longas sessões de jogo',
      preco: 899.99,
      precoOriginal: 1199.99,
      estoque: 8,
      categoriaId: 2, // Móveis
      sku: 'CADEIRA-GAMER-001',
      peso: '18.5',
      dimensoes: '70x65x120',
      marca: 'ThunderX3',
      modelo: 'TGC12',
      cor: 'Preto/Vermelho',
      garantia: '12 meses'
    },
    {
      nome: 'Mesa Escritório Compacta',
      descricao: 'Mesa de escritório em MDF com gavetas integradas',
      breveDescricao: 'Espaço organizado para trabalho em casa',
      preco: 349.99,
      estoque: 15,
      categoriaId: 2, // Móveis
      sku: 'MESA-ESCRITORIO-001',
      peso: '25.0',
      dimensoes: '120x60x75',
      marca: 'Madeira & Cia',
      modelo: 'Office Compact',
      cor: 'Marrom',
      garantia: '18 meses'
    },
    {
      nome: 'Estante Modular 5 Prateleiras',
      descricao: 'Estante modular com 5 prateleiras ajustáveis',
      breveDescricao: 'Organização perfeita para livros e objetos',
      preco: 199.99,
      estoque: 12,
      categoriaId: 2, // Móveis
      sku: 'ESTANTE-MODULAR-001',
      peso: '15.0',
      dimensoes: '80x30x150',
      marca: 'Madeira & Cia',
      modelo: 'Modular 5P',
      cor: 'Branco',
      garantia: '12 meses'
    },
    {
      nome: 'Poltrona de Leitura',
      descricao: 'Poltrona confortável com apoio para pés',
      breveDescricao: 'Relaxamento e leitura com estilo',
      preco: 599.99,
      estoque: 6,
      categoriaId: 2, // Móveis
      sku: 'POLTRONA-LEITURA-001',
      peso: '22.0',
      dimensoes: '80x90x100',
      marca: 'ComfortZone',
      modelo: 'Reader Plus',
      cor: 'Bege',
      garantia: '24 meses'
    },
    {
      nome: 'Tapete Antiderrapante 2x1.5m',
      descricao: 'Tapete macio com base antiderrapante',
      breveDescricao: 'Conforto para os pés e decoração',
      preco: 89.99,
      estoque: 25,
      categoriaId: 3, // Decoração
      sku: 'TAPETE-ANTIDERR-001',
      peso: '3.5',
      dimensoes: '200x150x1',
      marca: 'HomeStyle',
      modelo: 'Soft Floor 2x1.5',
      cor: 'Cinza',
      garantia: '6 meses'
    }
  ],

  // Indústria XYZ Ltda
  'rh@industriaxyz.com.br': [
    {
      nome: 'Furadeira Elétrica 500W',
      descricao: 'Furadeira profissional com velocidade variável',
      breveDescricao: 'Ferramenta essencial para projetos DIY',
      preco: 149.99,
      estoque: 18,
      categoriaId: 4, // Ferramentas
      sku: 'FURADEIRA-500W-001',
      peso: '2.1',
      dimensoes: '30x25x10',
      marca: 'Bosch',
      modelo: 'GSB 500',
      cor: 'Azul',
      garantia: '12 meses'
    },
    {
      nome: 'Jogo de Chaves Allen',
      descricao: 'Conjunto completo de chaves allen em aço temperado',
      breveDescricao: '9 peças para montagem e desmontagem',
      preco: 24.90,
      estoque: 45,
      categoriaId: 4, // Ferramentas
      sku: 'CHAVES-ALLEN-9PC-001',
      peso: '0.3',
      dimensoes: '15x10x2',
      marca: 'Tramontina',
      modelo: 'Allen Set 9pc',
      cor: 'Cromado',
      garantia: '6 meses'
    },
    {
      nome: 'Parafusadeira a Bateria',
      descricao: 'Parafusadeira sem fio com bateria de lítio',
      breveDescricao: 'Agilidade e praticidade em trabalhos manuais',
      preco: 199.99,
      estoque: 22,
      categoriaId: 4, // Ferramentas
      sku: 'PARAFUSADEIRA-BAT-001',
      peso: '1.8',
      dimensoes: '25x20x8',
      marca: 'Black+Decker',
      modelo: 'BDC120',
      cor: 'Verde',
      garantia: '18 meses'
    },
    {
      nome: 'Caixa de Ferramentas 20"',
      descricao: 'Caixa organizadora com múltiplos compartimentos',
      breveDescricao: 'Organização completa para suas ferramentas',
      preco: 79.99,
      estoque: 30,
      categoriaId: 4, // Ferramentas
      sku: 'CAIXA-FERRAM-20-001',
      peso: '2.5',
      dimensoes: '50x25x20',
      marca: 'Stanley',
      modelo: 'Tool Box 20"',
      cor: 'Preto',
      garantia: '12 meses'
    },
    {
      nome: 'Serra Circular 7-1/4"',
      descricao: 'Serra circular profissional para cortes precisos',
      breveDescricao: 'Potência e precisão para trabalhos pesados',
      preco: 349.99,
      estoque: 10,
      categoriaId: 4, // Ferramentas
      sku: 'SERRA-CIRCULAR-001',
      peso: '4.2',
      dimensoes: '35x30x15',
      marca: 'Makita',
      modelo: 'HS7100',
      cor: 'Azul',
      garantia: '24 meses'
    }
  ],

  // Serviços Digitais Ltda
  'suporte@servicosdigitais.com.br': [
    {
      nome: 'Roteador Wi-Fi 6 Dual Band',
      descricao: 'Roteador de alta velocidade com Wi-Fi 6 e cobertura ampla',
      breveDescricao: 'Conexão ultrarrápida para toda a casa',
      preco: 299.99,
      precoOriginal: 399.99,
      estoque: 14,
      categoriaId: 1, // Eletrônicos
      sku: 'ROTEADOR-WIFI6-001',
      peso: '0.8',
      dimensoes: '20x15x8',
      marca: 'TP-Link',
      modelo: 'Archer AX55',
      cor: 'Preto',
      garantia: '24 meses'
    },
    {
      nome: 'Cabo de Rede Cat6 10m',
      descricao: 'Cabo Ethernet categoria 6 para alta velocidade',
      breveDescricao: 'Conexão estável e rápida para rede',
      preco: 19.90,
      estoque: 75,
      categoriaId: 1, // Eletrônicos
      sku: 'CABO-CAT6-10M-001',
      peso: '0.2',
      dimensoes: '1000x0.5x0.5',
      marca: 'Generic',
      modelo: 'Cat6 10m',
      cor: 'Azul',
      garantia: '6 meses'
    },
    {
      nome: 'Switch Gigabit 8 Portas',
      descricao: 'Switch de rede com 8 portas Gigabit Ethernet',
      breveDescricao: 'Expansão de rede para múltiplos dispositivos',
      preco: 149.99,
      estoque: 20,
      categoriaId: 1, // Eletrônicos
      sku: 'SWITCH-8PORTAS-001',
      peso: '0.6',
      dimensoes: '15x10x3',
      marca: 'TP-Link',
      modelo: 'TL-SG108',
      cor: 'Preto',
      garantia: '36 meses'
    },
    {
      nome: 'Adaptador USB-C para HDMI',
      descricao: 'Conversor USB-C para HDMI 4K com suporte a áudio',
      breveDescricao: 'Conecte seu laptop à TV ou monitor',
      preco: 79.90,
      estoque: 35,
      categoriaId: 1, // Eletrônicos
      sku: 'ADAPT-USBC-HDMI-001',
      peso: '0.05',
      dimensoes: '8x3x1',
      marca: 'Baseus',
      modelo: 'USB-C to HDMI',
      cor: 'Prata',
      garantia: '12 meses'
    },
    {
      nome: 'Hub USB 4 Portas',
      descricao: 'Hub USB com 4 portas USB 3.0 e cartão SD',
      breveDescricao: 'Expansão de portas para seu computador',
      preco: 49.90,
      estoque: 40,
      categoriaId: 1, // Eletrônicos
      sku: 'HUB-USB-4PORTAS-001',
      peso: '0.1',
      dimensoes: '10x5x2',
      marca: 'Generic',
      modelo: 'USB Hub 4x',
      cor: 'Preto',
      garantia: '6 meses'
    }
  ]
};

async function createVendorsAndProducts() {
  console.log('🚀 Iniciando criação de vendedores e produtos...');

  try {
    // Primeiro, garantir que as categorias existem
    const categoriasExistentes = await prisma.categoria.findMany();
    if (categoriasExistentes.length === 0) {
      console.log('📂 Criando categorias básicas...');
      await prisma.categoria.createMany({
        data: [
          { Nome: 'Eletrônicos' },
          { Nome: 'Móveis' },
          { Nome: 'Decoração' },
          { Nome: 'Ferramentas' }
        ]
      });
      console.log('✅ Categorias criadas!');
    }

    // Para cada vendedor, criar os produtos
    for (const [email, products] of Object.entries(vendorProducts)) {
      console.log(`\n🏪 Processando vendedor: ${email}`);

      // Buscar cliente
      const cliente = await prisma.cliente.findUnique({
        where: { Email: email },
        select: {
          ClienteID: true,
          NomeCompleto: true,
          TipoPessoa: true
        }
      });

      if (!cliente) {
        console.log(`❌ Cliente ${email} não encontrado, pulando...`);
        continue;
      }

      // Buscar vendedor associado
      let vendedor = await prisma.vendedor.findUnique({
        where: { Email: email },
        select: {
          VendedorID: true,
          EmpresaID: true
        }
      });

      let vendedorId = vendedor?.VendedorID;
      let empresaId = vendedor?.EmpresaID;

      if (!vendedorId) {
        console.log(`🔧 Criando vínculo de vendedor para ${email}...`);

        // Garantir empresa
        let empresa = await prisma.empresa.findUnique({
          where: { Documento: 'MVP-DEFAULT' },
          select: { EmpresaID: true }
        });
        if (!empresa) {
          empresa = await prisma.empresa.create({
            data: { Nome: 'Empresa MVP', Documento: 'MVP-DEFAULT' },
            select: { EmpresaID: true }
          });
        }

        // Criar vendedor
        const novoVendedor = await prisma.vendedor.create({
          data: {
            Nome: cliente.NomeCompleto,
            Email: email,
            SenhaHash: 'placeholder', // será atualizado depois
            EmpresaID: empresa.EmpresaID,
          },
          select: { VendedorID: true, EmpresaID: true }
        });

        vendedorId = novoVendedor.VendedorID;
        empresaId = novoVendedor.EmpresaID;

        console.log(`✅ Vendedor criado: ID ${vendedorId}, Empresa ID ${empresaId}`);
      }

      // Criar produtos para este vendedor
      console.log(`📦 Criando ${products.length} produtos para ${cliente.NomeCompleto}...`);

      for (const [index, productData] of products.entries()) {
        try {
          // Gerar SKU único se necessário
          let sku = productData.sku;
          let contador = 1;
          while (await prisma.produto.findUnique({ where: { SKU: sku } })) {
            sku = `${productData.sku}-${contador}`;
            contador++;
          }

          const produto = await prisma.produto.create({
            data: {
              Nome: productData.nome,
              Descricao: productData.descricao,
              BreveDescricao: productData.breveDescricao,
              Preco: productData.preco,
              PrecoOriginal: productData.precoOriginal || null,
              Estoque: productData.estoque,
              CategoriaID: productData.categoriaId,
              EmpresaID: empresaId,
              VendedorID: vendedorId,
              SKU: sku,
              Peso: productData.peso,
              Dimensoes: productData.dimensoes,
              Marca: productData.marca,
              Modelo: productData.modelo,
              Cor: productData.cor,
              Garantia: productData.garantia,
              Origem: 'Nacional',
              Condicao: 'Novo',
              FreteGratis: false,
              Desconto: 0,
              Ativo: true,
              Imagens: []
            }
          });

          console.log(`  ✅ ${index + 1}. ${productData.nome} (SKU: ${sku})`);

        } catch (error) {
          console.error(`  ❌ Erro ao criar produto ${productData.nome}:`, error.message);
        }
      }
    }

    console.log('\n🎉 Criação de vendedores e produtos concluída!');

    // Estatísticas finais
    const totalProdutos = await prisma.produto.count();
    const vendedores = await prisma.vendedor.count();
    const empresas = await prisma.empresa.count();

    console.log(`\n📊 Estatísticas:`);
    console.log(`Vendedores: ${vendedores}`);
    console.log(`Empresas: ${empresas}`);
    console.log(`Produtos criados: ${totalProdutos}`);

    // Mostrar produtos por vendedor
    console.log(`\n📦 Produtos por vendedor:`);
    for (const email of Object.keys(vendorProducts)) {
      const cliente = await prisma.cliente.findUnique({
        where: { Email: email },
        select: { NomeCompleto: true, vendedor: { select: { VendedorID: true } } }
      });

      if (cliente?.vendedor?.VendedorID) {
        const produtosCount = await prisma.produto.count({
          where: { VendedorID: cliente.vendedor.VendedorID }
        });
        console.log(`${cliente.NomeCompleto}: ${produtosCount} produtos`);
      }
    }

  } catch (error) {
    console.error('❌ Erro geral:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  createVendorsAndProducts();
}

export default createVendorsAndProducts;