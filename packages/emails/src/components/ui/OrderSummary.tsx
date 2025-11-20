import React from 'react';

interface OrderSummaryProps {
  subtotal: number;
  shipping: number;
  total: number;
}

export const OrderSummary: React.FC<OrderSummaryProps> = ({ subtotal, shipping, total }) => {
  return (
    <table
      cellPadding="0"
      cellSpacing="0"
      border={0}
      role="presentation"
      className="w-full bg-white border-2 border-gray-200 rounded-lg overflow-hidden my-5"
    >
      <tr>
        <td className="p-5">
          <table
            cellPadding="0"
            cellSpacing="0"
            border={0}
            role="presentation"
            className="w-full border-collapse"
          >
            <tr>
              <td className="pr-5 pb-3 border-b border-gray-100 text-sm font-semibold text-slate-700 text-right">
                Subtotal:
              </td>
              <td className="pb-3 border-b border-gray-100 text-sm font-semibold text-slate-900 text-right w-32">
                R$ {subtotal}
              </td>
            </tr>
            <tr>
              <td className="pr-5 pb-3 border-b border-gray-100 text-sm font-semibold text-slate-700 text-right">
                Frete:
              </td>
              <td className="pb-3 border-b border-gray-100 text-sm font-semibold text-slate-900 text-right w-32">
                R$ {shipping}
              </td>
            </tr>
            <tr className="bg-red-50 border-t-2 border-red-500">
              <td className="pr-5 pt-3 pb-3 text-lg font-bold text-red-500 text-right">
                Total do Pedido:
              </td>
              <td className="pt-3 pb-3 text-lg font-bold text-red-500 text-right w-32">
                R$ {total}
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  );
};