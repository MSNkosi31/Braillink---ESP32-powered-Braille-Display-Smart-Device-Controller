import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { auth } from '~/config/firebase';
import { AuthService, AppUser, convertFirebaseUser } from '~/services/authService';

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
  const [loading, setLoading] = useState(true);

  // Firebase authentication functions
  async function signup(email: string, password: string, displayName: string, role: string = 'caregiver'): Promise<User> {
    try {
      return await AuthService.signUp(email, password, displayName, role);
    } catch (error) {
      throw error;
    }
  }

  async function login(email: string, password: string): Promise<User> {
    try {
      return await AuthService.signIn(email, password);
    } catch (error) {
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
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
    return () => unsubscribe();
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
