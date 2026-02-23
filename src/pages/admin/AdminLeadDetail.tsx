import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Loader2, TrendingUp, Flame, DollarSign, ShieldAlert, CalendarDays, MessageSquare, Eye, BarChart3, ListTodo, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { StatCard } from '@/components/admin/shared/StatCard';
import { LeadDetailHeader } from '@/components/admin/leads/LeadDetailHeader';
import { LeadOverviewTab } from '@/components/admin/leads/LeadOverviewTab';
import { LeadScoresTab } from '@/components/admin/leads/LeadScoresTab';
import { LeadInteractionsTab } from '@/components/admin/leads/LeadInteractionsTab';
import { LeadTasksTab } from '@/components/admin/leads/LeadTasksTab';
import { LeadReportTab } from '@/components/admin/leads/LeadReportTab';
import { LeadWhatsAppTab } from '@/components/admin/leads/LeadWhatsAppTab';
import { AddInteractionDialog } from '@/components/admin/leads/AddInteractionDialog';
import { AddTaskDialog } from '@/components/admin/leads/AddTaskDialog';
import { EditInteractionDialog } from '@/components/admin/leads/EditInteractionDialog';
import { EditTaskDialog } from '@/components/admin/leads/EditTaskDialog';
import { SendWhatsAppDialog } from '@/components/admin/leads/SendWhatsAppDialog';
import { SuggestTasksDialog } from '@/components/admin/leads/SuggestTasksDialog';
import { SuggestWhatsAppDialog } from '@/components/admin/leads/SuggestWhatsAppDialog';
import {
  useLeadDetail, useLeadInteractions, useLeadTasks,
  useAddInteraction, useAddTask, useUpdateTaskStatus,
  useEditInteraction, useDeleteInteraction, useEditTask, useDeleteTask,
} from '@/hooks/useAdminLeadDetail';
import type { LeadInteraction, LeadTask } from '@/types/leads';

function daysSince(dateStr?: string): number {
  if (!dateStr) return 0;
  const diff = Date.now() - new Date(dateStr).getTime();
  return Math.floor(diff / (1000 * 60 * 60 * 24));
}

function countBarriers(lead: any): number {
  let count = 0;
  if (lead.has_english_barrier) count++;
  if (lead.has_experience_barrier) count++;
  if (lead.has_financial_barrier) count++;
  if (lead.has_family_barrier) count++;
  if (lead.has_visa_barrier) count++;
  if (lead.has_time_barrier) count++;
  if (lead.has_clarity_barrier) count++;
  return count;
}

