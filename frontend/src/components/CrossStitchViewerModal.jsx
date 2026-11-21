import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  ZoomIn, 
  ZoomOut, 
  Check, 
  RotateCcw, 
  Eye, 
  Sparkles, 
  Printer, 
  Layers,
  Info
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

// Paleta de hilos de bordado estándar DMC
const DMC_PALETTE = [
  { code: '310', name: 'Negro Carbón', hex: '#111111', symbol: '■', textColor: '#ffffff' },
  { code: '666', name: 'Rojo Carmesí Kuro', hex: '#e0141f', symbol: '▲', textColor: '#ffffff' },
  { code: 'B5200', name: 'Blanco Nieve', hex: '#f8fafc', symbol: '●', textColor: '#111111' },
  { code: '413', name: 'Gris Asfalto', hex: '#4a4f54', symbol: '◆', textColor: '#ffffff' },
  { code: '907', name: 'Verde Neón Cyber', hex: '#39ff14', symbol: '★', textColor: '#000000' },
  { code: '3801', name: 'Rojo Neón Lúcido', hex: '#ff2a4d', symbol: '✚', textColor: '#ffffff' }
];

// Generador de matriz predeterminada representativa de punto de cruz urbano (16x16)
const generateDefaultPattern = () => {
  const grid = [];
  const rows = 16;
  const cols = 16;

  for (let r = 0; r < rows; r++) {
    const row = [];
    for (let c = 0; c < cols; c++) {
      // Dibujar un motivo de calavera / máscara cyberpunk geométrica
      let dmcCode = '413'; // Fondo grisáceo
      
      const isCenter = r >= 4 && r <= 12 && c >= 4 && c <= 11;
      const isEyes = (r === 6 && (c === 6 || c === 9)) || (r === 7 && (c === 6 || c === 9));
      const isRedAccents = (r === 3 && c >= 5 && c <= 10) || (r === 13 && (c === 7 || c === 8));
      const isNeonBorder = (r === 0 || r === 15 || c === 0 || c === 15);

      if (isEyes) {
        dmcCode = '907'; // Verde Neón
      } else if (isRedAccents) {
        dmcCode = '666'; // Rojo Kuro
      } else if (isCenter) {
        dmcCode = 'B5200'; // Calavera blanco nieve
      } else if (isNeonBorder && (r + c) % 2 === 0) {
        dmcCode = '3801'; // Borde rojo neón
      } else {
        dmcCode = '310'; // Negro carbón
      }

      row.push({
        id: `s-${r}-${c}`,
        row: r,
        col: c,
        dmc: dmcCode,
        completed: false
      });
    }
    grid.push(row);
  }
  return grid;
};

