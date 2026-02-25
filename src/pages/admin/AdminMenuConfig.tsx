import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { LayoutDashboard, Menu } from 'lucide-react';
import { useMenuVisibility, type MenuRole } from '@/hooks/useMenuVisibility';

interface MenuItemDef {
  key: string;
  label: string;
  group: string;
}

const STUDENT_ITEMS: MenuItemDef[] = [
  { key: 'hub',              label: 'Meu Hub',          group: 'DISCOVERY' },
  { key: 'comunidade',       label: 'Comunidade',        group: 'DISCOVERY' },
  { key: 'agendamentos',     label: 'Agendamentos',      group: 'DISCOVERY' },
  { key: 'catalogo',         label: 'Explore',           group: 'DISCOVERY' },
  { key: 'cursos',           label: 'Meus Cursos',       group: 'DISCOVERY' },
  { key: 'espacos',          label: 'Minha Jornada',     group: 'DISCOVERY' },
  { key: 'dashboard',        label: 'Dashboard',         group: 'MENTORIA' },
  { key: 'biblioteca',       label: 'Biblioteca',        group: 'MENTORIA' },
  { key: 'tarefas',          label: 'Tarefas',           group: 'MENTORIA' },
  { key: 'curriculo',        label: 'ResumePass AI',     group: 'TOOLS & AI' },
  { key: 'title_translator', label: 'Title Translator',  group: 'TOOLS & AI' },
  { key: 'prime_jobs',       label: 'Prime Jobs',        group: 'TOOLS & AI' },
  { key: 'pricing',          label: 'Planos',            group: 'MINHA CONTA' },
  { key: 'assinatura',       label: 'Assinatura',        group: 'MINHA CONTA' },
  { key: 'perfil',           label: 'Perfil',            group: 'MINHA CONTA' },
  { key: 'pedidos',          label: 'Meus Pedidos',      group: 'MINHA CONTA' },
  { key: 'suporte',          label: 'Suporte',           group: 'MINHA CONTA' },
];

const MENTOR_ITEMS: MenuItemDef[] = [
  { key: 'dashboard',        label: 'Dashboard',         group: 'GESTÃO' },
  { key: 'espacos',          label: 'Meus Espaços',      group: 'GESTÃO' },
  { key: 'agendamentos',     label: 'Agendamentos',      group: 'GESTÃO' },
  { key: 'disponibilidade',  label: 'Disponibilidade',   group: 'GESTÃO' },
  { key: 'agenda',           label: 'Agenda',            group: 'GESTÃO' },
  { key: 'tarefas',          label: 'Tarefas',           group: 'GESTÃO' },
  { key: 'biblioteca',       label: 'Biblioteca',        group: 'CONTEÚDO' },
  { key: 'upload_materiais', label: 'Upload Materiais',  group: 'CONTEÚDO' },
  { key: 'perfil',           label: 'Perfil',            group: 'MINHA CONTA' },
  { key: 'suporte',          label: 'Suporte',           group: 'MINHA CONTA' },
];

function groupBy<T extends { group: string }>(items: T[]): Record<string, T[]> {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});
}

interface RoleSectionProps {
  title: string;
  description: string;
  role: MenuRole;
  items: MenuItemDef[];
  isLoading: boolean;
  isItemVisible: (role: MenuRole, key: string) => boolean;
  updateVisibility: (role: MenuRole, key: string, visible: boolean) => Promise<void>;
}

function RoleSection({ title, description, role, items, isLoading, isItemVisible, updateVisibility }: RoleSectionProps) {
  const groups = groupBy(items);

  return (
    <Card className="rounded-[24px]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <LayoutDashboard className="w-5 h-5 text-primary" />
          <CardTitle>{title}</CardTitle>
        </div>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-xl" />
            ))}
          </div>
        ) : (
          Object.entries(groups).map(([groupLabel, groupItems]) => (
            <div key={groupLabel} className="space-y-2">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground px-1">
                {groupLabel}
              </p>
              <div className="space-y-1">
                {groupItems.map(item => {
                  const visible = isItemVisible(role, item.key);
                  return (
                    <div
                      key={item.key}
                      className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
                    >
                      <span className={`text-sm font-medium ${visible ? 'text-foreground' : 'text-muted-foreground line-through'}`}>
                        {item.label}
                      </span>
                      <Switch
                        checked={visible}
                        onCheckedChange={(checked) => updateVisibility(role, item.key, checked)}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}

export default function AdminMenuConfig() {
  const { isLoading, isItemVisible, updateVisibility } = useMenuVisibility();

  return (
    <DashboardLayout>
      <div className="p-6 md:p-8 space-y-6">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary/10">
            <Menu className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Menu do App</h1>
            <p className="text-sm text-muted-foreground">
              Ative ou desative itens do menu lateral para alunos e mentores. Mudanças aplicadas imediatamente.
            </p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <RoleSection
            title="Menu dos Alunos"
            description="Controla quais itens aparecem no menu lateral para usuários com perfil de aluno."
            role="student"
            items={STUDENT_ITEMS}
            isLoading={isLoading}
            isItemVisible={isItemVisible}
            updateVisibility={updateVisibility}
          />

          <RoleSection
            title="Menu dos Mentores"
            description="Controla quais itens aparecem no menu lateral para usuários com perfil de mentor."
            role="mentor"
            items={MENTOR_ITEMS}
            isLoading={isLoading}
            isItemVisible={isItemVisible}
            updateVisibility={updateVisibility}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
