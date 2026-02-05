import { Clock, User } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';

interface ServiceHeaderProps {
  service?: {
    name: string;
    description: string | null;
    icon_name: string | null;
  };
  mentor?: {
    full_name: string;
    profile_photo_url: string | null;
  };
  duration?: number;
  isLoading?: boolean;
}

export function ServiceHeader({
  service,
  mentor,
  duration = 60,
  isLoading,
}: ServiceHeaderProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
        <Skeleton className="h-6 w-48 mb-2" />
        <Skeleton className="h-4 w-64 mb-4" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 shadow-sm">
      <h2 className="text-xl font-bold text-gray-900">{service?.name}</h2>
      {service?.description && (
        <p className="text-gray-500 text-sm mt-1">{service.description}</p>
      )}

      <div className="flex items-center gap-6 mt-4">
        {/* Mentor info */}
        {mentor && (
          <div className="flex items-center gap-3">
            <Avatar className="h-10 w-10">
              <AvatarImage src={mentor.profile_photo_url || undefined} />
              <AvatarFallback className="bg-indigo-100 text-indigo-600">
                {mentor.full_name
                  .split(' ')
                  .map((n) => n[0])
                  .join('')
                  .slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-gray-900">
                {mentor.full_name}
              </p>
              <p className="text-xs text-gray-500">Mentor</p>
            </div>
          </div>
        )}

        {/* Duration */}
        <div className="flex items-center gap-2 text-gray-500">
          <Clock className="h-4 w-4" />
          <span className="text-sm">{duration} minutos</span>
        </div>
      </div>
    </div>
  );
}
