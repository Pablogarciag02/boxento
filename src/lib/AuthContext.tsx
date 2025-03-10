import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  User,
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
  getAuth
} from 'firebase/auth';
import { app } from './firebase';

// Define the auth context shape
export interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  googleSignIn: () => Promise<void>;
  githubSignIn: () => Promise<void>;
  twitterSignIn: () => Promise<void>;
  facebookSignIn: () => Promise<void>;
  appleSignIn: () => Promise<void>;
  microsoftSignIn: () => Promise<void>;
  phoneSignIn: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook to use the auth context
export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const auth = getAuth(app);

  // Handle sign in with email and password
  const login = (email: string, password: string) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Handle account creation
  const signup = (email: string, password: string) => {
    return createUserWithEmailAndPassword(auth, email, password);
  };

  // Handle Google sign in
  const googleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // Handle GitHub sign in
  const githubSignIn = async () => {
    const provider = new GithubAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // Handle Twitter sign in
  const twitterSignIn = async () => {
    const provider = new TwitterAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // Handle Facebook sign in
  const facebookSignIn = async () => {
    const provider = new FacebookAuthProvider();
    return signInWithPopup(auth, provider);
  };

  // Handle Apple sign in
  const appleSignIn = async () => {
    const provider = new OAuthProvider('apple.com');
    return signInWithPopup(auth, provider);
  };

  // Handle Microsoft sign in
  const microsoftSignIn = async () => {
    const provider = new OAuthProvider('microsoft.com');
    return signInWithPopup(auth, provider);
  };

  // Handle phone sign in
  const phoneSignIn = async () => {
    // Note: Phone authentication requires additional setup with Firebase
    // and typically needs a more complex flow with verification codes
    const provider = new PhoneAuthProvider(auth);
    throw new Error('Phone authentication not implemented yet');
  };

  // Handle logout
  const logout = () => {
    return signOut(auth);
  };

  // Set up auth state observer
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false);
    });

    return unsubscribe;
  }, [auth]);

  const value = {
    currentUser,
    loading,
    login,
    signup,
    logout,
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