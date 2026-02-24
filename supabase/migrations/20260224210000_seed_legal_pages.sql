-- ============================================================
-- Seed legal pages content in app_configs + RPC for public access
-- ============================================================

-- 1. Termos de Assinatura (converted from SubscriptionTerms.tsx)
INSERT INTO public.app_configs (key, value, description)
VALUES (
  'legal_termos_assinatura',
  '<h2>1. Planos e Preços</h2>
<p>
  A plataforma EUA na Prática oferece três níveis de assinatura: Básico (gratuito),
  Pro (R$ 47/mês ou R$ 470/ano) e VIP (R$ 97/mês ou R$ 970/ano). Os preços podem
  ser atualizados com aviso prévio de 30 dias. Alterações de preço não afetam
  ciclos de cobrança já em vigor.
</p>

<h2>2. Cobrança e Renovação</h2>
<p>
  As assinaturas são cobradas automaticamente no início de cada ciclo (mensal ou anual),
  utilizando o método de pagamento cadastrado na plataforma Ticto. A renovação é
  automática até que o cancelamento seja solicitado.
</p>
<p>
  Pagamentos via Pix e Boleto podem levar até 3 dias úteis para confirmação.
  O acesso ao plano será ativado após a confirmação do pagamento.
</p>

<h2>3. Período de Teste</h2>
<p>
  Quando disponível, o período de teste gratuito permite acesso completo aos recursos
  do plano selecionado. Ao final do período, a cobrança será iniciada automaticamente,
  salvo cancelamento prévio.
</p>

<h2>4. Cancelamento</h2>
<p>
  Você pode cancelar sua assinatura a qualquer momento pela plataforma.
  Após o cancelamento:
</p>
<ul>
  <li>Você mantém acesso aos recursos do plano até o final do período já pago.</li>
  <li>Não haverá novas cobranças após o cancelamento.</li>
  <li>Ao final do período, sua conta será automaticamente migrada para o plano Básico.</li>
</ul>

<h2>5. Reembolso</h2>
<p>
  Solicitações de reembolso são aceitas dentro de 7 dias corridos após a cobrança,
  conforme o Código de Defesa do Consumidor. Para solicitar reembolso, entre em
  contato com nosso suporte. Reembolsos são processados pela Ticto e podem levar
  até 10 dias úteis.
</p>

<h2>6. Alteração de Plano</h2>
<p>
  Upgrades (ex: Básico → Pro, Pro → VIP) têm efeito imediato. O novo valor será
  cobrado a partir do próximo ciclo. Downgrades têm efeito ao final do período
  atual — você mantém o acesso ao plano superior até o fim do período pago.
</p>

<h2>7. Falha no Pagamento</h2>
<p>
  Em caso de falha na cobrança, tentaremos processar o pagamento novamente.
  Durante este período, você mantém acesso aos recursos do plano. Se o pagamento
  não for regularizado em até 10 dias, sua assinatura será cancelada e a conta
  migrada para o plano Básico.
</p>

<h2>8. Processamento de Pagamento</h2>
<p>
  Todos os pagamentos são processados pela Ticto, plataforma de pagamentos parceira.
  Métodos aceitos: cartão de crédito, Pix e boleto bancário. Seus dados financeiros
  não são armazenados em nossos servidores.
</p>

<h2>9. Contato</h2>
<p>
  Para dúvidas sobre sua assinatura, entre em contato pelo suporte da plataforma
  ou pelo email contato@euanapratica.com.
</p>',
  'Conteúdo HTML da página Termos de Assinatura'
)
ON CONFLICT (key) DO NOTHING;

-- 2. Política de Privacidade
INSERT INTO public.app_configs (key, value, description)
VALUES (
  'legal_politica_privacidade',
  '<h2>1. Informações que Coletamos</h2>
<p>
  Ao utilizar a plataforma EUA na Prática, coletamos as seguintes informações:
</p>
<ul>
  <li><strong>Dados de cadastro:</strong> nome, email, telefone e informações profissionais fornecidas durante o onboarding.</li>
  <li><strong>Dados de uso:</strong> páginas acessadas, funcionalidades utilizadas, horários de acesso e interações na plataforma.</li>
  <li><strong>Dados de pagamento:</strong> processados exclusivamente pela Ticto — não armazenamos dados de cartão de crédito em nossos servidores.</li>
  <li><strong>Currículos e documentos:</strong> arquivos enviados para análise são processados por inteligência artificial e armazenados de forma segura.</li>
</ul>

<h2>2. Como Utilizamos seus Dados</h2>
<p>Suas informações são utilizadas para:</p>
<ul>
  <li>Fornecer e personalizar os serviços da plataforma.</li>
  <li>Processar assinaturas e pagamentos.</li>
  <li>Enviar comunicações relevantes sobre sua conta e a plataforma.</li>
  <li>Melhorar nossos serviços através de análises de uso.</li>
  <li>Gerar relatórios e análises de carreira personalizados.</li>
</ul>

<h2>3. Armazenamento e Segurança</h2>
<p>
  Seus dados são armazenados em servidores seguros com criptografia em trânsito (TLS)
  e em repouso. Utilizamos o Supabase como infraestrutura de banco de dados, com
  servidores localizados nos Estados Unidos. Implementamos controles de acesso
  rigorosos e políticas de segurança (Row Level Security) para proteger suas informações.
</p>

<h2>4. Compartilhamento com Terceiros</h2>
<p>Seus dados podem ser compartilhados com:</p>
<ul>
  <li><strong>Ticto:</strong> para processamento de pagamentos.</li>
  <li><strong>Provedores de IA (OpenAI, Anthropic):</strong> para análise de currículos e geração de relatórios. Os dados são enviados de forma anonimizada quando possível.</li>
  <li><strong>Resend:</strong> para envio de emails transacionais.</li>
</ul>
<p>
  Não vendemos, alugamos ou compartilhamos seus dados pessoais com terceiros para
  fins de marketing sem seu consentimento explícito.
</p>

<h2>5. Seus Direitos (LGPD)</h2>
<p>
  Em conformidade com a Lei Geral de Proteção de Dados (Lei nº 13.709/2018), você tem direito a:
</p>
<ul>
  <li>Acessar seus dados pessoais armazenados.</li>
  <li>Corrigir dados incompletos, inexatos ou desatualizados.</li>
  <li>Solicitar a exclusão de seus dados pessoais.</li>
  <li>Revogar o consentimento para o tratamento de dados.</li>
  <li>Solicitar a portabilidade de seus dados.</li>
  <li>Obter informações sobre o compartilhamento de seus dados.</li>
</ul>
<p>
  Para exercer qualquer desses direitos, entre em contato pelo email contato@euanapratica.com.
</p>

<h2>6. Cookies e Tecnologias de Rastreamento</h2>
<p>
  Utilizamos cookies essenciais para o funcionamento da plataforma, incluindo autenticação
  e preferências de sessão. Não utilizamos cookies de rastreamento de terceiros para
  fins publicitários.
</p>

<h2>7. Retenção de Dados</h2>
<p>
  Seus dados são mantidos enquanto sua conta estiver ativa. Após o encerramento da conta,
  os dados serão mantidos por até 6 meses para fins legais e administrativos, após o
  que serão permanentemente excluídos.
</p>

<h2>8. Alterações nesta Política</h2>
<p>
  Esta política pode ser atualizada periodicamente. Notificaremos você sobre alterações
  significativas por email ou através da plataforma. O uso continuado da plataforma
  após as alterações constitui aceitação da nova política.
</p>

<h2>9. Contato</h2>
<p>
  Para dúvidas sobre privacidade e proteção de dados, entre em contato pelo email
  contato@euanapratica.com.
</p>',
  'Conteúdo HTML da página Política de Privacidade'
)
ON CONFLICT (key) DO NOTHING;

