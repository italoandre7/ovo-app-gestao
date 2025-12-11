import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged, User, signOut } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const STORAGE_KEY = 'ovoapp_firebase_config';

let app;
let db: any = null;
let auth: any = null;
let isConfigured = false;

// 1. Try to load from LocalStorage (Dynamic Configuration)
try {
  const storedConfig = localStorage.getItem(STORAGE_KEY);
  
  if (storedConfig) {
    const firebaseConfig = JSON.parse(storedConfig);
    app = initializeApp(firebaseConfig);
    db = getFirestore(app);
    auth = getAuth(app);
    isConfigured = true;
  } else {
    console.log("No Firebase config found in storage. Running in Demo Mode.");
  }
} catch (e) {
  console.error("Error initializing Firebase from storage:", e);
  localStorage.removeItem(STORAGE_KEY); // Clear bad config
}

export const firebaseService = {
  db,
  auth,
  isConfigured,
  appId: 'ovoapp-production',
  
  // Helper to handle Auth
  initAuth: (callback: (user: User | null) => void) => {
    if (!auth) {
      // Immediate callback for demo mode
      setTimeout(() => callback({ uid: 'demo-user', isAnonymous: true } as User), 500);
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
  },

  // Configuration Methods
  saveConfig: (configJson: string) => {
    try {
      // Validate JSON
      const config = JSON.parse(configJson);
      if (!config.apiKey || !config.projectId) {
        throw new Error("Configuração inválida. Verifique se o JSON contém apiKey e projectId.");
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      window.location.reload(); // Reload to initialize firebase
      return true;
    } catch (e) {
      throw e;
    }
  },

  resetConfig: () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
};