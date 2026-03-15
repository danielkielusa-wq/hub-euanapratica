import { useState } from 'react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useContentPieces, useUpdatePiece, type ContentPiece } from '@/hooks/useAdminContentFactory';

const FORMAT_LABELS: Record<string, string> = {
  short: 'Short', medium_video: 'YT Medio', long_video: 'YouTube', carousel: 'Carrossel', stories: 'Stories',
};

export default function AdminContentCalendar() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const { data: pieces = [], isLoading } = useContentPieces();
  const updatePiece = useUpdatePiece();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const monthName = currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startDayOfWeek = firstDay.getDay();
  const daysInMonth = lastDay.getDate();

  interface CalEntry { piece: ContentPiece; type: 'production' | 'publication'; }
  const entriesByDate: Record<string, CalEntry[]> = {};
  const addEntry = (dateStr: string, entry: CalEntry) => {
    if (!entriesByDate[dateStr]) entriesByDate[dateStr] = [];
    entriesByDate[dateStr].push(entry);
  };
  for (const p of pieces) {
    if (p.production_date) addEntry(p.production_date.slice(0, 10), { piece: p, type: 'production' });
    if (p.scheduled_for) addEntry(p.scheduled_for.slice(0, 10), { piece: p, type: 'publication' });
  }

  const today = new Date().toISOString().slice(0, 10);

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const goToday = () => setCurrentDate(new Date());

  const productionCount = pieces.filter(p => p.production_date).length;
  const publicationCount = pieces.filter(p => p.scheduled_for).length;

  const endBlanks = (7 - ((daysInMonth + startDayOfWeek) % 7)) % 7;

  const handleDragStart = (e: React.DragEvent, pieceId: string, entryType: 'production' | 'publication') => {
    e.dataTransfer.setData('text/plain', JSON.stringify({ pieceId, entryType }));
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, dateStr: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dropTarget !== dateStr) setDropTarget(dateStr);
  };

  const handleDragLeave = () => {
    setDropTarget(null);
  };

  const handleDrop = (e: React.DragEvent, targetDate: string) => {
    e.preventDefault();
    setDropTarget(null);
    try {
      const { pieceId, entryType } = JSON.parse(e.dataTransfer.getData('text/plain'));
      const field = entryType === 'production' ? 'production_date' : 'scheduled_for';
      updatePiece.mutate({ id: pieceId, [field]: targetDate });
    } catch { /* ignore bad data */ }
  };

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/40">
        {/* Gradient bar */}
        <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #6366F1, #8B5CF6, #F59E0B, #10B981, #06B6D4)' }} />

        <div className="px-4 sm:px-6 lg:px-8 py-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-4">
              <div className="flex items-center gap-1 sm:gap-2">
                <button
                  onClick={prevMonth}
                  className="p-1 sm:p-1.5 bg-white dark:bg-card border border-border rounded-md hover:bg-slate-50 dark:hover:bg-muted text-muted-foreground transition-colors shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </button>
                <button
                  onClick={nextMonth}
                  className="p-1 sm:p-1.5 bg-white dark:bg-card border border-border rounded-md hover:bg-slate-50 dark:hover:bg-muted text-muted-foreground transition-colors shadow-sm"
                >
                  <ChevronRight className="w-4 h-4 sm:w-[18px] sm:h-[18px]" />
                </button>
              </div>
              <h2 className="text-sm sm:text-lg font-bold text-foreground capitalize">{monthName}</h2>
            </div>
            <div className="flex items-center gap-3 sm:gap-6 text-xs sm:text-sm font-medium">
              <button onClick={goToday} className="text-muted-foreground hover:text-foreground transition-colors">
                Hoje
              </button>
              <div className="hidden sm:flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Gravacao ({productionCount})
                </span>
                <span className="flex items-center gap-1.5 text-muted-foreground text-sm">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                  Publicacao ({publicationCount})
                </span>
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : (
            <div className="bg-white dark:bg-card border border-border rounded-xl shadow-sm overflow-hidden">
              {/* Days of week header */}
              <div className="grid grid-cols-7 border-b border-border bg-slate-50/80 dark:bg-muted/50">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'].map((d) => (
                  <div key={d} className="py-2 sm:py-3 text-center text-[10px] sm:text-xs font-medium text-muted-foreground">
                    {d.charAt(0)}<span className="hidden sm:inline">{d.slice(1)}</span>
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7 auto-rows-[80px] sm:auto-rows-[120px]">
                {/* Leading blanks */}
                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                  <div key={`blank-${i}`} className="border-b border-r border-border/50 bg-slate-50/30 dark:bg-muted/10 p-2" />
                ))}

                {/* Day cells */}
                {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
                  const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const dayEntries = entriesByDate[dateStr] || [];
                  const isToday = dateStr === today;
                  const isDragOver = dropTarget === dateStr;

                  return (
                    <div
                      key={dateStr}
                      onDragOver={(e) => handleDragOver(e, dateStr)}
                      onDragLeave={handleDragLeave}
                      onDrop={(e) => handleDrop(e, dateStr)}
                      className={`border-b border-r border-border/50 p-1 sm:p-2 text-left transition-colors hover:bg-slate-50 dark:hover:bg-muted/30 overflow-hidden ${
                        isDragOver ? 'bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-400 ring-inset' : ''
                      }`}
                    >
                      <span className={`text-xs sm:text-sm font-medium ${
                        isToday ? 'text-blue-600 font-bold' : 'text-muted-foreground'
                      }`}>
                        {day}
                      </span>

                      <div className="mt-0.5 sm:mt-1 flex flex-col gap-0.5 sm:gap-1">
                        {dayEntries.slice(0, 3).map((entry, ei) => {
                          const isProd = entry.type === 'production';
                          return (
                            <div
                              key={`${entry.piece.id}-${entry.type}-${ei}`}
                              draggable
                              onDragStart={(e) => handleDragStart(e, entry.piece.id, entry.type)}
                              className={`text-[9px] sm:text-[11px] font-medium px-1 sm:px-2 py-0.5 sm:py-1 rounded truncate flex items-center gap-1 sm:gap-1.5 cursor-grab active:cursor-grabbing transition-colors select-none ${
                                isProd
                                  ? 'bg-amber-100/60 text-amber-800 hover:bg-amber-100 dark:bg-amber-950/30 dark:text-amber-400 dark:hover:bg-amber-950/50'
                                  : 'bg-sky-100/60 text-sky-800 hover:bg-sky-100 dark:bg-sky-950/30 dark:text-sky-400 dark:hover:bg-sky-950/50'
                              }`}
                              title={`${isProd ? 'Gravacao' : 'Publicacao'}: ${entry.piece.title || 'Sem titulo'} — arraste para mover`}
                            >
                              <span className={`flex-shrink-0 w-1.5 h-1.5 rounded-full ${isProd ? 'bg-amber-400' : 'bg-sky-500'}`} />
                              <span className="truncate">
                                {FORMAT_LABELS[entry.piece.format] || entry.piece.format}: {entry.piece.title || 'Sem titulo'}
                              </span>
                            </div>
                          );
                        })}
                        {dayEntries.length > 3 && (
                          <span className="text-[10px] text-muted-foreground pl-1 font-medium">+{dayEntries.length - 3} mais</span>
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Trailing blanks */}
                {Array.from({ length: endBlanks }).map((_, i) => (
                  <div key={`end-blank-${i}`} className="border-b border-r border-border/50 bg-slate-50/30 dark:bg-muted/10 p-2" />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
