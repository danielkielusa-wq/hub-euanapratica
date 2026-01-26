import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { DashboardTopHeader } from '@/components/dashboard/DashboardTopHeader';
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
    description: 'Converse com nossa equipe em tempo real para tirar dúvidas ou reportar problemas.',
    action: 'Iniciar Chat',
    disabled: true,
    comingSoon: true,
    iconBg: 'bg-purple-100',
    iconColor: 'text-purple-600',
  },
  {
    icon: Mail,
    title: 'E-mail',
    description: 'Envie um e-mail para nossa equipe de suporte e receba uma resposta em até 24h.',
    action: 'Enviar E-mail',
    href: 'mailto:suporte@euanapratica.com',
    disabled: false,
    iconBg: 'bg-emerald-100',
    iconColor: 'text-emerald-600',
  },
  {
    icon: HelpCircle,
    title: 'Central de Ajuda',
    description: 'Encontre respostas para as perguntas mais frequentes sobre a plataforma.',
    action: 'Ver FAQ',
    disabled: true,
    comingSoon: true,
    iconBg: 'bg-cyan-100',
    iconColor: 'text-cyan-600',
  },
  {
    icon: FileText,
    title: 'Documentação',
    description: 'Guias passo a passo e tutoriais para aproveitar ao máximo sua experiência.',
    action: 'Ver Docs',
    disabled: true,
    comingSoon: true,
    iconBg: 'bg-green-100',
    iconColor: 'text-green-600',
  },
];

export default function StudentSuporte() {
  return (
    <DashboardLayout>
      <DashboardTopHeader />
      
      <div className="flex-1 p-6 bg-gray-50/50">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Suporte</h1>
            <p className="text-gray-500">
              Como podemos ajudar você hoje?
            </p>
          </div>

          {/* Support Options Grid */}
          <div className="grid gap-4 md:grid-cols-2">
            {supportOptions.map((option) => (
              <div 
                key={option.title}
                className="relative bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm"
              >
                {/* Coming Soon Badge */}
                {option.comingSoon && (
                  <span className="absolute top-4 right-4 bg-gray-100 text-gray-500 text-xs font-medium px-2.5 py-1 rounded-full">
                    EM BREVE
                  </span>
                )}
                
                {/* Icon */}
                <div className={`w-12 h-12 rounded-2xl ${option.iconBg} flex items-center justify-center mb-4`}>
                  <option.icon className={`h-6 w-6 ${option.iconColor}`} />
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {option.title}
                </h3>
                <p className="text-gray-500 text-sm mb-6 min-h-[40px]">
                  {option.description}
                </p>
                
                {/* Action Button */}
                {option.href ? (
                  <Button 
                    variant="outline" 
                    className="w-full rounded-xl border-gray-200 hover:bg-gray-50 gap-2"
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
                    className={`w-full rounded-xl border-gray-200 ${
                      option.disabled 
                        ? 'bg-gray-50 text-gray-400 cursor-not-allowed hover:bg-gray-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    disabled={option.disabled}
                  >
                    {option.action}
                  </Button>
                )}
              </div>
            ))}
          </div>

          {/* Contact Info */}
          <div className="bg-white rounded-[20px] p-6 border border-gray-100 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Outras Formas de Contato
            </h3>
            <div className="flex items-center gap-3 mb-3">
              <Mail className="h-5 w-5 text-gray-400" />
              <span className="text-gray-900">suporte@euanapratica.com</span>
            </div>
            <p className="text-sm text-gray-500">
              Nosso horário de atendimento é de segunda a sexta, das 9h às 18h (horário de Brasília).
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
