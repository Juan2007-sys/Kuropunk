import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
  onAuthStateChanged,
  getIdTokenResult
} from 'firebase/auth';
import {
  getFirestore,
  collection,
  doc,
  setDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  where,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import {
  getStorage,
  ref,
  uploadBytesResumable,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { getAnalytics, isSupported } from 'firebase/analytics';

/**
 * Utility to extract environment variables supporting multiple bundlers:
 * - Vite: import.meta.env.VITE_FIREBASE_*
 * - Next.js: process.env.NEXT_PUBLIC_FIREBASE_*
 * - Create React App: process.env.REACT_APP_FIREBASE_*
 */
function getEnvVar(key) {
  // 1. Vite environment
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[`VITE_${key}`]) {
    return import.meta.env[`VITE_${key}`];
  }
  // 2. Node / Next.js / CRA fallback
  if (typeof process !== 'undefined' && process.env) {
    return (
      process.env[`NEXT_PUBLIC_${key}`] ||
      process.env[`REACT_APP_${key}`] ||
      process.env[`VITE_${key}`] ||
      process.env[key]
    );
  }
  return '';
}

export const firebaseConfig = {
  apiKey: getEnvVar('FIREBASE_API_KEY') || 'AIzaSyB3QUowrgnT3fJVtS1U1EI2gbX99cgog0Y',
  authDomain: getEnvVar('FIREBASE_AUTH_DOMAIN') || 'kuroapp-62618.firebaseapp.com',
  projectId: getEnvVar('FIREBASE_PROJECT_ID') || 'kuroapp-62618',
  storageBucket: getEnvVar('FIREBASE_STORAGE_BUCKET') || 'kuroapp-62618.firebasestorage.app',
  messagingSenderId: getEnvVar('FIREBASE_MESSAGING_SENDER_ID') || '134769525590',
  appId: getEnvVar('FIREBASE_APP_ID') || '1:134769525590:web:62b8290f2e7d63117e0cf7',
  measurementId: getEnvVar('FIREBASE_MEASUREMENT_ID') || 'G-N59LWQ5REW'
};

/**
 * Validation guard: Audits the Firebase credentials before initialization.
 * Validates presence of mandatory keys and detects generic dummy/placeholder tokens.
 */
export function validateFirebaseConfig(config) {
  const issues = [];
  const required = [
    { key: 'apiKey', name: 'VITE_FIREBASE_API_KEY' },
    { key: 'authDomain', name: 'VITE_FIREBASE_AUTH_DOMAIN' },
    { key: 'projectId', name: 'VITE_FIREBASE_PROJECT_ID' },
    { key: 'storageBucket', name: 'VITE_FIREBASE_STORAGE_BUCKET' }
  ];

  for (const item of required) {
    const val = config[item.key];
    if (!val || typeof val !== 'string' || val.trim() === '') {
      issues.push(`Falta la variable obligatoria: ${item.name}`);
    }
  }

  const apiKey = (config.apiKey || '').trim();
  const dummyPatterns = [
    'AIzaSyDemoDummyKey',
    'dummy',
    'placeholder',
    'your_api_key',
    'tu_clave',
    'your_firebase_api_key',
    'example'
  ];

  if (dummyPatterns.some((pattern) => apiKey.toLowerCase().includes(pattern.toLowerCase()))) {
    issues.push(`La variable VITE_FIREBASE_API_KEY contiene un valor dummy/placeholder genérico: "${apiKey.substring(0, 16)}..."`);
  }

  if (apiKey && !apiKey.startsWith('AIzaSy')) {
    issues.push(`La variable VITE_FIREBASE_API_KEY no parece ser una clave de Google válida (debe comenzar con "AIzaSy")`);
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

// Execute guard audit
const configAudit = validateFirebaseConfig(firebaseConfig);
export const isFirebaseConfigured = configAudit.isValid;

if (!configAudit.isValid) {
  console.warn(
    `%c[KuroPunk Firebase Guard] ⚠️ ALERTA DE CONFIGURACIÓN DE FIREBASE:\n` +
    configAudit.issues.map((i) => ` • ${i}`).join('\n') +
    `\n\n💡 SOLUCIÓN:\n` +
    `1. Copia 'frontend/.env.example' como 'frontend/.env'.\n` +
    `2. Rellena las variables VITE_FIREBASE_* con credenciales de https://console.firebase.google.com/.\n` +
    `3. Reinicia el servidor Vite ('npm run dev').\n` +
    `Entrando en modo de desarrollo local seguro para prevenir excepciones no controladas (auth/api-key-not-valid).`,
    'color: #ffb4ab; background: #2b0b0e; font-weight: bold; padding: 6px; border-left: 4px solid #e0141f;'
  );
}

// Safe app initialization
let app;
try {
  if (getApps().length > 0) {
    app = getApp();
  } else {
    // If not configured, use minimal fallback structure so Firebase SDK won't crash on import
    const effectiveConfig = isFirebaseConfigured
      ? firebaseConfig
      : {
          apiKey: firebaseConfig.apiKey || 'AIzaSyPlaceholderFallbackGuardKeyForDevelopmentOnly',
          authDomain: firebaseConfig.authDomain || 'kuropunk-dev.firebaseapp.com',
          projectId: firebaseConfig.projectId || 'kuropunk-dev',
          storageBucket: firebaseConfig.storageBucket || 'kuropunk-dev.appspot.com',
          appId: firebaseConfig.appId || '1:100000000000:web:mockdev000000'
        };
    app = initializeApp(effectiveConfig);
  }
} catch (e) {
  console.error('[KuroPunk Firebase Guard] Error al inicializar Firebase App:', e);
}

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();

// Safe Firebase Analytics initialization (guarded for browser environment & IndexedDB support)
export let analytics = null;
if (typeof window !== 'undefined' && app) {
  isSupported()
    .then((supported) => {
      if (supported && isFirebaseConfigured) {
        analytics = getAnalytics(app);
      }
    })
    .catch((err) => {
      console.warn('[KuroPunk Analytics] Analytics no soportado en este entorno:', err?.message);
    });
}

/**
 * Syncs user profile in Firestore `users/{uid}` collection
 */
export async function syncUserProfile(user, additionalData = {}) {
  if (!user || !isFirebaseConfigured) return null;
  try {
    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);

    if (!snap.exists()) {
      const newUserData = {
        uid: user.uid,
        email: user.email || '',
        displayName: additionalData.displayName || user.displayName || 'Operativo KuroPunk',
        phoneNumber: additionalData.phoneNumber || user.phoneNumber || '',
        role: additionalData.role || 'customer',
        createdAt: serverTimestamp()
      };
      await setDoc(userDocRef, newUserData);
      return newUserData;
    }

    return snap.data();
  } catch (err) {
    console.warn('[KuroPunk Firebase] syncUserProfile warning:', err.message);
    return null;
  }
}

/**
 * Retrieves custom claims (e.g. role === 'admin') and Firestore role
 */
export async function getUserRole(user) {
  if (!user) return 'customer';
  if (!isFirebaseConfigured) return user.role || 'customer';

  try {
    const tokenResult = await getIdTokenResult(user, true);
    if (tokenResult.claims.role === 'admin' || tokenResult.claims.admin === true) {
      return 'admin';
    }
  } catch (e) {
    console.warn('[KuroPunk Firebase] Could not read custom claims from token:', e.message);
  }

  // Fallback check in Firestore document
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    if (snap.exists() && snap.data().role === 'admin') {
      return 'admin';
    }
  } catch (e) {
    console.warn('[KuroPunk Firebase] Could not read user role from Firestore:', e.message);
  }

  return 'customer';
}

/**
 * Places a new order in Firestore `orders` collection
 */
export async function createFirestoreOrder(orderData) {
  const orderId = orderData.id || `KP-${Math.floor(100000 + Math.random() * 900000)}`;

  const payload = {
    id: orderId,
    userId: orderData.userId || 'guest_user',
    customerData: {
      name: orderData.customerName,
      phone: orderData.phone,
      email: orderData.email || '',
      shippingAddress: `${orderData.address}, ${orderData.neighborhood || ''}, ${orderData.city} (${orderData.department || 'Colombia'})`
    },
    items: (orderData.items || []).map((i) => ({
      productId: i.productId || i.id,
      title: i.title,
      size: i.size || 'MED',
      unitPrice: Number(i.price),
      quantity: Number(i.quantity || 1)
    })),
    totalAmount: Number(orderData.total),
    status: 'placed',
    trackingNumber: orderData.trackingCode || `KURO-TRK-${Math.random().toString(36).substring(2, 9).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured) {
    try {
      const orderRef = doc(db, 'orders', orderId);
      await Promise.race([
        setDoc(orderRef, {
          ...payload,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        }),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Tiempo de espera agotado al conectar con Firestore (3s)')), 3000)
        )
      ]);
    } catch (err) {
      console.warn('[KuroPunk Firebase] Aviso guardando pedido en Firestore:', err.message);
    }
  }

  return { id: orderId, ...payload };
}

/**
 * Subscribes in real-time to a specific customer's orders
 */
export function subscribeUserOrders(userId, onData, onError) {
  if (!isFirebaseConfigured) {
    // Return empty unsubscribe function in offline/unconfigured mode
    return () => {};
  }

  const q = query(
    collection(db, 'orders'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      onData(orders);
    },
    (err) => {
      console.warn('[KuroPunk Firebase] Orders subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Subscribes in real-time to ALL orders (Admin only)
 */
export function subscribeAllOrders(onData, onError) {
  if (!isFirebaseConfigured) {
    return () => {};
  }

  const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const orders = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      onData(orders);
    },
    (err) => {
      console.warn('[KuroPunk Firebase] Admin all orders subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Mutates order status in Firestore (Triggers Cloud Function for WhatsApp)
 */
export async function updateOrderStatusInFirestore(orderId, newStatus) {
  if (!isFirebaseConfigured) return true;
  const orderRef = doc(db, 'orders', orderId);
  await updateDoc(orderRef, {
    status: newStatus,
    updatedAt: serverTimestamp()
  });
  return true;
}

/**
 * Uploads product image file to Firebase Storage with progress tracking
 */
export async function uploadProductImage(file, productId = 'prod', onProgress = null) {
  if (!file) throw new Error('No se ha proporcionado ningún archivo para subir.');

  if (!isFirebaseConfigured) {
    console.info('[Firebase Storage Guard] Modo simulación local: Retornando URL de objeto temporal para previsualización.');
    if (onProgress) onProgress(100);
    return URL.createObjectURL(file);
  }

  return new Promise((resolve, reject) => {
    try {
      const ext = file.name.split('.').pop() || 'png';
      const sanitizedId = String(productId).replace(/[^a-zA-Z0-9_-]/g, '_');
      const filename = `${sanitizedId}_${Date.now()}.${ext}`;
      const storageRef = ref(storage, `products/${filename}`);

      const uploadTask = uploadBytesResumable(storageRef, file, {
        contentType: file.type || 'image/jpeg'
      });

      uploadTask.on(
        'state_changed',
        (snapshot) => {
          if (snapshot.totalBytes > 0) {
            const progress = Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
            if (onProgress) onProgress(progress);
          }
        },
        (error) => {
          console.error('[Firebase Storage Error]', {
            code: error?.code,
            message: error?.message,
            error
          });
          reject(error);
        },
        async () => {
          try {
            const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
            if (onProgress) onProgress(100);
            resolve(downloadUrl);
          } catch (urlErr) {
            console.error('[Firebase Storage getDownloadURL Error]', urlErr);
            reject(urlErr);
          }
        }
      );
    } catch (err) {
      console.error('[Firebase Storage Exception]', err);
      reject(err);
    }
  });
}

/**
 * Products CRUD methods in Firestore
 * Enforces price and stock as Numbers, and sets imageUrl and images array.
 */
export async function saveProductInFirestore(productData) {
  const id = productData.id || productData.slug || `prod-${Date.now()}`;
  const images = Array.isArray(productData.images)
    ? productData.images
    : productData.imageUrl
    ? [productData.imageUrl]
    : [];

  const primaryImage = images[0] || productData.imageUrl || productData.image || '';
  const payload = {
    ...productData,
    id,
    price: Number(productData.price) || 0,
    stock: Number(productData.stock) || 0,
    images: images.length > 0 ? images : (primaryImage ? [primaryImage] : []),
    imageUrl: primaryImage,
    image: primaryImage,
    isActive: productData.isActive !== false,
    updatedAt: new Date().toISOString()
  };

  if (isFirebaseConfigured) {
    try {
      const prodRef = doc(db, 'products', id);
      await setDoc(
        prodRef,
        {
          ...payload,
          price: Number(payload.price),
          stock: Number(payload.stock),
          updatedAt: serverTimestamp(),
          createdAt: productData.createdAt || serverTimestamp()
        },
        { merge: true }
      );
    } catch (error) {
      console.error('[Firestore Error - saveProductInFirestore]', {
        code: error?.code,
        message: error?.message,
        error
      });
      throw error;
    }
  }

  return payload;
}

export async function deleteProductInFirestore(productId) {
  if (isFirebaseConfigured) {
    try {
      const prodRef = doc(db, 'products', productId);
      await deleteDoc(prodRef);
    } catch (error) {
      console.error('[Firestore Error - deleteProductInFirestore]', {
        code: error?.code,
        message: error?.message,
        error
      });
      throw error;
    }
  }
  return true;
}

/**
 * Real-time subscription to products collection in Firestore
 */
export function subscribeProducts(onData, onError) {
  if (!isFirebaseConfigured) {
    return () => {};
  }

  const q = query(collection(db, 'products'));

  return onSnapshot(
    q,
    (snapshot) => {
      const prods = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data()
      }));
      onData(prods);
    },
    (err) => {
      console.warn('[KuroPunk Firebase] Products subscription warning:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Bulk synchronizes catalog items into Firestore (One-click initial population)
 */
export async function syncCatalogToFirestore(catalogList) {
  if (!isFirebaseConfigured) {
    throw new Error('Firebase no está configurado.');
  }

  let count = 0;
  for (const item of catalogList) {
    await saveProductInFirestore(item);
    count++;
  }
  return count;
}
