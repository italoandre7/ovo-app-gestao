import React, { useState } from 'react';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { firebaseService } from '../services/firebaseService';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface ConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ConfigModal: React.FC<ConfigModalProps> = ({ isOpen, onClose }) => {
  const [configJson, setConfigJson] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = () => {
    try {
      setError(null);
      firebaseService.saveConfig(configJson);
    } catch (e: any) {
      setError(e.message || "Erro ao salvar configuração. Verifique o formato JSON.");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Configurar Banco de Dados">
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg text-sm text-blue-800">
          <p className="font-semibold flex items-center mb-2">
            <AlertCircle className="w-4 h-4 mr-2" />
            Como conectar seus dados reais:
          </p>
          <ol className="list-decimal list-inside space-y-1 ml-1">
            <li>Acesse o <a href="https://console.firebase.google.com/" target="_blank" rel="noreferrer" className="underline">Firebase Console</a>.</li>
            <li>Crie um projeto e adicione um app "Web".</li>
            <li>Copie o objeto <code>firebaseConfig</code> (JSON).</li>
            <li>Cole abaixo e clique em Salvar.</li>
          </ol>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Configuração JSON (Firebase)
          </label>
          <textarea
            rows={8}
            className="w-full p-3 border border-gray-300 rounded-md font-mono text-xs focus:ring-emerald-500 focus:border-emerald-500"
            placeholder='{
  "apiKey": "AIzaSy...",
  "authDomain": "...",
  "projectId": "...",
  "storageBucket": "...",
  "messagingSenderId": "...",
  "appId": "..."
}'
            value={configJson}
            onChange={(e) => setConfigJson(e.target.value)}
          />
        </div>

        {error && (
          <div className="text-red-600 text-sm flex items-center">
            <AlertCircle className="w-4 h-4 mr-2" />
            {error}
          </div>
        )}

        <div className="flex justify-end pt-2 space-x-3">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave}>Salvar e Conectar</Button>
        </div>
      </div>
    </Modal>
  );
};