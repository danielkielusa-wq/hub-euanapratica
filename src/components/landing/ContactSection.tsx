import { useState } from 'react';
import { Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export default function ContactSection() {
  const [sending, setSending] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', message: '' });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSending(true);
    try {
      const { error } = await supabase.functions.invoke('send-contact-form', {
        body: form,
      });
      if (error) throw error;
      toast.success('Mensagem enviada! Retornaremos em breve.');
      setForm({ name: '', email: '', message: '' });
    } catch (err) {
      console.error('Contact form error:', err);
      toast.error('Erro ao enviar mensagem. Tente novamente.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section id="landingContact" className="py-12 md:py-20 lg:py-24 bg-gray-50/50">
      <div className="container mx-auto max-w-7xl px-4">
        <div className="text-center mb-4">
          <span className="inline-block rounded-md bg-landing-primary/10 px-3 py-1 text-sm font-medium text-landing-primary">
            Contato
          </span>
        </div>
        <h4 className="text-center text-2xl md:text-3xl font-bold mb-1">
          <span className="relative font-extrabold z-10">
            Vamos trabalhar
            <img
              src="/images/landing/icons/section-title-icon.png"
              alt=""
              className="absolute bottom-0 left-0 right-0 -z-10 object-contain w-full"
            />
          </span>
          {' '}juntos
        </h4>
        <p className="text-center text-gray-500 mb-12 pb-0 md:pb-4">
          Alguma dúvida ou sugestão? Envie-nos uma mensagem.
        </p>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left: Image + Contact Info */}
          <div className="lg:col-span-5">
            <div className="relative border border-gray-200 rounded-lg p-2 h-full bg-white">
              <img
                src="/images/landing/icons/contact-border.png"
                alt=""
                className="hidden lg:block absolute -top-4 -right-4 w-16"
              />
              <img
                src="/images/landing/landing-page/contact-customer-service.png"
                alt="Atendimento"
                className="w-full rounded-md"
              />
              <div className="p-4 pb-2">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-md bg-landing-primary/10">
                    <Mail className="h-5 w-5 text-landing-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 mb-0">Email</p>
                    <a href="mailto:contato@euanapratica.com" className="text-sm font-semibold hover:text-landing-primary">
                      contato@euanapratica.com
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Form */}
          <div className="lg:col-span-7">
            <div className="bg-white rounded-lg border border-gray-200 p-6 h-full">
              <h4 className="text-lg font-semibold mb-2">Envie uma mensagem</h4>
              <p className="text-sm text-gray-500 mb-6">
                Se você tem dúvidas sobre a plataforma, planos, parcerias
                <br className="hidden lg:block" />
                ou quer saber mais, estamos aqui para ajudar.
              </p>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">Nome Completo</label>
                    <input
                      type="text"
                      name="name"
                      value={form.name}
                      onChange={handleChange}
                      required
                      className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-landing-primary/20 focus:border-landing-primary"
                      placeholder="Seu nome"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">Email</label>
                    <input
                      type="email"
                      name="email"
                      value={form.email}
                      onChange={handleChange}
                      required
                      className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-landing-primary/20 focus:border-landing-primary"
                      placeholder="seu@email.com"
                    />
                  </div>
                </div>
                <div className="mb-4">
                  <label className="text-sm font-medium mb-1 block">Mensagem</label>
                  <textarea
                    name="message"
                    value={form.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full rounded-md border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-landing-primary/20 focus:border-landing-primary"
                    placeholder="Escreva sua mensagem"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={sending}
                  className="bg-landing-primary hover:bg-landing-primary-dark text-white"
                >
                  {sending ? 'Enviando...' : 'Enviar mensagem'}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
