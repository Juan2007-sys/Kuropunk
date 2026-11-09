import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, 
  Plus, 
  Minus, 
  RotateCcw, 
  Volume2, 
  VolumeX, 
  BookOpen, 
  Edit3, 
  Check, 
  Scissors, 
  Hammer,
  HelpCircle
} from 'lucide-react';
import { ConfirmModal } from './ConfirmModal';

// Generador de sonido sintético tipo clic mecánico con Web Audio API
const playMechanicalClick = (soundEnabled = true) => {
  if (!soundEnabled || typeof window === 'undefined') return;
  try {
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(800, audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(150, audioCtx.currentTime + 0.04);

    gain.gain.setValueAtTime(0.3, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.04);

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    osc.start();
    osc.stop(audioCtx.currentTime + 0.04);
  } catch (e) {
    // Audio no soportado o bloqueado por el navegador
  }
};

const CROCHET_GLOSSARY = [
  { abbr: 'am', name: 'Anillo Mágico', desc: 'Base circular para iniciar cabezas y extremidades sin orificio central.' },
  { abbr: 'pb', name: 'Punto Bajo', desc: 'Puntada básica del amigurumi (single crochet). Tensión firme.' },
  { abbr: 'aum', name: 'Aumento', desc: 'Tejer 2 puntos bajos dentro del mismo punto de la vuelta anterior (+1 pt).' },
  { abbr: 'dism', name: 'Disminución', desc: 'Tomar solo las hebras delanteras de 2 puntos y tejerlos juntos (-1 pt).' },
  { abbr: 'pma', name: 'Punto Medio Alto', desc: 'Media vareta; lazada previa y cerrar los 3 bucles juntos.' },
  { abbr: 'pa', name: 'Punto Alto', desc: 'Vareta completa; proporciona altura para capas y detalles urbanos.' },
  { abbr: 'pe', name: 'Punto Enano / Raso', desc: 'Punto deslizado para rematar o cambiar de color limpiamente.' },
  { abbr: 'cad', name: 'Cadeneta', desc: 'Puntada al aire para iniciar tiras, cadenas o correas tácticas.' }
];

export const WorkshopHUDModal = ({ isOpen, onClose, currentPatternTitle = "Proyecto Activo en Taller" }) => {
  const [currentRound, setCurrentRound] = useState(1);
  const [totalRounds, setTotalRounds] = useState(36);
  const [currentStitch, setCurrentStitch] = useState(1);
  const [targetStitches, setTargetStitches] = useState(18);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activeTab, setActiveTab] = useState('counter'); // 'counter' | 'glossary' | 'notes'
  const [projectNotes, setProjectNotes] = useState('');
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);

  // Cargar estado persistente de localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('kuropunk_hud_state');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.currentRound) setCurrentRound(parsed.currentRound);
        if (parsed.totalRounds) setTotalRounds(parsed.totalRounds);
        if (parsed.currentStitch) setCurrentStitch(parsed.currentStitch);
        if (parsed.targetStitches) setTargetStitches(parsed.targetStitches);
        if (parsed.projectNotes) setProjectNotes(parsed.projectNotes);
        if (typeof parsed.soundEnabled === 'boolean') setSoundEnabled(parsed.soundEnabled);
      }
    } catch (e) {}
  }, []);

  // Guardar estado persistente
  useEffect(() => {
    try {
      localStorage.setItem('kuropunk_hud_state', JSON.stringify({
        currentRound,
        totalRounds,
        currentStitch,
        targetStitches,
        projectNotes,
        soundEnabled
      }));
    } catch (e) {}
  }, [currentRound, totalRounds, currentStitch, targetStitches, projectNotes, soundEnabled]);

  const handleNextRound = () => {
    playMechanicalClick(soundEnabled);
    setCurrentRound(r => r + 1);
    setCurrentStitch(1);
  };

  const handlePrevRound = () => {
    playMechanicalClick(soundEnabled);
    setCurrentRound(r => Math.max(1, r - 1));
  };

  const handleNextStitch = () => {
    playMechanicalClick(soundEnabled);
    if (currentStitch >= targetStitches) {
      handleNextRound();
    } else {
      setCurrentStitch(s => s + 1);
    }
  };

  const handleReset = () => {
    setIsConfirmResetOpen(true);
  };

  const confirmReset = () => {
    setCurrentRound(1);
    setCurrentStitch(1);
    setIsConfirmResetOpen(false);
  };

  if (!isOpen) return null;

  const progressPercent = totalRounds > 0 ? Math.min(100, Math.round((currentRound / totalRounds) * 100)) : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md overflow-y-auto overscroll-contain">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-[#0f0e0e] border-2 border-[#e0141f] w-full max-w-xl my-auto max-h-[92dvh] flex flex-col shadow-2xl overflow-hidden font-mono text-neutral-200"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 sm:px-5 py-3 bg-[#171515] border-b border-neutral-800 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0 pr-2">
              <Hammer className="w-4 h-4 text-[#e0141f] shrink-0" />
              <div className="min-w-0">
                <h3 className="text-xs sm:text-sm font-bold text-white uppercase tracking-wider truncate">
                  HUD MODO TALLER // VUELTAS
                </h3>
                <p className="text-[10px] text-[#ffb4ab] uppercase truncate">
                  {currentPatternTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setSoundEnabled(!soundEnabled)}
                title={soundEnabled ? 'Silenciar clics' : 'Activar sonido mecánico'}
                aria-label="Alternar sonido mecánico"
                className="w-11 h-11 flex items-center justify-center text-neutral-400 hover:text-white bg-[#221c1c] border border-neutral-700 transition-colors"
              >
                {soundEnabled ? <Volume2 className="w-4 h-4 text-[#39ff14]" /> : <VolumeX className="w-4 h-4 text-neutral-500" />}
              </button>
              <button
                onClick={onClose}
                aria-label="Cerrar HUD taller"
                className="w-11 h-11 flex items-center justify-center text-neutral-400 hover:text-white bg-[#221c1c] hover:bg-[#e0141f] border border-neutral-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navegación por Pestañas */}
          <div className="flex border-b border-neutral-800 bg-[#121111] text-xs shrink-0">
            <button
              onClick={() => setActiveTab('counter')}
              className={`flex-1 min-h-[44px] flex items-center justify-center px-2 py-2 text-center font-bold tracking-wider transition-colors ${
                activeTab === 'counter'
                  ? 'bg-[#1e1717] text-[#ffb4ab] border-b-2 border-[#e0141f]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              1. CONTADOR
            </button>
            <button
              onClick={() => setActiveTab('glossary')}
              className={`flex-1 min-h-[44px] flex items-center justify-center px-2 py-2 text-center font-bold tracking-wider transition-colors ${
                activeTab === 'glossary'
                  ? 'bg-[#1e1717] text-[#ffb4ab] border-b-2 border-[#e0141f]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              2. GLOSARIO
            </button>
            <button
              onClick={() => setActiveTab('notes')}
              className={`flex-1 min-h-[44px] flex items-center justify-center px-2 py-2 text-center font-bold tracking-wider transition-colors ${
                activeTab === 'notes'
                  ? 'bg-[#1e1717] text-[#ffb4ab] border-b-2 border-[#e0141f]'
                  : 'text-neutral-400 hover:text-white'
              }`}
            >
              3. NOTAS
            </button>
          </div>

          {/* Tab 1: Contador Táctico */}
          {activeTab === 'counter' && (
            <div className="p-6 space-y-6">
              
              {/* Pantalla Gigante de Vuelta */}
              <div className="bg-[#090808] border-2 border-neutral-800 p-6 flex flex-col items-center justify-center relative shadow-inner">
                <span className="text-xs text-[#ffb4ab] tracking-widest uppercase mb-1">
                  VUELTA / RONDA ACTUAL
                </span>
                
                <div className="text-7xl sm:text-8xl font-black text-white tracking-tighter my-1 text-center font-mono">
                  {currentRound}
                </div>

                <div className="flex items-center gap-2 text-xs text-neutral-400 mt-1">
                  <span>DE UN TOTAL ESTIMADO DE:</span>
                  <input
                    type="number"
                    min="1"
                    max="999"
                    value={totalRounds}
                    onChange={(e) => setTotalRounds(Math.max(1, parseInt(e.target.value) || 1))}
                    className="w-16 bg-[#161414] border border-neutral-700 px-2 py-0.5 text-center text-white font-bold"
                  />
                  <span>VUELTAS</span>
                </div>

                {/* Barra de Progreso */}
                <div className="w-full mt-4 bg-neutral-900 h-2 border border-neutral-800 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-[#e0141f] to-[#39ff14] transition-all duration-300"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
                <div className="w-full flex justify-between text-[10px] text-neutral-500 mt-1">
                  <span>INICIO</span>
                  <span className="text-[#39ff14] font-bold">{progressPercent}% COMPLETADO</span>
                  <span>FINAL</span>
                </div>
              </div>

              {/* Botonera de Vueltas Primaria */}
              <div className="grid grid-cols-3 gap-3">
                <button
                  onClick={handlePrevRound}
                  className="py-4 bg-[#1a1717] hover:bg-[#252020] text-neutral-300 hover:text-white border border-neutral-700 font-bold text-sm flex items-center justify-center gap-2 active:scale-95"
                >
                  <Minus className="w-4 h-4" />
                  <span>-1 VUELTA</span>
                </button>

                <button
                  onClick={handleNextRound}
                  className="col-span-2 py-4 bg-[#e0141f] hover:bg-red-700 text-white font-bold text-base flex items-center justify-center gap-2 shadow-lg active:scale-95 border border-red-500"
                >
                  <Plus className="w-5 h-5 stroke-[3]" />
                  <span>+1 VUELTA (SIGUIENTE)</span>
                </button>
              </div>

              {/* Contador de Puntos de la Vuelta */}
              <div className="p-4 bg-[#141212] border border-neutral-800 flex items-center justify-between">
                <div>
                  <div className="text-xs text-neutral-400 uppercase">PUNTO DENTRO DE LA VUELTA:</div>
                  <div className="text-xl font-bold text-[#ffb4ab]">
                    Punto {currentStitch} de {targetStitches}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setCurrentStitch(s => Math.max(1, s - 1))}
                    aria-label="Restar un punto"
                    className="w-10 h-10 min-w-[40px] min-h-[40px] bg-[#201c1c] text-white flex items-center justify-center border border-neutral-700 active:scale-95 transition-all"
                  >
                    -
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStitch}
                    aria-label="Avanzar un punto"
                    className="min-h-[40px] px-4 py-2 bg-[#39ff14] text-black font-bold text-xs uppercase flex items-center gap-1 active:scale-95 transition-all shadow-md"
                  >
                    <span>+1 PUNTO</span>
                  </button>
                </div>
              </div>

              {/* Reset */}
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="min-h-[44px] text-xs text-neutral-400 hover:text-red-400 flex items-center gap-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>REINICIAR VUELTAS</span>
                </button>
                <span className="text-[11px] text-neutral-500 hidden sm:inline">
                  Progreso guardado automáticamente en el navegador.
                </span>
              </div>

            </div>
          )}

          {/* Tab 2: Glosario de Puntos */}
          {activeTab === 'glossary' && (
            <div data-lenis-prevent="true" className="p-5 space-y-3 max-h-[60vh] overflow-y-auto custom-scrollbar">
              <p className="text-xs text-[#ffb4ab] mb-2">
                DICCIONARIO DE ABREVIATURAS USUALES EN PATRONES KUROPUNK:
              </p>
              {CROCHET_GLOSSARY.map((item) => (
                <div key={item.abbr} className="p-3 bg-[#151313] border border-neutral-800">
                  <div className="flex items-baseline gap-2">
                    <span className="px-2 py-0.5 bg-[#e0141f] text-white font-bold text-xs">
                      {item.abbr}
                    </span>
                    <span className="font-bold text-neutral-200 text-xs">{item.name}</span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1 font-body-md">
                    {item.desc}
                  </p>
                </div>
              ))}
            </div>
          )}

          {/* Tab 3: Notas de Tensión */}
          {activeTab === 'notes' && (
            <div className="p-5 space-y-4">
              <div>
                <label className="text-xs text-[#ffb4ab] uppercase block mb-1">
                  BITÁCORA DEL ARTESANO (NÚMERO DE AGUJA, LOTE DE LANA, MODIFICACIONES):
                </label>
                <textarea
                  rows={6}
                  value={projectNotes}
                  onChange={(e) => setProjectNotes(e.target.value)}
                  placeholder="Ej: Usé aguja de 2.2mm para mayor firmeza en el torso. En la vuelta 15 cambiar al hilo rojo carbón..."
                  className="w-full bg-[#141212] border border-neutral-700 p-3 text-base sm:text-xs min-h-[120px] text-white outline-none focus:border-[#e0141f] resize-none"
                />
              </div>
              <p className="text-[11px] text-neutral-400">
                Estas notas persisten aunque cierres la ventana o recargues la página.
              </p>
            </div>
          )}

          {/* Styled Confirmation Modal (No browser native "localhost dice" popups) */}
          <ConfirmModal
            isOpen={isConfirmResetOpen}
            title="REINICIAR CONTADOR"
            message="¿Deseas reiniciar el contador de vueltas y puntos de esta sesión a la vuelta 1?"
            confirmText="REINICIAR"
            cancelText="CANCELAR"
            isDanger={true}
            onConfirm={confirmReset}
            onClose={() => setIsConfirmResetOpen(false)}
          />

        </motion.div>
      </div>
    </AnimatePresence>
  );
};
