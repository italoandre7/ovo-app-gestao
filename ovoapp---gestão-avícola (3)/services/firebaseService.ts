import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// Declare globals injected by the environment if applicable
declare const __app_id: string;
declare const __firebase_config: string;

let app;
let db: any = null;
let auth: any = null;
let isConfigured = false;

try {
  const configStr = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
  
  if (configStr) {
    const firebaseConfig = JSON.parse(configStr);
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    isConfigured = true;
  } else {
    console.warn("Firebase config not found. Running in Demo Mode.");
  }
} catch (e) {
  console.error("Error initializing Firebase:", e);
}

export const firebaseService = {
  db,
  auth,
  isConfigured,
  appId: typeof __app_id !== 'undefined' ? __app_id : 'default-app',
  
  // Helper to handle Auth
  initAuth: (callback: (user: User | null) => void) => {
    if (!auth) {
      // Immediate callback for demo mode
      callback({ uid: 'demo-user', isAnonymous: true } as User); 
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  },

  signIn: async () => {
    if (!auth) return { uid: 'demo-user' }; // Mock login
    return signInAnonymously(auth);
  },

  logout: async () => {
    if (!auth) return;
    return signOut(auth);
  }
};