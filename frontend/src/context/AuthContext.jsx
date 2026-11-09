import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  auth,
  googleProvider,
  syncUserProfile,
  getUserRole,
  isFirebaseConfigured
} from '../services/firebase';
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userRole, setUserRole] = useState('customer');
  const [loading, setLoading] = useState(true);
  const [redirectIntent, setRedirectIntent] = useState(null);

  // Development fallback user restricted strictly to DEV environment (disabled in production)
  const [devDemoUser, setDevDemoUser] = useState(() => {
    if (!import.meta.env.DEV) return null;
    try {
      const saved = localStorage.getItem('kuropunk_demo_auth');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  useEffect(() => {
    let unsubscribe = () => {};

    try {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const profile = await syncUserProfile(firebaseUser);
            const role = await getUserRole(firebaseUser);
            const isAdminRole = role === 'admin';
            
            setUserRole(role);
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || profile?.displayName || 'Operativo KuroPunk',
              phoneNumber: firebaseUser.phoneNumber || profile?.phoneNumber || '',
              photoURL: firebaseUser.photoURL,
              role,
              isAdmin: isAdminRole
            });
          } catch (profileErr) {
            console.warn('[KuroPunk Auth] Error al sincronizar perfil o rol:', profileErr);
            setUserRole('customer');
            setCurrentUser({
              uid: firebaseUser.uid,
              email: firebaseUser.email,
              displayName: firebaseUser.displayName || 'Operativo KuroPunk',
              phoneNumber: firebaseUser.phoneNumber || '',
              photoURL: firebaseUser.photoURL,
              role: 'customer',
              isAdmin: false
            });
          }
        } else {
          // Strict wipeout: if user === null, purge immediately
          if (!devDemoUser) {
            setCurrentUser(null);
            setUserRole('customer');
          } else {
            // Only keep dev demo if explicitly set in dev testing
            setCurrentUser(devDemoUser);
            setUserRole(devDemoUser.role || 'customer');
          }
        }
        setLoading(false);
      });
    } catch (e) {
      console.warn('Firebase Auth state listener error (using dev demo user if set):', e);
      if (devDemoUser) {
        setCurrentUser(devDemoUser);
        setUserRole(devDemoUser.role || 'customer');
      } else {
        setCurrentUser(null);
        setUserRole('customer');
      }
      setLoading(false);
    }

    return () => unsubscribe();
  }, [devDemoUser]);

  // Google Sign-In with robust configuration and explicit error handling
  const loginWithGoogle = async () => {
    try {
      googleProvider.setCustomParameters({ prompt: 'select_account' });
      const res = await signInWithPopup(auth, googleProvider);
      const profile = await syncUserProfile(res.user);
      const role = await getUserRole(res.user);
      const isAdminRole = role === 'admin';

      setUserRole(role);
      const userObj = {
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName,
        phoneNumber: res.user.phoneNumber || profile?.phoneNumber || '',
        photoURL: res.user.photoURL,
        role,
        isAdmin: isAdminRole
      };
      setCurrentUser(userObj);
      return userObj;
    } catch (error) {
      console.error('[KuroPunk Auth] Google Sign-in exception:', {
        code: error?.code,
        message: error?.message,
        error
      });

      if (error?.code === 'auth/configuration-not-found') {
        const customErr = new Error(
          'El proveedor Google no está activo en Firebase Console > Authentication > Sign-in method'
        );
        customErr.code = 'auth/configuration-not-found';
        throw customErr;
      }
      if (error?.code === 'auth/unauthorized-domain') {
        const customErr = new Error(
          'El dominio de tu tienda no está autorizado en Firebase. Agrega "kuropunk.vercel.app" en Firebase Console > Authentication > Settings > Authorized domains.'
        );
        customErr.code = 'auth/unauthorized-domain';
        throw customErr;
      }
      throw error;
    }
  };

  // Email / Password Login (Zero-Trust: Verifica credenciales reales en Firebase Auth)
  const loginWithEmail = async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !password) {
      throw new Error('Debes ingresar correo y contraseña.');
    }

    try {
      const res = await signInWithEmailAndPassword(auth, cleanEmail, password);
      const profile = await syncUserProfile(res.user);
      const role = await getUserRole(res.user);
      const isAdminRole = role === 'admin';

      setUserRole(isAdminRole ? 'admin' : role);
      const userObj = {
        uid: res.user.uid,
        email: res.user.email,
        displayName: res.user.displayName || profile?.displayName,
        phoneNumber: profile?.phoneNumber || '',
        role: isAdminRole ? 'admin' : role,
        isAdmin: isAdminRole
      };
      setCurrentUser(userObj);
      return userObj;
    } catch (error) {
      console.error('[KuroPunk Auth] Email sign-in failed:', error);
      throw error;
    }
  };

  // Email / Password Registration
  const registerWithEmail = async (email, password, displayName, phoneNumber) => {
    try {
      const res = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(res.user, { displayName });
      await syncUserProfile(res.user, { displayName, phoneNumber, role: 'customer' });
      const userObj = {
        uid: res.user.uid,
        email: res.user.email,
        displayName,
        phoneNumber,
        role: 'customer',
        isAdmin: false
      };
      setCurrentUser(userObj);
      setUserRole('customer');
      return userObj;
    } catch (error) {
      console.error('[KuroPunk Auth] Registration failed:', error);
      throw error;
    }
  };

  // Total Logout: signs out, purges all stored tokens/caches, resets state to null/customer
  const logout = async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('[KuroPunk Auth] SignOut warning:', e);
    }
    localStorage.removeItem('kuropunk_demo_auth');
    sessionStorage.clear();
    setDevDemoUser(null);
    setCurrentUser(null);
    setUserRole('customer');
  };

  // Fast Dev Mode Role Switcher (Allows testing Admin Panel and Customer views effortlessly)
  const setDemoSession = (role = 'admin') => {
    const demo = {
      uid: role === 'admin' ? 'admin_kuro_master' : 'customer_santiago_qa',
      email: role === 'admin' ? 'admin@kuropunk.co' : 'santiago.qa@kuropunk.co',
      displayName: role === 'admin' ? 'Admin Master (Taller KuroPunk)' : 'Santiago Vélez (Cliente)',
      phoneNumber: '+573015690382',
      role,
      isAdmin: role === 'admin'
    };
    localStorage.setItem('kuropunk_demo_auth', JSON.stringify(demo));
    setDevDemoUser(demo);
    setCurrentUser(demo);
    setUserRole(role);
  };

  const value = {
    currentUser,
    userRole,
    isAdmin: Boolean(currentUser && (userRole === 'admin' || currentUser?.isAdmin === true)),
    loading,
    isFirebaseConfigured,
    redirectIntent,
    setRedirectIntent,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout,
    setDemoSession
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
