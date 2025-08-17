
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ApiStatusCardsProps {
  ratioImagenes: number;
}

export const ApiStatusCards: React.FC<ApiStatusCardsProps> = ({ ratioImagenes }) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Estado de la API</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-500">
            <Badge variant="secondary">Activa</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Estado actual de la API
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Ratio Imágenes (Env/Rec)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {isFinite(ratioImagenes) ? ratioImagenes.toFixed(2) : 'N/A'}
          </div>
          <p className="text-sm text-muted-foreground">
            Ratio de imágenes enviadas por recibidas
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
