import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { TimeSlot } from '@/types/booking';

interface TimeSlotPickerProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  userTimezone?: string;
}

export function TimeSlotPicker({
  slots,
  selectedSlot,
  onSelectSlot,
  userTimezone = 'America/Sao_Paulo',
}: TimeSlotPickerProps) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p className="text-sm">Nenhum horário disponível neste dia.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {slots.map((slot) => {
        const slotTime = new Date(slot.slot_start);
        const isSelected = selectedSlot?.slot_start === slot.slot_start;

        return (
          <button
            key={slot.slot_start}
            type="button"
            onClick={() => onSelectSlot(slot)}
            className={cn(
              'px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
              'border-2 hover:border-indigo-300',
              isSelected
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-white text-gray-700 border-gray-200 hover:bg-indigo-50'
            )}
          >
            {format(slotTime, 'HH:mm', { locale: ptBR })}
          </button>
        );
      })}
    </div>
  );
}

interface TimeSlotGridProps {
  slots: TimeSlot[];
  selectedSlot: TimeSlot | null;
  onSelectSlot: (slot: TimeSlot) => void;
  showDuration?: boolean;
}

/**
 * Alternative grid view with more details
 */
export function TimeSlotGrid({
  slots,
  selectedSlot,
  onSelectSlot,
  showDuration = false,
}: TimeSlotGridProps) {
  if (slots.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-200">
        <p className="text-gray-500 text-sm">
          Nenhum horário disponível para esta data.
        </p>
        <p className="text-gray-400 text-xs mt-1">
          Tente selecionar outro dia.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
      {slots.map((slot) => {
        const startTime = new Date(slot.slot_start);
        const endTime = new Date(slot.slot_end);
        const isSelected = selectedSlot?.slot_start === slot.slot_start;

        return (
          <button
            key={slot.slot_start}
            type="button"
            onClick={() => onSelectSlot(slot)}
            className={cn(
              'p-3 rounded-xl transition-all text-left',
              'border-2 hover:shadow-md',
              isSelected
                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg'
                : 'bg-white text-gray-700 border-gray-100 hover:border-indigo-200'
            )}
          >
            <div className="font-bold">
              {format(startTime, 'HH:mm', { locale: ptBR })}
            </div>
            {showDuration && (
              <div
                className={cn(
                  'text-xs mt-1',
                  isSelected ? 'text-indigo-200' : 'text-gray-400'
                )}
              >
                até {format(endTime, 'HH:mm', { locale: ptBR })}
              </div>
            )}
          </button>
        );
      })}
    </div>
  );
}
