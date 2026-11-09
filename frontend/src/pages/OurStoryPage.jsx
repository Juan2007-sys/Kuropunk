import React from 'react';
import { motion } from 'framer-motion';
import { Flame, Compass, Scissors, ShieldAlert } from 'lucide-react';

export const OurStoryPage = ({ setCurrentView }) => {
  return (
    <div className="w-full pt-6 pb-24 bg-[#141313] relative min-h-screen text-[#e6e1e1] overflow-hidden">
      {/* Background Image with Heavy Dark Overlay */}
      <div className="absolute inset-0 z-0">
        <div
          className="w-full h-full bg-cover bg-center absolute inset-0 opacity-40 mix-blend-luminosity"
          style={{
            backgroundImage: `url('https://lh3.googleusercontent.com/aida/AEtjO1VX8kvNcaBj_IY_XSbB3o8TLxQ7aFCLaETCg8PeOOnAGDXO2L5VSmsEWttvd64nVvcSaSHiBk71G7Y43I89dsXld2Mf90FRVN1EtNsLi5kMTu0Xl6zP9bFN3bZ_z9tiTdpDoUbAMrjLpOXLqM29_7hCIvCpb9fy5FvgV7_HkJwahVCMsa1OsJk1wle9AnVdF9WVCZJgmhcBE_m79QZ9N80A0IZM6NfxHCaz4a2BzU-jcA6uw19SRDcmig')`
          }}
        ></div>
        <div className="absolute inset-0 bg-[#141313]/90"></div>

        {/* Low-opacity red graffiti stroke simulation */}
        <div className="absolute inset-0 pointer-events-none opacity-20">
          <svg height="100%" width="100%" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M-100,500 Q 400,-200 900,600 T 2000,100"
              fill="none"
              opacity="0.4"
              stroke="#e0141f"
              strokeWidth="40"
              transform="rotate(-15)"
            />
            <path
              d="M-50,800 Q 500,200 1200,900 T 2500,300"
              fill="none"
              opacity="0.25"
              stroke="#e0141f"
              strokeWidth="25"
              transform="rotate(10)"
            />
          </svg>
        </div>
      </div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-8 md:px-16 py-8">
        {/* Title Section */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-14 relative inline-block self-start"
        >
          <div className="tape-overlay !top-[-16px] !-left-4 !rotate-[-4deg]">
            FUNDADO EN 2024 // BOGOTÁ, COLOMBIA
          </div>
          <h1 className="font-stencil text-6xl sm:text-7xl lg:text-[88px] leading-[0.9] text-[#e6e1e1] uppercase relative z-10 pt-4">
            El Origen<br />
            <span className="text-[#ffb4ab]">Del Tejido Urbano</span>
          </h1>
          <div className="absolute -bottom-3 -right-6 w-full h-4 bg-[#e0141f] transform rotate-2 z-0 opacity-80"></div>
        </motion.div>

        {/* Main Content Grid (12 cols) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Left Column: Story Manifesto (6 cols) */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
            className="lg:col-span-6 space-y-8 relative"
          >
            <div className="relative z-10 p-6 sm:p-8 bg-[#211f1f]/80 backdrop-blur-md border border-[#5e3f3c] shadow-2xl space-y-6">
              <p className="font-body-lg text-lg text-[#e6e1e1] leading-relaxed font-medium">
                KuroPunk no nació en una mercería convencional. Fue forjado en el asfalto urbano, donde el hilo de alta resistencia se unió con manos incansables. Entendemos el amigurumi japonés no como simples muñecos decorativos, sino como una declaración de cultura callejera: criaturas, personajes underground y piezas mecánicas nacidas de hebras continuas.
              </p>

              <p className="font-body-md text-sm sm:text-base text-[#e7bcb8]/80 leading-relaxed">
                Cada punto es un acto deliberado contra la producción en masa y el plástico desechable. Nuestros artesanos no solo tejen; esculpen con tensión extrema y dedicación, transmitiendo en cada edición la energía única de la ciudad que los vio nacer.
              </p>

              <div className="p-4 bg-[#141313] border-l-4 border-[#e0141f] space-y-2">
                <div className="font-accent-tag text-xs text-[#ffb4ab] uppercase tracking-widest">
                  Nuestros Principios Fundamentales
                </div>
                <ul className="text-xs text-[#c7c6c2] space-y-1.5 font-mono">
                  <li>01 // CERO FÁBRICAS INDUSTRIALES. 100% HECHO A MANO.</li>
                  <li>02 // HILADOS ACRÍLICOS Y FIBRAS DE ALTA DENSIDAD.</li>
                  <li>03 // LANZAMIENTOS NUMERADOS CON CERTIFICADO EN BÓVEDA.</li>
                </ul>
              </div>

              <div className="pt-2 flex flex-wrap gap-4">
                <button
                  onClick={() => setCurrentView('shop')}
                  className="px-6 py-3 bg-[#e0141f] text-[#fff4f3] font-headline-md text-lg uppercase tracking-wider hover:bg-transparent hover:text-[#ffb4ab] border-2 border-[#e0141f] transition-all shadow-[3px_3px_0px_#000]"
                >
                  Explorar Catálogo
                </button>
                <button
                  onClick={() => setCurrentView('contact')}
                  className="px-6 py-3 bg-[#141313] text-[#e6e1e1] font-label-caps text-xs uppercase tracking-widest border border-[#5e3f3c] hover:border-[#ffb4ab] hover:text-[#ffb4ab] transition-colors"
                >
                  Encargo Personalizado
                </button>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Process Photos (Documentary Style Polaroids) */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-8 relative"
          >
            {/* Photo 1: Hands Tension */}
            <div className="relative bg-[#211f1f] p-3 border border-[#5e3f3c] transform md:-rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl group">
              <div className="torn-tape -top-3 -right-3 transform rotate-12"></div>
              <div className="w-full aspect-square bg-[#141313] overflow-hidden border border-[#5e3f3c]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvVmzt2rBCwiM1eXoU5n3vyzAgoBeS_z-ALNXS6JbFSqS42_jPH0rw0C7oMP_h5EItseYep0lMBLGptOZvrA5JgoFzc16e5Ssi9UJnbd7vEd6a6SXJUObUgv37ccoyejNd0aOVDtdibeosC8-Q0XomX_UDl35JPZciX_hOd3zMJgjC_F5RZ-6ib9fFNEDLsqtDi6W06rCuHC1x709cRHTU1OBXTrkE27xKd3merN-Ns2kVibReM2NB"
                  alt="Tensión meticulosa en el tejido"
                  className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute -bottom-3 -right-3 bg-[#e0141f] text-[#fff4f3] font-label-caps text-xs px-3 py-1 transform rotate-3 shadow-lg font-bold">
                Tensión Meticulosa
              </div>
            </div>

            {/* Photo 2: Needles & Concrete */}
            <div className="relative bg-[#211f1f] p-3 border border-[#5e3f3c] transform md:rotate-3 sm:mt-12 hover:rotate-0 transition-transform duration-500 shadow-2xl group">
              <div className="torn-tape -top-3 -left-3 transform -rotate-6"></div>
              <div className="w-full aspect-square bg-[#141313] overflow-hidden border border-[#5e3f3c]">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuAwsBLJRUTd1ckElQnxFpUn9MDdhmUXVmJChw3al7ygkdquWIIRdxlliPa1FeR3EKsWgc-H0BAUA9JzA_0kCsGxH9MsMLjvvZ5zdMH0rVXVtrP10BbEKn8htnRYXhLQuHJOeeAfHNjmtgpn-gMPZi9G3akLc3vzc6bnHSonKjCjB38EpjJl6gupE2t3ogDdHw9XOzCaeT1NRjaM1te3401GfnMiS_3C24UoZSXoaRfFeFpBLHfhMLE2"
                  alt="Agujas e hilado sobre asfalto"
                  className="w-full h-full object-cover grayscale contrast-125 group-hover:scale-105 transition-transform duration-500"
                />
              </div>
              <div className="absolute -bottom-3 -left-3 bg-[#141313] border border-[#ae8883] text-[#ffb4ab] font-label-caps text-xs px-3 py-1 transform -rotate-3 shadow-lg font-bold">
                Taller Callejero
              </div>
            </div>
          </motion.div>
        </div>

        {/* 3. MANIFESTO BANNER WITH HAZARD STRIPES */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="w-full mt-20 border-t-2 border-b-2 border-[#5e3f3c] py-8 relative overflow-hidden flex items-center bg-[#1d1b1b] shadow-2xl"
        >
          {/* Caution tape diagonal stripes background */}
          <div className="absolute inset-0 hazard-stripes-subtle pointer-events-none"></div>

          <div className="relative z-10 w-full flex flex-col sm:flex-row justify-between items-center px-6 sm:px-12 gap-4 text-center">
            <span className="font-stencil text-2xl sm:text-3xl text-[#e0141f] uppercase tracking-wider">
              Desafía lo Convencional
            </span>
            <span className="hidden md:inline font-stencil text-2xl sm:text-3xl text-[#c7c6c2] uppercase opacity-40">
              ///
            </span>
            <span className="font-stencil text-2xl sm:text-3xl text-[#ffb4ab] uppercase tracking-wider">
              Abraza la Resistencia
            </span>
            <span className="hidden md:inline font-stencil text-2xl sm:text-3xl text-[#c7c6c2] uppercase opacity-40">
              ///
            </span>
            <span className="font-stencil text-2xl sm:text-3xl text-[#e0141f] uppercase tracking-wider">
              Crochet Underground
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
