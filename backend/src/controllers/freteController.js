// backend/src/controllers/freteController.js
import prisma from "../config/prisma.js";
import { logControllerError, logger } from "../utils/logger.js";

// Função para calcular frete baseado no CEP de destino e produtos
const calcularFrete = async (req, res) => {
  try {
    const { clienteId, enderecoId, produtoIds } = req.body;

    if (!clienteId || !enderecoId || !produtoIds || !Array.isArray(produtoIds)) {
      return res.status(400).json({
        erro: "clienteId, enderecoId e produtoIds (array) são obrigatórios"
      });
    }

    // Buscar endereço do cliente
    const endereco = await prisma.endereco.findFirst({
      where: {
        EnderecoID: parseInt(enderecoId),
        ClienteID: parseInt(clienteId)
      }
    });

    if (!endereco) {
      return res.status(404).json({ erro: "Endereço não encontrado" });
    }

    // Buscar produtos
    const produtos = await prisma.produto.findMany({
      where: {
        ProdutoID: { in: produtoIds.map(id => parseInt(id)) }
      },
      select: {
        ProdutoID: true,
        Nome: true,
        Peso: true,
        Dimensoes: true,
        FreteGratis: true,
        Preco: true
      }
    });

    if (produtos.length === 0) {
      return res.status(404).json({ erro: "Nenhum produto encontrado" });
    }

    // Verificar se todos os produtos têm frete grátis
    const todosFreteGratis = produtos.every(p => p.FreteGratis);

    if (todosFreteGratis) {
      logger.info('frete_calculado_gratis', { clienteId, enderecoId, produtoIds });
      return res.json({
        frete: 0,
        prazo: calcularPrazoEntrega(endereco.CEP),
        tipo: "Frete Grátis",
        detalhes: "Todos os produtos selecionados têm frete grátis"
      });
    }

    // Calcular peso total
    const pesoTotal = produtos.reduce((total, produto) => {
      const peso = parseFloat(produto.Peso) || 1; // peso padrão 1kg se não informado
      return total + peso;
    }, 0);

    // Calcular valor do frete baseado no CEP e peso
    const valorFrete = calcularValorFrete(endereco.CEP, pesoTotal);
    const prazo = calcularPrazoEntrega(endereco.CEP);

    logger.info('frete_calculado', {
      clienteId,
      enderecoId,
      produtoIds,
      pesoTotal,
      valorFrete,
      prazo
    });

    res.json({
      frete: valorFrete,
      prazo,
      tipo: "Frete Padrão",
      detalhes: `Peso total: ${pesoTotal.toFixed(2)}kg`,
      endereco: {
        cep: endereco.CEP,
        cidade: endereco.Cidade,
        uf: endereco.UF
      }
    });

  } catch (error) {
    logControllerError('calcular_frete_error', error, req);
    res.status(500).json({ erro: "Erro interno do servidor" });
  }
};

// Função auxiliar para calcular valor do frete
const calcularValorFrete = (cep, pesoTotal) => {
  // Lógica simplificada de cálculo de frete
  let valorBase = 10; // R$ 10,00 base

  // Ajuste por peso
  if (pesoTotal > 5) valorBase += (pesoTotal - 5) * 2;
  if (pesoTotal > 10) valorBase += (pesoTotal - 10) * 3;

  // Ajuste por região baseado no CEP
  if (cep.startsWith('0')) { // São Paulo
    valorBase *= 0.8; // 20% desconto
  } else if (cep.startsWith('2')) { // Rio de Janeiro
    valorBase *= 0.9; // 10% desconto
  } else if (cep.startsWith('3') || cep.startsWith('4')) { // Minas Gerais
    valorBase *= 1.1; // 10% acréscimo
  } else if (cep.startsWith('8') || cep.startsWith('9')) { // Sul
    valorBase *= 1.2; // 20% acréscimo
  }

  return Math.round(valorBase * 100) / 100; // Arredondar para 2 casas decimais
};

// Função auxiliar para calcular prazo de entrega
const calcularPrazoEntrega = (cep) => {
  if (cep.startsWith('0')) return '1-2 dias úteis';
  if (cep.startsWith('1')) return '2-3 dias úteis';
  if (cep.startsWith('2')) return '2-4 dias úteis';
  if (cep.startsWith('3') || cep.startsWith('4')) return '3-5 dias úteis';
  if (cep.startsWith('5') || cep.startsWith('6')) return '4-6 dias úteis';
  if (cep.startsWith('7')) return '5-7 dias úteis';
  if (cep.startsWith('8') || cep.startsWith('9')) return '6-8 dias úteis';
  return '5-10 dias úteis';
};

export { calcularFrete };