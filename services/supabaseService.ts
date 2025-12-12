import { createClient, SupabaseClient, User } from '@supabase/supabase-js';

const STORAGE_KEY = 'ovoapp_supabase_config';

let supabase: SupabaseClient | null = null;
let isConfigured = false;

// --- CONFIGURAÇÃO ---
// Preencha aqui ou o App pedirá via Configuração Local
const hardcodedConfig = {
  url: "PREENCHA_SUA_URL_SUPABASE", // Ex: https://xyz.supabase.co
  key: "PREENCHA_SUA_ANON_KEY"     // Ex: eyJhbGciOiJIUzI1NiIsInR...
};

try {
  const storedConfig = localStorage.getItem(STORAGE_KEY);
  let configToUse = null;

  const isHardcodedConfigured = hardcodedConfig.url !== "PREENCHA_SUA_URL_SUPABASE";

  if (isHardcodedConfigured) {
    configToUse = hardcodedConfig;
  } else if (storedConfig) {
    configToUse = JSON.parse(storedConfig);
  }

  if (configToUse && configToUse.url && configToUse.key) {
    supabase = createClient(configToUse.url, configToUse.key);
    isConfigured = true;
    console.log("Supabase inicializado.");
  } else {
    console.log("Supabase não configurado. App em modo Demo.");
  }
} catch (e) {
  console.error("Erro ao inicializar Supabase:", e);
}

export const supabaseService = {
  client: supabase,
  isConfigured,

  initAuth: (callback: (user: User | null) => void) => {
    if (!supabase) {
      setTimeout(() => callback(null), 500);
      return { unsubscribe: () => {} };
    }

    // Verifica sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      callback(session?.user ?? null);
    });

    // Escuta mudanças
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });

    return { unsubscribe: () => subscription.unsubscribe() };
  },

  login: async (email: string, pass: string) => {
    if (!supabase) throw new Error("Supabase não configurado.");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password: pass });
    if (error) throw error;
    return data;
  },

  register: async (email: string, pass: string) => {
    if (!supabase) throw new Error("Supabase não configurado.");
    const { data, error } = await supabase.auth.signUp({ email, password: pass });
    if (error) throw error;
    return data;
  },

  logout: async () => {
    if (!supabase) return;
    return supabase.auth.signOut();
  },

  saveConfig: (configJson: string) => {
    try {
      const config = JSON.parse(configJson);
      if (!config.url || !config.key) throw new Error("JSON inválido. Requer 'url' e 'key'.");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
      window.location.reload();
    } catch (e) {
      throw e;
    }
  },

  resetConfig: () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
  }
};