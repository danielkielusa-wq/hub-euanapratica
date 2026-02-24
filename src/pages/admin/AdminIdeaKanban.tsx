import { useState, useEffect, useRef, useCallback, useMemo, type DragEvent } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { Share2, Plus, Trash2, Save, Loader2, Paperclip } from 'lucide-react';
import { useAdminIdeas, type BusinessIdea, type BusinessIdeaInsert } from '@/hooks/useAdminIdeas';
import { IdeaAttachmentsSection } from '@/components/admin/ideas/IdeaAttachmentsSection';
import type { IdeaAttachment } from '@/hooks/useIdeaAttachments';

// ─── Constants ───
const COLS = [
  { id: 'spark', label: 'Raw Spark', color: '#7C3AED', tag: 'New Idea', idx: 0 },
  { id: 'qualified', label: 'Qualified', color: '#D97706', tag: 'Qualified', idx: 1 },
  { id: 'validated', label: 'Validated', color: '#059669', tag: 'Validated \u2713', idx: 2 },
  { id: 'designed', label: 'Designed', color: '#2563EB', tag: 'Designed', idx: 3 },
  { id: 'active', label: 'Active', color: '#DC2626', tag: 'Active \uD83D\uDD25', idx: 4 },
  { id: 'parked', label: 'Parked', color: '#6B7280', tag: 'Parked', idx: 5 },
] as const;

const COL_MAP = Object.fromEntries(COLS.map(c => [c.id, c]));

const TAGS = [
  { name: 'SaaS', bg: '#DBEAFE', fg: '#1E40AF' },
  { name: 'Marketplace', bg: '#EDE9FE', fg: '#6D28D9' },
  { name: 'Content', bg: '#D1FAE5', fg: '#065F46' },
  { name: 'B2B', bg: '#FEF3C7', fg: '#92400E' },
  { name: 'B2C', bg: '#FCE7F3', fg: '#9D174D' },
  { name: 'AI/ML', bg: '#E0E7FF', fg: '#3730A3' },
  { name: 'Affiliate', bg: '#FEF9C3', fg: '#854D0E' },
  { name: 'LeadGen', bg: '#DCFCE7', fg: '#166534' },
  { name: 'Service', bg: '#FFEDD5', fg: '#9A3412' },
  { name: 'Community', bg: '#CFFAFE', fg: '#155E75' },
  { name: 'Data', bg: '#F3E8FF', fg: '#6B21A8' },
  { name: 'Ads', bg: '#FFE4E6', fg: '#9F1239' },
] as const;

const TAG_MAP = Object.fromEntries(TAGS.map(t => [t.name, t]));

const BASE_FIELDS = ['name', 'one_liner', 'problem', 'persona', 'interest_score', 'tags'] as const;
const QUAL_FIELDS = ['market_size', 'competition', 'unfair_advantage', 'distribution_hypothesis', 'revenue_model'] as const;
const VALID_FIELDS = ['validation_method', 'signals_collected', 'strongest_objection', 'kill_criteria'] as const;
const DESIGN_FIELDS = ['pricing_model', 'mvp_scope', 'key_metric', 'integrations'] as const;

const FIELD_LABELS: Record<string, string> = {
  name: 'Idea Name', one_liner: 'One-Liner', problem: 'Problem', persona: 'Target Persona',
  interest_score: 'Interest Score', tags: 'Tags', notes: 'Notes', existing_assets: 'Existing Assets',
  market_size: 'Market Size', competition: 'Competition', unfair_advantage: 'Unfair Advantage',
  distribution_hypothesis: 'Distribution Hypothesis', revenue_model: 'Revenue Model',
  validation_method: 'Validation Method', signals_collected: 'Signals Collected',
  strongest_objection: 'Strongest Objection', kill_criteria: 'Kill Criteria',
  pricing_model: 'Pricing Model', mvp_scope: 'MVP Scope', key_metric: 'Key Metric', integrations: 'Integrations',
};

const ENUM_OPTIONS: Record<string, [string, string][]> = {
  market_size: [['', 'Select...'], ['niche', 'Niche'], ['growing', 'Growing'], ['massive', 'Massive']],
  competition: [['', 'Select...'], ['none', 'None'], ['crowded', 'Crowded'], ['blue_ocean', 'Blue Ocean']],
  validation_method: [['', 'Select...'], ['interview', 'Interview'], ['landing_page', 'Landing Page'], ['pre_sale', 'Pre-sale'], ['prototype', 'Prototype']],
};

