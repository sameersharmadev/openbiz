// __tests__/validation.test.ts
import { validateAadhaar, validatePAN } from '../utils/validation';

describe('Form Validation', () => {
  describe('Aadhaar Validation', () => {
    test('should accept valid 12-digit Aadhaar', () => {
      expect(validateAadhaar('123456789012')).toBe(true);
    });

    test('should reject invalid Aadhaar format', () => {
      expect(validateAadhaar('12345')).toBe(false);
      expect(validateAadhaar('abcd56789012')).toBe(false);
      expect(validateAadhaar('')).toBe(false);
    });
  });

  describe('PAN Validation', () => {
    test('should accept valid PAN format', () => {
      expect(validatePAN('ABCDE1234F')).toBe(true);
    });

    test('should reject invalid PAN format', () => {
      expect(validatePAN('ABC123')).toBe(false);
      expect(validatePAN('12345ABCDE')).toBe(false);
      expect(validatePAN('')).toBe(false);
    });
  });
});