import { useForm, useFieldArray } from 'react-hook-form';
import { useEffect, useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Loader2, Tag, Palette, CreditCard, MousePointerClick, ExternalLink, ChevronDown, Layout, Plus, Trash2, Sparkles } from 'lucide-react';
import { IconSelector } from './IconSelector';
import { ServiceTypeSelector } from './ServiceTypeSelector';
import { HubService, ServiceLandingPageData, RIBBON_OPTIONS, PRODUCT_TYPE_LABELS, ProductType, ServiceStatus } from '@/types/hub';

const ICON_OPTIONS = [
  'Briefcase', 'Globe', 'Users', 'MapPin', 'Target',
  'TrendingUp', 'Award', 'Zap', 'CheckCircle2', 'ShieldCheck',
];

const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().max(160, 'Máximo 160 caracteres').optional(),
  icon_name: z.string().default('FileCheck'),
  status: z.enum(['available', 'premium', 'coming_soon']),
  service_type: z.enum(['ai_tool', 'live_mentoring', 'recorded_course', 'consulting']),
  ribbon: z.string().nullable(),
  category: z.string().optional(),
  route: z.string().optional(),
  redirect_url: z.string().optional(),
  cta_text: z.string().default('Acessar Agora'),
  is_visible_in_hub: z.boolean().default(true),
  is_highlighted: z.boolean().default(false),
  display_order: z.number().default(0),
  price: z.number().min(0).default(0),
  price_display: z.string().optional(),
  currency: z.string().default('BRL'),
  product_type: z.enum(['one_time', 'lifetime', 'subscription_monthly', 'subscription_annual']),
  stripe_price_id: z.string().optional(),
  accent_color: z.string().optional(),
  landing_page_url: z.string().optional(),
  // Ticto fields
  ticto_product_id: z.string().optional(),
  ticto_checkout_url: z.string().url().optional().or(z.literal('')),
  // Landing page fields
  duration: z.string().optional(),
  meeting_type: z.string().optional(),
  // Hero
  hero_subtitle: z.string().optional(),
  hero_tagline: z.string().optional(),
  // Mentor
  mentor_name: z.string().optional(),
  mentor_initials: z.string().max(3).optional(),
  mentor_title: z.string().optional(),
  mentor_quote: z.string().optional(),
  // Benefits section
  benefits_section_title: z.string().optional(),
  benefits_section_description: z.string().optional(),
  // Benefits (array)
  benefits: z.array(z.object({
    icon: z.string(),
    title: z.string(),
    description: z.string(),
  })).optional(),
  // Target audience (array)
  target_audience: z.array(z.object({
    title: z.string(),
    description: z.string(),
  })).optional(),
  // FAQ
  faq_title: z.string().optional(),
  faq_description: z.string().optional(),
  // Upsell fields
  keywords: z.array(z.string()).default([]),
  target_tier: z.string().default('all'),
  is_visible_for_upsell: z.boolean().default(true),
});

type FormData = z.infer<typeof formSchema>;

export interface HubServiceFormSubmitData {
  name: string;
  description?: string;
  icon_name: string;
  status: string;
  service_type: string;
  ribbon: string | null;
  category?: string;
  route?: string;
  redirect_url?: string;
  cta_text: string;
  is_visible_in_hub: boolean;
  is_highlighted: boolean;
  display_order: number;
  price: number;
  price_display?: string;
  currency: string;
  product_type: string;
  stripe_price_id?: string;
  accent_color?: string;
  landing_page_url?: string;
  ticto_product_id?: string;
  ticto_checkout_url?: string;
  duration?: string;
  meeting_type?: string;
  landing_page_data: ServiceLandingPageData | null;
  keywords?: string[];
  target_tier?: string;
  is_visible_for_upsell?: boolean;
}

interface HubServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: HubService | null;
  onSubmit: (data: HubServiceFormSubmitData) => void;
  isSubmitting: boolean;
}

