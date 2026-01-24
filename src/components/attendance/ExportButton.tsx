import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { exportAttendanceCSV, type AttendanceRecord } from '@/hooks/useAttendance';

interface ExportButtonProps {
  records: AttendanceRecord[];
  sessionTitle: string;
  disabled?: boolean;
}

export function ExportButton({ records, sessionTitle, disabled }: ExportButtonProps) {
  const handleExport = () => {
    exportAttendanceCSV(records, sessionTitle);
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={disabled || records.length === 0}
      className="gap-2"
    >
      <Download className="h-4 w-4" />
      Exportar CSV
    </Button>
  );
}
