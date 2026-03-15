/**
 * US Tax Estimator (2025 tax year)
 * Simplified estimation for cost-of-living calculator.
 * Not tax advice — for illustrative purposes only.
 */

type FilingStatus = 'single' | 'married';

interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

// 2025 Federal tax brackets
const FEDERAL_BRACKETS: Record<FilingStatus, TaxBracket[]> = {
  single: [
    { min: 0, max: 11925, rate: 0.10 },
    { min: 11925, max: 48475, rate: 0.12 },
    { min: 48475, max: 103350, rate: 0.22 },
    { min: 103350, max: 197300, rate: 0.24 },
    { min: 197300, max: 250525, rate: 0.32 },
    { min: 250525, max: 626350, rate: 0.35 },
    { min: 626350, max: Infinity, rate: 0.37 },
  ],
  married: [
    { min: 0, max: 23850, rate: 0.10 },
    { min: 23850, max: 96950, rate: 0.12 },
    { min: 96950, max: 206700, rate: 0.22 },
    { min: 206700, max: 394600, rate: 0.24 },
    { min: 394600, max: 501050, rate: 0.32 },
    { min: 501050, max: 751600, rate: 0.35 },
    { min: 751600, max: Infinity, rate: 0.37 },
  ],
};

// 2025 Standard deduction
const STANDARD_DEDUCTION: Record<FilingStatus, number> = {
  single: 15000,
  married: 30000,
};

// FICA: Social Security (6.2% up to cap) + Medicare (1.45%)
const SS_RATE = 0.062;
const SS_CAP = 176100; // 2025 wage base
const MEDICARE_RATE = 0.0145;

// State income tax rates (effective average for simplicity)
// States with no income tax: 0
// Progressive states: approximate effective rate at median income
const STATE_TAX_RATES: Record<string, number> = {
  AL: 0.04, AK: 0, AZ: 0.025, AR: 0.039, CA: 0.068,
  CO: 0.044, CT: 0.05, DE: 0.055, DC: 0.065, FL: 0,
  GA: 0.0549, HI: 0.065, ID: 0.058, IL: 0.0495, IN: 0.0305,
  IA: 0.044, KS: 0.046, KY: 0.04, LA: 0.03, ME: 0.055,
  MD: 0.05, MA: 0.05, MI: 0.0425, MN: 0.0585, MS: 0.047,
  MO: 0.048, MT: 0.059, NE: 0.056, NV: 0, NH: 0,
  NJ: 0.055, NM: 0.049, NY: 0.06, NC: 0.045, ND: 0.018,
  OH: 0.035, OK: 0.04, OR: 0.08, PA: 0.0307, RI: 0.05,
  SC: 0.044, SD: 0, TN: 0, TX: 0, UT: 0.0465,
  VT: 0.055, VA: 0.0575, WA: 0, WV: 0.055, WI: 0.053, WY: 0,
};

function calculateFederalTax(taxableIncome: number, filing: FilingStatus): number {
  const brackets = FEDERAL_BRACKETS[filing];
  let tax = 0;
  for (const bracket of brackets) {
    if (taxableIncome <= bracket.min) break;
    const taxableInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
    tax += taxableInBracket * bracket.rate;
  }
  return Math.round(tax);
}

function calculateFICA(grossIncome: number): { socialSecurity: number; medicare: number } {
  const socialSecurity = Math.round(Math.min(grossIncome, SS_CAP) * SS_RATE);
  const medicare = Math.round(grossIncome * MEDICARE_RATE);
  return { socialSecurity, medicare };
}

export interface TaxEstimate {
  grossAnnual: number;
  grossMonthly: number;
  netAnnual: number;
  netMonthly: number;
  federalTax: number;
  stateTax: number;
  fica: number;
  effectiveRate: number;
}

export function estimateNetSalary(
  grossAnnual: number,
  stateCode: string,
  familySize: 'single' | 'couple' | 'family',
): TaxEstimate {
  const filing: FilingStatus = familySize === 'single' ? 'single' : 'married';
  const deduction = STANDARD_DEDUCTION[filing];

  // Federal
  const taxableIncome = Math.max(0, grossAnnual - deduction);
  const federalTax = calculateFederalTax(taxableIncome, filing);

  // State
  const stateRate = STATE_TAX_RATES[stateCode] ?? 0.05;
  const stateTax = Math.round(taxableIncome * stateRate);

  // FICA (on gross, no deduction)
  const { socialSecurity, medicare } = calculateFICA(grossAnnual);
  const fica = socialSecurity + medicare;

  const totalTax = federalTax + stateTax + fica;
  const netAnnual = grossAnnual - totalTax;
  const effectiveRate = grossAnnual > 0 ? Math.round((totalTax / grossAnnual) * 100) : 0;

  return {
    grossAnnual,
    grossMonthly: Math.round(grossAnnual / 12),
    netAnnual,
    netMonthly: Math.round(netAnnual / 12),
    federalTax,
    stateTax,
    fica,
    effectiveRate,
  };
}
