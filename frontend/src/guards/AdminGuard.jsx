import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft } from 'lucide-react';

/**
 * AdminGuard: Restricts route access strictly to users with role === 'admin' (Custom Claims or Firestore Admin Role)
 */
export function AdminGuard({ children, onBackToShop }) {
  const { currentUser, isAdmin, loading } = useAuth();

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
              403 · ACCESO DENEGADO
            </h2>
            <p className="font-mono text-xs text-[#ffb4ab]">
              REQUERIMIENTO RBAC: ROLE == 'ADMIN' / CUSTOM CLAIM
            </p>
          </div>
        </div>

        <p className="font-body-md text-sm text-[#e6e1e1] mb-6 leading-relaxed">
          Esta terminal está restringida exclusivamente para los maestros artesanos y administradores de KuroPunk. 
          Tu cuenta actual (<span className="text-[#ffb4ab] font-mono">{currentUser?.email || 'Sin sesión'}</span>) no cuenta con permisos de administrador autorizados.
        </p>

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
