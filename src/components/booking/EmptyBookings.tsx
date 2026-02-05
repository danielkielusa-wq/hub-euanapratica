import { Calendar, History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';

interface EmptyBookingsProps {
  type: 'upcoming' | 'past';
}

export function EmptyBookings({ type }: EmptyBookingsProps) {
  const navigate = useNavigate();

  if (type === 'upcoming') {
    return (
      <div className="text-center py-16 bg-white rounded-[32px] border border-dashed border-gray-200">
        <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <Calendar className="h-8 w-8 text-indigo-400" />
        </div>
        <h3 className="font-bold text-gray-900 text-lg mb-2">
          Nenhum agendamento
        </h3>
        <p className="text-gray-500 text-sm max-w-sm mx-auto mb-6">
          Você não tem sessões agendadas. Explore nossos serviços e agende uma
          sessão com um mentor.
        </p>
        <Button
          onClick={() => navigate('/catalogo')}
          className="bg-indigo-600 hover:bg-indigo-700"
        >
          <Plus className="h-4 w-4 mr-2" />
          Explorar Serviços
        </Button>
      </div>
    );
  }

  return (
    <div className="text-center py-16 bg-white rounded-[32px] border border-dashed border-gray-200">
      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
        <History className="h-8 w-8 text-gray-300" />
      </div>
      <h3 className="font-bold text-gray-900 text-lg mb-2">
        Nenhuma sessão anterior
      </h3>
      <p className="text-gray-500 text-sm max-w-sm mx-auto">
        Você ainda não completou nenhuma sessão de mentoria.
      </p>
    </div>
  );
}
