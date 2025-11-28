import prisma from "../config/prisma.js";
import { logger } from "../utils/logger.js";

/**
 * Main coupon validation function
 * @param {string} code - Coupon code
 * @param {Array} cartItems - Cart items array
 * @param {number} clientId - Client ID
 * @returns {Object} Validation result with state, reason, coupon, and discountDetails
 */
export const validateCouponState = async (code, cartItems, clientId) => {
  try {
    if (!code || !clientId) {
      return {
        state: 'inactive',
        reason: 'Código do cupom e ID do cliente são obrigatórios',
        coupon: null,
        discountDetails: null
      };
    }

    // Sanitize coupon code
    const sanitizedCode = code.trim().toUpperCase();

    // Find coupon
    const coupon = await prisma.cupom.findFirst({
      where: {
        Codigo: sanitizedCode,
        Ativo: true,
        DataInicio: { lte: new Date() },
        OR: [
          { DataExpiracao: null },
          { DataExpiracao: { gte: new Date() } }
        ]
      },
      include: {
        cuponsCliente: {
          where: { ClienteID: clientId }
        }
      }
    });

    if (!coupon) {
      return {
        state: 'inactive',
        reason: 'Cupom não encontrado ou expirado',
        coupon: null,
        discountDetails: null
      };
    }

    // Check basic validity
    const basicValidation = await validateBasicValidity(coupon);
    if (!basicValidation.valid) {
      return {
        state: 'inactive',
        reason: basicValidation.reason,
        coupon: coupon,
        discountDetails: null
      };
    }

    // Check client eligibility
    const clientValidation = await validateClientEligibility(coupon, clientId);
    if (!clientValidation.valid) {
      return {
        state: 'inactive',
        reason: clientValidation.reason,
        coupon: coupon,
        discountDetails: null
      };
    }

    // Analyze cart eligibility
    const cartAnalysis = await analyzeCartEligibility(coupon, cartItems);
    if (!cartAnalysis.eligible) {
      return {
        state: 'grayed_out',
        reason: cartAnalysis.reason,
        coupon: coupon,
        discountDetails: {
          eligibleSubtotal: cartAnalysis.eligibleSubtotal,
          discountAmount: 0,
          finalAmount: cartAnalysis.eligibleSubtotal,
          eligibleItems: cartAnalysis.eligibleItems
        }
      };
    }

    // Calculate discount
    const discountDetails = calculateDiscountDetails(coupon, cartAnalysis);

    return {
      state: 'active',
      reason: 'Cupom válido e aplicável',
      coupon: coupon,
      discountDetails: discountDetails
    };

  } catch (error) {
    logger.error('validateCouponState_error', { code, clientId, error: error.message });
    return {
      state: 'inactive',
      reason: 'Erro interno ao validar cupom',
      coupon: null,
      discountDetails: null
    };
  }
};

/**
 * Analyze cart eligibility for coupon application
 * @param {Object} coupon - Coupon object
 * @param {Array} cartItems - Cart items array
 * @returns {Object} Eligibility analysis result
 */
