/**
 * Configuración Centralizada de Llaves de Pago y Regla de Anticipo (KuroPunk Taller)
 * Puedes editar fácilmente los números de cuenta o llave aquí o mediante variables de entorno (.env).
 */

export const DEPOSIT_THRESHOLD_COP = 50000;
export const DEPOSIT_PERCENTAGE = 0.20;

export const PAYMENT_ACCOUNTS = [
  {
    id: 'bre_b',
    label: 'Llave Bre-B / Transfiya (Inmediato)',
    key: import.meta.env.VITE_PAYMENT_KEY_BREB || '3015690382',
    holder: import.meta.env.VITE_PAYMENT_HOLDER || 'KuroPunk Taller',
    bank: 'Red Interbancaria Bre-B / Transfiya',
    badge: 'RECOMENDADO',
  },
  {
    id: 'nequi',
    label: 'Nequi',
    key: import.meta.env.VITE_PAYMENT_KEY_NEQUI || '3015690382',
    holder: import.meta.env.VITE_PAYMENT_HOLDER || 'KuroPunk Taller',
    bank: 'Depósito de Bajo Monto Nequi',
    badge: 'ENVÍO DIRECTO',
  },
  {
    id: 'bancolombia',
    label: 'Bancolombia / A la Mano',
    key: import.meta.env.VITE_PAYMENT_KEY_BANCOLOMBIA || '3015690382',
    holder: import.meta.env.VITE_PAYMENT_HOLDER || 'KuroPunk Taller',
    bank: 'Transferencia QR / Llave Celular',
    badge: 'SIN COSTO',
  },
];
