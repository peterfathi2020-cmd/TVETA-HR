import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { AuthService } from '../services/api';
import { auth } from '../services/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) {
      setLoading(false);
      return;
    }
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          // Fetch user profile from Firestore or use default
          const userProfile = await AuthService.getUserProfile(firebaseUser.email || '');
          setUser(userProfile);
          localStorage.setItem('nezam_user', JSON.stringify(userProfile));
        } else {
          setUser(null);
          localStorage.removeItem('nezam_user');
        }
      } catch (error) {
        console.error('Auth initialization failed', error);
        setUser(null);
        localStorage.removeItem('nezam_user');
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);

  const login = (userData: User) => {
    setUser(userData);
    localStorage.setItem('nezam_user', JSON.stringify(userData));
  };

  const logout = async () => {
    try {
      if (auth) {
        await auth.signOut();
      }
    } catch (error) {
      console.error('Logout failed', error);
    }
    setUser(null);
    localStorage.removeItem('nezam_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};