export const analyzeCartEligibility = async (coupon, cartItems) => {
  try {
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return {
        eligible: false,
        reason: 'Carrinho vazio',
        eligibleSubtotal: 0,
        eligibleItems: []
      };
    }

    let eligibleItems = [];
    let eligibleSubtotal = 0;

    // Check category restrictions
    if (coupon.Restricoes?.categoriaId) {
      const categoryValidation = await validateCategoryRestriction(coupon, cartItems);
      if (!categoryValidation.hasEligibleItems) {
        return {
          eligible: false,
          reason: categoryValidation.reason,
          eligibleSubtotal: 0,
          eligibleItems: []
        };
      }
      eligibleItems = categoryValidation.eligibleItems;
      eligibleSubtotal = categoryValidation.eligibleSubtotal;
    } else {
      // No category restriction - all items are eligible
      eligibleItems = cartItems;
      eligibleSubtotal = cartItems.reduce((total, item) => {
        const price = item.PrecoUnitario || item.precoUnitario || 0;
        const quantity = item.Quantidade || item.quantidade || 1;
        return total + (price * quantity);
      }, 0);
    }

    // Check minimum value restriction
    if (coupon.Restricoes?.valorMinimo && eligibleSubtotal < coupon.Restricoes.valorMinimo) {
      return {
        eligible: false,
        reason: `Valor mínimo de R$ ${coupon.Restricoes.valorMinimo.toFixed(2)} não atingido`,
        eligibleSubtotal: eligibleSubtotal,
        eligibleItems: eligibleItems
      };
    }

    return {
      eligible: true,
      reason: 'Carrinho elegível para o cupom',
      eligibleSubtotal: eligibleSubtotal,
      eligibleItems: eligibleItems
    };

  } catch (error) {
    logger.error('analyzeCartEligibility_error', { couponId: coupon.CupomID, error: error.message });
    return {
      eligible: false,
      reason: 'Erro ao analisar elegibilidade do carrinho',
      eligibleSubtotal: 0,
      eligibleItems: []
    };
  }
};

/**
 * Validate basic coupon validity (active, dates, limits)
 * @param {Object} coupon - Coupon object
 * @returns {Object} Validation result
 */
const validateBasicValidity = async (coupon) => {
  try {
    // Check if coupon is active
    if (!coupon.Ativo) {
      return { valid: false, reason: 'Cupom inativo' };
    }

    // Check expiration date
    if (coupon.DataExpiracao && new Date(coupon.DataExpiracao) < new Date()) {
      return { valid: false, reason: 'Cupom expirado' };
    }

    // Check start date
    if (coupon.DataInicio && new Date(coupon.DataInicio) > new Date()) {
      return { valid: false, reason: 'Cupom ainda não está ativo' };
    }

    // Check total usage limit
    if (coupon.LimiteUso && coupon.UsosAtuais >= coupon.LimiteUso) {
      return { valid: false, reason: 'Limite total de uso do cupom atingido' };
    }

    return { valid: true, reason: 'Cupom válido' };

  } catch (error) {
    logger.error('validateBasicValidity_error', { couponId: coupon.CupomID, error: error.message });
    return { valid: false, reason: 'Erro na validação básica do cupom' };
  }
};

/**
 * Validate client eligibility for coupon
 * @param {Object} coupon - Coupon object
 * @param {number} clientId - Client ID
 * @returns {Object} Validation result
 */
const validateClientEligibility = async (coupon, clientId) => {
  try {
    if (coupon.Tipo === 'publico') {
      // Check usage limit per client for public coupons
      if (coupon.UsoPorCliente) {
        const clientUsage = await prisma.pedido.count({
          where: {
            ClienteID: clientId,
            CupomID: coupon.CupomID
          }
        });

        if (clientUsage >= coupon.UsoPorCliente) {
          return {
            valid: false,
            reason: `Você já usou este cupom o máximo permitido (${coupon.UsoPorCliente} vez${coupon.UsoPorCliente > 1 ? 'es' : ''})`
          };
        }
      }
      return { valid: true, reason: 'Cliente elegível para cupom público' };
    }

    if (coupon.Tipo === 'especifico') {
      // Check if client has been assigned this coupon
      const clientCoupon = await prisma.cupomCliente.findFirst({
        where: {
          CupomID: coupon.CupomID,
          ClienteID: clientId
        }
      });

      if (!clientCoupon) {
        return { valid: false, reason: 'Este cupom não está disponível para você' };
      }

      // Check if already used
      if (clientCoupon.Usado) {
        return { valid: false, reason: 'Você já usou este cupom' };
      }

      // Check usage limit per client
      if (coupon.UsoPorCliente && clientCoupon.UsosCliente >= coupon.UsoPorCliente) {
        return {
          valid: false,
          reason: `Você já usou este cupom o máximo permitido (${coupon.UsoPorCliente} vez${coupon.UsoPorCliente > 1 ? 'es' : ''})`
        };
      }

      return { valid: true, reason: 'Cliente elegível para cupom específico' };
    }

    return { valid: false, reason: 'Tipo de cupom inválido' };

  } catch (error) {
    logger.error('validateClientEligibility_error', { couponId: coupon.CupomID, clientId, error: error.message });
    return { valid: false, reason: 'Erro na validação de elegibilidade do cliente' };
  }
};

