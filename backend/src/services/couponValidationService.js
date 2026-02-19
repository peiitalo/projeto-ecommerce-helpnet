import prisma from "../config/prisma.js";
import { logger } from "../utils/logger.js";

/**
 * Main coupon validation function - now validates against individual items
 * @param {string} code - Coupon code
 * @param {Array} cartItems - Cart items array
 * @param {number} clientId - Client ID
 * @returns {Object} Validation result with state, reason, coupon, and item-specific discountDetails
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
        reason: 'Cupom não encontrado',
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

    // Analyze item-specific eligibility
    const itemAnalysis = await analyzeItemEligibility(coupon, cartItems);
    if (!itemAnalysis.hasEligibleItems) {
      return {
        state: 'grayed_out',
        reason: itemAnalysis.reason,
        coupon: coupon,
        discountDetails: {
          eligibleItems: [],
          ineligibleItems: itemAnalysis.ineligibleItems,
          totalDiscount: 0,
          itemDiscounts: []
        }
      };
    }

    // Special validation for free shipping coupons
    if (coupon.DescontoTipo === 'frete_gratis') {
      const freeShippingValidation = await validateFreeShippingEligibility(coupon, itemAnalysis.eligibleItems);
      if (!freeShippingValidation.eligible) {
        return {
          state: 'grayed_out',
          reason: freeShippingValidation.reason,
          coupon: coupon,
          discountDetails: {
            eligibleItems: [],
            ineligibleItems: itemAnalysis.ineligibleItems,
            totalDiscount: 0,
            itemDiscounts: []
          }
        };
      }
    }

    // Calculate item-specific discounts
    const discountDetails = calculateItemDiscounts(coupon, itemAnalysis);

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
 * Analyze item-specific eligibility for coupon application
 * @param {Object} coupon - Coupon object
 * @param {Array} cartItems - Cart items array
 * @returns {Object} Item eligibility analysis result
 */
