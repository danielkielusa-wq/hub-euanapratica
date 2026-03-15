export interface CityData {
  id: string;
  city_name: string;
  state_code: string;
  slug: string;
  latitude: number;
  longitude: number;
  base_rent: number;
  base_food: number;
  base_transport: number;
  base_health: number;
  base_other: number;
  salaries_by_field: Record<string, number>;
  ranking: number | null;
  cheaper_alternative: string | null;
  cheaper_alternative_pct: number | null;
  enabled: boolean;
}

export interface UserConfig {
  salary: number;
  familySize: 'single' | 'couple' | 'family';
  children: number;
  lifestyle: 'economic' | 'moderate' | 'high';
  field: string;
}

export interface FamilyMultipliers {
  couple: { rent: number; food: number; transport: number; health: number; other: number };
  family: { rent: number; food: number; transport: number; health: number; other: number };
  child: { rent: number; food: number; transport: number; health: number; other: number };
}

export interface LifestyleMultipliers {
  economic: number;
  moderate: number;
  high: number;
}

export interface SaoPauloBaseline {
  rent: number;
  food: number;
  transport: number;
  other: number;
}

export interface CostBreakdown {
  rent: number;
  food: number;
  transport: number;
  health: number;
  other: number;
}

export interface TaxBreakdown {
  grossMonthly: number;
  netMonthly: number;
  federalTax: number;
  stateTax: number;
  fica: number;
  effectiveRate: number;
}

export interface CalculationResult {
  costs: CostBreakdown;
  total: number;
  monthlySalary: number;
  netMonthlySalary: number;
  tax: TaxBreakdown;
  leftover: number;
  coverage: number;
}

export interface COLConfigs {
  familyMultipliers: FamilyMultipliers;
  lifestyleMultipliers: LifestyleMultipliers;
  fields: string[];
  saoPauloBaseline: SaoPauloBaseline;
}
