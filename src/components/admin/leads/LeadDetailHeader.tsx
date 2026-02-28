import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Mail, Phone, StickyNote, ListTodo, ExternalLink, ChevronDown, Pencil, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useUpdateLeadPhone } from '@/hooks/useAdminLeadDetail';
import type { CareerEvaluation } from '@/types/leads';

interface LeadDetailHeaderProps {
  lead: CareerEvaluation;
  onAddNote: () => void;
  onAddTask: () => void;
  onSendWhatsApp: () => void;
  viewMode?: 'admin' | 'assistant';
}

const TEMP_STYLES: Record<string, string> = {
  'muito-quente': 'bg-red-50 text-red-700 border-red-200',
  'quente': 'bg-orange-50 text-orange-700 border-orange-200',
  'morno': 'bg-amber-50 text-amber-600 border-amber-200',
  'frio': 'bg-blue-50 text-blue-600 border-blue-200',
};

function getTempStyle(temp?: string) {
  if (!temp) return 'bg-gray-50 text-gray-500 border-gray-200';
  return TEMP_STYLES[temp.toLowerCase()] || TEMP_STYLES[(temp || '').toUpperCase() === 'QUENTE' ? 'quente' : temp.toLowerCase()] || 'bg-gray-50 text-gray-500 border-gray-200';
}

export function LeadDetailHeader({ lead, onAddNote, onAddTask, onSendWhatsApp, viewMode = 'admin' }: LeadDetailHeaderProps) {
  const navigate = useNavigate();
  const updatePhone = useUpdateLeadPhone();

  const [phoneEditOpen, setPhoneEditOpen] = useState(false);
  const [editPhone, setEditPhone] = useState(lead.phone || '');

  const cleanPhone = (lead.phone || '').replace(/\D/g, '');
  const hasPhone = cleanPhone.length >= 10;

  const handleSavePhone = () => {
    const trimmed = editPhone.trim();
    if (!trimmed) return;
    updatePhone.mutate(
      { id: lead.id, phone: trimmed },
      { onSuccess: () => setPhoneEditOpen(false) }
    );
  };

  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
      <Button
        variant="ghost"
        size="icon"
        className="self-start rounded-xl"
        onClick={() => navigate(viewMode === 'assistant' ? '/assistant/leads' : '/admin/leads-dashboard')}
      >
        <ArrowLeft className="h-4 w-4" />
      </Button>

      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-bold text-gray-900 truncate">{lead.name}</h1>
          <Badge variant="outline" className={cn('text-[10px] font-bold border', getTempStyle(lead.lead_temperature))}>
            {(lead.lead_temperature || '—').toUpperCase()}
          </Badge>
          {lead.phase_emoji && lead.rota_letter && (
            <Badge variant="outline" className="text-xs bg-indigo-50 text-indigo-700 border-indigo-200">
              {lead.phase_emoji} {lead.rota_letter}
            </Badge>
          )}
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-1 text-xs text-gray-500">
          <span>{lead.email}</span>
          {lead.area && <><span className="text-gray-300">·</span><span>{lead.area}</span></>}
          <span className="text-gray-300">·</span>
          <Popover open={phoneEditOpen} onOpenChange={setPhoneEditOpen}>
            <PopoverTrigger asChild>
              <button
                onClick={() => { setEditPhone(lead.phone || ''); setPhoneEditOpen(true); }}
                className="inline-flex items-center gap-1 hover:text-gray-800 transition-colors group"
              >
                <Phone className="w-3 h-3" />
                <span>{lead.phone || 'Sem telefone'}</span>
                <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-100 transition-opacity text-gray-400" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-72 p-3" align="start">
              <div className="space-y-2">
                <p className="text-xs font-medium text-gray-700">Editar telefone</p>
                <p className="text-[10px] text-gray-400">
                  Internacional: use + (ex: +14704469625 para EUA)
                </p>
                <div className="flex gap-1.5">
                  <Input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+5511999999999"
                    className="h-8 text-xs rounded-lg font-mono"
                    onKeyDown={(e) => e.key === 'Enter' && handleSavePhone()}
                    autoFocus
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-green-600 hover:bg-green-50"
                    onClick={handleSavePhone}
                    disabled={updatePhone.isPending || !editPhone.trim()}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 shrink-0 text-gray-400 hover:bg-gray-50"
                    onClick={() => setPhoneEditOpen(false)}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {hasPhone && (
          <div className="flex">
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs rounded-l-xl rounded-r-none gap-1.5 text-green-700 border-green-200 hover:bg-green-50"
              onClick={onSendWhatsApp}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              WhatsApp
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-1.5 rounded-r-xl rounded-l-none border-l-0 text-green-700 border-green-200 hover:bg-green-50"
                >
                  <ChevronDown className="w-3 h-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={onSendWhatsApp}>
                  <MessageSquare className="w-3.5 h-3.5 mr-2" /> Enviar via CRM
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => window.open(`https://wa.me/${cleanPhone}`, '_blank')}>
                  <ExternalLink className="w-3.5 h-3.5 mr-2" /> Abrir wa.me
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs rounded-xl gap-1.5"
          onClick={() => window.open(`mailto:${lead.email}`, '_blank')}
        >
          <Mail className="w-3.5 h-3.5" />
          Email
        </Button>
        {hasPhone && (
          <Button
            variant="outline"
            size="sm"
            className="h-8 text-xs rounded-xl gap-1.5"
            onClick={() => window.open(`tel:${cleanPhone}`, '_blank')}
          >
            <Phone className="w-3.5 h-3.5" />
            Ligar
          </Button>
        )}
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs rounded-xl gap-1.5"
          onClick={onAddNote}
        >
          <StickyNote className="w-3.5 h-3.5" />
          Nota
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 text-xs rounded-xl gap-1.5"
          onClick={onAddTask}
        >
          <ListTodo className="w-3.5 h-3.5" />
          Tarefa
        </Button>
      </div>
    </div>
  );
}
