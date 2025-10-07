import React from 'react';
import { FiLoader } from 'react-icons/fi';

// Componente de loading melhorado com skeletons e spinners modernos
const LoadingSkeleton = ({
  type = 'page',
  message = 'Carregando...',
  className = ''
}) => {
  // Skeleton para diferentes tipos de conteúdo
  const renderSkeleton = () => {
    switch (type) {
      case 'product-card':
        return (
          <div className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
            <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-200 rounded mb-2"></div>
            <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
            <div className="h-5 bg-gray-200 rounded w-1/2"></div>
          </div>
        );

      case 'product-grid':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-lg p-4 animate-pulse">
                <div className="aspect-square bg-gray-200 rounded-lg mb-4"></div>
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-2 w-3/4"></div>
                <div className="h-5 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        );

      case 'form':
        return (
          <div className="space-y-6 animate-pulse">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded mb-2 w-1/3"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
            <div>
              <div className="h-4 bg-gray-200 rounded mb-2 w-1/4"></div>
              <div className="h-24 bg-gray-200 rounded"></div>
            </div>
          </div>
        );

      case 'table':
        return (
          <div className="animate-pulse">
            <div className="h-12 bg-gray-200 rounded mb-4"></div>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-16 bg-gray-100 rounded mb-2 flex items-center px-4">
                <div className="h-4 bg-gray-200 rounded w-1/4 mr-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/3 mr-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6 mr-4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
              </div>
            ))}
          </div>
        );

      case 'profile':
        return (
          <div className="animate-pulse space-y-6">
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 bg-gray-200 rounded-full"></div>
              <div className="space-y-2">
                <div className="h-6 bg-gray-200 rounded w-48"></div>
                <div className="h-4 bg-gray-200 rounded w-32"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i}>
                  <div className="h-4 bg-gray-200 rounded mb-2 w-1/3"></div>
                  <div className="h-10 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'vendor-profile':
        return (
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-pulse">
            {/* Header skeleton */}
            <div className="mb-8 flex items-center justify-between">
              <div>
                <div className="h-8 bg-gray-200 rounded w-48 mb-2"></div>
                <div className="h-5 bg-gray-200 rounded w-64"></div>
              </div>
              <div className="h-10 bg-gray-200 rounded w-32"></div>
            </div>

            <div className="space-y-6">
              {/* Informações Pessoais section */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="h-6 bg-gray-200 rounded w-48"></div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Nome Completo */}
                    <div>
                      <div className="h-4 bg-gray-200 rounded mb-2 w-32"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                    {/* E-mail */}
                    <div>
                      <div className="h-4 bg-gray-200 rounded mb-2 w-16"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                    {/* Telefone Celular */}
                    <div>
                      <div className="h-4 bg-gray-200 rounded mb-2 w-36"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                    {/* Telefone Fixo */}
                    <div>
                      <div className="h-4 bg-gray-200 rounded mb-2 w-28"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                    {/* WhatsApp */}
                    <div>
                      <div className="h-4 bg-gray-200 rounded mb-2 w-20"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                    {/* Razão Social */}
                    <div>
                      <div className="h-4 bg-gray-200 rounded mb-2 w-28"></div>
                      <div className="h-10 bg-gray-200 rounded"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Endereços section */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="h-6 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    {Array.from({ length: 2 }).map((_, i) => (
                      <div key={i} className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg">
                        <div className="w-5 h-5 bg-gray-200 rounded mt-0.5"></div>
                        <div className="flex-1">
                          <div className="h-4 bg-gray-200 rounded w-32 mb-2"></div>
                          <div className="h-3 bg-gray-200 rounded w-48 mb-1"></div>
                          <div className="h-3 bg-gray-200 rounded w-24"></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Informações da Conta section */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="h-6 bg-gray-200 rounded w-44"></div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i}>
                        <div className="h-4 bg-gray-200 rounded mb-2 w-32"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Estatísticas section */}
              <div className="bg-white border border-gray-200 rounded-lg">
                <div className="px-6 py-4 border-b border-gray-200">
                  <div className="h-6 bg-gray-200 rounded w-40"></div>
                </div>
                <div className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="text-center">
                        <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                        <div className="h-4 bg-gray-200 rounded w-20 mx-auto"></div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'product-detail':
        return (
          <div className="min-h-screen bg-white animate-pulse">
            {/* Header */}
            <header className="bg-white sticky top-0 z-40 border-b border-slate-200">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center gap-4 h-16">
                  <div className="w-8 h-8 bg-gray-200 rounded"></div>
                  <div className="h-6 bg-gray-200 rounded w-48"></div>
                </div>
              </div>
            </header>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 mb-8">
                {/* Galeria de Imagens */}
                <div className="space-y-4">
                  {/* Imagem Principal */}
                  <div className="aspect-[4/3] rounded-xl bg-gray-200"></div>
                  {/* Miniaturas */}
                  <div className="flex gap-2">
                    {Array.from({ length: 4 }).map((_, i) => (
                      <div key={i} className="w-20 h-20 rounded-lg bg-gray-200"></div>
                    ))}
                  </div>
                </div>

                {/* Informações do Produto */}
                <div className="space-y-6">
                  <div>
                    <div className="h-8 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="flex items-center gap-3 mb-4">
                      <div className="flex gap-1">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <div key={i} className="w-4 h-4 bg-gray-200 rounded"></div>
                        ))}
                      </div>
                      <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="flex items-center gap-3 mb-6">
                      <div className="h-8 bg-gray-200 rounded w-32"></div>
                      <div className="h-6 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-64 mb-4"></div>
                    <div className="h-4 bg-gray-200 rounded w-48"></div>
                  </div>

                  {/* Controles de Compra */}
                  <div className="border-t border-slate-200 pt-6">
                    <div className="flex items-center gap-4 mb-6">
                      <div className="h-6 bg-gray-200 rounded w-20"></div>
                      <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden w-fit">
                        <div className="px-3 py-2 bg-gray-200 w-8 h-8"></div>
                        <div className="px-4 py-2 bg-gray-100 w-12 h-8"></div>
                        <div className="px-3 py-2 bg-gray-200 w-8 h-8"></div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <div className="w-full h-12 bg-gray-200 rounded-xl"></div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div className="h-10 bg-gray-200 rounded-xl"></div>
                        <div className="h-10 bg-gray-200 rounded-xl"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Abas de Informações */}
              <div className="border-t border-slate-200 pt-8">
                <div className="flex justify-center border-b border-slate-200 mb-6">
                  <div className="flex">
                    <div className="px-6 py-3 border-b-2 border-gray-200">
                      <div className="h-6 bg-gray-200 rounded w-32"></div>
                    </div>
                    <div className="px-6 py-3 border-b-2 border-transparent">
                      <div className="h-6 bg-gray-200 rounded w-24"></div>
                    </div>
                    <div className="px-6 py-3 border-b-2 border-transparent">
                      <div className="h-6 bg-gray-200 rounded w-28"></div>
                    </div>
                  </div>
                </div>
                <div className="min-h-[400px] max-w-4xl mx-auto">
                  <div className="h-6 bg-gray-200 rounded w-48 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-full mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-5/6 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-4/5"></div>
                </div>
              </div>
            </div>
          </div>
        );

      case 'page':
      default:
        return (
          <div className="min-h-screen flex items-center justify-center">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">{message}</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className={className}>
      {renderSkeleton()}
    </div>
  );
};

// Componente de spinner moderno para botões e ações
export const LoadingSpinner = ({
  size = 'sm',
  color = 'blue',
  className = ''
}) => {
  const sizeClasses = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12'
  };

  const colorClasses = {
    blue: 'text-blue-600',
    gray: 'text-gray-600',
    white: 'text-white',
    green: 'text-green-600',
    red: 'text-red-600'
  };

  return (
    <FiLoader
      className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]} ${className}`}
    />
  );
};

// Hook personalizado para gerenciar estados de loading
export const useLoadingState = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);

  const startLoading = React.useCallback(() => setIsLoading(true), []);
  const stopLoading = React.useCallback(() => setIsLoading(false), []);
  const toggleLoading = React.useCallback(() => setIsLoading(prev => !prev), []);

  return {
    isLoading,
    startLoading,
    stopLoading,
    toggleLoading,
    setIsLoading
  };
};

export default LoadingSkeleton;