/**
 * Configuración Centralizada de Llaves de Pago y Regla de Anticipo (KuroPunk Taller)
 * Puedes editar fácilmente los números de cuenta o llave aquí o mediante variables de entorno (.env).
 */

export const DEPOSIT_THRESHOLD_COP = 50000;
export const DEPOSIT_PERCENTAGE = 0.20;

export const PAYMENT_ACCOUNTS = [
  {
    id: 'bre_b',
    label: 'Llave Bre-B (Inmediato)',
    key: import.meta.env.VITE_PAYMENT_KEY_BREB || '@NEQUILAU59554',
    holder: import.meta.env.VITE_PAYMENT_HOLDER || 'KuroPunk Taller',
    bank: 'Red Interbancaria Bre-B (Todos los bancos)',
    badge: 'RECOMENDADO',
  },
  {
    id: 'nequi',
    label: 'Desde Nequi (Bre-B)',
    key: import.meta.env.VITE_PAYMENT_KEY_NEQUI || '@NEQUILAU59554',
    holder: import.meta.env.VITE_PAYMENT_HOLDER || 'KuroPunk Taller',
    bank: 'Envío por Llave Bre-B en Nequi',
    badge: 'ENVÍO DIRECTO',
  },
  {
    id: 'bancolombia',
    label: 'Desde Bancolombia / Otros',
    key: import.meta.env.VITE_PAYMENT_KEY_BANCOLOMBIA || '@NEQUILAU59554',
    holder: import.meta.env.VITE_PAYMENT_HOLDER || 'KuroPunk Taller',
    bank: 'Transferencia a Llave Bre-B',
    badge: 'SIN COSTO',
  },
];
