import React, { useState } from 'react';
import { PlusCircle, Trash2, Calendar } from 'lucide-react';
import { Production } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { ConfirmModal } from './ui/ConfirmModal';

interface ProductionProps {
  records: Production[];
  onAdd: (data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const ProductionView: React.FC<ProductionProps> = ({ records, onAdd, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    eggs: '',
    feed: '',
    date: new Date().toISOString().substring(0, 10)
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onAdd({
      eggs_produced: parseInt(formData.eggs),
      feed_consumed_kg: parseFloat(formData.feed.replace(',', '.')),
      date: formData.date
    });
    setLoading(false);
    setIsModalOpen(false);
    setFormData({ ...formData, eggs: '', feed: '' });
  };

  const handleDelete = async () => {
    if (deleteId) {
      await onDelete(deleteId);
      setDeleteId(null);
    }
  };

  const getDateStr = (d: any) => d.toDate ? d.toDate().toLocaleDateString('pt-BR') : new Date(d).toLocaleDateString('pt-BR');

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
         <h3 className="text-lg font-medium leading-6 text-gray-900">Histórico de Produção</h3>
        <Button onClick={() => setIsModalOpen(true)} icon={PlusCircle} className="w-full sm:w-auto">
          Novo Registro
        </Button>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Data</th>
                <th className="px-4 sm:px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Ovos Un.</th>
                <th className="px-4 sm:px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Ração (kg)</th>
                <th className="px-4 sm:px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {records.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                records.map((rec) => (
                  <tr key={rec.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 whitespace-nowrap flex items-center">
                      <Calendar className="w-4 h-4 mr-2 text-gray-400" />
                      {getDateStr(rec.date)}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-right text-gray-900 whitespace-nowrap">
                      {rec.eggs_produced.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-right text-gray-500 whitespace-nowrap">
                      {rec.feed_consumed_kg.toFixed(2).replace('.', ',')} kg
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                      <button onClick={() => setDeleteId(rec.id)} className="text-red-600 hover:text-red-900">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registro de Produção">
        <form onSubmit={handleSubmit} className="space-y-4">
           <div>
            <label className="block text-sm font-medium text-gray-700">Data</label>
            <input
              type="date"
              required
              value={formData.date}
              onChange={(e) => setFormData({...formData, date: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
             <div>
              <label className="block text-sm font-medium text-gray-700">Ovos Produzidos</label>
              <input
                type="number"
                min="0"
                required
                value={formData.eggs}
                onChange={(e) => setFormData({...formData, eggs: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Ração (Kg)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={formData.feed}
                onChange={(e) => setFormData({...formData, feed: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end pt-4 space-x-3">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
            <Button type="submit" isLoading={loading}>Salvar</Button>
          </div>
        </form>
      </Modal>

      <ConfirmModal 
        isOpen={!!deleteId}
        onClose={() => setDeleteId(null)}
        onConfirm={handleDelete}
        title="Excluir Registro"
        message="Tem certeza que deseja excluir este registro de produção?"
      />
    </div>
  );
};