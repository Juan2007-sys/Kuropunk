import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { submitContactMessage } from '../services/api';
import { motion } from 'framer-motion';
import { Send, MapPin, Mail, Camera, MessageSquare, ShieldCheck, CheckCircle, Sparkles } from 'lucide-react';

export const ContactPage = () => {
  const { showToast } = useCart();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    type: 'commission',
    message: '',
  });
  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      showToast("TODOS LOS CAMPOS SON REQUERIDOS PARA TRANSMISIÓN", "warning");
      return;
    }

    setIsTransmitting(true);
    await submitContactMessage(formData);
    setIsTransmitting(false);
    setIsSent(true);
    showToast("SEÑAL ENCRIPTADA ENVIADA AL SUB-NIVEL 4", "success");
    setFormData({ name: '', email: '', type: 'commission', message: '' });
  };

  return (
    <div className="w-full pt-8 pb-24 bg-[#141313] relative min-h-screen text-[#e6e1e1]">
      {/* Background radial glows */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-[#e0141f]/10 blur-3xl rounded-full"></div>
        <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-[#e0141f]/08 blur-3xl rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-8 md:px-16 grid grid-cols-1 md:grid-cols-2 gap-12 items-start mt-6">
        {/* Left Column: Intro & HQ Telemetry */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-8"
        >
          <div className="space-y-4">
            <span className="font-label-caps text-xs text-[#e0141f] uppercase tracking-widest font-mono font-bold">
              ENCRYPTED FREQUENCY // 89.4 MHZ
            </span>
            <h1 className="font-stencil text-5xl sm:text-6xl lg:text-7xl leading-none text-[#e6e1e1] uppercase tracking-tight">
              Hit Up The<br />
              <span className="text-[#e0141f]">Underground</span>
            </h1>
            <p className="font-body-lg text-base text-[#e7bcb8]/80 max-w-md leading-relaxed">
              ¿Dudas sobre un drop? ¿Solicitudes de comisión 1-de-1 para piezas a medida? O simplemente requieres coordenadas de entrega. Envía tu señal. Respondemos en orden de llegada.
            </p>
          </div>

          <div className="space-y-2 bg-[#211f1f] p-5 brutalist-border">
            <div className="font-label-caps text-xs text-[#ffb4ab] uppercase tracking-wider flex items-center gap-2 mb-1">
              <MapPin className="w-3.5 h-3.5 text-[#e0141f]" /> Coordenadas HQ
            </div>
            <p className="font-mono text-sm text-[#e6e1e1] leading-relaxed">
              1994 SEVEN DEADLY SINS AVE.<br />
              TOKYO, SUB-LEVEL 4 // GRID SECTOR 9
            </p>
            <div className="text-[11px] font-mono text-[#8a8a86] pt-1">
              STATUS: TERMINAL SEGURO OPERATIVO
            </div>
          </div>

          {/* Social / Channel Monograms */}
          <div className="space-y-3">
            <div className="font-label-caps text-xs text-[#8a8a86] uppercase tracking-wider">
              Canales Directos de Comunicación
            </div>
            <div className="flex gap-4 items-center">
              <a
                href="mailto:contact@kuropunk.com"
                className="group relative flex items-center justify-center w-14 h-14 brutalist-border border-[#5e3f3c] hover:border-[#e0141f] transition-all bg-[#1d1b1b] hover:bg-[#211f1f] rotate-3 hover:rotate-0 shadow-lg"
                title="Despacho Directo"
              >
                <Mail className="w-6 h-6 text-[#ffb4ab] group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="https://instagram.com"
                target="_blank"
                rel="noreferrer"
                className="group relative flex items-center justify-center w-14 h-14 brutalist-border border-[#5e3f3c] hover:border-[#e0141f] transition-all bg-[#1d1b1b] hover:bg-[#211f1f] -rotate-6 hover:rotate-0 shadow-lg"
                title="Vigilancia Visual"
              >
                <Camera className="w-6 h-6 text-[#ffb4ab] group-hover:scale-110 transition-transform" />
              </a>
              <a
                href="https://discord.com"
                target="_blank"
                rel="noreferrer"
                className="group relative flex items-center justify-center w-14 h-14 brutalist-border border-[#5e3f3c] hover:border-[#e0141f] transition-all bg-[#1d1b1b] hover:bg-[#211f1f] rotate-6 hover:rotate-0 shadow-lg"
                title="Frecuencia Discord"
              >
                <MessageSquare className="w-6 h-6 text-[#ffb4ab] group-hover:scale-110 transition-transform" />
              </a>
            </div>
          </div>
        </motion.div>

        {/* Right Column: Secure Comms Form */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="bg-[#211f1f] brutalist-border border-[#5e3f3c] p-6 sm:p-8 relative staple-corner shadow-2xl"
        >
          {/* Tape Overlay */}
          <div className="tape-overlay !top-[-12px] !right-6 !left-auto !bg-[#e0141f] !text-[#fff4f3] rotate-2">
            SECURE COMMS // RX-SIGNAL
          </div>

          {isSent ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="w-16 h-16 bg-[#141313] border-2 border-[#e0141f] flex items-center justify-center text-[#ffb4ab]">
                <CheckCircle className="w-8 h-8" />
              </div>
              <h3 className="font-stencil text-2xl uppercase text-[#e6e1e1]">
                Transmisión Registrada
              </h3>
              <p className="font-mono text-xs text-[#8a8a86] max-w-xs">
                Tu señal ha sido despachada al Sub-Nivel 4. Un artesano descifrará tu solicitud a la brevedad.
              </p>
              <button
                onClick={() => setIsSent(false)}
                className="px-6 py-2 bg-[#ffb4ab] text-[#690006] font-bold text-xs uppercase tracking-wider hover:bg-[#e0141f] hover:text-white transition-colors"
              >
                Transmitir Otra Señal
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5 pt-4">
              {/* Request Type Selector */}
              <div className="space-y-1">
                <label className="font-accent-tag text-xs text-[#ffb4ab] uppercase tracking-wider block">
                  Tipo de Solicitud / Transmisión
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {[
                    { id: 'commission', label: 'Comisión 1-de-1' },
                    { id: 'punto_cruz', label: 'Gráfico Personalizado' },
                    { id: 'drop_inquiry', label: 'Consulta de Drop' },
                    { id: 'general', label: 'Mensaje General' }
                  ].map((type) => (
                    <button
                      type="button"
                      key={type.id}
                      onClick={() => setFormData({ ...formData, type: type.id })}
                      className={`min-h-[44px] py-2 px-3 text-left font-mono text-xs border flex items-center transition-colors active:scale-98 ${
                        formData.type === type.id
                          ? 'border-[#e0141f] bg-[#e0141f]/20 text-white font-bold'
                          : 'border-[#5e3f3c] bg-[#141313] text-neutral-400 hover:text-white'
                      }`}
                    >
                      {type.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name Input */}
              <div className="space-y-1">
                <label className="font-accent-tag text-xs text-[#ffb4ab] uppercase tracking-wider block">
                  Alias / Nombre
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. StrayKat_09"
                  required
                  className="w-full min-h-[44px] bg-[#141313] border-b-2 border-[#5e3f3c] focus:border-[#e0141f] outline-none font-body-md text-base sm:text-sm text-[#e6e1e1] py-2.5 px-3 transition-colors placeholder:text-[#5e3f3c]"
                />
              </div>

              {/* Email Input */}
              <div className="space-y-1">
                <label className="font-accent-tag text-xs text-[#ffb4ab] uppercase tracking-wider block">
                  Email de Contacto / Comms Handle
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="operative@underground.net"
                  required
                  className="w-full min-h-[44px] bg-[#141313] border-b-2 border-[#5e3f3c] focus:border-[#e0141f] outline-none font-body-md text-base sm:text-sm text-[#e6e1e1] py-2.5 px-3 transition-colors placeholder:text-[#5e3f3c]"
                />
              </div>

              {/* Message Input */}
              <div className="space-y-1">
                <label className="font-accent-tag text-xs text-[#ffb4ab] uppercase tracking-wider block">
                  Detalles del Pedido o Consulta
                </label>
                <textarea
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe la pieza que deseas, colores deseados, medidas aproximadas o el SKU de referencia..."
                  required
                  className="w-full min-h-[100px] bg-[#141313] border-b-2 border-[#5e3f3c] focus:border-[#e0141f] outline-none font-body-md text-base sm:text-sm text-[#e6e1e1] py-2.5 px-3 transition-colors placeholder:text-[#5e3f3c] resize-none"
                ></textarea>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isTransmitting}
                className="mt-1 w-full min-h-[48px] bg-[#e0141f] text-[#fff4f3] font-stencil text-xl py-3.5 uppercase border-2 border-[#e0141f] hover:bg-[#141313] hover:text-[#ffb4ab] transition-all relative overflow-hidden group shadow-[4px_4px_0px_#000] flex items-center justify-center gap-2 active:scale-98"
              >
                <span className="relative z-10">
                  {isTransmitting ? 'TRANSMITIENDO ENCRIPTACIÓN...' : 'Transmitir Señal'}
                </span>
                {!isTransmitting && <Send className="w-4 h-4 relative z-10" />}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-[#8a8a86] font-mono uppercase">
                <ShieldCheck className="w-3.5 h-3.5 text-[#ffb4ab]" />
                Zero tracking. Zero marketing spam. Comunicación directa con artesanos.
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </div>
  );
};
