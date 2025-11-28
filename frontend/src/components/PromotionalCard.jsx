import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FaPercent, FaTruck } from 'react-icons/fa';
import { clienteService } from '../services/api';

const PromotionalCard = ({ type, onRequireAuth }) => {
  const [couponData, setCouponData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCouponData = async () => {
      try {
        setLoading(true);
        // Fetch available coupons for the user
        const response = await clienteService.listarCuponsDisponiveis();
        const coupons = response.cupons || [];

        if (type === 'offers') {
          // Find the best percentage discount coupon
          const discountCoupons = coupons.filter(c =>
            c.type === 'percentage' && c.discount > 0
          ).sort((a, b) => b.discount - a.discount);

          if (discountCoupons.length > 0) {
            setCouponData(discountCoupons[0]);
          }
        } else if (type === 'free_shipping') {
          // Find free shipping coupon
          const freeShippingCoupon = coupons.find(c => c.type === 'free_shipping');
          if (freeShippingCoupon) {
            setCouponData(freeShippingCoupon);
          }
        }
      } catch (error) {
        console.error('Error fetching coupon data:', error);
        // Fallback to static data if API fails
        setCouponData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchCouponData();
  }, [type]);

  if (loading) {
    return (
      <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-gradient-to-br from-slate-100 to-slate-200 text-white flex-1 animate-pulse">
        <div className="p-3 h-full flex flex-col justify-between">
          <div className="h-4 bg-slate-300 rounded mb-2"></div>
          <div className="h-3 bg-slate-300 rounded mb-1 w-3/4"></div>
          <div className="h-2 bg-slate-300 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (type === 'offers') {
    if (couponData) {
      return (
        <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-gradient-to-br from-orange-300 to-orange-400 text-white flex-1">
          <div className="p-3 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <FaPercent className="text-orange-100 text-xs" />
                <span className="text-xs font-bold">OFERTA</span>
              </div>
              <h3 className="text-sm font-bold mb-1">Até {couponData.discount}%</h3>
              <p className="text-xs opacity-90 mb-2">{couponData.description}</p>
            </div>
            <button
              onClick={() => {
                if (onRequireAuth) onRequireAuth();
              }}
              className="inline-block px-3 py-1 bg-white text-orange-600 text-xs font-semibold rounded hover:bg-orange-50 transition-colors self-start"
            >
              Usar Cupom
            </button>
          </div>
        </div>
      );
    } else {
      // Fallback static content
      return (
        <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-gradient-to-br from-orange-300 to-orange-400 text-white flex-1">
          <div className="p-3 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <FaPercent className="text-orange-100 text-xs" />
                <span className="text-xs font-bold">OFERTA</span>
              </div>
              <h3 className="text-sm font-bold mb-1">Até 70%</h3>
              <p className="text-xs opacity-90 mb-2">Produtos selecionados</p>
            </div>
            <Link
              to="/ofertas"
              className="inline-block px-3 py-1 bg-white text-orange-600 text-xs font-semibold rounded hover:bg-orange-50 transition-colors self-start"
            >
              Ver Ofertas
            </Link>
          </div>
        </div>
      );
    }
  }

  if (type === 'free_shipping') {
    if (couponData) {
      return (
        <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-gradient-to-br from-emerald-300 to-emerald-400 text-white flex-1">
          <div className="p-3 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <FaTruck className="text-emerald-100 text-xs" />
                <span className="text-xs font-bold">FRETE GRÁTIS</span>
              </div>
              <h3 className="text-sm font-bold mb-1">{couponData.description}</h3>
              <p className="text-xs opacity-90 mb-2">Use o cupom: {couponData.code}</p>
            </div>
            <button
              onClick={() => {
                if (onRequireAuth) onRequireAuth();
              }}
              className="inline-block px-3 py-1 bg-white text-emerald-600 text-xs font-semibold rounded hover:bg-emerald-50 transition-colors self-start"
            >
              Resgatar
            </button>
          </div>
        </div>
      );
    } else {
      // Fallback static content
      return (
        <div className="relative rounded-lg overflow-hidden border border-slate-200 bg-gradient-to-br from-emerald-300 to-emerald-400 text-white flex-1">
          <div className="p-3 h-full flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-1 mb-1">
                <FaTruck className="text-emerald-100 text-xs" />
                <span className="text-xs font-bold">FRETE GRÁTIS</span>
              </div>
              <h3 className="text-sm font-bold mb-1">Entrega Grátis</h3>
              <p className="text-xs opacity-90 mb-2">Acima de R$ 99</p>
            </div>
            <Link
              to="/frete-gratis"
              className="inline-block px-3 py-1 bg-white text-emerald-600 text-xs font-semibold rounded hover:bg-emerald-50 transition-colors self-start"
            >
              Aproveitar
            </Link>
          </div>
        </div>
      );
    }
  }

  return null;
};

export default PromotionalCard;