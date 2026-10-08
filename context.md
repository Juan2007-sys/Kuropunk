# 🧵 KUROPUNK // VANDAL STITCH — Project Context & Engineering Blueprint

> **Underground Urban Crochet & Punto Cruz E-Commerce Platform**  
> An unapologetic digital store combining high-density amigurumi craftsmanship, tactical cross-stitch designs, and downloadable master blueprints with a raw *Gachiakuta / Cyber-Brutalist / Street Punk* aesthetic.

---

## 📌 1. Project Overview & Identity

- **Brand Name**: `KUROPUNK` (also referred to as `VANDAL STITCH`)
- **Tagline**: *"Unapologetic amigurumi & tactical needlecraft forged in the concrete jungle. Not your grandma's crochet."*
- **Aesthetic**: Cyber-Brutalist, Manga/Streetwear (*Gachiakuta*, *Akira*, *Cyberpunk*), Concrete Grime, Industrial Badges, Aerosol Stencils, High-Contrast Palette.
- **Product Lines**:
  1. **Artisan Collectibles (Amigurumis)**: Physical limited drops, serialized pieces (Flagships, Rogues, Alley Kats, Beasts, Tactical EDC Hardware).
  2. **Punto Cruz (Cross-Stitch)**: High-resolution pixel art & DMC-calibrated charts with optional physical DIY craft kits.
  3. **Patrones (Crochet Master Blueprints)**: Complete downloadable step-by-step PDF/HTML documents with stitch diagrams, wireframe skeletons, and accessory templates.

---

## 🏗️ 2. Architecture & Monorepo Structure

The repository is structured as a full-stack decoupled project:

```
Tienda-croshet/
├── backend/                  # NestJS 10 REST API (TypeScript + TypeORM + SQLite)
│   ├── src/
│   │   ├── common/           # Interceptors, Filters, Guards, Decorators
│   │   ├── database/         # SQLite connection & TypeORM entities
│   │   │   └── entities/     # Product, Order, OrderItem, Review, Contact entities
│   │   ├── modules/          # Feature modules (products, cart, orders, reviews, contact, admin)
│   │   │   ├── admin/
│   │   │   ├── cart/
│   │   │   ├── contact/
│   │   │   ├── orders/
│   │   │   ├── products/
│   │   │   └── reviews/
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── .env                  # Backend environment configuration
│   ├── nest-cli.json
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/                 # React 18 + Vite SPA with Tailwind CSS
│   ├── public/
│   │   └── img/              # Logos and static media assets
│   ├── src/
│   │   ├── assets/           # Brand assets (logo_negro.jpeg, logo_blanco.jpeg)
│   │   ├── components/       # Reusable UI components
│   │   │   ├── CartDrawer.jsx          # Slide-over cart panel with live quantity updates
│   │   │   ├── CommandPalette.jsx      # Global ⌘K quick switcher & search modal
│   │   │   ├── ConcreteShaderCanvas.jsx# WebGL/2D dynamic grimy background canvas
│   │   │   ├── Footer.jsx              # Industrial footer with newsletter & links
│   │   │   ├── Navbar.jsx              # Top bar with glitch logo, badge counter & quick links
│   │   │   ├── ProductCard.jsx         # Brutalist product card with price tags & badges
│   │   │   └── Toast.jsx               # Floating industrial alert notifications
│   │   ├── context/
│   │   │   └── CartContext.jsx         # Global cart state + localStorage persistence
│   │   ├── data/
│   │   │   └── products.js             # Initial mock data (Amigurumis, Punto Cruz, Patrones)
│   │   ├── pages/
│   │   │   ├── CheckoutPage.jsx        # Dispatch & payment simulation with confetti
│   │   │   ├── ContactPage.jsx         # Custom commissions & underground inquiries
│   │   │   ├── HomePage.jsx            # Hero drop showcase, flagship inspection, features
│   │   │   ├── OurStoryPage.jsx        # Brand lore, craftsmanship philosophy, timeline
│   │   │   ├── ProductDetailPage.jsx   # Deep-dive specs, gallery, reviews, sizing, buy CTA
│   │   │   └── ShopPage.jsx            # Multi-tab catalog (Amigurumi, Punto Cruz, Patrones) + filters
│   │   ├── utils/
│   │   │   └── downloadPdf.js          # Client-side printable PDF/HTML blueprint exporter
│   │   ├── App.jsx                     # View router & Lenis smooth scrolling orchestrator
│   │   ├── index.css                   # Tailwind directives, custom spray strokes & tape styles
│   │   └── main.jsx                    # React root render
│   ├── index.html                      # Fonts (Bebas Neue, Hanken Grotesk, Wallpoet, Stencil)
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js              # Custom industrial/brutalist color system & typography
│   └── vite.config.js
│
└── context.md                # This project documentation file
```

