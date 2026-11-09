import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthModal } from '../components/AuthModal';
import { Lock, ShieldAlert, UserCheck } from 'lucide-react';

/**
 * AuthGuard: Blocks access to protected routes (like Checkout or MyOrders)
 * If not authenticated, displays authentication modal/fallback preserving redirect intent
 */
export function AuthGuard({ children, fallbackMessage, intent = 'checkout', allowGuest = false }) {
  const { currentUser, loading, setRedirectIntent } = useAuth();
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [guestBypass, setGuestBypass] = useState(false);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-[#e0141f] border-t-transparent animate-spin rounded-full" />
        <span className="font-mono text-xs text-[#ffb4ab] tracking-widest uppercase">
          VERIFICANDO CREDENCIALES KUROPUNK...
        </span>
      </div>
    );
  }

  if (!currentUser && !guestBypass) {
    return (
      <div className="max-w-lg mx-auto my-12 p-8 bg-[#141313] border-2 border-[#e0141f] shadow-[0_0_30px_rgba(224,20,31,0.2)]">
        <div className="flex items-center space-x-3 border-b border-[#5e3f3c] pb-4 mb-6">
          <Lock className="w-6 h-6 text-[#e0141f]" />
          <div>
            <h2 className="font-headline-md text-2xl text-[#fff4f3] uppercase tracking-wider">
              AUTENTICACIÓN REQUERIDA
            </h2>
            <p className="font-mono text-xs text-[#ffb4ab]">
              PROTOCOLO DE SEGURIDAD // KUROPUNK ACCESS CONTROL
            </p>
          </div>
        </div>

        <p className="font-body-md text-sm text-[#e6e1e1] mb-6 leading-relaxed">
          {fallbackMessage ||
            'Para continuar con tu compra o ver tus pedidos en tiempo real, inicia sesión con tu cuenta o regístrate en un clic.'}
        </p>

        <div className="space-y-3">
          <button
            onClick={() => {
              setRedirectIntent(intent);
              setIsAuthModalOpen(true);
            }}
            className="w-full py-3.5 bg-[#e0141f] hover:bg-[#ff1f2d] text-white font-headline-md text-lg uppercase tracking-wider transition-all duration-200 shadow-md flex items-center justify-center space-x-2"
          >
            <UserCheck className="w-5 h-5" />
            <span>INICIAR SESIÓN / REGISTRARME</span>
          </button>

          {allowGuest && (
            <button
              onClick={() => setGuestBypass(true)}
              className="w-full py-3 bg-neutral-900 hover:bg-neutral-800 text-[#ffb4ab] border border-[#5e3f3c] hover:border-[#ffb4ab] font-mono text-xs uppercase tracking-widest transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <span>⚡ CONTINUAR COMO INVITADO (PAGO CONTRAENTREGA DIRECTO)</span>
            </button>
          )}
        </div>

        <AuthModal
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
          defaultIntent={intent}
        />
      </div>
    );
  }

  return children;
}
