import { Calendar, History, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface EmptyBookingsProps {
  type: 'upcoming' | 'past';
}

export function EmptyBookings({ type }: EmptyBookingsProps) {
  const navigate = useNavigate();

  if (type === 'upcoming') {
    return (
      <div className="text-center py-12 sm:py-16 px-6">
        <div className="w-14 h-14 bg-indigo-50 dark:bg-indigo-500/10 rounded-xl flex items-center justify-center mx-auto mb-4">
          <Calendar className="h-7 w-7 text-indigo-400 dark:text-indigo-400" />
        </div>
        <h3 className="font-bold text-gray-800 dark:text-foreground text-lg mb-2">
          Nenhum agendamento
        </h3>
        <p className="text-gray-500 dark:text-muted-foreground text-sm max-w-sm mx-auto mb-6">
          Você não tem sessões agendadas. Explore nossos serviços e agende uma
          sessão com um mentor.
        </p>
        <button
          onClick={() => navigate('/catalogo')}
          className="bg-[#7367F0] text-white px-4 py-2.5 rounded-lg font-medium shadow-sm hover:bg-indigo-600 transition-colors inline-flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Explorar Serviços
        </button>
      </div>
    );
  }

  return (
    <div className="text-center py-12 sm:py-16 px-6">
      <div className="w-14 h-14 bg-gray-50 dark:bg-white/10 rounded-xl flex items-center justify-center mx-auto mb-4">
        <History className="h-7 w-7 text-gray-300 dark:text-muted-foreground" />
      </div>
      <h3 className="font-bold text-gray-800 dark:text-foreground text-lg mb-2">
        Nenhuma sessão anterior
      </h3>
      <p className="text-gray-500 dark:text-muted-foreground text-sm max-w-sm mx-auto">
        Você ainda não completou nenhuma sessão de mentoria.
      </p>
    </div>
  );
}
