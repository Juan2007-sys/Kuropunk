import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
dotenv.config();

import {
  ProductEntity,
  OrderEntity,
  OrderItemEntity,
  ReviewEntity,
  ContactMessageEntity,
} from './entities';

const isPostgres = process.env.DB_TYPE === 'postgres' || !!process.env.DATABASE_URL;

const AppDataSource = new DataSource(
  isPostgres
    ? {
        type: 'postgres',
        ...(process.env.DATABASE_URL
          ? { url: process.env.DATABASE_URL }
          : {
              host: process.env.DB_HOST || 'localhost',
              port: parseInt(process.env.DB_PORT || '5432', 10),
              username: process.env.DB_USERNAME || 'crochet_user',
              password: process.env.DB_PASSWORD || 'crochet_pass',
              database: process.env.DB_DATABASE || 'tienda_crochet',
            }),
        ssl: process.env.DB_SSL === 'true' ? { rejectUnauthorized: false } : false,
        entities: [
          ProductEntity,
          OrderEntity,
          OrderItemEntity,
          ReviewEntity,
          ContactMessageEntity,
        ],
        synchronize: true,
      }
    : {
        type: 'sqlite',
        database: process.env.DATABASE_PATH || './tienda.sqlite',
        entities: [
          ProductEntity,
          OrderEntity,
          OrderItemEntity,
          ReviewEntity,
          ContactMessageEntity,
        ],
        synchronize: true,
      },
);