const LONG_FIELDS = ['one_liner', 'problem', 'notes', 'existing_assets', 'signals_collected', 'strongest_objection', 'kill_criteria', 'mvp_scope', 'unfair_advantage', 'distribution_hypothesis'];

const FILTERS = [
  { id: 'all', label: 'By Status' },
  { id: 'total', label: 'By Total Ideas' },
  { id: 'promising', label: 'Most Promising' },
  { id: 'needs_validation', label: 'Needs Validation' },
  { id: 'parked', label: 'Parked' },
] as const;

// ─── Helpers ───
function colIdx(id: string) { return COL_MAP[id]?.idx ?? -1; }

function unlockedFields(col: string) {
  const i = colIdx(col);
  const f: string[] = [...BASE_FIELDS];
  if (i >= 1) f.push(...QUAL_FIELDS);
  if (i >= 2) f.push(...VALID_FIELDS);
  if (i >= 3) f.push(...DESIGN_FIELDS);
  return f;
}

function calcHealth(idea: BusinessIdea): string {
  const fields = unlockedFields(idea.column_status);
  let total = 0, filled = 0;
  for (const f of fields) {
    if (f === 'interest_score') { total++; if (idea.interest_score > 0) filled++; }
    else if (f === 'tags') { total++; if (idea.tags?.length > 0) filled++; }
    else { total++; const v = (idea as Record<string, unknown>)[f]; if (v && v !== '') filled++; }
  }
  const pct = total > 0 ? (filled / total) * 100 : 0;
  if (pct < 40) return '#EF4444';
  if (pct < 80) return '#F59E0B';
  return '#10B981';
}

function blankInsert(col = 'spark'): BusinessIdeaInsert {
  return {
    column_status: col, name: 'Untitled Idea', one_liner: '', problem: '', persona: '',
    interest_score: 0, tags: [], notes: '', existing_assets: '',
    market_size: null, competition: null, unfair_advantage: '', distribution_hypothesis: '', revenue_model: '',
    validation_method: null, signals_collected: '', strongest_objection: '', kill_criteria: '',
    pricing_model: '', mvp_scope: '', key_metric: '', integrations: '',
    gate_answers: {},
    attachments: [],
  };
}

// ─── Components ───

function StarRating({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  return (
    <div className="flex gap-0.5">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={readonly ? '' : 'cursor-pointer'}
          style={{ color: i < value ? '#F59E0B' : '#E5E7EB', fontSize: readonly ? 13 : 20 }}
          onClick={() => !readonly && onChange?.(i + 1)}
        >
          {'\u2605'}
        </span>
      ))}
    </div>
  );
}

function TagPill({ name, selected, onClick }: { name: string; selected?: boolean; onClick?: () => void }) {
  const t = TAG_MAP[name] || { bg: '#F3F4F6', fg: '#374151' };
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-[11px] px-2 py-0.5 rounded-full font-medium transition-all"
      style={{
        background: selected !== false ? t.bg : '#F3F4F6',
        color: selected !== false ? t.fg : '#9CA3AF',
      }}
    >
      {name}
    </button>
  );
}

