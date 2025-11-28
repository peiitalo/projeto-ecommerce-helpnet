import { logger } from "../utils/logger.js";

/**
 * Calculate discount amount based on coupon type and eligible subtotal
 * @param {Object} coupon - Coupon object
 * @param {number} eligibleSubtotal - Subtotal of eligible items
 * @returns {Object} Discount calculation result
 */
export const calculateDiscount = (coupon, eligibleSubtotal) => {
  try {
    if (!coupon || !coupon.DescontoTipo) {
      return {
        discountAmount: 0,
        finalAmount: eligibleSubtotal,
        discountType: 'none',
        description: 'Nenhum desconto aplicado'
      };
    }

    const discountType = coupon.DescontoTipo;
    const discountValue = coupon.DescontoValor || 0;

    let discountAmount = 0;
    let finalAmount = eligibleSubtotal;
    let description = '';

    switch (discountType) {
      case 'porcentagem':
        discountAmount = calculatePercentageDiscount(eligibleSubtotal, discountValue);
        finalAmount = Math.max(0, eligibleSubtotal - discountAmount);
        description = `${discountValue}% de desconto`;
        break;

      case 'valor_fixo':
        discountAmount = calculateFixedDiscount(eligibleSubtotal, discountValue);
        finalAmount = Math.max(0, eligibleSubtotal - discountAmount);
        description = `R$ ${discountAmount.toFixed(2)} de desconto`;
        break;

      case 'frete_gratis':
        // Free shipping doesn't affect the product subtotal
        discountAmount = 0;
        finalAmount = eligibleSubtotal;
        description = 'Frete grátis';
        break;

      default:
        logger.warn('calculateDiscount_unknown_type', { discountType, couponId: coupon.CupomID });
        return {
          discountAmount: 0,
          finalAmount: eligibleSubtotal,
          discountType: 'unknown',
          description: 'Tipo de desconto desconhecido'
        };
    }

    return {
      discountAmount: discountAmount,
      finalAmount: finalAmount,
      discountType: discountType,
      description: description
    };

  } catch (error) {
    logger.error('calculateDiscount_error', {
      couponId: coupon.CupomID,
      eligibleSubtotal,
      error: error.message
    });

    return {
      discountAmount: 0,
      finalAmount: eligibleSubtotal,
      discountType: 'error',
      description: 'Erro no cálculo do desconto'
    };
  }
};

/**
 * Calculate percentage discount
 * @param {number} subtotal - Eligible subtotal
 * @param {number} percentage - Discount percentage
 * @returns {number} Discount amount
 */
const calculatePercentageDiscount = (subtotal, percentage) => {
  // Validate inputs
  if (typeof subtotal !== 'number' || subtotal < 0) {
    logger.warn('calculatePercentageDiscount_invalid_subtotal', { subtotal });
    return 0;
  }

  if (typeof percentage !== 'number' || percentage < 0 || percentage > 100) {
    logger.warn('calculatePercentageDiscount_invalid_percentage', { percentage });
    return 0;
  }

  // Calculate discount
  const discount = (subtotal * percentage) / 100;

  // Ensure discount doesn't exceed subtotal (edge case)
  return Math.min(discount, subtotal);
};

/**
 * Calculate fixed value discount
 * @param {number} subtotal - Eligible subtotal
 * @param {number} fixedAmount - Fixed discount amount
 * @returns {number} Discount amount
 */
const calculateFixedDiscount = (subtotal, fixedAmount) => {
  // Validate inputs
  if (typeof subtotal !== 'number' || subtotal < 0) {
    logger.warn('calculateFixedDiscount_invalid_subtotal', { subtotal });
    return 0;
  }

  if (typeof fixedAmount !== 'number' || fixedAmount < 0) {
    logger.warn('calculateFixedDiscount_invalid_amount', { fixedAmount });
    return 0;
  }

  // Ensure discount doesn't exceed subtotal
  return Math.min(fixedAmount, subtotal);
};

/**
 * Calculate discount for multiple items with different eligibility
 * @param {Object} coupon - Coupon object
 * @param {Array} cartItems - Array of cart items
 * @returns {Object} Detailed discount calculation
 */