const INITIAL_PRODUCTS = [
  // 1. Amigurumis
  {
    id: "the-wanderer",
    sku: "RX-00 // FLAGSHIP",
    title: "The Wanderer",
    subtitle: "Artisan Collectible with Staff",
    category: "Rogues",
    series: "Grit Series",
    type: "amigurumi",
    price: 145000,
    originalPrice: 180000,
    rating: 5.0,
    reviewsCount: 38,
    isFeatured: true,
    isHero: true,
    badge: "LIMITED DROP",
    badgeType: "primary",
    badgeVol: "VOL. 04",
    stock: 7,
    edition: "1 of 50",
    height: "8.5 INCHES",
    yarn: "100% INDUSTRIAL ACRYLIC",
    origin: "Hand-stitched urban artifact with miniature compass & crystal staff",
    description: "Hand-stitched urban artifact. Engineered with heavyweight acrylic yarn, featuring a custom miniature compass and crystal staff. Each piece bears unique abrasions and weathering from the crafting process. Not a toy. A statement.",
    specs: [
      "YARN: 100% INDUSTRIAL ACRYLIC",
      "HEIGHT: 8.5 INCHES",
      "EDITION: 1 OF 50",
      "HARDWARE: MINIATURE COMPASS & CRYSTAL STAFF",
      "FINISH: DISTRESSED CHARCOAL WEAVE WITH BLOOD ORANGE ACCENTS"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOcXKo7gOBjP9ZlFxuVLSUyKqvrVSMOR3T4GQu3L1gJdI7keqGp4bmRraEi1rISe7iw2mEBtkwkvEkJLg5CZA2ziOSXiND7tI0DB-zDER3dqQDsJBK21ptyuOWVg9Lo02FTRwRqTpPCvha7EIyw1fgO1DYgfxscqUPuuwSymApqc6xfbzMN27yqEbR3uJ5x1d2RYT1UEwOwQOJjfqtHlCbhg799jVy85P7YOOhU5SRN1LepcqK06Zd",
    altImage: "https://lh3.googleusercontent.com/aida/AEtjO1Vtlxn46x4tY79s9fAHL6AUGVt63psN5bPKra58BvVUT2xqIbhFPWxJ25lsVsytLt222-Y21aB3U8Syh79W-e1iqeCN9E9uC36BGWRcI0ZWnQE_K5xR43aawSSOA64JPgBTyCZnbfd4zT4w5xQ259nzIEH5Vs9hvhJnjt1P8VBEMVuid6UM7nXbxFLmIKy2AHzqE504PoHvqP8Mz3Dm_XiR02DPKmhy6SSUCNHirDOeImH67hLjhIuV4cM",
    size: "MED"
  },
  {
    id: "vandal-bear",
    sku: "RX-01 / ALLEY KAT",
    title: "Vandal Bear",
    subtitle: "Street Punk Bear with Spray Can",
    category: "Alley Kats",
    series: "Alley Kats",
    type: "amigurumi",
    price: 85000,
    rating: 4.9,
    reviewsCount: 24,
    isFeatured: true,
    badge: "NEW",
    badgeType: "tag-new",
    stock: 12,
    edition: "1 of 100",
    height: "7.0 INCHES",
    yarn: "HEAVYWEIGHT CARBON FIBER YARN",
    description: "A gritty, high-contrast urban amigurumi bear holding a miniature functional-look spray can. Distressed ear stitching and blood-red mask accents.",
    specs: [
      "YARN: HEAVYWEIGHT CARBON FIBER YARN",
      "HEIGHT: 7.0 INCHES",
      "ACCENTS: RED SPRAY STENCIL & MINI RESIN CAN",
      "PACKAGING: CRUSHED CONCRETE FOAM CRATE"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDkd6lum0_tc8RjXSjHlxBZkS6Ca2dyP78RbL_MGFREY8HFs898hj5VFZMis6AqXe6by62TF1wd_fEhXMeCDoiRtu5AUn6LwDQSzRfBVriuenwkF9fmmIfNGRCMJ_NJbxf41fvzye74qgILqNA43k6ZMBcMVZB-56mP5bPg-xKM2yjmg1Gn5slQX-GojNRA-l8RSSgAb7ujYGyN--d4mALo7BHsYIocTTpxw7QpwPScs1ljikTPWtj4",
    size: "MED"
  },
  {
    id: "scrap-bunny",
    sku: "RX-02 / ALLEY KAT",
    title: "Scrap Bunny",
    subtitle: "Menacing Crochet Bunny with Metal Nut Eye",
    category: "Alley Kats",
    series: "Alley Kats",
    type: "amigurumi",
    price: 90000,
    rating: 4.8,
    reviewsCount: 19,
    isFeatured: true,
    badge: "HOT",
    badgeType: "primary",
    stock: 4,
    edition: "1 of 75",
    height: "9.5 INCHES",
    yarn: "ASH GREY RECYCLED WOOL & ACRYLIC",
    description: "Industrial street bunny with one eye replaced by an M8 steel nut. Hand-frayed ear edges and battle-worn crochet density.",
    specs: [
      "YARN: RECYCLED ASH WOOL",
      "HARDWARE: REAL INDUSTRIAL STEEL NUT EYE",
      "HEIGHT: 9.5 INCHES",
      "EDITION: BATCH 02"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBCmtkObcEVPSvTW6dyBhu5iS6HSAoLepmcfLAyU45QmIe9zupLl5PXb-xcWvz20N-TWUbWYs7jlZzI5haniUVaWtFdqJuP08MX4gbEU7LuaRTDgs5vGM79F-nSArKmVjA_mqmg17G3aGSQCvwcrLEAvucpClzW3CzanOMgQohJdo1fTNWUZ9YweaVxm1mceerCIA_bo0KJHDMwCmY9Xw1b6I9Y0nWS-2_gR1eYpPCq2iTz5xKFUE2k",
    size: "LRG"
  },
  {
    id: "neon-scratch",
    sku: "RX-03 / ALLEY KAT",
    title: "Neon Scratch",
    subtitle: "Distressed Grunge Feline",
    category: "Alley Kats",
    series: "Alley Kats",
    type: "amigurumi",
    price: 95000,
    rating: 5.0,
    reviewsCount: 52,
    isFeatured: false,
    badge: "SOLD OUT",
    badgeType: "sold-out",
    stock: 0,
    edition: "1 of 50",
    height: "6.5 INCHES",
    yarn: "CHARCOAL TEXTURED ACRYLIC",
    description: "A grim, heavily textured feline with neon yellow aerosol streaks. Distressed finish and ultra-dense crochet pattern.",
    specs: [
      "YARN: HIGH DENSITY ACRYLIC",
      "STATUS: ARCHIVED / RETIRED RUN",
      "HEIGHT: 6.5 INCHES"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCTaIYMXtPfGCDjTPKdxCia3nIg-m-ATdeSnmdYuR46zBCYB8Bj-cRWKmmVTZGc8Rcf0IvfPv2sjEt7Q3IcVAVogv4wPMrTYe2YKatLy6OpIxR8DgWlhMyJUdXZzJ4kHjbcfUgC_4vvyOCB0SjiMpdm7R_q_GFRe2YEfd1KEQxh7bm7NzPwgUxza4XPfV26WLXsiUhCozmvxd_-DEoO-kgsZPmFq4UNQUkFsNHharvLfJt1res_elBN",
    size: "SML"
  },
  {
    id: "rust-bot",
    sku: "RX-04 / ALLEY KAT",
    title: "Rust Bot",
    subtitle: "Blocky Cyber-Brutalist Automaton",
    category: "Hardware",
    series: "Scrap Metal",
    type: "amigurumi",
    price: 110000,
    rating: 4.9,
    reviewsCount: 15,
    isFeatured: true,
    badge: "LAST ONE",
    badgeType: "last-one",
    stock: 1,
    edition: "1 of 25",
    height: "6.0 INCHES",
    yarn: "MATTE BLACK YARN + COPPER WIRE",
    description: "Blocky robotic creature with exposed red copper wiring antennae. Reinforced square joints and dark metal patina stitching.",
    specs: [
      "YARN: MATTE CHARCOAL + COPPER CORE",
      "HEIGHT: 6.0 INCHES",
      "FEATURES: ARTICULATED SKELETON WIRE"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBVYXeu7-pkRzm4VkrI9nQ0gr403pb_0X34yZmLPYwGhB4paZHRoA-kOmGpuFq2uaSUadhGuzq6ZKMVW8aEyRnnmqoDXSeZpdbYVmKbB8S3h2YqIbnTIjPsxX7e3IYfnvKmxPcWsdVYFFN8irc2kn61zTt4jYlrCY0dKMhQeUlMSsgsdcYiEMINKmOC6HFyMXvCaKqI4WhfH9jatfu8iGmIBHTMijaUY4lxgTSROqG7cPZ4n9CU1oMe",
    size: "SML"
  },
  {
    id: "spike-alley-rat",
    sku: "RX-05 / LATEST DROP",
    title: "Spike / Alley Rat",
    subtitle: "Punk Rat with Stitched Mohawk",
    category: "Beasts",
    series: "Grit Series",
    type: "amigurumi",
    price: 85000,
    rating: 4.7,
    reviewsCount: 42,
    isFeatured: true,
    badge: "SOLD OUT",
    badgeType: "sold-out",
    stock: 0,
    edition: "1 of 60",
    height: "7.5 INCHES",
    yarn: "TEXTURED RAW COTTON & ACRYLIC",
    description: "A meticulously crafted amigurumi figure of a street punk rat with a spiked mohawk and safety pin piercing. Stark urban grit.",
    specs: [
      "YARN: RAW TEXTURED GREY COTTON",
      "HEIGHT: 7.5 INCHES",
      "DETAILS: STEEL SAFETY PIN & CRIMSON MOHAWK"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuB8DHEUyOqyO91_e929HTa07bQhYLhkzgAsX2ML5l6s4UQRafYC7oxK5s3TVqGp_9UfHRX6s9OZmMpVNSbpTu00RR-P6IUruOW6KzhyeriF8z7z3faalVSxQm26unfYsDPgQVNJ73vgTGUpzXH7xIGS1WHjaEiTLgqGTw_nRIyO-mlY4AZsCGDZuce4L4GssYLzTINLPX1hGJ4yDJ8WmmCcEMi_8eL7mYfSSXVjxoyu4HvNLBZsTCIH",
    size: "MED"
  },
  {
    id: "ghost-vandal",
    sku: "RX-06 / LATEST DROP",
    title: "Ghost / Vandal",
    subtitle: "Phantom Street Operative",
    category: "Rogues",
    series: "Neon Scum",
    type: "amigurumi",
    price: 110000,
    rating: 5.0,
    reviewsCount: 31,
    isFeatured: true,
    badge: "DROP ACTIVE",
    badgeType: "primary",
    stock: 8,
    edition: "1 of 40",
    height: "8.0 INCHES",
    yarn: "ULTRA-BLACK MATTE YARN",
    description: "Amigurumi figure of an underground graffiti artist with a miniature removable respirator and metallic spray marker.",
    specs: [
      "YARN: ULTRA-BLACK HEAVYWEIGHT WEAVE",
      "HEIGHT: 8.0 INCHES",
      "ACCESSORIES: MAGNETIC RESPIRATOR & RESIN CAN"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDsHSdTSbhE05tTXLZADYmFemgraIR-ywT1QmxntlsuBzD85TkpkAHuXCDkMPtNL2Y2515lp75P_vz4jVU1Sif9ZkYTdnUlHFPd46qBu4-ZtSvNTzNYunXVtBqGe03ac12bWfwMi_sGXVd9p4rxknQEHK0fQnirQYeHu-ohgo3C_HnRBYJRdeTMuW85mYJm4DSx1kC8oyS3_GG5AEEmfdeBCb-V_X5rIrfPocIDKJkv0qDH8h_CpTVx",
    size: "MED"
  },
  {
    id: "brute-hound",
    sku: "RX-07 / LATEST DROP",
    title: "Brute / Hound",
    subtitle: "Mutant Guard Dog with Iron Chain",
    category: "Beasts",
    series: "Grit Series",
    type: "amigurumi",
    price: 145000,
    rating: 5.0,
    reviewsCount: 18,
    isFeatured: true,
    badge: "NEW",
    badgeType: "tag-new",
    stock: 5,
    edition: "1 of 30",
    height: "10.0 INCHES",
    yarn: "DOUBLE-STRANDED CHARCOAL ACRYLIC",
    description: "Chunky, oversized amigurumi mutant hound with real iron chain collar and fierce expression. High density build for durability.",
    specs: [
      "YARN: DOUBLE-STRANDED HEAVY WOOL",
      "HARDWARE: AGED IRON CHAIN COLLAR",
      "HEIGHT: 10.0 INCHES",
      "WEIGHT: 450 GRAMS"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDLbIzHjK9VsyrdOjCn4-oQjWyVWfzjt52nheIy8o2IuhbQdHo4bYnn2WMTgc6wx5G5g-JUV0rEXLFLjU8CupfukczVcPR3R1exa3pWT84gsTaJSYzeo2nlURfGPn6r1lwFSpT7udzANu_7I03zwuNujH_ERYodHVQiUt0ucaDRqg_BSriuAmqYV3BEYFCOuJ6Fa8PjZhtEHLVeo2ow_N7bNB4TBHze5LDpsnI7Yd9QSX37dvDCgybD",
    size: "XXL"
  },
  {
    id: "the-mechanic",
    sku: "RX-08 / MORE DROPS",
    title: "The Mechanic",
    subtitle: "Subterranean Grease Monkey",
    category: "Rogues",
    series: "Scrap Metal",
    type: "amigurumi",
    price: 135000,
    rating: 4.9,
    reviewsCount: 22,
    isFeatured: false,
    badge: "LIMITED",
    badgeType: "primary",
    stock: 6,
    edition: "1 of 50",
    height: "8.5 INCHES",
    yarn: "OILED-LOOK GREY BLEND",
    description: "A gritty crochet figure equipped with leather-textured goggles and a cast alloy miniature wrench. Built to survive the underground sub-levels.",
    specs: [
      "YARN: OILED-LOOK GREY BLEND",
      "HEIGHT: 8.5 INCHES",
      "ACCESSORIES: ADJUSTABLE GOGGLES & ALLOY WRENCH"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAUnviCEfF5CJheXwAZYL13sPrkxB1-s-c56ODngJfknbMkj_p7kfHsJoMe_vCCuhcFAYN2P8Xw6mNdrMqIbn8oTdP-d4vWEGnJosdX3DC7KJ2OoA10OAMZL3tMVbwT7zzYd0n8joLD1WAgkHVF6Rv0ajIOQd1B_L4FD98OHjQ_OFbJtJnpB6D-ekRsTqArN5fKS8r3lMGrMqZcIJeGM5K_4BeUjlDw-znzu_EY02kgO84AxUHeToMg",
    size: "MED"
  },
  {
    id: "the-healer",
    sku: "RX-09 / MORE DROPS",
    title: "The Healer",
    subtitle: "Plague Mask Shaman",
    category: "Rogues",
    series: "Neon Scum",
    type: "amigurumi",
    price: 150000,
    rating: 5.0,
    reviewsCount: 64,
    isFeatured: false,
    badge: "SOLD OUT",
    badgeType: "sold-out",
    stock: 0,
    edition: "1 of 20",
    height: "9.0 INCHES",
    yarn: "DARK SLATE HEAVY YARN",
    description: "An enigmatic plague-doctor amigurumi with a long curved beak mask and stained leather satchel. One of our most sought-after drops.",
    specs: [
      "YARN: DARK SLATE HEAVY YARN",
      "HEIGHT: 9.0 INCHES",
      "STATUS: SOLD OUT (VAULT ARCHIVE)"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuChG5rFhK-x-spr7ZFzF3lQdt_kQ_ClLPmSp0LDwUfXXqi5aG6SuTb3pzRVJrGYZ9dA3MNURziLtYAtewspLw4UEtR6E2XQNFzRNud77C9AE3Kq1_4y1hFSIpNzbzomTaIAV7BWGPPdAMB0SpkZOZ627BGamBDwEe17URJ2vG1z6Vt52bdPUQa1UC-BSDjOQkTF6ci2IWYP6KPpkzgy6VDz5hcTs1kPyv349PHYnnCG8Zud4TwL0Ln_",
    size: "LRG"
  },
  {
    id: "the-scavenger",
    sku: "RX-10 / MORE DROPS",
    title: "The Scavenger",
    subtitle: "Wasteland Nomad with Patchwork Cloak",
    category: "Rogues",
    series: "Scrap Metal",
    type: "amigurumi",
    price: 110000,
    rating: 4.9,
    reviewsCount: 27,
    isFeatured: false,
    badge: "HOT",
    badgeType: "primary",
    stock: 9,
    edition: "1 of 50",
    height: "8.0 INCHES",
    yarn: "PATCHWORK MULTI-THREAD YARN",
    description: "A highly textured amigurumi figure of a post-apocalyptic scavenger with an asymmetric frayed cloak and survival gear.",
    specs: [
      "YARN: MULTI-THREAD DISTRESSED ACRYLIC",
      "HEIGHT: 8.0 INCHES",
      "DETAILS: ASYMMETRIC WEATHERED HOOD"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuAeIZ1mENYcL3DuFB6P7zzTvexUZ8BQ4YB8LK1FuHwQk3P-tqiGf0utFyE034o-Z32Cx78K8JUV-t7Xb0ihWmBmOWdfLf-vpp-7pn-cepdPgorkwPe6vnC8ZXp4CKpgRUMFZq9W7KyVp42olUqMZiMuxtpikZoJqjw0FwfMjhKu331DUQdIO8NkIgSKhkuEMwd7NXsZbk3wCJoPeN_zPKSDQSWSZEX5FsfXEgYVg401zWfaFqOijktt",
    size: "MED"
  },
  {
    id: "rat-king-plush",
    sku: "RX-11 / HARDWARE",
    title: "Rat King Plush",
    subtitle: "Street Punk with Safety Pin Earring",
    category: "Hardware",
    series: "Grit Series",
    type: "amigurumi",
    price: 45000,
    rating: 4.8,
    reviewsCount: 45,
    isFeatured: false,
    badge: "EDC",
    badgeType: "primary",
    stock: 15,
    edition: "Open Batch",
    height: "4.5 INCHES",
    yarn: "ASPHALT GREY ACRYLIC",
    description: "Pocket-sized crochet mascot wearing a tiny red beanie and real chrome safety pin earring. Designed as everyday carry or keychain.",
    specs: [
      "YARN: ASPHALT GREY HIGH-TENSION ACRYLIC",
      "HEIGHT: 4.5 INCHES",
      "COLOR: ASPHALT / BLOOD RED BEANIE"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCPfBOq-w3YOBJa20Aw1bdoaKP8UzsDQZo-9BiFR8L6WL0d74UDn_HJZyFrqdvZCa9UaqujPM2VMJQaEAP-DcIUwZP7HnegPpAuDdnpD5KKTaM5_x561sPxbPDqMDQ7RUvCFj4V3u7Lya4uqaHFmkomrLPtoUJvLGsNqOxxY24Wsk4dOJFWWHsYjRV-fpeoW15d2rjkSAxpyQVJmfbr_MHnBMsqBiEYcSawpyT5x_Z76bBJGUgtiiKL",
    size: "SML"
  },
  {
    id: "krypt-can",
    sku: "RX-12 / HARDWARE",
    title: "Krypt Can",
    subtitle: "Snarling Aerosol Can Plush EDC",
    category: "Hardware",
    series: "Neon Scum",
    type: "amigurumi",
    price: 30000,
    rating: 4.9,
    reviewsCount: 58,
    isFeatured: false,
    badge: "ESSENTIAL",
    badgeType: "primary",
    stock: 20,
    edition: "Open Batch",
    height: "4.0 INCHES",
    yarn: "CRIMSON RED & SILVER METALLIC THREAD",
    description: "Crocheted miniature spray can with embroidered snarling face and crimson nozzle accent. The ultimate graffiti homage.",
    specs: [
      "YARN: CRIMSON & SILVER METALLIC THREAD",
      "HEIGHT: 4.0 INCHES",
      "COLOR: BLOOD / INDUSTRIAL SILVER"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDZOa2nU_NYQUrt4G8QWCCOGxoSU6FnolXT0Z7WKA9bCjH9VzF-AxSRIbYPQxVM3B329fV9rwNcuy1mXqOh-DNRkRKxwVhxu6uWwgs0cYhS2QDZt5nRIwrzzJeS1cQv1F0encl9RjH5LoPBqdWsD-IHf8As-dvBb3EP-r8ZD93Mqwc83zXoVHWDSkj5n9YE7OC6DUkRL69dgckU0R7gNZARJbL7_bZexLaxaDNZ6b8byUckAvj_4jq0",
    size: "SML"
  },

  // 2. Punto Cruz Products
  {
    id: "punto-cruz-kuropunk-cat",
    sku: "PC-01 // SIGNATURE",
    title: "KuroPunk Cat & Electric Bass",
    subtitle: "Gráfico Punto Cruz Oficial KuroPunk",
    category: "Punto Cruz",
    series: "Signature Charts",
    type: "punto_cruz",
    price: 25000,
    kitPrice: 65000,
    rating: 5.0,
    reviewsCount: 42,
    badge: "OFICIAL",
    badgeType: "primary",
    fabric: "Aida 14ct Negra / Denim",
    gridSize: "140 x 140 puntos",
    dmcPalette: "8 Tonos DMC: #310 (Negro), #666 (Rojo Sangre), #Blanc, #413 (Gris Peltre), #817",
    stitchesCount: "19,600 puntadas",
    difficulty: "Intermedio",
    estimatedTime: "12-16 Horas",
    description: "El gráfico icónico de la mascota KuroPunk: el gato negro punk tocando bajo eléctrico con auriculares y madeja de lana. Incluye mapa de símbolos y guía de color DMC.",
    specs: [
      "FORMATO: PDF DESCARGABLE DE ALTA RESOLUCIÓN",
      "GRILLA: 140W x 140H PUNTOS",
      "PALETA DMC: 8 COLORES CALIBRADOS",
      "TELA RECOMENDADA: AIDA 14CT NEGRA",
      "MEDIDA TERMINADA: 25.4 x 25.4 CM (10x10 PULGADAS)"
    ],
    image: "/img/logo_negro.jpeg"
  },
  {
    id: "punto-cruz-graffiti-skull",
    sku: "PC-02 // SKULL SERIES",
    title: "Graffiti Skull & Needles",
    subtitle: "Calavera Urbana con Agujas Cruzadas",
    category: "Punto Cruz",
    series: "Vandal Series",
    type: "punto_cruz",
    price: 20000,
    kitPrice: 55000,
    rating: 4.9,
    reviewsCount: 29,
    badge: "BESTSELLER",
    badgeType: "primary",
    fabric: "Aida 14ct Negra / 16ct Blanca",
    gridSize: "100 x 120 puntos",
    dmcPalette: "5 Tonos DMC: #310, #Blanc, #666, #414, #318",
    stitchesCount: "12,000 puntadas",
    difficulty: "Fácil - Medio",
    estimatedTime: "8-10 Horas",
    description: "Calavera urbana con estilo street art de alta densidad para enmarcar o bordar como parche en chaquetas y mochilas.",
    specs: [
      "FORMATO: PDF VECTORIAL CON MAPA SÍMBOLOS + COLOR",
      "GRILLA: 100W x 120H PUNTOS",
      "TELA BASE: AIDA 14CT",
      "INCLUYE: GUÍA DE PESPUNTE & SOMBREADO"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBCmtkObcEVPSvTW6dyBhu5iS6HSAoLepmcfLAyU45QmIe9zupLl5PXb-xcWvz20N-TWUbWYs7jlZzI5haniUVaWtFdqJuP08MX4gbEU7LuaRTDgs5vGM79F-nSArKmVjA_mqmg17G3aGSQCvwcrLEAvucpClzW3CzanOMgQohJdo1fTNWUZ9YweaVxm1mceerCIA_bo0KJHDMwCmY9Xw1b6I9Y0nWS-2_gR1eYpPCq2iTz5xKFUE2k"
  },
  {
    id: "punto-cruz-vandal-spray",
    sku: "PC-03 // STREET GEAR",
    title: "Vandal Aerosol Can",
    subtitle: "Lata de Graffiti Gachiakuta en Pixel Art",
    category: "Punto Cruz",
    series: "Street Gear",
    type: "punto_cruz",
    price: 18000,
    kitPrice: 48000,
    rating: 4.8,
    reviewsCount: 31,
    badge: "NUEVO",
    badgeType: "tag-new",
    fabric: "Aida 14ct Carbón",
    gridSize: "80 x 100 puntos",
    dmcPalette: "4 Tonos DMC: #666, #321, #000, #415",
    stitchesCount: "8,000 puntadas",
    difficulty: "Principiante",
    estimatedTime: "5-7 Horas",
    description: "Diseño compacto y rápido de bordar para personalización de mochilas y accesorios urbanos.",
    specs: [
      "FORMATO: PDF VECTORIAL A4 LISTO PARA IMPRIMIR",
      "GRILLA: 80W x 100H PUNTOS",
      "PUNTADA: CRUZ COMPLETA 2 HEBRAS",
      "PALETA: ROJO CARMESÍ / NEGRO / GRIS METAL"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDZOa2nU_NYQUrt4G8QWCCOGxoSU6FnolXT0Z7WKA9bCjH9VzF-AxSRIbYPQxVM3B329fV9rwNcuy1mXqOh-DNRkRKxwVhxu6uWwgs0cYhS2QDZt5nRIwrzzJeS1cQv1F0encl9RjH5LoPBqdWsD-IHf8As-dvBb3EP-r8ZD93Mqwc83zXoVHWDSkj5n9YE7OC6DUkRL69dgckU0R7gNZARJbL7_bZexLaxaDNZ6b8byUckAvj_4jq0"
  },
  {
    id: "punto-cruz-cyber-mecha",
    sku: "PC-04 // TECHNO",
    title: "Mecha Cyberpunk Skull",
    subtitle: "Diseño Cibernético en Punto de Cruz",
    category: "Punto Cruz",
    series: "Cyber Series",
    type: "punto_cruz",
    price: 28000,
    kitPrice: 70000,
    rating: 5.0,
    reviewsCount: 18,
    badge: "EXCLUSIVO",
    badgeType: "primary",
    fabric: "Aida 16ct Negra",
    gridSize: "160 x 180 puntos",
    dmcPalette: "6 Tonos DMC con hilo metalizado",
    stitchesCount: "28,800 puntadas",
    difficulty: "Avanzado",
    estimatedTime: "20-25 Horas",
    description: "Patrón complejo con gradientes y pespuntes metálicos para entusiastas del bordado técnico de alto impacto.",
    specs: [
      "FORMATO: DOSSIER PDF DE 12 PÁGINAS",
      "GRILLA: 160W x 180H PUNTOS",
      "HILO RECOMENDADO: DMC MOULINÉ + ÉTOILE METÁLICO",
      "INCLUYE: GUÍA DE MONTAJE Y BLOQUEO DE TELA"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBVYXeu7-pkRzm4VkrI9nQ0gr403pb_0X34yZmLPYwGhB4paZHRoA-kOmGpuFq2uaSUadhGuzq6ZKMVW8aEyRnnmqoDXSeZpdbYVmKbB8S3h2YqIbnTIjPsxX7e3IYfnvKmxPcWsdVYFFN8irc2kn61zTt4jYlrCY0dKMhQeUlMSsgsdcYiEMINKmOC6HFyMXvCaKqI4WhfH9jatfu8iGmIBHTMijaUY4lxgTSROqG7cPZ4n9CU1oMe"
  },

  // 3. Patrones de Crochet (Digital Blueprints)
  {
    id: "patron-the-wanderer",
    sku: "PT-01 // MASTER BLUEPRINT",
    title: "Patrón: The Wanderer Amigurumi",
    subtitle: "Guía Maestra Paso a Paso con Fotos HD",
    category: "Patrones",
    series: "Master Blueprints",
    type: "patron",
    price: 25000,
    bundlePrice: 50000,
    rating: 5.0,
    reviewsCount: 56,
    badge: "FLAGSHIP",
    badgeType: "primary",
    hookSize: "3.5mm Tactical Ergonomic Hook",
    yarn: "240m Lana Acrílica Alta Torsión Carbón + Naranja",
    height: "8.5 Pulgadas",
    pages: "38 Páginas con 110 Fotografías",
    difficulty: "Experto // Brutal",
    stitches: "AM, PB, MPA, PA, AUM, DISM, BLO",
    estimatedTime: "12-14 Horas",
    description: "El patrón oficial completo para recrear a The Wanderer. Incluye plantilla para ensamblado del báculo con cristal, mochila táctica miniatura y técnicas de articulación interna.",
    specs: [
      "FORMATO: DOCUMENTO PDF DESCARGABLE (38 PÁGS)",
      "FOTOGRAFÍAS: MÁS DE 110 FOTOS DETALLE PASO A PASO",
      "AGUJA: 3.5MM TACTICAL HOOK",
      "INCLUYE: PLANTILLA DE ACCESORIOS & ESQUELETO DE ALAMBRE",
      "IDIOMA: ESPAÑOL + GLOSARIO EN INGLÉS"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDOcXKo7gOBjP9ZlFxuVLSUyKqvrVSMOR3T4GQu3L1gJdI7keqGp4bmRraEi1rISe7iw2mEBtkwkvEkJLg5CZA2ziOSXiND7tI0DB-zDER3dqQDsJBK21ptyuOWVg9Lo02FTRwRqTpPCvha7EIyw1fgO1DYgfxscqUPuuwSymApqc6xfbzMN27yqEbR3uJ5x1d2RYT1UEwOwQOJjfqtHlCbhg799jVy85P7YOOhU5SRN1LepcqK06Zd"
  },
  {
    id: "patron-vandal-bear",
    sku: "PT-02 // ALLEY SERIES",
    title: "Patrón: Vandal Bear",
    subtitle: "Guía de Tejido Oso Punk con Mini Aerosol",
    category: "Patrones",
    series: "Alley Series",
    type: "patron",
    price: 20000,
    bundlePrice: 45000,
    rating: 4.9,
    reviewsCount: 37,
    badge: "POPULAR",
    badgeType: "primary",
    hookSize: "3.0mm Hook",
    yarn: "180m Hilo Negro Mate + Escarlata",
    height: "7.0 Pulgadas",
    pages: "26 Páginas con 75 Fotografías",
    difficulty: "Intermedio",
    stitches: "AM, PB, AUM, DISM Invisible",
    estimatedTime: "8-10 Horas",
    description: "Instrucciones detalladas vuelta por vuelta para confeccionar el oso rebelde, la máscara desgastada y la mini lata de aerosol en crochet.",
    specs: [
      "FORMATO: PDF DESCARGABLE DE 26 PÁGS",
      "AGUJA: 3.0MM",
      "INCLUYE: GUÍA DE EMBELLECIMIENTO CON PINTURA TEXTIL",
      "IDIOMA: ESPAÑOL"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuDkd6lum0_tc8RjXSjHlxBZkS6Ca2dyP78RbL_MGFREY8HFs898hj5VFZMis6AqXe6by62TF1wd_fEhXMeCDoiRtu5AUn6LwDQSzRfBVriuenwkF9fmmIfNGRCMJ_NJbxf41fvzye74qgILqNA43k6ZMBcMVZB-56mP5bPg-xKM2yjmg1Gn5slQX-GojNRA-l8RSSgAb7ujYGyN--d4mALo7BHsYIocTTpxw7QpwPScs1ljikTPWtj4"
  },
  {
    id: "patron-scrap-bunny",
    sku: "PT-03 // ALLEY SERIES",
    title: "Patrón: Scrap Bunny",
    subtitle: "Guía de Tejido Conejo Postapocalíptico",
    category: "Patrones",
    series: "Alley Series",
    type: "patron",
    price: 20000,
    bundlePrice: 45000,
    rating: 4.9,
    reviewsCount: 41,
    badge: "NUEVO",
    badgeType: "tag-new",
    hookSize: "3.0mm Hook",
    yarn: "190m Acrílico Gris Cemento + Sangre",
    height: "9.0 Pulgadas",
    pages: "28 Páginas",
    difficulty: "Intermedio",
    stitches: "AM, PB, AUM, DISM, Punto Cangrejo",
    estimatedTime: "9-11 Horas",
    description: "Aprende a tejer las orejas asimétricas, la cicatriz bordada y el ojo mecánico de tornillo con diagramas ilustrados.",
    specs: [
      "FORMATO: GUÍA PDF DE 28 PÁGINAS",
      "NIVEL: INTERMEDIO",
      "INCLUYE: DIAGRAMA DE COSTURA PARA OREJAS DESIGUALES"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuBCmtkObcEVPSvTW6dyBhu5iS6HSAoLepmcfLAyU45QmIe9zupLl5PXb-xcWvz20N-TWUbWYs7jlZzI5haniUVaWtFdqJuP08MX4gbEU7LuaRTDgs5vGM79F-nSArKmVjA_mqmg17G3aGSQCvwcrLEAvucpClzW3CzanOMgQohJdo1fTNWUZ9YweaVxm1mceerCIA_bo0KJHDMwCmY9Xw1b6I9Y0nWS-2_gR1eYpPCq2iTz5xKFUE2k"
  },
  {
    id: "patron-rat-king-edc",
    sku: "PT-04 // HARDWARE",
    title: "Patrón: Rat King EDC Mascot",
    subtitle: "Mini Rata de Bolsillo con Gorro Rojo",
    category: "Patrones",
    series: "Hardware Series",
    type: "patron",
    price: 15000,
    bundlePrice: 35000,
    rating: 4.8,
    reviewsCount: 52,
    badge: "RÁPIDO",
    badgeType: "primary",
    hookSize: "2.5mm Hook",
    yarn: "70m Acrílico Asfalto + Rojo",
    height: "4.5 Pulgadas",
    pages: "16 Páginas con Diagrama",
    difficulty: "Principiante // Rápido",
    stitches: "AM, PB, AUM, DISM",
    estimatedTime: "3-4 Horas",
    description: "Proyecto rápido y adictivo para tejer en una tarde. Perfecto para llaveros y regalos urbanos con alfiler de gancho auténtico.",
    specs: [
      "FORMATO: MINI-PDF DE BOLSILLO DE 16 PÁGINAS",
      "TIEMPO ESTIMADO: 3 A 4 HORAS",
      "IDEAL PARA: LLAVEROS Y REGALOS RÁPIDOS"
    ],
    image: "https://lh3.googleusercontent.com/aida-public/AB6AXuCPfBOq-w3YOBJa20Aw1bdoaKP8UzsDQZo-9BiFR8L6WL0d74UDn_HJZyFrqdvZCa9UaqujPM2VMJQaEAP-DcIUwZP7HnegPpAuDdnpD5KKTaM5_x561sPxbPDqMDQ7RUvCFj4V3u7Lya4uqaHFmkomrLPtoUJvLGsNqOxxY24Wsk4dOJFWWHsYjRV-fpeoW15d2rjkSAxpyQVJmfbr_MHnBMsqBiEYcSawpyT5x_Z76bBJGUgtiiKL"
  }
];

const INITIAL_REVIEWS = [
  {
    productId: "the-wanderer",
    author: "Kyo_99",
    rating: 5,
    comment: "La calidad de las puntadas y el detalle del báculo con cristal superó mis expectativas. Una pieza de colección brutal.",
    verifiedBuyer: true,
  },
  {
    productId: "the-wanderer",
    author: "Ren_Vandal",
    rating: 5,
    comment: "Vino con su certificado numerado y el empaque estilo concreto. El mejor amigurumi que he comprado.",
    verifiedBuyer: true,
  },
  {
    productId: "vandal-bear",
    author: "Mika_Crochet",
    rating: 5,
    comment: "La mini lata de spray es genial. Los colores son idénticos a las fotos.",
    verifiedBuyer: true,
  },
  {
    productId: "punto-cruz-kuropunk-cat",
    author: "Elena_Stitch",
    rating: 5,
    comment: "El gráfico en PDF viene nítido y la equivalencia de hilos DMC es perfecta. Recomendadísimo.",
    verifiedBuyer: true,
  }
];

async function seed() {
  console.log('🔄 Initializing KuroPunk Database Seed...');
  await AppDataSource.initialize();
  console.log(`✅ Connected to database (${isPostgres ? 'PostgreSQL' : 'SQLite'}).`);

  const productRepo = AppDataSource.getRepository(ProductEntity);
  const reviewRepo = AppDataSource.getRepository(ReviewEntity);

  console.log(`📦 Seeding ${INITIAL_PRODUCTS.length} products...`);
  for (const prod of INITIAL_PRODUCTS) {
    const existing = await productRepo.findOne({ where: { id: prod.id } });
    if (!existing) {
      const entity = productRepo.create(prod as any);
      await productRepo.save(entity);
      console.log(`  + Seeded product: [${prod.sku}] ${prod.title}`);
    } else {
      Object.assign(existing, prod);
      await productRepo.save(existing);
      console.log(`  ~ Updated product with COP price: [${prod.sku}] ${prod.title} -> $${prod.price} COP`);
    }
  }

  console.log(`💬 Seeding ${INITIAL_REVIEWS.length} initial reviews...`);
  for (const rev of INITIAL_REVIEWS) {
    const reviewEntity = reviewRepo.create(rev);
    await reviewRepo.save(reviewEntity);
  }

  console.log('🏁 Database seeding finished successfully.');
  await AppDataSource.destroy();
}

seed().catch((err) => {
  console.error('❌ Error seeding database:', err);
  process.exit(1);
});
