-- ==================================================
-- Migration: Add anchor_price to hub_services
-- Description: Preco isca (anchor price) exibido riscado ao lado do preco real
-- ==================================================

ALTER TABLE public.hub_services
ADD COLUMN IF NOT EXISTS anchor_price NUMERIC(10,2) DEFAULT NULL;

ALTER TABLE public.hub_services
ADD CONSTRAINT hub_services_anchor_price_gt_price
CHECK (anchor_price IS NULL OR anchor_price > price);
