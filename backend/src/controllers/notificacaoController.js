import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Listar notificações do cliente
const listarNotificacoesCliente = async (req, res) => {
  try {
    const clienteId = req.user.id;

    const notificacoes = await prisma.notificacao.findMany({
      where: {
        ClienteID: clienteId
      },
      orderBy: {
        CriadoEm: 'desc'
      }
    });

    res.json({
      success: true,
      notificacoes
    });
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Listar notificações do vendedor
const listarNotificacoesVendedor = async (req, res) => {
  try {
    const vendedorId = req.user.id;

    const notificacoes = await prisma.notificacao.findMany({
      where: {
        VendedorID: vendedorId
      },
      orderBy: {
        CriadoEm: 'desc'
      }
    });

    res.json({
      success: true,
      notificacoes
    });
  } catch (error) {
    console.error('Erro ao listar notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Criar notificação para clientes específicos
const criarNotificacaoClientes = async (req, res) => {
  try {
    const { titulo, mensagem, tipo, clienteIds } = req.body;
    const vendedorId = req.user.id;

    const notificacoes = clienteIds.map(clienteId => ({
      Titulo: titulo,
      Mensagem: mensagem,
      Tipo: tipo || 'info',
      VendedorID: vendedorId,
      ClienteID: clienteId
    }));

    const notificacoesCriadas = await prisma.notificacao.createMany({
      data: notificacoes
    });

    res.json({
      success: true,
      message: `${notificacoesCriadas.count} notificações criadas com sucesso`,
      count: notificacoesCriadas.count
    });
  } catch (error) {
    console.error('Erro ao criar notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Criar notificação para todos os clientes do vendedor
const criarNotificacaoTodosClientes = async (req, res) => {
  try {
    const { titulo, mensagem, tipo } = req.body;
    const vendedorId = req.user.id;

    // Buscar todos os clientes que fizeram pedidos para este vendedor
    const clientes = await prisma.pedido.findMany({
      where: {
        itensPedido: {
          some: {
            produto: {
              VendedorID: vendedorId
            }
          }
        }
      },
      select: {
        ClienteID: true
      },
      distinct: ['ClienteID']
    });

    const clienteIds = clientes.map(c => c.ClienteID);

    if (clienteIds.length === 0) {
      return res.json({
        success: true,
        message: 'Nenhum cliente encontrado para enviar notificação',
        count: 0
      });
    }

    const notificacoes = clienteIds.map(clienteId => ({
      Titulo: titulo,
      Mensagem: mensagem,
      Tipo: tipo || 'info',
      VendedorID: vendedorId,
      ClienteID: clienteId
    }));

    const notificacoesCriadas = await prisma.notificacao.createMany({
      data: notificacoes
    });

    res.json({
      success: true,
      message: `${notificacoesCriadas.count} notificações enviadas para todos os clientes`,
      count: notificacoesCriadas.count
    });
  } catch (error) {
    console.error('Erro ao criar notificações:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Marcar notificação como lida
const marcarComoLida = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const notificacao = await prisma.notificacao.updateMany({
      where: {
        NotificacaoID: parseInt(id),
        [userRole === 'vendedor' ? 'VendedorID' : 'ClienteID']: userId
      },
      data: {
        Lida: true
      }
    });

    if (notificacao.count === 0) {
      return res.status(404).json({
        success: false,
        message: 'Notificação não encontrada'
      });
    }

    res.json({
      success: true,
      message: 'Notificação marcada como lida'
    });
  } catch (error) {
    console.error('Erro ao marcar notificação como lida:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Marcar todas as notificações como lidas
const marcarTodasComoLidas = async (req, res) => {
  try {
    const userId = req.user.id;
    const userRole = req.user.role;

    const notificacoes = await prisma.notificacao.updateMany({
      where: {
        [userRole === 'vendedor' ? 'VendedorID' : 'ClienteID']: userId,
        Lida: false
      },
      data: {
        Lida: true
      }
    });

    res.json({
      success: true,
      message: `${notificacoes.count} notificações marcadas como lidas`,
      count: notificacoes.count
    });
  } catch (error) {
    console.error('Erro ao marcar notificações como lidas:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

// Buscar clientes do vendedor (para enviar notificações específicas)
const buscarClientesVendedor = async (req, res) => {
  try {
    const vendedorId = req.user.id;

    const clientes = await prisma.cliente.findMany({
      where: {
        pedidos: {
          some: {
            itensPedido: {
              some: {
                produto: {
                  VendedorID: vendedorId
                }
              }
            }
          }
        }
      },
      select: {
        ClienteID: true,
        CodigoCliente: true,
        NomeCompleto: true,
        Email: true
      }
    });

    res.json({
      success: true,
      clientes
    });
  } catch (error) {
    console.error('Erro ao buscar clientes:', error);
    res.status(500).json({
      success: false,
      message: 'Erro interno do servidor'
    });
  }
};

export {
  listarNotificacoesCliente,
  listarNotificacoesVendedor,
  criarNotificacaoClientes,
  criarNotificacaoTodosClientes,
  marcarComoLida,
  marcarTodasComoLidas,
  buscarClientesVendedor
};