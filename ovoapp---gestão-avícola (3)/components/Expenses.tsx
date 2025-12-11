import React, { useState } from 'react';
import { PlusCircle, Trash2, Search } from 'lucide-react';
import { Expense } from '../types';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';
import { ConfirmModal } from './ui/ConfirmModal';

interface ExpensesProps {
  expenses: Expense[];
  onAdd: (data: any) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const Expenses: React.FC<ExpensesProps> = ({ expenses, onAdd, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Form State
  const [formData, setFormData] = useState({
    type: 'Ração',
    description: '',
    cost: '',
    date: new Date().toISOString().substring(0, 10)
  });
  const [loading, setLoading] = useState(false);

  const filteredExpenses = expenses.filter(exp => 
    exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
    exp.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await onAdd({
      ...formData,
      cost: parseFloat(formData.cost.replace(',', '.'))
    });
    setLoading(false);
    setIsModalOpen(false);
    setFormData({ ...formData, description: '', cost: '' });
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
            placeholder="Buscar despesas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Button onClick={() => setIsModalOpen(true)} icon={PlusCircle} className="w-full sm:w-auto">
          Nova Despesa
        </Button>
      </div>

      <div className="bg-white border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 sm:px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Data</th>
                <th className="px-4 sm:px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Tipo</th>
                <th className="px-4 sm:px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">Descrição</th>
                <th className="px-4 sm:px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Valor</th>
                <th className="px-4 sm:px-6 py-3 text-xs font-medium tracking-wider text-right text-gray-500 uppercase">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredExpenses.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                    Nenhuma despesa encontrada.
                  </td>
                </tr>
              ) : (
                filteredExpenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-900 whitespace-nowrap">{getDateStr(expense.date)}</td>
                    <td className="px-4 sm:px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                        ${expense.type === 'Ração' ? 'bg-green-100 text-green-800' : 
                          expense.type === 'Medicamento' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>
                        {expense.type}
                      </span>
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 whitespace-nowrap max-w-[150px] truncate">{expense.description}</td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-right text-gray-900 whitespace-nowrap">
                      R$ {expense.cost.toFixed(2).replace('.', ',')}
                    </td>
                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-right whitespace-nowrap">
                      <button onClick={() => setDeleteId(expense.id)} className="text-red-600 hover:text-red-900">
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

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Adicionar Despesa">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Tipo</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({...formData, type: e.target.value})}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm rounded-md border"
            >
              <option value="Ração">Ração</option>
              <option value="Medicamento">Medicamento</option>
              <option value="Outro">Outro</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Descrição</label>
            <input
              type="text"
              required
              value={formData.description}
              onChange={(e) => setFormData({...formData, description: e.target.value})}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Valor (R$)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.cost}
                onChange={(e) => setFormData({...formData, cost: e.target.value})}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-emerald-500 focus:border-emerald-500 sm:text-sm"
              />
            </div>
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
        title="Excluir Despesa"
        message="Tem certeza que deseja excluir esta despesa?"
      />
    </div>
  );
};