// ─── Main Component ───
export default function AdminIdeaKanban() {
  const { ideas, isLoading, refetch, createIdea, updateIdea, deleteIdea: removeIdea, moveCard: moveCardMutation, isCreating, isUpdating } = useAdminIdeas();

  const [filter, setFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [drawerId, setDrawerId] = useState<string | null>(null);
  const [editIdea, setEditIdea] = useState<BusinessIdea | null>(null);
  const [dragOverCol, setDragOverCol] = useState<string | null>(null);
  const dragRef = useRef<{ id: string; from: string } | null>(null);

  // Sync editIdea when drawerId changes or ideas update
  useEffect(() => {
    if (drawerId) {
      const idea = ideas.find(i => i.id === drawerId);
      if (idea) setEditIdea({ ...idea, tags: [...idea.tags] });
    } else {
      setEditIdea(null);
    }
  }, [drawerId, ideas]);

  // ─── Filtering & Sorting ───
  const filteredIdeas = useMemo(() => {
    let list = [...ideas];
    if (filter === 'promising') list = list.filter(i => i.interest_score >= 4);
    else if (filter === 'needs_validation') list = list.filter(i => i.column_status === 'spark' || i.column_status === 'qualified');
    else if (filter === 'parked') list = list.filter(i => i.column_status === 'parked');

    list.sort((a, b) => {
      if (sortBy === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      if (sortBy === 'interest') return (b.interest_score || 0) - (a.interest_score || 0);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
    return list;
  }, [ideas, filter, sortBy]);

  // ─── Handlers ───
  const addIdea = useCallback(async (col = 'spark') => {
    try {
      const created = await createIdea(blankInsert(col));
      setDrawerId(created.id);
    } catch { /* toast handled in hook */ }
  }, [createIdea]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await removeIdea(id);
      setDrawerId(null);
    } catch { /* toast handled in hook */ }
  }, [removeIdea]);

  const saveEdit = useCallback(async () => {
    if (!editIdea) return;
    const { id, user_id, created_at, updated_at, ...fields } = editIdea;
    try {
      await updateIdea({ id, ...fields });
      toast.success('Idea saved');
    } catch { /* toast handled in hook */ }
  }, [editIdea, updateIdea]);

  const handleShare = useCallback(() => {
    navigator.clipboard?.writeText(JSON.stringify(ideas, null, 2));
    toast.success('Ideas JSON copied to clipboard');
  }, [ideas]);

  // ─── Drag Handlers ───
  const onDragStart = useCallback((e: DragEvent, id: string, from: string) => {
    dragRef.current = { id, from };
    e.dataTransfer.effectAllowed = 'move';
    if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = '0.5';
  }, []);

  const onDragEnd = useCallback((e: DragEvent) => {
    if (e.currentTarget instanceof HTMLElement) e.currentTarget.style.opacity = '1';
    dragRef.current = null;
    setDragOverCol(null);
  }, []);

  const onDragOver = useCallback((e: DragEvent, col: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverCol(col);
  }, []);

  const onDragLeave = useCallback((e: DragEvent, col: string) => {
    const zone = (e.currentTarget as HTMLElement);
    if (!zone.contains(e.relatedTarget as Node)) setDragOverCol(prev => prev === col ? null : prev);
  }, []);

  const onDrop = useCallback((e: DragEvent, toCol: string) => {
    e.preventDefault();
    setDragOverCol(null);
    const drag = dragRef.current;
    if (!drag || drag.from === toCol) return;
    moveCardMutation({ id: drag.id, column_status: toCol });
    dragRef.current = null;
  }, [moveCardMutation]);

  // ─── Edit helpers ───
  const updateField = useCallback((field: string, value: string | number | string[] | null) => {
    setEditIdea(prev => prev ? { ...prev, [field]: value } : prev);
  }, []);

  const toggleTag = useCallback((tag: string) => {
    setEditIdea(prev => {
      if (!prev) return prev;
      const tags = [...prev.tags];
      const idx = tags.indexOf(tag);
      if (idx >= 0) tags.splice(idx, 1);
      else tags.push(tag);
      return { ...prev, tags };
    });
  }, []);

  // ─── Render Field ───
  function renderField(key: string) {
    if (!editIdea) return null;
    const label = FIELD_LABELS[key] || key;
    const val = (editIdea as Record<string, unknown>)[key];

    if (key === 'interest_score') {
      return (
        <div className="mb-3" key={key}>
          <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
          <StarRating value={editIdea.interest_score} onChange={(v) => updateField('interest_score', v)} />
        </div>
      );
    }
    if (key === 'tags') {
      return (
        <div className="mb-3" key={key}>
          <label className="block text-xs font-medium text-gray-500 mb-1.5">{label}</label>
          <div className="flex flex-wrap gap-1.5">
            {TAGS.map(t => (
              <TagPill key={t.name} name={t.name} selected={editIdea.tags.includes(t.name)} onClick={() => toggleTag(t.name)} />
            ))}
          </div>
        </div>
      );
    }
    if (ENUM_OPTIONS[key]) {
      return (
        <div className="mb-3" key={key}>
          <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
          <select
            className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
            value={(val as string) || ''}
            onChange={(e) => updateField(key, e.target.value || null)}
          >
            {ENUM_OPTIONS[key].map(([v, l]) => <option key={v} value={v}>{l}</option>)}
          </select>
        </div>
      );
    }
    if (LONG_FIELDS.includes(key)) {
      return (
        <div className="mb-3" key={key}>
          <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
          <Textarea rows={3} value={(val as string) || ''} onChange={(e) => updateField(key, e.target.value)} className="resize-none text-sm" />
        </div>
      );
    }
    return (
      <div className="mb-3" key={key}>
        <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
        <Input value={(val as string) || ''} onChange={(e) => updateField(key, e.target.value)} className="text-sm" />
      </div>
    );
  }

  function renderSection(title: string, color: string, fields: readonly string[]) {
    return (
      <div className="mt-5 pt-4 border-t border-gray-100">
        <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color }}>{title}</span>
        <div className="mt-3">{fields.map(renderField)}</div>
      </div>
    );
  }

  // ─── JSX ───
  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      {/* Gradient bar */}
      <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #7C3AED, #2563EB)' }} />

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Idea Kanban {'\uD83D\uDCA1'}</h1>
        <div className="flex items-center gap-3">
          <Button onClick={handleShare} className="rounded-full gap-2 text-white" style={{ background: '#7C3AED' }}>
            <Share2 className="w-4 h-4" /> Share
          </Button>
          <button
            onClick={() => addIdea()}
            disabled={isCreating}
            className="w-9 h-9 rounded-full border-2 border-gray-200 flex items-center justify-center text-gray-500 hover:border-purple-400 hover:text-purple-600 transition-colors text-lg disabled:opacity-50"
          >
            {isCreating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex items-center justify-between px-6 border-b border-gray-200">
        <div className="flex gap-1">
          {FILTERS.map(f => {
            const active = filter === f.id;
            return (
              <button
                key={f.id}
                onClick={() => setFilter(f.id)}
                className={`px-4 py-3 text-sm transition-colors border-b-2 ${active ? 'border-purple-600 text-purple-600 font-semibold' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
              >
                {f.label}
                {f.id === 'total' && (
                  <span className={`ml-1.5 px-2 py-0.5 rounded-full text-xs font-bold ${active ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-500'}`}>
                    {ideas.length}
                  </span>
                )}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>Sort By</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm bg-white cursor-pointer outline-none"
          >
            <option value="newest">Newest</option>
            <option value="oldest">Oldest</option>
            <option value="interest">Interest Score</option>
          </select>
        </div>
      </div>

      {/* Kanban columns */}
      <div className="overflow-x-auto px-6 pb-8 mt-1">
        <div className="flex gap-5" style={{ minWidth: 'max-content' }}>
          {COLS.map(col => {
            const cards = filteredIdeas.filter(i => i.column_status === col.id);
            const isOver = dragOverCol === col.id;
            return (
              <div key={col.id} className="flex-shrink-0" style={{ width: 280 }}>
                {/* Column header pill */}
                <div className="rounded-xl px-3 py-2 flex items-center justify-between mb-3" style={{ background: col.color }}>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-white text-xs font-bold">{cards.length}</span>
                    <span className="text-white font-semibold text-sm">{col.label}</span>
                  </div>
                  <button onClick={() => addIdea(col.id)} className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center text-white text-sm hover:bg-white/40 transition-colors">
                    <Plus className="w-3 h-3" />
                  </button>
                </div>

                {/* Drop zone */}
                <div
                  className="flex flex-col gap-2.5 min-h-[60px] rounded-xl p-1 transition-colors"
                  style={{ backgroundColor: isOver ? col.color + '26' : 'transparent' }}
                  onDragOver={(e) => onDragOver(e, col.id)}
                  onDragLeave={(e) => onDragLeave(e, col.id)}
                  onDrop={(e) => onDrop(e, col.id)}
                >
                  {cards.map(idea => {
                    const h = calcHealth(idea);
                    const gc = Object.keys(idea.gate_answers || {}).length;
                    return (
                      <div
                        key={idea.id}
                        draggable
                        onDragStart={(e) => onDragStart(e, idea.id, idea.column_status)}
                        onDragEnd={onDragEnd}
                        onClick={() => { if (!dragRef.current) setDrawerId(idea.id); }}
                        className="bg-white rounded-[14px] border border-[#F0F0F0] shadow-sm p-3.5 cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <span className="inline-block text-[11px] font-bold uppercase tracking-wide mb-1.5" style={{ color: col.color }}>
                          {col.tag}
                        </span>
                        <h3 className="font-bold text-[14px] text-gray-900 mb-1 leading-snug">{idea.name}</h3>
                        {idea.one_liner && (
                          <p className="text-[12px] text-gray-500 mb-2 leading-relaxed line-clamp-2">{idea.one_liner}</p>
                        )}
                        {idea.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2.5">
                            {idea.tags.slice(0, 3).map(t => <TagPill key={t} name={t} />)}
                          </div>
                        )}
                        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                          <StarRating value={idea.interest_score} readonly />
                          <div className="flex items-center gap-2.5">
                            {gc > 0 && <span className="text-[12px] text-gray-400">{'\uD83D\uDCAC'} {gc}</span>}
                            {(idea.attachments?.length || 0) > 0 && (
                              <span className="text-[12px] text-gray-400 flex items-center gap-0.5">
                                <Paperclip className="w-3 h-3" /> {idea.attachments.length}
                              </span>
                            )}
                            <span className="w-2 h-2 rounded-full inline-block" style={{ background: h }} title="Completeness" />
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Drawer (Sheet) */}
      <Sheet open={!!drawerId} onOpenChange={(open) => { if (!open) setDrawerId(null); }}>
        <SheetContent side="right" className="w-[480px] sm:max-w-[480px] p-0 overflow-hidden">
          {editIdea && (() => {
            const ci = colIdx(editIdea.column_status);
            const gateEntries = Object.entries(editIdea.gate_answers || {});
            return (
              <div className="flex flex-col h-full">
                {/* Drawer header */}
                <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-shrink-0">
                  <h2 className="font-bold text-lg text-gray-900">Edit Idea</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleDelete(editIdea.id)}>
                      <Trash2 className="w-4 h-4 mr-1" /> Delete
                    </Button>
                    <Button size="sm" className="text-white" style={{ background: '#7C3AED' }} onClick={saveEdit} disabled={isUpdating}>
                      {isUpdating ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Save className="w-4 h-4 mr-1" />} Save
                    </Button>
                  </div>
                </div>

                {/* Drawer body */}
                <ScrollArea className="flex-1">
                  <div className="px-6 py-4">
                    {/* Column selector */}
                    <div className="mb-4">
                      <label className="block text-xs font-medium text-gray-500 mb-1">Column</label>
                      <select
                        className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-purple-200 focus:border-purple-400 outline-none"
                        value={editIdea.column_status}
                        onChange={(e) => updateField('column_status', e.target.value)}
                      >
                        {COLS.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
                      </select>
                    </div>

                    {renderSection('Core', '#7C3AED', BASE_FIELDS)}
                    {ci >= 1 && renderSection('Qualification Layer', '#D97706', QUAL_FIELDS)}
                    {ci >= 2 && renderSection('Validation Layer', '#059669', VALID_FIELDS)}
                    {ci >= 3 && renderSection('Design Layer', '#2563EB', DESIGN_FIELDS)}

                    {gateEntries.length > 0 && (
                      <div className="mt-5 pt-4 border-t border-gray-100">
                        <span className="text-[11px] font-bold uppercase tracking-widest text-purple-600">Gate Answers</span>
                        <div className="mt-3 space-y-3">
                          {gateEntries.map(([k, v]) => (
                            <div key={k} className="bg-purple-50 rounded-lg p-3">
                              <p className="text-[11px] font-semibold text-purple-600 mb-1">{k}</p>
                              <p className="text-sm text-gray-700">{v}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Attachments — always visible */}
                    <IdeaAttachmentsSection
                      ideaId={editIdea.id}
                      attachments={(editIdea.attachments || []) as IdeaAttachment[]}
                      onAttachmentsChange={(updated) => {
                        setEditIdea(prev => prev ? { ...prev, attachments: updated } : prev);
                        refetch();
                      }}
                    />

                    {renderSection('Notes & Existing Assets', '#6B7280', ['notes', 'existing_assets'] as const)}
                  </div>
                </ScrollArea>
              </div>
            );
          })()}
        </SheetContent>
      </Sheet>
    </DashboardLayout>
  );
}
