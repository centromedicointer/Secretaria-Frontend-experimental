
import React from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, X, Calendar, Phone, User, MessageSquare, Bot } from 'lucide-react';

interface N8nMessagesFiltersProps {
  searchName: string;
  setSearchName: (value: string) => void;
  searchPhone: string;
  setSearchPhone: (value: string) => void;
  searchDate: string;
  setSearchDate: (value: string) => void;
  searchQuestion: string;
  setSearchQuestion: (value: string) => void;
  searchAnswer: string;
  setSearchAnswer: (value: string) => void;
  showFilters: boolean;
  setShowFilters: (value: boolean) => void;
  hasActiveFilters: boolean;
  clearAllFilters: () => void;
  filteredCount: number;
  totalCount: number;
}

export const N8nMessagesFilters: React.FC<N8nMessagesFiltersProps> = ({
  searchName,
  setSearchName,
  searchPhone,
  setSearchPhone,
  searchDate,
  setSearchDate,
  searchQuestion,
  setSearchQuestion,
  searchAnswer,
  setSearchAnswer,
  showFilters,
  setShowFilters,
  hasActiveFilters,
  clearAllFilters,
  filteredCount,
  totalCount,
}) => {
  const toggleFilters = () => {
    setShowFilters(!showFilters);
  };

  return (
    <div className="space-y-4 border-b pb-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleFilters}
            className="flex items-center gap-2"
          >
            <Search className="h-4 w-4" />
            Filtros de Búsqueda
          </Button>
        </div>
        {hasActiveFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAllFilters}
            className="flex items-center gap-2"
          >
            <X className="h-3 w-3" />
            Limpiar Filtros
          </Button>
        )}
      </div>
      
      {showFilters && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <User className="h-3 w-3" />
                Nombre
              </label>
              <Input
                placeholder="Buscar por nombre..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Phone className="h-3 w-3" />
                Teléfono
              </label>
              <Input
                placeholder="Buscar por teléfono..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Calendar className="h-3 w-3" />
                Fecha
              </label>
              <Input
                placeholder="dd/mm/yyyy o hh:mm..."
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MessageSquare className="h-3 w-3" />
                Pregunta
              </label>
              <Input
                placeholder="Buscar en preguntas..."
                value={searchQuestion}
                onChange={(e) => setSearchQuestion(e.target.value)}
                className="h-8"
              />
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <Bot className="h-3 w-3" />
                Respuesta
              </label>
              <Input
                placeholder="Buscar en respuestas..."
                value={searchAnswer}
                onChange={(e) => setSearchAnswer(e.target.value)}
                className="h-8"
              />
            </div>
          </div>
          
          {hasActiveFilters && (
            <div className="text-xs text-muted-foreground">
              Mostrando {filteredCount} de {totalCount} mensajes
            </div>
          )}
        </>
      )}
    </div>
  );
};
