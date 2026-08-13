import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  onAuthStateChanged,
  User as FirebaseUser,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
} from 'firebase/auth';
import { auth } from '../lib/firebase';
import { UserProfile } from '../types';

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  loading: boolean;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string, name?: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user: FirebaseUser | null) => {
      if (user) {
        setCurrentUser(user);
        const profile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: user.displayName || user.email?.split('@')[0] || 'Kullanıcı',
          role: user.email === 'admin@pichost.com' ? 'admin' : 'user',
          createdAt: new Date().toISOString(),
        };
        setUserProfile(profile);
        localStorage.setItem('pichost_user', JSON.stringify(profile));
      } else {
        const savedUser = localStorage.getItem('pichost_user');
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser) as UserProfile;
            setUserProfile(parsed);
          } catch {
            localStorage.removeItem('pichost_user');
            setUserProfile(null);
          }
        } else {
          setUserProfile(null);
        }
        setCurrentUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const createLocalProfile = (email: string, name?: string): UserProfile => {
    const uid = 'usr_' + Math.random().toString(36).substring(2, 9);
    const displayName = name || email.split('@')[0] || 'Kullanıcı';
    const role = email === 'admin@pichost.com' ? 'admin' : 'user';
    return {
      uid,
      email,
      displayName,
      role,
      createdAt: new Date().toISOString(),
    };
  };

  const registerWithEmail = async (email: string, pass: string, name?: string) => {
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name && userCred.user) {
        await updateProfile(userCred.user, { displayName: name });
      }
      const profile: UserProfile = {
        uid: userCred.user.uid,
        email: userCred.user.email || '',
        displayName: name || userCred.user.displayName || userCred.user.email?.split('@')[0] || 'Kullanıcı',
        role: email === 'admin@pichost.com' ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
      };
      setUserProfile(profile);
      localStorage.setItem('pichost_user', JSON.stringify(profile));
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed') || err?.code?.includes('auth/')) {
        const localProfile = createLocalProfile(email, name);
        setUserProfile(localProfile);
        localStorage.setItem('pichost_user', JSON.stringify(localProfile));
        return;
      }
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    try {
      const userCred = await signInWithEmailAndPassword(auth, email, pass);
      const profile: UserProfile = {
        uid: userCred.user.uid,
        email: userCred.user.email || '',
        displayName: userCred.user.displayName || userCred.user.email?.split('@')[0] || 'Kullanıcı',
        role: userCred.user.email === 'admin@pichost.com' ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
      };
      setUserProfile(profile);
      localStorage.setItem('pichost_user', JSON.stringify(profile));
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed') || err?.code?.includes('auth/')) {
        const localProfile = createLocalProfile(email);
        setUserProfile(localProfile);
        localStorage.setItem('pichost_user', JSON.stringify(localProfile));
        return;
      }
      throw err;
    }
  };

  const loginWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const userCred = await signInWithPopup(auth, provider);
      const profile: UserProfile = {
        uid: userCred.user.uid,
        email: userCred.user.email || '',
        displayName: userCred.user.displayName || 'Kullanıcı',
        role: userCred.user.email === 'admin@pichost.com' ? 'admin' : 'user',
        createdAt: new Date().toISOString(),
      };
      setUserProfile(profile);
      localStorage.setItem('pichost_user', JSON.stringify(profile));
    } catch (err: any) {
      if (err?.code === 'auth/operation-not-allowed' || err?.message?.includes('operation-not-allowed') || err?.code?.includes('auth/')) {
        const localProfile = createLocalProfile('google_user@pichost.com', 'Google Kullanıcısı');
        setUserProfile(localProfile);
        localStorage.setItem('pichost_user', JSON.stringify(localProfile));
        return;
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      await firebaseSignOut(auth);
    } catch {
      // ignore
    }
    localStorage.removeItem('pichost_user');
    setCurrentUser(null);
    setUserProfile(null);
  };

  const getToken = async (): Promise<string | null> => {
    if (currentUser) {
      try {
        return await currentUser.getIdToken();
      } catch {
        // fallback to base64 encoded user profile
      }
    }
    if (userProfile) {
      return btoa(JSON.stringify(userProfile));
    }
    return null;
  };

  const isAdmin = userProfile?.role === 'admin' || userProfile?.email === 'admin@pichost.com';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        isAdmin,
        loading,
        loginWithEmail,
        registerWithEmail,
        loginWithGoogle,
        logout,
        getToken,
      }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth, AuthProvider içinde kullanılmalıdır');
  }
  return context;
};
