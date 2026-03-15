import type { CityData, UserConfig, FamilyMultipliers, LifestyleMultipliers, CalculationResult, SaoPauloBaseline } from '../types';
import { estimateNetSalary } from './taxEstimator';

const DEFAULT_FAMILY_MULTIPLIERS: FamilyMultipliers = {
  couple: { rent: 1.2, food: 1.8, transport: 1.5, health: 2.0, other: 1.4 },
  family: { rent: 1.2, food: 1.8, transport: 1.5, health: 2.0, other: 1.4 },
  child:  { rent: 0.15, food: 0.4, transport: 0.1, health: 0.5, other: 0.2 },
};

const DEFAULT_LIFESTYLE_MULTIPLIERS: LifestyleMultipliers = {
  economic: 0.85,
  moderate: 1.0,
  high: 1.3,
};

export function calculateCityCosts(
  city: CityData,
  config: UserConfig,
  familyMult?: FamilyMultipliers,
  lifestyleMult?: LifestyleMultipliers,
): CalculationResult {
  const fm = familyMult || DEFAULT_FAMILY_MULTIPLIERS;
  const lm = lifestyleMult || DEFAULT_LIFESTYLE_MULTIPLIERS;

  const isCouple = config.familySize === 'couple';
  const isFamily = config.familySize === 'family';
  const kids = isFamily ? config.children : 0;

  const categories = ['rent', 'food', 'transport', 'health', 'other'] as const;
  const baseCosts = {
    rent: city.base_rent,
    food: city.base_food,
    transport: city.base_transport,
    health: city.base_health,
    other: city.base_other,
  };

  const costs = {} as Record<typeof categories[number], number>;

  for (const cat of categories) {
    let mult = 1;
    if (isCouple) {
      mult += (fm.couple?.[cat] ?? 1) - 1;
    } else if (isFamily) {
      mult += (fm.family?.[cat] ?? fm.couple?.[cat] ?? 1) - 1;
    }
    if (isFamily && kids > 0) {
      mult += (fm.child?.[cat] ?? 0) * kids;
    }
    const lifeMult = lm[config.lifestyle] ?? 1;
    costs[cat] = Math.round(baseCosts[cat] * mult * lifeMult);
  }

  const total = costs.rent + costs.food + costs.transport + costs.health + costs.other;
  const monthlySalary = Math.round(config.salary / 12);

  // Tax estimation
  const taxEst = estimateNetSalary(config.salary, city.state_code, config.familySize);
  const netMonthlySalary = taxEst.netMonthly;

  const leftover = netMonthlySalary - total;
  const coverage = Math.min(Math.round((netMonthlySalary / total) * 100), 999);

  return {
    costs,
    total,
    monthlySalary,
    netMonthlySalary,
    tax: {
      grossMonthly: monthlySalary,
      netMonthly: netMonthlySalary,
      federalTax: taxEst.federalTax,
      stateTax: taxEst.stateTax,
      fica: taxEst.fica,
      effectiveRate: taxEst.effectiveRate,
    },
    leftover,
    coverage,
  };
}

export function calculateBrComparison(
  totalUsd: number,
  baseline: SaoPauloBaseline,
): number {
  const spTotal = baseline.rent + baseline.food + baseline.transport + baseline.other;
  if (spTotal === 0) return 0;
  return Math.round(((totalUsd - spTotal) / spTotal) * 100);
}

export function rankCities(
  cities: CityData[],
  config: UserConfig,
  familyMult?: FamilyMultipliers,
  lifestyleMult?: LifestyleMultipliers,
) {
  return cities
    .map(city => {
      const result = calculateCityCosts(city, config, familyMult, lifestyleMult);
      return { city, ...result };
    })
    .sort((a, b) => b.leftover - a.leftover);
}
