import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, KeyRound, ArrowLeft } from 'lucide-react';

/**
 * AdminGuard: Restricts route access strictly to users with role === 'admin' (Custom Claims)
 */
export function AdminGuard({ children, onBackToShop }) {
  const { currentUser, isAdmin, loading, setDemoSession } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <div className="w-10 h-10 border-2 border-[#e0141f] border-t-transparent animate-spin rounded-full" />
        <span className="font-mono text-xs text-[#ffb4ab] tracking-widest uppercase">
          VALIDANDO PRIVILEGIOS ADMINISTRATIVOS...
        </span>
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    return (
      <div className="max-w-xl mx-auto my-16 p-8 bg-[#141313] border-2 border-[#e0141f] shadow-[0_0_40px_rgba(224,20,31,0.25)]">
        <div className="flex items-center space-x-3 border-b border-[#5e3f3c] pb-4 mb-6">
          <ShieldAlert className="w-8 h-8 text-[#e0141f]" />
          <div>
            <h2 className="font-headline-md text-3xl text-[#fff4f3] uppercase tracking-wider">
              403 // ACCESO DENEGADO
            </h2>
            <p className="font-mono text-xs text-[#ffb4ab]">
              REQUERIMIENTO RBAC: ROLE == 'ADMIN' / CUSTOM CLAIM
            </p>
          </div>
        </div>

        <p className="font-body-md text-sm text-[#e6e1e1] mb-6 leading-relaxed">
          Esta terminal está restringida exclusivamente para los maestros artesanos y administradores de KuroPunk. 
          Tu cuenta actual (<span className="text-[#ffb4ab] font-mono">{currentUser?.email || 'Sin sesión'}</span>) no cuenta con el Custom Claim de administrador en Firebase Auth.
        </p>

        {/* Development QA Quick Role Switcher */}
        <div className="p-4 bg-[#1d1b1b] border border-[#5e3f3c] mb-6">
          <div className="flex items-center space-x-2 text-xs font-mono text-[#ffb4ab] mb-2">
            <KeyRound className="w-4 h-4 text-emerald-400" />
            <span>MODO TESTING // DESARROLLO LOCAL:</span>
          </div>
          <p className="font-mono text-xs text-neutral-400 mb-3">
            Para evaluar el panel administrativo, puedes activar la sesión de prueba como Administrador Master:
          </p>
          <button
            onClick={() => setDemoSession('admin')}
            className="w-full py-2.5 bg-emerald-700 hover:bg-emerald-600 text-white font-mono text-xs font-bold uppercase tracking-wider transition-colors"
          >
            ⚡ ACTIVAR SESIÓN DE ADMIN (TESTING QA)
          </button>
        </div>

        <div className="flex justify-between items-center">
          <button
            onClick={onBackToShop}
            className="py-2.5 px-6 border border-[#5e3f3c] hover:border-[#ffb4ab] text-[#e6e1e1] font-mono text-xs uppercase flex items-center space-x-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>VOLVER A LA TIENDA</span>
          </button>
        </div>
      </div>
    );
  }

  return children;
}
