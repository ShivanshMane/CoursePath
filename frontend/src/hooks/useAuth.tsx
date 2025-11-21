import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  AuthError,
  updateProfile as firebaseUpdateProfile,
  updatePassword as firebaseUpdatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider
} from 'firebase/auth';
import { auth } from '../config/firebase';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (data: { displayName?: string; academicYear?: string }) => Promise<void>;
  updatePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  error: string | null;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Demo mode - provide mock user for testing
  const DEMO_MODE = true;

  useEffect(() => {
    if (DEMO_MODE) {
      // Create a mock user object for demo
      const mockUser = {
        uid: 'bbd084de-8ee3-4ca2-9fc1-a5776a2710ef',
        email: 'demo@depauw.edu',
        displayName: 'Demo User',
        emailVerified: true,
        isAnonymous: false,
        metadata: {},
        providerData: [],
        refreshToken: 'demo-token',
        tenantId: null,
        delete: () => Promise.resolve(),
        getIdToken: () => Promise.resolve('demo-id-token'),
        getIdTokenResult: () => Promise.resolve({
          token: 'demo-id-token',
          authTime: new Date().toISOString(),
          issuedAtTime: new Date().toISOString(),
          expirationTime: new Date(Date.now() + 3600000).toISOString(),
          signInProvider: 'password',
          signInSecondFactor: null,
          claims: {},
          audience: 'coursepath-demo',
          issuer: 'https://securetoken.google.com/coursepath-demo'
        }),
        reload: () => Promise.resolve(),
        toJSON: () => ({}),
        phoneNumber: null,
        photoURL: null,
        providerId: 'firebase'
      } as User;
      
      setUser(mockUser);
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signUp = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await createUserWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const authError = error as AuthError;
      setError(getErrorMessage(authError.code));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setError(null);
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      const authError = error as AuthError;
      setError(getErrorMessage(authError.code));
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setError(null);
      await signOut(auth);
    } catch (error) {
      const authError = error as AuthError;
      setError(getErrorMessage(authError.code));
      throw error;
    }
  };

  const updateProfile = async (data: { displayName?: string; academicYear?: string }) => {
    try {
      setError(null);
      if (!user) throw new Error('No user logged in');
      
      if (DEMO_MODE) {
        // In demo mode, simulate profile update by updating local state
        setUser(prev => prev ? { 
          ...prev, 
          displayName: data.displayName || prev.displayName 
        } : null);
        
        // Store academic year in localStorage
        if (data.academicYear) {
          localStorage.setItem('academicYear', data.academicYear);
        }
        
        return; // Exit early for demo mode
      }
      
      await firebaseUpdateProfile(user, {
        displayName: data.displayName
      });
      
      // Store academic year in localStorage since Firebase doesn't have a built-in field for this
      if (data.academicYear) {
        localStorage.setItem('academicYear', data.academicYear);
      }
    } catch (error) {
      const authError = error as AuthError;
      setError(getErrorMessage(authError.code));
      throw error;
    }
  };

  const updatePassword = async (currentPassword: string, newPassword: string) => {
    try {
      setError(null);
      if (!user) throw new Error('No user logged in');
      
      if (DEMO_MODE) {
        // In demo mode, simulate password update
        // Store new password in localStorage (not secure, but for demo purposes)
        localStorage.setItem('demoPassword', newPassword);
        return; // Exit early for demo mode
      }
      
      // Re-authenticate user before updating password
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);
      
      // Update password
      await firebaseUpdatePassword(user, newPassword);
    } catch (error) {
      const authError = error as AuthError;
      setError(getErrorMessage(authError.code));
      throw error;
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    logout,
    updateProfile,
    updatePassword,
    error,
    clearError,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Helper function to convert Firebase error codes to user-friendly messages
const getErrorMessage = (errorCode: string): string => {
  switch (errorCode) {
    case 'auth/user-not-found':
      return 'No user found with this email address.';
    case 'auth/wrong-password':
      return 'Incorrect password.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please check your credentials and try again.';
    case 'auth/email-already-in-use':
      return 'An account with this email already exists.';
    case 'auth/weak-password':
      return 'Password should be at least 6 characters.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/user-disabled':
      return 'This account has been disabled.';
    case 'auth/too-many-requests':
      return 'Too many failed attempts. Please try again later.';
    case 'auth/network-request-failed':
      return 'Network error. Please check your connection.';
    default:
      return 'An error occurred. Please try again.';
  }
};
