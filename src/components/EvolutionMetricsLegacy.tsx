
import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  MessageSquare, 
  Phone, 
  AlertTriangle, 
  TrendingUp,
  Image,
  Mic,
  Activity,
  CheckCircle,
  XCircle,
  BarChart3,
  Calendar,
  Clock,
  AudioLines,
  Send,
  Download
} from 'lucide-react';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { WeeklyMessagesChart } from './WeeklyMessagesChart';
import { TextVsAudioChart } from './TextVsAudioChart';

export const EvolutionMetricsLegacy = () => {
  // Obtener datos históricos de KPIs (últimos 30 registros)
  const { data: kpiHistorico, isLoading: kpiLoading } = useQuery({
    queryKey: ['kpi-historico-extended'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpi_historico')
        .select('*')
        .order('fecha_kpi', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data || [];
    },
    refetchInterval: 60000
  });

  // Obtener último KPI para métricas principales
  const { data: latestKpi } = useQuery({
    queryKey: ['latest-kpi'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('kpi_historico')
        .select('*')
        .order('fecha_kpi', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000
  });

  // Obtener datos absolutos de evolution_metricas
  const { data: evolutionMetrics } = useQuery({
    queryKey: ['evolution-metrics'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('evolution_metricas')
        .select('*')
        .order('updated_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    refetchInterval: 30000
  });

  // Preparar datos para gráficos históricos
  const historicalData = kpiHistorico?.map(kpi => ({
    fecha: new Date(kpi.fecha_kpi).toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: '2-digit' 
    }),
    fechaCompleta: new Date(kpi.fecha_kpi).toLocaleDateString('es-ES'),
    tasa_entrega: parseFloat(kpi.tasa_entrega || '0'),
    tasa_error: parseFloat(kpi.tasa_error || '0'),
    tasa_respuesta: parseFloat(kpi.tasa_respuesta || '0'),
    tasa_multimedia_total: parseFloat(kpi.tasa_multimedia_total || '0'),
    tasa_imagenes_enviadas: parseFloat(kpi.tasa_imagenes_enviadas || '0'),
    tasa_imagenes_recibidas: parseFloat(kpi.tasa_imagenes_recibidas || '0'),
    tasa_audios_enviados: parseFloat(kpi.tasa_audios_enviados || '0'),
    tasa_audios_recibidos: parseFloat(kpi.tasa_audios_recibidos || '0'),
    ratio_audios: parseFloat(kpi.tasa_audios_recibidos || '0') > 0 ? 
      (parseFloat(kpi.tasa_audios_enviados || '0') / parseFloat(kpi.tasa_audios_recibidos || '0')).toFixed(2) : 
      parseFloat(kpi.tasa_audios_enviados || '0') > 0 ? '∞' : '0'
  })).reverse() || [];

  // Datos para distribución multimedia actual
  const multimediaData = latestKpi ? [
    { 
      name: 'Imágenes Enviadas', 
      value: parseFloat(latestKpi.tasa_imagenes_enviadas || '0'), 
      color: '#10b981' 
    },
    { 
      name: 'Imágenes Recibidas', 
      value: parseFloat(latestKpi.tasa_imagenes_recibidas || '0'), 
      color: '#3b82f6' 
    },
    { 
      name: 'Audios Enviados', 
      value: parseFloat(latestKpi.tasa_audios_enviados || '0'), 
      color: '#8b5cf6' 
    },
    { 
      name: 'Audios Recibidos', 
      value: parseFloat(latestKpi.tasa_audios_recibidos || '0'), 
      color: '#ef4444' 
    },
  ].filter(item => item.value > 0) : [];

  // Calcular estadísticas históricas
  const avgTasaEntrega = historicalData.length ? 
    (historicalData.reduce((sum, item) => sum + item.tasa_entrega, 0) / historicalData.length).toFixed(1) : '0';
  
  const avgTasaError = historicalData.length ? 
    (historicalData.reduce((sum, item) => sum + item.tasa_error, 0) / historicalData.length).toFixed(1) : '0';

  const avgTasaRespuesta = historicalData.length ? 
    (historicalData.reduce((sum, item) => sum + item.tasa_respuesta, 0) / historicalData.length).toFixed(1) : '0';

  // Calcular promedio de ratio de audios
  const avgRatioAudios = historicalData.length ? 
    (historicalData.reduce((sum, item) => {
      const ratio = parseFloat(item.ratio_audios) || 0;
      return sum + (isFinite(ratio) ? ratio : 0);
    }, 0) / historicalData.filter(item => isFinite(parseFloat(item.ratio_audios))).length).toFixed(2) : '0';

  const currentRatioAudios = latestKpi && parseFloat(latestKpi.tasa_audios_recibidos || '0') > 0 ? 
    (parseFloat(latestKpi.tasa_audios_enviados || '0') / parseFloat(latestKpi.tasa_audios_recibidos || '0')).toFixed(2) : 
    latestKpi && parseFloat(latestKpi.tasa_audios_enviados || '0') > 0 ? '∞' : '0';

  const chartConfig = {
    tasa_entrega: {
      label: "Tasa de Entrega",
      color: "#10b981",
    },
    tasa_error: {
      label: "Tasa de Error",
      color: "#ef4444",
    },
    tasa_respuesta: {
      label: "Tasa de Respuesta",
      color: "#8b5cf6",
    },
    tasa_multimedia_total: {
      label: "Tasa Multimedia",
      color: "#3b82f6",
    },
    ratio_audios: {
      label: "Ratio Audios (Env/Rec)",
      color: "#f59e0b",
    },
  };

  if (kpiLoading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-6 bg-gray-200 rounded w-1/3"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-200 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!kpiHistorico?.length) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="text-center text-gray-500">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No hay datos históricos disponibles</h3>
            <p className="text-sm">Los históricos aparecerán aquí cuando haya datos</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Título principal sin header con gradiente */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard Legacy Evolution API</h1>
        <p className="text-gray-600">Métricas históricas y análisis de rendimiento</p>
      </div>

      {/* KPIs principales con colores vibrantes */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-blue-100">Mensajes Enviados</CardTitle>
            <Send className="h-4 w-4 text-blue-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {evolutionMetrics?.mensajes_enviados?.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-green-100">Mensajes Recibidos</CardTitle>
            <Download className="h-4 w-4 text-green-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {evolutionMetrics?.mensajes_recibidos?.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-emerald-100">Tasa de Entrega</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {latestKpi?.tasa_entrega ? `${parseFloat(latestKpi.tasa_entrega).toFixed(1)}%` : 'N/A'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-red-100">Tasa de Error</CardTitle>
            <XCircle className="h-4 w-4 text-red-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {latestKpi?.tasa_error ? `${parseFloat(latestKpi.tasa_error).toFixed(2)}%` : '0.00%'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de multimedia con colores */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-purple-100">Imágenes Enviadas</CardTitle>
            <Image className="h-4 w-4 text-purple-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {evolutionMetrics?.imagenes_enviadas?.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-indigo-100">Imágenes Recibidas</CardTitle>
            <Image className="h-4 w-4 text-indigo-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {evolutionMetrics?.imagenes_recibidas?.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-500 to-pink-600 text-white shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-pink-100">Audios Enviados</CardTitle>
            <Mic className="h-4 w-4 text-pink-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {evolutionMetrics?.audios_enviados?.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-orange-100">Audios Recibidos</CardTitle>
            <AudioLines className="h-4 w-4 text-orange-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {evolutionMetrics?.audios_recibidos?.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Métricas de llamadas y errores con colores */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-teal-500 to-teal-600 text-white shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-teal-100">Llamadas Exitosas</CardTitle>
            <Phone className="h-4 w-4 text-teal-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {evolutionMetrics?.llamadas_exitosas?.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-cyan-100">Total Llamadas</CardTitle>
            <Phone className="h-4 w-4 text-cyan-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {evolutionMetrics?.total_llamadas?.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-amber-500 to-amber-600 text-white shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-amber-100">Errores Total</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-200" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">
              {evolutionMetrics?.errores_total?.toLocaleString() || '0'}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráficas principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeeklyMessagesChart variant="legacy" />
        <TextVsAudioChart variant="legacy" />
      </div>

      {/* Gráfico principal de evolución histórica */}
      <Card className="bg-gradient-to-br from-slate-50 to-slate-100 shadow-xl">
        <CardHeader className="bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-t-lg -mx-6 -mt-6 px-6 py-4 mb-6">
          <CardTitle className="text-white">Evolución Histórica de KPIs</CardTitle>
        </CardHeader>
        <CardContent>
          {historicalData.length > 0 && (
            <div className="h-80">
              <ChartContainer config={chartConfig} className="h-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={historicalData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="fecha" />
                    <YAxis />
                    <ChartTooltip 
                      content={<ChartTooltipContent />}
                      labelFormatter={(value, payload) => {
                        const item = payload?.[0]?.payload;
                        return item ? `Fecha: ${item.fechaCompleta}` : value;
                      }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tasa_entrega" 
                      stroke="#10b981" 
                      strokeWidth={2}
                      name="Tasa de Entrega (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tasa_error" 
                      stroke="#ef4444" 
                      strokeWidth={2}
                      name="Tasa de Error (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tasa_respuesta" 
                      stroke="#8b5cf6" 
                      strokeWidth={2}
                      name="Tasa de Respuesta (%)"
                    />
                    <Line 
                      type="monotone" 
                      dataKey="tasa_multimedia_total" 
                      stroke="#3b82f6" 
                      strokeWidth={2}
                      name="Tasa Multimedia (%)"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Sección inferior con gráficos adicionales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Distribución de multimedia */}
        {multimediaData.length > 0 && (
          <Card className="bg-gradient-to-br from-violet-50 to-violet-100 shadow-xl">
            <CardHeader className="bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-t-lg -mx-6 -mt-6 px-6 py-4 mb-6">
              <CardTitle className="text-white">Distribución de Multimedia</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={multimediaData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {multimediaData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <ChartTooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Promedios históricos */}
        <Card className="bg-gradient-to-br from-rose-50 to-rose-100 shadow-xl">
          <CardHeader className="bg-gradient-to-r from-rose-500 to-rose-600 text-white rounded-t-lg -mx-6 -mt-6 px-6 py-4 mb-6">
            <CardTitle className="text-white">Promedios Históricos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 rounded-lg bg-gradient-to-br from-green-100 to-green-200 border border-green-300">
                <div className="text-2xl font-semibold text-green-800">{avgTasaEntrega}%</div>
                <div className="text-sm text-green-600">Promedio Entrega</div>
              </div>
              
              <div className="p-4 rounded-lg bg-gradient-to-br from-red-100 to-red-200 border border-red-300">
                <div className="text-2xl font-semibold text-red-800">{avgTasaError}%</div>
                <div className="text-sm text-red-600">Promedio Error</div>
              </div>
              
              <div className="p-4 rounded-lg bg-gradient-to-br from-purple-100 to-purple-200 border border-purple-300">
                <div className="text-2xl font-semibold text-purple-800">{avgTasaRespuesta}%</div>
                <div className="text-sm text-purple-600">Promedio Respuesta</div>
              </div>
              
              <div className="p-4 rounded-lg bg-gradient-to-br from-blue-100 to-blue-200 border border-blue-300">
                <div className="text-2xl font-semibold text-blue-800">{avgRatioAudios}</div>
                <div className="text-sm text-blue-600">Ratio Audios Env/Rec</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
