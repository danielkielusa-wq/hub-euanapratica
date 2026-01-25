import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  MessageCircle, 
  Mail, 
  HelpCircle, 
  FileText,
  ExternalLink 
} from 'lucide-react';

const supportOptions = [
  {
    icon: MessageCircle,
    title: 'Chat de Suporte',
    description: 'Converse com nossa equipe em tempo real',
    action: 'Iniciar Chat',
    disabled: true,
    comingSoon: true,
  },
  {
    icon: Mail,
    title: 'E-mail',
    description: 'Envie um e-mail para nossa equipe de suporte',
    action: 'Enviar E-mail',
    href: 'mailto:suporte@euanapratica.com',
    disabled: false,
  },
  {
    icon: HelpCircle,
    title: 'Central de Ajuda',
    description: 'Encontre respostas para as perguntas frequentes',
    action: 'Ver FAQ',
    disabled: true,
    comingSoon: true,
  },
  {
    icon: FileText,
    title: 'Documentação',
    description: 'Guias e tutoriais sobre a plataforma',
    action: 'Ver Docs',
    disabled: true,
    comingSoon: true,
  },
];

export default function StudentSuporte() {
  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Suporte</h1>
          <p className="text-muted-foreground">
            Como podemos ajudar você hoje?
          </p>
        </div>

        {/* Support Options Grid */}
        <div className="grid gap-4 md:grid-cols-2">
          {supportOptions.map((option) => (
            <Card 
              key={option.title}
              className={option.disabled ? 'opacity-60' : 'hover:shadow-md transition-shadow'}
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10">
                    <option.icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-lg flex items-center gap-2">
                      {option.title}
                      {option.comingSoon && (
                        <span className="text-xs font-normal text-muted-foreground bg-muted px-2 py-0.5 rounded">
                          Em breve
                        </span>
                      )}
                    </CardTitle>
                    <CardDescription className="mt-1">
                      {option.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {option.href ? (
                  <Button 
                    variant="outline" 
                    className="w-full gap-2"
                    asChild
                  >
                    <a href={option.href}>
                      {option.action}
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  </Button>
                ) : (
                  <Button 
                    variant="outline" 
                    className="w-full"
                    disabled={option.disabled}
                  >
                    {option.action}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Info */}
        <Card>
          <CardHeader>
            <CardTitle>Outras Formas de Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-muted-foreground" />
              <span className="text-foreground">suporte@euanapratica.com</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Nosso horário de atendimento é de segunda a sexta, das 9h às 18h (horário de Brasília).
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
