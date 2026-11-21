import React from 'react';
import { useToastState } from '../context/CartContext';
import { AnimatePresence, motion } from 'framer-motion';
import { Terminal, AlertTriangle, CheckCircle, X } from 'lucide-react';

export const Toast = () => {
  const { toastMessage, setToastMessage } = useToastState();

  if (!toastMessage) return null;

  const isSuccess = toastMessage.type === 'success';
  const isWarning = toastMessage.type === 'warning';

  return (
    <div className="fixed bottom-6 right-6 z-50 pointer-events-auto">
      <AnimatePresence>
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          className="bg-[#141313] border-2 border-[#e0141f] text-[#e6e1e1] p-4 shadow-[4px_4px_0px_rgba(224,20,31,0.5)] flex items-center gap-3 min-w-[300px] max-w-md relative"
        >
          {/* Staple corners */}
          <div className="absolute top-1 left-1 w-2 h-0.5 bg-[#c7c6c2]"></div>
          <div className="absolute top-1 right-1 w-2 h-0.5 bg-[#c7c6c2]"></div>

          <div className="shrink-0 p-1.5 bg-[#211f1f] text-[#ffb4ab]">
            {isSuccess && <CheckCircle className="w-4 h-4 text-[#ffb4ab]" />}
            {isWarning && <AlertTriangle className="w-4 h-4 text-[#e0141f]" />}
            {!isSuccess && !isWarning && <Terminal className="w-4 h-4 text-[#ffb4ab]" />}
          </div>

          <div className="flex-1 font-mono text-xs uppercase tracking-wider">
            {toastMessage.message}
          </div>

          <button
            onClick={() => setToastMessage(null)}
            className="text-[#8a8a86] hover:text-[#fff4f3] p-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
