import { initializeApp } from 'firebase/app';
import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  onAuthStateChanged, 
  User, 
  signOut 
} from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const STORAGE_KEY = 'ovoapp_firebase_config';

let app;
let db: any = null;
let auth: any = null;
let isConfigured = false;

// Tenta carregar configuração do LocalStorage (caso tenha sido salva anteriormente)
// OU usa variáveis de ambiente se disponíveis (Recomendado para Netlify)
try {
  const storedConfig = localStorage.getItem(STORAGE_KEY);
  
  // SE PRECISAR HARDCODAR A CONFIGURAÇÃO, SUBSTITUA O null ABAIXO PELO SEU OBJETO DE CONFIGURAÇÃO:
  // Exemplo: const hardcodedConfig = { apiKey: "...", ... };
  const hardcodedConfig = null; 

  let configToUse = null;

  if (hardcodedConfig) {
    configToUse = hardcodedConfig;
  } else if (storedConfig) {
    configToUse = JSON.parse(storedConfig);
  } else if (process.env.REACT_APP_FIREBASE_API_KEY) {
     // Fallback para variáveis de ambiente padrão do Create React App/Vite se configuradas
    configToUse = {
      apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
      authDomain: process.env.REACT_APP_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.REACT_APP_FIREBASE_PROJECT_ID,
      storageBucket: process.env.REACT_APP_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.REACT_APP_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.REACT_APP_FIREBASE_APP_ID
    };
  }

  if (configToUse) {
    app = initializeApp(configToUse);
    db = getFirestore(app);
    auth = getAuth(app);
    isConfigured = true;
  } else {
    console.log("Nenhuma configuração Firebase encontrada.");
  }
} catch (e) {
  console.error("Erro ao inicializar Firebase:", e);
}

export const firebaseService = {
  db,
  auth,
  isConfigured,
  appId: 'ovoapp-production',
  
  // Helper to handle Auth State
  initAuth: (callback: (user: User | null) => void) => {
    if (!auth) {
      // Se não estiver configurado, simula um delay e retorna null (não logado)
      // Se quiser manter o modo demo automático, descomente a linha abaixo:
      // setTimeout(() => callback({ uid: 'demo-user', isAnonymous: true } as User), 500);
      setTimeout(() => callback(null), 500);
      return () => {};
    }
    return onAuthStateChanged(auth, callback);
  },

  // Login com Email e Senha
  login: async (email: string, pass: string) => {
    if (!auth) throw new Error("Banco de dados não configurado.");
    return signInWithEmailAndPassword(auth, email, pass);
  },

  // Cadastro com Email e Senha
  register: async (email: string, pass: string) => {
    if (!auth) throw new Error("Banco de dados não configurado.");
    return createUserWithEmailAndPassword(auth, email, pass);
  },

  logout: async () => {
    if (!auth) return;
    return signOut(auth);
  },

  // Mantido caso precise injetar config via console ou código futuro, 
  // mas o botão UI foi removido no App.tsx
  saveConfig: (configJson: string) => {
    try {
      const config = JSON.parse(configJson);
      if (!config.apiKey || !config.projectId) {
        throw new Error("Configuração inválida.");
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      window.location.reload();
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