-- 3. Política de Cancelamento
INSERT INTO public.app_configs (key, value, description)
VALUES (
  'legal_politica_cancelamento',
  '<h2>1. Como Cancelar</h2>
<p>
  Você pode cancelar sua assinatura a qualquer momento diretamente pela plataforma,
  acessando <strong>Minha Conta → Assinatura → Cancelar Assinatura</strong>.
  O processo é simples e não requer contato com suporte.
</p>

<h2>2. O que Acontece Após o Cancelamento</h2>
<p>Ao solicitar o cancelamento:</p>
<ul>
  <li>Você mantém acesso completo a todos os recursos do seu plano até o final do período já pago.</li>
  <li>Nenhuma nova cobrança será realizada após o cancelamento.</li>
  <li>Ao final do período pago, sua conta será automaticamente migrada para o plano Básico (gratuito).</li>
  <li>Seus dados, currículos e relatórios permanecem salvos na plataforma.</li>
</ul>

<h2>3. Direito de Arrependimento</h2>
<p>
  Conforme o Código de Defesa do Consumidor (Art. 49), você tem o direito de desistir
  da assinatura no prazo de 7 (sete) dias corridos a partir da data da contratação ou
  do pagamento, o que ocorrer por último. Neste caso, o reembolso será integral.
</p>

<h2>4. Reembolso</h2>
<p>
  Solicitações de reembolso dentro do prazo de 7 dias serão processadas integralmente.
  O reembolso é realizado pela Ticto, nossa plataforma de pagamentos, e pode levar:
</p>
<ul>
  <li><strong>Cartão de crédito:</strong> até 2 faturas para o estorno aparecer.</li>
  <li><strong>Pix:</strong> até 10 dias úteis para devolução.</li>
  <li><strong>Boleto:</strong> até 10 dias úteis, mediante fornecimento de dados bancários.</li>
</ul>
<p>
  Após o prazo de 7 dias, não serão realizados reembolsos proporcionais ao período
  não utilizado, exceto em casos excepcionais avaliados individualmente.
</p>

<h2>5. Reativação</h2>
<p>
  Após o cancelamento, você pode reativar sua assinatura a qualquer momento escolhendo
  um novo plano na página de preços. Um novo ciclo de cobrança será iniciado na data
  da reativação.
</p>

<h2>6. Falha no Pagamento</h2>
<p>
  Em caso de falha na cobrança automática, tentaremos processar o pagamento novamente.
  Você mantém acesso ao plano durante o período de tentativas. Se o pagamento não
  for regularizado em até 10 dias, a assinatura será cancelada automaticamente e
  sua conta migrada para o plano Básico.
</p>

<h2>7. Contato</h2>
<p>
  Para dúvidas sobre cancelamento e reembolso, entre em contato pelo suporte da
  plataforma ou pelo email contato@euanapratica.com.
</p>',
  'Conteúdo HTML da página Política de Cancelamento'
)
ON CONFLICT (key) DO NOTHING;

-- ============================================================
-- RPC: get_legal_page_content
-- SECURITY DEFINER to bypass app_configs RLS (admin-only)
-- Restricts to only legal_* keys for security
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_legal_page_content(p_page_key TEXT)
RETURNS TABLE (value TEXT) AS $$
BEGIN
  IF p_page_key NOT LIKE 'legal_%' THEN
    RAISE EXCEPTION 'Invalid legal page key';
  END IF;

  RETURN QUERY
    SELECT ac.value
    FROM public.app_configs ac
    WHERE ac.key = p_page_key;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

GRANT EXECUTE ON FUNCTION public.get_legal_page_content(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.get_legal_page_content(TEXT) TO authenticated;
