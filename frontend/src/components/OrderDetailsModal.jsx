import { useState, useEffect } from 'react';
import { FaTimes, FaEye, FaSpinner, FaReceipt, FaBox, FaTruck, FaCheck, FaClock, FaMapMarkerAlt, FaShippingFast, FaPrint } from 'react-icons/fa';
import { clienteService } from '../services/api';
import { FiX } from 'react-icons/fi'
import api from '../services/api';
import entregaApi from '../services/entregaApi';

const OrderDetailsModal = ({ orderId, isOpen, onClose, isAdmin = false }) => {
   const [order, setOrder] = useState(null);
   const [delivery, setDelivery] = useState(null);
   const [loading, setLoading] = useState(false);
   const [error, setError] = useState(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchOrderDetails();
    }
  }, [isOpen, orderId]);

  const fetchOrderDetails = async () => {
     if (!orderId) return;

     setLoading(true);
     setError(null);

     try {
       let response;
       if (isAdmin) {
         response = await api.get(`/admin/pedidos/${orderId}`);
         if (response.success) {
           setOrder(response.pedido);
         } else {
           throw new Error(response.errors?.[0] || 'Erro ao carregar pedido');
         }
       } else {
         response = await clienteService.buscarPedido(orderId);
         setOrder(response.pedido);
       }

       // Fetch delivery tracking data for client orders
       // This provides tracking information including status updates and timeline
       if (!isAdmin) {
         try {
           const deliveryResponse = await entregaApi.buscarEntregaCliente(orderId);
           if (deliveryResponse.success) {
             setDelivery(deliveryResponse.entrega);
           }
         } catch (deliveryErr) {
           console.warn('Erro ao buscar dados de entrega:', deliveryErr);
           // Don't set error for delivery, just log - delivery is optional
         }
       }

       // Debug logs to inspect received data
       console.log('OrderDetailsModal - Order data:', order);
       console.log('OrderDetailsModal - Delivery data:', delivery);
     } catch (err) {
       console.error('Erro ao buscar detalhes do pedido:', err);
       setError('Erro ao carregar detalhes do pedido');
     } finally {
       setLoading(false);
     }
   };

  const handleClose = () => {
    setOrder(null);
    setDelivery(null);
    setError(null);
    onClose();
  };


  const formatPrice = (price) => {
    if (price == null || isNaN(price)) {
      return 'R$ 0,00';
    }
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };


  if (!isOpen) return null;

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <FaSpinner className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
                <p className="text-slate-600">Carregando detalhes do pedido...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
        <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
          <div className="p-6">
            <div className="text-center py-12">
              <p className="text-red-600 mb-4">{error}</p>
              <button
                onClick={fetchOrderDetails}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Tentar novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) return null;

  const formattedOrder = {
    id: `PED-${order.PedidoID}`,
    date: order.DataPedido,
    status: order.Status,
    total: parseFloat(order.Total),
    clientName: order.cliente?.Nome || order.Cliente?.Nome || 'Cliente',
    items: order.itensPedido.map(item => ({
      name: item.produto.Nome,
      quantity: item.Quantidade,
      price: parseFloat(item.PrecoUnitario),
      seller: item.produto.vendedor ? item.produto.vendedor.Nome : 'N/A',
      sellerId: item.produto.vendedor?.VendedorID || null,
      image: item.produto.ImagemPrincipal || '/placeholder-image.png'
    })),
    sellers: [...new Set(order.itensPedido.map(item => item.produto.vendedor?.Nome).filter(Boolean))],
    address: {
      name: order.Endereco?.Nome || 'Endereço não informado',
      street: order.Endereco?.Logradouro && order.Endereco?.Numero
        ? `${order.Endereco.Logradouro}, ${order.Endereco.Numero}`
        : 'Endereço não informado',
      city: order.Endereco?.Cidade && order.Endereco?.UF
        ? `${order.Endereco.Cidade} - ${order.Endereco.UF}`
        : 'Cidade não informada',
      cep: order.Endereco?.CEP || 'CEP não informado'
    },
    paymentMethod: order.pagamentosPedido?.[0]?.MetodoPagamento?.Nome || 'Método não informado',
    paymentDetails: order.pagamentosPedido?.map(pagamento => ({
      method: pagamento.MetodoPagamento?.Nome || 'N/A',
      amount: parseFloat(pagamento.Valor || 0),
      installments: pagamento.Parcelas || 1
    })) || []
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-slate-900">Comprovante - Pedido {formattedOrder.id}</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const printWindow = window.open('', '_blank');
                  const receiptHTML = `
                    <html>
                      <head>
                        <title>Comprovante - Pedido ${formattedOrder.id}</title>
                        <style>
                          body { font-family: Arial, sans-serif; margin: 20px; }
                          .header { text-align: center; border-bottom: 2px solid #000; padding-bottom: 10px; margin-bottom: 20px; }
                          .info { margin-bottom: 20px; }
                          .info div { margin-bottom: 10px; }
                          .items { margin-bottom: 20px; }
                          .items table { width: 100%; border-collapse: collapse; }
                          .items th, .items td { border: 1px solid #ddd; padding: 8px; text-align: left; }
                          .total { font-weight: bold; text-align: right; }
                          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #666; }
                        </style>
                      </head>
                      <body>
                        <div class="header">
                          <h1>HelpNet - Comprovante de Compra</h1>
                          <h2>Pedido ${formattedOrder.id}</h2>
                        </div>

                        <div class="info">
                          <div><strong>Data da Compra:</strong> ${formatDate(formattedOrder.date)}</div>
                          <div><strong>Status do Pedido:</strong> ${formattedOrder.status}</div>
                          <div><strong>Cliente:</strong> ${formattedOrder.clientName}</div>
                          <div><strong>Método de Pagamento:</strong> ${formattedOrder.paymentMethod}</div>
                        </div>

                        <div class="items">
                          <h3>Produtos Comprados</h3>
                          <table>
                            <thead>
                              <tr>
                                <th>Produto</th>
                                <th>Quantidade</th>
                                <th>Preço Unitário</th>
                                <th>Total</th>
                                <th>Vendedor</th>
                              </tr>
                            </thead>
                            <tbody>
                              ${formattedOrder.items.map(item => `
                                <tr>
                                  <td>${item.name}</td>
                                  <td>${item.quantity}</td>
                                  <td>${formatPrice(item.price)}</td>
                                  <td>${formatPrice(item.price * item.quantity)}</td>
                                  <td>${item.seller}</td>
                                </tr>
                              `).join('')}
                            </tbody>
                          </table>
                          <div class="total">
                            <strong>Valor Total: ${formatPrice(formattedOrder.total)}</strong>
                          </div>
                        </div>

                        <div class="info">
                          <h3>Endereço de Entrega</h3>
                          <div>${formattedOrder.address.name}</div>
                          <div>${formattedOrder.address.street}</div>
                          <div>${formattedOrder.address.city}</div>
                          <div>CEP: ${formattedOrder.address.cep}</div>
                        </div>

                        <div class="footer">
                          <p>Este é um comprovante oficial da HelpNet. Data de emissão: ${new Date().toLocaleDateString('pt-BR')}</p>
                        </div>
                      </body>
                    </html>
                  `;

                  printWindow.document.write(receiptHTML);
                  printWindow.document.close();
                  printWindow.print();
                }}
                className="flex items-center gap-2 px-3 py-2 text-blue-600 hover:bg-blue-50 rounded-lg border border-blue-200"
                title="Imprimir comprovante"
              >
                <FaPrint />
                <span className="hidden sm:inline">Imprimir</span>
              </button>
              <button
                onClick={handleClose}
                className="p-2 rounded-lg text-slate-600 hover:bg-slate-50"
              >
                <FiX />
              </button>
            </div>
          </div>
        </div>
        <div className="p-6 space-y-6">
          {/* Cabeçalho do comprovante */}
          <div className="text-center border-b border-slate-200 pb-4">
            <h3 className="text-lg font-bold text-slate-900">HelpNet</h3>
            <p className="text-sm text-slate-600">Comprovante de Compra</p>
            <p className="text-sm font-medium text-slate-900">Pedido {formattedOrder.id}</p>
          </div>

          {/* Informações do pedido */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="font-medium text-slate-900">Data da Compra</p>
              <p className="text-slate-600">{formatDate(formattedOrder.date)}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Status do Pedido</p>
              <p className="text-slate-600">{formattedOrder.status}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Cliente</p>
              <p className="text-slate-600">{formattedOrder.clientName}</p>
            </div>
            <div>
              <p className="font-medium text-slate-900">Método de Pagamento</p>
              <p className="text-slate-600">{formattedOrder.paymentMethod}</p>
            </div>
          </div>

          {/* Itens */}
          <div>
            <h3 className="font-medium text-slate-900 mb-3">Produtos Comprados</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm border border-slate-200">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="border border-slate-200 px-3 py-2 text-left">Produto</th>
                    <th className="border border-slate-200 px-3 py-2 text-center">Qtd</th>
                    <th className="border border-slate-200 px-3 py-2 text-right">Preço Unit.</th>
                    <th className="border border-slate-200 px-3 py-2 text-right">Total</th>
                    <th className="border border-slate-200 px-3 py-2 text-left">Vendedor</th>
                  </tr>
                </thead>
                <tbody>
                  {formattedOrder.items.map((item, index) => (
                    <tr key={index} className="border-b border-slate-200">
                      <td className="border border-slate-200 px-3 py-2">
                        <div className="flex items-center gap-3">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-10 h-10 object-cover rounded border border-slate-200 flex-shrink-0"
                            onError={(e) => {
                              e.target.src = '/placeholder-image.png';
                            }}
                          />
                          <span>{item.name}</span>
                        </div>
                      </td>
                      <td className="border border-slate-200 px-3 py-2 text-center">{item.quantity}</td>
                      <td className="border border-slate-200 px-3 py-2 text-right">{formatPrice(item.price)}</td>
                      <td className="border border-slate-200 px-3 py-2 text-right">{formatPrice(item.price * item.quantity)}</td>
                      <td className="border border-slate-200 px-3 py-2">{item.seller}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="border-t border-slate-200 pt-2 mt-3">
              <div className="flex justify-between font-bold text-slate-900">
                <span>Valor Total</span>
                <span>{formatPrice(formattedOrder.total)}</span>
              </div>
            </div>
          </div>

          {/* Endereço e pagamento */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm">
            <div>
              <h3 className="font-medium text-slate-900 mb-2">Endereço de Entrega</h3>
              <div className="text-slate-600 space-y-1">
                <p>{formattedOrder.address.name}</p>
                <p>{formattedOrder.address.street}</p>
                <p>{formattedOrder.address.city}</p>
                <p>CEP: {formattedOrder.address.cep}</p>
              </div>
            </div>
            <div>
              <h3 className="font-medium text-slate-900 mb-2">Método de Pagamento</h3>
              <div className="text-slate-600 space-y-1">
                <p>{formattedOrder.paymentMethod}</p>
                {formattedOrder.paymentDetails.length > 0 && (
                  <div className="mt-2">
                    {formattedOrder.paymentDetails.map((payment, index) => (
                      <p key={index} className="text-xs">
                        {payment.method}: {formatPrice(payment.amount)}
                        {payment.installments > 1 && ` (${payment.installments}x)`}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Rodapé */}
          <div className="text-center text-xs text-slate-500 border-t border-slate-200 pt-4">
            <p>Este é um comprovante oficial da HelpNet</p>
            <p>Data de emissão: {new Date().toLocaleDateString('pt-BR')}</p>
          </div>
        </div>
        <div className="p-6 border-t border-slate-200">
          <button
            onClick={handleClose}
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700"
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsModal;