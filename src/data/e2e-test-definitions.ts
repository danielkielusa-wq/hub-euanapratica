import { E2ETestSuite, E2ETestCase } from '@/types/e2e';

export const E2E_TEST_SUITES: E2ETestSuite[] = [
  {
    number: 1,
    name: 'Suite 1 – Autenticação e Controle de Acesso',
    tests: [
      {
        code: 'TC-1.1',
        name: 'Login com credenciais válidas (Student)',
        objective: 'Verificar login do aluno com email/senha corretos',
        expectedResult: 'Redireciona para /dashboard com menu de student',
        relatedUrl: '/login',
        steps: [
          'Acessar /login',
          'Inserir email: aluno@teste.com, senha: teste123',
          'Clicar em "Entrar"',
          'Verificar redirecionamento para /dashboard'
        ]
      },
      {
        code: 'TC-1.2',
        name: 'Login com credenciais válidas (Mentor)',
        objective: 'Verificar login do mentor com email/senha corretos',
        expectedResult: 'Redireciona para /mentor/dashboard com menu de mentor',
        relatedUrl: '/login',
        steps: [
          'Acessar /login',
          'Inserir email: mentor@teste.com, senha: teste123',
          'Clicar em "Entrar"',
          'Verificar redirecionamento para /mentor/dashboard'
        ]
      },
      {
        code: 'TC-1.3',
        name: 'Login com credenciais válidas (Admin)',
        objective: 'Verificar login do admin com email/senha corretos',
        expectedResult: 'Redireciona para /admin/dashboard com menu de admin',
        relatedUrl: '/login',
        steps: [
          'Acessar /login',
          'Inserir email: admin@teste.com, senha: teste123',
          'Clicar em "Entrar"',
          'Verificar redirecionamento para /admin/dashboard'
        ]
      },
      {
        code: 'TC-1.4',
        name: 'Login com credenciais inválidas',
        objective: 'Verificar comportamento com credenciais incorretas',
        expectedResult: 'Mensagem de erro amigável exibida',
        relatedUrl: '/login',
        steps: [
          'Acessar /login',
          'Inserir email e senha incorretos',
          'Clicar em "Entrar"',
          'Verificar exibição de mensagem de erro'
        ]
      },
      {
        code: 'TC-1.5',
        name: 'Logout',
        objective: 'Verificar logout funciona corretamente',
        expectedResult: 'Redireciona para /login após logout',
        relatedUrl: '/dashboard',
        steps: [
          'Fazer login como qualquer role',
          'Clicar no menu de usuário',
          'Clicar em "Sair"',
          'Verificar redirecionamento para /login'
        ]
      },
      {
        code: 'TC-1.6',
        name: 'Acesso negado a rota de admin (Student)',
        objective: 'Verificar que student não acessa rotas de admin',
        expectedResult: 'Redireciona para dashboard próprio',
        relatedUrl: '/admin/dashboard',
        steps: [
          'Fazer login como student',
          'Tentar acessar /admin/dashboard diretamente',
          'Verificar redirecionamento para /dashboard'
        ]
      },
      {
        code: 'TC-1.7',
        name: 'Acesso negado a rota de mentor (Student)',
        objective: 'Verificar que student não acessa rotas de mentor',
        expectedResult: 'Redireciona para dashboard próprio',
        relatedUrl: '/mentor/dashboard',
        steps: [
          'Fazer login como student',
          'Tentar acessar /mentor/dashboard diretamente',
          'Verificar redirecionamento para /dashboard'
        ]
      }
    ]
  },
  {
    number: 2,
    name: 'Suite 2 – Perfil do Usuário',
    tests: [
      {
        code: 'TC-2.1',
        name: 'Visualização do perfil',
        objective: 'Verificar exibição correta dos dados do perfil',
        expectedResult: 'Dados do usuário exibidos corretamente',
        relatedUrl: '/perfil',
        steps: [
          'Fazer login',
          'Acessar /perfil',
          'Verificar nome, email e foto exibidos'
        ]
      },
      {
        code: 'TC-2.2',
        name: 'Edição do perfil',
        objective: 'Verificar edição e salvamento dos dados do perfil',
        expectedResult: 'Alterações salvas com sucesso',
        relatedUrl: '/perfil',
        steps: [
          'Acessar /perfil',
          'Alterar nome ou telefone',
          'Clicar em Salvar',
          'Verificar mensagem de sucesso'
        ]
      }
    ]
  },
  {
    number: 3,
    name: 'Suite 3 – Área do Aluno',
    tests: [
      {
        code: 'TC-3.1',
        name: 'Dashboard do Aluno',
        objective: 'Verificar exibição do dashboard com dados reais',
        expectedResult: 'Dashboard exibe sessões e progresso do aluno',
        relatedUrl: '/dashboard',
        steps: [
          'Fazer login como aluno',
          'Verificar cards de próximas sessões',
          'Verificar progresso dos espaços',
          'Comparar com dados da Agenda'
        ]
      },
      {
        code: 'TC-3.2',
        name: 'Agenda do Aluno',
        objective: 'Verificar exibição correta das sessões',
        expectedResult: 'Agenda mostra sessões dos espaços matriculados',
        relatedUrl: '/agenda',
        steps: [
          'Acessar /agenda',
          'Verificar sessões do calendário',
          'Clicar em uma sessão',
          'Verificar detalhes exibidos'
        ]
      },
      {
        code: 'TC-3.3',
        name: 'Meus Espaços (Aluno)',
        objective: 'Verificar listagem de espaços matriculados',
        expectedResult: 'Lista espaços com status de matrícula ativa',
        relatedUrl: '/meus-espacos',
        steps: [
          'Acessar /meus-espacos',
          'Verificar cards de espaços',
          'Clicar em um espaço',
          'Verificar redirecionamento para detalhes do espaço'
        ]
      },
      {
        code: 'TC-3.4',
        name: 'Tarefas do Aluno (Upload/Download)',
        objective: 'Verificar fluxo completo de upload e download de tarefas',
        expectedResult: 'Upload funciona e download retorna arquivo correto',
        relatedUrl: '/tarefas',
        steps: [
          'Acessar tarefa publicada',
          'Fazer upload de arquivo',
          'Verificar confirmação',
          'Clicar para baixar arquivo',
          'Verificar download sem erro 404'
        ]
      },
      {
        code: 'TC-3.5',
        name: 'Biblioteca do Aluno',
        objective: 'Verificar acesso aos materiais',
        expectedResult: 'Lista materiais disponíveis para download',
        relatedUrl: '/biblioteca',
        steps: [
          'Acessar /biblioteca',
          'Navegar por pastas',
          'Fazer download de material',
          'Verificar sucesso'
        ]
      }
    ]
  },
  {
    number: 4,
    name: 'Suite 4 – Área do Mentor',
    tests: [
      {
        code: 'TC-4.1',
        name: 'Dashboard do Mentor',
        objective: 'Verificar exibição do dashboard do mentor',
        expectedResult: 'Dashboard mostra espaços e sessões do mentor',
        relatedUrl: '/mentor/dashboard',
        steps: [
          'Fazer login como mentor',
          'Verificar cards de resumo',
          'Verificar lista de próximas sessões'
        ]
      },
      {
        code: 'TC-4.2',
        name: 'Meus Espaços (Mentor) - Criação',
        objective: 'Verificar se mentor pode criar espaço',
        expectedResult: 'Botão de criar espaço disponível e funcional',
        relatedUrl: '/mentor/espacos',
        steps: [
          'Acessar /mentor/espacos',
          'Clicar em Criar Espaço',
          'Preencher formulário',
          'Salvar e verificar criação'
        ]
      },
      {
        code: 'TC-4.3',
        name: 'Detalhe do Espaço - Badge de Status',
        objective: 'Verificar estilo visual do badge',
        expectedResult: 'Badge com contraste adequado (texto branco em fundo roxo)',
        relatedUrl: '/mentor/espacos/:id',
        steps: [
          'Acessar detalhe de um espaço',
          'Verificar badge de status',
          'Passar mouse sobre badge',
          'Verificar cores no hover'
        ]
      },
      {
        code: 'TC-4.4',
        name: 'Detalhe do Espaço - Ações de Alunos',
        objective: 'Verificar que ações do menu de alunos funcionam',
        expectedResult: 'Todas as ações executam corretamente',
        relatedUrl: '/mentor/espacos/:id',
        steps: [
          'Acessar aba Alunos',
          'Clicar no menu de ações de um aluno',
          'Testar Ver Perfil',
          'Testar Enviar Mensagem',
          'Testar Transferir de Turma',
          'Testar Ver Histórico',
          'Testar Remover Aluno'
        ]
      },
      {
        code: 'TC-4.5',
        name: 'Criação de Sessão - Tipos',
        objective: 'Verificar opções de tipo de sessão',
        expectedResult: 'Campos para tipo (única/série) e formato (individual/grupo)',
        relatedUrl: '/mentor/espacos/:id/sessoes/nova',
        steps: [
          'Criar nova sessão',
          'Verificar campo de tipo de sessão',
          'Verificar campo de formato',
          'Salvar sessão'
        ]
      },
      {
        code: 'TC-4.6',
        name: 'Criação de Tarefa - Contexto do Espaço',
        objective: 'Verificar preenchimento automático do espaço',
        expectedResult: 'Campo espaço vem preenchido quando vindo de um espaço',
        relatedUrl: '/mentor/tarefas/nova',
        steps: [
          'Acessar espaço > aba Tarefas',
          'Clicar em Criar Tarefa',
          'Verificar campo Espaço preenchido',
          'Verificar horário padrão 12:00',
          'Salvar e verificar redirecionamento'
        ]
      },
      {
        code: 'TC-4.7',
        name: 'Agenda do Mentor',
        objective: 'Verificar exibição da agenda',
        expectedResult: 'Agenda mostra sessões dos espaços do mentor',
        relatedUrl: '/mentor/agenda',
        steps: [
          'Acessar /mentor/agenda',
          'Verificar sessões no calendário',
          'Clicar em sessão',
          'Verificar detalhes'
        ]
      },
      {
        code: 'TC-4.8',
        name: 'Gestão de Tarefas (Mentor)',
        objective: 'Verificar listagem e gestão de tarefas',
        expectedResult: 'Lista tarefas criadas pelo mentor',
        relatedUrl: '/mentor/tarefas',
        steps: [
          'Acessar /mentor/tarefas',
          'Verificar lista de tarefas',
          'Verificar filtros',
          'Acessar detalhes de tarefa'
        ]
      },
      {
        code: 'TC-4.9',
        name: 'Botão Materiais na Agenda',
        objective: 'Verificar funcionalidade do botão Materiais',
        expectedResult: 'Abre materiais do espaço ou mensagem de vazio',
        relatedUrl: '/mentor/agenda',
        steps: [
          'Acessar agenda',
          'Selecionar sessão',
          'Clicar em Materiais',
          'Verificar comportamento'
        ]
      }
    ]
  },
  {
    number: 5,
    name: 'Suite 5 – Área do Admin',
    tests: [
      {
        code: 'TC-5.1',
        name: 'Dashboard do Admin - Cards Clicáveis',
        objective: 'Verificar que cards são clicáveis e navegam corretamente',
        expectedResult: 'Cards redirecionam para páginas correspondentes',
        relatedUrl: '/admin/dashboard',
        steps: [
          'Acessar /admin/dashboard',
          'Clicar em card Total de Usuários',
          'Verificar navegação para /admin/usuarios',
          'Repetir para outros cards'
        ]
      },
      {
        code: 'TC-5.2',
        name: 'Gestão de Espaços (Admin) - Criar/Editar',
        objective: 'Verificar criação e edição de espaços',
        expectedResult: 'Formulários funcionais sem página em branco',
        relatedUrl: '/admin/espacos',
        steps: [
          'Acessar /admin/espacos',
          'Clicar em Novo',
          'Verificar formulário',
          'Preencher e salvar',
          'Editar espaço existente'
        ]
      },
      {
        code: 'TC-5.3',
        name: 'Gestão de Espaços (Admin) - Detalhes',
        objective: 'Verificar página de detalhes do espaço',
        expectedResult: 'Todas as abas funcionais',
        relatedUrl: '/admin/espacos/:id',
        steps: [
          'Acessar detalhes de espaço',
          'Verificar aba Visão Geral',
          'Verificar aba Alunos',
          'Verificar aba Sessões',
          'Verificar aba Tarefas'
        ]
      },
      {
        code: 'TC-5.4',
        name: 'Gestão de Matrículas (Admin)',
        objective: 'Verificar funcionalidades de matrícula',
        expectedResult: 'Pode matricular, transferir, pausar alunos',
        relatedUrl: '/admin/matriculas',
        steps: [
          'Acessar /admin/matriculas',
          'Verificar lista',
          'Criar nova matrícula',
          'Testar filtros'
        ]
      },
      {
        code: 'TC-5.5',
        name: 'Gestão de Usuários (Admin)',
        objective: 'Verificar CRUD completo de usuários',
        expectedResult: 'Pode criar, editar, pausar, ver histórico',
        relatedUrl: '/admin/usuarios',
        steps: [
          'Acessar /admin/usuarios',
          'Criar novo usuário',
          'Editar role de usuário',
          'Pausar usuário',
          'Ver histórico'
        ]
      },
      {
        code: 'TC-5.6',
        name: 'Gestão de Produtos (Admin)',
        objective: 'Verificar CRUD de produtos',
        expectedResult: 'Pode criar, editar, vincular produtos',
        relatedUrl: '/admin/produtos',
        steps: [
          'Acessar /admin/produtos',
          'Criar novo produto',
          'Editar produto',
          'Vincular a espaços'
        ]
      },
      {
        code: 'TC-5.7',
        name: 'Logs e Relatórios (Admin)',
        objective: 'Verificar acesso a logs',
        expectedResult: 'Exibe logs de login e erros',
        relatedUrl: '/admin/relatorios',
        steps: [
          'Acessar /admin/relatorios',
          'Verificar logs de login',
          'Verificar logs de erro'
        ]
      }
    ]
  },
  {
    number: 6,
    name: 'Suite 6 – Rotas Públicas e Recuperação',
    tests: [
      {
        code: 'TC-6.1',
        name: 'Página Inicial',
        objective: 'Verificar landing page',
        expectedResult: 'Exibe página inicial com links para login/cadastro',
        relatedUrl: '/',
        steps: [
          'Acessar /',
          'Verificar conteúdo',
          'Verificar links'
        ]
      },
      {
        code: 'TC-6.2',
        name: 'Registro de Novo Usuário',
        objective: 'Verificar fluxo de cadastro',
        expectedResult: 'Usuário criado e logado com dados corretos',
        relatedUrl: '/cadastro',
        steps: [
          'Acessar /cadastro',
          'Preencher formulário',
          'Submeter',
          'Verificar dados exibidos após login'
        ]
      },
      {
        code: 'TC-6.3',
        name: 'Recuperação de Senha',
        objective: 'Verificar envio de email de recuperação',
        expectedResult: 'Email enviado com sucesso',
        relatedUrl: '/esqueci-senha',
        steps: [
          'Acessar /esqueci-senha',
          'Inserir email válido',
          'Submeter',
          'Verificar recebimento do email'
        ]
      },
      {
        code: 'TC-6.4',
        name: 'Página 404',
        objective: 'Verificar página de erro amigável',
        expectedResult: 'Página 404 com redirect automático',
        relatedUrl: '/pagina-inexistente',
        steps: [
          'Acessar rota inexistente',
          'Verificar mensagem amigável',
          'Verificar botão de retorno',
          'Aguardar redirect automático'
        ]
      }
    ]
  },
  {
    number: 7,
    name: 'Suite 7 – Fluxos E2E Completos',
    tests: [
      {
        code: 'TC-7.1',
        name: 'Fluxo: Mentor cria tarefa, Aluno entrega, Mentor avalia',
        objective: 'Testar fluxo completo de tarefas',
        expectedResult: 'Tarefa criada, entregue e avaliada com sucesso',
        relatedUrl: '/mentor/tarefas',
        steps: [
          'Login como mentor',
          'Criar tarefa publicada',
          'Login como aluno',
          'Acessar e entregar tarefa',
          'Login como mentor',
          'Ver entregas',
          'Avaliar entrega'
        ]
      },
      {
        code: 'TC-7.2',
        name: 'Fluxo: Admin matricula aluno em Espaço',
        objective: 'Testar fluxo completo de matrícula',
        expectedResult: 'Aluno matriculado e com acesso ao espaço',
        relatedUrl: '/admin/matriculas',
        steps: [
          'Login como admin',
          'Acessar gestão de matrículas',
          'Matricular aluno em espaço',
          'Verificar email de notificação',
          'Login como aluno',
          'Verificar acesso ao espaço'
        ]
      }
    ]
  }
];

export const getAllTestCases = (): E2ETestCase[] => {
  return E2E_TEST_SUITES.flatMap(suite =>
    suite.tests.map(test => ({
      ...test,
      suite: suite.name,
      suiteNumber: suite.number
    }))
  );
};

export const getTestCasesByIds = (codes: string[]): E2ETestCase[] => {
  return getAllTestCases().filter(tc => codes.includes(tc.code));
};

export const getTestCasesBySuites = (suiteNumbers: number[]): E2ETestCase[] => {
  return getAllTestCases().filter(tc => suiteNumbers.includes(tc.suiteNumber));
};
