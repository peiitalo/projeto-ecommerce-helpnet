import { jest } from '@jest/globals';
import { validateCouponState, analyzeCartEligibility } from '../services/couponValidationService.js';
import { validarCupom } from '../controllers/cupomController.js';
import prisma from '../config/prisma.js';

// Mock Prisma client
jest.mock('../config/prisma.js', () => ({
  default: {
    cupom: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
      findMany: jest.fn()
    },
    cupomCliente: {
      findFirst: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      createMany: jest.fn(),
      findMany: jest.fn()
    },
    produto: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    categoria: {
      findUnique: jest.fn(),
      findMany: jest.fn()
    },
    pedido: {
      count: jest.fn(),
      findFirst: jest.fn()
    },
    cliente: {
      findMany: jest.fn()
    },
    clienteVendedor: {
      findMany: jest.fn()
    }
  }
}));

// Mock logger
jest.mock('../utils/logger.js', () => ({
  logger: {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  },
  logControllerError: jest.fn()
}));

// Global test utilities
global.createMockCartItem = (overrides = {}) => ({
  ProdutoID: 1,
  PrecoUnitario: 100,
  Quantidade: 1,
  ...overrides
});

global.createMockCoupon = (overrides = {}) => ({
  CupomID: 1,
  Nome: 'Test Coupon',
  Codigo: 'TEST10',
  Tipo: 'publico',
  DescontoTipo: 'porcentagem',
  DescontoValor: 10,
  DataInicio: new Date('2024-01-01'),
  DataExpiracao: new Date('2024-12-31'),
  LimiteUso: 100,
  UsoPorCliente: 1,
  Ativo: true,
  UsosAtuais: 0,
  CriadoPor: 1,
  Restricoes: null,
  cuponsCliente: [],
  ...overrides
});

global.createMockClient = (overrides = {}) => ({
  ClienteID: 1,
  NomeCompleto: 'Test Client',
  Email: 'test@example.com',
  ...overrides
});

