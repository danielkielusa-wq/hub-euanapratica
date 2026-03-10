import { useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function EmailUnsubscribed() {
  const [params] = useSearchParams();
  const isError = params.get('error') === '1';

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="bg-white rounded-3xl shadow-lg p-12 max-w-md w-full text-center space-y-4">
        {isError ? (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-red-50 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Link inválido</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Este link de cancelamento não é válido ou já expirou.
            </p>
          </>
        ) : (
          <>
            <div className="mx-auto w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-500" />
            </div>
            <h1 className="text-xl font-bold text-slate-900">Inscrição cancelada</h1>
            <p className="text-slate-500 text-sm leading-relaxed">
              Você não receberá mais emails de campanhas da EUA na Prática.
            </p>
          </>
        )}
        <div className="pt-4">
          <a
            href="https://hub.euanapratica.com"
            className="text-sm text-blue-600 hover:underline"
          >
            Ir para o Hub
          </a>
        </div>
        <p className="text-xs text-slate-300 pt-2">&copy; EUA na Prática</p>
      </div>
    </div>
  );
}