function buildLandingPageData(data: FormData): ServiceLandingPageData | null {
  const hasHero = data.hero_subtitle || data.hero_tagline;
  const hasMentor = data.mentor_name;
  const hasBenefitsSection = data.benefits_section_title || data.benefits_section_description;
  const hasBenefits = data.benefits && data.benefits.length > 0 && data.benefits.some(b => b.title);
  const hasAudience = data.target_audience && data.target_audience.length > 0 && data.target_audience.some(a => a.title);
  const hasFaq = data.faq_title || data.faq_description;

  if (!hasHero && !hasMentor && !hasBenefitsSection && !hasBenefits && !hasAudience && !hasFaq) {
    return null;
  }

  const result: ServiceLandingPageData = {};

  if (hasHero) {
    result.hero = {};
    if (data.hero_subtitle) result.hero.subtitle = data.hero_subtitle;
    if (data.hero_tagline) result.hero.tagline = data.hero_tagline;
  }

  if (hasMentor && data.mentor_name) {
    result.mentor = {
      name: data.mentor_name,
      initials: data.mentor_initials || data.mentor_name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2),
      title: data.mentor_title || '',
    };
    if (data.mentor_quote) result.mentor.quote = data.mentor_quote;
  }

  if (hasBenefitsSection) {
    result.benefits_section = {};
    if (data.benefits_section_title) result.benefits_section.title = data.benefits_section_title;
    if (data.benefits_section_description) result.benefits_section.description = data.benefits_section_description;
  }

  if (hasBenefits && data.benefits) {
    result.benefits = data.benefits.filter(b => b.title);
  }

  if (hasAudience && data.target_audience) {
    result.target_audience = data.target_audience.filter(a => a.title);
  }

  if (hasFaq) {
    result.faq_section = {
      title: data.faq_title || '',
      description: data.faq_description || '',
    };
  }

  return result;
}

