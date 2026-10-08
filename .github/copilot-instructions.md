
# GitHub Copilot & AI Agent Coding Standards - KuroPunk Frontend

Este documento define los estándares obligatorios de codificación, arquitectura y estilo para GitHub Copilot y cualquier agente de IA que interactúe con el repositorio KuroPunk.

---

## 1. Idioma y Copywriting en Español Nativo
1. **Interfaz 100% en Español:** Todos los textos presentados al cliente (botones, placeholders, títulos, descripciones, toasts, diálogos) deben estar redactados en español nativo, profesional y adaptado a la temática artesanal táctica de KuroPunk.
2. **Traducciones Correctas:**
   - ❌ NUNCA utilizar traducciones automáticas como:
     - "Autobús" (falso amigo de "Search / Bus") -> Utilizar `"Buscar piezas, SKUs..."`.
     - "Hogar" (traducción literal de "Home") -> Utilizar `"Inicio"`.
     - "Comercio" (traducción literal de "Shop") -> Utilizar `"Catálogo"` o `"Tienda"`.
     - "Comprobar" / "Revisar" para Checkout -> Utilizar `"Finalizar Pedido"` o `"Despacho Contraentrega"`.
3. **Inmunidad contra Auto-traductores del Navegador:**
   - En elementos de identidad de marca, códigos alfanuméricos, acrónimos o SKUs (ej: `KUROPUNK`, `KP-1024`, `SKU-CR-01`), aplicar siempre `translate="no"`:
   ```jsx
   <span translate="no" className="font-bold tracking-tight">KUROPUNK</span>
   ```

---

## 2. Componentes Frontend y Tailwind CSS
1. **Componentes Modulares:**
   - Separar lógica de presentación, estados globales (Context) y llamadas a servicios.
   - Declarar props y valores por defecto claramente.
2. **Tailwind CSS Limpio:**
   - Usar clases utilitarias de Tailwind en lugar de estilos CSS en línea o archivos CSS dispersos.
   - Respetar la paleta de colores de la marca: tonos neutros oscuros (`#141313`, `#1d1b1b`, `neutral-900`), acentos carmesí/rojo táctico (`#e0141f`, `#ff1f2d`, `#ffb4ab`) y verde WhatsApp (`#25D366`).
3. **Cero Credenciales Hardcodeadas:**
   - NUNCA quemar claves secretas, API keys o URLs privadas en el código fuente.
   - Usar variables de entorno Vite (`import.meta.env.VITE_*`) y siempre implementar guardas de inicialización con fallbacks defensivos.

---

## 3. Accesibilidad (A11Y)
1. **Etiquetas ARIA:** Todo botón o enlace que contenga solo iconos debe contar con un atributo `aria-label` explícito en español.
2. **Navegación por Teclado:**
   - Los modales deben cerrarse con la tecla `Escape`.
   - El foco debe quedar atrapado dentro del modal mientras esté abierto y regresar al elemento detonador al cerrarse.
   - Formularios accesibles con etiquetas `<label>` vinculadas a sus inputs.

---

## 4. Control de Viewport, Modales y Z-Index
1. **Prevención de Recortes Verticales (Clipping):**
   - Todos los modales deben estructurarse con la clase:
     `fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm`
   - El contenedor interior debe limitar su altura y permitir scroll vertical si la pantalla es reducida:
     `max-w-md w-full max-h-[90vh] overflow-y-auto bg-[#0F0F0F] border border-neutral-800 rounded-xl shadow-2xl p-6 relative`
2. **Escala de Z-Index:**
   - Toasts de notificación: `z-[100]`
   - Modales y Overlays: `z-50`
   - Navbar / Cabecera fija: `z-40`
   - Menú móvil desplegable: `z-40`
3. **Diseño Adaptativo Móvil:**
   - Verificar siempre que los elementos no generen scroll horizontal en viewports móviles de 360px a 420px.
   - Las áreas táctiles deben medir al menos 44px de alto y ancho.
