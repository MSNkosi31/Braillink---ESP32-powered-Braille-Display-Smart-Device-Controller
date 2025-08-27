import React, { createContext, useContext, useEffect, useState } from 'react';

// Mock user interface for demo purposes
interface MockUser {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  currentUser: MockUser | null;
  login: (email: string, password: string) => Promise<any>;
  signup: (email: string, password: string, displayName: string) => Promise<any>;
  logout: () => Promise<void>;
  loginWithGoogle: () => Promise<any>;
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
  const [currentUser, setCurrentUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Mock authentication functions for demo
  function signup(email: string, password: string, displayName: string) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password && displayName) {
          const mockUser: MockUser = {
            uid: Date.now().toString(),
            email: email,
            displayName: displayName
          };
          setCurrentUser(mockUser);
          localStorage.setItem('mockUser', JSON.stringify(mockUser));
          resolve(mockUser);
        } else {
          reject(new Error('Please fill in all fields'));
        }
      }, 1000);
    });
  }

  function login(email: string, password: string) {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          const mockUser: MockUser = {
            uid: Date.now().toString(),
            email: email,
            displayName: email.split('@')[0] // Use email prefix as display name
          };
          setCurrentUser(mockUser);
          localStorage.setItem('mockUser', JSON.stringify(mockUser));
          resolve(mockUser);
        } else {
          reject(new Error('Please fill in all fields'));
        }
      }, 1000);
    });
  }

  function logout() {
    return new Promise<void>((resolve) => {
      setCurrentUser(null);
      localStorage.removeItem('mockUser');
      resolve();
    });
  }

  function loginWithGoogle() {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        const mockUser: MockUser = {
          uid: Date.now().toString(),
          email: 'demo@gmail.com',
          displayName: 'Demo User'
        };
        setCurrentUser(mockUser);
        localStorage.setItem('mockUser', JSON.stringify(mockUser));
        resolve(mockUser);
      }, 1000);
    });
  }

  useEffect(() => {
    // Check for existing user in localStorage
    const savedUser = localStorage.getItem('mockUser');
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const value = {
    currentUser,
    login,
    signup,
    logout,
    loginWithGoogle
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
