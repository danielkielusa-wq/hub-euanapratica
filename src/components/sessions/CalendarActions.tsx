import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Calendar, Download, ExternalLink } from 'lucide-react';
import { downloadICS } from '@/lib/ics-generator';
import { getGoogleCalendarUrl, getOutlookCalendarUrl, getOutlook365CalendarUrl } from '@/lib/calendar-urls';
import { addMinutes } from 'date-fns';

interface CalendarActionsProps {
  session: {
    title: string;
    description?: string | null;
    datetime: string;
    duration_minutes?: number | null;
    meeting_link?: string | null;
  };
}

export function CalendarActions({ session }: CalendarActionsProps) {
  const startDate = new Date(session.datetime);
  const endDate = addMinutes(startDate, session.duration_minutes || 60);

  const event = {
    title: session.title,
    description: session.description || undefined,
    startDate,
    endDate,
    location: session.meeting_link || undefined,
  };

  const handleDownloadICS = () => {
    downloadICS({
      ...event,
      url: session.meeting_link || undefined,
    });
  };

  const handleGoogleCalendar = () => {
    window.open(getGoogleCalendarUrl(event), '_blank');
  };

  const handleOutlook = () => {
    window.open(getOutlookCalendarUrl(event), '_blank');
  };

  const handleOutlook365 = () => {
    window.open(getOutlook365CalendarUrl(event), '_blank');
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Calendar className="h-4 w-4" />
          Adicionar ao Calendário
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuItem onClick={handleGoogleCalendar} className="gap-2">
          <ExternalLink className="h-4 w-4" />
          Google Calendar
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOutlook} className="gap-2">
          <ExternalLink className="h-4 w-4" />
          Outlook.com
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleOutlook365} className="gap-2">
          <ExternalLink className="h-4 w-4" />
          Outlook 365
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handleDownloadICS} className="gap-2">
          <Download className="h-4 w-4" />
          Baixar arquivo .ics
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
