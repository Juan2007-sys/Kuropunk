import React from 'react';
import logoNegro from '../assets/logo_negro.jpeg';
import { buildWhatsAppUrl, WHATSAPP_PHONE } from '../utils/formatters';

export const Footer = React.memo(({ setCurrentView }) => {
  return (
    <footer className="w-full bg-[#0f0e0e] border-t brutalist-border py-12 mt-16 relative z-10 overflow-hidden">
      {/* Tape Tag */}
      <div className="tape-overlay !top-[-12px] !left-8">DESDE 2024</div>

      {/* Atmospheric back glow (gradiente radial sin costo de blur en GPU) */}
      <div
        className="absolute top-0 right-1/4 w-96 h-32 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at center, rgba(224,20,31,0.08) 0%, transparent 70%)' }}
      ></div>

      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 grid grid-cols-1 md:grid-cols-3 gap-8 relative z-10">
        {/* Brand Bio */}
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <img
              src={logoNegro}
              alt="KuroPunk Logo"
              className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover border-2 border-[#5e3f3c] shadow-[0_0_15px_rgba(224,20,31,0.3)]"
            />
            <div>
              <div className="font-headline-md text-3xl sm:text-4xl text-[#ffb4ab] leading-tight">KUROPUNK</div>
              <div className="text-[10px] tracking-[0.25em] text-[#e0141f] font-mono uppercase font-bold">
                CROCHET UNDERGROUND
              </div>
            </div>
          </div>
          <p className="font-body-md text-sm text-[#e7bcb8]/70 max-w-sm">
            Amigurumis rebeldes y punto de cruz para el coleccionista urbano. Meticulosa artesanía y resistencia callejera, creados a mano para desafiar el plástico masivo.
          </p>
          <div className="pt-2 text-xs font-mono text-[#8a8a86]">
            BOGOTÁ, COLOMBIA
          </div>
        </div>

        {/* Navigation Column */}
        <div className="flex flex-col gap-1">
          <div className="font-label-caps text-xs text-[#e6e1e1] uppercase tracking-wider mb-2 border-b border-[#5e3f3c] pb-1 w-24">
            NAVEGACIÓN
          </div>
          <button
            onClick={() => setCurrentView('home')}
            className="text-left font-body-md text-sm text-[#e7bcb8]/70 hover:text-[#ffb4ab] transition-colors min-h-[40px] flex items-center"
          >
            Portal Principal
          </button>
          <button
            onClick={() => setCurrentView('shop')}
            className="text-left font-body-md text-sm text-[#e7bcb8]/70 hover:text-[#ffb4ab] transition-colors min-h-[40px] flex items-center"
          >
            Catálogo Completo
          </button>
          <button
            onClick={() => setCurrentView('about')}
            className="text-left font-body-md text-sm text-[#e7bcb8]/70 hover:text-[#ffb4ab] transition-colors min-h-[40px] flex items-center"
          >
            Acerca de KuroPunk
          </button>
          <button
            onClick={() => setCurrentView('contact')}
            className="text-left font-body-md text-sm text-[#e7bcb8]/70 hover:text-[#ffb4ab] transition-colors min-h-[40px] flex items-center"
          >
            Contacto & Encargos
          </button>
        </div>

        {/* Social & Telemetry */}
        <div className="flex flex-col gap-1">
          <div className="font-label-caps text-xs text-[#e6e1e1] uppercase tracking-wider mb-2 border-b border-[#5e3f3c] pb-1 w-24">
            REDES & COMUNIDAD
          </div>
          <a
            href="https://www.instagram.com/kuropunk_/"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body-md text-sm text-[#e7bcb8]/70 hover:text-[#ffb4ab] transition-colors flex items-center gap-2 min-h-[40px]"
          >
            <span className="w-1.5 h-1.5 bg-[#e0141f]"></span> Instagram Oficial (@kuropunk_)
          </a>
          <a
            href={buildWhatsAppUrl(WHATSAPP_PHONE)}
            target="_blank"
            rel="noopener noreferrer"
            className="font-body-md text-sm text-[#e7bcb8]/70 hover:text-[#ffb4ab] transition-colors flex items-center gap-2 min-h-[40px]"
          >
            <span className="w-1.5 h-1.5 bg-[#25D366]"></span> WhatsApp Taller (+57 323 8937221)
          </a>
          <button
            type="button"
            onClick={() => setCurrentView('contact')}
            className="text-left font-body-md text-sm text-[#e7bcb8]/70 hover:text-[#ffb4ab] transition-colors flex items-center gap-2 min-h-[40px]"
          >
            <span className="w-1.5 h-1.5 bg-[#ffb4ab]"></span> Cotizar Amigurumi Personalizado
          </button>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 mt-12 pt-4 border-t border-[#5e3f3c] flex flex-col sm:flex-row justify-between items-center gap-2 font-label-caps text-xs text-[#ae8883]">
        <span>© 2026 KUROPUNK · TODOS LOS DERECHOS RESERVADOS.</span>
        <span className="font-mono tracking-widest text-[#e0141f]">ARTEFACTOS HECHOS A MANO · EDICIÓN ARTESANAL</span>
      </div>
    </footer>
  );
});
