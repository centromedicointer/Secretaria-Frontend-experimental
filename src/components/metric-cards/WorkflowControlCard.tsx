
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Settings } from 'lucide-react';

interface WorkflowStatus {
  id: number;
  is_active: boolean;
  workflow_name?: string;
}

interface WorkflowControlCardProps {
  workflowStatus: WorkflowStatus;
  onToggle: () => void;
}

export const WorkflowControlCard: React.FC<WorkflowControlCardProps> = ({
  workflowStatus,
  onToggle
}) => {
  return (
    <Card 
      className={`h-16 cursor-pointer hover:shadow-lg hover:scale-105 transition-all duration-200 transform ${
        workflowStatus.is_active ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
      }`}
      onClick={onToggle}
    >
      <CardHeader className="flex flex-row items-center justify-between space-y-0 p-1 pb-0">
        <CardTitle className="text-xs font-medium text-center flex-1">Estado del Workflow</CardTitle>
        <Settings className={`h-3 w-3 ${workflowStatus.is_active ? 'text-green-600' : 'text-red-600'}`} />
      </CardHeader>
      <CardContent className="p-1 pt-0">
        <div className={`text-base font-bold text-center ${workflowStatus.is_active ? 'text-green-600' : 'text-red-600'}`}>
          {workflowStatus.is_active ? 'ACTIVO' : 'INACTIVO'}
        </div>
        <p className="text-[10px] text-muted-foreground text-center truncate">
          {workflowStatus.workflow_name || 'Workflow'} - {workflowStatus.is_active ? 'Funcionando correctamente' : 'Requiere atención'} (clic para cambiar)
        </p>
      </CardContent>
    </Card>
  );
};
