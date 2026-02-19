import { Link } from 'react-router-dom';
import { FaCheck, FaReceipt } from 'react-icons/fa';

function ReceiptPage({ receiptData, handleCompartilharComprovante, logoConfig }) {
  const formatPrice = (price) => {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  };

  return (
    <div className="min-h-screen bg-white flex">
      {/* Sidebar */}
      <aside className="hidden md:flex md:w-72 bg-white border-r border-slate-200 flex-col fixed h-screen">
        <div className="h-16 px-6 border-b border-slate-200 flex items-center sticky top-0 bg-white z-10">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-semibold text-blue-700">{logoConfig.textLogo}</span>
          </Link>
        </div>
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <p className="px-3 text-xs font-semibold tracking-wide text-slate-500 uppercase">Navegação</p>
          {/* Menu items would be here, but since it's receipt, maybe minimal */}
        </nav>
      </aside>

      <div className="flex-1 flex flex-col md:ml-72">
        <header className="bg-white sticky top-0 z-40 border-b border-slate-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between gap-4 h-16">
              <div className="flex items-center gap-2">
                <div className="hidden md:flex items-center gap-2 shrink-0">
                  <img
                    src="/logo-horizontal.png"
                    alt="HelpNet Logo"
                    className="h-6 w-auto"
                  />
                </div>
                <div className="md:hidden shrink-0">
                  <img
                    src="/logo-horizontal.png"
                    alt="HelpNet Logo"
                    className="h-6 w-auto"
                  />
                </div>
              </div>
            </div>
          </div>
        </header>

        <main className="flex-1 bg-slate-50">
          <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-8">
              <div className="text-center mb-8">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <FaCheck className="text-green-600 text-2xl" />
                </div>
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Pedido Realizado com Sucesso!</h1>
                <p className="text-slate-600">Seu pedido foi processado e será enviado em breve.</p>
              </div>

              <div className="border border-slate-200 rounded-lg p-6 mb-6">
                <div className="flex items-center gap-2 mb-4">
                  <FaReceipt className="text-blue-600" />
                  <h2 className="text-lg font-semibold text-slate-900">Comprovante</h2>
                </div>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Pedido:</span>
                    <span className="font-medium">{receiptData.orderId}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Data:</span>
                    <span className="font-medium">{receiptData.date}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Total:</span>
                    <span className="font-medium text-green-600">{formatPrice(receiptData.total)}</span>
                  </div>
                </div>

                {/* Métodos de pagamento */}
                <div className="mt-4 pt-4 border-t border-slate-200">
                  <h3 className="text-sm font-medium text-slate-900 mb-2">Métodos de Pagamento:</h3>
                  <div className="space-y-1">
                    {receiptData.paymentMethods
                      .filter(method => method.amount > 0)
                      .map((method, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-slate-600">{method.label}:</span>
                          <span className="font-medium">{formatPrice(method.amount)}</span>
                        </div>
                      ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  onClick={handleCompartilharComprovante}
                  className="flex-1 bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Compartilhar Comprovante
                </button>
                <Link
                  to="/explorer"
                  className="flex-1 bg-slate-100 text-slate-700 py-3 px-6 rounded-lg hover:bg-slate-200 transition-colors font-medium text-center"
                >
                  Continuar Comprando
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

export default ReceiptPage;