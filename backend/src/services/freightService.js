// backend/src/services/freightService.js
import { logControllerError, logger } from "../utils/logger.js";

// Configurações de frete
const FREIGHT_CONFIG = {
  FRETE_BASE: 8.00, // Valor mínimo do frete
  TAXA_POR_KM: 0.08, // Valor adicional por km (reduzido drasticamente)
  DISTANCIA_MINIMA: 5, // Distância mínima em km para cobrança
  DISTANCIA_MAXIMA: 500, // Distância máxima suportada em km (reduzida)
};

// Mapeamento aproximado de CEPs para coordenadas (latitude, longitude)
// Em produção, isso seria substituído por uma API de geocodificação
const CEP_COORDINATES = {
  // São Paulo - SP (região metropolitana)
  '01000': { lat: -23.5505, lng: -46.6333, cidade: 'São Paulo', uf: 'SP' },
  '01100': { lat: -23.5505, lng: -46.6333, cidade: 'São Paulo', uf: 'SP' },
  '01200': { lat: -23.5505, lng: -46.6333, cidade: 'São Paulo', uf: 'SP' },
  '01300': { lat: -23.5505, lng: -46.6333, cidade: 'São Paulo', uf: 'SP' },
  '01400': { lat: -23.5505, lng: -46.6333, cidade: 'São Paulo', uf: 'SP' },
  '01500': { lat: -23.5505, lng: -46.6333, cidade: 'São Paulo', uf: 'SP' },
  '02000': { lat: -23.5505, lng: -46.6333, cidade: 'São Paulo', uf: 'SP' },
  '03000': { lat: -23.5505, lng: -46.6333, cidade: 'São Paulo', uf: 'SP' },
  '04000': { lat: -23.5505, lng: -46.6333, cidade: 'São Paulo', uf: 'SP' },
  '05000': { lat: -23.5505, lng: -46.6333, cidade: 'São Paulo', uf: 'SP' },
  '06000': { lat: -23.5505, lng: -46.6333, cidade: 'São Paulo', uf: 'SP' },
  '07000': { lat: -23.5505, lng: -46.6333, cidade: 'São Paulo', uf: 'SP' },
  '08000': { lat: -23.5505, lng: -46.6333, cidade: 'São Paulo', uf: 'SP' },
  '09000': { lat: -23.5505, lng: -46.6333, cidade: 'São Paulo', uf: 'SP' },

  // Rio de Janeiro - RJ
  '20000': { lat: -22.9068, lng: -43.1729, cidade: 'Rio de Janeiro', uf: 'RJ' },
  '21000': { lat: -22.9068, lng: -43.1729, cidade: 'Rio de Janeiro', uf: 'RJ' },
  '22000': { lat: -22.9068, lng: -43.1729, cidade: 'Rio de Janeiro', uf: 'RJ' },
  '23000': { lat: -22.9068, lng: -43.1729, cidade: 'Rio de Janeiro', uf: 'RJ' },
  '24000': { lat: -22.9068, lng: -43.1729, cidade: 'Rio de Janeiro', uf: 'RJ' },

  // Belo Horizonte - MG
  '30000': { lat: -19.9191, lng: -43.9386, cidade: 'Belo Horizonte', uf: 'MG' },
  '31000': { lat: -19.9191, lng: -43.9386, cidade: 'Belo Horizonte', uf: 'MG' },
  '32000': { lat: -19.9191, lng: -43.9386, cidade: 'Belo Horizonte', uf: 'MG' },

  // Salvador - BA
  '40000': { lat: -12.9714, lng: -38.5014, cidade: 'Salvador', uf: 'BA' },
  '41000': { lat: -12.9714, lng: -38.5014, cidade: 'Salvador', uf: 'BA' },
  '42000': { lat: -12.9714, lng: -38.5014, cidade: 'Salvador', uf: 'BA' },

  // Brasília - DF
  '70000': { lat: -15.7942, lng: -47.8822, cidade: 'Brasília', uf: 'DF' },
  '71000': { lat: -15.7942, lng: -47.8822, cidade: 'Brasília', uf: 'DF' },
  '72000': { lat: -15.7942, lng: -47.8822, cidade: 'Brasília', uf: 'DF' },

  // Curitiba - PR
  '80000': { lat: -25.4284, lng: -49.2733, cidade: 'Curitiba', uf: 'PR' },
  '81000': { lat: -25.4284, lng: -49.2733, cidade: 'Curitiba', uf: 'PR' },
  '82000': { lat: -25.4284, lng: -49.2733, cidade: 'Curitiba', uf: 'PR' },

  // Porto Alegre - RS
  '90000': { lat: -30.0346, lng: -51.2177, cidade: 'Porto Alegre', uf: 'RS' },
  '91000': { lat: -30.0346, lng: -51.2177, cidade: 'Porto Alegre', uf: 'RS' },
  '92000': { lat: -30.0346, lng: -51.2177, cidade: 'Porto Alegre', uf: 'RS' },

  // Fortaleza - CE
  '60000': { lat: -3.7319, lng: -38.5267, cidade: 'Fortaleza', uf: 'CE' },
  '60100': { lat: -3.7319, lng: -38.5267, cidade: 'Fortaleza', uf: 'CE' },

  // Recife - PE
  '50000': { lat: -8.0476, lng: -34.8770, cidade: 'Recife', uf: 'PE' },
  '51000': { lat: -8.0476, lng: -34.8770, cidade: 'Recife', uf: 'PE' },

  // Manaus - AM
  '69000': { lat: -3.1190, lng: -60.0217, cidade: 'Manaus', uf: 'AM' },
  '69100': { lat: -3.1190, lng: -60.0217, cidade: 'Manaus', uf: 'AM' },
};

