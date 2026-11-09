import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Lock, Mail, User, Phone, LogIn, UserPlus, AlertTriangle, ShieldCheck, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Maps Firebase Auth error codes to user-friendly Spanish messages.
 */
export function mapAuthError(err) {
  if (!err) return 'Ocurrió un error inesperado al autenticar. Por favor intenta de nuevo.';

  const code = err.code || '';
  const message = err.message || '';

  if (code === 'auth/configuration-not-found' || message.includes('configuration-not-found')) {
    return 'El proveedor Google no está activo en Firebase Console > Authentication > Sign-in method';
  }
  if (code === 'auth/unauthorized-domain' || message.includes('unauthorized-domain')) {
    return 'El dominio actual no está autorizado en Firebase Console > Authentication > Settings > Dominios autorizados.';
  }
  if (code === 'auth/invalid-credential' || message.includes('invalid-credential')) {
    return 'Credenciales incorrectas. Las credenciales proporcionadas son inválidas o han expirado.';
  }
  if (code === 'auth/user-not-found' || message.includes('user-not-found')) {
    return 'No existe ninguna cuenta asociada a este correo electrónico.';
  }
  if (code === 'auth/wrong-password' || message.includes('wrong-password')) {
    return 'Contraseña incorrecta. Por favor verifica tus credenciales.';
  }
  if (code === 'auth/email-already-in-use' || message.includes('email-already-in-use')) {
    return 'Este correo electrónico ya se encuentra registrado con otro método de acceso.';
  }
  if (code === 'auth/weak-password' || message.includes('weak-password')) {
    return 'La contraseña debe tener al menos 6 caracteres.';
  }
  if (code === 'auth/invalid-email' || message.includes('invalid-email')) {
    return 'El formato del correo electrónico no es válido.';
  }
  if (code === 'auth/api-key-not-valid' || message.includes('api-key-not-valid') || message.includes('API key')) {
    return 'Error de configuración: Clave de API de Firebase no válida. Configura tus credenciales reales en el archivo frontend/.env.';
  }
  if (code === 'auth/popup-closed-by-user' || message.includes('popup-closed-by-user')) {
    return 'La ventana emergente de inicio de sesión fue cerrada antes de completar el acceso.';
  }
  if (code === 'auth/cancelled-popup-request' || message.includes('cancelled-popup-request')) {
    return 'Se canceló la solicitud de autenticación emergente.';
  }
  if (code === 'auth/network-request-failed' || message.includes('network-request-failed')) {
    return 'Error de red. Verifica tu conexión a internet.';
  }
  if (code === 'auth/too-many-requests' || message.includes('too-many-requests')) {
    return 'Demasiados intentos fallidos. Tu acceso ha sido bloqueado temporalmente por seguridad. Inténtalo más tarde.';
  }
  if (code === 'auth/operation-not-allowed' || message.includes('operation-not-allowed')) {
    return 'Este método de inicio de sesión no está habilitado en la consola de Firebase.';
  }
  if (code === 'auth/popup-blocked' || message.includes('popup-blocked')) {
    return 'La ventana emergente fue bloqueada por el navegador. Habilita los popups para continuar.';
  }

  return message || 'Ocurrió un error inesperado al procesar la solicitud.';
}

