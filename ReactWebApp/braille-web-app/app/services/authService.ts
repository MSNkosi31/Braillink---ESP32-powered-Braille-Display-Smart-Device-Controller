import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  GoogleAuthProvider,
  signInWithPopup
} from 'firebase/auth';
import { doc, setDoc, getDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '~/config/firebase';

// Define Firebase User type locally to avoid import issues
interface FirebaseUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  emailVerified: boolean;
}

// User interface for our application
export interface AppUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: 'admin' | 'caregiver' | 'family';
  phoneNumber?: string;
  organization?: string;
  emailVerified: boolean;
  createdAt: string;
  lastLoginAt: string;
}

// Convert Firebase User to App User
export const convertFirebaseUser = async (firebaseUser: FirebaseUser): Promise<AppUser> => {
  try {
    // Get additional user data from Firestore
    const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
    const userData = userDoc.exists() ? userDoc.data() : null;

    console.log('Converting Firebase user:', firebaseUser.email);
    console.log('Firestore user data:', userData);

    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      role: userData?.role || 'caregiver',
      phoneNumber: userData?.phoneNumber || '',
      organization: userData?.organization || '',
      emailVerified: firebaseUser.emailVerified,
      createdAt: userData?.createdAt || new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
  } catch (error) {
    console.error('Error converting Firebase user:', error);
    // Return a basic user object if Firestore fails
    return {
      uid: firebaseUser.uid,
      email: firebaseUser.email,
      displayName: firebaseUser.displayName,
      role: 'caregiver',
      phoneNumber: '',
      organization: '',
      emailVerified: firebaseUser.emailVerified,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString()
    };
  }
};

// Authentication Service Class
export class AuthService {
  // Sign in with email and password
  static async signIn(email: string, password: string): Promise<AppUser> {
    try {
      console.log('AuthService: Starting email sign in for:', email);
      const startTime = Date.now();
      
      console.log('AuthService: Calling signInWithEmailAndPassword...');
      const userCredential: any = await signInWithEmailAndPassword(auth, email, password);
      console.log('AuthService: Email sign in successful:', userCredential.user.email);
      
      console.log('AuthService: Updating last login time...');
      // Update last login time
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        lastLoginAt: new Date().toISOString()
      });
      console.log('AuthService: Last login time updated');

      console.log('AuthService: Converting Firebase user...');
      const result = await convertFirebaseUser(userCredential.user);
      
      const endTime = Date.now();
      console.log(`AuthService: Sign in completed in ${endTime - startTime}ms`);
      