/**
 * Calcula a distância aproximada entre dois CEPs usando coordenadas
 * @param {string} cepOrigem - CEP de origem (vendedor)
 * @param {string} cepDestino - CEP de destino (cliente)
 * @returns {number} Distância em quilômetros
 */
function calcularDistanciaPorCEP(cepOrigem, cepDestino) {
  try {
    // Remove formatação dos CEPs
    const cepOrigemLimpo = cepOrigem.replace(/\D/g, '').substring(0, 5);
    const cepDestinoLimpo = cepDestino.replace(/\D/g, '').substring(0, 5);

    // Busca coordenadas aproximadas
    const coordOrigem = getCoordenadasPorCEP(cepOrigemLimpo);
    const coordDestino = getCoordenadasPorCEP(cepDestinoLimpo);

    if (!coordOrigem || !coordDestino) {
      // Se não encontrar coordenadas específicas, calcula distância baseada na diferença de região
      const diff = Math.abs(parseInt(cepOrigemLimpo) - parseInt(cepDestinoLimpo));

      // Para CEPs brasileiros, a diferença de região é mais significativa nos primeiros dígitos
      // Calcula uma distância mais realista baseada na diferença de CEP
      let distanciaEstimada;

      if (diff === 0) {
        distanciaEstimada = 5; // Mesma região
      } else if (diff < 1000) {
        distanciaEstimada = Math.min(diff / 50, 50); // Mesma cidade/estado
      } else if (diff < 10000) {
        distanciaEstimada = Math.min(50 + (diff - 1000) / 200, 150); // Estados próximos
      } else {
        distanciaEstimada = Math.min(150 + (diff - 10000) / 500, FREIGHT_CONFIG.DISTANCIA_MAXIMA); // Estados distantes
      }

      return Math.max(FREIGHT_CONFIG.DISTANCIA_MINIMA, distanciaEstimada);
    }

    // Calcula distância usando fórmula de Haversine
    return calcularDistanciaHaversine(coordOrigem, coordDestino);
  } catch (error) {
    logger.error('erro_calculo_distancia_cep', { cepOrigem, cepDestino, error: error.message });
    return FREIGHT_CONFIG.DISTANCIA_MINIMA; // Retorna distância mínima em caso de erro
  }
}

/**
 * Obtém coordenadas aproximadas para um CEP
 * @param {string} cep - CEP (5 primeiros dígitos)
 * @returns {Object|null} Objeto com lat, lng ou null
 */
