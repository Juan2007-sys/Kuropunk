import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ShieldCheck, 
  Search, 
  Award, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Copy, 
  ExternalLink,
  QrCode
} from 'lucide-react';

// Registro de certificados de autenticidad emitidos por el taller
const CERTIFICATE_VAULT = {
  'RX-00-042': {
    serial: 'RX-00-042',
    sku: 'RX-00 · FLAGSHIP',
    title: 'The Wanderer - Edición Coleccionista',
    series: 'Grit Series Vol. 04',
    edition: '042 de 050',
    craftDate: '15 de Agosto, 2026',
    artisan: 'Mateo R. & Colectivo KuroPunk Bogotá',
    yarnSpec: 'Acrílico Industrial de Alta Torsión 100%',
    status: 'VERIFICADO · ACTIVO EN BÓVEDA',
    ownerAlias: 'Operativo Coleccionista #42',
    notes: 'Pieza equipada con mini brújula funcional y báculo de resina cristalina. Tensión de puntada ultra-cerrada.'
  },
  'RX-01-088': {
    serial: 'RX-01-088',
    sku: 'RX-01 · ALLEY KAT',
    title: 'Vandal Bear - Street Punk',
    series: 'Alley Kats Drop 01',
    edition: '088 de 100',
    craftDate: '28 de Agosto, 2026',
    artisan: 'Valentina C. (Taller Central)',
    yarnSpec: 'Hilado de Fibra de Carbono & Poliéster Reforzado',
    status: 'VERIFICADO · ACTIVO EN BÓVEDA',
    ownerAlias: 'Operativo Urbano #88',
    notes: 'Incluye lata miniatura de spray stencil roja y desgaste artesanal en orejas.'
  },
  'RX-02-015': {
    serial: 'RX-02-015',
    sku: 'RX-02 · SKULL',
    title: 'Scrap Bunny - Edición Distópica',
    series: 'Distopía Vol. 02',
    edition: '015 de 030',
    craftDate: '02 de Septiembre, 2026',
    artisan: 'Santiago V. (Laboratorio Táctico)',
    yarnSpec: 'Lana de Algodón Peinado y Retales Reciclados',
    status: 'VERIFICADO · ACTIVO EN BÓVEDA',
    ownerAlias: 'Coleccionista Privado #15',
    notes: 'Remiendos con hilo fluor luminiscente visible bajo luz UV.'
  }
};

