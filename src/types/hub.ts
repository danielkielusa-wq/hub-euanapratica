export type ServiceType = 'ai_tool' | 'live_mentoring' | 'recorded_course' | 'consulting';
export type ServiceStatus = 'available' | 'premium' | 'coming_soon';
export type ProductType = 'one_time' | 'lifetime' | 'subscription_monthly' | 'subscription_annual';

export interface HubService {
  id: string;
  name: string;
  description: string | null;
  icon_name: string;
  status: ServiceStatus;
  service_type: ServiceType;
  ribbon: string | null;
  category: string | null;
  route: string | null;
  redirect_url: string | null;
  cta_text: string;
  
  // Display
  is_visible_in_hub: boolean;
  is_highlighted: boolean;
  display_order: number;
  accent_color: string | null;
  
  // Pricing
  price: number;
  price_display: string | null;
  currency: string;
  product_type: ProductType;
  stripe_price_id: string | null;
  
  created_at: string;
  updated_at: string;
}

export interface HubServiceFormData {
  name: string;
  description: string;
  icon_name: string;
  status: ServiceStatus;
  service_type: ServiceType;
  ribbon: string | null;
  category: string;
  route: string;
  redirect_url: string;
  cta_text: string;
  is_visible_in_hub: boolean;
  is_highlighted: boolean;
  display_order: number;
  accent_color: string;
  price: number;
  price_display: string;
  currency: string;
  product_type: ProductType;
  stripe_price_id: string;
}

export const SERVICE_TYPE_LABELS: Record<ServiceType, string> = {
  ai_tool: 'Ferramenta IA',
  live_mentoring: 'Mentoria ao Vivo',
  recorded_course: 'Curso Gravado',
  consulting: 'Consultoria',
};

export const RIBBON_OPTIONS = [
  { value: '', label: 'Nenhum' },
  { value: 'NOVO', label: 'NOVO' },
  { value: 'POPULAR', label: 'POPULAR' },
  { value: 'EXCLUSIVO', label: 'EXCLUSIVO' },
];

export const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  one_time: 'Compra Única',
  lifetime: 'Acesso Vitalício',
  subscription_monthly: 'Assinatura Mensal',
  subscription_annual: 'Assinatura Anual',
};
