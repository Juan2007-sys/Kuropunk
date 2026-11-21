import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, RefreshCw } from 'lucide-react';

export function ConfirmModal({
  isOpen,
  title = '¿Confirmar Acción?',
  message = 'Esta operación no se puede deshacer.',
  confirmText = 'CONFIRMAR',
  cancelText = 'CANCELAR',
  isDanger = false,
  icon = null,
  isLoading = false,
  onConfirm,
  onClose
}) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && !isLoading) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose, isLoading]);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85 animate-fade-in"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isLoading) onClose();
        }}
        role="dialog"
        aria-modal="true"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="relative w-full max-w-md bg-[#121111] border-2 border-[#e0141f] shadow-[0_0_30px_rgba(224,20,31,0.25)] p-6 text-white overflow-hidden"
        >
          {/* Staple corners */}
          <div className="absolute top-1.5 left-1.5 w-3 h-0.5 bg-[#c7c6c2]" />
          <div className="absolute top-1.5 right-1.5 w-3 h-0.5 bg-[#c7c6c2]" />
          <div className="absolute bottom-1.5 left-1.5 w-3 h-0.5 bg-[#c7c6c2]" />
          <div className="absolute bottom-1.5 right-1.5 w-3 h-0.5 bg-[#c7c6c2]" />

          {/* Close button */}
          <button
            onClick={onClose}
            disabled={isLoading}
            className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors p-1 disabled:opacity-40"
            title="Cerrar modal"
            type="button"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Content */}
          <div className="flex items-start gap-4">
            <div className={`p-3 shrink-0 border ${
              isDanger 
                ? 'bg-red-950/80 border-[#e0141f] text-red-400' 
                : 'bg-neutral-900 border-[#5e3f3c] text-[#ffb4ab]'
            }`}>
              {icon || <AlertTriangle className="w-6 h-6 text-[#e0141f]" />}
            </div>

            <div className="flex-1 min-w-0">
              <h3 className="font-headline-md text-xl uppercase tracking-wider text-white mb-2">
                {title}
              </h3>
              <p className="font-mono text-xs text-neutral-300 leading-relaxed">
                {message}
              </p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t border-neutral-800 font-mono text-xs">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 border border-neutral-700 hover:border-neutral-500 uppercase tracking-wider text-neutral-300 hover:text-white transition-all disabled:opacity-40"
            >
              {cancelText}
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={isLoading}
              className={`px-5 py-2 uppercase tracking-wider font-bold transition-all flex items-center gap-2 disabled:opacity-50 ${
                isDanger
                  ? 'bg-[#e0141f] hover:bg-[#ff1f2d] text-white shadow-[0_0_15px_rgba(224,20,31,0.4)]'
                  : 'bg-[#ffb4ab] hover:bg-white text-[#690006] shadow-[0_0_15px_rgba(255,180,171,0.3)]'
              }`}
            >
              {isLoading && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
              <span>{confirmText}</span>
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
