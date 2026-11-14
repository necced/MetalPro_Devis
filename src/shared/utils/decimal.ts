import Decimal from 'decimal.js';

/**
 * Decimal.js Configuration
 * Per Cahier des Charges Technique MVP v2.0
 *
 * Precision: 28 digits (sufficient for FCFA calculations)
 * Rounding: ROUND_HALF_UP (standard financial rounding)
 * FCFA has no decimals, but intermediate calculations need precision.
 */

// Configure Decimal.js globally
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP,
  toExpNeg: -7,
  toExpPos: 21,
  minE: -9e15,
  maxE: 9e15,
  crypto: false,
});

/**
 * Creates a Decimal from a number, string, or another Decimal.
 * Input should be a string for monetary values to avoid floating-point issues.
 *
 * @param value - Number, string, or Decimal to convert
 * @returns Decimal instance
 *
 * @example
 * D('1000.50') // Decimal(1000.50)
 * D(1000) // Decimal(1000)
 * D('0.1925') // Decimal(0.1925)
 */
export function D(value: string | number | Decimal): Decimal {
  return new Decimal(value);
}

/**
 * Formats a Decimal as FCFA (Franc CFA) with proper formatting.
 * FCFA has no decimal places - rounds to nearest integer.
 *
 * @param value - Decimal, number, or string to format
 * @returns Formatted string with space as thousands separator and 'FCFA' suffix
 *
 * @example
 * toFCFA('1234567') // '1 234 567 FCFA'
 * toFCFA('1000.50') // '1 001 FCFA' (rounded)
 * toFCFA(0) // '0 FCFA'
 */
export function toFCFA(value: string | number | Decimal): string {
  const decimal = D(value);
  // Round to nearest integer (FCFA has no decimals)
  const rounded = decimal.round();
  // Format with space as thousands separator using Intl.NumberFormat (French locale)
  const formatter = new Intl.NumberFormat('fr-FR', {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return `${formatter.format(Number(rounded))} FCFA`;
}

/**
 * Formats a Decimal as FCFA without the 'FCFA' suffix.
 * Useful for input fields or calculations display.
 *
 * @param value - Decimal, number, or string to format
 * @returns Formatted string with space as thousands separator
 *
 * @example
 * toFCFAValue('1234567') // '1 234 567'
 * toFCFAValue('1000.50') // '1 001'
 */
export function toFCFAValue(value: string | number | Decimal): string {
  const decimal = D(value);
  const rounded = decimal.round();
  const formatter = new Intl.NumberFormat('fr-FR', {
    useGrouping: true,
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  });
  return formatter.format(Number(rounded));
}

/**
 * Parses an FCFA string back to a Decimal.
 * Removes 'FCFA' suffix, spaces, and commas.
 *
 * @param fcfaString - Formatted FCFA string (e.g., '1 234 567 FCFA')
 * @returns Decimal instance
 *
 * @example
 * parseFCFA('1 234 567 FCFA') // Decimal(1234567)
 * parseFCFA('1,234,567') // Decimal(1234567)
 */
export function parseFCFA(fcfaString: string): Decimal {
  // eslint-disable-next-line unicorn/prefer-string-replace-all -- replaceAll doesn't accept regex
  const cleaned = fcfaString
    .replace(/fcfa/gi, '')
    .replaceAll(' ', '')
    .replaceAll(' ', '') // narrow no-break space (U+202F) from Intl.NumberFormat fr-FR
    .replaceAll(',', '')
    .trim();
  return D(cleaned || '0');
}

/**
 * Calculates TVA amount from HT amount and rate.
 *
 * @param montantHT - Amount HT (hors taxes) as Decimal
 * @param tvaTaux - TVA rate (e.g., 0.1925 for 19.25%)
 * @returns TVA amount as Decimal
 */
export function calculerTVA(montantHT: Decimal, tvaTaux: number): Decimal {
  return D(montantHT).mul(tvaTaux);
}

/**
 * Calculates TTC amount from HT amount and TVA rate.
 *
 * @param montantHT - Amount HT as Decimal
 * @param tvaTaux - TVA rate (e.g., 0.1925)
 * @returns TTC amount as Decimal
 */
export function calculerTTC(montantHT: Decimal, tvaTaux: number): Decimal {
  return D(montantHT).mul(1 + tvaTaux);
}

/**
 * Calculates HT amount from TTC amount and TVA rate.
 *
 * @param montantTTC - Amount TTC as Decimal
 * @param tvaTaux - TVA rate (e.g., 0.1925)
 * @returns HT amount as Decimal
 */
export function calculerHT(montantTTC: Decimal, tvaTaux: number): Decimal {
  return D(montantTTC).div(1 + tvaTaux);
}

/**
 * Multiplies quantity by unit price for line total HT.
 *
 * @param quantite - Quantity as Decimal
 * @param prixUnitaire - Unit price as Decimal
 * @returns Line total HT as Decimal
 */
export function calculerLigneHT(quantite: Decimal, prixUnitaire: Decimal): Decimal {
  return D(quantite).mul(prixUnitaire);
}

/**
 * Rounds a Decimal to 2 decimal places for intermediate display.
 * (FCFA final values use toFCFA which rounds to integer)
 *
 * @param value - Decimal to round
 * @returns Rounded Decimal
 */
export function round2(value: Decimal): Decimal {
  return D(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP);
}

/**
 * Checks if a Decimal is zero (within precision).
 *
 * @param value - Decimal to check
 * @returns true if zero
 */
export function isZero(value: Decimal): boolean {
  return D(value).isZero();
}

/**
 * Compares two Decimals for equality (within precision).
 *
 * @param a - First Decimal
 * @param b - Second Decimal
 * @returns true if equal
 */
export function equals(a: Decimal, b: Decimal): boolean {
  return D(a).eq(b);
}

/**
 * Safely divides two Decimals, returning 0 if divisor is zero.
 *
 * @param dividend - Numerator
 * @param divisor - Denominator
 * @returns Result or 0
 */
export function safeDiv(dividend: Decimal, divisor: Decimal): Decimal {
  return D(divisor).isZero() ? D(0) : D(dividend).div(divisor);
}

// Re-export Decimal for advanced usage
export { Decimal } from 'decimal.js';
