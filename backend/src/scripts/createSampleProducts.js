import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createSampleProducts() {
  try {
    console.log('Creating sample products...');

    const products = [
      {
        Nome: 'Fone Bluetooth Noise Cancelling',
        BreveDescricao: 'Fone de ouvido sem fio com cancelamento de ruído ativo',
        Preco: 399.90,
        PrecoOriginal: 499.90,
        Estoque: 50,
        CategoriaID: 1, // Eletrônicos
        SKU: 'FONE-BT-NC-001',
        Desconto: 20,
        FreteGratis: true,
        Imagens: ['https://images.unsplash.com/photo-1518444028785-8f6f1a1a79f0?q=80&w=1200&auto=format&fit=crop'],
        Ativo: true
      },
      {
        Nome: 'Smartphone Android Premium',
        BreveDescricao: 'Smartphone com câmera de 64MP e processador octa-core',
        Preco: 1899.90,
        PrecoOriginal: 2199.90,
        Estoque: 25,
        CategoriaID: 1, // Eletrônicos
        SKU: 'PHONE-ANDROID-001',
        Desconto: 15,
        FreteGratis: true,
        Imagens: ['https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=1200&auto=format&fit=crop'],
        Ativo: true
      },
      {
        Nome: 'Conjunto de Talheres Inox',
        BreveDescricao: 'Conjunto completo de 24 peças em aço inox',
        Preco: 89.90,
        PrecoOriginal: 129.90,
        Estoque: 100,
        CategoriaID: 2, // Casa e Decoração
        SKU: 'TALHERES-INOX-001',
        Desconto: 30,
        FreteGratis: false,
        Imagens: ['https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?q=80&w=1200&auto=format&fit=crop'],
        Ativo: true
      },
      {
        Nome: 'Perfume Importado Feminino',
        BreveDescricao: 'Fragrância floral com notas de jasmim e rosa',
        Preco: 299.90,
        PrecoOriginal: 399.90,
        Estoque: 30,
        CategoriaID: 3, // Beleza e Saúde
        SKU: 'PERFUME-FEM-001',
        Desconto: 25,
        FreteGratis: true,
        Imagens: ['https://images.unsplash.com/photo-1592945403244-b3fbafd7f539?q=80&w=1200&auto=format&fit=crop'],
        Ativo: true
      },
      {
        Nome: 'Tênis Esportivo Masculino',
        BreveDescricao: 'Tênis para corrida com amortecimento avançado',
        Preco: 249.90,
        PrecoOriginal: 349.90,
        Estoque: 40,
        CategoriaID: 5, // Esportes e Lazer
        SKU: 'TENIS-ESPORTIVO-001',
        Desconto: 30,
        FreteGratis: true,
        Imagens: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?q=80&w=1200&auto=format&fit=crop'],
        Ativo: true
      }
    ];

    for (const produto of products) {
      try {
        const result = await prisma.produto.create({
          data: produto
        });
        console.log(`✅ Created product: ${produto.Nome} (ID: ${result.ProdutoID})`);
      } catch (error) {
        if (error.code === 'P2002') {
          console.log(`⚠️  Product '${produto.Nome}' already exists`);
        } else {
          console.error(`❌ Error creating product '${produto.Nome}':`, error.message);
        }
      }
    }

    console.log('Sample products creation completed!');
  } catch (error) {
    console.error('Error in createSampleProducts:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createSampleProducts();