export const calculateDetailedDiscount = (coupon, cartItems) => {
  try {
    if (!cartItems || !Array.isArray(cartItems)) {
      return {
        totalDiscount: 0,
        finalAmount: 0,
        itemDiscounts: [],
        summary: {
          eligibleItems: 0,
          ineligibleItems: 0,
          totalOriginal: 0,
          totalDiscount: 0
        }
      };
    }

    let totalOriginal = 0;
    let totalDiscount = 0;
    let eligibleItems = 0;
    let ineligibleItems = 0;
    const itemDiscounts = [];

    // Check if coupon has category restrictions
    const hasCategoryRestriction = coupon.Restricoes?.categoriaId;

    for (const item of cartItems) {
      const productId = item.ProdutoID || item.produtoId || item.id;
      const quantity = item.Quantidade || item.quantidade || 1;
      const unitPrice = item.PrecoUnitario || item.precoUnitario || 0;

      const itemTotal = unitPrice * quantity;
      totalOriginal += itemTotal;

      let itemEligible = true;
      let itemDiscount = 0;
      let discountReason = 'Elegível';

      // Check category eligibility if restriction exists
      if (hasCategoryRestriction) {
        // This would need product category lookup - simplified for now
        // In real implementation, this should check against database
        itemEligible = item.CategoriaID === coupon.Restricoes.categoriaId;
        if (!itemEligible) {
          discountReason = 'Categoria não elegível';
        }
      }

      if (itemEligible) {
        eligibleItems++;
        // Apply discount proportionally to this item
        const itemDiscountResult = calculateDiscount(coupon, itemTotal);
        itemDiscount = itemDiscountResult.discountAmount;
        totalDiscount += itemDiscount;
      } else {
        ineligibleItems++;
      }

      itemDiscounts.push({
        productId: productId,
        quantity: quantity,
        unitPrice: unitPrice,
        itemTotal: itemTotal,
        discountAmount: itemDiscount,
        finalAmount: itemTotal - itemDiscount,
        eligible: itemEligible,
        reason: discountReason
      });
    }

    return {
      totalDiscount: totalDiscount,
      finalAmount: totalOriginal - totalDiscount,
      itemDiscounts: itemDiscounts,
      summary: {
        eligibleItems: eligibleItems,
        ineligibleItems: ineligibleItems,
        totalOriginal: totalOriginal,
        totalDiscount: totalDiscount
      }
    };

  } catch (error) {
    logger.error('calculateDetailedDiscount_error', {
      couponId: coupon.CupomID,
      cartItemsCount: cartItems?.length,
      error: error.message
    });

    return {
      totalDiscount: 0,
      finalAmount: 0,
      itemDiscounts: [],
      summary: {
        eligibleItems: 0,
        ineligibleItems: 0,
        totalOriginal: 0,
        totalDiscount: 0
      }
    };
  }
};

/**
 * Validate discount calculation inputs
 * @param {Object} coupon - Coupon object
 * @param {number} amount - Amount to calculate discount on
 * @returns {Object} Validation result
 */
export const validateDiscountCalculation = (coupon, amount) => {
  const errors = [];

  if (!coupon) {
    errors.push('Cupom é obrigatório');
  } else {
    if (!coupon.DescontoTipo) {
      errors.push('Tipo de desconto não definido');
    }

    if (coupon.DescontoValor === undefined || coupon.DescontoValor === null) {
      errors.push('Valor do desconto não definido');
    }

    if (coupon.DescontoTipo === 'porcentagem' && (coupon.DescontoValor < 0 || coupon.DescontoValor > 100)) {
      errors.push('Percentual de desconto deve estar entre 0 e 100');
    }

    if (coupon.DescontoTipo === 'valor_fixo' && coupon.DescontoValor < 0) {
      errors.push('Valor fixo de desconto deve ser positivo');
    }
  }

  if (typeof amount !== 'number' || amount < 0) {
    errors.push('Valor para desconto deve ser um número positivo');
  }

  return {
    valid: errors.length === 0,
    errors: errors
  };
};

/**
 * Format discount amount for display
 * @param {number} amount - Discount amount
 * @param {string} currency - Currency symbol (default: 'R$')
 * @returns {string} Formatted discount string
 */
export const formatDiscountAmount = (amount, currency = 'R$') => {
  if (typeof amount !== 'number') {
    return '0,00';
  }

  return `${currency} ${amount.toFixed(2).replace('.', ',')}`;
};

/**
 * Calculate savings percentage
 * @param {number} originalAmount - Original amount
 * @param {number} finalAmount - Final amount after discount
 * @returns {number} Savings percentage
 */
export const calculateSavingsPercentage = (originalAmount, finalAmount) => {
  if (typeof originalAmount !== 'number' || typeof finalAmount !== 'number') {
    return 0;
  }

  if (originalAmount <= 0) {
    return 0;
  }

  const savings = originalAmount - finalAmount;
  return Math.round((savings / originalAmount) * 100);
};

export default {
  calculateDiscount,
  calculateDetailedDiscount,
  validateDiscountCalculation,
  formatDiscountAmount,
  calculateSavingsPercentage
};