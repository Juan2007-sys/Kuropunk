import React, { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { useCart } from '../context/CartContext';
import { submitContactMessage } from '../services/api';
import { saveContactMessageInFirestore, uploadProductImage } from '../services/firebase';
import { formatCOP, generateCustomerToAdminWhatsAppUrl } from '../utils/formatters';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  MapPin,
  Mail,
  Camera,
  MessageSquare,
  ShieldCheck,
  CheckCircle,
  Sparkles,
  Upload,
  X,
  Clock,
  Layers,
  Ruler,
  HelpCircle,
  ArrowRight,
  MessageCircle,
  Phone,
  Instagram
} from 'lucide-react';

const PLATFORM_PRICE = 8000;

const COMMISSION_TYPES = [
  { id: 'amigurumi_anime', label: 'Amigurumi Anime / Idol / Personaje', basePrice: 30000, baseDays: 3 },
  { id: 'amigurumi_mascota', label: 'Mascota Personalizada a Crochet', basePrice: 35000, baseDays: 4 },
  { id: 'amigurumi_libre', label: 'Diseño Libre / Fanart Exclusivo', basePrice: 38000, baseDays: 4 },
  { id: 'punto_cruz', label: 'Gráfico Personalizado (Punto Cruz)', basePrice: 18000, baseDays: 2 },
];

const SIZE_OPTIONS = [
  { id: 'mini', label: 'Miniatura de Bolsillo (6 - 8 cm)', priceMod: 0, daysMod: 0, desc: 'Ideal para llevar de amuleto o llavero' },
  { id: 'estandar', label: 'Escala Estándar (14 - 16 cm)', priceMod: 10000, daysMod: 1, desc: 'El tamaño clásico de colección' },
  { id: 'grande', label: 'Gran Formato (20 - 25 cm)', priceMod: 20000, daysMod: 3, desc: 'Pieza de exhibición masiva de alto impacto' },
];

const COMPLEXITY_OPTIONS = [
  { id: 'basico', label: 'Básico (Liso / Pocos colores)', priceMod: 0, daysMod: 0 },
  { id: 'medio', label: 'Detallado (Ropa estructurada / Capa)', priceMod: 6000, daysMod: 1 },
  { id: 'avanzado', label: 'Épico (Armas / Báculo / Accesorios desmontables)', priceMod: 15000, daysMod: 2 },
];

