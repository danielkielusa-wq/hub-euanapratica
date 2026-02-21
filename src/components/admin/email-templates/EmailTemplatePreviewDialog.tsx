import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { EmailTemplate } from '@/hooks/useAdminEmailTemplates';

interface EmailTemplatePreviewDialogProps {
  template: EmailTemplate | null;
  onClose: () => void;
}

export function EmailTemplatePreviewDialog({ template, onClose }: EmailTemplatePreviewDialogProps) {
  if (!template) return null;

  return (
    <Dialog open={!!template} onOpenChange={onClose}>
      <DialogContent className="rounded-[24px] max-w-4xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle>{template.display_name}</DialogTitle>
          <DialogDescription className="space-y-2">
            <p className="font-mono text-xs">{template.name}</p>
            <p><strong>Assunto:</strong> {template.subject}</p>
            {template.variables && template.variables.length > 0 && (
              <div className="flex flex-wrap gap-1 items-center">
                <strong>Variáveis:</strong>
                {template.variables.map((v, i) => (
                  <Badge key={i} variant="outline" className="text-xs font-mono">
                    {v}
                  </Badge>
                ))}
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="border rounded-xl overflow-auto" style={{ maxHeight: '60vh' }}>
          <iframe
            srcDoc={template.body_html}
            title="Email Preview"
            className="w-full h-full"
            style={{ minHeight: '500px' }}
            sandbox="allow-same-origin"
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
