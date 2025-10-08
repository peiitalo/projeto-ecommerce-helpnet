// backend/src/controllers/freteController.js
import prisma from "../config/prisma.js";
import { logControllerError, logger } from "../utils/logger.js";
import { calcularFrete as calcularFreteService } from "../services/freightService.js";

// Função para calcular frete baseado na distância entre vendedor e cliente
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

    // Buscar produtos para determinar o vendedor
    const produtos = await prisma.produto.findMany({
      where: {
        ProdutoID: { in: produtoIds.map(id => parseInt(id)) }
      },
      select: {
        ProdutoID: true,
        Nome: true,
        VendedorID: true,
        EmpresaID: true,
        FreteGratis: true
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
        opcoes: [{
          id: 'frete-gratis',
          nome: 'Frete Grátis',
          transportadora: 'HelpNet',
          valor: 0,
          prazo: '3-5 dias úteis',
          descricao: 'Todos os produtos selecionados têm frete grátis',
          ativo: true
        }],
        endereco: {
          cep: endereco.CEP,
          cidade: endereco.Cidade,
          uf: endereco.UF
        }
      });
    }

    // Para MVP, assumimos que todos os produtos são do mesmo vendedor
    const primeiroProduto = produtos[0];
    if (!primeiroProduto.VendedorID) {
      return res.status(400).json({ erro: "Produto não possui vendedor associado" });
    }

    if (!primeiroProduto.EmpresaID) {
      return res.status(400).json({ erro: "Produto não possui empresa associada" });
    }

    // Buscar empresa do vendedor para obter CEP de origem
    // Em produção, cada empresa/vendedor teria endereço próprio
    const empresa = await prisma.empresa.findUnique({
      where: { EmpresaID: primeiroProduto.EmpresaID },
      select: { EmpresaID: true, Nome: true }
    });

    if (!empresa) {
      return res.status(404).json({ erro: "Empresa do vendedor não encontrada" });
    }

    // Por enquanto, usa CEP padrão baseado na empresa
    // Em produção, seria necessário campo de endereço na empresa/vendedor
    const cepEmpresa = getCepEmpresaPadrao(empresa.EmpresaID);

    // Calcular opções de frete usando o serviço de frete baseado em distância
    const opcoesFrete = calcularFreteService(cepEmpresa, endereco.CEP);

    logger.info('frete_calculado_opcoes', {
      clienteId,
      enderecoId,
      produtoIds,
      cepEmpresa,
      cepCliente: endereco.CEP,
      opcoes: opcoesFrete.length
    });

    res.json({
      opcoes: opcoesFrete,
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

// Função auxiliar para obter CEP padrão da empresa
const getCepEmpresaPadrao = (empresaId) => {
  // Mapeamento de empresas para CEPs padrão (em produção, cada empresa teria endereço real)
  const cepPorEmpresa = {
    1: '01000000', // São Paulo
    // Adicionar outros mapeamentos conforme necessário
  };

  return cepPorEmpresa[empresaId] || '01000000'; // CEP padrão de São Paulo
};

// Função auxiliar para calcular prazo baseado na distância
const calcularPrazoPorDistancia = (distanciaKm) => {
  if (distanciaKm <= 50) return '1-2 dias úteis';
  if (distanciaKm <= 200) return '2-3 dias úteis';
  if (distanciaKm <= 500) return '3-5 dias úteis';
  if (distanciaKm <= 1000) return '5-7 dias úteis';
  return '7-10 dias úteis';
};

export { calcularFrete };