import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useMentorEspacosWithStats } from '@/hooks/useMentorEspacosWithStats';
import { NetflixEspacoCard } from '@/components/espacos/NetflixEspacoCard';
import { Loader2, Search, GraduationCap, Plus, Filter, HelpCircle, BookOpen } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

export default function MentorEspacos() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [filtersOpen, setFiltersOpen] = useState(false);
  
  const { data: espacos, isLoading } = useMentorEspacosWithStats();

  const filteredEspacos = (espacos || []).filter(espaco => {
    const matchesSearch = espaco.name.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || espaco.status === statusFilter;
    const matchesCategory = categoryFilter === 'all' || espaco.category === categoryFilter;
    return matchesSearch && matchesStatus && matchesCategory;
  });

  return (
    <DashboardLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Meus Espaços</h1>
            <p className="text-muted-foreground">
              Gerencie suas mentorias, imersões e programas
            </p>
          </div>
          <div className="flex items-center gap-2">
            <EspacosDocsSheet />
            <Button variant="gradient" onClick={() => navigate('/mentor/espacos/novo')}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Espaço
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="space-y-4">
          <div className="flex gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar espaço..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 rounded-xl"
              />
            </div>
            <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="gap-2 rounded-xl">
                  <Filter className="h-4 w-4" />
                  Filtros
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>

          <Collapsible open={filtersOpen} onOpenChange={setFiltersOpen}>
            <CollapsibleContent className="space-y-0">
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="active">Em Andamento</SelectItem>
                    <SelectItem value="inactive">Inativo</SelectItem>
                    <SelectItem value="completed">Concluído</SelectItem>
                    <SelectItem value="arquivado">Arquivados</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger className="w-full sm:w-[180px] rounded-xl">
                    <SelectValue placeholder="Categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas Categorias</SelectItem>
                    <SelectItem value="immersion">Imersão</SelectItem>
                    <SelectItem value="group_mentoring">Mentoria em Grupo</SelectItem>
                    <SelectItem value="workshop">Workshop</SelectItem>
                    <SelectItem value="bootcamp">Bootcamp</SelectItem>
                    <SelectItem value="course">Curso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : filteredEspacos.length === 0 ? (
          <Card className="rounded-[24px]">
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <GraduationCap className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold text-foreground">Nenhum espaço encontrado</h3>
              <p className="text-muted-foreground mt-1 max-w-sm">
                {search || statusFilter !== 'all' || categoryFilter !== 'all' 
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Você ainda não possui espaços. Clique em "Criar Espaço" para começar.'}
              </p>
              {!search && statusFilter === 'all' && categoryFilter === 'all' && (
                <Button className="mt-4 rounded-xl" onClick={() => navigate('/mentor/espacos/novo')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Criar Espaço
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 w-full">
            {filteredEspacos.map((espaco) => (
              <NetflixEspacoCard key={espaco.id} espaco={espaco} role="mentor" />
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

// ─── Documentation Sheet ──────────────────────────────────────────────

function DocSection({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="font-semibold text-base flex items-center gap-2">
        <span className="h-6 w-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
          {num}
        </span>
        {title}
      </h3>
      <div className="text-muted-foreground leading-relaxed space-y-1.5 pl-8">
        {children}
      </div>
    </section>
  );
}

function EspacosDocsSheet() {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <HelpCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Documentação</span>
        </Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-xl overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            Documentação — Espaços do Mentor
          </SheetTitle>
          <SheetDescription>
            Guia completo de funcionamento, workflow e notificações automáticas dos Espaços.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-6 space-y-6 text-sm">

          <DocSection num="1" title="O que são Espaços?">
            <p>Espaços são ambientes de aprendizagem onde você organiza e conduz suas mentorias, imersões, workshops, bootcamps e cursos.</p>
            <p>Cada espaço possui seus próprios alunos matriculados, sessões ao vivo, tarefas, materiais e discussões — tudo centralizado em um único lugar.</p>
            <p><strong>Categorias disponíveis:</strong> Imersão, Mentoria em Grupo, Workshop, Bootcamp e Curso.</p>
            <p><strong>Visibilidade:</strong> Público (aparece no catálogo) ou Privado (apenas por convite).</p>
          </DocSection>

          <div className="border-t" />

          <DocSection num="2" title="Workflow Completo">
            <p><strong>1. Criar Espaço</strong> — Clique em "Criar Espaço", preencha nome, categoria, descrição, datas e limite de alunos. O espaço é criado como "Ativo" por padrão.</p>
            <p><strong>2. Convidar Alunos</strong> — Na página do espaço, use o botão "Convidar" para enviar convites por email (individual ou em lote). Também é possível matricular diretamente alunos já cadastrados na plataforma.</p>
            <p><strong>3. Criar Sessões</strong> — Agende sessões ao vivo com data/hora, duração e link de reunião. Os alunos são notificados automaticamente.</p>
            <p><strong>4. Publicar Tarefas</strong> — Crie tarefas com descrição, prazo de entrega e materiais de apoio. Ao publicar, todos os alunos são notificados.</p>
            <p><strong>5. Subir Materiais</strong> — Organize materiais em pastas (PDFs, vídeos, links). Os alunos recebem notificação de novos materiais.</p>
            <p><strong>6. Avaliar Entregas</strong> — Use o quadro Kanban para gerenciar entregas: Pendente → Enviada → Aprovada / Em Revisão / Rejeitada. O aluno é notificado do resultado.</p>
            <p><strong>7. Acompanhar Engajamento</strong> — Monitore o "Churn Score" de cada aluno (presença, entregas, recência) e receba alertas de alunos inativos.</p>
            <p><strong>8. Arquivar</strong> — Ao concluir o programa, arquive o espaço. Ele pode ser restaurado a qualquer momento.</p>
          </DocSection>

          <div className="border-t" />

          <DocSection num="3" title="Fluxo de Convites">
            <p><strong>Envio:</strong> Ao convidar, um email é enviado ao aluno com link de acesso. O convite tem validade de 7 dias.</p>
            <p><strong>Novo usuário:</strong> Se o convidado não tem conta, o link direciona para a página de cadastro. Após criar a conta, é matriculado automaticamente no espaço.</p>
            <p><strong>Usuário existente:</strong> Se já tem conta, o link aceita o convite e matricula diretamente.</p>
            <p><strong>Fallback:</strong> Se o envio de email falhar, você recebe o link de convite para compartilhar manualmente (WhatsApp, etc).</p>
            <p><strong>Status dos convites:</strong> Pendente, Aceito, Expirado ou Cancelado — visíveis na aba de Alunos do espaço.</p>
          </DocSection>

          <div className="border-t" />

          <DocSection num="4" title="Notificações Automáticas">
            <p className="font-medium text-foreground">Para os alunos (email + in-app):</p>
            <p><strong>Convite para o espaço</strong> — Email com link de acesso ao ser convidado.</p>
            <p><strong>Nova tarefa publicada</strong> — Email + notificação in-app quando você publica uma nova tarefa.</p>
            <p><strong>Tarefa avaliada</strong> — Email + notificação in-app quando você avalia a entrega (aprovada, em revisão ou rejeitada).</p>
            <p><strong>Novo material disponível</strong> — Notificação in-app quando você adiciona material ao espaço.</p>
            <p><strong>Nova entrega recebida (mentor)</strong> — Email + notificação in-app quando um aluno submete uma tarefa.</p>
            <p><strong>Aluno matriculado (mentor)</strong> — Email + notificação in-app quando um aluno aceita o convite ou é matriculado diretamente.</p>

            <p className="font-medium text-foreground mt-3">Automáticas via cron (in-app only):</p>
            <p><strong>Lembrete de prazo</strong> — Notificação in-app automática 24h antes do prazo de entrega para alunos que ainda não enviaram (verificação a cada 30 minutos).</p>
            <p><strong>Alerta de baixo engajamento</strong> — Notificação in-app semanal (segunda-feira) listando alunos inativos há mais de 14 dias.</p>

            <p className="font-medium text-foreground mt-3">Confirmações (in-app only):</p>
            <p><strong>Convite enviado</strong> — Confirmação in-app de que o convite foi criado/enviado com sucesso.</p>
          </DocSection>

          <div className="border-t" />

          <DocSection num="5" title="Churn Score (Engajamento)">
            <p>Cada aluno tem um score de 0 a 100 que indica o nível de engajamento:</p>
            <p><strong>Composição:</strong> Presença nas sessões (40%) + Entregas de tarefas (30%) + Recência de acesso (30%).</p>
            <p><strong>Alto risco (0-29):</strong> Aluno praticamente ausente. Requer ação imediata.</p>
            <p><strong>Risco médio (30-59):</strong> Engajamento irregular. Vale um contato direto.</p>
            <p><strong>Baixo risco (60-100):</strong> Aluno engajado e ativo.</p>
            <p>O score decai automaticamente após 30 dias de inatividade. Use o botão de "Sugestão IA" para receber recomendações personalizadas de re-engajamento.</p>
          </DocSection>

          <div className="border-t" />

          <DocSection num="6" title="Sessões ao Vivo">
            <p><strong>Agendamento:</strong> Defina data, hora, duração e link da reunião (Zoom, Meet, Teams, etc).</p>
            <p><strong>Presença:</strong> Após a sessão, registre presença dos alunos (Presente / Ausente). Isso alimenta o Churn Score.</p>
            <p><strong>Briefing IA:</strong> Antes da sessão, a IA pode gerar um resumo dos alunos presentes, entregas pendentes e pontos de atenção.</p>
            <p><strong>Resumo pós-sessão:</strong> Após a sessão, a IA pode gerar um resumo com pontos-chave e ações.</p>
          </DocSection>

          <div className="border-t" />

          <DocSection num="7" title="Tarefas e Avaliação">
            <p><strong>Status da tarefa:</strong> Rascunho → Publicada. Alunos só veem tarefas publicadas.</p>
            <p><strong>Entregas:</strong> Alunos enviam pelo painel deles. Você vê no quadro Kanban com drag-and-drop.</p>
            <p><strong>Avaliação:</strong> Aprovada (verde), Em Revisão (amarelo) ou Rejeitada (vermelho). Adicione feedback escrito em cada avaliação.</p>
            <p><strong>Prazo:</strong> Tarefas com prazo geram lembrete automático 24h antes para quem não entregou.</p>
          </DocSection>

          <div className="border-t" />

          <DocSection num="8" title="Materiais e Biblioteca">
            <p>Organize arquivos em pastas dentro do espaço. Suporte a PDFs, imagens, vídeos e links externos.</p>
            <p>Ao adicionar um novo material, todos os alunos matriculados são notificados automaticamente.</p>
          </DocSection>

          <div className="border-t" />

          <DocSection num="9" title="Discussões">
            <p>Cada sessão possui um fórum de discussão onde alunos e mentor podem trocar mensagens, dúvidas e materiais complementares.</p>
            <p>As discussões ficam vinculadas à sessão para manter o contexto organizado.</p>
          </DocSection>

          <div className="border-t" />

          <DocSection num="10" title="Status do Espaço">
            <p><strong>Em Andamento:</strong> Espaço ativo, alunos podem acessar e interagir normalmente.</p>
            <p><strong>Inativo:</strong> Espaço pausado temporariamente. Alunos não recebem notificações.</p>
            <p><strong>Concluído:</strong> Programa finalizado. Conteúdo acessível em modo leitura.</p>
            <p><strong>Arquivado:</strong> Oculto da listagem principal. Pode ser restaurado a qualquer momento em Configurações.</p>
          </DocSection>

        </div>
      </SheetContent>
    </Sheet>
  );
}