export function HubServiceForm({
  open,
  onOpenChange,
  service,
  onSubmit,
  isSubmitting,
}: HubServiceFormProps) {
  const [landingPageOpen, setLandingPageOpen] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      icon_name: 'FileCheck',
      status: 'available',
      service_type: 'ai_tool',
      ribbon: null,
      category: '',
      route: '',
      redirect_url: '',
      cta_text: 'Acessar Agora',
      is_visible_in_hub: true,
      is_highlighted: false,
      display_order: 0,
      price: 0,
      price_display: '',
      currency: 'BRL',
      product_type: 'one_time',
      stripe_price_id: '',
      accent_color: '',
      landing_page_url: '',
      ticto_product_id: '',
      ticto_checkout_url: '',
      duration: '',
      meeting_type: '',
      hero_subtitle: '',
      hero_tagline: '',
      mentor_name: '',
      mentor_initials: '',
      mentor_title: '',
      mentor_quote: '',
      benefits_section_title: '',
      benefits_section_description: '',
      benefits: [],
      target_audience: [],
      faq_title: '',
      faq_description: '',
      keywords: [],
      target_tier: 'all',
      is_visible_for_upsell: true,
    },
  });

  const {
    fields: benefitFields,
    append: appendBenefit,
    remove: removeBenefit,
  } = useFieldArray({ control: form.control, name: 'benefits' });

  const {
    fields: audienceFields,
    append: appendAudience,
    remove: removeAudience,
  } = useFieldArray({ control: form.control, name: 'target_audience' });

  // Reset form when service changes
  useEffect(() => {
    if (open) {
      const lp = service?.landing_page_data;
      const hasLandingData = !!(lp || service?.duration || service?.meeting_type);

      form.reset({
        name: service?.name || '',
        description: service?.description || '',
        icon_name: service?.icon_name || 'FileCheck',
        status: (service?.status as ServiceStatus) || 'available',
        service_type: service?.service_type || 'ai_tool',
        ribbon: service?.ribbon || null,
        category: service?.category || '',
        route: service?.route || '',
        redirect_url: service?.redirect_url || '',
        cta_text: service?.cta_text || 'Acessar Agora',
        is_visible_in_hub: service?.is_visible_in_hub ?? true,
        is_highlighted: service?.is_highlighted ?? false,
        display_order: service?.display_order || 0,
        price: service?.price || 0,
        price_display: service?.price_display || '',
        currency: service?.currency || 'BRL',
        product_type: (service?.product_type as ProductType) || 'one_time',
        stripe_price_id: service?.stripe_price_id || '',
        accent_color: service?.accent_color || '',
        landing_page_url: service?.landing_page_url || '',
        ticto_product_id: service?.ticto_product_id || '',
        ticto_checkout_url: service?.ticto_checkout_url || '',
        duration: service?.duration || '',
        meeting_type: service?.meeting_type || '',
        hero_subtitle: lp?.hero?.subtitle || '',
        hero_tagline: lp?.hero?.tagline || '',
        mentor_name: lp?.mentor?.name || '',
        mentor_initials: lp?.mentor?.initials || '',
        mentor_title: lp?.mentor?.title || '',
        mentor_quote: lp?.mentor?.quote || '',
        benefits_section_title: lp?.benefits_section?.title || '',
        benefits_section_description: lp?.benefits_section?.description || '',
        benefits: lp?.benefits || [],
        target_audience: lp?.target_audience || [],
        faq_title: lp?.faq_section?.title || '',
        faq_description: lp?.faq_section?.description || '',
        keywords: service?.keywords || [],
        target_tier: service?.target_tier || 'all',
        is_visible_for_upsell: service?.is_visible_for_upsell ?? true,
      });

      setLandingPageOpen(hasLandingData);
    }
  }, [service, open, form]);

  const handleSubmit = (data: FormData) => {
    const landingPageData = buildLandingPageData(data);

    onSubmit({
      name: data.name,
      description: data.description,
      icon_name: data.icon_name,
      status: data.status,
      service_type: data.service_type,
      ribbon: data.ribbon || null,
      category: data.category,
      route: data.route,
      redirect_url: data.redirect_url,
      cta_text: data.cta_text,
      is_visible_in_hub: data.is_visible_in_hub,
      is_highlighted: data.is_highlighted,
      display_order: data.display_order,
      price: data.price,
      price_display: data.price_display,
      currency: data.currency,
      product_type: data.product_type,
      stripe_price_id: data.stripe_price_id,
      accent_color: data.accent_color,
      landing_page_url: data.landing_page_url || (data.route ? `/servicos/${data.route}` : null),
      ticto_product_id: data.ticto_product_id,
      ticto_checkout_url: data.ticto_checkout_url,
      duration: data.duration,
      meeting_type: data.meeting_type,
      landing_page_data: landingPageData,
      keywords: data.keywords,
      target_tier: data.target_tier,
      is_visible_for_upsell: data.is_visible_for_upsell,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold">
            {service ? 'Editar Produto' : 'Novo Produto'}
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Defina regras de acesso, precificação e como o serviço aparece no Hub.
          </p>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
            {/* Section 1: Identity */}
            <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Tag className="h-4 w-4" />
                IDENTIDADE & VISIBILIDADE
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nome do Produto *</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: Mentoria Elite Track" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ribbon"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fita de Destaque</FormLabel>
                      <Select
                        value={field.value || ''}
                        onValueChange={(v) => field.onChange(v || null)}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {RIBBON_OPTIONS.map((opt) => (
                            <SelectItem key={opt.value} value={opt.value || 'none'}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição no Hub</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Texto curto que aparecerá no card do serviço..."
                        className="resize-none"
                        rows={2}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: CARREIRA, IMERSÃO" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 2: Visual */}
            <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <Palette className="h-4 w-4" />
                TIPO & VISUAL
              </div>

              <div className="grid grid-cols-2 gap-6">
                <FormField
                  control={form.control}
                  name="service_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <ServiceTypeSelector
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="icon_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <IconSelector
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <FormField
                  control={form.control}
                  name="is_highlighted"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Destacar no Hub</FormLabel>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="is_visible_in_hub"
                  render={({ field }) => (
                    <FormItem className="flex items-center gap-3">
                      <FormControl>
                        <Switch
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <FormLabel className="!mt-0">Visível no Hub</FormLabel>
                    </FormItem>
                  )}
                />
              </div>
            </div>

            {/* Section 3: Pricing & Ticto */}
            <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <CreditCard className="h-4 w-4" />
                PRECIFICAÇÃO & TICTO
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="product_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Modelo de Cobrança</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {Object.entries(PRODUCT_TYPE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status</FormLabel>
                      <Select value={field.value} onValueChange={field.onChange}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="available">Disponível</SelectItem>
                          <SelectItem value="premium">Premium (Requer Compra)</SelectItem>
                          <SelectItem value="coming_soon">Em Breve</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preço (R$)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="display_order"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ordem</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="ticto_product_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ticto Product ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="PROD_abc123"
                          className="font-mono text-xs"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="ticto_checkout_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Ticto Checkout URL</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="https://pay.ticto.com.br/..."
                        className="font-mono text-xs"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price_display"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Texto de Preço (Opcional)</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: R$ 97 à vista ou A partir de R$ 197" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 4: Conversion */}
            <div className="space-y-4 rounded-xl border bg-muted/30 p-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                <MousePointerClick className="h-4 w-4" />
                CONVERSÃO & CHECKOUT
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="cta_text"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Texto do Botão (CTA)</FormLabel>
                      <FormControl>
                        <Input placeholder="Acessar Agora" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="route"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Slug (Landing Page)</FormLabel>
                      <FormControl>
                        <Input placeholder="rota-eua-45min" {...field} />
                      </FormControl>
                      <p className="text-[11px] text-muted-foreground">
                        Usado na URL: /servicos/<strong>{field.value || 'slug'}</strong>
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="landing_page_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL da Landing Page</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="/servicos/meu-servico" {...field} className="flex-1" />
                      </FormControl>
                      {field.value && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(field.value, '_blank')}
                          title="Abrir URL em nova aba"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">
                      Página de apresentação do produto. Ex: /servicos/rota-eua-45min
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="redirect_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de Redirecionamento (Fallback)</FormLabel>
                    <div className="flex gap-2">
                      <FormControl>
                        <Input placeholder="https://..." {...field} className="flex-1" />
                      </FormControl>
                      {field.value && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => window.open(field.value, '_blank')}
                          title="Abrir URL em nova aba"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 5: Upsell Contextual */}
            <div className="rounded-xl border bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
                <span className="text-sm font-semibold text-indigo-900">UPSELL CONTEXTUAL</span>
              </div>
              <p className="text-[11px] text-muted-foreground">
                Configure como este serviço pode ser sugerido automaticamente na comunidade
              </p>

              <FormField
                control={form.control}
                name="is_visible_for_upsell"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border bg-white p-3">
                    <div className="space-y-0.5">
                      <FormLabel className="text-sm">Visível para Upsell</FormLabel>
                      <p className="text-[11px] text-muted-foreground">
                        Permite que este serviço seja sugerido via IA na comunidade
                      </p>
                    </div>
                    <FormControl>
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    </FormControl>
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="keywords"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Keywords (separadas por vírgula)</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: entrevista, nervoso, medo, ansiedade, interview"
                        value={Array.isArray(field.value) ? field.value.join(', ') : field.value || ''}
                        onChange={(e) => {
                          // Store as string while typing, convert to array on blur
                          field.onChange(e.target.value);
                        }}
                        onBlur={(e) => {
                          // Convert to array when user finishes editing
                          const keywords = e.target.value
                            .split(',')
                            .map(k => k.trim())
                            .filter(k => k.length > 0);
                          field.onChange(keywords);
                        }}
                        className="min-h-[80px] bg-white"
                      />
                    </FormControl>
                    <p className="text-[11px] text-muted-foreground">
                      Palavras-chave para pre-filtro antes de chamar a IA. Economiza custos!
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="target_tier"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tier Alvo</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <FormControl>
                        <SelectTrigger className="bg-white">
                          <SelectValue placeholder="Selecione o tier" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="all">Todos</SelectItem>
                        <SelectItem value="basic">Basic</SelectItem>
                        <SelectItem value="premium">Premium</SelectItem>
                        <SelectItem value="vip">VIP</SelectItem>
                      </SelectContent>
                    </Select>
                    <p className="text-[11px] text-muted-foreground">
                      Define para qual plano de assinatura este serviço será sugerido
                    </p>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Section 6: Landing Page Data */}
            <Collapsible open={landingPageOpen} onOpenChange={setLandingPageOpen}>
              <div className="rounded-xl border bg-muted/30">
                <CollapsibleTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center justify-between w-full p-4 text-left hover:bg-muted/50 transition-colors rounded-xl"
                  >
                    <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                      <Layout className="h-4 w-4" />
                      LANDING PAGE (Conteúdo Dinâmico)
                    </div>
                    <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${landingPageOpen ? 'rotate-180' : ''}`} />
                  </button>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="space-y-6 p-4 pt-0">
                    <p className="text-[11px] text-muted-foreground">
                      Configure o conteúdo que aparece na landing page do serviço (/servicos/slug).
                    </p>

                    {/* Duration & Meeting Type */}
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="duration"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duração</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: 45 Minutos" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="meeting_type"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Reunião</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Google Meet" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Hero */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Hero</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="hero_tagline"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tagline (Badge)</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: CONSULTORIA INDIVIDUAL" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="hero_subtitle"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Subtítulo (Texto Gradiente)</FormLabel>
                              <FormControl>
                                <Input placeholder="Ex: Carreira nos EUA" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    {/* Mentor */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Mentor</h4>
                      <div className="grid grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="mentor_name"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Nome</FormLabel>
                              <FormControl>
                                <Input placeholder="Daniel Kiel" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mentor_initials"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Iniciais</FormLabel>
                              <FormControl>
                                <Input placeholder="DK" maxLength={3} {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="mentor_title"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Cargo</FormLabel>
                              <FormControl>
                                <Input placeholder="Mentor & Strategist" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="mentor_quote"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Citação</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Frase inspiradora do mentor..."
                                className="resize-none"
                                rows={2}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Benefits Section Header */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Seção de Benefícios (Cabeçalho)</h4>
                      <FormField
                        control={form.control}
                        name="benefits_section_title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título da Seção</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: O que você vai descobrir nesta sessão?" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="benefits_section_description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Descrição da Seção</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Ex: Muitos profissionais perdem anos (e milhares de dólares) tentando imigrar da forma errada..."
                                className="resize-none"
                                rows={3}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {/* Benefits */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Benefícios (Itens)</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendBenefit({ icon: 'Target', title: '', description: '' })}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Adicionar
                        </Button>
                      </div>
                      {benefitFields.map((field, index) => (
                        <div key={field.id} className="flex gap-3 items-start p-3 rounded-lg bg-background border">
                          <div className="flex-1 space-y-2">
                            <div className="grid grid-cols-[100px_1fr] gap-2">
                              <FormField
                                control={form.control}
                                name={`benefits.${index}.icon`}
                                render={({ field }) => (
                                  <FormItem>
                                    <Select value={field.value} onValueChange={field.onChange}>
                                      <FormControl>
                                        <SelectTrigger className="text-xs">
                                          <SelectValue />
                                        </SelectTrigger>
                                      </FormControl>
                                      <SelectContent>
                                        {ICON_OPTIONS.map((icon) => (
                                          <SelectItem key={icon} value={icon}>
                                            {icon}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </FormItem>
                                )}
                              />
                              <FormField
                                control={form.control}
                                name={`benefits.${index}.title`}
                                render={({ field }) => (
                                  <FormItem>
                                    <FormControl>
                                      <Input placeholder="Título do benefício" className="text-sm" {...field} />
                                    </FormControl>
                                  </FormItem>
                                )}
                              />
                            </div>
                            <FormField
                              control={form.control}
                              name={`benefits.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Descrição do benefício" className="text-xs" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-8 w-8 text-destructive"
                            onClick={() => removeBenefit(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {benefitFields.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                          Nenhum benefício adicionado
                        </p>
                      )}
                    </div>

                    {/* Target Audience */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Público-Alvo</h4>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => appendAudience({ title: '', description: '' })}
                        >
                          <Plus className="h-3 w-3 mr-1" /> Adicionar
                        </Button>
                      </div>
                      {audienceFields.map((field, index) => (
                        <div key={field.id} className="flex gap-3 items-start p-3 rounded-lg bg-background border">
                          <div className="flex-1 space-y-2">
                            <FormField
                              control={form.control}
                              name={`target_audience.${index}.title`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Ex: Exploradores" className="text-sm" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                            <FormField
                              control={form.control}
                              name={`target_audience.${index}.description`}
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input placeholder="Descrição do perfil" className="text-xs" {...field} />
                                  </FormControl>
                                </FormItem>
                              )}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="shrink-0 h-8 w-8 text-destructive"
                            onClick={() => removeAudience(index)}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      ))}
                      {audienceFields.length === 0 && (
                        <p className="text-xs text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                          Nenhum público-alvo adicionado
                        </p>
                      )}
                    </div>

                    {/* FAQ Section */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">FAQ / Dúvidas</h4>
                      <FormField
                        control={form.control}
                        name="faq_title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título</FormLabel>
                            <FormControl>
                              <Input placeholder="Ex: Dúvidas Frequentes" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="faq_description"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Conteúdo (aceita HTML)</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder='"Preciso ter inglês fluente?" — Traga todas essas perguntas...'
                                className="resize-none font-mono text-xs"
                                rows={4}
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {service ? 'Salvar Alterações' : 'Criar Produto'}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