---

## 🎨 3. Design System & Style Guide

### Core Color Palette (Tailwind & CSS Tokens)
| Token | Hex Value | Role / Usage |
|---|---|---|
| **Background / Void** | `#080808` / `#141313` | Main deep dark background |
| **Surface Dark** | `#1d1b1b` / `#211f1f` | Cards, containers, sidebars |
| **Crimson / Primary Container** | `#e0141f` / `#FF0033` | Action buttons, badges, highlights, spray stains |
| **Primary Accent / Neon Peach** | `#ffb4ab` | Flagship text highlights, borders, interactive focus |
| **Outline Variant** | `#5e3f3c` / `#363434` | Industrial borders, dashed divider lines |
| **Text Primary** | `#e6e1e1` | High-contrast readable body & title text |
| **Text Muted / Metallic** | `#8a8a86` / `#c7c6c2` | Specs, SKU numbers, mono labels |

### Typography Tokens
- **Headline Display**: `'Bebas Neue'`, `'Black Ops One'`, sans-serif (Massive, uppercase, condensed).
- **Body & Labels**: `'Hanken Grotesk'`, `'Bricolage Grotesque'` (Readable, modern industrial).
- **Stencil / Graffiti**: `'Black Ops One'`, `'Saira Stencil One'`, `'Permanent Marker'`, `'Wallpoet'`.
- **Technical Data**: `'JetBrains Mono'`, monospace (SKUs, coordinates, yarn counts, dimensions).

### Signature Visual Accents
- **Tape Overlays**: Skewed industrial masking tape badges with rotated text (`.tape-overlay`).
- **Spray Strokes**: Pseudo-element and SVG red/white spray stains with luminosity blend modes.
- **Concrete Shader Canvas**: Interactive canvas background simulating grime, spray dispersion, and cursor interaction.
- **Strict Square Corners**: 0px border-radius across cards, buttons, and inputs for brutalist aesthetics.

---

## 📦 4. Data Models & Schemas

### Product Entity (`Product`)
```typescript
{
  id: string;                  // e.g. "the-wanderer", "vandal-bear"
  sku: string;                 // e.g. "RX-00 // FLAGSHIP"
  title: string;               // e.g. "The Wanderer"
  subtitle?: string;           // e.g. "Artisan Collectible with Staff"
  category: string;            // "Rogues" | "Alley Kats" | "Beasts" | "Hardware" | "Punto Cruz" | "Patrones"
  series: string;              // "Grit Series" | "Neon Scum" | "Scrap Metal" | "Signature Charts"
  type?: 'amigurumi' | 'punto_cruz' | 'patron';
  price: number;               // Unit price (USD)
  originalPrice?: number;      // For discounts/drop sales
  kitPrice?: number;           // For Punto Cruz physical craft kits
  bundlePrice?: number;        // For Patrones bundles
  rating: number;              // 1.0 - 5.0
  reviewsCount: number;
  stock: number;               // Available physical inventory
  isFeatured?: boolean;
  isHero?: boolean;
  badge?: string;              // "LIMITED DROP", "FLAGSHIP", "SOLD OUT", "OFICIAL"
  badgeType?: 'primary' | 'tag-new' | 'sold-out' | 'last-one';
  height?: string;             // Dimensions (e.g. "8.5 INCHES")
  yarn?: string;               // Material specs (e.g. "100% INDUSTRIAL ACRYLIC")
  specs?: string[];            // Technical specification list
  image: string;               // Main photo URL / local path
  altImage?: string;           // Secondary showcase photo URL
  size?: 'SML' | 'MED' | 'LRG' | 'XXL';
  // Specific to Punto Cruz:
  fabric?: string;             // e.g. "Aida 14ct Negra / Denim"
  gridSize?: string;           // e.g. "140 x 140 puntos"
  dmcPalette?: string;         // e.g. "8 Tonos DMC: #310, #666..."
  stitchesCount?: string;      // e.g. "19,600 puntadas"
  // Specific to Patrones:
  hookSize?: string;           // e.g. "3.5mm Tactical Hook"
  pages?: string;              // e.g. "38 Páginas con 110 Fotos"
  stitches?: string;           // e.g. "AM, PB, MPA, PA, AUM, DISM, BLO"
  estimatedTime?: string;      // e.g. "12-14 Horas"
  difficulty?: string;         // "Principiante" | "Intermedio" | "Experto // Brutal"
}
```

### Cart Item Schema
```typescript
{
  id: string;
  title: string;
  price: number;
  color?: string;
  size?: string;
  quantity: number;
  image: string;
}
```

