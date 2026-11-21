/**
 * Configuración Centralizada de Llaves de Pago y Regla de Anticipo (KuroPunk Taller)
 * Puedes editar fácilmente los números de cuenta o llave aquí o mediante variables de entorno (.env).
 */

export const DEPOSIT_THRESHOLD_COP = 50000;
export const DEPOSIT_PERCENTAGE = 0.50;

export const PAYMENT_ACCOUNTS = [
  {
    id: 'bre_b',
    label: 'Llave Bre-B Oficial',
    key: import.meta.env.VITE_PAYMENT_KEY_BREB || '@NEQUILAU59554',
    holder: import.meta.env.VITE_PAYMENT_HOLDER || 'KuroPunk Taller',
    bank: 'Válida desde Nequi, Bancolombia, Daviplata y cualquier banco en Colombia',
    badge: 'ÚNICA LLAVE OFICIAL',
  },
];