export const analyzeItemEligibility = async (coupon, cartItems) => {
  try {
    if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0) {
      return {
        hasEligibleItems: false,
        reason: 'Carrinho vazio',
        eligibleItems: [],
        ineligibleItems: [],
        totalEligibleValue: 0
      };
    }

    const eligibleItems = [];
    const ineligibleItems = [];

    // Check each item individually
    for (const item of cartItems) {
      const itemEligibility = await checkItemEligibility(coupon, item);
      if (itemEligibility.eligible) {
        eligibleItems.push({
          ...item,
          eligibilityReason: itemEligibility.reason
        });
      } else {
        ineligibleItems.push({
          ...item,
          ineligibilityReason: itemEligibility.reason
        });
      }
    }

    if (eligibleItems.length === 0) {
      return {
        hasEligibleItems: false,
        reason: 'Nenhum item do carrinho atende aos critérios do cupom',
        eligibleItems: [],
        ineligibleItems: ineligibleItems,
        totalEligibleValue: 0
      };
    }

    // Calculate total value of eligible items
    const totalEligibleValue = eligibleItems.reduce((total, item) => {
      const price = item.PrecoUnitario || item.precoUnitario || 0;
      const quantity = item.Quantidade || item.quantidade || 1;
      return total + (price * quantity);
    }, 0);

    // Note: Minimum value restriction is now checked per item in checkItemEligibility
    // No total minimum check here - each eligible item already meets individual minimum requirements

    return {
      hasEligibleItems: true,
      reason: `${eligibleItems.length} item(ns) elegível(is) para o cupom`,
      eligibleItems: eligibleItems,
      ineligibleItems: ineligibleItems,
      totalEligibleValue: totalEligibleValue
    };

  } catch (error) {
    logger.error('analyzeItemEligibility_error', { couponId: coupon.CupomID, error: error.message });
    return {
      hasEligibleItems: false,
      reason: 'Erro ao analisar elegibilidade dos itens',
      eligibleItems: [],
      ineligibleItems: cartItems || [],
      totalEligibleValue: 0
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
      return { valid: false, reason: 'Cupom atingiu o limite máximo de uso' };
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
            reason: 'Cupom já atingiu o limite de uso por cliente'
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
          reason: 'Cupom já atingiu o limite de uso por cliente'
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
 * Check if an individual item is eligible for a coupon
 * @param {Object} coupon - Coupon object
 * @param {Object} item - Cart item
 * @returns {Object} Item eligibility result
 */
const checkItemEligibility = async (coupon, item) => {
  try {
    const productId = item.ProdutoID || item.produtoId || item.id;
    if (!productId) {
      logger.warn('checkItemEligibility_no_product_id', { item, couponId: coupon.CupomID });
      return { eligible: false, reason: 'ID do produto não encontrado' };
    }

    // Get product details
    const product = await prisma.produto.findUnique({
      where: { ProdutoID: parseInt(productId) },
      select: {
        ProdutoID: true,
        Nome: true,
        Preco: true,
        CategoriaID: true,
        FreteGratis: true
      }
    });

    if (!product) {
      logger.warn('checkItemEligibility_product_not_found', { productId: parseInt(productId), couponId: coupon.CupomID });
      return { eligible: false, reason: 'Produto não encontrado' };
    }

    const itemPrice = item.PrecoUnitario || item.precoUnitario || product.Preco || 0;
    const itemQuantity = item.Quantidade || item.quantidade || 1;
    const itemTotal = itemPrice * itemQuantity;

    logger.info('checkItemEligibility_item_details', {
      productId: parseInt(productId),
      productName: product.Nome,
      itemPrice,
      itemQuantity,
      itemTotal,
      couponId: coupon.CupomID,
      couponType: coupon.DescontoTipo,
      restrictions: coupon.Restricoes
    });

    // Check category restriction
    if (coupon.Restricoes?.categoriaId) {
      if (product.CategoriaID !== coupon.Restricoes.categoriaId) {
        logger.info('checkItemEligibility_category_mismatch', {
          productCategory: product.CategoriaID,
          couponCategory: coupon.Restricoes.categoriaId,
          productId: parseInt(productId)
        });
        return { eligible: false, reason: 'Produto não pertence à categoria elegível' };
      }
    }

    // Check minimum value restriction (per item total)
    if (coupon.Restricoes?.valorMinimo) {
      if (itemTotal < coupon.Restricoes.valorMinimo) {
        logger.info('checkItemEligibility_minimum_value_not_met', {
          itemTotal,
          minimumRequired: coupon.Restricoes.valorMinimo,
          productId: parseInt(productId)
        });
        return { eligible: false, reason: `Valor mínimo de R$ ${coupon.Restricoes.valorMinimo.toFixed(2)} não atingido (item: R$ ${itemTotal.toFixed(2)})` };
      }
    }

    // Special check for free shipping coupons
    if (coupon.DescontoTipo === 'frete_gratis') {
      if (!product.FreteGratis) {
        logger.info('checkItemEligibility_free_shipping_not_allowed', {
          productId: parseInt(productId),
          productName: product.Nome,
          freteGratis: product.FreteGratis
        });
        return { eligible: false, reason: 'Produto não permite frete grátis' };
      }
    }

    logger.info('checkItemEligibility_item_eligible', {
      productId: parseInt(productId),
      itemTotal,
      couponId: coupon.CupomID
    });

    return { eligible: true, reason: 'Item elegível para o cupom' };

  } catch (error) {
    logger.error('checkItemEligibility_error', {
      couponId: coupon.CupomID,
      productId: item.ProdutoID || item.produtoId || item.id,
      item,
      error: error.message
    });
    return { eligible: false, reason: 'Erro ao verificar elegibilidade do item' };
  }
};

/**
 * Calculate item-specific discounts
 * @param {Object} coupon - Coupon object
 * @param {Object} itemAnalysis - Item analysis result
 * @returns {Object} Item discount details
 */
const calculateItemDiscounts = (coupon, itemAnalysis) => {
  const { eligibleItems } = itemAnalysis;
  const itemDiscounts = [];
  let totalDiscount = 0;

  for (const item of eligibleItems) {
    const productId = item.ProdutoID || item.produtoId || item.id;
    const itemPrice = item.PrecoUnitario || item.precoUnitario || 0;
    const itemQuantity = item.Quantidade || item.quantidade || 1;
    const itemTotal = itemPrice * itemQuantity;

    let discountAmount = 0;
    let finalAmount = itemTotal;

    if (coupon.DescontoTipo === 'porcentagem') {
      discountAmount = (itemTotal * coupon.DescontoValor) / 100;
      finalAmount = Math.max(0, itemTotal - discountAmount);
    } else if (coupon.DescontoTipo === 'valor_fixo') {
      discountAmount = Math.min(coupon.DescontoValor, itemTotal);
      finalAmount = Math.max(0, itemTotal - discountAmount);
    } else if (coupon.DescontoTipo === 'frete_gratis') {
      // Free shipping doesn't affect item price
      discountAmount = 0;
      finalAmount = itemTotal;
    }

    totalDiscount += discountAmount;

    itemDiscounts.push({
      productId: productId,
      itemTotal: itemTotal,
      discountAmount: discountAmount,
      finalAmount: finalAmount,
      quantity: itemQuantity,
      unitPrice: itemPrice
    });
  }

  return {
    eligibleItems: eligibleItems,
    ineligibleItems: itemAnalysis.ineligibleItems,
    totalDiscount: totalDiscount,
    itemDiscounts: itemDiscounts
  };
};

/**
 * Validate free shipping eligibility
 * @param {Object} coupon - Coupon object
 * @param {Array} cartItems - Cart items array
 * @returns {Object} Free shipping validation result
 */
const validateFreeShippingEligibility = async (coupon, cartItems) => {
  try {
    // Check if all products in cart allow free shipping
    for (const item of cartItems) {
      const productId = item.ProdutoID || item.produtoId || item.id;
      if (!productId) continue;

      const product = await prisma.produto.findUnique({
        where: { ProdutoID: parseInt(productId) },
        select: { FreteGratis: true, Nome: true }
      });

      if (!product || !product.FreteGratis) {
        return {
          eligible: false,
          reason: `O produto "${product?.Nome || 'Produto não encontrado'}" não permite frete grátis`
        };
      }
    }

    return {
      eligible: true,
      reason: 'Todos os produtos permitem frete grátis'
    };

  } catch (error) {
    logger.error('validateFreeShippingEligibility_error', { couponId: coupon.CupomID, error: error.message });
    return {
      eligible: false,
      reason: 'Erro ao validar elegibilidade para frete grátis'
    };
  }
};

/**
 * Calculate discount details
 * @param {Object} coupon - Coupon object
 * @param {Object} cartAnalysis - Cart analysis result
 * @param {Array} allCartItems - All cart items for total calculation
 * @returns {Object} Discount details
 */
const calculateDiscountDetails = (coupon, cartAnalysis, allCartItems = []) => {
  const { eligibleSubtotal, eligibleItems } = cartAnalysis;

  // For category-restricted coupons, apply discount to entire cart
  const discountBase = coupon.Restricoes?.categoriaId ?
    allCartItems.reduce((total, item) => {
      const price = item.PrecoUnitario || item.precoUnitario || 0;
      const quantity = item.Quantidade || item.quantidade || 1;
      return total + (price * quantity);
    }, 0) : eligibleSubtotal;

  let discountAmount = 0;
  let finalAmount = discountBase;

  if (coupon.DescontoTipo === 'porcentagem') {
    discountAmount = (discountBase * coupon.DescontoValor) / 100;
    finalAmount = Math.max(0, discountBase - discountAmount);
  } else if (coupon.DescontoTipo === 'valor_fixo') {
    discountAmount = Math.min(coupon.DescontoValor, discountBase);
    finalAmount = Math.max(0, discountBase - discountAmount);
  } else if (coupon.DescontoTipo === 'frete_gratis') {
    // Free shipping discount will be calculated at checkout
    discountAmount = 0;
    finalAmount = discountBase;
  }

  return {
    eligibleSubtotal: eligibleSubtotal,
    discountAmount: discountAmount,
    finalAmount: finalAmount,
    eligibleItems: eligibleItems,
    discountBase: discountBase
  };
};

export default {
  validateCouponState,
  analyzeItemEligibility,
  checkItemEligibility
};