      return result;
    } catch (error: any) {
      console.error('AuthService: Email sign in error:', error);
      console.error('AuthService: Error code:', error.code);
      console.error('AuthService: Error message:', error.message);
      
      // Return the actual Firebase error message instead of generic one
      if (error.code) {
        throw new Error(`${error.code}: ${error.message}`);
      } else {
        throw new Error(`Authentication failed: ${error.message}`);
      }
    }
  }

  // Sign up with email and password
  static async signUp(
    email: string, 
    password: string, 
    displayName: string, 
    role: string = 'caregiver'
  ): Promise<AppUser> {
    try {
      const userCredential: any = await createUserWithEmailAndPassword(auth, email, password);
      
      // Update the user's display name
      await updateProfile(userCredential.user, {
        displayName: displayName
      });

      // Create user document in Firestore
      const userData = {
        role: role as 'admin' | 'caregiver' | 'family',
        phoneNumber: '',
        organization: '',
        createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', userCredential.user.uid), userData);

      return await convertFirebaseUser(userCredential.user);
    } catch (error: any) {
      console.error('Email signup error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      // Return the actual Firebase error message instead of generic one
      if (error.code) {
        throw new Error(`${error.code}: ${error.message}`);
      } else {
        throw new Error(`Signup failed: ${error.message}`);
      }
    }
  }

  // Sign in with Google
  static async signInWithGoogle(): Promise<AppUser> {
    try {
      console.log('Starting Google authentication...');
      const provider = new GoogleAuthProvider();
      
      // Add additional scopes if needed
      provider.addScope('email');
      provider.addScope('profile');
      
      console.log('Opening Google popup...');
      const userCredential: any = await signInWithPopup(auth, provider);
      console.log('Google authentication successful:', userCredential.user.email);
      
      // Check if user document exists, if not create it
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      if (!userDoc.exists()) {
        console.log('Creating new user document...');
        const userData = {
          role: 'caregiver' as const,
          phoneNumber: '',
          organization: '',
          createdAt: new Date().toISOString(),
          lastLoginAt: new Date().toISOString()
        };
        await setDoc(doc(db, 'users', userCredential.user.uid), userData);
      } else {
        console.log('Updating last login time...');
        // Update last login time
        await updateDoc(doc(db, 'users', userCredential.user.uid), {
          lastLoginAt: new Date().toISOString()
        });
      }

      return await convertFirebaseUser(userCredential.user);
    } catch (error: any) {
      console.error('Google authentication error:', error);
      console.error('Error code:', error.code);
      console.error('Error message:', error.message);
      
      if (error.code === 'auth/popup-closed-by-user') {
        throw new Error('Google sign-in was cancelled. Please try again.');
      } else if (error.code === 'auth/popup-blocked') {
        throw new Error('Popup was blocked by browser. Please allow popups for localhost:5173 and try again.');
      } else if (error.code === 'auth/network-request-failed') {
        throw new Error('Network error. Please check your internet connection.');
      } else if (error.code === 'auth/operation-not-allowed') {
        throw new Error('Google sign-in is not enabled. Please contact administrator.');
      } else if (error.code === 'auth/unauthorized-domain') {
        throw new Error('This domain is not authorized for Google sign-in.');
      } else if (error.code === 'auth/account-exists-with-different-credential') {
        throw new Error('An account already exists with this email using a different sign-in method.');
      } else {
        throw new Error(`Google authentication failed: ${error.code || 'unknown'}: ${error.message}`);
      }
    }
  }

  // Sign out
  static async signOut(): Promise<void> {
    try {
      await signOut(auth);
    } catch (error: any) {
      throw new Error('Failed to sign out. Please try again.');
    }
  }

  // Send password reset email
  static async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(auth, email);
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Update user profile
  static async updateUserProfile(updates: Partial<AppUser>): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user) throw new Error('No user logged in');

      // Update Firebase Auth profile
      if (updates.displayName) {
        await updateProfile(user, {
          displayName: updates.displayName
        });
      }

      // Update Firestore document
      const updateData: any = {};
      if (updates.role) updateData.role = updates.role;
      if (updates.phoneNumber !== undefined) updateData.phoneNumber = updates.phoneNumber;
      if (updates.organization !== undefined) updateData.organization = updates.organization;

      if (Object.keys(updateData).length > 0) {
        await updateDoc(doc(db, 'users', user.uid), updateData);
      }
    } catch (error: any) {
      throw new Error('Failed to update profile. Please try again.');
    }
  }

  // Change password
  static async changePassword(currentPassword: string, newPassword: string): Promise<void> {
    try {
      const user = auth.currentUser;
      if (!user || !user.email) throw new Error('No user logged in');

      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);
    } catch (error: any) {
      throw new Error(this.getErrorMessage(error.code));
    }
  }

  // Get current user
  static async getCurrentUser(): Promise<AppUser | null> {
    const user = auth.currentUser;
    if (!user) return null;
    return await convertFirebaseUser(user);
  }

  // Error message mapping
  private static getErrorMessage(errorCode: string): string {
    switch (errorCode) {
      case 'auth/user-not-found':
        return 'No user found with this email address.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters long.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-disabled':
        return 'This account has been disabled.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      case 'auth/network-request-failed':
        return 'Network error. Please check your connection.';
      case 'auth/requires-recent-login':
        return 'Please sign in again to complete this action.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}
