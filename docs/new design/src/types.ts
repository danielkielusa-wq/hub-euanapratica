export type ProductStatus = 'visible' | 'hidden';

export type ProductModality = 'mentorship' | 'consulting' | 'ai_tool' | 'course';

export interface Product {
  id: string;
  order: number;
  name: string;
  subtitle: string;
  category: string;
  badges?: string[];
  modality: ProductModality;
  price: number;
  stripeId: string;
  tictoId?: string;
  status: ProductStatus;
  icon?: string; // Just a placeholder for the icon type
}
