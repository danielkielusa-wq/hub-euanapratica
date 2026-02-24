-- ========================================
-- CLEANUP: Remove all existing community data
-- ========================================
DELETE FROM public.community_likes;
DELETE FROM public.community_comments;
DELETE FROM public.community_posts;

-- Reset gamification counters
UPDATE public.user_gamification SET
  posts_count = 0,
  comments_count = 0,
  likes_received = 0,
  total_points = 0,
  level = 1;

-- Remove any previously created fake users (from prior migration runs)
DELETE FROM public.user_gamification WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%.fake@enp.com');
DELETE FROM public.user_roles WHERE user_id IN (SELECT id FROM auth.users WHERE email LIKE '%.fake@enp.com');
DELETE FROM public.profiles WHERE id IN (SELECT id FROM auth.users WHERE email LIKE '%.fake@enp.com');
DELETE FROM auth.users WHERE email LIKE '%.fake@enp.com';

-- ========================================
-- CREATE: 6 fake users for realistic community
-- ========================================
DO $$
DECLARE
  v_admin_id UUID;
  v_user1 UUID := gen_random_uuid();
  v_user2 UUID := gen_random_uuid();
  v_user3 UUID := gen_random_uuid();
  v_user4 UUID := gen_random_uuid();
  v_user5 UUID := gen_random_uuid();
  v_user6 UUID := gen_random_uuid();
  v_cat_carreira UUID;
  v_cat_vistos UUID;
  v_cat_networking UUID;
  v_cat_vida UUID;
  v_cat_duvidas UUID;