describe('Coupon System Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('1. Basic validation tests', () => {
    test('Valid coupon application', async () => {
      const mockCoupon = createMockCoupon({
        Codigo: 'VALID10',
        Ativo: true,
        DataInicio: new Date('2024-01-01'),
        DataExpiracao: new Date('2024-12-31'),
        UsosAtuais: 0,
        LimiteUso: 100
      });
      const cartItems = [createMockCartItem()];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);

      const result = await validateCouponState('VALID10', cartItems, 1);

      expect(result.state).toBe('active');
      expect(result.reason).toBe('Cupom válido e aplicável');
      expect(result.coupon).toEqual(mockCoupon);
    });

    test('Invalid coupon codes', async () => {
      prisma.cupom.findFirst.mockResolvedValue(null);
      const cartItems = [createMockCartItem()];

      const result = await validateCouponState('INVALID', cartItems, 1);

      expect(result.state).toBe('inactive');
      expect(result.reason).toBe('Cupom não encontrado ou expirado');
    });

    test('Expired coupons', async () => {
      const mockCoupon = createMockCoupon({
        DataExpiracao: new Date('2023-01-01') // Past date
      });
      const cartItems = [createMockCartItem()];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);

      const result = await validateCouponState('EXPIRED', cartItems, 1);

      expect(result.state).toBe('inactive');
      expect(result.reason).toBe('Cupom expirado');
    });

    test('Inactive coupons', async () => {
      const mockCoupon = createMockCoupon({
        Ativo: false
      });
      const cartItems = [createMockCartItem()];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);

      const result = await validateCouponState('INACTIVE', cartItems, 1);

      expect(result.state).toBe('inactive');
      expect(result.reason).toBe('Cupom inativo');
    });

    test('Usage limit exceeded', async () => {
      const mockCoupon = createMockCoupon({
        LimiteUso: 10,
        UsosAtuais: 10
      });
      const cartItems = [createMockCartItem()];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);

      const result = await validateCouponState('LIMITED', cartItems, 1);

      expect(result.state).toBe('inactive');
      expect(result.reason).toBe('Limite total de uso do cupom atingido');
    });
  });

  describe('2. Client eligibility tests', () => {
    test('Public coupons for any client', async () => {
      const mockCoupon = createMockCoupon({
        Tipo: 'publico',
        UsoPorCliente: 2
      });
      const cartItems = [createMockCartItem()];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);
      prisma.pedido.count.mockResolvedValue(1); // Client used once

      const result = await validateCouponState('PUBLIC', cartItems, 1);

      expect(result.state).toBe('active');
    });

    test('Specific coupons for authorized clients only', async () => {
      const mockCoupon = createMockCoupon({
        Tipo: 'especifico'
      });
      const cartItems = [createMockCartItem()];

      prisma.cupom.findFirst.mockResolvedValue({
        ...mockCoupon,
        cuponsCliente: [{ ClienteID: 1, Usado: false, UsosCliente: 0 }]
      });
      prisma.cupomCliente.findFirst.mockResolvedValue({
        ClienteID: 1,
        Usado: false,
        UsosCliente: 0
      });

      const result = await validateCouponState('SPECIFIC', cartItems, 1);

      expect(result.state).toBe('active');
    });

    test('Specific coupons rejected for unauthorized clients', async () => {
      const mockCoupon = createMockCoupon({
        Tipo: 'especifico'
      });
      const cartItems = [createMockCartItem()];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);
      prisma.cupomCliente.findFirst.mockResolvedValue(null);

      const result = await validateCouponState('SPECIFIC', cartItems, 999);

      expect(result.state).toBe('inactive');
      expect(result.reason).toBe('Este cupom não está disponível para você');
    });

    test('Client usage limits', async () => {
      const mockCoupon = createMockCoupon({
        Tipo: 'publico',
        UsoPorCliente: 1
      });
      const cartItems = [createMockCartItem()];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);
      prisma.pedido.count.mockResolvedValue(1); // Already used once

      const result = await validateCouponState('LIMITED', cartItems, 1);

      expect(result.state).toBe('inactive');
      expect(result.reason).toBe('Você já usou este cupom o máximo permitido (1 vez)');
    });
  });

  describe('3. Category and minimum value tests', () => {
    test('Coupons restricted to specific categories', async () => {
      const mockCoupon = createMockCoupon({
        Restricoes: { categoriaId: 1 }
      });
      const cartItems = [
        createMockCartItem({ ProdutoID: 1, PrecoUnitario: 100, Quantidade: 1 })
      ];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);
      prisma.produto.findUnique.mockResolvedValue({ CategoriaID: 1 });

      const result = await validateCouponState('CATEGORY', cartItems, 1);

      expect(result.state).toBe('active');
    });

    test('Coupons rejected when no items match category', async () => {
      const mockCoupon = createMockCoupon({
        Restricoes: { categoriaId: 1 }
      });
      const cartItems = [
        createMockCartItem({ ProdutoID: 1, PrecoUnitario: 100, Quantidade: 1 })
      ];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);
      prisma.produto.findUnique.mockResolvedValue({ CategoriaID: 2 }); // Different category
      prisma.categoria.findUnique.mockResolvedValue({ Nome: 'Electronics' });

      const result = await validateCouponState('CATEGORY', cartItems, 1);

      expect(result.state).toBe('grayed_out');
      expect(result.reason).toContain('Este cupom é válido apenas para produtos da categoria');
    });

    test('Minimum purchase requirements', async () => {
      const mockCoupon = createMockCoupon({
        Restricoes: { valorMinimo: 200 }
      });
      const cartItems = [
        createMockCartItem({ PrecoUnitario: 100, Quantidade: 1 }) // Total: 100, below minimum
      ];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);

      const result = await validateCouponState('MINIMUM', cartItems, 1);

      expect(result.state).toBe('grayed_out');
      expect(result.reason).toBe('Valor mínimo de R$ 200.00 não atingido');
    });

    test('Mixed cart with eligible and ineligible items', async () => {
      const mockCoupon = createMockCoupon({
        Restricoes: { categoriaId: 1 }
      });
      const cartItems = [
        createMockCartItem({ ProdutoID: 1, PrecoUnitario: 100, Quantidade: 1 }), // Eligible
        createMockCartItem({ ProdutoID: 2, PrecoUnitario: 50, Quantidade: 1 })   // Ineligible
      ];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);
      prisma.produto.findUnique
        .mockResolvedValueOnce({ CategoriaID: 1 }) // First product eligible
        .mockResolvedValueOnce({ CategoriaID: 2 }); // Second product ineligible

      const result = await validateCouponState('MIXED', cartItems, 1);

      expect(result.state).toBe('active');
      expect(result.discountDetails.eligibleSubtotal).toBe(100); // Only eligible item
    });
  });

  describe('4. Discount calculation tests', () => {
    test('Percentage discounts on eligible subtotal', async () => {
      const mockCoupon = createMockCoupon({
        DescontoTipo: 'porcentagem',
        DescontoValor: 20 // 20%
      });
      const cartItems = [
        createMockCartItem({ PrecoUnitario: 100, Quantidade: 1 }) // Total: 100
      ];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);

      const result = await validateCouponState('PERCENT', cartItems, 1);

      expect(result.discountDetails.discountAmount).toBe(20); // 20% of 100
      expect(result.discountDetails.finalAmount).toBe(80);
    });

    test('Fixed value discounts (capped at subtotal)', async () => {
      const mockCoupon = createMockCoupon({
        DescontoTipo: 'valor_fixo',
        DescontoValor: 50
      });
      const cartItems = [
        createMockCartItem({ PrecoUnitario: 100, Quantidade: 1 }) // Total: 100
      ];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);

      const result = await validateCouponState('FIXED', cartItems, 1);

      expect(result.discountDetails.discountAmount).toBe(50);
      expect(result.discountDetails.finalAmount).toBe(50);
    });

    test('Fixed value discounts exceeding subtotal', async () => {
      const mockCoupon = createMockCoupon({
        DescontoTipo: 'valor_fixo',
        DescontoValor: 150 // More than subtotal
      });
      const cartItems = [
        createMockCartItem({ PrecoUnitario: 100, Quantidade: 1 }) // Total: 100
      ];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);

      const result = await validateCouponState('FIXED', cartItems, 1);

      expect(result.discountDetails.discountAmount).toBe(100); // Capped at subtotal
      expect(result.discountDetails.finalAmount).toBe(0);
    });

    test('Free shipping coupons', async () => {
      const mockCoupon = createMockCoupon({
        DescontoTipo: 'frete_gratis',
        DescontoValor: 0
      });
      const cartItems = [
        createMockCartItem({ PrecoUnitario: 100, Quantidade: 1 })
      ];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);

      const result = await validateCouponState('FREESHIP', cartItems, 1);

      expect(result.discountDetails.discountAmount).toBe(0);
      expect(result.discountDetails.finalAmount).toBe(100);
    });

    test('Multiple discount types', async () => {
      // Test percentage
      const percentCoupon = createMockCoupon({
        DescontoTipo: 'porcentagem',
        DescontoValor: 10
      });
      const cartItems = [
        createMockCartItem({ PrecoUnitario: 200, Quantidade: 1 })
      ];

      prisma.cupom.findFirst.mockResolvedValue(percentCoupon);

      const percentResult = await validateCouponState('PERCENT', cartItems, 1);
      expect(percentResult.discountDetails.discountAmount).toBe(20);

      // Test fixed
      const fixedCoupon = createMockCoupon({
        DescontoTipo: 'valor_fixo',
        DescontoValor: 25
      });

      prisma.cupom.findFirst.mockResolvedValue(fixedCoupon);

      const fixedResult = await validateCouponState('FIXED', cartItems, 1);
      expect(fixedResult.discountDetails.discountAmount).toBe(25);
    });
  });

  describe('5. Complex cart scenarios', () => {
    test('Cart with only eligible items', async () => {
      const mockCoupon = createMockCoupon({
        Restricoes: { categoriaId: 1, valorMinimo: 50 }
      });
      const cartItems = [
        createMockCartItem({ ProdutoID: 1, PrecoUnitario: 100, Quantidade: 1 }),
        createMockCartItem({ ProdutoID: 2, PrecoUnitario: 50, Quantidade: 1 })
      ];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);
      prisma.produto.findUnique.mockResolvedValue({ CategoriaID: 1 });

      const result = await validateCouponState('ELIGIBLE', cartItems, 1);

      expect(result.state).toBe('active');
      expect(result.discountDetails.eligibleSubtotal).toBe(150);
    });

    test('Cart with mixed eligible/ineligible items', async () => {
      const mockCoupon = createMockCoupon({
        Restricoes: { categoriaId: 1 }
      });
      const cartItems = [
        createMockCartItem({ ProdutoID: 1, PrecoUnitario: 100, Quantidade: 1 }), // Eligible
        createMockCartItem({ ProdutoID: 2, PrecoUnitario: 50, Quantidade: 1 })   // Ineligible
      ];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);
      prisma.produto.findUnique
        .mockResolvedValueOnce({ CategoriaID: 1 })
        .mockResolvedValueOnce({ CategoriaID: 2 });

      const result = await validateCouponState('MIXED', cartItems, 1);

      expect(result.state).toBe('active');
      expect(result.discountDetails.eligibleSubtotal).toBe(100);
    });

    test('Cart below minimum value', async () => {
      const mockCoupon = createMockCoupon({
        Restricoes: { valorMinimo: 200 }
      });
      const cartItems = [
        createMockCartItem({ PrecoUnitario: 50, Quantidade: 2 }) // Total: 100
      ];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);

      const result = await validateCouponState('MINIMUM', cartItems, 1);

      expect(result.state).toBe('grayed_out');
      expect(result.discountDetails.eligibleSubtotal).toBe(100);
    });

    test('Empty cart', async () => {
      const mockCoupon = createMockCoupon();
      const cartItems = [];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);

      const result = await validateCouponState('EMPTY', cartItems, 1);

      expect(result.state).toBe('grayed_out');
      expect(result.reason).toBe('Carrinho vazio');
    });
  });

  describe('6. State validation tests', () => {
    test('Active state when all conditions met', async () => {
      const mockCoupon = createMockCoupon({
        Ativo: true,
        DataExpiracao: new Date('2024-12-31'),
        UsosAtuais: 0,
        LimiteUso: 100
      });
      const cartItems = [createMockCartItem({ PrecoUnitario: 100, Quantidade: 1 })];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);

      const result = await validateCouponState('ACTIVE', cartItems, 1);

      expect(result.state).toBe('active');
      expect(result.reason).toBe('Cupom válido e aplicável');
    });

    test('Grayed out state with specific reasons', async () => {
      const mockCoupon = createMockCoupon({
        Restricoes: { valorMinimo: 200 }
      });
      const cartItems = [createMockCartItem({ PrecoUnitario: 100, Quantidade: 1 })];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);

      const result = await validateCouponState('GRAYED', cartItems, 1);

      expect(result.state).toBe('grayed_out');
      expect(result.reason).toBe('Valor mínimo de R$ 200.00 não atingido');
      expect(result.discountDetails.discountAmount).toBe(0);
    });

    test('Inactive state for expired/unavailable coupons', async () => {
      const mockCoupon = createMockCoupon({
        Ativo: false
      });
      const cartItems = [createMockCartItem()];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);

      const result = await validateCouponState('INACTIVE', cartItems, 1);

      expect(result.state).toBe('inactive');
      expect(result.reason).toBe('Cupom inativo');
    });
  });

  describe('Integration tests - Controller endpoints', () => {
    let mockReq, mockRes;

    beforeEach(() => {
      mockReq = {
        body: {},
        user: { id: 1 }
      };
      mockRes = {
        json: jest.fn(),
        status: jest.fn().mockReturnThis()
      };
    });

    test('Validar cupom endpoint - success', async () => {
      const mockCoupon = createMockCoupon();
      const cartItems = [createMockCartItem()];

      mockReq.body = { codigo: 'VALID', itensCarrinho: cartItems };
      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);

      await validarCupom(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'active',
          valido: true
        })
      );
    });

    test('Validar cupom endpoint - failure', async () => {
      mockReq.body = { codigo: 'INVALID', itensCarrinho: [] };
      prisma.cupom.findFirst.mockResolvedValue(null);

      await validarCupom(mockReq, mockRes);

      expect(mockRes.json).toHaveBeenCalledWith(
        expect.objectContaining({
          state: 'inactive',
          valido: false
        })
      );
    });
  });

  describe('Edge cases and error handling', () => {
    test('Missing required parameters', async () => {
      const result = await validateCouponState('', [], null);

      expect(result.state).toBe('inactive');
      expect(result.reason).toBe('Código do cupom e ID do cliente são obrigatórios');
    });

    test('Database errors are handled gracefully', async () => {
      prisma.cupom.findFirst.mockRejectedValue(new Error('Database connection failed'));
      const cartItems = [createMockCartItem()];

      const result = await validateCouponState('ERROR', cartItems, 1);

      expect(result.state).toBe('inactive');
      expect(result.reason).toBe('Erro interno ao validar cupom');
    });

    test('Invalid coupon types', async () => {
      const mockCoupon = createMockCoupon({
        Tipo: 'invalid_type'
      });
      const cartItems = [createMockCartItem()];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);

      const result = await validateCouponState('INVALID_TYPE', cartItems, 1);

      expect(result.state).toBe('inactive');
      expect(result.reason).toBe('Tipo de cupom inválido');
    });

    test('Future start date', async () => {
      const mockCoupon = createMockCoupon({
        DataInicio: new Date('2025-12-31') // Future date
      });
      const cartItems = [createMockCartItem()];

      prisma.cupom.findFirst.mockResolvedValue(mockCoupon);

      const result = await validateCouponState('FUTURE', cartItems, 1);

      expect(result.state).toBe('inactive');
      expect(result.reason).toBe('Cupom ainda não está ativo');
    });
  });
});