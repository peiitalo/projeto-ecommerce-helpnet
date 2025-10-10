// backend/src/controllers/entregaController.js
import prisma from "../config/prisma.js";
import { logControllerError, logger } from "../utils/logger.js";
import { sendDeliveryStatusEmail } from "../services/emailService.js";

export const criarEntrega = async (req, res) => {
  try {
    const { user } = req;
    const { pedidoId, transportadora, codigoRastreio, previsaoEntrega, observacoes } = req.body;

    // Verificar se o usuário é vendedor
    if (user.role !== 'vendedor' && user.role !== 'VENDEDOR') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Apenas vendedores podem criar entregas."]
      });
    }

    // Verificar se o pedido existe e se o vendedor tem produtos neste pedido
    const pedido = await prisma.pedido.findFirst({
      where: {
        PedidoID: parseInt(pedidoId),
        itensPedido: {
          some: {
            produto: {
              VendedorID: user.vendedorId
            }
          }
        }
      },
      include: {
        cliente: true,
        itensPedido: {
          include: {
            produto: true
          }
        }
      }
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        errors: ["Pedido não encontrado ou você não tem permissão para gerenciá-lo."]
      });
    }

    // Verificar se já existe entrega para este pedido e vendedor
    const entregaExistente = await prisma.entrega.findFirst({
      where: {
        PedidoID: parseInt(pedidoId),
        // Nota: Em produção, pode ser necessário filtrar por vendedor também
      }
    });

    if (entregaExistente) {
      return res.status(400).json({
        success: false,
        errors: ["Já existe uma entrega cadastrada para este pedido."]
      });
    }

    // Criar entrega
    const entrega = await prisma.entrega.create({
      data: {
        PedidoID: parseInt(pedidoId),
        Transportadora: transportadora,
        CodigoRastreio: codigoRastreio,
        PrevisaoEntrega: previsaoEntrega ? new Date(previsaoEntrega) : null,
        Observacoes: observacoes,
        StatusEntrega: 'AguardandoEnvio'
      }
    });

    // Criar rastreamento inicial
    await prisma.rastreamento.create({
      data: {
        EntregaID: entrega.EntregaID,
        Status: 'Pedido processado e aguardando envio',
        Local: 'Centro de distribuição'
      }
    });

    // Notificar cliente sobre a criação da entrega
    await prisma.notificacao.create({
      data: {
        Titulo: 'Entrega Criada',
        Mensagem: `Sua entrega para o pedido #${pedidoId} foi criada. ${codigoRastreio ? `Código de rastreio: ${codigoRastreio}` : ''}`,
        Tipo: 'info',
        ClienteID: pedido.ClienteID
      }
    });

    logger.info('entrega_criada', {
      entregaId: entrega.EntregaID,
      pedidoId,
      vendedorId: user.vendedorId
    });

    res.status(201).json({
      success: true,
      message: 'Entrega criada com sucesso',
      entrega
    });

  } catch (error) {
    logControllerError('criar_entrega_error', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

export const atualizarStatusEntrega = async (req, res) => {
  try {
    const { user } = req;
    const { entregaId } = req.params;
    const { status, local, observacoes } = req.body;

    // Verificar se o usuário é vendedor
    if (user.role !== 'vendedor' && user.role !== 'VENDEDOR') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Apenas vendedores podem atualizar entregas."]
      });
    }

    // Buscar entrega
    const entrega = await prisma.entrega.findFirst({
      where: {
        EntregaID: parseInt(entregaId),
        pedido: {
          itensPedido: {
            some: {
              produto: {
                VendedorID: user.vendedorId
              }
            }
          }
        }
      },
      include: {
        pedido: {
          include: {
            cliente: true
          }
        }
      }
    });

    if (!entrega) {
      return res.status(404).json({
        success: false,
        errors: ["Entrega não encontrada ou você não tem permissão para gerenciá-la."]
      });
    }

    // Atualizar status da entrega
    const entregaAtualizada = await prisma.entrega.update({
      where: { EntregaID: parseInt(entregaId) },
      data: {
        StatusEntrega: status,
        ...(status === 'Enviado' && { DataEnvio: new Date() }),
        ...(status === 'Entregue' && { DataEntrega: new Date() })
      }
    });

    // Criar novo rastreamento
    await prisma.rastreamento.create({
      data: {
        EntregaID: parseInt(entregaId),
        Status: getStatusDescription(status),
        Local: local,
        Observacoes: observacoes
      }
    });

    // Notificar cliente sobre atualização
    await prisma.notificacao.create({
      data: {
        Titulo: 'Atualização de Entrega',
        Mensagem: `Status da entrega do pedido #${entrega.PedidoID} atualizado para: ${getStatusDescription(status)}`,
        Tipo: 'info',
        ClienteID: entrega.pedido.ClienteID
      }
    });

    // Enviar email de atualização de entrega para o cliente
    try {
      await sendDeliveryStatusEmail({
        clienteNome: entrega.pedido.cliente.NomeCompleto,
        email: entrega.pedido.cliente.Email,
        pedidoId: entrega.PedidoID,
        status: getStatusDescription(status),
        codigoRastreio: entrega.CodigoRastreio,
        previsaoEntrega: entrega.PrevisaoEntrega ? new Date(entrega.PrevisaoEntrega).toLocaleDateString('pt-BR') : null,
        local: local || 'Centro de distribuição',
        dataAtualizacao: new Date().toLocaleDateString('pt-BR'),
        showTrackingButton: ['Enviado', 'EmTransito', 'Entregue'].includes(status),
        isDelivered: status === 'Entregue'
      });
      logger.info('email_status_entrega_enviado', { entregaId, status });
    } catch (emailError) {
      logger.warn('erro_email_status_entrega', { entregaId, status, error: emailError.message });
      // Não falhar a atualização por erro no email
    }

    logger.info('status_entrega_atualizado', {
      entregaId,
      novoStatus: status,
      vendedorId: user.vendedorId
    });

    res.json({
      success: true,
      message: 'Status da entrega atualizado com sucesso',
      entrega: entregaAtualizada
    });

  } catch (error) {
    logControllerError('atualizar_status_entrega_error', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

export const buscarEntregaCliente = async (req, res) => {
  try {
    const { user } = req;
    const { pedidoId } = req.params;

    // Parse pedidoId to handle "PED-XX" format
    const parsedPedidoId = pedidoId.startsWith('PED-') ? parseInt(pedidoId.substring(4)) : parseInt(pedidoId);

    console.log('DEBUG: buscarEntregaCliente called', { pedidoId, parsedPedidoId, userId: user?.id });

    // Verificar se o pedido existe e pertence ao cliente
    const pedido = await prisma.pedido.findFirst({
      where: {
        PedidoID: parsedPedidoId,
        ClienteID: user.id
      }
    });

    console.log('DEBUG: Pedido query result', { pedidoFound: !!pedido });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        errors: ["Pedido não encontrado"]
      });
    }

    // Buscar entrega do cliente (se existir)
    let entrega = null;
    try {
      console.log('DEBUG: Querying entrega for pedidoId:', pedidoId, 'parsedPedidoId:', parsedPedidoId);
      entrega = await prisma.entrega.findFirst({
        where: {
          PedidoID: parsedPedidoId
        },
        include: {
          rastreamentos: {
            orderBy: { DataHora: 'desc' }
          }
        }
      });
      console.log('DEBUG: Entrega query successful', { entregaFound: !!entrega });
    } catch (entregaError) {
      console.log('DEBUG: Entrega query error', { code: entregaError.code, message: entregaError.message });
      // Se a tabela Entrega não existir ainda, retornar mensagem apropriada
      if (entregaError.code === 'P2021') {
        return res.json({
          success: true,
          entrega: null,
          message: "Entrega ainda não foi criada para este pedido"
        });
      }
      throw entregaError;
    }

    if (!entrega) {
      return res.json({
        success: true,
        entrega: null,
        message: "Entrega ainda não foi criada para este pedido"
      });
    }

    res.json({
      success: true,
      entrega: {
        ...entrega,
        rastreamentos: entrega.rastreamentos.map(r => ({
          status: r.Status,
          local: r.Local,
          dataHora: r.DataHora,
          observacoes: r.Observacoes
        }))
      }
    });

  } catch (error) {
    console.log('DEBUG: Main catch in buscarEntregaCliente', { message: error.message, stack: error.stack });
    logControllerError('buscar_entrega_cliente_error', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

export const buscarEntregaVendedor = async (req, res) => {
  try {
    const { user } = req;
    const { pedidoId } = req.params;

    // Verificar se o usuário é vendedor
    if (user.role !== 'vendedor' && user.role !== 'VENDEDOR') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Apenas vendedores podem buscar entregas."]
      });
    }

    // Verificar se o pedido existe e o vendedor tem produtos neste pedido
    const pedido = await prisma.pedido.findFirst({
      where: {
        PedidoID: parseInt(pedidoId),
        itensPedido: {
          some: {
            produto: {
              VendedorID: user.vendedorId
            }
          }
        }
      },
      include: {
        cliente: {
          select: {
            NomeCompleto: true,
            Email: true
          }
        }
      }
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        errors: ["Pedido não encontrado ou você não tem permissão para visualizá-lo."]
      });
    }

    // Buscar entrega do pedido com informações completas
    const entrega = await prisma.entrega.findFirst({
      where: {
        PedidoID: parseInt(pedidoId)
      },
      include: {
        pedido: {
          include: {
            cliente: {
              select: {
                NomeCompleto: true,
                Email: true,
                TelefoneCelular: true
              }
            },
            Endereco: {
              select: {
                Cidade: true,
                UF: true,
                Bairro: true,
                Numero: true,
                Complemento: true
              }
            },
            itensPedido: {
              include: {
                produto: {
                  select: {
                    Nome: true,
                    Preco: true,
                    Imagens: true
                  }
                }
              }
            }
          }
        },
        rastreamentos: {
          orderBy: { DataHora: 'desc' }
        }
      }
    });

    if (!entrega) {
      return res.json({
        success: true,
        entrega: null,
        message: "Entrega ainda não foi criada para este pedido"
      });
    }

    res.json({
      success: true,
      entrega: {
        ...entrega,
        rastreamentos: entrega.rastreamentos.map(r => ({
          status: r.Status,
          local: r.Local,
          dataHora: r.DataHora,
          observacoes: r.Observacoes
        }))
      }
    });

  } catch (error) {
    logControllerError('buscar_entrega_vendedor_error', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

export const atualizarStatusEntregaPorPedido = async (req, res) => {
  try {
    const { user } = req;
    const { pedidoId } = req.params;
    const { status } = req.body;

    // Verificar se o usuário é vendedor
    if (user.role !== 'vendedor' && user.role !== 'VENDEDOR') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Apenas vendedores podem atualizar entregas."]
      });
    }

    // Validar status
    const statusValidos = ['AguardandoEnvio', 'Enviado', 'EmTransito', 'SaiuParaEntrega', 'Entregue', 'Cancelado'];
    if (!statusValidos.includes(status)) {
      return res.status(400).json({
        success: false,
        errors: ["Status inválido."]
      });
    }

    // Verificar se o pedido existe e o vendedor tem produtos neste pedido
    const pedido = await prisma.pedido.findFirst({
      where: {
        PedidoID: parseInt(pedidoId),
        itensPedido: {
          some: {
            produto: {
              VendedorID: user.vendedorId
            }
          }
        }
      },
      include: {
        cliente: {
          select: {
            NomeCompleto: true,
            Email: true
          }
        }
      }
    });

    if (!pedido) {
      return res.status(404).json({
        success: false,
        errors: ["Pedido não encontrado ou você não tem permissão para gerenciá-lo."]
      });
    }

    // Buscar ou criar entrega para o pedido
    let entrega = await prisma.entrega.findFirst({
      where: { PedidoID: parseInt(pedidoId) }
    });

    if (!entrega) {
      // Criar entrega se não existir
      entrega = await prisma.entrega.create({
        data: {
          PedidoID: parseInt(pedidoId),
          StatusEntrega: status,
          Observacoes: 'Status atualizado manualmente pelo vendedor'
        }
      });
    } else {
      // Atualizar entrega existente
      entrega = await prisma.entrega.update({
        where: { EntregaID: entrega.EntregaID },
        data: {
          StatusEntrega: status,
          ...(status === 'Entregue' && { DataEntrega: new Date() })
        }
      });
    }

    // Criar rastreamento para o novo status
    await prisma.rastreamento.create({
      data: {
        EntregaID: entrega.EntregaID,
        Status: getStatusDescription(status),
        Local: 'Atualizado pelo vendedor',
        Observacoes: 'Status alterado manualmente'
      }
    });

    // Notificar cliente sobre atualização
    await prisma.notificacao.create({
      data: {
        Titulo: 'Atualização de Entrega',
        Mensagem: `Status da entrega do pedido #${pedidoId} atualizado para: ${getStatusDescription(status)}`,
        Tipo: 'info',
        ClienteID: pedido.ClienteID
      }
    });

    // Enviar email de atualização de entrega para o cliente
    try {
      await sendDeliveryStatusEmail({
        clienteNome: pedido.cliente?.NomeCompleto || 'Cliente',
        email: pedido.cliente?.Email,
        pedidoId: pedidoId,
        status: getStatusDescription(status),
        codigoRastreio: entrega.CodigoRastreio,
        previsaoEntrega: entrega.PrevisaoEntrega ? new Date(entrega.PrevisaoEntrega).toLocaleDateString('pt-BR') : null,
        local: 'Atualizado pelo vendedor',
        dataAtualizacao: new Date().toLocaleDateString('pt-BR'),
        showTrackingButton: ['Enviado', 'EmTransito', 'Entregue'].includes(status),
        isDelivered: status === 'Entregue'
      });
      logger.info('email_status_entrega_por_pedido_enviado', { pedidoId, status });
    } catch (emailError) {
      logger.warn('erro_email_status_entrega_por_pedido', { pedidoId, status, error: emailError.message });
      // Não falhar a atualização por erro no email
    }

    logger.info('status_entrega_atualizado_por_pedido', {
      pedidoId,
      novoStatus: status,
      vendedorId: user.vendedorId
    });

    res.json({
      success: true,
      message: 'Status da entrega atualizado com sucesso',
      entrega
    });

  } catch (error) {
    logControllerError('atualizar_status_entrega_por_pedido_error', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

export const listarEntregasVendedor = async (req, res) => {
  try {
    const { user } = req;
    const { page = 1, limit = 10, status, search } = req.query;
    const skip = (page - 1) * limit;

    // Verificar se o usuário é vendedor
    if (user.role !== 'vendedor' && user.role !== 'VENDEDOR') {
      return res.status(403).json({
        success: false,
        errors: ["Acesso negado. Apenas vendedores podem listar entregas."]
      });
    }

    const whereClause = {
      pedido: {
        itensPedido: {
          some: {
            produto: {
              VendedorID: user.vendedorId
            }
          }
        },
        ...(search && {
          OR: [
            { PedidoID: { contains: search } },
            { cliente: { NomeCompleto: { contains: search, mode: 'insensitive' } } },
            { CodigoRastreio: { contains: search } }
          ]
        })
      },
      ...(status && status !== 'undefined' && { StatusEntrega: status })
    };

    const [entregas, total] = await prisma.$transaction([
      prisma.entrega.findMany({
        where: whereClause,
        include: {
          pedido: {
            include: {
              cliente: {
                select: {
                  NomeCompleto: true,
                  Email: true
                }
              },
              Endereco: {
                select: {
                  Cidade: true,
                  UF: true
                }
              }
            }
          },
          rastreamentos: {
            orderBy: { DataHora: 'desc' },
            take: 1
          }
        },
        orderBy: { CriadoEm: 'desc' },
        skip,
        take: parseInt(limit)
      }),
      prisma.entrega.count({ where: whereClause })
    ]);

    res.json({
      success: true,
      entregas,
      total,
      pagina: parseInt(page),
      limit: parseInt(limit)
    });

  } catch (error) {
    logControllerError('listar_entregas_vendedor_error', error, req);
    res.status(500).json({
      success: false,
      errors: ["Erro interno do servidor"]
    });
  }
};

// Função auxiliar para descrições de status
function getStatusDescription(status) {
  const descriptions = {
    'AguardandoEnvio': 'Aguardando envio',
    'Enviado': 'Enviado para transportadora',
    'EmTransito': 'Em trânsito',
    'Entregue': 'Entregue com sucesso',
    'Cancelado': 'Entrega cancelada'
  };
  return descriptions[status] || status;
}