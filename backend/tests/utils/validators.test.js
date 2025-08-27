const {
  validatePassword,
  validateDocument,
  validateEmail,
  validateCEP,
  validateCodigoIBGE
} = require('../../src/utils/validators');

describe('Validators', () => {
  describe('validatePassword', () => {
    test('should validate strong password', () => {
      const result = validatePassword('StrongPass123!');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject weak password', () => {
      const result = validatePassword('weak');
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('validateEmail', () => {
    test('should validate correct email', () => {
      const result = validateEmail('test@example.com');
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should reject invalid email', () => {
      const result = validateEmail('invalid-email');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });

  describe('validateCEP', () => {
    test('should validate correct CEP', () => {
      const result = validateCEP('12345-678');
      expect(result.isValid).toBe(true);
      expect(result.formatted).toBe('12345-678');
    });

    test('should reject invalid CEP', () => {
      const result = validateCEP('123');
      expect(result.isValid).toBe(false);
      expect(result.errors).toHaveLength(1);
    });
  });
});