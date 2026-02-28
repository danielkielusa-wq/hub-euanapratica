import { CSSProperties } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import * as icons from 'lucide-react';
import {
  ArrowRight, Flame, Snowflake, Sun, Zap, MoreHorizontal,
  FileSearch, Languages, Briefcase, MessageCircle, Heart,
  TrendingUp, Calendar, Sparkles, ShieldCheck, CheckCircle2,
  AlertTriangle, PlayCircle, AlertCircle, History, Radio,
  type LucideIcon,
} from 'lucide-react';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useSubscription } from '@/hooks/useSubscription';
import { useHighlightedService, useSecondaryServices } from '@/hooks/useHighlightedService';
import { useHubDashboardConfig, isSectionVisible, DEFAULT_CONFIG, getGreeting } from '@/hooks/useHubDashboardConfig';
import { useCareerInsights } from '@/hooks/useCareerInsights';
import { useCommunityPulse } from '@/hooks/useCommunityPulse';
import { useSmartNextStep } from '@/hooks/useSmartNextStep';
import { useMyHub, usePlanTools } from '@/hooks/useMyHub';
import { useMyLives } from '@/hooks/useMyLives';
import { useChecklistStatus } from '@/hooks/useGuidedTour';
import { useDimensionService } from '@/hooks/useDimensionService';
import { PriceDisplay } from '@/components/hub/PriceDisplay';
import type { HubDashboardConfig, CareerInsights, CommunityPulse, HubDashboardSectionId } from '@/types/hub';

// ─── Design system ──────────────────────────────────────────────────────────────
const C = {
  BLUE:     '#60A5FA',
  LAVENDER: '#A78BFA',
  EMERALD:  '#34D399',
  AMBER:    '#FBBF24',
  ORANGE:   '#FB923C',
  RED:      '#F87171',

  BG1: '#050D1A',
  BG2: '#0A1628',

  T1: 'rgba(255,255,255,0.92)',
  T2: 'rgba(255,255,255,0.58)',
  T3: 'rgba(255,255,255,0.32)',
  T4: 'rgba(255,255,255,0.16)',

  FONT: '"Plus Jakarta Sans", sans-serif',
} as const;

// Glass surface tokens
const G = {
  CARD: {
    background: 'rgba(255,255,255,0.08)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.14)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.40), inset 0 1px 0 rgba(255,255,255,0.12)',
    borderRadius: 20,
  } as CSSProperties,

  SUBTLE: {
    background: 'rgba(255,255,255,0.05)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    border: '1px solid rgba(255,255,255,0.09)',
    boxShadow: '0 4px 16px rgba(0,0,0,0.30)',
  } as CSSProperties,

  DEEP: {
    background: 'linear-gradient(160deg, rgba(255,255,255,0.10) 0%, rgba(255,255,255,0.06) 100%)',
    backdropFilter: 'blur(32px)',
    WebkitBackdropFilter: 'blur(32px)',
    border: '1px solid rgba(255,255,255,0.16)',
    boxShadow: '0 16px 48px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.16)',
    borderRadius: 24,
  } as CSSProperties,
};

// ─── Percent → hex for progress bars ────────────────────────────────────────────
function barHex(pct: number): string {
  if (pct >= 75) return C.EMERALD;
  if (pct >= 55) return C.BLUE;
  if (pct >= 35) return C.AMBER;
  if (pct >= 20) return C.ORANGE;
  return C.RED;
}

// ─── Temperature mapping ─────────────────────────────────────────────────────────
const TEMP: Record<string, { label: string; color: string; icon: typeof Flame }> = {
  'muito-quente': { label: 'Muito Quente', color: C.RED,     icon: Flame    },
  quente:         { label: 'Quente',       color: C.ORANGE,  icon: Flame    },
  morno:          { label: 'Morno',        color: C.AMBER,   icon: Sun      },
  frio:           { label: 'Frio',         color: C.BLUE,    icon: Snowflake },
};

// ─── Urgency → accent ────────────────────────────────────────────────────────────
const URGENCY: Record<string, { color: string; glow: string }> = {
  high:   { color: C.AMBER,    glow: 'rgba(251,191,36,0.12)'  },
  medium: { color: C.BLUE,     glow: 'rgba(96,165,250,0.12)'  },
  low:    { color: C.T3,       glow: 'transparent'            },
};

// ─── Journey section icon colours ───────────────────────────────────────────────
const JOURNEY_ICON: Record<string, { color: string; icon: typeof AlertCircle }> = {
  needs_action: { color: C.AMBER,   icon: AlertCircle },
  active:       { color: C.EMERALD, icon: PlayCircle  },
  upcoming:     { color: C.BLUE,    icon: Calendar    },
  history:      { color: C.T3,      icon: History     },
};

// ─── Tool definitions ────────────────────────────────────────────────────────────
const TOOLS = [
  { key: 'resume_pass',     label: 'ResumePass AI',   icon: FileSearch, route: '/curriculo',         color: C.BLUE,     getStat: (c: number) => `${c} crédito${c !== 1 ? 's' : ''}` },
  { key: 'title_translator',label: 'Title Translator', icon: Languages,  route: '/title-translator',  color: C.LAVENDER, getStat: () => 'Ilimitado' },
  { key: 'prime_jobs',      label: 'Prime Jobs',       icon: Briefcase,  route: '/prime-jobs',        color: C.EMERALD,  getStat: () => 'Explorar' },
];

// ─── Ambient glow orb ────────────────────────────────────────────────────────────
function Orb({ x, y, color, size }: { x: string; y: string; color: string; size: number }) {
  return (
    <div aria-hidden style={{
      position: 'absolute', left: x, top: y, width: size, height: size,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      borderRadius: '50%', pointerEvents: 'none', zIndex: 0,
    }} />
  );
}

