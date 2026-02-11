export interface UpsellImpression {
  id: string;
  user_id: string;
  service_id: string;
  post_id: string;
  confidence_score: number;
  reason: string;
  microcopy: string;
  shown_at: string;
  clicked_at: string | null;
  dismissed_at: string | null;
  converted_at: string | null;
  metadata: Record<string, any>;
}

export interface UpsellBlacklist {
  id: string;
  user_id: string;
  service_id: string;
  blacklisted_until: string;
  created_at: string;
  reason: string;
}

export interface UpsellCardData {
  impressionId: string;
  serviceName: string;
  servicePrice: string;
  microcopy: string;
  reason: string;
  confidence: number;
  checkoutUrl: string | null;
  landingPageUrl: string | null;
}

export interface AnalyzePostResponse {
  match: boolean;
  reason?: string;
  impression_id?: string;
  service?: {
    id: string;
    name: string;
    price_display: string;
    ticto_checkout_url: string | null;
    landing_page_url: string | null;
  };
  microcopy?: string;
  confidence?: number;
}
