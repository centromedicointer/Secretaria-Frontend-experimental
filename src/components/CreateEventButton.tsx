import React from "react";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface CreateEventButtonProps {
  onClick: () => void;
  disabled?: boolean;
}

export const CreateEventButton: React.FC<CreateEventButtonProps> = ({
  onClick,
  disabled = false,
}) => {
  return (
    <Button 
      onClick={onClick} 
      disabled={disabled}
      size="sm"
      className="gap-2"
    >
      <Plus className="h-4 w-4" />
      Agendar Consulta
    </Button>
  );
};