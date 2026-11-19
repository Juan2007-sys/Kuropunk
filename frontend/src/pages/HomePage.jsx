import React from 'react';
import { PRODUCTS } from '../data/products';
import { ProductCard } from '../components/ProductCard';
import { AntiGravityHeroShowcase } from '../components/AntiGravityHeroShowcase';
import { motion } from 'framer-motion';
import { ArrowRight, Wrench, Sparkles, Flame, ShieldAlert } from 'lucide-react';

export const HomePage = ({ setCurrentView, onSelectProduct }) => {
  const activeProducts = PRODUCTS.filter((p) => p.isActive !== false);
  const heroProduct = activeProducts.find((p) => p.isHero) || activeProducts[0] || PRODUCTS[0];
  const latestDrops = activeProducts.slice(0, 3);

  return (
    <div className="flex flex-col w-full">
      {/* 1. HERO SECTION */}
      <section className="relative w-full min-h-[85vh] flex items-center justify-center overflow-hidden -mt-20 pt-28 pb-16">
        {/* Background Concrete Decay Image */}
        <div
          className="absolute inset-0 bg-cover bg-center opacity-35 sm:opacity-40 sm:mix-blend-luminosity"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuBl3lwFZUMfheqnSQOHnN-MKt0EgDSq_vJmUd9_8iNJ5ye05z5hcIwBag8_YIzL-JkyPny6tO2ft5SnD4fZ1OP4osRThAUHckQjVAlJiUr4-SuBjpTLK82jTm8wuMPJasWe2mU3d-lNH0_lPj4rReYeUXDbnu2MMYipoyAxvg2ph-lF4Id2xw0w0w6GVsf1MSztnkj9edWDzFJ2ntwoUO5gC_wMFf2Imqe1Y2l_Tpt5g0qaqwNlMfO2')`
          }}
        ></div>
        <div className="absolute inset-0 bg-[#141313]/80"></div>

        {/* Diagonal Spray Overlays */}
        <div className="spray-stroke-red top-1/4 -left-1/4 w-[150%] h-32 transform -rotate-12 pointer-events-none opacity-60"></div>
        <div className="spray-stroke-white top-1/3 -left-1/4 w-[120%] h-24 transform rotate-6 pointer-events-none opacity-40"></div>

        {/* Hero Content */}
        <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-16 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">
          {/* Left Column: Typography & CTAs */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="space-y-4 relative z-20"
          >
            {/* Tape Tag */}
            <div className="tape-overlay !top-[-28px] !left-0">
              SERIES 01 · DROP TÁCTICO
            </div>

            <h1 className="font-headline-xl text-6xl sm:text-7xl lg:text-[88px] text-[#e6e1e1] uppercase tracking-wider break-words leading-[0.85] mb-4 drop-shadow-2xl">
              VANDAL<br />
              <span className="text-[#ffb4ab] underline decoration-[#e0141f] decoration-4">STITCH</span>
            </h1>

            <p className="font-body-lg text-base sm:text-lg text-[#e7bcb8]/80 max-w-md border-l-2 border-[#e0141f] pl-4 leading-relaxed">
              Amigurumis y gráficos de punto cruz forjados en la jungla de concreto. No es el crochet tradicional de tu abuela; es arte subversivo y coleccionables de edición limitada.
            </p>

            <div className="pt-4 sm:pt-6 flex flex-wrap gap-4 items-center">
              <button
                onClick={() => setCurrentView('shop')}
                className="relative group px-8 py-4 bg-[#ffb4ab] text-[#690006] font-accent-tag text-lg uppercase border-2 border-[#5e3f3c] hover:bg-[#141313] hover:text-[#ffb4ab] hover:border-[#e0141f] transition-all duration-300 shadow-[4px_4px_0px_#e0141f] flex items-center gap-3"
              >
                <span>Explorar Catálogo</span>
                <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
              </button>

              <button
                onClick={() => onSelectProduct(heroProduct)}
                className="px-6 py-4 bg-[#211f1f]/80 backdrop-blur-sm text-[#e6e1e1] font-label-caps text-xs uppercase tracking-widest border border-[#5e3f3c] hover:border-[#ffb4ab] hover:text-[#ffb4ab] transition-colors"
              >
                Inspeccionar Flagship
              </button>
            </div>

            <div className="flex items-center gap-6 pt-3 text-xs font-mono text-[#8a8a86]">
              <span className="flex items-center gap-1.5">
                <Flame className="w-4 h-4 text-[#e0141f]" /> EDICIÓN LIMITADA (50 PIEZAS)
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-[#ffb4ab]" /> CERTIFICADO SERIALIZADO
              </span>
            </div>
          </motion.div>

          {/* Right Column: Interactive Vector Anti-Gravity Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.2 }}
            className="relative z-10 flex justify-center mt-2 md:mt-0"
          >
            <AntiGravityHeroShowcase onSelectProduct={onSelectProduct} />
          </motion.div>
        </div>
      </section>

      {/* 2. THE ARSENAL (CATEGORY SHOWCASE) */}
      <section className="w-full py-16 bg-[#211f1f] border-t border-[#5e3f3c] relative z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 border-b border-[#5e3f3c] pb-3 relative">
            <div className="spray-stroke-red top-0 left-0 w-64 h-16 transform rotate-3 pointer-events-none opacity-40"></div>
            <div>
              <span className="font-label-caps text-xs text-[#ffb4ab] uppercase tracking-widest block mb-1">
                [ ELIGE TU ARSENAL ]
              </span>
              <h2 className="font-headline-md text-3xl sm:text-4xl text-[#e6e1e1] uppercase tracking-tight relative z-10">
                El Arsenal
              </h2>
            </div>
            <button
              onClick={() => setCurrentView('shop')}
              className="mt-2 sm:mt-0 font-label-caps text-xs text-[#ffb4ab] hover:underline uppercase tracking-wider flex items-center gap-1.5 self-start sm:self-auto"
            >
              Explorar Catálogo Completo <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Card 1: Beasts */}
            <div
              onClick={() => setCurrentView('shop')}
              className="group relative block w-full bg-[#2b2a29] border border-[#5e3f3c] p-4 transition-all hover:-translate-y-1 hover:border-[#ffb4ab] cursor-pointer shadow-lg"
            >
              <div className="torn-tape -top-2 -left-2 transform -rotate-12"></div>
              <div className="staple-corner top-0 right-0"></div>
              <div className="aspect-square w-full mb-4 overflow-hidden relative bg-[#141313]">
                <div className="absolute inset-0 bg-[#e0141f]/0 group-hover:bg-[#e0141f]/20 transition-colors z-10 mix-blend-overlay"></div>
                <img
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-105"
                  alt="Categoría Dulce Princesa"
                  src="/img/dulce-princesa-1.jpeg"
                />
              </div>
              <h3 className="font-accent-tag text-lg text-[#e6e1e1] uppercase mb-1 group-hover:text-[#ffb4ab] transition-colors">
                Series & Rogues
              </h3>
              <p className="font-body-md text-sm text-[#e7bcb8]/70">Piezas coleccionables con plataforma.</p>
            </div>

            {/* Card 2: Rogues */}
            <div
              onClick={() => setCurrentView('shop')}
              className="group relative block w-full bg-[#2b2a29] border border-[#5e3f3c] p-4 transition-all hover:-translate-y-1 hover:border-[#ffb4ab] cursor-pointer shadow-lg"
            >
              <div className="torn-tape -top-3 right-4 transform rotate-6"></div>
              <div className="staple-corner top-0 left-0"></div>
              <div className="aspect-square w-full mb-4 overflow-hidden relative bg-[#141313]">
                <div className="absolute inset-0 bg-[#e0141f]/0 group-hover:bg-[#e0141f]/20 transition-colors z-10 mix-blend-overlay"></div>
                <img
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-105"
                  alt="Categoría Flagship Jungkook"
                  src="/img/jungkook-cooky-plataforma-1.jpeg"
                />
              </div>
              <h3 className="font-accent-tag text-lg text-[#e6e1e1] uppercase mb-1 group-hover:text-[#ffb4ab] transition-colors">
                Idol Flagship
              </h3>
              <p className="font-body-md text-sm text-[#e7bcb8]/70">Drops exclusivos y piezas maestras.</p>
            </div>

            {/* Card 3: Hardware */}
            <div
              onClick={() => setCurrentView('shop')}
              className="group relative block w-full bg-[#2b2a29] border border-[#5e3f3c] p-4 transition-all hover:-translate-y-1 hover:border-[#ffb4ab] cursor-pointer shadow-lg"
            >
              <div className="torn-tape -bottom-2 -left-2 transform rotate-12"></div>
              <div className="staple-corner top-0 right-0"></div>
              <div className="aspect-square w-full mb-4 overflow-hidden relative bg-[#141313]">
                <div className="absolute inset-0 bg-[#e0141f]/0 group-hover:bg-[#e0141f]/20 transition-colors z-10 mix-blend-overlay"></div>
                <img
                  className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500 scale-100 group-hover:scale-105"
                  alt="Categoría Mini Amigurumi"
                  src="/img/jungkook-cooky-pequeno-1.jpeg"
                />
              </div>
              <h3 className="font-accent-tag text-lg text-[#e6e1e1] uppercase mb-1 group-hover:text-[#ffb4ab] transition-colors">
                Alley Minis
              </h3>
              <p className="font-body-md text-sm text-[#e7bcb8]/70">Miniaturas y artefactos portátiles.</p>
            </div>

            {/* Card 4: Commission */}
            <div
              onClick={() => setCurrentView('contact')}
              className="group relative block w-full bg-[#2b2a29] border border-[#5e3f3c] p-4 transition-all hover:-translate-y-1 hover:border-[#ffb4ab] cursor-pointer shadow-lg"
            >
              <div className="torn-tape -top-2 left-1/2 transform -translate-x-1/2 rotate-3"></div>
              <div className="staple-corner top-0 left-0"></div>
              <div className="aspect-square w-full mb-4 overflow-hidden relative flex flex-col items-center justify-center bg-[#141313] border border-dashed border-[#5e3f3c] group-hover:border-[#e0141f] transition-colors">
                <Wrench className="w-12 h-12 text-[#5e3f3c] group-hover:text-[#ffb4ab] group-hover:scale-110 transition-all" />
                <span className="text-[10px] font-mono text-[#8a8a86] mt-2 tracking-widest uppercase">
                  ENCARGO 1-DE-1
                </span>
              </div>
              <h3 className="font-accent-tag text-lg text-[#e6e1e1] uppercase mb-1 group-hover:text-[#ffb4ab] transition-colors">
                Comisión
              </h3>
              <p className="font-body-md text-sm text-[#e7bcb8]/70">Piezas únicas bajo pedido.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. LATEST DROPS SECTION */}
      <section className="w-full py-20 bg-[#141313] relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 md:px-16 relative">
          <div className="flex flex-col items-center justify-center text-center mb-14 relative z-10">
            <div className="spray-stroke-white top-0 left-1/2 -translate-x-1/2 w-96 h-20 transform -rotate-2 pointer-events-none opacity-40"></div>
            <span className="font-label-caps text-xs text-[#e0141f] uppercase tracking-widest font-bold mb-1">
              EDICIÓN LIMITADA · LOTE 01
            </span>
            <h2 className="font-headline-lg text-4xl sm:text-5xl text-[#e6e1e1] uppercase tracking-tight mb-2 relative z-10">
              Últimos Lanzamientos
            </h2>
            <div className="h-1 w-20 bg-[#e0141f] relative z-10"></div>
          </div>

          {/* 3-Column Products Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {latestDrops.map((product, idx) => (
              <ProductCard
                key={product.id}
                product={product}
                onSelectProduct={onSelectProduct}
                delayIndex={idx}
              />
            ))}
          </div>

          {/* Bottom Action */}
          <div className="mt-14 flex justify-center">
            <button
              onClick={() => setCurrentView('shop')}
              className="font-accent-tag text-lg text-[#ffb4ab] uppercase hover:text-white transition-colors border-b-2 border-[#ffb4ab] hover:border-[#e0141f] pb-1 flex items-center gap-2 group"
            >
              <span>INGRESAR AL CATÁLOGO COMPLETO</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </button>
          </div>
        </div>
      </section>

      {/* 4. BEHIND THE THREAD (BRAND MANIFESTO MODULE) */}
      <section className="relative w-full min-h-[550px] flex items-center overflow-hidden border-t border-[#5e3f3c]">
        {/* Background dark alley */}
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida-public/AB6AXuD7Oyfq2iOUh-Ax7gVM_1Ka9PfIfiL2BJpLSqVdHWtpTqnbMGKEI7IEIrtlS-iqF6DV4jYwWllAjfGNQaYz19ce1fSWhQD-8KyB1Gp7qgXwSaBeTZUtYHoRUHgROyBYFcO8ZoTPeRyk3gtnFLWzVZsyGHcDJiqnZpgBXJWrpKHxOKANOZgSdyJNDgE5u7_Bz-wH8L9i9NiU2wi_ynKP6XmIGNWyAMClNX3HmNmyUcsmRipGSXMsE2ax')`
          }}
        ></div>
        <div className="absolute inset-0 bg-[#141313]/90 mix-blend-multiply"></div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 md:px-16 w-full flex flex-col md:flex-row justify-end items-end md:items-center py-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="p-8 sm:p-12 border border-[#5e3f3c] max-w-xl shadow-2xl relative bg-[#211f1f]/90 backdrop-blur-md"
          >
            {/* Spray accent behind text */}
            <div className="spray-stroke-red top-8 left-0 w-full h-24 transform rotate-2 pointer-events-none opacity-30"></div>

            <div className="absolute -top-4 -left-4 w-9 h-9 bg-[#e0141f] flex items-center justify-center font-bold text-white font-headline-md transform rotate-12 shadow-lg">
              "
            </div>

            <h2 className="font-headline-lg text-3xl sm:text-4xl text-[#e6e1e1] uppercase mb-4 leading-tight relative z-10">
              Detrás<br />Del Hilo
            </h2>

            <p className="font-body-md text-base text-[#e7bcb8]/85 mb-6 relative z-10 leading-relaxed">
              Cada pieza es una protesta contra la producción en serie. Tejida a mano en el underground, forjada desde el asfalto de la ciudad. No hacemos juguetes: creamos artefactos de colección para quienes desafían lo convencional.
            </p>

            <button
              onClick={() => setCurrentView('about')}
              className="relative z-10 font-label-caps text-xs text-[#e6e1e1] uppercase border border-[#5e3f3c] px-6 py-3 hover:bg-[#e0141f] hover:text-white hover:border-[#e0141f] transition-all bg-[#141313]/80"
            >
              Leer Manifiesto
            </button>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
