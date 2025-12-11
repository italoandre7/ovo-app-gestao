import React, { useState } from 'react';
import { PlusCircle, Trash2, Search, DollarSign } from 'lucide-react';
import { Sale } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { ConfirmModal } from './ui/ConfirmModal';

interface SalesProps {
  sales: Sale[];
  onAdd: (data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const Sales: React.FC<SalesProps> = ({ sales, onAdd, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    quantity: '',
    value: '',
    client: '',
    date: new Date().toISOString().substring(0, 10)
  });
  const [loading, setLoading] = useState(false);

  const filteredSales = sales.filter(sale => 
    (sale.client || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onAdd({
      quantity: parseInt(formData.quantity),
      value: parseFloat(formData.value.replace(',', '.')),
      client: formData.client,
      date: formData.date
    });
    setLoading(false);
    setIsModalOpen(false);
    setFormData({ ...formData, quantity: '', value: '', client: '' });
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
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div className="relative max-w-sm w-full">
          <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-emerald-500 focus:border-emerald-500 text-sm"
            placeholder="Buscar por cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={PlusCircle} className="w-full sm:w-auto">
          Nova Venda
        </Button>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Data</th>
                <th className="px-4 sm:px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Cliente</th>
                <th className="px-4 sm:px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Qtd</th>
                <th className="px-4 sm:px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Valor</th>
                <th className="px-4 sm:px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredSales.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Nenhuma venda registrada.
                  </td>
                </tr>
              ) : (
                filteredSales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{getDateStr(sale.date)}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 whitespace-nowrap max-w-[150px] truncate">
                      {sale.client || '-'}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-right text-gray-900 whitespace-nowrap">
                      {sale.quantity.toLocaleString('pt-BR')}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-bold text-right text-emerald-600 whitespace-nowrap">
                      R$ {sale.value.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                      <button onClick={() => setDeleteId(sale.id)} className="text-red-600 hover:text-red-900">
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Registrar Venda">
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
          <div>
            <label className="block text-sm font-medium text-gray-700">Cliente / Descrição (Opcional)</label>
            <input
              type="text"
              value={formData.client}
              onChange={(e) => setFormData({...formData, client: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              placeholder="Ex: Mercado Local"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Quantidade (Ovos)</label>
              <input
                type="number"
                min="1"
                required
                value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor Total (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.value}
                onChange={(e) => setFormData({...formData, value: e.target.value})}
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
        title="Excluir Venda"
        message="Tem certeza que deseja excluir este registro de venda?"
      />
    </div>
  );
};