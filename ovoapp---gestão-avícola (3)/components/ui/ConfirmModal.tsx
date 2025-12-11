import React from 'react';
import { Button } from './Button';
import { Modal } from './Modal';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({ 
  isOpen, onClose, onConfirm, 
  title = "Confirmar Exclusão", 
  message = "Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita."
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-gray-600">{message}</p>
        <div className="flex justify-end pt-2 space-x-3">
          <Button variant="secondary" onClick={onClose}>Cancelar</Button>
          <Button variant="danger" onClick={onConfirm}>Excluir</Button>
        </div>
      </div>
    </Modal>
  );
};