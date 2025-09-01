// Configuração da API que detecta automaticamente o IP da rede
const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  const port = import.meta.env.VITE_API_PORT || 3001;
  const currentHost = window.location.hostname;
  
  return `http://${currentHost}:${port}`;
};

export const baseUrl = getApiBaseUrl();
export const getCurrentNetworkInfo = () => {
  return {
    hostname: window.location.hostname,
    port: window.location.port,
    protocol: window.location.protocol,
    apiUrl: baseUrl
  };
};