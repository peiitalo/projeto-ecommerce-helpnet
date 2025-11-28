import { jest } from '@jest/globals';

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