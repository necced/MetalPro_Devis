import { describe, it, expect } from 'vitest';
import {
  D,
  toFCFA,
  toFCFAValue,
  parseFCFA,
  calculerTVA,
  calculerTTC,
  calculerHT,
  calculerLigneHT,
  round2,
  isZero,
  equals,
  safeDiv,
} from './decimal';

describe('Decimal.js Wrapper — FCFA Calculations', () => {
  describe('D() — Decimal factory', () => {
    it('creates Decimal from string', () => {
      expect(D('1000.50').toString()).toBe('1000.5');
    });
    it('creates Decimal from number', () => {
      expect(D(1000).toString()).toBe('1000');
    });
    it('creates Decimal from Decimal', () => {
      expect(D(D('100')).toString()).toBe('100');
    });
  });

  describe('toFCFA() — Formatage FCFA avec suffixe', () => {
    it('formats integer with space thousands separator', () => {
      expect(toFCFA('1234567')).toBe('1 234 567 FCFA');
    });
    it('rounds decimals to nearest integer', () => {
      expect(toFCFA('1000.50')).toBe('1 001 FCFA');
      expect(toFCFA('1000.49')).toBe('1 000 FCFA');
    });
    it('handles zero', () => {
      expect(toFCFA(0)).toBe('0 FCFA');
    });
    it('handles negative values', () => {
      expect(toFCFA('-1234567')).toBe('-1 234 567 FCFA');
    });
    it('handles large numbers', () => {
      expect(toFCFA('999999999999')).toBe('999 999 999 999 FCFA');
    });
  });

  describe('toFCFAValue() — Formatage FCFA sans suffixe', () => {
    it('formats without FCFA suffix', () => {
      expect(toFCFAValue('1234567')).toBe('1 234 567');
    });
    it('rounds decimals', () => {
      expect(toFCFAValue('1000.50')).toBe('1 001');
    });
  });

  describe('parseFCFA() — Parsing chaîne FCFA vers Decimal', () => {
    it('parses FCFA with suffix and spaces', () => {
      expect(parseFCFA('1 234 567 FCFA').toString()).toBe('1234567');
    });
    it('parses with commas', () => {
      expect(parseFCFA('1,234,567').toString()).toBe('1234567');
    });
    it('parses lowercase fcfa', () => {
      expect(parseFCFA('1 234 567 fcfa').toString()).toBe('1234567');
    });
    it('handles empty/whitespace', () => {
      expect(parseFCFA('').toString()).toBe('0');
      expect(parseFCFA('   ').toString()).toBe('0');
    });
  });

  describe('calculerTVA() — Calcul TVA depuis HT', () => {
    it('calculates 19.25% TVA on 100000 FCFA', () => {
      expect(calculerTVA(D('100000'), 0.1925).toString()).toBe('19250');
    });
    it('calculates 0% TVA (exonéré)', () => {
      expect(calculerTVA(D('100000'), 0).toString()).toBe('0');
    });
    it('handles decimal HT amounts', () => {
      expect(calculerTVA(D('1000.50'), 0.1925).toString()).toBe('192.59625');
    });
    it('handles zero HT', () => {
      expect(calculerTVA(D(0), 0.1925).toString()).toBe('0');
    });
  });

  describe('calculerTTC() — Calcul TTC depuis HT', () => {
    it('calculates TTC with 19.25% TVA', () => {
      expect(calculerTTC(D('100000'), 0.1925).toString()).toBe('119250');
    });
    it('equals HT when TVA is 0%', () => {
      expect(calculerTTC(D('100000'), 0).toString()).toBe('100000');
    });
    it('handles decimal HT', () => {
      expect(calculerTTC(D('1000.50'), 0.1925).toString()).toBe('1193.09625');
    });
  });

  describe('calculerHT() — Calcul HT depuis TTC', () => {
    it('reverse calculates HT from TTC with 19.25% TVA', () => {
      const ht = calculerHT(D('119250'), 0.1925);
      expect(ht.toString()).toBe('100000');
    });
    it('equals TTC when TVA is 0%', () => {
      expect(calculerHT(D('100000'), 0).toString()).toBe('100000');
    });
  });

  describe('calculerLigneHT() — Total ligne HT (quantité × prix)', () => {
    it('multiplies quantity by unit price', () => {
      expect(calculerLigneHT(D(5), D(1000)).toString()).toBe('5000');
    });
    it('handles decimal quantities', () => {
      expect(calculerLigneHT(D('2.5'), D('1000')).toString()).toBe('2500');
    });
    it('handles decimal prices', () => {
      expect(calculerLigneHT(D(3), D('1000.50')).toString()).toBe('3001.5');
    });
    it('returns zero for zero quantity', () => {
      expect(calculerLigneHT(D(0), D(1000)).toString()).toBe('0');
    });
  });

  describe('round2() — Arrondi 2 décimales', () => {
    it('rounds to 2 decimal places', () => {
      expect(round2(D('1.234')).toString()).toBe('1.23');
      expect(round2(D('1.235')).toString()).toBe('1.24');
    });
    it('handles whole numbers', () => {
      expect(round2(D(100)).toString()).toBe('100');
    });
  });

  describe('isZero() — Vérification zéro', () => {
    it('returns true for zero', () => {
      expect(isZero(D(0))).toBe(true);
      expect(isZero(D('0.000'))).toBe(true);
    });
    it('returns false for non-zero', () => {
      expect(isZero(D('0.001'))).toBe(false);
      expect(isZero(D('-0.001'))).toBe(false);
    });
  });

  describe("equals() — Comparaison d'égalité", () => {
    it('returns true for equal values', () => {
      expect(equals(D('100.00'), D('100'))).toBe(true);
      expect(equals(D('1.2345'), D('1.2345'))).toBe(true);
    });
    it('returns false for different values', () => {
      expect(equals(D('100'), D('101'))).toBe(false);
    });
  });

  describe('safeDiv() — Division sécurisée', () => {
    it('divides normally', () => {
      expect(safeDiv(D(100), D(4)).toString()).toBe('25');
    });
    it('returns 0 when divisor is zero', () => {
      expect(safeDiv(D(100), D(0)).toString()).toBe('0');
    });
    it('returns 0 when divisor is 0.0', () => {
      expect(safeDiv(D(100), D('0.0')).toString()).toBe('0');
    });
  });

  describe('Round-trip HT → TTC → HT', () => {
    it('preserves HT value through TTC conversion', () => {
      const originalHT = D('123456');
      const ttc = calculerTTC(originalHT, 0.1925);
      const backToHT = calculerHT(ttc, 0.1925);
      expect(backToHT.toString()).toBe('123456');
    });
    it('works with various TVA rates (régime simplifié)', () => {
      const originalHT = D('50000');
      const ttc = calculerTTC(originalHT, 0.1925);
      const backToHT = calculerHT(ttc, 0.1925);
      expect(backToHT.toString()).toBe('50000');
    });
    it('works with exonéré (0%)', () => {
      const originalHT = D('75000');
      const ttc = calculerTTC(originalHT, 0);
      const backToHT = calculerHT(ttc, 0);
      expect(backToHT.toString()).toBe('75000');
    });
  });

  describe('TVA Regimes — Normal / Simplifié / Exonéré', () => {
    it('régime normal: 19.25% standard', () => {
      const ht = D('100000');
      const tva = calculerTVA(ht, 0.1925);
      const ttc = calculerTTC(ht, 0.1925);
      expect(tva.toString()).toBe('19250');
      expect(ttc.toString()).toBe('119250');
    });
    it('régime simplifié: même taux 19.25% (selon DEC-007)', () => {
      const ht = D('100000');
      const tva = calculerTVA(ht, 0.1925);
      expect(tva.toString()).toBe('19250');
    });
    it('régime exonéré: 0% TVA', () => {
      const ht = D('100000');
      const tva = calculerTVA(ht, 0);
      const ttc = calculerTTC(ht, 0);
      expect(tva.toString()).toBe('0');
      expect(ttc.toString()).toBe('100000');
    });
  });
});