// ─── Noise grain overlay ─────────────────────────────────────────────────────────
function Grain() {
  return (
    <div aria-hidden style={{
      position: 'absolute', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.028,
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundRepeat: 'repeat', backgroundSize: '128px',
    }} />
  );
}

// ─── Shimmer skeleton ────────────────────────────────────────────────────────────
function Shimmer({ h = 80, r = 16 }: { h?: number; r?: number }) {
  return (
    <div className="gjk-shimmer" style={{
      height: h, borderRadius: r,
      background: 'rgba(255,255,255,0.05)',
      border: '1px solid rgba(255,255,255,0.08)',
    }} />
  );
}

// ─── Stagger wrapper ─────────────────────────────────────────────────────────────
function Rise({ delay = 0, children }: { delay?: number; children: React.ReactNode }) {
  return (
    <div className="gjk-rise" style={{ animationDelay: `${delay}ms` }}>
      {children}
    </div>
  );
}

// ─── Section heading ─────────────────────────────────────────────────────────────
function Heading({ children, sub, action }: {
  children: React.ReactNode;
  sub?: string;
  action?: React.ReactNode;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <h2 style={{ fontFamily: C.FONT, fontSize: 15, fontWeight: 700, color: C.T1, letterSpacing: '-0.01em', margin: 0 }}>
          {children}
        </h2>
        {sub && <span style={{ fontFamily: C.FONT, fontSize: 11, color: C.T3, fontWeight: 400 }}>{sub}</span>}
      </div>
      {action}
    </div>
  );
}

// ─── Pill badge ──────────────────────────────────────────────────────────────────
function Badge({ label, color }: { label: string; color: string }) {
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      borderRadius: 100, padding: '3px 10px',
      fontFamily: C.FONT, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em',
      background: `${color}18`, border: `1px solid ${color}35`, color,
    }}>
      {label}
    </span>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// HERO SECTION
// ═══════════════════════════════════════════════════════════════════════════════
function ScoreRing({ score, color }: { score: number; color: string }) {
  const r = 58, circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 148, height: 148, flexShrink: 0 }}>
      <svg viewBox="0 0 128 128" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
        <defs>
          <filter id="ring-glow">
            <feGaussianBlur stdDeviation="2.5" result="b"/>
            <feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge>
          </filter>
        </defs>
        <circle cx="64" cy="64" r={r} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="7"/>
        <circle cx="64" cy="64" r={r} fill="none"
          stroke={color} strokeWidth="7" strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (score / 100) * circ}
          filter="url(#ring-glow)"
          style={{ transition: 'stroke-dashoffset 1.4s cubic-bezier(0.16,1,0.3,1)' }}
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
        <span style={{ fontFamily: C.FONT, fontSize: 40, fontWeight: 800, color: C.T1, lineHeight: 1, letterSpacing: '-0.04em' }}>
          {score}
        </span>
        <span style={{ fontFamily: C.FONT, fontSize: 10, fontWeight: 600, color: C.T3, letterSpacing: '0.06em' }}>
          / 100
        </span>
      </div>
    </div>
  );
}