### Order Entity (`Order`)
```typescript
{
  id: string;                  // e.g. "VS-849201"
  items: CartItem[];
  subtotal: number;
  shippingCost: number;        // Free if subtotal >= $120, else $12.00
  total: number;
  status: 'PENDING' | 'PAID' | 'DISPATCHED' | 'CANCELLED';
  createdAt: Date;
  customerInfo?: {
    fullName: string;
    email: string;
    address: string;
    city: string;
    country: string;
  };
}
```

---

## ⚡ 5. Key Frontend Features & Workflows

1. **Lenis Smooth Inertial Scrolling**: Configured in `App.jsx` for smooth mousewheel interaction across long catalog pages.
2. **Global Command Palette (`⌘K` / `Ctrl+K`)**:
   - Fast instant fuzzy search across all products and categories.
   - Quick view navigation (`Home`, `Shop`, `Our Story`, `Contact`, `Cart`).
3. **Multi-Tab Shop Experience**:
   - **Tab 1: Physical Drops (Amigurumis)**: Filter by Stock status, Series, Size, Price range, Sorting.
   - **Tab 2: Punto Cruz**: Grid view of printable charts, DMC thread breakdown, DIY kit add-to-cart buttons.
   - **Tab 3: Patrones (Master Blueprints)**: Instant download button triggering client-side formatted HTML/PDF blueprint via `downloadPatternPDF()`.
4. **Interactive Cart Drawer**:
   - Slide-over sheet with item counters, subtotal calculator, free shipping progress bar, and fast checkout CTA.
5. **Checkout & Order Simulation**:
   - Dynamic shipping calculation, address form, terms agreement checkbox, processing delay with confetti trigger on order placement.
6. **Printable Digital Blueprints (`downloadPdf.js`)**:
   - Generates an exportable HTML/CSS document designed with `@media print` styling for standard A4 saving/printing directly from the browser.

---

## 🛠️ 6. Development & Execution Guide

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher

### 🚀 Running Frontend
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start Vite development server (Default: http://localhost:5173)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

### ⚙️ Running Backend
```bash
# Navigate to backend directory
cd backend

# Install dependencies
npm install

# Start NestJS development server with live reload (Default: http://localhost:4000)
npm run start:dev

# Build for production
npm run build

# Run database seed
npm run seed
```

### 🔑 Environment Variables
- **Frontend** (`frontend/.env` - optional):
  ```env
  VITE_API_URL=http://localhost:4000/api
  ```
- **Backend** (`backend/.env`):
  ```env
  PORT=4000
  NODE_ENV=development
  DATABASE_PATH=./tienda.sqlite
  CORS_ORIGIN=http://localhost:5173,http://192.168.56.1:5173,http://localhost:3000
  ```

---

## 🗺️ 7. Current Project State & Next Milestones

### Completed Features ✅
- [x] Full responsive Cyber-Brutalist & Gachiakuta UI design system in Tailwind CSS.
- [x] Complete product catalog data for Amigurumis, Punto Cruz charts, and Patrones blueprints.
- [x] Dynamic animated concrete/grime shader background (`ConcreteShaderCanvas.jsx`).
- [x] Global Cart state with local storage persistence and interactive drawer.
- [x] Search, multi-criteria filtering, and Command Palette (`⌘K`).
- [x] Client-side printable PDF/HTML blueprint generator for digital downloads (`downloadPatternPDF`).
- [x] Full NestJS backend implemented with TypeORM, SQLite, and Validation Pipes (`products`, `orders`, `reviews`, `contact`, `cart`, `admin`).
- [x] Database seeded with 21 products, initial verified reviews, and SQLite file (`tienda.sqlite`).
- [x] Frontend API client layer (`services/api.js`) with automatic offline fallback.
- [x] Interactive reviews & star rating submission system in `ProductDetailPage.jsx`.
- [x] Restock email alert modal for `SOLD OUT` pieces in `ProductDetailPage.jsx`.
- [x] Persistent Wishlist system in `CartContext.jsx` with header indicator and toggle.
- [x] Mobile slide-down navigation drawer in `Navbar.jsx`.
- [x] Commission & custom craft request type selector in `ContactPage.jsx`.
- [x] Real order dispatch & printable official purchase voucher receipt (`downloadReceiptPDF`) in `CheckoutPage.jsx`.

### Roadmap & Next Steps 🎯
1. **Authentication & Admin Dashboard**:
   - Simple token-based admin panel to create new drops, update inventory stock, and mark orders as dispatched.
2. **Payment Gateway Integration**:
   - Integration with Stripe / PayPal / MercadoPago webhooks for real-time order processing.
