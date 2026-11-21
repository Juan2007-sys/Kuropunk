import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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

  useEffect(() => {
    try {
      localStorage.removeItem('kuropunk_demo_auth');
    } catch {}

    let unsubscribe = () => {};
    let isMounted = true;

    try {
      unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (!isMounted) return;
        if (firebaseUser) {
          try {
            const profile = await syncUserProfile(firebaseUser);
            const role = await getUserRole(firebaseUser);
            if (!isMounted) return;
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
            if (!isMounted) return;
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
          setCurrentUser(null);
          setUserRole('customer');
        }
        if (isMounted) setLoading(false);
      });
    } catch (e) {
      console.warn('Firebase Auth state listener error:', e);
      setCurrentUser(null);
      setUserRole('customer');
      setLoading(false);
    }

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = useCallback(async () => {
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
  }, []);

  const loginWithEmail = useCallback(async (email, password) => {
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
  }, []);

  const registerWithEmail = useCallback(async (email, password, displayName, phoneNumber) => {
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
  }, []);

  const logout = useCallback(async () => {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('[KuroPunk Auth] SignOut warning:', e);
    }
    localStorage.removeItem('kuropunk_demo_auth');
    sessionStorage.clear();
    setCurrentUser(null);
    setUserRole('customer');
  }, []);

  const isAdmin = Boolean(currentUser && userRole === 'admin');

  const value = useMemo(() => ({
    currentUser,
    userRole,
    isAdmin,
    loading,
    isFirebaseConfigured,
    redirectIntent,
    setRedirectIntent,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout
  }), [
    currentUser,
    userRole,
    isAdmin,
    loading,
    redirectIntent,
    loginWithGoogle,
    loginWithEmail,
    registerWithEmail,
    logout
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
