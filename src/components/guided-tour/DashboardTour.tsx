import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { driver, type DriveStep } from 'driver.js';
import './tour-styles.css';
import { useGuidedTourState, useUpdateGuidedTourState } from '@/hooks/useGuidedTour';
import { useAuth } from '@/contexts/AuthContext';

const TOUR_DELAY_MS = 800;

const desktopSteps: DriveStep[] = [
  {
    popover: {
      title: 'Bem-vindo ao seu Hub!',
      description: 'Vamos fazer um tour rápido pelas principais funcionalidades da plataforma. Leva menos de 1 minuto.',
      side: 'over',
      align: 'center',
    },
  },
  {
    element: '[data-tour="sidebar-comunidade"]',
    popover: {
      title: 'Comunidade',
      description: 'Conecte-se com outros profissionais brasileiros no exterior. Faça perguntas, compartilhe experiências e amplie seu networking.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="sidebar-resumepass"]',
    popover: {
      title: 'ResumePass AI',
      description: 'Analise seu currículo com inteligência artificial e descubra se ele passa nos filtros das empresas americanas.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="sidebar-title-translator"]',
    popover: {
      title: 'Title Translator',
      description: 'Traduza cargos e títulos brasileiros para os equivalentes no mercado internacional com IA.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="sidebar-explore"]',
    popover: {
      title: 'Catálogo de Serviços',
      description: 'Explore mentorias, cursos, consultorias e outros serviços disponíveis para alavancar sua carreira.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '[data-tour="sidebar-meu-hub"]',
    popover: {
      title: 'Meu Hub',
      description: 'Sua central de controle. Volte aqui para ver suas ferramentas e descobrir novidades.',
      side: 'right',
      align: 'start',
    },
  },
  {
    popover: {
      title: 'Por onde quer começar?',
      description: `<div class="enp-tour-cta-grid">
        <button data-tour-cta="comunidade">🗣️ Conhecer a Comunidade</button>
        <button data-tour-cta="curriculo">📄 Analisar meu Currículo</button>
        <button data-tour-cta="catalogo">🔍 Explorar o Catálogo</button>
      </div>`,
      side: 'over',
      align: 'center',
      showButtons: ['close'],
    },
  },
];

const mobileSteps: DriveStep[] = [
  {
    popover: {
      title: 'Bem-vindo ao seu Hub!',
      description: 'Vamos conhecer rapidamente a plataforma.',
      side: 'over',
      align: 'center',
    },
  },
  {
    popover: {
      title: 'Menu de Navegação',
      description: 'Use o ícone ☰ no topo da tela para acessar a Comunidade, ResumePass AI, Catálogo e muito mais.',
      side: 'over',
      align: 'center',
    },
  },
  {
    popover: {
      title: 'Por onde quer começar?',
      description: `<div class="enp-tour-cta-grid">
        <button data-tour-cta="comunidade">🗣️ Conhecer a Comunidade</button>
        <button data-tour-cta="curriculo">📄 Analisar meu Currículo</button>
        <button data-tour-cta="catalogo">🔍 Explorar o Catálogo</button>
      </div>`,
      side: 'over',
      align: 'center',
      showButtons: ['close'],
    },
  },
];

const CTA_ROUTES: Record<string, string> = {
  comunidade: '/comunidade',
  curriculo: '/curriculo',
  catalogo: '/catalogo',
};

export function DashboardTour() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: tourState, isLoading } = useGuidedTourState();
  const updateTourState = useUpdateGuidedTourState();
  const tourStartedRef = useRef(false);

  useEffect(() => {
    if (isLoading) return;
    if (tourState?.tour_completed) return;
    if (tourStartedRef.current) return;
    if (!user || user.role !== 'student') return;

    const isDesktop = window.innerWidth >= 1024;

    const timeoutId = setTimeout(() => {
      tourStartedRef.current = true;

      const driverObj = driver({
        showProgress: true,
        animate: true,
        allowClose: true,
        overlayColor: 'rgba(0, 0, 0, 0.6)',
        stagePadding: 8,
        stageRadius: 16,
        popoverClass: 'enp-tour-popover',
        progressText: '{{current}} de {{total}}',
        nextBtnText: 'Próximo',
        prevBtnText: 'Anterior',
        doneBtnText: 'Finalizar',
        steps: isDesktop ? desktopSteps : mobileSteps,
        onDestroyStarted: (_el, _step, { driver: d }) => {
          updateTourState.mutate({ tour_completed: true });
          d.destroy();
        },
      });

      driverObj.drive();
    }, TOUR_DELAY_MS);

    // CTA button clicks (delegated)
    const handleCtaClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const cta = target.getAttribute('data-tour-cta');
      if (cta && CTA_ROUTES[cta]) {
        navigate(CTA_ROUTES[cta]);
      }
    };
    document.addEventListener('click', handleCtaClick);

    return () => {
      clearTimeout(timeoutId);
      document.removeEventListener('click', handleCtaClick);
    };
  }, [isLoading, tourState?.tour_completed, user]);

  return null;
}
