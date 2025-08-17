
import React from 'react';
import { useAdminPermissions } from '@/hooks/useAdminPermissions';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { RefreshCw, Activity, Workflow, MessageSquare } from 'lucide-react';

const AdminPermissionsTable = () => {
  const { users, loading, updatePermission, refresh } = useAdminPermissions();

  const handlePermissionChange = async (
    userId: string,
    dashboardType: 'evolution' | 'n8n' | 'secretaria',
    hasAccess: boolean
  ) => {
    await updatePermission(userId, dashboardType, hasAccess);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Gestión de Permisos de Dashboard
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Controla el acceso de los usuarios a los diferentes dashboards
            </p>
          </div>
          <Button variant="outline" size="sm" onClick={refresh}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {users.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            No hay usuarios registrados
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Usuario (Email)</TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Activity className="h-4 w-4 text-green-600" />
                    Evolution Dashboard
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <Workflow className="h-4 w-4 text-blue-600" />
                    N8n Dashboard
                  </div>
                </TableHead>
                <TableHead className="text-center">
                  <div className="flex items-center justify-center gap-2">
                    <MessageSquare className="h-4 w-4 text-purple-600" />
                    Secretaria Simple
                  </div>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.user_id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{user.user_email}</div>
                      <div className="text-xs text-gray-500">ID: {user.user_id.slice(0, 8)}...</div>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={user.evolution_access}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(user.user_id, 'evolution', checked)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={user.n8n_access}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(user.user_id, 'n8n', checked)
                      }
                    />
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={user.secretaria_access}
                      onCheckedChange={(checked) =>
                        handlePermissionChange(user.user_id, 'secretaria', checked)
                      }
                    />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default AdminPermissionsTable;