export const ContactPage = () => {
  const { showToast } = useCart();

  // Wizard Configuration State
  const [step, setStep] = useState(1); // 1: Características | 2: Referencias | 3: Datos de Contacto
  const [selectedType, setSelectedType] = useState('amigurumi_anime');
  const [selectedSize, setSelectedSize] = useState('estandar');
  const [hasPlatform, setHasPlatform] = useState(true);
  const [selectedComplexity, setSelectedComplexity] = useState('medio');

  // Images state (local preview + files for upload)
  const [uploadedImages, setUploadedImages] = useState([]); // [{ file, previewUrl, remoteUrl }]
  const [uploadingImages, setUploadingImages] = useState(false);

  // Customer Contact State
  const [customerData, setCustomerData] = useState({
    name: '',
    phone: '',
    email: '',
    message: '',
  });

  const [isTransmitting, setIsTransmitting] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const [lastQuotePayload, setLastQuotePayload] = useState(null);

  // Dynamic calculations in real time
  const quoteCalculation = useMemo(() => {
    const typeObj = COMMISSION_TYPES.find((t) => t.id === selectedType) || COMMISSION_TYPES[0];
    const sizeObj = SIZE_OPTIONS.find((s) => s.id === selectedSize) || SIZE_OPTIONS[1];
    const compObj = COMPLEXITY_OPTIONS.find((c) => c.id === selectedComplexity) || COMPLEXITY_OPTIONS[1];

    const platformPrice = hasPlatform ? PLATFORM_PRICE : 0;
    const platformDays = hasPlatform ? 1 : 0;

    const totalPrice = typeObj.basePrice + sizeObj.priceMod + compObj.priceMod + platformPrice;
    const minDays = typeObj.baseDays + sizeObj.daysMod + compObj.daysMod + platformDays;
    const maxDays = minDays + 2;

    return {
      totalPrice,
      estimatedDays: `${minDays} a ${maxDays}`,
      typeObj,
      sizeObj,
      compObj,
    };
  }, [selectedType, selectedSize, hasPlatform, selectedComplexity]);

  // Handle local image file selection
  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    if (uploadedImages.length + files.length > 4) {
      showToast('MÁXIMO 4 IMÁGENES DE REFERENCIA', 'warning');
      return;
    }

    const newEntries = files.map((file) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      remoteUrl: '',
    }));

    setUploadedImages((prev) => [...prev, ...newEntries]);
  };

  const removeImage = (indexToRemove) => {
    setUploadedImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
  };

  // Submit quote to DB
  const handleSubmitQuote = async (e) => {
    if (e && e.preventDefault) e.preventDefault();

    if (!customerData.name.trim()) {
      showToast('POR FAVOR INGRESA TU NOMBRE O ALIAS', 'warning');
      return;
    }

    const cleanPhone = customerData.phone.replace(/\D/g, '');
    if (cleanPhone.length < 7) {
      showToast('INGRESA UN CELULAR CON WHATSAPP VÁLIDO', 'warning');
      return;
    }

    setIsTransmitting(true);

    try {
      // 1. Subir imágenes si existen a Firebase Storage
      let finalImageUrls = [];
      if (uploadedImages.length > 0) {
        setUploadingImages(true);
        for (const item of uploadedImages) {
          try {
            const url = await uploadProductImage(item.file, 'comision');
            finalImageUrls.push(url);
          } catch (err) {
            console.warn('[Storage Error] Usando previsualización local:', err);
            finalImageUrls.push(item.previewUrl);
          }
        }
        setUploadingImages(false);
      }

      const commissionPayload = {
        name: customerData.name.trim(),
        phone: customerData.phone.trim(),
        email: customerData.email.trim() || `${cleanPhone}@comision.kuropunk.com`,
        type: selectedType,
        typeLabel: quoteCalculation.typeObj.label,
        size: selectedSize,
        sizeLabel: quoteCalculation.sizeObj.label,
        hasPlatform,
        complexity: selectedComplexity,
        complexityLabel: quoteCalculation.compObj.label,
        estimatedPrice: quoteCalculation.totalPrice,
        estimatedDays: quoteCalculation.estimatedDays,
        message: customerData.message.trim(),
        images: finalImageUrls,
        status: 'PENDIENTE_CONTACTO',
      };

      // 1. Guardar en Firebase Firestore y LocalStorage para el Radar en tiempo real del Administrador
      try {
        await saveContactMessageInFirestore(commissionPayload);
      } catch {}

      // 2. Guardar en SQLite Backend en segundo plano (asíncrono, sin bloquear UI)
      submitContactMessage({
        name: commissionPayload.name,
        email: commissionPayload.email,
        type: `commission_${commissionPayload.type}`.slice(0, 40),
        message: `[COTIZACIÓN ESTIMADA: ${formatCOP(commissionPayload.estimatedPrice)} - ${commissionPayload.estimatedDays} días] | Pieza: ${commissionPayload.typeLabel} | Tamaño: ${commissionPayload.sizeLabel} | Base: ${hasPlatform ? 'SÍ' : 'NO'} | Celular: ${commissionPayload.phone} | Idea: ${commissionPayload.message}`,
      }).catch(() => {});

      setLastQuotePayload(commissionPayload);
      setIsSent(true);
      showToast('¡COTIZACIÓN TRANSMITIDA CON ÉXITO AL TALLER!', 'success');
    } catch (err) {
      showToast('ERROR AL REGISTRAR COTIZACIÓN: ' + (err?.message || 'Intenta de nuevo'), 'error');
    } finally {
      setIsTransmitting(false);
      setUploadingImages(false);
    }
  };

  const resetWizard = () => {
    setIsSent(false);
    setStep(1);
    setUploadedImages([]);
    setCustomerData({ name: '', phone: '', email: '', message: '' });
  };

  return (
    <div className="w-full pt-8 pb-24 bg-[#141313] relative min-h-screen text-[#e6e1e1]">
      {/* Background ambient lighting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-[#e0141f]/10 blur-3xl rounded-full"></div>
        <div className="absolute bottom-1/4 right-0 w-[600px] h-[600px] bg-[#e0141f]/08 blur-3xl rounded-full"></div>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto w-full px-4 sm:px-8 md:px-16 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start mt-6">
        
        {/* Left Column: HQ Branding & Estimator Card (lg: 5 cols) */}
        <motion.div
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-5 flex flex-col gap-6"
        >
          <div className="space-y-3">
            <span className="font-mono text-xs text-[#e0141f] uppercase tracking-widest font-bold flex items-center gap-2">
              <Sparkles className="w-3.5 h-3.5" />
              TALLER DE COMISIONES · 1-DE-1
            </span>
            <h1 className="font-stencil text-4xl sm:text-5xl lg:text-6xl leading-none text-[#e6e1e1] uppercase tracking-tight">
              Cotiza Tu<br />
              <span className="text-[#e0141f]">Pieza Única</span>
            </h1>
            <p className="font-body-md text-sm text-[#e7bcb8]/80 leading-relaxed">
              Configura las características de tu amigurumi o gráfico personalizado. El sistema calculará una estimación inmediata de precio y tiempo de confección para que nuestro equipo te oriente por WhatsApp.
            </p>
          </div>

          {/* Tarjeta Flotante en Vivo de Cotización */}
          <div className="bg-[#1d1b1b] brutalist-border border-[#e0141f] p-5 shadow-[0_0_30px_rgba(224,20,31,0.2)] relative space-y-4">
            <div className="flex items-center justify-between border-b border-[#5e3f3c] pb-3">
              <span className="font-mono text-[11px] text-[#ffb4ab] uppercase font-bold tracking-wider">
                ESTIMACIÓN EN TIEMPO REAL
              </span>
              <span className="px-2 py-0.5 bg-[#e0141f]/20 border border-[#e0141f] text-[#ffb4ab] font-mono text-[10px] uppercase">
                TALLER BOGOTÁ
              </span>
            </div>

            <div className="space-y-2 font-mono text-xs text-neutral-300">
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Escala / Formato:</span>
                <strong className="text-white">{quoteCalculation.sizeObj.label.split('(')[0]}</strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Plataforma de Exhibición:</span>
                <strong className={hasPlatform ? 'text-emerald-400' : 'text-neutral-500'}>
                  {hasPlatform ? `INCLUIDA (+ ${formatCOP(PLATFORM_PRICE)})` : 'SIN PLATAFORMA'}
                </strong>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-400">Nivel de Detalle:</span>
                <strong className="text-white">{quoteCalculation.compObj.label.split('(')[0]}</strong>
              </div>
            </div>

            <div className="border-t border-[#5e3f3c] pt-4 grid grid-cols-2 gap-3 items-center">
              <div>
                <span className="font-mono text-[10px] text-neutral-400 uppercase block">VALOR ESTIMADO</span>
                <strong className="font-headline-md text-2xl sm:text-3xl text-[#ffb4ab]">
                  {formatCOP(quoteCalculation.totalPrice)}
                </strong>
              </div>
              <div className="border-l border-[#5e3f3c] pl-3">
                <span className="font-mono text-[10px] text-neutral-400 uppercase flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#e0141f]" /> TIEMPO DE TALLER
                </span>
                <strong className="font-mono text-sm sm:text-base text-white block pt-1">
                  {quoteCalculation.estimatedDays} días hábiles
                </strong>
              </div>
            </div>

            <p className="font-mono text-[10px] text-neutral-500 italic leading-snug">
              * Precio y fecha tentativa sujetos a confirmación de materiales y detalles por parte del artesano.
            </p>
          </div>

          {/* Coordenadas & Contacto Directo */}
          <div className="bg-[#211f1f] p-4 brutalist-border border-[#5e3f3c] space-y-2">
            <div className="font-mono text-xs text-[#ffb4ab] uppercase flex items-center gap-2">
              <Phone className="w-3.5 h-3.5 text-[#e0141f]" /> LÍNEA DIRECTA DEL TALLER
            </div>
            <p className="font-mono text-sm text-[#e6e1e1]">
              WhatsApp Oficial: <span className="text-emerald-400 font-bold">+57 323 8937221</span>
            </p>
            <p className="font-mono text-xs text-[#e6e1e1] flex items-center gap-1.5 pt-0.5">
              <Instagram className="w-3.5 h-3.5 text-[#e0141f]" />
              Instagram:{' '}
              <a
                href="https://www.instagram.com/kuropunk_/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#ffb4ab] underline hover:text-white font-bold"
              >
                @kuropunk_
              </a>
            </p>
            <div className="text-[11px] font-mono text-[#8a8a86] pt-1">
              Bogotá, Colombia • Respondemos en orden de llegada.
            </div>
          </div>
        </motion.div>

        {/* Right Column: Wizard Form Steps (lg: 7 cols) */}
        <motion.div
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="lg:col-span-7 bg-[#211f1f] brutalist-border border-[#5e3f3c] p-6 sm:p-8 relative staple-corner shadow-2xl"
        >
          {/* Tape Overlay */}
          <div className="tape-overlay !top-[-12px] !right-6 !left-auto !bg-[#e0141f] !text-[#fff4f3] rotate-1 font-mono">
            PASO {step} DE 3 · FORMULARIO TÁCTICO
          </div>

          {/* SUCCESS SCREEN */}
          {isSent ? (
            <div className="py-8 flex flex-col items-center justify-center text-center space-y-5">
              <div className="w-20 h-20 bg-[#141313] border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div className="space-y-2 max-w-md">
                <h3 className="font-headline-md text-3xl uppercase text-white">
                  ¡COTIZACIÓN TRANSMITIDA!
                </h3>
                <p className="font-mono text-xs text-neutral-300 leading-relaxed">
                  Tu solicitud ha quedado registrada en nuestro sistema de taller.
                </p>
              </div>

              {/* Mensaje de expectativa de contacto */}
              <div className="w-full max-w-md p-4 bg-[#141313] border border-[#5e3f3c] text-left space-y-2 font-mono text-xs">
                <div className="text-[#ffb4ab] font-bold flex items-center gap-2">
                  <MessageCircle className="w-4 h-4 text-emerald-400" />
                  <span>¿QUÉ SUCEDE AHORA?</span>
                </div>
                <p className="text-neutral-300 leading-relaxed text-[11px]">
                  Un artesano de KuroPunk se comunicará a tu WhatsApp (<strong className="text-white">{lastQuotePayload?.phone}</strong>) diciendo:
                </p>
                <div className="p-3 bg-[#1d1b1b] border-l-2 border-[#e0141f] text-neutral-300 italic text-[11px]">
                  "Hola {lastQuotePayload?.name}, soy del equipo de KuroPunk. Recibimos tu cotización para un {lastQuotePayload?.typeLabel}... quiero conocer más detalles de tu idea y orientarte con el diseño."
                </div>
              </div>

              {/* Opción alternativa si el cliente tiene prisa */}
              {lastQuotePayload && (
                <div className="w-full max-w-md space-y-2 pt-2">
                  <span className="font-mono text-[10px] text-neutral-400 uppercase block">
                    ¿DESEAS AGILIZAR Y HABLAR CON EL TALLER AHORA MISMO?
                  </span>
                  <a
                    href={generateCustomerToAdminWhatsAppUrl(lastQuotePayload)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 bg-[#25D366] hover:bg-[#20bd5a] text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-transform hover:scale-[1.01] shadow-lg"
                  >
                    <MessageCircle className="w-5 h-5 fill-black" />
                    <span>Abrir Chat con el Taller (+57 323 8937221)</span>
                    <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              )}

              <button
                onClick={resetWizard}
                className="pt-3 text-neutral-400 hover:text-white font-mono text-xs underline uppercase tracking-wider"
              >
                Hacer otra cotización
              </button>
            </div>
          ) : (
            <div>
              {/* Stepper Progress Bar */}
              <div className="grid grid-cols-3 gap-2 mb-8 pt-2">
                {[
                  { num: 1, label: '1. Pieza & Escala' },
                  { num: 2, label: '2. Fotos & Referencias' },
                  { num: 3, label: '3. Contacto & Despacho' },
                ].map((s) => (
                  <div key={s.num} className="space-y-1">
                    <div
                      className={`h-1.5 transition-colors ${
                        step >= s.num ? 'bg-[#e0141f]' : 'bg-[#363434]'
                      }`}
                    />
                    <span
                      className={`font-mono text-[10px] uppercase block ${
                        step === s.num ? 'text-[#ffb4ab] font-bold' : 'text-neutral-500'
                      }`}
                    >
                      {s.label}
                    </span>
                  </div>
                ))}
              </div>

              {/* STEP 1: CONFIGURACIÓN DE PIEZA */}
              {step === 1 && (
                <div className="space-y-6">
                  {/* Tipo de Pieza */}
                  <div className="space-y-2">
                    <label className="font-mono text-xs text-[#ffb4ab] uppercase font-bold tracking-wider block">
                      A. ¿Qué tipo de creación deseas encargar?
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {COMMISSION_TYPES.map((t) => (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => setSelectedType(t.id)}
                          className={`p-3 text-left font-mono text-xs border transition-all ${
                            selectedType === t.id
                              ? 'border-[#e0141f] bg-[#e0141f]/20 text-white font-bold shadow-[2px_2px_0px_#e0141f]'
                              : 'border-[#5e3f3c] bg-[#141313] text-neutral-400 hover:text-white'
                          }`}
                        >
                          <span className="block text-white font-bold">{t.label}</span>
                          <span className="text-[10px] text-neutral-400 block pt-1">
                            Base: {formatCOP(t.basePrice)} • ~{t.baseDays} días
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Tamaño / Escala */}
                  <div className="space-y-2">
                    <label className="font-mono text-xs text-[#ffb4ab] uppercase font-bold tracking-wider block">
                      B. Escala / Dimensiones de la Pieza
                    </label>
                    <div className="space-y-2">
                      {SIZE_OPTIONS.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => setSelectedSize(s.id)}
                          className={`w-full p-3 text-left font-mono text-xs border flex items-center justify-between transition-all ${
                            selectedSize === s.id
                              ? 'border-[#e0141f] bg-[#e0141f]/20 text-white font-bold'
                              : 'border-[#5e3f3c] bg-[#141313] text-neutral-400 hover:text-white'
                          }`}
                        >
                          <div>
                            <span className="text-white block font-bold">{s.label}</span>
                            <span className="text-[10px] text-neutral-400">{s.desc}</span>
                          </div>
                          <span className="text-[#ffb4ab] font-bold shrink-0 pl-2">
                            {s.priceMod === 0 ? 'Estándar' : `+ ${formatCOP(s.priceMod)}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Plataforma de Exhibición */}
                  <div className="p-3 bg-[#141313] border border-[#5e3f3c] flex items-center justify-between">
                    <div>
                      <span className="font-mono text-xs text-white font-bold block">
                        ¿Incluir plataforma artesanal de exhibición?
                      </span>
                      <span className="font-mono text-[10px] text-neutral-400">
                        Base rígida texturizada con soporte para exhibición permanente (+ {formatCOP(PLATFORM_PRICE)})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setHasPlatform(!hasPlatform)}
                      className={`px-4 py-2 font-mono text-xs font-bold uppercase border transition-colors shrink-0 ${
                        hasPlatform
                          ? 'bg-[#e0141f] border-[#e0141f] text-white'
                          : 'bg-[#1d1b1b] border-[#5e3f3c] text-neutral-400'
                      }`}
                    >
                      {hasPlatform ? 'SÍ, INCLUIR' : 'NO, SIN BASE'}
                    </button>
                  </div>

                  {/* Complejidad */}
                  <div className="space-y-2">
                    <label className="font-mono text-xs text-[#ffb4ab] uppercase font-bold tracking-wider block">
                      C. Nivel de Detalle y Accesorios
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      {COMPLEXITY_OPTIONS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setSelectedComplexity(c.id)}
                          className={`p-2.5 text-left font-mono text-xs border transition-all ${
                            selectedComplexity === c.id
                              ? 'border-[#e0141f] bg-[#e0141f]/20 text-white font-bold'
                              : 'border-[#5e3f3c] bg-[#141313] text-neutral-400 hover:text-white'
                          }`}
                        >
                          <span className="block text-white font-bold text-[11px]">{c.label}</span>
                          <span className="text-[10px] text-[#ffb4ab] block pt-1">
                            {c.priceMod === 0 ? 'Sin recargo' : `+ ${formatCOP(c.priceMod)}`}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setStep(2)}
                    className="w-full py-3.5 bg-[#e0141f] hover:bg-[#c0101a] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 transition-colors mt-4"
                  >
                    <span>Continuar a Fotos y Referencias</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              )}

              {/* STEP 2: SUBIDA DE FOTOS Y DESCRIPCIÓN */}
              {step === 2 && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-mono text-xs text-[#ffb4ab] uppercase font-bold tracking-wider block mb-1">
                      Adjuntar Imágenes de Referencia (Opcional)
                    </h3>
                    <p className="font-mono text-xs text-neutral-400">
                      Sube fotos del personaje, dibujo, esquema de colores o modelo que deseas recrear (hasta 4 imágenes).
                    </p>
                  </div>

                  {/* Upload Box */}
                  <div className="border-2 border-dashed border-[#5e3f3c] hover:border-[#ffb4ab] p-6 text-center bg-[#141313] transition-colors relative">
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                    />
                    <div className="flex flex-col items-center justify-center space-y-2 pointer-events-none">
                      <Upload className="w-8 h-8 text-[#ffb4ab]" />
                      <span className="font-mono text-xs text-white uppercase font-bold">
                        Haz clic o arrastra fotos aquí
                      </span>
                      <span className="font-mono text-[10px] text-neutral-500">
                        Formatos JPG, PNG, WEBP (Hasta 4 fotos)
                      </span>
                    </div>
                  </div>

                  {/* Image Previews */}
                  {uploadedImages.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} className="relative aspect-square border border-[#5e3f3c] bg-black group overflow-hidden">
                          <img
                            src={img.previewUrl}
                            alt={`Referencia ${idx + 1}`}
                            className="w-full h-full object-cover"
                          />
                          <button
                            type="button"
                            onClick={() => removeImage(idx)}
                            className="absolute top-1 right-1 bg-black/80 hover:bg-red-600 text-white p-1 rounded-full transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Message Input */}
                  <div className="space-y-1">
                    <label className="font-mono text-xs text-[#ffb4ab] uppercase font-bold tracking-wider block">
                      Cuéntanos los detalles de tu idea
                    </label>
                    <textarea
                      rows={3}
                      value={customerData.message}
                      onChange={(e) => setCustomerData({ ...customerData, message: e.target.value })}
                      placeholder="Describe la pose, vestimenta, colores específicos o cualquier detalle importante..."
                      className="w-full bg-[#141313] border border-[#5e3f3c] focus:border-[#e0141f] outline-none font-mono text-xs text-white p-3 placeholder:text-neutral-600 resize-none"
                    ></textarea>
                  </div>

                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="w-1/3 py-3 border border-[#5e3f3c] hover:border-white font-mono text-xs uppercase text-neutral-300"
                    >
                      Atrás
                    </button>
                    <button
                      type="button"
                      onClick={() => setStep(3)}
                      className="w-2/3 py-3 bg-[#e0141f] hover:bg-[#c0101a] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2"
                    >
                      <span>Continuar a Contacto</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}

              {/* STEP 3: DATOS DEL CLIENTE Y ENVÍO */}
              {step === 3 && (
                <form onSubmit={handleSubmitQuote} className="space-y-5">
                  <div>
                    <h3 className="font-mono text-xs text-[#ffb4ab] uppercase font-bold tracking-wider block mb-1">
                      ¿A qué número de WhatsApp te contactamos?
                    </h3>
                    <p className="font-mono text-xs text-neutral-400">
                      Nuestro artesano revisará tu solicitud y te escribirá directamente para orientarte con la cotización.
                    </p>
                  </div>

                  {/* Nombre */}
                  <div className="space-y-1">
                    <label className="font-mono text-[11px] text-[#ffb4ab] uppercase block">
                      Nombre Completo o Alias *
                    </label>
                    <input
                      type="text"
                      value={customerData.name}
                      onChange={(e) => setCustomerData({ ...customerData, name: e.target.value })}
                      placeholder="e.g. Santiago Vélez"
                      required
                      className="w-full min-h-[44px] bg-[#141313] border-b-2 border-[#5e3f3c] focus:border-[#e0141f] outline-none font-mono text-xs text-white px-3"
                    />
                  </div>

                  {/* Celular WhatsApp */}
                  <div className="space-y-1">
                    <label className="font-mono text-[11px] text-[#ffb4ab] uppercase block">
                      Celular / WhatsApp (Donde te escribiremos) *
                    </label>
                    <div className="flex items-center bg-[#141313] border-b-2 border-[#5e3f3c] focus-within:border-[#e0141f]">
                      <span className="font-mono text-xs text-neutral-500 px-3">+57</span>
                      <input
                        type="tel"
                        value={customerData.phone}
                        onChange={(e) => setCustomerData({ ...customerData, phone: e.target.value })}
                        placeholder="300 123 4567"
                        required
                        className="w-full min-h-[44px] bg-transparent outline-none font-mono text-xs text-white pr-3"
                      />
                    </div>
                  </div>

                  {/* Email */}
                  <div className="space-y-1">
                    <label className="font-mono text-[11px] text-neutral-400 uppercase block">
                      Correo Electrónico (Opcional)
                    </label>
                    <input
                      type="email"
                      value={customerData.email}
                      onChange={(e) => setCustomerData({ ...customerData, email: e.target.value })}
                      placeholder="cliente@ejemplo.com"
                      className="w-full min-h-[44px] bg-[#141313] border-b-2 border-[#5e3f3c] focus:border-[#e0141f] outline-none font-mono text-xs text-white px-3"
                    />
                  </div>

                  <div className="flex gap-3 pt-3">
                    <button
                      type="button"
                      onClick={() => setStep(2)}
                      className="w-1/3 py-3 border border-[#5e3f3c] hover:border-white font-mono text-xs uppercase text-neutral-300"
                    >
                      Atrás
                    </button>
                    <button
                      type="submit"
                      disabled={isTransmitting}
                      className="w-2/3 py-3.5 bg-[#e0141f] hover:bg-[#c0101a] text-white font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(224,20,31,0.3)] disabled:opacity-50"
                    >
                      <span>{isTransmitting ? 'TRANSMITIENDO AL TALLER...' : 'Transmitir Cotización'}</span>
                      <Send className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-center gap-2 text-[10px] text-neutral-500 font-mono text-center pt-2">
                    <ShieldCheck className="w-3.5 h-3.5 text-[#ffb4ab]" />
                    <span>Te contactaremos de forma personalizada sin spam ni bots automatizados.</span>
                  </div>
                </form>
              )}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
};
