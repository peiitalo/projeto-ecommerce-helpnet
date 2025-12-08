// backend/src/controllers/freteController.js
import prisma from "../config/prisma.js";
import { logControllerError, logger } from "../utils/logger.js";
import { calcularFrete as calcularFreteService, validarCEP } from "../services/freightService.js";

// Função para calcular frete baseado na distância entre vendedor e cliente
const calcularFrete = async (req, res) => {
  try {
    const { clienteId, enderecoId, produtoIds } = req.body;

    logger.info('frete_calculo_request', {
      rawBody: req.body,
      clienteId: clienteId,
      enderecoId: enderecoId,
      produtoIds: produtoIds,
      clienteIdType: typeof clienteId,
      enderecoIdType: typeof enderecoId,
      produtoIdsType: typeof produtoIds,
      produtoIdsIsArray: Array.isArray(produtoIds)
    });

    if (!clienteId || !enderecoId || !produtoIds || !Array.isArray(produtoIds)) {
      logger.error('frete_calculo_validacao_falhou', {
        clienteId: !!clienteId,
        enderecoId: !!enderecoId,
        produtoIds: !!produtoIds,
        produtoIdsIsArray: Array.isArray(produtoIds)
      });
      return res.status(400).json({
        erro: "clienteId, enderecoId e produtoIds (array) são obrigatórios"
      });
    }

    // Buscar endereço do cliente
    logger.info('frete_calculo_iniciado', {
      clienteId,
      enderecoId,
      produtoIds,
      parsedClienteId: parseInt(clienteId),
      parsedEnderecoId: parseInt(enderecoId),
      parsedProdutoIds: produtoIds.map(id => parseInt(id))
    });

    // Primeiro verificar se o cliente existe
    const cliente = await prisma.cliente.findUnique({
      where: { ClienteID: parseInt(clienteId) },
      select: { ClienteID: true, NomeCompleto: true }
    });

    logger.info('cliente_verificado', {
      clienteEncontrado: !!cliente,
      clienteId: parseInt(clienteId),
      clienteNome: cliente?.NomeCompleto
    });

    if (!cliente) {
      logger.error('cliente_nao_encontrado', { clienteId: parseInt(clienteId) });
      return res.status(404).json({ erro: "Cliente não encontrado" });
    }

    // Verificar se o endereço existe para este cliente
    const endereco = await prisma.endereco.findFirst({
      where: {
        EnderecoID: parseInt(enderecoId),
        ClienteID: parseInt(clienteId)
      }
    });

    logger.info('endereco_encontrado', {
      enderecoEncontrado: !!endereco,
      enderecoId: parseInt(enderecoId),
      clienteId: parseInt(clienteId),
      enderecoData: endereco ? {
        EnderecoID: endereco.EnderecoID,
        ClienteID: endereco.ClienteID,
        CEP: endereco.CEP,
        Cidade: endereco.Cidade,
        UF: endereco.UF
      } : null
    });

    if (!endereco) {
      logger.error('endereco_nao_encontrado', {
        clienteId: parseInt(clienteId),
        enderecoId: parseInt(enderecoId),
        produtoIds
      });
      return res.status(404).json({ erro: "Endereço não encontrado" });
    }

    // Validar CEP do cliente
    if (!endereco.CEP || !validarCEP(endereco.CEP)) {
      logger.error('cep_cliente_invalido', {
        cep: endereco.CEP,
        enderecoId: parseInt(enderecoId),
        clienteId: parseInt(clienteId),
        produtoIds
      });
      return res.status(400).json({ erro: "CEP do endereço é inválido ou não informado" });
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

    // Verificar produtos com dados de vendedor faltando
    const produtosComProblemas = produtos.filter(p => !p.EmpresaID || !p.VendedorID);
    if (produtosComProblemas.length > 0) {
      logger.error('produtos_com_dados_vendedor_faltando', {
        produtosComProblemas: produtosComProblemas.map(p => ({
          ProdutoID: p.ProdutoID,
          Nome: p.Nome,
          VendedorID: p.VendedorID,
          EmpresaID: p.EmpresaID
        })),
        clienteId,
        enderecoId,
        produtoIds
      });
    }

    // Filtrar apenas produtos que NÃO têm frete grátis e têm dados de vendedor válidos para cálculo
    const produtosQuePagamFrete = produtos.filter(p => !p.FreteGratis && p.EmpresaID && p.VendedorID);

    // Se nenhum produto paga frete (todos têm frete grátis), retornar frete grátis
    if (produtosQuePagamFrete.length === 0) {
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

    // Usar apenas os produtos que pagam frete para determinar o vendedor/empresa
    if (produtosQuePagamFrete.length === 0) {
      logger.info('nenhum_produto_valido_para_frete', { clienteId, enderecoId, produtoIds });
      return res.json({
        opcoes: [{
          id: 'frete-gratis',
          nome: 'Frete Grátis',
          transportadora: 'HelpNet',
          valor: 0,
          prazo: '3-5 dias úteis',
          descricao: 'Produtos sem informações válidas de frete',
          ativo: true
        }],
        endereco: {
          cep: endereco.CEP,
          cidade: endereco.Cidade,
          uf: endereco.UF
        }
      });
    }

    const primeiroProduto = produtosQuePagamFrete[0];

    // Verificar se todos os produtos que pagam frete são da mesma empresa
    const empresasUnicas = [...new Set(produtosQuePagamFrete.map(p => p.EmpresaID))];
    const vendedoresUnicos = [...new Set(produtosQuePagamFrete.map(p => p.VendedorID))];

    logger.info('produtos_frete_analise', {
      totalProdutosFrete: produtosQuePagamFrete.length,
      empresasUnicas: empresasUnicas.length,
      empresasIds: empresasUnicas,
      vendedoresUnicos: vendedoresUnicos.length,
      vendedoresIds: vendedoresUnicos,
      assumindoEmpresa: primeiroProduto.EmpresaID,
      assumindoVendedor: primeiroProduto.VendedorID
    });

    if (empresasUnicas.length > 1) {
      logger.warn('multi_seller_cart_detectado_calculando_com_primeiro', {
        clienteId,
        enderecoId,
        produtoIds,
        empresasUnicas,
        vendedoresUnicos,
        empresaUsada: primeiroProduto.EmpresaID
      });
    }

    // Produtos já filtrados para ter EmpresaID e VendedorID

    // Buscar empresa do vendedor para obter CEP de origem
    // Em produção, cada empresa/vendedor teria endereço próprio
    const empresa = await prisma.empresa.findUnique({
      where: { EmpresaID: primeiroProduto.EmpresaID },
      select: { EmpresaID: true, Nome: true }
    });

    let cepEmpresa;
    if (!empresa) {
      logger.warn('empresa_nao_encontrada_usando_cep_padrao', {
        empresaId: primeiroProduto.EmpresaID,
        clienteId,
        enderecoId,
        produtoIds
      });
      cepEmpresa = '01000000'; // CEP padrão de São Paulo
    } else {
      // Por enquanto, usa CEP padrão baseado na empresa
      // Em produção, seria necessário campo de endereço na empresa/vendedor
      cepEmpresa = getCepEmpresaPadrao(empresa.EmpresaID);
    }

    logger.info('ceps_usados_calculo', {
      clienteId,
      enderecoId,
      produtoIds,
      cepEmpresa,
      cepCliente: endereco.CEP,
      empresaId: empresa.EmpresaID,
      empresaNome: empresa.Nome
    });

    // Calcular opções de frete usando o serviço de frete baseado em distância
    const opcoesFrete = calcularFreteService(cepEmpresa, endereco.CEP);

    logger.info('frete_calculado_opcoes', {
      clienteId,
      enderecoId,
      produtoIds,
      cepEmpresa,
      cepCliente: endereco.CEP,
      opcoes: opcoesFrete.length,
      opcoesDetalhes: opcoesFrete.map(o => ({ id: o.id, valor: o.valor, prazo: o.prazo }))
    });

    if (opcoesFrete.length === 0) {
      logger.error('opcoes_frete_vazias', {
        clienteId,
        enderecoId,
        produtoIds,
        cepEmpresa,
        cepCliente: endereco.CEP
      });
    }

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
    1: '01000000', // São Paulo - Empresa ABC Ltda
    2: '20000000', // Rio de Janeiro - Tech Solutions S.A.
    3: '30000000', // Belo Horizonte - Comércio Geral Ltda
    4: '40000000', // Salvador - Indústria XYZ Ltda
    5: '80000000', // Curitiba - Serviços Digitais Ltda
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