export default function AdminLeadDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: lead, isLoading } = useLeadDetail(id!);
  const { data: interactions = [] } = useLeadInteractions(id!);
  const { data: tasks = [] } = useLeadTasks(id!);

  const addInteraction = useAddInteraction();
  const addTask = useAddTask();
  const updateTaskStatus = useUpdateTaskStatus();
  const editInteraction = useEditInteraction();
  const deleteInteraction = useDeleteInteraction();
  const editTask = useEditTask();
  const deleteTask = useDeleteTask();

  const [addNoteOpen, setAddNoteOpen] = useState(false);
  const [addTaskOpen, setAddTaskOpen] = useState(false);
  const [editingInteraction, setEditingInteraction] = useState<LeadInteraction | null>(null);
  const [editingTask, setEditingTask] = useState<LeadTask | null>(null);
  const [sendWhatsAppOpen, setSendWhatsAppOpen] = useState(false);
  const [suggestTasksOpen, setSuggestTasksOpen] = useState(false);
  const [suggestWhatsAppOpen, setSuggestWhatsAppOpen] = useState(false);

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-32">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
        </div>
      </DashboardLayout>
    );
  }

  if (!lead) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 space-y-4">
          <p className="text-sm text-gray-500">Lead não encontrado.</p>
          <Button variant="outline" onClick={() => navigate('/admin/leads-dashboard')}>
            Voltar ao Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const barriers = countBarriers(lead);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <LeadDetailHeader
          lead={lead}
          onAddNote={() => setAddNoteOpen(true)}
          onAddTask={() => setAddTaskOpen(true)}
          onSendWhatsApp={() => setSendWhatsAppOpen(true)}
        />

        {/* Stats row */}
        <div className="grid gap-4 grid-cols-2 md:grid-cols-3 lg:grid-cols-6">
          <StatCard title="Prontidão" value={lead.readiness_score ?? '—'} icon={TrendingUp} description={lead.readiness_percentual ? `${lead.readiness_percentual}%` : undefined} />
          <StatCard title="Prioridade" value={lead.lead_priority_score ?? '—'} icon={Flame} description={lead.lead_temperature || undefined} />
          <StatCard title="LTV Estimado" value={lead.estimated_ltv ? `R$ ${lead.estimated_ltv.toLocaleString('pt-BR')}` : '—'} icon={DollarSign} description={lead.has_budget ? 'Com orçamento' : undefined} />
          <StatCard title="Barreiras" value={`${barriers}/7`} icon={ShieldAlert} variant={barriers >= 4 ? 'warning' : 'default'} />
          <StatCard title="Dias" value={daysSince(lead.created_at)} icon={CalendarDays} description="desde cadastro" />
          <StatCard title="Interações" value={interactions.length} icon={MessageSquare} description="registradas" />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="bg-white/80 backdrop-blur-sm border border-gray-100 rounded-2xl p-1 flex-wrap h-auto">
            <TabsTrigger value="overview" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              <Eye className="w-3.5 h-3.5" /> Visão Geral
            </TabsTrigger>
            <TabsTrigger value="scores" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              <BarChart3 className="w-3.5 h-3.5" /> Scores & Barreiras
            </TabsTrigger>
            <TabsTrigger value="interactions" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              <MessageSquare className="w-3.5 h-3.5" /> Interações
            </TabsTrigger>
            <TabsTrigger value="whatsapp" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-green-50 data-[state=active]:text-green-700">
              <MessageSquare className="w-3.5 h-3.5" /> WhatsApp
            </TabsTrigger>
            <TabsTrigger value="tasks" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              <ListTodo className="w-3.5 h-3.5" /> Tarefas
            </TabsTrigger>
            <TabsTrigger value="report" className="rounded-xl text-xs gap-1.5 data-[state=active]:bg-indigo-50 data-[state=active]:text-indigo-700">
              <FileText className="w-3.5 h-3.5" /> Relatório
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <LeadOverviewTab lead={lead} />
          </TabsContent>
          <TabsContent value="scores">
            <LeadScoresTab lead={lead} />
          </TabsContent>
          <TabsContent value="interactions">
            <LeadInteractionsTab
              interactions={interactions}
              leadId={id!}
              onAddNote={() => setAddNoteOpen(true)}
              onEdit={(interaction) => setEditingInteraction(interaction)}
              onDelete={(interaction) => deleteInteraction.mutate({ id: interaction.id, lead_id: interaction.lead_id })}
            />
          </TabsContent>
          <TabsContent value="whatsapp">
            <LeadWhatsAppTab
              leadId={id!}
              leadPhone={lead.phone}
              leadName={lead.name}
              interactions={interactions}
              onSendMessage={() => setSendWhatsAppOpen(true)}
              onSuggestWhatsApp={() => setSuggestWhatsAppOpen(true)}
            />
          </TabsContent>
          <TabsContent value="tasks">
            <LeadTasksTab
              tasks={tasks}
              leadId={id!}
              onAddTask={() => setAddTaskOpen(true)}
              onSuggestTasks={() => setSuggestTasksOpen(true)}
              onUpdateStatus={(taskId, status) =>
                updateTaskStatus.mutate({ id: taskId, lead_id: id!, status: status as any })
              }
              onEdit={(task) => setEditingTask(task)}
              onDelete={(task) => deleteTask.mutate({ id: task.id, lead_id: task.lead_id })}
            />
          </TabsContent>
          <TabsContent value="report">
            <LeadReportTab lead={lead} />
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <AddInteractionDialog
          open={addNoteOpen}
          onOpenChange={setAddNoteOpen}
          leadId={id!}
          onSubmit={(data) => addInteraction.mutate(data, { onSuccess: () => setAddNoteOpen(false) })}
          isPending={addInteraction.isPending}
        />
        <AddTaskDialog
          open={addTaskOpen}
          onOpenChange={setAddTaskOpen}
          leadId={id!}
          onSubmit={(data) => addTask.mutate(data, { onSuccess: () => setAddTaskOpen(false) })}
          isPending={addTask.isPending}
        />
        <EditInteractionDialog
          open={!!editingInteraction}
          onOpenChange={(open) => !open && setEditingInteraction(null)}
          interaction={editingInteraction}
          onSubmit={(data) => editInteraction.mutate(data, { onSuccess: () => setEditingInteraction(null) })}
          isPending={editInteraction.isPending}
        />
        <EditTaskDialog
          open={!!editingTask}
          onOpenChange={(open) => !open && setEditingTask(null)}
          task={editingTask}
          onSubmit={(data) => editTask.mutate(data, { onSuccess: () => setEditingTask(null) })}
          isPending={editTask.isPending}
        />
        <SendWhatsAppDialog
          open={sendWhatsAppOpen}
          onOpenChange={setSendWhatsAppOpen}
          leadId={id!}
          leadName={lead.name}
          leadPhone={lead.phone}
        />
        <SuggestTasksDialog
          open={suggestTasksOpen}
          onOpenChange={setSuggestTasksOpen}
          leadId={id!}
          leadName={lead.name}
        />
        <SuggestWhatsAppDialog
          open={suggestWhatsAppOpen}
          onOpenChange={setSuggestWhatsAppOpen}
          leadId={id!}
          leadName={lead.name}
          leadPhone={lead.phone}
        />
      </div>
    </DashboardLayout>
  );
}