function getCoordenadasPorCEP(cep) {
  // Tenta encontrar correspondência exata primeiro
  if (CEP_COORDINATES[cep]) {
    return CEP_COORDINATES[cep];
  }

  // Tenta encontrar correspondência aproximada (mesmos 3 primeiros dígitos)
  const cepPrefixo = cep.substring(0, 3);
  for (const [cepKey, coords] of Object.entries(CEP_COORDINATES)) {
    if (cepKey.startsWith(cepPrefixo)) {
      return coords;
    }
  }

  return null;
}

/**
 * Calcula a distância entre dois pontos usando a fórmula de Haversine
 * @param {Object} pontoA - {lat, lng}
 * @param {Object} pontoB - {lat, lng}
 * @returns {number} Distância em quilômetros
 */
function calcularDistanciaHaversine(pontoA, pontoB) {
  const R = 6371; // Raio da Terra em km
  const dLat = (pontoB.lat - pontoA.lat) * Math.PI / 180;
  const dLng = (pontoB.lng - pontoA.lng) * Math.PI / 180;

  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(pontoA.lat * Math.PI / 180) * Math.cos(pontoB.lat * Math.PI / 180) *
    Math.sin(dLng/2) * Math.sin(dLng/2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distancia = R * c;

  return Math.round(distancia * 100) / 100; // Arredonda para 2 casas decimais
}

/**
 * Calcula o valor do frete baseado na distância
 * @param {number} distanciaKm - Distância em quilômetros
 * @returns {number} Valor do frete
 */
function calcularValorFrete(distanciaKm) {
  if (distanciaKm <= FREIGHT_CONFIG.DISTANCIA_MINIMA) {
    return FREIGHT_CONFIG.FRETE_BASE;
  }

  const distanciaCobrada = Math.min(distanciaKm, FREIGHT_CONFIG.DISTANCIA_MAXIMA);
  const valorFrete = FREIGHT_CONFIG.FRETE_BASE + ((distanciaCobrada - FREIGHT_CONFIG.DISTANCIA_MINIMA) * FREIGHT_CONFIG.TAXA_POR_KM);

  return Math.round(valorFrete * 100) / 100; // Arredonda para 2 casas decimais
}

/**
 * Calcula o frete entre vendedor e cliente
 * @param {string} cepVendedor - CEP do vendedor
 * @param {string} cepCliente - CEP do cliente
 * @returns {Object} Objeto com valor do frete e detalhes do cálculo
 */
export function calcularFrete(cepVendedor, cepCliente) {
  try {
    if (!cepVendedor || !cepCliente) {
      throw new Error('CEPs de origem e destino são obrigatórios');
    }

    const distanciaKm = calcularDistanciaPorCEP(cepVendedor, cepCliente);
    const valorFrete = calcularValorFrete(distanciaKm);

    const resultado = {
      valorFrete,
      distanciaKm,
      detalhes: {
        freteBase: FREIGHT_CONFIG.FRETE_BASE,
        taxaPorKm: FREIGHT_CONFIG.TAXA_POR_KM,
        distanciaMinima: FREIGHT_CONFIG.DISTANCIA_MINIMA,
        cepOrigem: cepVendedor,
        cepDestino: cepCliente
      }
    };

    logger.info('frete_calculado_sucesso', {
      cepVendedor,
      cepCliente,
      distanciaKm,
      valorFrete
    });

    return resultado;
  } catch (error) {
    logger.error('erro_calculo_frete', {
      cepVendedor,
      cepCliente,
      error: error.message
    });

    // Retorna frete padrão em caso de erro
    return {
      valorFrete: FREIGHT_CONFIG.FRETE_BASE,
      distanciaKm: FREIGHT_CONFIG.DISTANCIA_MINIMA,
      detalhes: {
        freteBase: FREIGHT_CONFIG.FRETE_BASE,
        taxaPorKm: FREIGHT_CONFIG.TAXA_POR_KM,
        distanciaMinima: FREIGHT_CONFIG.DISTANCIA_MINIMA,
        cepOrigem: cepVendedor,
        cepDestino: cepCliente,
        erro: error.message
      }
    };
  }
}

/**
 * Valida se um CEP é válido
 * @param {string} cep - CEP a ser validado
 * @returns {boolean} True se válido
 */
export function validarCEP(cep) {
  if (!cep) return false;
  const cepLimpo = cep.replace(/\D/g, '');
  return cepLimpo.length === 8;
}

export { FREIGHT_CONFIG };