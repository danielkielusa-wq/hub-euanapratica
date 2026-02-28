interface HelpSection {
  title: string;
  content: string;
  steps?: string[];
}

interface HelpPage {
  pageTitle: string;
  description: string;
  sections: HelpSection[];
}

export const LEADS_HELP: HelpPage = {
  pageTitle: 'Leads Dashboard',
  description: 'Seu painel principal para gerenciar leads e priorizar contatos.',
  sections: [
    {
      title: 'O que é este painel?',
      content: 'Aqui você vê todos os leads que preencheram a avaliação de carreira. Cada lead tem uma temperatura (muito-quente, quente, morno, frio) que indica a probabilidade de conversão.',
    },
    {
      title: 'Fluxo diário recomendado',
      content: 'Siga estes passos todos os dias para maximizar conversões:',
      steps: [
        'Use o botão "IA Prioridades do Dia" para gerar sua lista diária',
        'Filtre por temperatura "muito-quente" e "quente" primeiro',
        'Abra cada lead e verifique se há follow-ups atrasados',
        'Envie mensagens via WhatsApp usando os templates inteligentes',
        'Registre todas as interações (chamadas, emails, WhatsApp)',
        'Crie tarefas de follow-up para leads que precisam de acompanhamento',
      ],
    },
    {
      title: 'Temperaturas dos leads',
      content: 'MUITO-QUENTE: Pronto para comprar, prioridade máxima. Contate em até 24h.\nQUENTE: Alto interesse, precisa de pouco estímulo. Contate em até 48h.\nMORNO: Interesse moderado, precisa de nurturing. Agende follow-ups regulares.\nFRIO: Baixo interesse atual. Mantenha na lista mas priorize os mais quentes.',
    },
    {
      title: 'IA Prioridades do Dia',
      content: 'Clique no botão "IA Prioridades do Dia" para gerar automaticamente uma lista priorizada dos leads que você deve contatar hoje. A IA considera temperatura, follow-ups pendentes, tempo sem contato e barreiras.',
    },
  ],
};

export const LEAD_DETAIL_HELP: HelpPage = {
  pageTitle: 'Detalhe do Lead',
  description: 'Tudo sobre um lead específico — contato, interações, tarefas e WhatsApp.',
  sections: [
    {
      title: 'Visão Geral',
      content: 'A aba "Visão Geral" mostra informações de contato, fase ROTA, produto recomendado e follow-ups agendados. Use estas informações para personalizar sua abordagem.',
    },
    {
      title: 'Como usar o WhatsApp',
      content: 'O envio de WhatsApp tem dois modos:',
      steps: [
        'Clique em "WhatsApp" no cabeçalho para abrir o envio via CRM',
        'Na aba "WhatsApp", use "IA Sugerir Mensagem" para gerar mensagens personalizadas',
        'Revise e edite a sugestão antes de enviar',
        'A IA considera o perfil do lead, fase ROTA e histórico de interações',
      ],
    },
    {
      title: 'Gerenciando tarefas',
      content: 'Na aba "Tarefas", você pode criar, editar e completar tarefas. Use "IA Sugerir Tarefas" para gerar sugestões automáticas baseadas no perfil do lead.',
      steps: [
        'Crie tarefas com prazo e prioridade claros',
        'Marque como "feito" quando completar',
        'Use "Pular" apenas quando a tarefa não fizer mais sentido',
      ],
    },
    {
      title: 'Registrando interações',
      content: 'Registre TODAS as interações na aba "Interações" — chamadas, emails, WhatsApp. Isso ajuda a IA a dar sugestões melhores e permite que o admin acompanhe seu trabalho.',
    },
  ],
};

export const ATIVIDADES_HELP: HelpPage = {
  pageTitle: 'Atividades Pendentes',
  description: 'Sua lista de tarefas organizada por urgência e prazo.',
  sections: [
    {
      title: 'Como funciona?',
      content: 'Esta página reúne TODAS as tarefas pendentes de TODOS os leads, organizadas por prazo: atrasadas, hoje, esta semana, futuras e sem prazo. Comece sempre pelas atrasadas!',
    },
    {
      title: 'Prioridades',
      content: 'URGENTE: Faça imediatamente. Geralmente leads quentes com prazo vencido.\nALTA: Faça hoje se possível.\nMÉDIA: Pode ser feita nesta semana.\nBAIXA: Pode esperar, mas não esqueça.',
    },
    {
      title: 'Tipos de tarefa',
      content: 'FOLLOW-UP: Acompanhamento de um contato anterior.\nCONTATO: Primeira abordagem ou retomada.\nREVISÃO: Verificar status, atualizar informações.\nCONVERSÃO: Ação para fechar venda (enviar proposta, agendar call, etc).',
    },
    {
      title: 'Fluxo recomendado',
      content: 'Siga este fluxo para organizar seu dia:',
      steps: [
        'Abra esta página logo de manhã',
        'Resolva todas as tarefas ATRASADAS primeiro',
        'Complete as tarefas de HOJE por ordem de prioridade',
        'Clique em "Ver Lead" para abrir o contexto completo antes de agir',
        'Marque como feito assim que completar cada tarefa',
      ],
    },
  ],
};

export const WEEKLY_REPORT_HELP: HelpPage = {
  pageTitle: 'Inteligência Semanal',
  description: 'Relatório semanal com insights e diretivas do admin.',
  sections: [
    {
      title: 'O que é este relatório?',
      content: 'O relatório de inteligência semanal é gerado por IA e aprovado pelo admin. Ele traz um resumo do status dos leads, oportunidades quentes e pontos de atenção.',
    },
    {
      title: 'Diretivas do Admin',
      content: 'O card de "Diretivas" no topo contém instruções específicas do admin para a semana. Estas são as prioridades que devem guiar seu trabalho. Leia com atenção!',
    },
    {
      title: 'Como usar as informações',
      content: 'Use o relatório para:',
      steps: [
        'Ler as diretivas do admin e ajustar suas prioridades da semana',
        'Identificar leads quentes no briefing e priorizá-los',
        'Usar os "Talking Points" como scripts para abordagens',
        'Comparar com a semana anterior para ver tendências',
      ],
    },
  ],
};