function HeroSection({ config, insights, planName, userName }: {
  config: HubDashboardConfig;
  insights: CareerInsights | null;
  planName: string;
  userName: string;
}) {
  const hasReport = insights?.hasReport ?? false;
  const greeting = getGreeting(config, userName, hasReport);

  if (!hasReport || !insights) {
    return (
      <div style={{ ...G.DEEP, padding: 'clamp(28px,4vw,44px)', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: 0, left: 32, right: 32, height: 1, background: `linear-gradient(90deg, transparent, ${C.BLUE}50, transparent)` }} />
        <p style={{ fontFamily: C.FONT, fontSize: 12, fontWeight: 500, color: C.T3, marginBottom: 10, letterSpacing: '0.02em' }}>
          {greeting}
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <h1 style={{ fontFamily: C.FONT, fontSize: 'clamp(28px,5vw,44px)', fontWeight: 800, color: C.T1, letterSpacing: '-0.03em', margin: 0 }}>
            Seu Hub
          </h1>
          <Badge label={`Plano ${planName}`} color={C.BLUE} />
        </div>
        <p style={{ fontFamily: C.FONT, fontSize: 13, color: C.T3, marginTop: 12 }}>
          Complete seu diagnóstico para desbloquear insights personalizados.
        </p>
        <Link to="/avaliar" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 16, fontFamily: C.FONT, fontSize: 12, fontWeight: 700, color: C.BLUE, textDecoration: 'none' }}>
          Fazer Diagnóstico <ArrowRight size={13} />
        </Link>
      </div>
    );
  }

  const temp = insights.temperature ? TEMP[insights.temperature] : null;
  const TempIcon = temp?.icon ?? Zap;
  const ringColor = insights.phase?.color || C.BLUE;

  return (
    <div style={{ ...G.DEEP, padding: 'clamp(24px,4vw,40px)', marginBottom: 28, position: 'relative', overflow: 'hidden' }}>
      {/* Top accent line */}
      <div aria-hidden style={{ position: 'absolute', top: 0, left: 32, right: 32, height: 1, background: `linear-gradient(90deg, transparent, ${ringColor}60, transparent)` }} />
      {/* Subtle glow behind ring */}
      <div aria-hidden style={{ position: 'absolute', top: -60, left: -40, width: 300, height: 300, background: `radial-gradient(circle, ${ringColor}12 0%, transparent 70%)`, pointerEvents: 'none' }} />

      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 28, position: 'relative', zIndex: 1 }}>
        <ScoreRing score={insights.score} color={ringColor} />

        <div style={{ flex: 1, minWidth: 200 }}>
          {/* Greeting row */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 8 }}>
            <p style={{ fontFamily: C.FONT, fontSize: 12, color: C.T3, fontWeight: 500, margin: 0 }}>{greeting}</p>
            <Badge label={`Plano ${planName}`} color={C.BLUE} />
          </div>

          {/* Score headline */}
          <h1 style={{ fontFamily: C.FONT, fontSize: 'clamp(22px,3vw,34px)', fontWeight: 800, color: C.T1, letterSpacing: '-0.03em', margin: '0 0 10px' }}>
            Prontidão: <span style={{ color: ringColor }}>{insights.score}</span>/100
          </h1>

          {/* Badges */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
            {insights.phase && (
              <Badge label={`${insights.phase.emoji} ${insights.phase.name}`} color={insights.phase.color} />
            )}
            {temp && (
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 4,
                borderRadius: 100, padding: '3px 10px',
                fontFamily: C.FONT, fontSize: 10, fontWeight: 700,
                background: `${temp.color}18`, border: `1px solid ${temp.color}35`, color: temp.color,
                boxShadow: `0 0 10px ${temp.color}25`,
              }}>
                <TempIcon size={10} /> {temp.label}
              </span>
            )}
          </div>

          {/* Diagnosis */}
          {insights.shortDiagnosis && (
            <p style={{
              fontFamily: C.FONT, fontSize: 13, lineHeight: 1.65, color: C.T2, margin: 0,
              display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {insights.shortDiagnosis}
            </p>
          )}

          {/* CTA */}
          {insights.reportToken && (
            <Link
              to={`/report/${insights.reportToken}`}
              className="gjk-link-hover"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, fontFamily: C.FONT, fontSize: 12, fontWeight: 700, color: C.BLUE, textDecoration: 'none' }}
            >
              Ver Relatório Completo <ArrowRight size={13} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMART NEXT STEP
// ═══════════════════════════════════════════════════════════════════════════════
function NextStepCard({ step }: { step: ReturnType<typeof useSmartNextStep> }) {
  const navigate = useNavigate();
  if (!step) return null;

  const Icon = (icons as Record<string, LucideIcon>)[step.icon] || icons.Zap;
  const acc = URGENCY[step.urgencyLevel] ?? URGENCY.low;

  return (
    <button
      onClick={() => navigate(step.actionHref)}
      className="gjk-card-hover"
      style={{
        ...G.CARD,
        display: 'flex', alignItems: 'center', gap: 14, width: '100%', textAlign: 'left',
        padding: '16px 20px', marginBottom: 28, cursor: 'pointer',
        borderLeft: `3px solid ${acc.color}`,
        boxShadow: `${G.CARD.boxShadow}, 0 0 20px ${acc.glow}`,
        borderRadius: 18,
      }}
    >
      <div style={{
        width: 38, height: 38, borderRadius: 11, flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: `${acc.color}18`, border: `1px solid ${acc.color}30`, color: acc.color,
      }}>
        <Icon size={17} />
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontFamily: C.FONT, fontSize: 9, fontWeight: 800, color: C.T3, letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 3px' }}>
          Próximo Passo
        </p>
        <p style={{ fontFamily: C.FONT, fontSize: 13, fontWeight: 700, color: C.T1, margin: '0 0 2px' }}>{step.title}</p>
        <p style={{ fontFamily: C.FONT, fontSize: 11, color: C.T3, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{step.description}</p>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0, fontFamily: C.FONT, fontSize: 11, fontWeight: 700, color: acc.color }}>
        {step.actionLabel} <ArrowRight size={13} />
      </div>
    </button>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MY JOURNEY
// ═══════════════════════════════════════════════════════════════════════════════
function JourneySection() {
  const navigate = useNavigate();
  const { data: sections, isLoading: l1 } = useMyHub();
  const { data: planTools, isLoading: l2 } = usePlanTools();
  const { data: myLives, isLoading: l3 } = useMyLives();

  const isLoading = l1 || l2 || l3;
  const hasAny = (sections && sections.length > 0) || (planTools && planTools.length > 0) || (myLives && myLives.length > 0);

  if (isLoading) return (
    <div style={{ marginBottom: 32 }}>
      <Heading>Minha Jornada</Heading>
      <div className="gjk-journey-grid">
        {[1,2,3,4].map(i => <Shimmer key={i} h={60} r={14} />)}
      </div>
    </div>
  );

  if (!hasAny) return null;

  const go = (item: { route?: string | null; landing_page_url?: string | null; ticto_checkout_url?: string | null }) => {
    if (item.route) { navigate(item.route); return; }
    if (item.landing_page_url) {
      if (item.landing_page_url.startsWith('/')) navigate(item.landing_page_url);
      else window.open(item.landing_page_url, '_blank');
      return;
    }
    if (item.ticto_checkout_url) window.open(item.ticto_checkout_url, '_blank');
  };

  return (
    <div style={{ marginBottom: 36 }}>
      <Heading sub="— tudo que você tem acesso">Minha Jornada</Heading>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {sections?.map(section => {
          const cfg = JOURNEY_ICON[section.id] ?? { color: C.T3, icon: Zap };
          const SIcon = cfg.icon;

          return (
            <div key={section.id}>
              {/* Group label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <SIcon size={12} style={{ color: cfg.color }} />
                <span style={{ fontFamily: C.FONT, fontSize: 9, fontWeight: 800, color: C.T3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  {section.label}
                </span>
                <span style={{ fontFamily: C.FONT, fontSize: 10, color: C.T4 }}>({section.items.length})</span>
              </div>

              {/* 2-column grid */}
              <div className="gjk-journey-grid">
                {section.items.map((item: {
                  user_service_id: string; name: string; icon_name?: string;
                  progress_pct?: number | null; route?: string | null;
                  landing_page_url?: string | null; ticto_checkout_url?: string | null;
                }) => {
                  const ItemIcon = (icons as Record<string, LucideIcon>)[item.icon_name ?? 'FileCheck'] || icons.FileCheck;
                  return (
                    <button
                      key={item.user_service_id}
                      onClick={() => go(item)}
                      className="gjk-card-hover"
                      style={{
                        ...G.SUBTLE, borderRadius: 14,
                        padding: '12px 14px',
                        borderLeft: `3px solid ${cfg.color}`,
                        display: 'flex', alignItems: 'center', gap: 10,
                        textAlign: 'left', cursor: 'pointer',
                      }}
                    >
                      <div style={{
                        width: 32, height: 32, borderRadius: 9, flexShrink: 0,
                        background: `${cfg.color}14`, border: `1px solid ${cfg.color}28`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: cfg.color,
                      }}>
                        <ItemIcon size={15} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontFamily: C.FONT, fontSize: 12, fontWeight: 600, color: C.T1, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.name}
                        </p>
                        {item.progress_pct != null && (
                          <div style={{ marginTop: 5, height: 2, borderRadius: 2, background: 'rgba(255,255,255,0.08)' }}>
                            <div style={{ height: '100%', borderRadius: 2, background: cfg.color, width: `${item.progress_pct}%`, transition: 'width 0.8s ease' }} />
                          </div>
                        )}
                      </div>
                      <ArrowRight size={12} style={{ color: C.T4, flexShrink: 0 }} />
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Plan tools */}
        {planTools && planTools.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
              <Zap size={12} style={{ color: C.BLUE }} />
              <span style={{ fontFamily: C.FONT, fontSize: 9, fontWeight: 800, color: C.T3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                Ferramentas do Plano
              </span>
            </div>
            <div className="gjk-journey-grid">
              {planTools.map((tool: { service: { id: string; name: string; icon_name?: string; route?: string | null } }) => {
                const TIcon = (icons as Record<string, LucideIcon>)[tool.service.icon_name ?? 'Zap'] || icons.Zap;
                return (
                  <button
                    key={tool.service.id}
                    onClick={() => tool.service.route && navigate(tool.service.route)}
                    className="gjk-card-hover"
                    style={{ ...G.SUBTLE, borderRadius: 14, padding: '12px 14px', display: 'flex', alignItems: 'center', gap: 10, borderLeft: `3px solid ${C.BLUE}`, cursor: 'pointer', textAlign: 'left' }}
                  >
                    <div style={{ width: 32, height: 32, borderRadius: 9, background: `${C.BLUE}14`, border: `1px solid ${C.BLUE}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.BLUE, flexShrink: 0 }}>
                      <TIcon size={15} />
                    </div>
                    <p style={{ fontFamily: C.FONT, fontSize: 12, fontWeight: 600, color: C.T1, margin: 0, flex: 1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {tool.service.name}
                    </p>
                    <ArrowRight size={12} style={{ color: C.T4, flexShrink: 0 }} />
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Lives */}
        {myLives && myLives.length > 0 && (() => {
          const PRI: Record<string, number> = { live: 0, scheduled: 1, completed: 2 };
          const sorted = [...myLives].sort((a, b) => {
            const pa = PRI[a.live.status] ?? 3, pb = PRI[b.live.status] ?? 3;
            return pa !== pb ? pa - pb : new Date(a.live.scheduled_at).getTime() - new Date(b.live.scheduled_at).getTime();
          });
          return (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 8 }}>
                <Radio size={12} style={{ color: C.RED }} />
                <span style={{ fontFamily: C.FONT, fontSize: 9, fontWeight: 800, color: C.T3, textTransform: 'uppercase', letterSpacing: '0.12em' }}>
                  Minhas Lives
                </span>
                <span style={{ fontFamily: C.FONT, fontSize: 10, color: C.T4 }}>({myLives.length})</span>
              </div>
              <div className="gjk-journey-grid">
                {sorted.slice(0, 2).map((item: { registration_id: string; live: { title: string; status: string; scheduled_at: string } }) => (
                  <div key={item.registration_id} style={{ ...G.SUBTLE, borderRadius: 14, padding: '12px 14px', borderLeft: `3px solid ${item.live.status === 'live' ? C.RED : C.T4}` }}>
                    <span style={{
                      display: 'inline-block', borderRadius: 100, padding: '2px 8px', marginBottom: 5,
                      fontFamily: C.FONT, fontSize: 9, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase',
                      background: item.live.status === 'live' ? `${C.RED}20` : 'rgba(255,255,255,0.06)',
                      border: `1px solid ${item.live.status === 'live' ? `${C.RED}40` : 'rgba(255,255,255,0.10)'}`,
                      color: item.live.status === 'live' ? C.RED : C.T3,
                    }}>
                      {item.live.status === 'live' ? '● AO VIVO' : item.live.status === 'scheduled' ? 'Agendada' : 'Concluída'}
                    </span>
                    <p style={{ fontFamily: C.FONT, fontSize: 12, fontWeight: 600, color: C.T1, margin: 0, lineHeight: 1.4 }}>
                      {item.live.title}
                    </p>
                  </div>
                ))}
              </div>
              {myLives.length > 2 && (
                <div style={{ marginTop: 10, textAlign: 'center' }}>
                  <Link to="/lives" style={{ fontFamily: C.FONT, fontSize: 11, fontWeight: 700, color: C.BLUE, textDecoration: 'none' }}>
                    Ver todas ({myLives.length})
                  </Link>
                </div>
              )}
            </div>
          );
        })()}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// CAREER DIMENSIONS
// ═══════════════════════════════════════════════════════════════════════════════
function DimensionsSection({ insights, config }: { insights: CareerInsights; config: HubDashboardConfig }) {
  const navigate = useNavigate();
  const { data: weakestService } = useDimensionService(insights.weakest?.key);
  const socialProof = insights.weakest?.key
    ? config.social_proof.dimension_cta[insights.weakest.key as keyof typeof config.social_proof.dimension_cta]
    : null;

  if (!insights.hasReport || insights.dimensions.length === 0) return null;
  const displayed = insights.dimensions.slice(0, 6);

  const handleService = () => {
    if (!weakestService) return;
    const url = weakestService.landing_page_url;
    if (url) {
      if (url.startsWith('/')) navigate(url);
      else window.open(url, '_blank');
    } else if (weakestService.ticto_checkout_url) window.open(weakestService.ticto_checkout_url, '_blank');
    else if (weakestService.route) navigate(weakestService.route);
  };

  return (
    <div style={{ marginBottom: 36 }}>
      <Heading sub="— do seu diagnóstico">Suas Dimensões</Heading>
      <div style={{ ...G.CARD, padding: '24px 28px', position: 'relative', overflow: 'hidden' }}>
        <div aria-hidden style={{ position: 'absolute', top: 0, left: 28, right: 28, height: 1, background: `linear-gradient(90deg, transparent, ${C.LAVENDER}50, transparent)` }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {displayed.map((dim, i) => {
            const isWeakest = dim.key === insights.weakest?.key;
            const isStrongest = dim.key === insights.strongest?.key;
            const hex = barHex(dim.percent);

            return (
              <div key={dim.key}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginBottom: 6 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
                    <span style={{ fontFamily: C.FONT, fontSize: 12, fontWeight: 500, color: C.T2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {dim.label}
                    </span>
                    {isWeakest && (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, borderRadius: 100, padding: '2px 7px', fontFamily: C.FONT, fontSize: 9, fontWeight: 800, letterSpacing: '0.05em', background: `${C.RED}18`, border: `1px solid ${C.RED}30`, color: C.RED, flexShrink: 0 }}>
                        <AlertTriangle size={8} /> Maior Gap
                      </span>
                    )}
                    {isStrongest && <CheckCircle2 size={12} style={{ color: C.EMERALD, flexShrink: 0 }} />}
                  </div>
                  <span style={{ fontFamily: C.FONT, fontSize: 12, fontWeight: 700, color: hex, fontVariantNumeric: 'tabular-nums', flexShrink: 0 }}>
                    {dim.percent}%
                  </span>
                </div>
                <div style={{ height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.07)', overflow: 'hidden' }}>
                  <div style={{
                    height: '100%', borderRadius: 4,
                    background: `linear-gradient(90deg, ${hex}80, ${hex})`,
                    boxShadow: `0 0 8px ${hex}50`,
                    width: `${dim.percent}%`,
                    transition: `width 1s cubic-bezier(0.16,1,0.3,1) ${i * 70}ms`,
                  }} />
                </div>
              </div>
            );
          })}
        </div>

        {(socialProof || weakestService) && (
          <div style={{ marginTop: 20, paddingTop: 18, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
            {socialProof && (
              <p style={{ fontFamily: C.FONT, fontSize: 12, color: C.T3, fontStyle: 'italic', margin: '0 0 10px' }}>{socialProof}</p>
            )}
            {weakestService && (
              <button onClick={handleService} className="gjk-link-hover" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontFamily: C.FONT, fontSize: 12, fontWeight: 700, color: C.LAVENDER, background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}>
                Melhorar {insights.weakest?.label} <ArrowRight size={13} />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMUNITY PULSE
// ═══════════════════════════════════════════════════════════════════════════════
function CommunitySection({ pulse, config }: { pulse: CommunityPulse; config: HubDashboardConfig }) {
  const navigate = useNavigate();

  return (
    <div style={{ marginBottom: 36 }}>
      <Heading
        sub={pulse.postsToday > 0 ? `${pulse.postsToday} posts hoje` : undefined}
        action={
          <button
            onClick={() => navigate('/comunidade')}
            className="gjk-link-hover"
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontFamily: C.FONT, fontSize: 11, fontWeight: 700, color: C.T3, padding: 0 }}
          >
            Abrir <ArrowRight size={13} />
          </button>
        }
      >
        Comunidade
      </Heading>

      <div style={{ ...G.CARD, padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        {config.community_pulse.show_top_post && pulse.topPost && (
          <>
            <button
              onClick={() => navigate(`/comunidade/post/${pulse.topPost!.id}`)}
              className="gjk-link-hover"
              style={{ display: 'flex', alignItems: 'flex-start', gap: 12, background: 'none', border: 'none', cursor: 'pointer', padding: 0, width: '100%', textAlign: 'left' }}
            >
              <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: `${C.AMBER}18`, border: `1px solid ${C.AMBER}28`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.AMBER }}>
                <TrendingUp size={16} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontFamily: C.FONT, fontSize: 9, fontWeight: 800, color: C.T4, letterSpacing: '0.12em', textTransform: 'uppercase', marginBottom: 3 }}>
                  Destaque da Semana
                </p>
                <p style={{ fontFamily: C.FONT, fontSize: 13, fontWeight: 600, color: C.T1, margin: '0 0 4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {pulse.topPost.title}
                </p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <span style={{ fontFamily: C.FONT, fontSize: 11, color: C.T3 }}>{pulse.topPost.author_name}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: C.FONT, fontSize: 11, color: C.T3 }}>
                    <Heart size={10} /> {pulse.topPost.likes_count}
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3, fontFamily: C.FONT, fontSize: 11, color: C.T3 }}>
                    <MessageCircle size={10} /> {pulse.topPost.comments_count}
                  </span>
                </div>
              </div>
            </button>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
          </>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <p style={{ fontFamily: C.FONT, fontSize: 13, color: C.T2, margin: 0 }}>
            {pulse.userLatestPost
              ? <>Seu último post recebeu <strong style={{ color: C.T1 }}>{pulse.userLatestPost.likes_count}</strong> curtida{pulse.userLatestPost.likes_count !== 1 ? 's' : ''}.</>
              : config.community_pulse.no_activity_cta || 'Faça seu primeiro post!'}
          </p>
          <button
            onClick={() => navigate('/comunidade')}
            style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontFamily: C.FONT, fontSize: 12, fontWeight: 700, color: C.BLUE, flexShrink: 0, marginLeft: 16 }}
            className="gjk-link-hover"
          >
            {pulse.userLatestPost ? 'Postar' : 'Participar'} <ArrowRight size={13} />
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SMART UPSELL
// ═══════════════════════════════════════════════════════════════════════════════
function UpsellSection({ insights, highlightedService, config }: {
  insights: CareerInsights | null;
  highlightedService: ReturnType<typeof useHighlightedService>['data'];
  config: HubDashboardConfig;
}) {
  const navigate = useNavigate();
  const { data: dimService } = useDimensionService(insights?.weakest?.key);
  const service = dimService || highlightedService;
  if (!service) return null;

  const isPersonalized = !!dimService && !!insights?.weakest;
  const headline = isPersonalized ? `Seu ${insights!.weakest!.label} pontuou ${insights!.weakest!.score}/${insights!.weakest!.maxScore}` : '';
  const subtitle = service.description ?? '';
  const socialProof = isPersonalized
    ? config.social_proof.dimension_cta[insights!.weakest!.key as keyof typeof config.social_proof.dimension_cta] ?? null
    : config.social_proof.general_upsell;

  const handleBuy = () => {
    const url = service.landing_page_url;
    if (url) {
      if (url.startsWith('/') || url.startsWith(window.location.origin)) {
        navigate(url.startsWith('/') ? url : new URL(url).pathname);
      } else window.open(url, '_blank');
    } else if (service.ticto_checkout_url) window.open(service.ticto_checkout_url, '_blank');
  };

  return (
    <div style={{ marginBottom: 48 }}>
      <div style={{
        position: 'relative', overflow: 'hidden', borderRadius: 24,
        background: `linear-gradient(135deg, rgba(96,165,250,0.10) 0%, rgba(167,139,250,0.08) 100%)`,
        backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
        border: '1px solid rgba(167,139,250,0.22)',
        boxShadow: '0 20px 64px rgba(0,0,0,0.50), inset 0 1px 0 rgba(255,255,255,0.12)',
        padding: 'clamp(24px,4vw,48px)',
      }}>
        <div aria-hidden style={{ position: 'absolute', top: -100, right: -80, width: 360, height: 360, background: `radial-gradient(circle, ${C.LAVENDER}18 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', bottom: -80, left: -60, width: 280, height: 280, background: `radial-gradient(circle, ${C.BLUE}12 0%, transparent 70%)`, borderRadius: '50%', pointerEvents: 'none' }} />
        <div aria-hidden style={{ position: 'absolute', top: 0, left: 40, right: 40, height: 1, background: `linear-gradient(90deg, transparent, ${C.BLUE}50, ${C.LAVENDER}50, transparent)` }} />

        <div className="gjk-upsell-grid" style={{ position: 'relative', zIndex: 1 }}>
          {/* Left: copy */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 7, width: 'fit-content', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', borderRadius: 100, padding: '5px 14px' }}>
              <Sparkles size={11} style={{ color: C.LAVENDER }} />
              <span style={{ fontFamily: C.FONT, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', color: C.LAVENDER, textTransform: 'uppercase' }}>
                Recomendado para você
              </span>
            </div>

            <div>
              {headline && <p style={{ fontFamily: C.FONT, fontSize: 12, color: C.LAVENDER, margin: '0 0 6px' }}>{headline}</p>}
              <h2 style={{ fontFamily: C.FONT, fontSize: 'clamp(22px,3.5vw,38px)', fontWeight: 800, letterSpacing: '-0.03em', color: C.T1, lineHeight: 1.2, margin: 0 }}>
                {service.name}
              </h2>
              <p style={{ fontFamily: C.FONT, fontSize: 13, color: C.T2, lineHeight: 1.65, maxWidth: 440, marginTop: 10, marginBottom: 0 }}>
                {subtitle}
              </p>
            </div>

            {socialProof && (
              <p style={{ fontFamily: C.FONT, fontSize: 12, color: C.T3, fontStyle: 'italic', borderLeft: `2px solid ${C.LAVENDER}40`, paddingLeft: 12, margin: 0 }}>
                {socialProof}
              </p>
            )}
          </div>

          {/* Right: price CTA */}
          <div style={{
            ...G.SUBTLE, borderRadius: 20, padding: '24px 22px',
            display: 'flex', flexDirection: 'column', gap: 14, textAlign: 'center',
          }}>
            <p style={{ fontFamily: C.FONT, fontSize: 9, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: C.T3, margin: 0 }}>
              {service.product_type === 'one_time' ? 'Investimento Único' : 'Investimento'}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, flexWrap: 'wrap' }}>
              {service.anchor_price && service.anchor_price > service.price && service.price > 0 && (
                <span style={{ fontFamily: C.FONT, fontSize: 15, color: C.T4, textDecoration: 'line-through' }}>
                  R$ {Math.floor(service.anchor_price)}
                </span>
              )}
              <span style={{ fontFamily: C.FONT, fontSize: 48, fontWeight: 800, color: C.T1, lineHeight: 1, letterSpacing: '-0.04em' }}>
                {service.price_display || Math.floor(service.price)}
              </span>
            </div>

            <button
              onClick={handleBuy}
              className="gjk-btn-hover"
              style={{
                width: '100%', padding: '13px 20px', borderRadius: 14, border: 'none', cursor: 'pointer', color: '#fff',
                background: `linear-gradient(135deg, ${C.BLUE}, ${C.LAVENDER})`,
                fontFamily: C.FONT, fontSize: 13, fontWeight: 700,
                boxShadow: `0 8px 24px ${C.BLUE}35`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
              }}
            >
              {service.cta_text || 'Agendar Sessão'} <Calendar size={14} />
            </button>

            <div style={{ display: 'flex', gap: 8, textAlign: 'left', background: `${C.EMERALD}0A`, border: `1px solid ${C.EMERALD}20`, borderRadius: 12, padding: '10px 12px' }}>
              <ShieldCheck size={14} style={{ color: C.EMERALD, flexShrink: 0, marginTop: 1 }} />
              <div>
                <p style={{ fontFamily: C.FONT, fontSize: 10, fontWeight: 700, color: C.EMERALD, margin: 0 }}>Risco Zero</p>
                <p style={{ fontFamily: C.FONT, fontSize: 10, color: `${C.EMERALD}90`, margin: '2px 0 0', lineHeight: 1.4 }}>
                  100% vira crédito se entrar na Mentoria em 7 dias.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// QUICK TOOLS
// ═══════════════════════════════════════════════════════════════════════════════
function ToolsSection({ config, remainingCredits }: { config: HubDashboardConfig; remainingCredits: number }) {
  const navigate = useNavigate();
  const tools = TOOLS.filter(t => config.quick_tools.includes(t.key));
  if (tools.length === 0) return null;

  return (
    <div style={{ marginBottom: 48 }}>
      <Heading>Ferramentas</Heading>
      <div className="gjk-tools-grid">
        {tools.map(tool => {
          const Icon = tool.icon;
          const stat = tool.getStat(remainingCredits);
          return (
            <button
              key={tool.key}
              onClick={() => navigate(tool.route)}
              className="gjk-card-hover"
              style={{
                ...G.CARD, padding: '18px 18px 16px',
                borderLeft: `3px solid ${tool.color}`,
                borderRadius: 18, textAlign: 'left', cursor: 'pointer',
                boxShadow: `${G.CARD.boxShadow}, 0 0 16px ${tool.color}0D`,
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 11, marginBottom: 12,
                background: `${tool.color}18`, border: `1px solid ${tool.color}30`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', color: tool.color,
              }}>
                <Icon size={18} />
              </div>
              <p style={{ fontFamily: C.FONT, fontSize: 13, fontWeight: 700, color: C.T1, margin: '0 0 3px' }}>{tool.label}</p>
              <p style={{ fontFamily: C.FONT, fontSize: 11, fontWeight: 500, color: tool.color, margin: 0 }}>{stat}</p>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SECONDARY SERVICES
// ═══════════════════════════════════════════════════════════════════════════════
function ServicesSection({ services, onAction }: {
  services: NonNullable<ReturnType<typeof useSecondaryServices>['data']>;
  onAction: (s: { landing_page_url?: string | null; ticto_checkout_url?: string | null; route?: string | null }) => void;
}) {
  const navigate = useNavigate();
  return (
    <div style={{ marginBottom: 48 }}>
      <Heading action={
        <button onClick={() => navigate('/catalogo')} className="gjk-link-hover" style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontFamily: C.FONT, fontSize: 11, fontWeight: 700, color: C.T3, padding: 0 }}>
          Ver todos <MoreHorizontal size={14} />
        </button>
      }>
        Outros Serviços
      </Heading>
      <div className="gjk-services-grid">
        {services.map(service => {
          const SIcon = (icons as Record<string, LucideIcon>)[service.icon_name] || icons.FileCheck;
          return (
            <div key={service.id} className="gjk-card-hover" style={{ ...G.CARD, padding: '20px 22px', display: 'flex', flexDirection: 'column' }}>
              <div style={{ width: 38, height: 38, borderRadius: 11, marginBottom: 12, background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: C.T3 }}>
                <SIcon size={18} />
              </div>
              <h4 style={{ fontFamily: C.FONT, fontSize: 13, fontWeight: 700, color: C.T1, margin: '0 0 6px' }}>{service.name}</h4>
              <p style={{ fontFamily: C.FONT, fontSize: 11, color: C.T3, lineHeight: 1.6, flex: 1, margin: '0 0 16px' }}>{service.description}</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.07)' }}>
                {service.price > 0 ? (
                  <PriceDisplay price={service.price} priceDisplay={service.price_display} anchorPrice={service.anchor_price} size="sm" />
                ) : (
                  <span style={{ fontFamily: C.FONT, fontSize: 11, fontWeight: 700, color: C.EMERALD }}>Grátis</span>
                )}
                <button
                  onClick={() => onAction(service)}
                  className="gjk-cta-hover"
                  style={{ borderRadius: 10, padding: '6px 13px', cursor: 'pointer', fontFamily: C.FONT, fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.10)', color: C.T3 }}
                >
                  {service.cta_text || 'CONTRATAR'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// GLOBAL CSS
// ═══════════════════════════════════════════════════════════════════════════════
const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&display=swap');

  @keyframes gjk-rise {
    from { opacity: 0; transform: translateY(18px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  @keyframes gjk-shimmer {
    from { background-position: -400px 0; }
    to   { background-position: 400px 0; }
  }

  .gjk-rise {
    opacity: 0;
    animation: gjk-rise 0.5s cubic-bezier(0.16,1,0.3,1) forwards;
  }

  .gjk-shimmer {
    background: linear-gradient(90deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.08) 50%, rgba(255,255,255,0.04) 100%) !important;
    background-size: 800px 100% !important;
    animation: gjk-shimmer 1.8s ease-in-out infinite;
  }

  .gjk-card-hover { transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease, border-color 0.18s ease; }
  .gjk-card-hover:hover {
    transform: translateY(-2px);
    background: rgba(255,255,255,0.11) !important;
    border-color: rgba(255,255,255,0.20) !important;
    box-shadow: 0 16px 40px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.18) !important;
  }

  .gjk-link-hover { transition: opacity 0.15s ease; }
  .gjk-link-hover:hover { opacity: 0.70; }

  .gjk-btn-hover { transition: transform 0.15s ease, box-shadow 0.15s ease; }
  .gjk-btn-hover:hover { transform: translateY(-1px) scale(1.015); }

  .gjk-cta-hover { transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease; }
  .gjk-cta-hover:hover { background: rgba(96,165,250,0.14) !important; border-color: rgba(96,165,250,0.28) !important; color: #60A5FA !important; }

  /* Responsive grids */
  .gjk-tools-grid   { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .gjk-journey-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 8px; }
  .gjk-services-grid{ display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .gjk-upsell-grid  { display: grid; grid-template-columns: minmax(0,3fr) minmax(0,2fr); gap: 36px; align-items: center; }

  @media (max-width: 860px) {
    .gjk-services-grid { grid-template-columns: repeat(2, 1fr); }
  }
  @media (max-width: 640px) {
    .gjk-tools-grid    { grid-template-columns: 1fr; }
    .gjk-journey-grid  { grid-template-columns: 1fr; }
    .gjk-upsell-grid   { grid-template-columns: 1fr; }
    .gjk-services-grid { grid-template-columns: 1fr; }
  }

  /* Custom scrollbar */
  .gjk-scroll::-webkit-scrollbar { width: 4px; }
  .gjk-scroll::-webkit-scrollbar-track { background: transparent; }
  .gjk-scroll::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.10); border-radius: 4px; }
  .gjk-scroll::-webkit-scrollbar-thumb:hover { background: rgba(255,255,255,0.18); }
`;

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN PAGE
// ═══════════════════════════════════════════════════════════════════════════════
export default function StudentHubGlass() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { quota } = useSubscription();
  const { data: hubConfig } = useHubDashboardConfig();
  const { data: careerInsights } = useCareerInsights();
  const { data: highlightedService } = useHighlightedService();
  const { data: secondaryServices } = useSecondaryServices();
  const { data: checklistItems } = useChecklistStatus();
  const { data: myHubSections } = useMyHub();

  const config = hubConfig ?? DEFAULT_CONFIG;
  const planName = quota?.planName || 'Básico';
  const remainingCredits = quota?.remaining ?? 1;
  const userName = user?.full_name?.split(' ')[0] || 'Usuário';

  const { data: communityPulse } = useCommunityPulse(config.community_pulse.trending_period_days);

  const smartStep = useSmartNextStep({
    insights: careerInsights ?? null,
    sections: myHubSections ?? null,
    checklistItems: checklistItems ?? null,
    communityPulse: communityPulse ?? null,
    config,
  });

  const goToService = (s: { landing_page_url?: string | null; ticto_checkout_url?: string | null; route?: string | null }) => {
    if (s.landing_page_url) {
      if (s.landing_page_url.startsWith('/')) { navigate(s.landing_page_url); return; }
      try {
        const p = new URL(s.landing_page_url);
        if (p.origin === window.location.origin) { navigate(p.pathname); return; }
      } catch { /* ignore */ }
      window.open(s.landing_page_url, '_blank');
    } else if (s.ticto_checkout_url) window.open(s.ticto_checkout_url, '_blank');
    else if (s.route) navigate(s.route);
    else navigate('/catalogo');
  };

  const renderSection = (id: HubDashboardSectionId, idx: number) => {
    if (!isSectionVisible(config, id)) return null;
    const delay = idx * 60;

    switch (id) {
      case 'career_hero':
        return (
          <Rise key={id} delay={delay}>
            <HeroSection config={config} insights={careerInsights ?? null} planName={planName} userName={userName} />
          </Rise>
        );
      case 'smart_next_step':
        return smartStep ? (
          <Rise key={id} delay={delay}>
            <NextStepCard step={smartStep} />
          </Rise>
        ) : null;
      case 'active_items':
        return (
          <Rise key={id} delay={delay}>
            <JourneySection />
          </Rise>
        );
      case 'career_dimensions':
        if (!careerInsights?.hasReport) return null;
        return (
          <Rise key={id} delay={delay}>
            <DimensionsSection insights={careerInsights} config={config} />
          </Rise>
        );
      case 'community_pulse':
        if (!communityPulse) return null;
        return (
          <Rise key={id} delay={delay}>
            <CommunitySection pulse={communityPulse} config={config} />
          </Rise>
        );
      case 'smart_upsell':
        return (
          <Rise key={id} delay={delay}>
            <UpsellSection insights={careerInsights ?? null} highlightedService={highlightedService ?? null} config={config} />
          </Rise>
        );
      case 'quick_tools':
        return (
          <Rise key={id} delay={delay}>
            <ToolsSection config={config} remainingCredits={remainingCredits} />
          </Rise>
        );
      case 'secondary_services':
        if (!secondaryServices || secondaryServices.length === 0) return null;
        return (
          <Rise key={id} delay={delay}>
            <ServicesSection services={secondaryServices} onAction={goToService} />
          </Rise>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <style>{CSS}</style>

      <DashboardLayout rootClassName="min-h-screen" contentClassName="">
        <div style={{ position: 'relative', minHeight: '100vh', background: `linear-gradient(150deg, ${C.BG1} 0%, ${C.BG2} 55%, #0D1030 100%)` }}>
          {/* 3 ambient orbs — Electric Indigo palette */}
          <Orb x="-6%"  y="5%"   color="rgba(96,165,250,0.20)"   size={580} />
          <Orb x="62%"  y="-3%"  color="rgba(167,139,250,0.16)"  size={520} />
          <Orb x="70%"  y="62%"  color="rgba(52,211,153,0.10)"   size={420} />

          <Grain />

          <div
            className="gjk-scroll"
            style={{
              maxWidth: 880,
              margin: '0 auto',
              padding: 'clamp(32px,4vw,52px) clamp(16px,3vw,32px) 100px',
              position: 'relative',
              zIndex: 1,
            }}
          >
            {config.sections_order.map((id, i) => renderSection(id, i))}
          </div>
        </div>
      </DashboardLayout>
    </>
  );
}
