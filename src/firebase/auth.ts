import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  updateProfile,
  sendPasswordResetEmail,
} from 'firebase/auth';
import type { User as FirebaseUser } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './config';
import type { User, Stats } from '../types';

const googleProvider = new GoogleAuthProvider();

export const loginWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    await syncUserToFirestore(result.user);
    return result.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const signupWithEmail = async (email: string, password: string, nickname: string) => {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName: nickname });
    await syncUserToFirestore(result.user, nickname);
    return result.user;
  } catch (error) {
    console.error('Signup error:', error);
    throw error;
  }
};

export const loginWithEmail = async (email: string, password: string) => {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    // Explicit sync to ensure profile exists
    await syncUserToFirestore(result.user);
    return result.user;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error) {
    console.error('Password reset error:', error);
    throw error;
  }
};

export const logout = () => signOut(auth);

const DEFAULT_STATS: Stats = {
  str: 0,
  int: 0,
  dex: 0,
  cha: 0,
  eco: 0,
};

export const syncUserToFirestore = async (firebaseUser: FirebaseUser, customNickname?: string) => {
  const userRef = doc(db, 'users', firebaseUser.uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    const newUser: User = {
      uid: firebaseUser.uid,
      nickname: customNickname || firebaseUser.displayName || 'Unnamed Hero',
      email: firebaseUser.email || '',
      totalScore: 0,
      stats: DEFAULT_STATS,
      friends: [],
      trustScores: {},
      photoURL: firebaseUser.photoURL || undefined,
    };
    await setDoc(userRef, newUser);
    return newUser;
  }
  return userSnap.data() as User;
};

export const listenToAuth = (callback: (user: User | null) => void) => {
  let unsubscribeProfile: (() => void) | null = null;

  return onAuthStateChanged(auth, async (firebaseUser) => {
    try {
      if (unsubscribeProfile) {
        unsubscribeProfile();
        unsubscribeProfile = null;
      }

      if (firebaseUser) {
        // Ensure user document exists in Firestore
        const userData = await syncUserToFirestore(firebaseUser);
        
        // Initial callback with data from sync
        callback(userData);
        
        // Real-time listener for user profile updates
        unsubscribeProfile = onSnapshot(doc(db, 'users', firebaseUser.uid), 
          (doc) => {
            if (doc.exists()) {
              callback(doc.data() as User);
            } else {
              // If document is missing, attempt to re-sync
              syncUserToFirestore(firebaseUser).then(data => callback(data));
            }
          },
          (error) => {
            console.error('Profile listener error:', error);
          }
        );
      } else {
        callback(null);
      }
    } catch (error) {
      console.error('Auth state change handling error:', error);
      callback(null);
    }
  });
};
