// API client for backend communication
const API_BASE_URL = 'http://localhost:3001/api';

class ApiError extends Error {
  constructor(message: string, public status: number) {
    super(message);
    this.name = 'ApiError';
  }
}

const apiRequest = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new ApiError(errorData.error || `HTTP ${response.status}`, response.status);
    }
    
    return await response.json();
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError('Network error', 0);
  }
};

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  // Evolution metrics
  getEvolutionMetrics: () => apiRequest('/evolution-metrics'),
  
  getKpiHistorico: () => apiRequest('/kpi-historico'),
  
  getMensajesStats: () => apiRequest('/mensajes-stats'),
  
  getClientControlStats: (botActive: boolean) => 
    apiRequest(`/client-control-stats/${botActive}`),
  
  getWorkflowStatus: () => apiRequest('/workflow-status'),
  
  updateWorkflowStatus: (id: string, isActive: boolean, updatedBy: string) =>
    apiRequest(`/workflow-status/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ isActive, updatedBy }),
    }),

  // Health check
  healthCheck: () => apiRequest('/health'),
};