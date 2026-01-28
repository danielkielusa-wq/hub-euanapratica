import { useForm } from 'react-hook-form';
import { useEffect } from 'react';
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
import { Loader2, Tag, Palette, CreditCard, MousePointerClick } from 'lucide-react';
import { IconSelector } from './IconSelector';
import { ServiceTypeSelector } from './ServiceTypeSelector';
import { HubService, RIBBON_OPTIONS, PRODUCT_TYPE_LABELS, ProductType, ServiceStatus } from '@/types/hub';

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
  // Ticto fields
  ticto_product_id: z.string().optional(),
  ticto_checkout_url: z.string().url().optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

interface HubServiceFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  service?: HubService | null;
  onSubmit: (data: FormData) => void;
  isSubmitting: boolean;
}

export function HubServiceForm({
  open,
  onOpenChange,
  service,
  onSubmit,
  isSubmitting,
}: HubServiceFormProps) {
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
      ticto_product_id: '',
      ticto_checkout_url: '',
    },
  });

  // Reset form when service changes (e.g., editing a different service)
  useEffect(() => {
    if (open) {
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
        ticto_product_id: service?.ticto_product_id || '',
        ticto_checkout_url: service?.ticto_checkout_url || '',
      });
    }
  }, [service, open, form]);

  const handleSubmit = (data: FormData) => {
    onSubmit(data);
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
                      <FormLabel>Rota Interna</FormLabel>
                      <FormControl>
                        <Input placeholder="/curriculo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="redirect_url"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>URL de Redirecionamento</FormLabel>
                    <FormControl>
                      <Input placeholder="https://..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

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
