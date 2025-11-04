// backend/src/scripts/recreateProducts.js
import prisma from '../config/prisma.js';

const vendorEmails = [
  'contato@empresaabc.com.br',
  'admin@techsolutions.com.br',
  'vendas@comerciogeral.com.br',
  'rh@industriaxyz.com.br',
  'suporte@servicosdigitais.com.br'
];

const vendorNames = [
  'Empresa ABC Ltda',
  'Tech Solutions S.A.',
  'Comércio Geral Ltda',
  'Indústria XYZ Ltda',
  'Serviços Digitais Ltda'
];

const sampleProducts = [
  // For Vendor 1: Empresa ABC Ltda - Casa e Decoração, Moda e Acessórios, Beleza e Saúde, Livros e Entretenimento, Eletrônicos
  [
    { Nome: 'Vaso Decorativo Cerâmica', Descricao: 'Vaso decorativo em cerâmica artesanal', Preco: 49.90, Estoque: 20, SKU: 'CASA-ABC-001', CategoriaNome: 'Casa e Decoração', Imagens: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'] },
    { Nome: 'Camiseta Básica Algodão', Descricao: 'Camiseta confortável de algodão 100%', Preco: 29.90, Estoque: 100, SKU: 'MODA-ABC-001', CategoriaNome: 'Moda e Acessórios', Imagens: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400'] },
    { Nome: 'Creme Hidratante Facial', Descricao: 'Creme para pele facial com vitamina E', Preco: 25.00, Estoque: 80, SKU: 'BEA-ABC-001', CategoriaNome: 'Beleza e Saúde', Imagens: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400'] },
    { Nome: 'Livro de Ficção Científica', Descricao: 'Romance emocionante de ficção científica', Preco: 39.90, Estoque: 30, SKU: 'LIV-ABC-001', CategoriaNome: 'Livros e Entretenimento', Imagens: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400'] },
    { Nome: 'Smartphone Android', Descricao: 'Smartphone de última geração com câmera 48MP', Preco: 1500.00, Estoque: 50, SKU: 'ELE-ABC-001', CategoriaNome: 'Eletrônicos', Imagens: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400'] }
  ],
  // Vendor 2: Tech Solutions S.A. - Beleza e Saúde, Eletrônicos, Livros e Entretenimento, Casa e Decoração, Moda e Acessórios
  [
    { Nome: 'Vitamina C Efervescente', Descricao: 'Suplemento vitamínico natural efervescente', Preco: 45.00, Estoque: 70, SKU: 'BEA-TECH-001', CategoriaNome: 'Beleza e Saúde', Imagens: ['https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=400'] },
    { Nome: 'Fone de Ouvido Bluetooth', Descricao: 'Fone sem fio com cancelamento de ruído', Preco: 199.90, Estoque: 45, SKU: 'ELE-TECH-001', CategoriaNome: 'Eletrônicos', Imagens: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400'] },
    { Nome: 'Livro de Programação', Descricao: 'Livro sobre programação avançada em JavaScript', Preco: 59.90, Estoque: 25, SKU: 'LIV-TECH-001', CategoriaNome: 'Livros e Entretenimento', Imagens: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400'] },
    { Nome: 'Jogo de Talheres Inox', Descricao: 'Talheres inox premium para 6 pessoas', Preco: 39.90, Estoque: 60, SKU: 'CASA-TECH-001', CategoriaNome: 'Casa e Decoração', Imagens: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=400'] },
    { Nome: 'Calça Jeans Slim', Descricao: 'Calça jeans confortável modelo slim', Preco: 89.90, Estoque: 80, SKU: 'MODA-TECH-001', CategoriaNome: 'Moda e Acessórios', Imagens: ['https://images.unsplash.com/photo-1542272604-787c3835535d?w=400'] }
  ],
  // Vendor 3: Comércio Geral Ltda - Livros e Entretenimento, Casa e Decoração, Eletrônicos, Beleza e Saúde, Moda e Acessórios
  [
    { Nome: 'E-book Interativo', Descricao: 'Livro digital interativo com exercícios', Preco: 9.90, Estoque: 500, SKU: 'LIV-GERAL-001', CategoriaNome: 'Livros e Entretenimento', Imagens: ['https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=400'] },
    { Nome: 'Cortina Blackout', Descricao: 'Cortina para janela com blackout total', Preco: 69.90, Estoque: 25, SKU: 'CASA-GERAL-001', CategoriaNome: 'Casa e Decoração', Imagens: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'] },
    { Nome: 'Tablet 10 Polegadas', Descricao: 'Tablet Android de alta performance', Preco: 899.90, Estoque: 35, SKU: 'ELE-GERAL-001', CategoriaNome: 'Eletrônicos', Imagens: ['https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400'] },
    { Nome: 'Shampoo Antiqueda', Descricao: 'Shampoo para cabelos com queda', Preco: 12.90, Estoque: 120, SKU: 'BEA-GERAL-001', CategoriaNome: 'Beleza e Saúde', Imagens: ['https://images.unsplash.com/photo-1556228720-195a672e8a03?w=400'] },
    { Nome: 'Vestido Midi Floral', Descricao: 'Vestido elegante para festas', Preco: 149.90, Estoque: 40, SKU: 'MODA-GERAL-001', CategoriaNome: 'Moda e Acessórios', Imagens: ['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=400'] }
  ],
  // Vendor 4: Indústria XYZ Ltda - Eletrônicos, Beleza e Saúde, Casa e Decoração, Livros e Entretenimento, Moda e Acessórios
  [
    { Nome: 'Mouse Gamer RGB', Descricao: 'Mouse óptico para jogos com RGB', Preco: 79.90, Estoque: 60, SKU: 'ELE-XYZ-001', CategoriaNome: 'Eletrônicos', Imagens: ['https://images.unsplash.com/photo-1527814050087-3793815479db?w=400'] },
    { Nome: 'Termômetro Digital', Descricao: 'Termômetro infravermelho digital', Preco: 29.90, Estoque: 50, SKU: 'BEA-XYZ-001', CategoriaNome: 'Beleza e Saúde', Imagens: ['https://images.unsplash.com/photo-1585435557343-3b092031e2bb?w=400'] },
    { Nome: 'Almofada Decorativa', Descricao: 'Almofada para sofá 45x45cm', Preco: 34.90, Estoque: 75, SKU: 'CASA-XYZ-001', CategoriaNome: 'Casa e Decoração', Imagens: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=400'] },
    { Nome: 'Revista de Moda', Descricao: 'Revista mensal de moda e beleza', Preco: 19.90, Estoque: 200, SKU: 'LIV-XYZ-001', CategoriaNome: 'Livros e Entretenimento', Imagens: ['https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400'] },
    { Nome: 'Óculos de Sol Aviador', Descricao: 'Óculos de sol estilo aviador', Preco: 99.90, Estoque: 30, SKU: 'MODA-XYZ-001', CategoriaNome: 'Moda e Acessórios', Imagens: ['https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=400'] }
  ],
  // Vendor 5: Serviços Digitais Ltda - Moda e Acessórios, Eletrônicos, Beleza e Saúde, Casa e Decoração, Livros e Entretenimento
  [
    { Nome: 'Bolsa Feminina Couro', Descricao: 'Bolsa de couro sintético tamanho médio', Preco: 129.90, Estoque: 25, SKU: 'MODA-DIG-001', CategoriaNome: 'Moda e Acessórios', Imagens: ['https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=400'] },
    { Nome: 'Power Bank 10000mAh', Descricao: 'Carregador portátil de alta capacidade', Preco: 89.90, Estoque: 40, SKU: 'ELE-DIG-001', CategoriaNome: 'Eletrônicos', Imagens: ['https://images.unsplash.com/photo-1609594040184-41ac6e0351a0?w=400'] },
    { Nome: 'Máscara Facial Hidratante', Descricao: 'Máscara de hidratação profunda', Preco: 15.90, Estoque: 150, SKU: 'BEA-DIG-001', CategoriaNome: 'Beleza e Saúde', Imagens: ['https://images.unsplash.com/photo-1570194065650-d99fb4bedf0a?w=400'] },
    { Nome: 'Quadro Abstrato', Descricao: 'Quadro decorativo abstrato 50x70cm', Preco: 79.90, Estoque: 15, SKU: 'CASA-DIG-001', CategoriaNome: 'Casa e Decoração', Imagens: ['https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'] },
    { Nome: 'Jogo de Tabuleiro Estratégia', Descricao: 'Jogo de estratégia familiar', Preco: 49.90, Estoque: 35, SKU: 'LIV-DIG-001', CategoriaNome: 'Livros e Entretenimento', Imagens: ['https://images.unsplash.com/photo-1610890716171-6b1bb98ffd09?w=400'] }
  ]
];

async function recreateProducts() {
  console.log('🚀 Iniciando recriação de produtos...');

  try {
    // Delete all existing products
    console.log('\n🗑️  Removendo produtos existentes...');
    await prisma.produto.deleteMany({});
    console.log('✅ Produtos removidos');

    // Get vendors
    const vendors = [];
    for (const email of vendorEmails) {
      const vendedor = await prisma.vendedor.findFirst({
        where: { Email: email }
      });
      if (vendedor) {
        vendors.push(vendedor);
      }
    }

    if (vendors.length !== 5) {
      throw new Error(`Esperava 5 vendedores, encontrou ${vendors.length}`);
    }

    console.log('\n🏪 Vendedores encontrados:');
    vendors.forEach((v, i) => console.log(`  ${i + 1}. ${v.Nome}`));

    // Create products for each vendor
    console.log('\n📦 Criando produtos...');
    for (const [vendorIndex, products] of sampleProducts.entries()) {
      const vendedor = vendors[vendorIndex];
      if (!vendedor) continue;

      for (const productData of products) {
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
            EmpresaID: vendedor.EmpresaID,
            SKU: productData.SKU,
            Imagens: productData.Imagens,
            Ativo: true
          }
        });

        console.log(`✅ Produto criado: ${productData.Nome} (${productData.CategoriaNome}) - ${vendedor.Nome}`);
      }
    }

    console.log('\n🎉 Recriação de produtos concluída!');

    // Summary
    const totalProdutos = await prisma.produto.count();
    const categoriasComProdutos = await prisma.categoria.findMany({
      include: { _count: { select: { produtos: true } } }
    });

    console.log(`\n📊 Resumo:`);
    console.log(`Total de produtos: ${totalProdutos}`);
    console.log('\n📂 Distribuição por categoria:');
    categoriasComProdutos.forEach(cat => {
      console.log(`  - ${cat.Nome}: ${cat._count.produtos} produtos`);
    });

  } catch (error) {
    console.error('❌ Erro na recriação de produtos:', error);
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se chamado diretamente
if (import.meta.url === `file://${process.argv[1]}`) {
  recreateProducts();
}

export default recreateProducts;