import React from 'react';
import { Product } from '../../types/email.types';

interface ProductItemProps {
  product: Product;
}

export const ProductItem: React.FC<ProductItemProps> = ({ product }) => {
  return (
    <table
      cellPadding="0"
      cellSpacing="0"
      border={0}
      role="presentation"
      className="w-full mb-4 bg-white border border-gray-200 rounded-lg overflow-hidden"
    >
      <tr>
        <td className="p-4">
          <table
            cellPadding="0"
            cellSpacing="0"
            border={0}
            role="presentation"
            className="w-full"
          >
            <tr>
              <td className="w-20 align-top">
                {product.imagem ? (
                  <img
                    src={product.imagem}
                    alt={product.nome}
                    className="w-15 h-15 object-cover rounded border border-gray-200"
                  />
                ) : (
                  <div className="w-15 h-15 bg-gray-50 border border-gray-200 rounded flex items-center justify-center text-2xl">
                    📦
                  </div>
                )}
              </td>
              <td className="pl-4 align-top">
                <div className="text-base font-semibold text-gray-900 mb-1 leading-tight">
                  {product.nome}
                </div>
                <div className="text-sm text-gray-600 mb-2">
                  Quantidade:{' '}
                  <span className="bg-brand-primary text-white px-2 py-1 rounded-full text-xs font-semibold">
                    {product.quantidade}
                  </span>
                </div>
                <div className="text-base font-semibold text-gray-900">
                  R$ {product.preco}
                </div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  );
};