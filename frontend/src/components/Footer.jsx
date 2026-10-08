import React from 'react';
import logoNegro from '../assets/logo_negro.jpeg';

export const Footer = ({ setCurrentView }) => {
  return (
    <footer className="w-full bg-[#0f0e0e] border-t brutalist-border py-12 mt-16 relative z-10 overflow-hidden">
      {/* Tape Tag */}
      <div className="tape-overlay !top-[-12px] !left-8">EST. 2024</div>

      {/* Atmospheric back glow */}
      <div className="absolute top-0 right-1/4 w-96 h-32 bg-[#e0141f]/5 blur-3xl pointer-events-none"></div>

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
                UNDERGROUND CROCHET
              </div>
            </div>
          </div>
          <p className="font-body-md text-sm text-[#e7bcb8]/70 max-w-sm">
            Raw amigurumi for the urban artisan. Meticulous Japanese craft, street grit. Handcrafted in the underground to defy mass-produced plastic.
          </p>
          <div className="pt-2 text-xs font-mono text-[#8a8a86]">
            LOC: TOKYO SUB-LEVEL 4 // LAT 35.6762° N
          </div>
        </div>

        {/* Navigation Column */}
        <div className="flex flex-col gap-2">
          <div className="font-label-caps text-xs text-[#e6e1e1] uppercase tracking-wider mb-2 border-b border-[#5e3f3c] pb-1 w-24">
            NAVIGATE
          </div>
          <button
            onClick={() => setCurrentView('home')}
            className="text-left font-body-md text-sm text-[#e7bcb8]/70 hover:text-[#ffb4ab] transition-colors"
          >
            The Drop Portal
          </button>
          <button
            onClick={() => setCurrentView('shop')}
            className="text-left font-body-md text-sm text-[#e7bcb8]/70 hover:text-[#ffb4ab] transition-colors"
          >
            Shop All Catalog
          </button>
          <button
            onClick={() => setCurrentView('about')}
            className="text-left font-body-md text-sm text-[#e7bcb8]/70 hover:text-[#ffb4ab] transition-colors"
          >
            Acerca de KuroPunk
          </button>
          <button
            onClick={() => setCurrentView('contact')}
            className="text-left font-body-md text-sm text-[#e7bcb8]/70 hover:text-[#ffb4ab] transition-colors"
          >
            Secure Comms / Inquiries
          </button>
        </div>

        {/* Social & Telemetry */}
        <div className="flex flex-col gap-2">
          <div className="font-label-caps text-xs text-[#e6e1e1] uppercase tracking-wider mb-2 border-b border-[#5e3f3c] pb-1 w-24">
            NETWORK
          </div>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body-md text-sm text-[#e7bcb8]/70 hover:text-[#ffb4ab] transition-colors flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 bg-[#e0141f]"></span> Instagram
          </a>
          <a
            href="https://discord.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body-md text-sm text-[#e7bcb8]/70 hover:text-[#ffb4ab] transition-colors flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 bg-[#ffb4ab]"></span> Discord // Stitch Syndicate
          </a>
          <a
            href="https://youtube.com"
            target="_blank"
            rel="noopener noreferrer"
            className="font-body-md text-sm text-[#e7bcb8]/70 hover:text-[#ffb4ab] transition-colors flex items-center gap-2"
          >
            <span className="w-1.5 h-1.5 bg-[#c7c6c2]"></span> Workshop Lookbook & Tape
          </a>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 mt-12 pt-4 border-t border-[#5e3f3c] flex flex-col sm:flex-row justify-between items-center gap-2 font-label-caps text-xs text-[#ae8883]">
        <span>© 2024 STITCH UNDERGROUND. ALL RIGHTS RESERVED.</span>
        <span className="font-mono tracking-widest text-[#e0141f]">REDACTED // VANDAL EDITION</span>
      </div>
    </footer>
  );
};
