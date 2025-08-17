
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ClientControlTable } from './ClientControlTable';

interface ClientControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ClientControlModal: React.FC<ClientControlModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de Control de Clientes</DialogTitle>
        </DialogHeader>
        <ClientControlTable />
      </DialogContent>
    </Dialog>
  );
};
