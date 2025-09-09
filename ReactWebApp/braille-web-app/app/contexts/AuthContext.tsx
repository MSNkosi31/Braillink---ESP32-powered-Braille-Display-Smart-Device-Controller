import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '~/config/firebase';
import { AuthService, convertFirebaseUser } from '~/services/authService';
import type { AppUser } from '~/services/authService';

// Define Firebase User type locally to avoid import issues
interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

// Use the AppUser interface from authService
type User = AppUser;

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  signup: (email: string, password: string, displayName: string, role: string) => Promise<User>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<User>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (updates: Partial<User>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  sendEmailVerification: () => Promise<void>;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false); // Start with false for faster initial load

  // Firebase authentication functions
  async function signup(email: string, password: string, displayName: string, role: string = 'caregiver'): Promise<User> {
    try {
      console.log('AuthContext: Starting signup for:', email);
      const startTime = Date.now();
      
      const result = await AuthService.signUp(email, password, displayName, role);
      
      const endTime = Date.now();
      console.log(`AuthContext: Signup completed in ${endTime - startTime}ms`);
      
      return result;
    } catch (error) {
      console.error('AuthContext: Signup error:', error);
      throw error;
    }
  }

  async function login(email: string, password: string): Promise<User> {
    try {
      console.log('AuthContext: Starting login for:', email);
      const startTime = Date.now();
      
      const result = await AuthService.signIn(email, password);
      
      const endTime = Date.now();
      console.log(`AuthContext: Login completed in ${endTime - startTime}ms`);
      
      return result;
    } catch (error) {
      console.error('AuthContext: Login error:', error);
      throw error;
    }
  }

  async function logout(): Promise<void> {
    try {
      await AuthService.signOut();
    } catch (error) {
      throw error;
    }
  }

  async function loginWithGoogle(): Promise<User> {
    try {
      return await AuthService.signInWithGoogle();
    } catch (error) {
      throw error;
    }
  }

  async function resetPassword(email: string): Promise<void> {
    try {
      await AuthService.resetPassword(email);
    } catch (error) {
      throw error;
    }
  }

  async function updateProfile(updates: Partial<User>): Promise<void> {
    try {
      await AuthService.updateUserProfile(updates);
      // Refresh current user data
      const updatedUser = await AuthService.getCurrentUser();
      if (updatedUser) {
        setCurrentUser(updatedUser);
      }
    } catch (error) {
      throw error;
    }
  }

  async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      await AuthService.changePassword(currentPassword, newPassword);
    } catch (error) {
      throw error;
    }
  }

  async function sendEmailVerification(): Promise<void> {
    // This would typically be handled by Firebase Auth
    // For now, we'll just log it
    console.log('Email verification would be sent via Firebase Auth');
  }

  useEffect(() => {
    try {
      // Reasonable timeout for auth initialization
      const timeoutId = setTimeout(() => {
        console.warn('Firebase auth initialization timeout - setting loading to false');
        setLoading(false);
      }, 5000); // 5 second timeout

      const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
        clearTimeout(timeoutId); // Clear timeout when auth state changes
        
        if (firebaseUser) {
          try {
            const appUser = await convertFirebaseUser(firebaseUser);
            setCurrentUser(appUser);
          } catch (error) {
            console.error('Error converting Firebase user:', error);
            setCurrentUser(null);
          }
        } else {
          setCurrentUser(null);
        }
        setLoading(false);
      });

      // Cleanup subscription on unmount
      return () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
    } catch (error) {
      console.error('Error setting up auth state listener:', error);
      setLoading(false);
    }
  }, []);

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    loginWithGoogle,
    resetPassword,
    updateProfile,
    changePassword,
    sendEmailVerification,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === 'admin'
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