BEGIN
  -- Get the first admin user (keeps 1 pinned post)
  SELECT ur.user_id INTO v_admin_id
  FROM public.user_roles ur
  WHERE ur.role = 'admin'
  LIMIT 1;

  IF v_admin_id IS NULL THEN
    SELECT id INTO v_admin_id FROM public.profiles LIMIT 1;
  END IF;

  -- Create 6 fake auth.users
  INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, raw_user_meta_data, created_at, updated_at, email_confirmed_at, confirmation_token, recovery_token, is_sso_user)
  VALUES
    (v_user1, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'camila.santos.fake@enp.com',   '', '{"full_name":"Camila Santos"}'::jsonb,   NOW()-INTERVAL '30 days', NOW(), NOW(), '', '', false),
    (v_user2, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'rafael.oliveira.fake@enp.com', '', '{"full_name":"Rafael Oliveira"}'::jsonb, NOW()-INTERVAL '25 days', NOW(), NOW(), '', '', false),
    (v_user3, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'juliana.costa.fake@enp.com',   '', '{"full_name":"Juliana Costa"}'::jsonb,   NOW()-INTERVAL '20 days', NOW(), NOW(), '', '', false),
    (v_user4, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'pedro.mendes.fake@enp.com',    '', '{"full_name":"Pedro Mendes"}'::jsonb,    NOW()-INTERVAL '18 days', NOW(), NOW(), '', '', false),
    (v_user5, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'mariana.silva.fake@enp.com',   '', '{"full_name":"Mariana Silva"}'::jsonb,   NOW()-INTERVAL '15 days', NOW(), NOW(), '', '', false),
    (v_user6, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 'lucas.ferreira.fake@enp.com',  '', '{"full_name":"Lucas Ferreira"}'::jsonb,  NOW()-INTERVAL '12 days', NOW(), NOW(), '', '', false);

  -- The trigger auto-creates profiles, now update them with photos
  UPDATE public.profiles SET profile_photo_url = 'https://i.pravatar.cc/150?img=47' WHERE id = v_user1;
  UPDATE public.profiles SET profile_photo_url = 'https://i.pravatar.cc/150?img=12' WHERE id = v_user2;
  UPDATE public.profiles SET profile_photo_url = 'https://i.pravatar.cc/150?img=23' WHERE id = v_user3;
  UPDATE public.profiles SET profile_photo_url = 'https://i.pravatar.cc/150?img=59' WHERE id = v_user4;
  UPDATE public.profiles SET profile_photo_url = 'https://i.pravatar.cc/150?img=44' WHERE id = v_user5;
  UPDATE public.profiles SET profile_photo_url = 'https://i.pravatar.cc/150?img=33' WHERE id = v_user6;

  -- Get category IDs
  SELECT id INTO v_cat_carreira FROM public.community_categories WHERE slug = 'carreira-jobs';
  SELECT id INTO v_cat_vistos FROM public.community_categories WHERE slug = 'vistos-imigracao';
  SELECT id INTO v_cat_networking FROM public.community_categories WHERE slug = 'networking';
  SELECT id INTO v_cat_vida FROM public.community_categories WHERE slug = 'vida-nos-eua';
  SELECT id INTO v_cat_duvidas FROM public.community_categories WHERE slug = 'duvidas-gerais';

  -- ========================================
  -- POST 1 (Admin — pinned, instructional)
  -- ========================================
  INSERT INTO public.community_posts (user_id, category_id, title, content, image_url, is_pinned, likes_count, comments_count, created_at)
  VALUES (
    v_admin_id,
    v_cat_carreira,
    '5 estratégias que me ajudaram a conseguir um emprego remoto nos EUA',
    'Depois de 8 meses de busca, finalmente consegui uma posição remota como Software Engineer em uma empresa de San Francisco. Quero compartilhar o que funcionou pra mim:

1. **LinkedIn em inglês** — Parece óbvio, mas muita gente subestima. Reescrevi todo meu perfil em inglês, com keywords que os recrutadores americanos buscam.

2. **Portfolio com projetos reais** — Criei 3 projetos que resolviam problemas reais e documentei tudo em inglês no GitHub.

3. **Networking intencional** — Participei de comunidades no Discord e Slack focadas em tech. Mandava 5 mensagens por dia para pessoas da área.

4. **Mock interviews** — Pratiquei com amigos e usei plataformas como Pramp. A diferença entre a primeira e a décima entrevista foi absurda.

5. **Não desisti após rejeições** — Recebi mais de 40 "nos" antes do primeiro "sim". Cada rejeição era feedback gratuito.

Se você está nessa jornada, não desista. O mercado americano valoriza muito profissionais brasileiros pela nossa adaptabilidade e criatividade.',
    'https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=800&h=500&fit=crop',
    true,
    24,
    0,
    NOW() - INTERVAL '2 days'
  );

  -- ========================================
  -- POST 2 (Camila Santos — dúvida real)
  -- ========================================
  INSERT INTO public.community_posts (user_id, category_id, title, content, image_url, likes_count, comments_count, created_at)
  VALUES (
    v_user1,
    v_cat_duvidas,
    'Estou aplicando há 3 meses e zero retorno... o que estou fazendo de errado?',
    'Gente, estou ficando desanimada. Já mandei mais de 60 aplicações pelo LinkedIn e Indeed pra vagas remotas em empresas americanas e não recebi UMA resposta sequer. Nem rejeição automática.

Meu perfil: 4 anos de experiência como UX Designer, portfolio no Behance, inglês intermediário-avançado. Estou aplicando pra posições mid-level.

O que vocês acham que pode ser?

- Será que meu currículo está no formato errado pro mercado americano?
- Preciso usar alguma plataforma específica além de LinkedIn?
- O inglês intermediário já é suficiente ou preciso ser fluente?

Aceito qualquer feedback, inclusive duro. Quero muito fazer essa transição e sei que preciso melhorar em algo, só não sei em quê.

Obrigada desde já!',
    NULL,
    8,
    0,
    NOW() - INTERVAL '18 hours'
  );

  -- ========================================
  -- POST 3 (Rafael Oliveira — compartilhando experiência)
  -- ========================================
  INSERT INTO public.community_posts (user_id, category_id, title, content, image_url, likes_count, comments_count, created_at)
  VALUES (
    v_user2,
    v_cat_carreira,
    'Acabei de receber minha primeira oferta em dólar! Aqui vai o que aprendi',
    'Galera, não acredito que estou escrevendo isso, mas depois de 5 meses de luta recebi uma oferta de uma startup de Austin, TX como Backend Developer. $5,200/mês como contractor.

Vou contar o que fez diferença pra mim porque sei que tem muita gente aqui na mesma jornada:

**O que NÃO funcionou:**
- Aplicar em massa pelo LinkedIn (mandei 200+ e não deu em nada)
- Cursos de "como conseguir emprego nos EUA" (perdi dinheiro)
- Ficar esperando recrutador me achar

**O que FUNCIONOU:**
- Contribuir para projetos open source (foi assim que o CTO me achou)
- Escrever artigos técnicos no Dev.to em inglês
- Participar de hackathons online — ganhei um e coloquei no currículo
- Pedir referral para brasileiros que já trabalham em empresas americanas

A real é: networking > aplicação em massa. Sempre.

Agora estou com uma dúvida: como faço pra receber em dólar morando no Brasil? Estou entre Wise e Husky. Alguém tem experiência?',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800&h=500&fit=crop',
    37,
    0,
    NOW() - INTERVAL '1 day'
  );

  -- ========================================
  -- POST 4 (Juliana Costa — dúvida sobre visto)
  -- ========================================
  INSERT INTO public.community_posts (user_id, category_id, title, content, image_url, likes_count, comments_count, created_at)
  VALUES (
    v_user3,
    v_cat_vistos,
    'Empresa quer me contratar mas não faz sponsorship de visto. Quais minhas opções?',
    'Oi pessoal, estou numa situação complicada e preciso de ajuda.

Fui aprovada no processo seletivo de uma empresa de Chicago como Product Manager. Salário ótimo, time incrível, tudo perfeito... mas eles disseram que não fazem sponsorship de visto H-1B.

Eu quero morar nos EUA, não só trabalhar remoto. Minhas dúvidas:

1. Se eu começar como contractor remota do Brasil, existe chance de eles mudarem de ideia sobre o visto depois?

2. Alguém sabe se o visto O-1 é uma opção viável pra quem é de produto/tech? Vi que é pra "habilidade extraordinária" e não sei se me encaixo.

3. Existe algum tipo de visto que EU posso bancar sem precisar da empresa?

4. Vale a pena contratar um advogado de imigração? Se sim, alguém recomenda?

Estou disposta a investir o que for necessário, só preciso saber o caminho certo.

Obrigada!',
    NULL,
    15,
    0,
    NOW() - INTERVAL '3 days'
  );

  -- ========================================
  -- POST 5 (Pedro Mendes — dúvida prática)
  -- ========================================
  INSERT INTO public.community_posts (user_id, category_id, title, content, image_url, likes_count, comments_count, created_at)
  VALUES (
    v_user4,
    v_cat_vida,
    'Quanto preciso guardar antes de me mudar pros EUA? Alguém faz as contas comigo?',
    'Tô planejando me mudar pra os EUA no segundo semestre e tô tentando calcular quanto preciso de reserva. Quem já fez essa mudança pode me ajudar a entender os custos?

Minha situação: sou dev, tenho uma oferta de emprego em Miami (presencial), salário de $85k/ano. Vou sozinho, sem família.

O que já pesquisei:
- Aluguel em Miami: ~$1,800-2,500/mês (studio/1BR)
- Security deposit: 2 meses de aluguel
- Passagem: ~$800
- Visto e documentação: ~$2,000?

O que NÃO sei:
- Quanto custa mobília básica? Comprar usado no Facebook Marketplace funciona?
- Preciso de carro em Miami ou dá pra usar transporte público?
- Seguro saúde antes do plano da empresa começar — como funciona?
- SSN demora quanto pra sair? Consigo abrir conta em banco sem?
- Quanto de imposto vou pagar efetivamente num salário de $85k?

Quero chegar lá com pelo menos 3 meses de reserva. Alguém consegue me ajudar com essas contas?',
    'https://images.unsplash.com/photo-1533106497176-45ae19e68ba2?w=800&h=500&fit=crop',
    11,
    0,
    NOW() - INTERVAL '5 days'
  );

  -- ========================================
  -- POST 6 (Mariana Silva — networking/experiência)
  -- ========================================
  INSERT INTO public.community_posts (user_id, category_id, title, content, image_url, likes_count, comments_count, created_at)
  VALUES (
    v_user5,
    v_cat_networking,
    'Criei um grupo de mock interview entre brasileiros e está funcionando muito bem',
    'Oi comunidade! Quero compartilhar algo que começou pequeno e virou uma das melhores coisas que fiz pra minha carreira.

Há 2 meses, postei no LinkedIn procurando outros brasileiros que estivessem se preparando pra entrevistas em empresas americanas. 12 pessoas responderam.

Criamos um grupo no WhatsApp e organizamos assim:
- **Terças e quintas às 20h** — simulamos entrevistas técnicas (system design, coding, behavioral)
- Cada sessão tem 1 entrevistador e 1 candidato, os outros assistem e dão feedback
- Rodamos os papéis pra todo mundo praticar dos dois lados
- Tudo em inglês (regra do grupo)

**Resultados depois de 2 meses:**
- 3 pessoas do grupo já receberam ofertas
- Todo mundo melhorou MUITO o inglês técnico
- A confiança nas entrevistas subiu absurdamente

O mais legal é que a gente se apoia de verdade. Quando alguém é rejeitado, o grupo faz debrief e ajuda a melhorar. Quando alguém passa, todo mundo comemora.

Se tiver interesse em criar um grupo assim, recomendo muito. A dica é: mantenha pequeno (8-12 pessoas) e com compromisso de horário fixo, senão morre rápido.

Alguém aqui faz algo parecido?',
    'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=800&h=500&fit=crop',
    42,
    0,
    NOW() - INTERVAL '8 hours'
  );

  -- ========================================
  -- POST 7 (Lucas Ferreira — dúvida real)
  -- ========================================
  INSERT INTO public.community_posts (user_id, category_id, title, content, image_url, likes_count, comments_count, created_at)
  VALUES (
    v_user6,
    v_cat_carreira,
    'PJ ou CLT americana — qual a diferença real no final do mês?',
    'Pessoal, preciso da ajuda de vocês com matemática.

Recebi duas propostas pra trabalhar remoto:

**Proposta A:** Empresa brasileira com contrato CLT, salário de R$18.000/mês + benefícios (VR, plano de saúde, etc.)

**Proposta B:** Startup americana como contractor (PJ), $4.000/mês (~R$24.000 no câmbio atual)

Na proposta B parece que ganho mais, mas quando coloco na ponta do lápis:
- Preciso pagar contador (~R$300/mês)
- Imposto do Simples Nacional (~6-15%?)
- Não tenho FGTS, 13º, férias remuneradas
- Preciso pagar meu próprio plano de saúde
- Câmbio pode variar (e se o dólar cair pra R$4,50?)

Minhas dúvidas concretas:
1. Quanto efetivamente sobra líquido de $4.000 como PJ no Simples?
2. O risco do câmbio é real ou estou exagerando?
3. Vale a pena abrir uma LLC nos EUA ao invés de PJ no Brasil?
4. Como funciona aposentadoria? Contribuo pro INSS como PJ?

Quem trabalha como contractor pode compartilhar quanto efetivamente sobra no bolso? Quero comparar com números reais, não teoria.

Valeu!',
    NULL,
    19,
    0,
    NOW() - INTERVAL '4 days'
  );

  -- ========================================
  -- Update gamification for all posting users
  -- ========================================
  INSERT INTO public.user_gamification (user_id, total_points, level, posts_count, comments_count, likes_received, last_activity_at)
  VALUES
    (v_admin_id, 10, 1, 1, 0, 0, NOW()),
    (v_user1, 10, 1, 1, 0, 0, NOW() - INTERVAL '18 hours'),
    (v_user2, 10, 1, 1, 0, 0, NOW() - INTERVAL '1 day'),
    (v_user3, 10, 1, 1, 0, 0, NOW() - INTERVAL '3 days'),
    (v_user4, 10, 1, 1, 0, 0, NOW() - INTERVAL '5 days'),
    (v_user5, 10, 1, 1, 0, 0, NOW() - INTERVAL '8 hours'),
    (v_user6, 10, 1, 1, 0, 0, NOW() - INTERVAL '4 days')
  ON CONFLICT (user_id) DO UPDATE SET
    total_points = 10,
    level = 1,
    posts_count = 1,
    comments_count = 0,
    likes_received = 0,
    last_activity_at = EXCLUDED.last_activity_at;

END $$;
