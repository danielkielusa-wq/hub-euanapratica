-- Fix: Update landing_page_url for ROTA EUA to use internal route
UPDATE hub_services
SET landing_page_url = '/servicos/rota-eua-45min'
WHERE name = 'Sessão de Direção ROTA EUA™';