export const CrossStitchViewerModal = ({ isOpen, onClose, productTitle = "Cross Stitch Vandal Mask" }) => {
  const [activeDmc, setActiveDmc] = useState(null); // null = todos visibles
  const [gridData, setGridData] = useState(() => generateDefaultPattern());
  const [zoomLevel, setZoomLevel] = useState(1);
  const [showSymbols, setShowSymbols] = useState(true);
  const [activeMode, setActiveMode] = useState('inspect'); // 'inspect' | 'stitch'
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  // Estadísticas de bordado (debe ejecutarse siempre antes de cualquier return condicional - Rules of Hooks)
  const stats = useMemo(() => {
    let total = 0;
    let completed = 0;
    const countByDmc = {};

    gridData.forEach(row => {
      row.forEach(cell => {
        total++;
        if (cell.completed) completed++;
        countByDmc[cell.dmc] = (countByDmc[cell.dmc] || 0) + 1;
      });
    });

    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent, countByDmc };
  }, [gridData]);

  if (!isOpen) return null;

  // Toggle de puntada completada
  const toggleStitch = (rIdx, cIdx) => {
    if (activeMode !== 'stitch') return;
    setGridData(prev => {
      const copy = prev.map(row => [...row]);
      copy[rIdx][cIdx] = {
        ...copy[rIdx][cIdx],
        completed: !copy[rIdx][cIdx].completed
      };
      return copy;
    });
  };

  const resetProgress = () => {
    setIsConfirmResetOpen(true);
  };

  const confirmResetProgress = () => {
    setGridData(generateDefaultPattern());
    setIsConfirmResetOpen(false);
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[60] flex items-center justify-center p-2 sm:p-4 bg-black/90">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-[#0e0d0d] border-2 border-[#e0141f] w-full max-w-5xl h-[92dvh] max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden font-body-md text-neutral-200"
        >
          {/* Header Superior */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-[#161414] border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-3 min-w-0 pr-2">
              <span className="w-3 h-3 bg-[#e0141f] shrink-0"></span>
              <div className="min-w-0">
                <h3 className="font-headline-md text-sm sm:text-lg text-white tracking-wider uppercase truncate">
                  VISOR DMC · {productTitle}
                </h3>
                <p className="text-[10px] sm:text-[11px] font-mono text-[#ffb4ab] truncate">
                  MATRIZ 14CT AIDA • TABLA DMC • TACHADO EN VIVO
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              aria-label="Cerrar visor táctico"
              className="w-11 h-11 -mr-2 flex items-center justify-center text-neutral-400 hover:text-white bg-[#201a1a] hover:bg-[#e0141f] transition-colors border border-neutral-700 shrink-0"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Barra de Herramientas */}
          <div className="flex flex-wrap items-center justify-between px-3 sm:px-5 py-2.5 bg-[#121111] border-b border-neutral-800 text-xs font-mono gap-2 sm:gap-3 shrink-0">
            {/* Modos de interacción */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 uppercase hidden sm:inline">MODO:</span>
              <button
                type="button"
                onClick={() => setActiveMode('inspect')}
                className={`min-h-[40px] px-3 py-1 border flex items-center transition-colors active:scale-95 ${
                  activeMode === 'inspect'
                    ? 'bg-[#e0141f] text-white border-[#e0141f]'
                    : 'bg-[#1a1818] text-neutral-400 border-neutral-700 hover:text-white'
                }`}
              >
                🔍 AISLAR HILOS
              </button>
              <button
                type="button"
                onClick={() => setActiveMode('stitch')}
                className={`min-h-[40px] px-3 py-1 border flex items-center transition-colors active:scale-95 ${
                  activeMode === 'stitch'
                    ? 'bg-emerald-600 text-white border-emerald-500 font-bold'
                    : 'bg-[#1a1818] text-neutral-400 border-neutral-700 hover:text-white'
                }`}
              >
                ✓ BORDAR (MARCAR)
              </button>
            </div>

            {/* Controles de Zoom & Opciones */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                type="button"
                onClick={() => setShowSymbols(!showSymbols)}
                className={`min-h-[40px] px-2.5 py-1 border text-[11px] flex items-center transition-colors ${
                  showSymbols ? 'bg-[#2a2222] text-[#ffb4ab] border-[#e0141f]' : 'bg-[#181616] text-neutral-400 border-neutral-700'
                }`}
              >
                {showSymbols ? 'SÍMBOLOS ON' : 'SOLO COLOR'}
              </button>

              <div className="flex items-center border border-neutral-700 bg-[#161414]">
                <button
                  type="button"
                  onClick={() => setZoomLevel(z => Math.max(0.7, z - 0.15))}
                  aria-label="Alejar"
                  className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 active:scale-95 transition-all"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="px-2 text-[11px] text-neutral-400 min-w-10 text-center">{Math.round(zoomLevel * 100)}%</span>
                <button
                  type="button"
                  onClick={() => setZoomLevel(z => Math.min(1.8, z + 0.15))}
                  aria-label="Acercar"
                  className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-neutral-300 hover:text-white hover:bg-neutral-800 active:scale-95 transition-all"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              <button
                type="button"
                onClick={resetProgress}
                title="Reiniciar progreso"
                aria-label="Reiniciar progreso"
                className="w-10 h-10 min-w-[40px] min-h-[40px] flex items-center justify-center text-neutral-400 hover:text-amber-400 hover:bg-neutral-800 border border-neutral-700 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Cuerpo Principal: Sidebar de Hilos DMC + Canvas de Grilla */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-12 overflow-hidden">
            
            {/* Sidebar Izquierdo: Catálogo de Hilos DMC (4 cols) */}
            <div data-lenis-prevent="true" className="md:col-span-4 bg-[#141212] border-r border-neutral-800 p-4 overflow-y-auto space-y-4 custom-scrollbar">
              <div>
                <div className="text-[11px] font-mono text-[#ffb4ab] uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Layers className="w-3.5 h-3.5 text-[#e0141f]" />
                  <span>PALETA DE HILOS DMC REQUERIDOS</span>
                </div>
                <p className="text-xs text-neutral-400">
                  Haz clic sobre un hilo para aislar sus cruces en la tela y ocultar el resto.
                </p>
              </div>

              {/* Botón para ver todos */}
              <button
                onClick={() => setActiveDmc(null)}
                className={`w-full py-2 px-3 text-xs font-mono uppercase text-left border flex items-center justify-between ${
                  activeDmc === null
                    ? 'bg-[#221c1c] border-[#e0141f] text-white font-bold'
                    : 'bg-[#181616] border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <span>Mostrar todos los hilos</span>
                <Eye className="w-3.5 h-3.5" />
              </button>

              {/* Lista de colores DMC */}
              <div className="space-y-2">
                {DMC_PALETTE.map(thread => {
                  const isSelected = activeDmc === thread.code;
                  const count = stats.countByDmc[thread.code] || 0;

                  return (
                    <button
                      key={thread.code}
                      onClick={() => setActiveDmc(isSelected ? null : thread.code)}
                      className={`w-full p-2.5 flex items-center justify-between border transition-all text-xs font-mono ${
                        isSelected
                          ? 'border-[#e0141f] bg-[#221818] shadow-md'
                          : 'border-neutral-800 bg-[#171515] hover:border-neutral-600'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-6 h-6 rounded-none border border-neutral-600 flex items-center justify-center font-bold text-xs shadow-inner"
                          style={{ backgroundColor: thread.hex, color: thread.textColor }}
                        >
                          {thread.symbol}
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-white">DMC {thread.code}</div>
                          <div className="text-[10px] text-neutral-400">{thread.name}</div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-mono text-[#ffb4ab]">{count} cruces</div>
                        <div className="text-[9px] text-neutral-500">2 hebras</div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Barra de Progreso Global */}
              <div className="p-3 bg-[#181515] border border-neutral-800 space-y-2 mt-4">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-neutral-400">PROGRESO BORDADO:</span>
                  <span className="text-[#39ff14] font-bold">{stats.percent}% ({stats.completed}/{stats.total})</span>
                </div>
                <div className="w-full h-2 bg-[#2a2222] overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#e0141f] to-[#39ff14] transition-all duration-300"
                    style={{ width: `${stats.percent}%` }}
                  ></div>
                </div>
                <p className="text-[10px] font-mono text-neutral-400 leading-tight">
                  Consejo: Bordar primero los tonos oscuros de contorno antes del relleno blanco.
                </p>
              </div>
            </div>

            {/* Canvas Principal: Matriz de Bordado Pixelada (8 cols) */}
            <div className="md:col-span-8 bg-[#0a0a0a] p-6 flex flex-col items-center justify-center overflow-auto relative select-none">
              
              {/* Indicador de hilo activo flotante */}
              {activeDmc && (
                <div className="absolute top-4 left-4 z-20 px-3 py-1.5 bg-[#e0141f] text-white text-xs font-mono font-bold flex items-center gap-2 shadow-lg">
                  <span className="w-2 h-2 bg-white rounded-full animate-ping"></span>
                  <span>AISLANDO HILO DMC {activeDmc}</span>
                </div>
              )}

              {/* Grilla de Aida */}
              <div 
                className="grid gap-[1px] bg-neutral-900/60 p-3 border border-neutral-700 shadow-2xl transition-transform duration-200"
                style={{
                  gridTemplateColumns: `repeat(16, minmax(0, 1fr))`,
                  transform: `scale(${zoomLevel})`
                }}
              >
                {gridData.map((row, rIdx) =>
                  row.map((cell, cIdx) => {
                    const thread = DMC_PALETTE.find(t => t.code === cell.dmc) || DMC_PALETTE[0];
                    const isHighlighted = activeDmc === null || activeDmc === cell.dmc;
                    const isStitched = cell.completed;

                    return (
                      <div
                        key={cell.id}
                        onClick={() => toggleStitch(rIdx, cIdx)}
                        title={`Fila ${rIdx + 1}, Columna ${cIdx + 1} · DMC ${cell.dmc}`}
                        className={`w-7 h-7 sm:w-8 sm:h-8 border border-black/40 flex items-center justify-center text-xs font-bold transition-all relative cursor-pointer ${
                          isHighlighted ? 'opacity-100' : 'opacity-15 grayscale'
                        }`}
                        style={{
                          backgroundColor: isStitched ? '#143818' : thread.hex,
                          color: isStitched ? '#39ff14' : thread.textColor
                        }}
                      >
                        {/* Marca de completado o símbolo del gráfico */}
                        {isStitched ? (
                          <Check className="w-4 h-4 text-[#39ff14] stroke-[3]" />
                        ) : showSymbols ? (
                          <span className="text-[10px] font-mono leading-none">{thread.symbol}</span>
                        ) : (
                          <span className="text-[8px] opacity-40 font-mono">✕</span>
                        )}

                        {/* Coordenadas en bordes para facilitar lectura */}
                        {rIdx === 0 && (
                          <span className="absolute -top-3.5 text-[8px] font-mono text-neutral-500">{cIdx + 1}</span>
                        )}
                        {cIdx === 0 && (
                          <span className="absolute -left-3.5 text-[8px] font-mono text-neutral-500">{rIdx + 1}</span>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Pie con instrucciones de bordado */}
              <div className="mt-8 text-center text-xs font-mono text-neutral-400">
                {activeMode === 'stitch'
                  ? 'Haz clic sobre cada casilla de la grilla para tachar la cruz como terminada.'
                  : 'Modo visualización activo. Toca los códigos DMC de la izquierda para aislar colores.'}
              </div>

            </div>

          </div>

          {/* Footer de Acciones */}
          <div className="flex items-center justify-between px-5 py-3 bg-[#161414] border-t border-neutral-800 text-xs font-mono">
            <span className="text-neutral-400">
              PATRÓN ENCRIPTADO KUROPUNK · TALLER DE PUNTADA SUBVERSIVA
            </span>
            <button
              onClick={() => window.print()}
              className="px-4 py-1.5 bg-[#252020] hover:bg-[#e0141f] text-neutral-200 hover:text-white transition-colors border border-neutral-700 flex items-center gap-2"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>IMPRIMIR GUÍA DE COLOR</span>
            </button>
          </div>

          {/* Styled Confirmation Modal (No browser native "localhost dice" popups) */}
          <ConfirmModal
            isOpen={isConfirmResetOpen}
            title="REINICIAR PUNTADAS"
            message="¿Deseas reiniciar todas las puntadas marcadas en este patrón de punto cruz y comenzar desde cero?"
            confirmText="REINICIAR PUNTADAS"
            cancelText="CANCELAR"
            isDanger={true}
            onConfirm={confirmResetProgress}
            onClose={() => setIsConfirmResetOpen(false)}
          />
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};
