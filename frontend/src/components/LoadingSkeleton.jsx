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