export function AuthModal({ isOpen, onClose, defaultIntent = null, onSuccess }) {
  const {
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    isFirebaseConfigured,
    setDemoSession
  } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phone, setPhone] = useState('');

  const modalRef = useRef(null);

  // Close on Escape key
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Reset error when mode changes or modal opens
  useEffect(() => {
    setAuthError(null);
  }, [mode, isOpen]);

  if (!isOpen) return null;

  // Backdrop click handler (only close if clicked directly on the overlay backdrop)
  const handleBackdropClick = (e) => {
    if (modalRef.current && !modalRef.current.contains(e.target)) {
      onClose();
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setAuthError(null);
    try {
      if (!isFirebaseConfigured) {
        throw {
          code: 'auth/api-key-not-valid',
          message: 'Firebase API key is not configured in .env'
        };
      }
      await loginWithGoogle();
      toast.success('¡Sesión iniciada con Google exitosamente!');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      const friendlyMsg = mapAuthError(err);
      setAuthError(friendlyMsg);
      toast.error(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };

  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setAuthError(null);

    if (!email || !password) {
      const msg = 'Por favor completa todos los campos requeridos.';
      setAuthError(msg);
      toast.error(msg);
      return;
    }

    if (mode === 'register' && !displayName) {
      const msg = 'Ingresa tu nombre completo para la entrega de tus pedidos.';
      setAuthError(msg);
      toast.error(msg);
      return;
    }

    setLoading(true);
    try {
      if (!isFirebaseConfigured) {
        throw {
          code: 'auth/api-key-not-valid',
          message: 'Firebase API key is not configured in .env'
        };
      }

      if (mode === 'login') {
        await loginWithEmail(email, password);
        toast.success('¡Bienvenido/a de vuelta a KuroPunk!');
      } else {
        await registerWithEmail(email, password, displayName, phone);
        toast.success('¡Cuenta registrada exitosamente!');
      }
      onClose();
      if (onSuccess) onSuccess();
    } catch (err) {
      const friendlyMsg = mapAuthError(err);
      setAuthError(friendlyMsg);
      toast.error(friendlyMsg);
    } finally {
      setLoading(false);
    }
  };



  return (
    <div
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in overflow-y-auto overscroll-contain"
      role="dialog"
      aria-modal="true"
      aria-labelledby="auth-modal-title"
    >
      <div
        ref={modalRef}
        data-lenis-prevent="true"
        className="max-w-md w-full max-h-[92dvh] overflow-y-auto bg-[#0F0F0F] border border-neutral-800 rounded-t-2xl sm:rounded-xl shadow-2xl p-5 sm:p-6 relative custom-scrollbar my-auto"
      >
        {/* Close button X (44x44px touch target) */}
        <button
          onClick={onClose}
          type="button"
          className="absolute top-3 right-3 text-neutral-400 hover:text-white min-w-[44px] min-h-[44px] flex items-center justify-center rounded hover:bg-neutral-800/80 transition-colors focus:outline-none focus:ring-1 focus:ring-[#e0141f]"
          aria-label="Cerrar modal de autenticación"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="border-b border-neutral-800 pb-4 mb-5">
          <div
            translate="no"
            className="text-[10px] font-mono text-[#ffb4ab] tracking-widest uppercase mb-1"
          >
            KUROPUNK AUTHENTICATION TERMINAL
          </div>
          <h2
            id="auth-modal-title"
            className="font-headline-md text-2xl text-[#fff4f3] uppercase tracking-wider"
          >
            {mode === 'login' ? 'INICIAR SESIÓN' : 'CREAR CUENTA'}
          </h2>
          {defaultIntent === 'checkout' && (
            <p className="font-mono text-xs text-emerald-400 mt-1 flex items-center gap-1">
              <span>✓</span> Tu carrito y despacho contraentrega se mantendrán sincronizados.
            </p>
          )}
        </div>



        {/* Error message banner */}
        {authError && (
          <div className="mb-4 p-3 bg-red-950/60 border border-red-600/80 rounded-lg text-red-200 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            <span className="leading-tight">{authError}</span>
          </div>
        )}

        {/* Tab switch between Login and Register */}
        <div className="grid grid-cols-2 gap-1 p-1 bg-neutral-900 border border-neutral-800 rounded-lg mb-5">
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`py-2 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all ${
              mode === 'login'
                ? 'bg-[#e0141f] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Iniciar Sesión
          </button>
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`py-2 text-xs font-mono font-bold uppercase tracking-wider rounded transition-all ${
              mode === 'register'
                ? 'bg-[#e0141f] text-white shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            Crear Cuenta
          </button>
        </div>

        {/* Google OAuth Quick Button */}
        <button
          type="button"
          onClick={handleGoogleLogin}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700 hover:border-neutral-500 text-white font-mono text-xs uppercase tracking-wider rounded-lg flex items-center justify-center space-x-3 transition-colors mb-5 shadow-sm disabled:opacity-50 focus:outline-none focus:ring-1 focus:ring-[#e0141f]"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24" aria-hidden="true">
            <path
              fill="#EA4335"
              d="M12 5c1.6 0 3 .6 4.1 1.7l3.1-3.1C17.3 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.3 9 5 12 5z"
            />
            <path
              fill="#4285F4"
              d="M23.5 12.3c0-.8-.1-1.7-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
            />
            <path
              fill="#FBBC05"
              d="M5.6 14.8c-.2-.7-.4-1.5-.4-2.8s.2-2.1.4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
            />
            <path
              fill="#34A853"
              d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.3-6.4-5.2L1.9 16c1.8 3.7 5.6 7 10.1 7z"
            />
          </svg>
          <span>{loading ? 'Conectando con Google...' : 'Continuar con Google'}</span>
        </button>

        <div className="relative flex items-center justify-center mb-5">
          <div className="border-t border-neutral-800 w-full" />
          <span className="bg-[#0F0F0F] px-3 font-mono text-[10px] text-neutral-400 uppercase tracking-widest">
            o con correo electrónico
          </span>
        </div>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailSubmit} className="space-y-3.5">
          {mode === 'register' && (
            <>
              <div>
                <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
                  Nombre Completo *
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="text"
                    required
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Ej: Mateo Gómez"
                    className="w-full pl-10 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 focus:border-[#e0141f] rounded text-white font-mono text-base sm:text-xs outline-none transition-colors min-h-[44px]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
                  Celular / WhatsApp (Para Notificaciones)
                </label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+57 301 569 0382"
                    className="w-full pl-10 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 focus:border-[#e0141f] rounded text-white font-mono text-base sm:text-xs outline-none transition-colors min-h-[44px]"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
              Correo Electrónico *
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="operativo@kuropunk.co"
                className="w-full pl-10 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 focus:border-[#e0141f] rounded text-white font-mono text-base sm:text-xs outline-none transition-colors min-h-[44px]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono text-neutral-400 uppercase mb-1">
              Contraseña *
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••••••"
                className="w-full pl-10 pr-3 py-2.5 bg-neutral-900 border border-neutral-800 focus:border-[#e0141f] rounded text-white font-mono text-base sm:text-xs outline-none transition-colors min-h-[44px]"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-[#e0141f] hover:bg-[#ff1f2d] text-white font-headline-md text-sm uppercase tracking-wider rounded-lg transition-all duration-200 shadow-md flex items-center justify-center space-x-2 disabled:opacity-50 mt-5 focus:outline-none focus:ring-2 focus:ring-[#e0141f]"
          >
            {mode === 'login' ? (
              <>
                <LogIn className="w-4 h-4" />
                <span>{loading ? 'Autenticando...' : 'Iniciar Sesión'}</span>
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                <span>{loading ? 'Registrando...' : 'Completar Registro'}</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