/**
 * Validate category restriction
 * @param {Object} coupon - Coupon object
 * @param {Array} cartItems - Cart items array
 * @returns {Object} Category validation result
 */
const validateCategoryRestriction = async (coupon, cartItems) => {
  try {
    const categoryId = coupon.Restricoes.categoriaId;
    let eligibleItems = [];
    let eligibleSubtotal = 0;

    for (const item of cartItems) {
      const productId = item.ProdutoID || item.produtoId || item.id;
      if (!productId) continue;

      // Get product category
      const product = await prisma.produto.findUnique({
        where: { ProdutoID: parseInt(productId) },
        select: { CategoriaID: true, Nome: true }
      });

      if (product && product.CategoriaID === categoryId) {
        eligibleItems.push(item);
        const price = item.PrecoUnitario || item.precoUnitario || 0;
        const quantity = item.Quantidade || item.quantidade || 1;
        eligibleSubtotal += price * quantity;
      }
    }

    if (eligibleItems.length === 0) {
      // Get category name for better error message
      const category = await prisma.categoria.findUnique({
        where: { CategoriaID: categoryId },
        select: { Nome: true }
      });

      const categoryName = category ? category.Nome : `categoria ${categoryId}`;
      return {
        hasEligibleItems: false,
        reason: `Este cupom é válido apenas para produtos da categoria "${categoryName}"`,
        eligibleItems: [],
        eligibleSubtotal: 0
      };
    }

    return {
      hasEligibleItems: true,
      reason: 'Itens elegíveis encontrados na categoria',
      eligibleItems: eligibleItems,
      eligibleSubtotal: eligibleSubtotal
    };

  } catch (error) {
    logger.error('validateCategoryRestriction_error', { couponId: coupon.CupomID, error: error.message });
    return {
      hasEligibleItems: false,
      reason: 'Erro ao validar restrição de categoria',
      eligibleItems: [],
      eligibleSubtotal: 0
    };
  }
};

/**
 * Calculate discount details
 * @param {Object} coupon - Coupon object
 * @param {Object} cartAnalysis - Cart analysis result
 * @returns {Object} Discount details
 */
const calculateDiscountDetails = (coupon, cartAnalysis) => {
  const { eligibleSubtotal, eligibleItems } = cartAnalysis;

  let discountAmount = 0;
  let finalAmount = eligibleSubtotal;

  if (coupon.DescontoTipo === 'porcentagem') {
    discountAmount = (eligibleSubtotal * coupon.DescontoValor) / 100;
    finalAmount = Math.max(0, eligibleSubtotal - discountAmount);
  } else if (coupon.DescontoTipo === 'valor_fixo') {
    discountAmount = Math.min(coupon.DescontoValor, eligibleSubtotal);
    finalAmount = Math.max(0, eligibleSubtotal - discountAmount);
  } else if (coupon.DescontoTipo === 'frete_gratis') {
    // Free shipping discount will be calculated at checkout
    discountAmount = 0;
    finalAmount = eligibleSubtotal;
  }

  return {
    eligibleSubtotal: eligibleSubtotal,
    discountAmount: discountAmount,
    finalAmount: finalAmount,
    eligibleItems: eligibleItems
  };
};

export default {
  validateCouponState,
  analyzeCartEligibility
};