-- ============================================================
-- Seed "Termos de Uso" legal page in app_configs
-- ============================================================

INSERT INTO public.app_configs (key, value, description)
VALUES (
  'legal_termos_uso',
  '<h2>1. Aceitação dos Termos</h2>
<p>
  Ao acessar ou utilizar a plataforma EUA na Prática ("Plataforma"), você concorda
  com estes Termos de Uso. Se você não concordar com qualquer parte destes termos,
  não utilize a Plataforma. O uso continuado após alterações nos termos constitui
  aceitação das mudanças.
</p>

<h2>2. Descrição do Serviço</h2>
<p>
  A EUA na Prática é uma plataforma educacional que oferece conteúdos, ferramentas e
  serviços voltados para profissionais brasileiros que desejam desenvolver suas carreiras
  internacionais, incluindo:
</p>
<ul>
  <li>Relatórios de diagnóstico de carreira gerados por inteligência artificial.</li>
  <li>Cursos, aulas e materiais educativos.</li>
  <li>Tradução e análise de títulos profissionais.</li>
  <li>Mentorias e consultorias individuais.</li>
  <li>Comunidade de networking e troca de experiências.</li>
  <li>Vagas de emprego curadas para o mercado internacional.</li>
</ul>

<h2>3. Cadastro e Conta</h2>
<p>
  Para utilizar a Plataforma, você deve criar uma conta fornecendo informações
  verdadeiras e completas. Você é responsável por:
</p>
<ul>
  <li>Manter a confidencialidade de suas credenciais de acesso.</li>
  <li>Todas as atividades realizadas em sua conta.</li>
  <li>Notificar imediatamente qualquer uso não autorizado de sua conta.</li>
</ul>
<p>
  A EUA na Prática reserva-se o direito de suspender ou encerrar contas que violem
  estes termos ou que apresentem atividades suspeitas.
</p>

<h2>4. Uso Aceitável</h2>
<p>Ao utilizar a Plataforma, você concorda em não:</p>
<ul>
  <li>Reproduzir, distribuir ou comercializar conteúdos da Plataforma sem autorização.</li>
  <li>Utilizar a Plataforma para fins ilegais ou não autorizados.</li>
  <li>Tentar acessar áreas restritas ou sistemas da Plataforma sem permissão.</li>
  <li>Publicar conteúdo ofensivo, difamatório ou que viole direitos de terceiros.</li>
  <li>Utilizar bots, scrapers ou ferramentas automatizadas para coletar dados.</li>
  <li>Compartilhar sua conta ou credenciais com terceiros.</li>
</ul>

<h2>5. Propriedade Intelectual</h2>
<p>
  Todo o conteúdo disponível na Plataforma — incluindo textos, vídeos, imagens,
  relatórios, materiais didáticos, software e design — é de propriedade da
  EUA na Prática ou de seus licenciadores e é protegido por leis de direitos autorais.
</p>
<p>
  Os relatórios e análises gerados para você são de uso pessoal e intransferível.
  É proibida a reprodução, distribuição ou comercialização destes conteúdos sem
  autorização expressa.
</p>

<h2>6. Inteligência Artificial</h2>
<p>
  Alguns serviços da Plataforma utilizam inteligência artificial para gerar análises,
  relatórios e recomendações. Estes conteúdos são fornecidos como orientação e não
  constituem aconselhamento profissional, jurídico ou migratório. A EUA na Prática
  não garante a precisão absoluta das análises geradas por IA e recomenda que decisões
  importantes sejam tomadas com acompanhamento profissional adequado.
</p>

<h2>7. Limitação de Responsabilidade</h2>
<p>
  A EUA na Prática não se responsabiliza por:
</p>
<ul>
  <li>Decisões tomadas com base nos conteúdos ou análises disponibilizados na Plataforma.</li>
  <li>Resultados específicos de carreira, emprego ou processos migratórios.</li>
  <li>Interrupções temporárias no serviço por manutenção ou fatores externos.</li>
  <li>Conteúdo publicado por outros usuários na comunidade.</li>
</ul>
<p>
  A Plataforma é fornecida "como está" e nos esforçamos continuamente para manter a
  qualidade e disponibilidade dos serviços.
</p>

<h2>8. Mentorias e Consultorias</h2>
<p>
  Os agendamentos de mentorias e consultorias estão sujeitos à disponibilidade dos
  profissionais. Cancelamentos e reagendamentos devem seguir as políticas específicas
  de cada serviço. Sessões não realizadas por ausência do usuário (no-show) não
  serão reembolsadas.
</p>

<h2>9. Comunicações</h2>
<p>
  Ao criar uma conta, você consente em receber comunicações da Plataforma por email,
  incluindo notificações sobre sua conta, atualizações de serviço e conteúdos
  educativos. Você pode gerenciar suas preferências de comunicação nas configurações
  da conta ou solicitar a remoção pelo email contato@euanapratica.com.
</p>

<h2>10. Alterações nos Termos</h2>
<p>
  A EUA na Prática pode atualizar estes Termos de Uso periodicamente. Alterações
  significativas serão comunicadas por email ou notificação na Plataforma com
  antecedência mínima de 15 dias. O uso continuado da Plataforma após o período
  de notificação constitui aceitação dos novos termos.
</p>

<h2>11. Legislação Aplicável</h2>
<p>
  Estes Termos de Uso são regidos pelas leis da República Federativa do Brasil.
  Qualquer disputa será submetida ao foro da comarca de domicílio do usuário,
  conforme o Código de Defesa do Consumidor.
</p>

<h2>12. Contato</h2>
<p>
  Para dúvidas sobre estes Termos de Uso, entre em contato pelo email
  contato@euanapratica.com.
</p>',
  'Conteúdo HTML da página Termos de Uso'
)
ON CONFLICT (key) DO NOTHING;
