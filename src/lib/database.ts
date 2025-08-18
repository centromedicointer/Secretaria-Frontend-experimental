import { api } from './api';

// API-based database functions
export const getLatestEvolutionMetrics = () => api.getEvolutionMetrics();

export const getLatestKpiHistorico = () => api.getKpiHistorico();

export const getMensajesStats = () => api.getMensajesStats();

export const getClientControlStats = (botActive: boolean) => 
  api.getClientControlStats(botActive);

export const getWorkflowStatus = () => api.getWorkflowStatus();

export const updateWorkflowStatus = (id: string, isActive: boolean, updatedBy: string) =>
  api.updateWorkflowStatus(id, isActive, updatedBy);