export const AuthenticityModal = ({ isOpen, onClose, initialSerial = '' }) => {
  const [querySerial, setQuerySerial] = useState(initialSerial || 'RX-00-042');
  const [searchResult, setSearchResult] = useState(CERTIFICATE_VAULT['RX-00-042']);
  const [hasSearched, setHasSearched] = useState(true);
  const [isCopied, setIsCopied] = useState(false);
  const copyTimerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  if (!isOpen) return null;

  const handleSearch = (e) => {
    e?.preventDefault();
    const clean = querySerial.trim().toUpperCase();
    if (!clean) return;

    if (CERTIFICATE_VAULT[clean]) {
      setSearchResult(CERTIFICATE_VAULT[clean]);
    } else {
      // Simular verificación algorítmica para seriales de formato RX-XX-XXX
      if (clean.startsWith('RX-') || clean.startsWith('KP-')) {
        setSearchResult({
          serial: clean,
          sku: `${clean} · EDICIÓN TALLER`,
          title: 'Pieza Artesanal Confeccionada por Pedido',
          series: 'Lote Personalizado KuroPunk',
          edition: 'Pieza Única 1 de 1',
          craftDate: 'Septiembre 2026',
          artisan: 'Artesano Certificado KuroPunk Bogotá',
          yarnSpec: 'Fibras Seleccionadas de Grado Industrial',
          status: 'VERIFICADO · PIEZA AUTÉNTICA',
          ownerAlias: 'Comprador Certificado',
          notes: 'Certificado de autenticidad generado por el taller de confección contra entrega.'
        });
      } else {
        setSearchResult(null);
      }
    }
    setHasSearched(true);
  };

  const handleCopy = () => {
    if (searchResult && navigator.clipboard) {
      navigator.clipboard.writeText(`CERTIFICADO KUROPUNK · SERIAL: ${searchResult.serial} - PIEZA: ${searchResult.title}`);
      setIsCopied(true);
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setIsCopied(false), 2500);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/90 overflow-y-auto overscroll-contain">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#0f0e0e] border-2 border-[#e0141f] w-full max-w-2xl my-auto max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden font-body-md text-neutral-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-6 py-4 bg-[#161414] border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-2.5">
              <ShieldCheck className="w-5 h-5 text-[#e0141f] shrink-0" />
              <div>
                <h3 className="font-headline-md text-base sm:text-lg text-white uppercase tracking-wider">
                  VERIFICADOR DE AUTENTICIDAD · BÓVEDA
                </h3>
                <p className="text-[10px] sm:text-[11px] font-mono text-[#ffb4ab]">
                  CERTIFICADO OFICIAL DE PIEZAS FÍSICAS Y EDICIONES
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Cerrar verificador"
              className="w-11 h-11 -mr-2 flex items-center justify-center text-neutral-400 hover:text-white bg-[#221c1c] hover:bg-[#e0141f] border border-neutral-700 transition-colors shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Buscador de Serial */}
          <div className="p-4 sm:p-6 bg-[#121010] border-b border-neutral-800 shrink-0">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
              <div className="relative flex-grow">
                <input
                  type="text"
                  placeholder="Ingresa el serial (ej: RX-00-042)..."
                  value={querySerial}
                  onChange={(e) => setQuerySerial(e.target.value)}
                  className="w-full min-h-[44px] bg-[#181616] border border-neutral-700 px-4 py-2.5 font-mono text-base sm:text-sm text-white uppercase outline-none focus:border-[#e0141f]"
                />
              </div>
              <button
                type="submit"
                className="min-h-[44px] px-6 py-2.5 bg-[#e0141f] hover:bg-red-700 text-white font-mono text-xs uppercase font-bold tracking-wider flex items-center justify-center gap-2 transition-colors active:scale-95 shrink-0"
              >
                <Search className="w-4 h-4" />
                <span>CONSULTAR</span>
              </button>
            </form>

            <div className="flex flex-wrap items-center gap-2 mt-3 text-[11px] font-mono text-neutral-400">
              <span>Probar seriales certificados:</span>
              {['RX-00-042', 'RX-01-088', 'RX-02-015'].map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setQuerySerial(s);
                    setSearchResult(CERTIFICATE_VAULT[s]);
                    setHasSearched(true);
                  }}
                  className="px-2 py-0.5 bg-[#201a1a] hover:bg-[#e0141f] hover:text-white text-[#ffb4ab] border border-neutral-700"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Resultado del Certificado (Holograma Digital) */}
          <div data-lenis-prevent="true" className="p-6 overflow-y-auto max-h-[60vh] custom-scrollbar">
            {searchResult ? (
              <div className="relative border-2 border-[#e0141f] bg-gradient-to-b from-[#181515] to-[#0d0c0c] p-6 shadow-2xl overflow-hidden">
                
                {/* Efecto holográfico de scanlines */}
                <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none"></div>
                <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-[#e0141f]/20 via-transparent to-transparent pointer-events-none"></div>

                {/* Sello de Autenticidad */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-neutral-800 gap-3">
                  <div>
                    <span className="text-[10px] font-mono text-[#39ff14] bg-[#122e16] px-2 py-0.5 border border-[#39ff14]/40 font-bold inline-flex items-center gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-[#39ff14]" /> {searchResult.status}
                    </span>
                    <h4 className="font-headline-lg text-2xl text-white uppercase mt-2">
                      {searchResult.title}
                    </h4>
                    <p className="text-xs font-mono text-[#ffb4ab]">
                      {searchResult.series} · {searchResult.sku}
                    </p>
                  </div>

                  <div className="text-right sm:border-l sm:border-neutral-800 sm:pl-4">
                    <div className="text-[10px] font-mono text-neutral-500 uppercase">SERIAL DE SEGURIDAD</div>
                    <div className="text-lg font-mono font-bold text-white tracking-widest">{searchResult.serial}</div>
                    <div className="text-xs font-mono text-[#e0141f] font-bold">{searchResult.edition}</div>
                  </div>
                </div>

                {/* Ficha Técnica de Confección */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 text-xs font-mono border-b border-neutral-800">
                  <div>
                    <span className="text-neutral-500 uppercase block text-[10px]">FECHA DE TEJIDO / DROP:</span>
                    <span className="text-neutral-200">{searchResult.craftDate}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 uppercase block text-[10px]">TALLER Y ARTESANO RESPONSABLE:</span>
                    <span className="text-neutral-200">{searchResult.artisan}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 uppercase block text-[10px]">COMPOSICIÓN DE FIBRA:</span>
                    <span className="text-neutral-200">{searchResult.yarnSpec}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 uppercase block text-[10px]">TITULAR DEL CERTIFICADO:</span>
                    <span className="text-neutral-200">{searchResult.ownerAlias}</span>
                  </div>
                </div>

                {/* Notas del Taller */}
                <div className="pt-4 text-xs font-mono text-neutral-400">
                  <span className="text-neutral-300 font-bold block mb-1">NOTAS DE FABRICACIÓN:</span>
                  <p className="leading-relaxed font-body-md text-neutral-300">
                    "{searchResult.notes}"
                  </p>
                </div>

                {/* Pie del Certificado con Botón de Copiado */}
                <div className="mt-6 pt-4 border-t border-neutral-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-2 text-[10px] font-mono text-neutral-500">
                    <Award className="w-4 h-4 text-[#e0141f]" />
                    <span>EMITIDO POR KUROPUNK COLLECTIVE · BOGOTÁ</span>
                  </div>

                  <button
                    onClick={handleCopy}
                    className="px-3 py-1 bg-[#1f1919] hover:bg-[#e0141f] text-neutral-300 hover:text-white font-mono text-xs border border-neutral-700 flex items-center gap-1.5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>{isCopied ? '¡COPIADO!' : 'COPIAR CERTIFICADO'}</span>
                  </button>
                </div>

              </div>
            ) : hasSearched ? (
              <div className="p-8 text-center bg-[#141010] border border-red-900/60 space-y-3">
                <AlertTriangle className="w-8 h-8 text-[#e0141f] mx-auto" />
                <h4 className="font-headline-md text-lg text-white uppercase">
                  SERIAL NO LOCALIZADO EN BÓVEDA
                </h4>
                <p className="text-xs font-mono text-neutral-400 max-w-md mx-auto">
                  El serial <strong className="text-white font-bold">{querySerial}</strong> no coincide con los lotes oficiales emitidos. Si adquiriste tu pieza recientemente, solicita al taller que registre el serial de tu etiqueta.
                </p>
              </div>
            ) : null}
          </div>

        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
