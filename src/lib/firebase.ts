import { initializeApp, FirebaseApp, FirebaseOptions } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore } from 'firebase/firestore';
import { FirebaseError as FirebaseSDKError } from 'firebase/app';

// Firebase configuration
const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Validate Firebase configuration
Object.entries(firebaseConfig).forEach(([key, value]) => {
  if (!value) {
    throw new Error(`Firebase configuration error: ${key} is not set`);
  }
});

// Custom error types
export class FirebaseError extends Error {
  constructor(message: string, public code?: string) {
    super(message);
    this.name = 'FirebaseError';
  }
}

export class FirebaseAuthError extends FirebaseError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'FirebaseAuthError';
  }
}

export class FirebaseDbError extends FirebaseError {
  constructor(message: string, code?: string) {
    super(message, code);
    this.name = 'FirebaseDbError';
  }
}

// Retry utility for Firebase operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  retries = 3,
  delay = 1000,
  shouldRetry?: (error: unknown) => boolean
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (
      retries === 0 || 
      (error instanceof FirebaseSDKError && error.code === 'permission-denied') ||
      (shouldRetry && !shouldRetry(error))
    ) {
      throw error;
    }
    
    console.warn(`Firebase operation failed, retrying... (${retries} attempts left)`);
    await new Promise(resolve => setTimeout(resolve, delay));
    return withRetry(operation, retries - 1, delay * 1.5, shouldRetry);
  }
}

// Initialize Firebase
let app: FirebaseApp;
let auth: Auth;
let db: Firestore;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
} catch (error) {
  console.error('Failed to initialize Firebase:', error);
  throw error;
}

// Export initialized services
export { app, auth, db };

// Error handler utility
export function handleFirebaseError(error: unknown): never {
  console.error('Firebase operation failed:', error);
  
  if (error instanceof FirebaseSDKError) {
    // Auth errors
    if (error.code?.startsWith('auth/')) {
      throw new FirebaseAuthError(
        error.message || 'Authentication failed',
        error.code
      );
    }
    
    // Firestore errors
    if (error.code?.startsWith('firestore/')) {
      throw new FirebaseDbError(
        error.message || 'Database operation failed',
        error.code
      );
    }
  }
  
  // Generic Firebase errors
  throw new FirebaseError(
    error instanceof Error ? error.message : 'Operation failed',
    error instanceof FirebaseSDKError ? error.code : undefined
  );
} 