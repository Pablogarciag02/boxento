import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
  UserCredential,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  GithubAuthProvider,
  TwitterAuthProvider,
  FacebookAuthProvider,
  OAuthProvider,
  PhoneAuthProvider,
  getAuth,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPhoneNumber,
  ApplicationVerifier,
  ConfirmationResult,
  Auth,
  AuthProvider as FirebaseAuthProvider
} from 'firebase/auth';
import { app, withRetry, handleFirebaseError } from './firebase';

// Define the auth context shape
export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserCredential>;
  signup: (email: string, password: string) => Promise<UserCredential>;
  logout: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  verifyEmail: () => Promise<void>;
  verifyPhoneNumber: (phoneNumber: string, appVerifier: ApplicationVerifier) => Promise<string>;
  confirmPhoneCode: (verificationId: string, code: string) => Promise<void>;
  googleSignIn: () => Promise<UserCredential>;
  githubSignIn: () => Promise<UserCredential>;
  twitterSignIn: () => Promise<UserCredential>;
  facebookSignIn: () => Promise<UserCredential>;
  appleSignIn: () => Promise<UserCredential>;
  microsoftSignIn: () => Promise<UserCredential>;
  phoneSignIn: () => Promise<never>; // This will always throw
}

// Default context value
const defaultAuthContext: AuthContextType = {
  currentUser: null,
  loading: true,
  login: async () => {
    throw new Error('AuthContext not initialized');
  },
  signup: async () => {
    throw new Error('AuthContext not initialized');
  },
  logout: async () => {
    throw new Error('AuthContext not initialized');
  },
  resetPassword: async () => {
    throw new Error('AuthContext not initialized');
  },
  verifyEmail: async () => {
    throw new Error('AuthContext not initialized');
  },
  verifyPhoneNumber: async () => {
    throw new Error('AuthContext not initialized');
  },
  confirmPhoneCode: async () => {
    throw new Error('AuthContext not initialized');
  },
  googleSignIn: async () => {
    throw new Error('AuthContext not initialized');
  },
  githubSignIn: async () => {
    throw new Error('AuthContext not initialized');
  },
  twitterSignIn: async () => {
    throw new Error('AuthContext not initialized');
  },
  facebookSignIn: async () => {
    throw new Error('AuthContext not initialized');
  },
  appleSignIn: async () => {
    throw new Error('AuthContext not initialized');
  },
  microsoftSignIn: async () => {
    throw new Error('AuthContext not initialized');
  },
  phoneSignIn: async () => {
    throw new Error('AuthContext not initialized');
  }
};

const AuthContext = createContext<AuthContextType>(defaultAuthContext);

// Custom hook to use the auth context
export function useAuth(): AuthContextType {
  const context = useContext<AuthContextType>(AuthContext);
  if (context === defaultAuthContext) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: React.ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps): JSX.Element {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null);
  const auth: Auth = getAuth(app);

  // Handle sign in with email and password
  const login = async (email: string, password: string): Promise<UserCredential> => {
    try {
      return await withRetry(() => signInWithEmailAndPassword(auth, email, password));
    } catch (error) {
      handleFirebaseError(error);
    }
  };

  // Handle account creation
  const signup = async (email: string, password: string): Promise<UserCredential> => {
    try {
      const result = await withRetry(() => createUserWithEmailAndPassword(auth, email, password));
      if (result.user) {
        await withRetry(() => sendEmailVerification(result.user));
      }
      return result;
    } catch (error) {
      handleFirebaseError(error);
    }
  };

  // Handle password reset
  const resetPassword = async (email: string): Promise<void> => {
    try {
      await withRetry(() => sendPasswordResetEmail(auth, email));
    } catch (error) {
      handleFirebaseError(error);
    }
  };

  // Handle email verification
  const verifyEmail = async (): Promise<void> => {
    try {
      if (currentUser) {
        await withRetry(() => sendEmailVerification(currentUser));
      } else {
        throw new Error('No user signed in');
      }
    } catch (error) {
      handleFirebaseError(error);
    }
  };

  // Handle phone number verification
  const verifyPhoneNumber = async (
    phoneNumber: string, 
    appVerifier: ApplicationVerifier
  ): Promise<string> => {
    try {
      const result = await withRetry(() => signInWithPhoneNumber(auth, phoneNumber, appVerifier));
      setConfirmationResult(result);
      return result.verificationId;
    } catch (error) {
      handleFirebaseError(error);
    }
  };

  // Handle phone code confirmation
  const confirmPhoneCode = async (verificationId: string, code: string): Promise<void> => {
    try {
      if (confirmationResult) {
        await withRetry(() => confirmationResult.confirm(code));
      } else {
        throw new Error('No verification in progress');
      }
    } catch (error) {
      handleFirebaseError(error);
    }
  };

  // Handle social sign in methods
  const handleSocialSignIn = async (provider: FirebaseAuthProvider): Promise<UserCredential> => {
    try {
      return await withRetry(() => signInWithPopup(auth, provider));
    } catch (error) {
      handleFirebaseError(error);
    }
  };

  // Handle Google sign in
  const googleSignIn = () => handleSocialSignIn(new GoogleAuthProvider());

  // Handle GitHub sign in
  const githubSignIn = () => handleSocialSignIn(new GithubAuthProvider());

  // Handle Twitter sign in
  const twitterSignIn = () => handleSocialSignIn(new TwitterAuthProvider());

  // Handle Facebook sign in
  const facebookSignIn = () => handleSocialSignIn(new FacebookAuthProvider());

  // Handle Apple sign in
  const appleSignIn = () => handleSocialSignIn(new OAuthProvider('apple.com'));

  // Handle Microsoft sign in
  const microsoftSignIn = () => handleSocialSignIn(new OAuthProvider('microsoft.com'));

  // Handle phone sign in
  const phoneSignIn = async (): Promise<never> => {
    throw new Error('Use verifyPhoneNumber and confirmPhoneCode instead');
  };

  // Handle logout
  const logout = async (): Promise<void> => {
    try {
      await withRetry(() => signOut(auth));
    } catch (error) {
      handleFirebaseError(error);
    }
  };

  // Set up auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  const value: AuthContextType = {
    currentUser,
    loading,
    login,
    signup,
    logout,
    resetPassword,
    verifyEmail,
    verifyPhoneNumber,
    confirmPhoneCode,
    googleSignIn,
    githubSignIn,
    twitterSignIn,
    facebookSignIn,
    appleSignIn,
    microsoftSignIn,
    phoneSignIn
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
} 