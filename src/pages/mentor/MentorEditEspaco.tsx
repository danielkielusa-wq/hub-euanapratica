import { useParams } from 'react-router-dom';
import { CreateEspacoForm } from '@/components/admin/espacos/CreateEspacoForm';

export default function MentorEditEspaco() {
  const { id } = useParams<{ id: string }>();
  return <CreateEspacoForm isMentor={true} espacoId={id} />;
}
