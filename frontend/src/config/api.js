// Configuração da API que detecta automaticamente o IP da rede
const getApiBaseUrl = () => {
  // Se estiver usando variável de ambiente (produção/docker), use ela
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }

  const port = import.meta.env.VITE_API_PORT || 3001;
  
  // Em desenvolvimento, usa o mesmo host que está servindo o frontend
  // Isso funciona tanto para localhost quanto para IPs de rede
  const currentHost = window.location.hostname;
  
  return `http://${currentHost}:${port}`;
};

export const baseUrl = getApiBaseUrl();

// Função para obter o IP dinamicamente (útil para debug)
export const getCurrentNetworkInfo = () => {
  return {
    hostname: window.location.hostname,
    port: window.location.port,
    protocol: window.location.protocol,
    apiUrl: baseUrl
  };
};