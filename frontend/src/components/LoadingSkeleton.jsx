// frontend/src/components/LoadingSkeleton.jsx
// Skeleton loading components for better perceived performance

import React from 'react';

/**
 * Generic skeleton loader with shimmer effect
 * Provides better UX during loading states
 */
export const SkeletonLoader = ({ className = "", style = {} }) => (
  <div
    className={`animate-pulse bg-slate-200 rounded ${className}`}
    style={style}
  />
);

/**
 * Product card skeleton for loading states
 */
export const ProductCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
    <SkeletonLoader className="w-full h-48 mb-4" />
    <SkeletonLoader className="h-4 w-3/4 mb-2" />
    <SkeletonLoader className="h-4 w-1/2 mb-4" />
    <SkeletonLoader className="h-6 w-1/4" />
  </div>
);

/**
 * Order card skeleton for vendor orders
 */
export const OrderCardSkeleton = () => (
  <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6 mb-4">
    <div className="flex items-start justify-between mb-4">
      <div className="flex items-center gap-3">
        <SkeletonLoader className="w-8 h-8 rounded-full" />
        <div>
          <SkeletonLoader className="h-5 w-32 mb-1" />
          <SkeletonLoader className="h-4 w-24" />
        </div>
      </div>
      <SkeletonLoader className="h-6 w-20" />
    </div>
    <div className="space-y-2">
      <SkeletonLoader className="h-4 w-full" />
      <SkeletonLoader className="h-4 w-3/4" />
      <SkeletonLoader className="h-4 w-1/2" />
    </div>
  </div>
);

/**
 * Table row skeleton for data tables
 */
export const TableRowSkeleton = ({ columns = 4 }) => (
  <tr className="border-b border-slate-200">
    {Array.from({ length: columns }).map((_, i) => (
      <td key={i} className="px-4 py-3">
        <SkeletonLoader className="h-4 w-full max-w-32" />
      </td>
    ))}
  </tr>
);

/**
 * Form skeleton for loading forms
 */
export const FormSkeleton = () => (
  <div className="space-y-6">
    <div>
      <SkeletonLoader className="h-4 w-24 mb-2" />
      <SkeletonLoader className="h-10 w-full" />
    </div>
    <div>
      <SkeletonLoader className="h-4 w-32 mb-2" />
      <SkeletonLoader className="h-10 w-full" />
    </div>
    <div>
      <SkeletonLoader className="h-4 w-28 mb-2" />
      <SkeletonLoader className="h-24 w-full" />
    </div>
    <SkeletonLoader className="h-10 w-32" />
  </div>
);

/**
 * Page loading skeleton with header and content
 */
export const PageSkeleton = ({ title = true, content = true }) => (
  <div className="min-h-screen bg-slate-50">
    {/* Header skeleton */}
    <div className="bg-white shadow-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        {title && <SkeletonLoader className="h-8 w-64 mb-2" />}
        <SkeletonLoader className="h-4 w-96" />
      </div>
    </div>

    {/* Content skeleton */}
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {content && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      )}
    </div>
  </div>
);

/**
 * Enhanced loading component with better UX
 */
const LoadingSkeleton = ({
  type = 'page',
  message = 'Carregando...',
  showMessage = true
}) => {
  const renderSkeleton = () => {
    switch (type) {
      case 'product-card':
        return <ProductCardSkeleton />;
      case 'order-card':
        return <OrderCardSkeleton />;
      case 'form':
        return <FormSkeleton />;
      case 'table-row':
        return <TableRowSkeleton />;
      case 'page':
      default:
        return <PageSkeleton />;
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[200px] py-8">
      {renderSkeleton()}
      {showMessage && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center gap-2 text-slate-600">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-slate-600"></div>
            <span className="text-sm">{message}</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoadingSkeleton;