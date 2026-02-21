import { ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layouts/DashboardLayout';
import { Button } from '@/components/ui/button';

export default function SubscriptionTerms() {
  const navigate = useNavigate();

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-muted/30 p-6 md:p-8">
        <div className="max-w-3xl mx-auto animate-fade-in">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="mb-6 gap-2 text-muted-foreground"
          >
            <ArrowLeft className="w-4 h-4" />
            Voltar
          </Button>

          <div className="bg-card border border-border rounded-[32px] p-8 md:p-12 shadow-sm">
            <h1 className="text-3xl font-black text-foreground tracking-tight mb-2">
              Termos de Assinatura
            </h1>
            <p className="text-sm text-muted-foreground mb-8">
              Última atualização: Fevereiro de 2026
            </p>

            <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">
              <section>
                <h2 className="text-lg font-bold text-foreground">1. Planos e Preços</h2>
                <p>
                  A plataforma EUA na Prática oferece três níveis de assinatura: Básico (gratuito),
                  Pro (R$ 47/mês ou R$ 470/ano) e VIP (R$ 97/mês ou R$ 970/ano). Os preços podem
                  ser atualizados com aviso prévio de 30 dias. Alterações de preço não afetam
                  ciclos de cobrança já em vigor.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground">2. Cobrança e Renovação</h2>
                <p>
                  As assinaturas são cobradas automaticamente no início de cada ciclo (mensal ou anual),
                  utilizando o método de pagamento cadastrado na plataforma Ticto. A renovação é
                  automática até que o cancelamento seja solicitado.
                </p>
                <p>
                  Pagamentos via Pix e Boleto podem levar até 3 dias úteis para confirmação.
                  O acesso ao plano será ativado após a confirmação do pagamento.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground">3. Período de Teste</h2>
                <p>
                  Quando disponível, o período de teste gratuito permite acesso completo aos recursos
                  do plano selecionado. Ao final do período, a cobrança será iniciada automaticamente,
                  salvo cancelamento prévio.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground">4. Cancelamento</h2>
                <p>
                  Você pode cancelar sua assinatura a qualquer momento pela plataforma.
                  Após o cancelamento:
                </p>
                <ul className="list-disc pl-6 space-y-1">
                  <li>
                    Você mantém acesso aos recursos do plano até o final do período já pago.
                  </li>
                  <li>
                    Não haverá novas cobranças após o cancelamento.
                  </li>
                  <li>
                    Ao final do período, sua conta será automaticamente migrada para o plano Básico.
                  </li>
                </ul>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground">5. Reembolso</h2>
                <p>
                  Solicitações de reembolso são aceitas dentro de 7 dias corridos após a cobrança,
                  conforme o Código de Defesa do Consumidor. Para solicitar reembolso, entre em
                  contato com nosso suporte. Reembolsos são processados pela Ticto e podem levar
                  até 10 dias úteis.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground">6. Alteração de Plano</h2>
                <p>
                  Upgrades (ex: Básico → Pro, Pro → VIP) têm efeito imediato. O novo valor será
                  cobrado a partir do próximo ciclo. Downgrades têm efeito ao final do período
                  atual — você mantém o acesso ao plano superior até o fim do período pago.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground">7. Falha no Pagamento</h2>
                <p>
                  Em caso de falha na cobrança, tentaremos processar o pagamento novamente.
                  Durante este período, você mantém acesso aos recursos do plano. Se o pagamento
                  não for regularizado em até 10 dias, sua assinatura será cancelada e a conta
                  migrada para o plano Básico.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground">8. Processamento de Pagamento</h2>
                <p>
                  Todos os pagamentos são processados pela Ticto, plataforma de pagamentos parceira.
                  Métodos aceitos: cartão de crédito, Pix e boleto bancário. Seus dados financeiros
                  não são armazenados em nossos servidores.
                </p>
              </section>

              <section>
                <h2 className="text-lg font-bold text-foreground">9. Contato</h2>
                <p>
                  Para dúvidas sobre sua assinatura, entre em contato pelo suporte da plataforma
                  ou pelo email contato@euanapratica.com.
                </p>
              </section>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
