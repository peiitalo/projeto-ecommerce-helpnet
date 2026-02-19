// backend/src/scripts/createSampleProducts.js
import prisma from "../config/prisma.js";
import { logger } from "../utils/logger.js";

const sampleProducts = [
  {
    Nome: "Produto Teste Estoque 1",
    Descricao: "Produto para testar controle de estoque",
    Preco: 50.00,
    Estoque: 10,
    CategoriaID: 1,
    SKU: "TEST-ESTOQUE-001",
    Ativo: true
  },
  {
    Nome: "Produto Teste Estoque 2",
    Descricao: "Produto para testar controle de estoque - deve ser desativado",
    Preco: 30.00,
    Estoque: 1,
    CategoriaID: 1,
    SKU: "TEST-ESTOQUE-002",
    Ativo: true
  },
  {
    Nome: "Produto Teste Estoque 3",
    Descricao: "Produto já sem estoque",
    Preco: 25.00,
    Estoque: 0,
    CategoriaID: 1,
    SKU: "TEST-ESTOQUE-003",
    Ativo: false
  }
];

async function createSampleProducts() {
  try {
    logger.info('Iniciando criação de produtos de teste para controle de estoque');

    for (const productData of sampleProducts) {
      // Verificar se produto já existe
      const existingProduct = await prisma.produto.findUnique({
        where: { SKU: productData.SKU }
      });

      if (existingProduct) {
        logger.info(`Produto ${productData.SKU} já existe, pulando...`);
        continue;
      }

      // Verificar se categoria existe
      const categoria = await prisma.categoria.findFirst();
      if (!categoria) {
        logger.error('Nenhuma categoria encontrada. Execute primeiro a criação de categorias.');
        return;
      }

      const product = await prisma.produto.create({
        data: {
          ...productData,
          CategoriaID: categoria.CategoriaID
        }
      });

      logger.info(`Produto criado: ${product.Nome} (SKU: ${product.SKU}, Estoque: ${product.Estoque})`);
    }

    logger.info('Criação de produtos de teste concluída');
  } catch (error) {
    logger.error('Erro ao criar produtos de teste:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createSampleProducts();