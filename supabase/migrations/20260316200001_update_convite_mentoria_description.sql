-- Update description with full structure guide
UPDATE public.email_templates
SET description = 'Convite para lista de espera de mentoria em grupo.

ESTRUTURA:
1. Header — Banner roxo com ícone e título
2. Saudação + Hook — Personalizado com leadName, groupTopic e mentorName
3. O que esperar — 4 cards: sessões ao vivo, tema focado, networking, previsão de início
4. Por que lista de espera — Callout amarelo com urgência (vagas limitadas)
5. Benefícios da lista — 3 itens: notificação antecipada, condição especial, grupo de aquecimento
6. CTA — Botão "Quero Garantir Minha Vaga" → waitlistLink
7. FAQ — 3 perguntas: compromisso, seleção, investimento
8. Footer — Disclaimer + copyright

VARIÁVEIS:
- {{leadName}} = nome do lead
- {{mentorName}} = nome do mentor
- {{groupTopic}} = tema da turma
- {{nextCohortDate}} = previsão de início
- {{waitlistLink}} = link para inscrição na lista'
WHERE name = 'convite_espera_mentoria_grupo';
