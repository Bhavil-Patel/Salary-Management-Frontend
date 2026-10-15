import { formatMoney, formatMoneyExact, MONTHS, getMonthName, numberToWords } from './Index';

describe('Utils/Index', () => {
  describe('formatMoney', () => {
    test('formats INR currency with 0 decimal places by default', () => {
      const result = formatMoney(50000);
      expect(result).toMatch(/₹\s?50,000/);
    });

    test('formats other currencies with US locale formatting', () => {
      const result = formatMoney(50000, 'USD');
      expect(result).toContain('$50,000');
    });

    test('handles 0, null, undefined, and non-numeric strings gracefully', () => {
      expect(formatMoney(0)).toMatch(/₹\s?0/);
      expect(formatMoney(null)).toMatch(/₹\s?0/);
      expect(formatMoney(undefined)).toMatch(/₹\s?0/);
      expect(formatMoney('invalid')).toMatch(/₹\s?0/);
    });

    test('parses numeric string values', () => {
      const result = formatMoney('75000', 'INR');
      expect(result).toMatch(/₹\s?75,000/);
    });
  });

  describe('formatMoneyExact', () => {
    test('formats currency with exactly 2 decimal places', () => {
      const result = formatMoneyExact(1234.5, 'USD');
      expect(result).toBe('$1,234.50');
    });

    test('formats INR with 2 decimal places', () => {
      const result = formatMoneyExact(50000, 'INR');
      expect(result).toMatch(/₹\s?50,000\.00/);
    });

    test('handles 0 and invalid inputs by defaulting to 0.00', () => {
      expect(formatMoneyExact(0, 'USD')).toBe('$0.00');
      expect(formatMoneyExact(null, 'USD')).toBe('$0.00');
    });
  });

  describe('MONTHS', () => {
    test('contains all 12 months with correct value and label', () => {
      expect(MONTHS).toHaveLength(12);
      expect(MONTHS[0]).toEqual({ value: 1, label: 'January' });
      expect(MONTHS[11]).toEqual({ value: 12, label: 'December' });
    });
  });

  describe('getMonthName', () => {
    test('returns correct month name for valid number', () => {
      expect(getMonthName(1)).toBe('January');
      expect(getMonthName('5')).toBe('May');
      expect(getMonthName(12)).toBe('December');
    });

    test('returns fallback string for unknown month numbers', () => {
      expect(getMonthName(13)).toBe('Month 13');
      expect(getMonthName(0)).toBe('Month 0');
      expect(getMonthName(-1)).toBe('Month -1');
    });
  });

  describe('numberToWords', () => {
    test('returns "Zero" for 0 or non-numeric falsy inputs', () => {
      expect(numberToWords(0)).toBe('Zero');
      expect(numberToWords(null)).toBe('Zero');
      expect(numberToWords('')).toBe('Zero');
    });

    test('converts numbers under 20', () => {
      expect(numberToWords(1)).toBe('One Only');
      expect(numberToWords(7)).toBe('Seven Only');
      expect(numberToWords(13)).toBe('Thirteen Only');
      expect(numberToWords(19)).toBe('Nineteen Only');
    });

    test('converts tens and compound numbers under 100', () => {
      expect(numberToWords(20)).toBe('Twenty Only');
      expect(numberToWords(42)).toBe('Forty Two Only');
      expect(numberToWords(99)).toBe('Ninety Nine Only');
    });

    test('converts hundreds, thousands, lakhs, and crores', () => {
      expect(numberToWords(100)).toBe('One Hundred Only');
      expect(numberToWords(105)).toBe('One Hundred Five Only');
      expect(numberToWords(1000)).toBe('One Thousand Only');
      expect(numberToWords(1250)).toBe('One Thousand Two Hundred Fifty Only');
      expect(numberToWords(100000)).toBe('One Lakh Only');
      expect(numberToWords(10000000)).toBe('One Crore Only');
    });

    test('converts large compound amounts (e.g. typical salary values)', () => {
      expect(numberToWords(1575320)).toBe(
        'Fifteen Lakh Seventy Five Thousand Three Hundred Twenty Only'
      );
    });

    test('handles negative numbers by taking absolute value', () => {
      expect(numberToWords(-500)).toBe('Five Hundred Only');
    });
  });
});
