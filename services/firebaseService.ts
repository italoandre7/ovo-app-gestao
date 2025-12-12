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

// --- ÁREA DE CONFIGURAÇÃO ---
// 1. Vá ao console do Firebase (https://console.firebase.google.com/)
// 2. Crie um projeto, adicione um App Web e copie as configurações.
// 3. Cole os valores abaixo:
const hardcodedConfig = {
  apiKey: "PREENCHA_SUA_API_KEY_AQUI", // Ex: "AIzaSyD..."
  authDomain: "PREENCHA_SEU_PROJETO.firebaseapp.com",
  projectId: "PREENCHA_SEU_PROJECT_ID",
  storageBucket: "PREENCHA_SEU_PROJETO.appspot.com",
  messagingSenderId: "PREENCHA_SEU_MESSAGING_SENDER_ID",
  appId: "PREENCHA_SEU_APP_ID"
};
// ----------------------------

try {
  const storedConfig = localStorage.getItem(STORAGE_KEY);
  let configToUse = null;

  // Verifica se o hardcodedConfig foi preenchido pelo usuário (não contém o texto padrão)
  const isHardcodedConfigured = hardcodedConfig.apiKey !== "PREENCHA_SUA_API_KEY_AQUI";

  if (isHardcodedConfigured) {
    configToUse = hardcodedConfig;
  } else if (storedConfig) {
    configToUse = JSON.parse(storedConfig);
  } else if (typeof process !== 'undefined' && process.env && process.env.REACT_APP_FIREBASE_API_KEY) {
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
    console.log("Firebase inicializado com sucesso.");
  } else {
    console.log("Nenhuma configuração Firebase válida encontrada. O App iniciará em modo Demo/Offline.");
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
      // O App.tsx detectará !isConfigured e mostrará o aviso
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

  // Mantido caso precise injetar config via console ou código futuro
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