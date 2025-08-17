
import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ActiveClientControlTable } from './ActiveClientControlTable';

interface ActiveClientControlModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ActiveClientControlModal: React.FC<ActiveClientControlModalProps> = ({
  isOpen,
  onClose,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle de Clientes con Bot Activado</DialogTitle>
        </DialogHeader>
        <ActiveClientControlTable />
      </DialogContent>
    </Dialog>
  );
};
