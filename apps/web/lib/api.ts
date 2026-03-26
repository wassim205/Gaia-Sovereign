const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export interface RegisterData {
  username: string;
  email: string;
  password: string;
}

export interface LoginData {
  email: string;
  password: string;
}

export interface AuthResponse {
  message: string;
  data: {
    accessToken: string;
    user: {
      id: string;
      username: string;
      email: string;
      role: string;
    };
  };
}

export interface ErrorResponse {
  message: string | string[];
  error: string;
  statusCode: number;
}

export interface VaultField {
  fieldKey: string;
  value: string;
  fieldType: string;
}

export interface VaultEntry {
  id: string;
  title: string;
  category: string;
  description?: string;
  isFavorite: boolean;
  fields: VaultField[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateVaultEntryData {
  title: string;
  category: string;
  description?: string;
  isFavorite?: boolean;
  fields: VaultField[];
}

export interface VaultListResponse {
  data: VaultEntry[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface CategoryCount {
  category: string;
  count: number;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
  status: 'active' | 'suspended';
  createdAt: string;
  fieldsCount: number;
  tokensCount: number;
}

export interface App {
  id: string;
  name: string;
  description: string;
  status: 'pending' | 'approved' | 'blocked';
  createdAt: string;
  createdBy: string;
  requestedFields: string[];
  tokensCount: number;
}

export interface AuditLog {
  id: string;
  userId?: string;
  action: string;
  resourceType?: string;
  resourceId?: string;
  appId?: string | null;
  status?: string;
  details?: string;
  timestamp: string;
  // Optional legacy fields for compatibility
  actor?: string;
  target?: string;
  targetType?: string;
  changes?: Record<string, unknown>;
}


export interface DashboardStats {
  totalUsers: number;
  totalVaults: number;
  totalApps: number;
  apiRequests24h: number;
  threatAlerts: number;
  userGrowth: Array<{ month: string; users: number }>;
  apiRequestsWeek: Array<{ day: string; requests: number }>;
  vaultDistribution: Array<{ name: string; value: number }>;
}

export interface SystemHealth {
  apiServer: { status: 'operational' | 'degraded' | 'down'; uptime: number };
  database: { status: 'operational' | 'degraded' | 'down'; uptime: number };
  authService: { status: 'operational' | 'degraded' | 'down'; uptime: number };
  cdn: { status: 'operational' | 'degraded' | 'down'; uptime: number };
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private getAuthHeaders(): HeadersInit {
    const token = localStorage.getItem('token');
    return {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
    };
  }

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw result as ErrorResponse;
    }

    return result;
  }

  async login(data: LoginData): Promise<AuthResponse> {
    const response = await fetch(`${this.baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw result as ErrorResponse;
    }

    return result;
  }

  async getVaultEntries(params?: {
    page?: number;
    limit?: number;
    search?: string;
    category?: string;
  }): Promise<VaultListResponse> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.set('page', params.page.toString());
    if (params?.limit) queryParams.set('limit', params.limit.toString());
    if (params?.search) queryParams.set('search', params.search);
    if (params?.category) queryParams.set('category', params.category);

    const response = await fetch(
      `${this.baseUrl}/api/vault?${queryParams.toString()}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw result as ErrorResponse;
    }

    return result;
  }

  async getVaultEntry(id: string): Promise<VaultEntry> {
    const response = await fetch(`${this.baseUrl}/api/vault/${id}`, {
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();

    if (!response.ok) {
      throw result as ErrorResponse;
    }

    return result;
  }

  async createVaultEntry(data: CreateVaultEntryData): Promise<VaultEntry> {
    const response = await fetch(`${this.baseUrl}/api/vault`, {
      method: 'POST',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw result as ErrorResponse;
    }

    return result;
  }

  async updateVaultEntry(
    id: string,
    data: Partial<CreateVaultEntryData>
  ): Promise<VaultEntry> {
    const response = await fetch(`${this.baseUrl}/api/vault/${id}`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      throw result as ErrorResponse;
    }

    return result;
  }

  async deleteVaultEntry(id: string): Promise<void> {
    const response = await fetch(`${this.baseUrl}/api/vault/${id}`, {
      method: 'DELETE',
      headers: this.getAuthHeaders(),
    });

    if (!response.ok) {
      const result = await response.json();
      throw result as ErrorResponse;
    }
  }

  async getCategoryCounts(): Promise<CategoryCount[]> {
    const response = await fetch(
      `${this.baseUrl}/api/vault/categories/counts`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw result as ErrorResponse;
    }

    return result;
  }

  // Admin endpoints
  async getUsers(
    page: number = 1,
    limit: number = 10,
    search?: string
  ): Promise<{ data: User[]; meta: { total: number; limit: number; offset: number } }> {
    const params = new URLSearchParams({
      offset: String((page - 1) * limit),
      limit: String(limit),
      ...(search && { search }),
    });
    const response = await fetch(
      `${this.baseUrl}/api/admin/users?${params}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw result as ErrorResponse;
    }

    return result.data;
  }

  async getApps(
    page: number = 1,
    limit: number = 10,
    status?: 'pending' | 'approved' | 'blocked'
  ): Promise<{ data: App[]; meta: { total: number; limit: number; offset: number } }> {
    const params = new URLSearchParams({
      offset: String((page - 1) * limit),
      limit: String(limit),
      ...(status && { status }),
    });
    const response = await fetch(
      `${this.baseUrl}/api/admin/apps?${params}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw result as ErrorResponse;
    }

    return result.data;
  }

  async getAppDetails(id: string): Promise<App> {
    const response = await fetch(`${this.baseUrl}/api/admin/apps/${id}`, {
      headers: this.getAuthHeaders(),
    });

    const result = await response.json();

    if (!response.ok) {
      throw result as ErrorResponse;
    }

    return result.data;
  }

  async updateAppStatus(
    id: string,
    status: 'approved' | 'blocked',
    reason?: string
  ): Promise<App> {
    const response = await fetch(`${this.baseUrl}/api/admin/apps/${id}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status, reason }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw result as ErrorResponse;
    }

    return result.data;
  }

  async updateUserStatus(
    id: string,
    status: 'active' | 'suspended',
    reason?: string
  ): Promise<User> {
    const response = await fetch(`${this.baseUrl}/api/admin/users/${id}/status`, {
      method: 'PATCH',
      headers: this.getAuthHeaders(),
      body: JSON.stringify({ status, reason }),
    });

    const result = await response.json();

    if (!response.ok) {
      throw result as ErrorResponse;
    }

    return result.data;
  }

  async getAuditLogs(
    page: number = 1,
    limit: number = 50,
    filters?: {
      action?: string;
      targetType?: string;
      startDate?: string;
      endDate?: string;
    }
  ): Promise<{ data: AuditLog[]; meta: { total: number; limit: number; offset: number } }> {
    const params = new URLSearchParams({
      offset: String((page - 1) * limit),
      limit: String(limit),
      ...(filters?.action && { action: filters.action }),
      ...(filters?.targetType && { targetType: filters.targetType }),
      ...(filters?.startDate && { startDate: filters.startDate }),
      ...(filters?.endDate && { endDate: filters.endDate }),
    });
    const response = await fetch(
      `${this.baseUrl}/api/admin/audit-logs?${params}`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw result as ErrorResponse;
    }

    return result.data;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await fetch(
      `${this.baseUrl}/api/admin/dashboard/stats`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw result as ErrorResponse;
    }

    return result.data;
  }

  async getSystemHealth(): Promise<SystemHealth> {
    const response = await fetch(
      `${this.baseUrl}/api/admin/system/health`,
      {
        headers: this.getAuthHeaders(),
      }
    );

    const result = await response.json();

    if (!response.ok) {
      throw result as ErrorResponse;
    }

    const raw = result?.data;

    // Backend returns { metrics: [...] }, map to object shape
    if (raw?.metrics && Array.isArray(raw.metrics)) {
      const byLabel = (label: string) =>
        raw.metrics.find(
          (m: { label?: string; status?: string; uptime?: number | string }) =>
            m?.label === label
        );

      const toNode = (
        m: { status?: string; uptime?: number | string } | undefined
      ): { status: 'operational' | 'degraded' | 'down'; uptime: number } => ({
        status: (
          m?.status === 'operational'
            ? 'operational'
            : m?.status === 'degraded'
              ? 'degraded'
              : 'down'
        ) as 'operational' | 'degraded' | 'down',
        uptime:
          typeof m?.uptime === 'number'
            ? m.uptime
            : typeof m?.uptime === 'string'
              ? Math.max(0, Math.min(1, parseFloat(m.uptime) / 100))
              : 0,
      });

      return {
        apiServer: toNode(byLabel('API Server')),
        database: toNode(byLabel('Database')),
        authService: toNode(byLabel('Auth Service')),
        cdn: toNode(byLabel('CDN')),
      };
    }

    // Already-normalized or fallback
    return {
      apiServer: raw?.apiServer ?? { status: 'degraded', uptime: 0 },
      database: raw?.database ?? { status: 'degraded', uptime: 0 },
      authService: raw?.authService ?? { status: 'degraded', uptime: 0 },
      cdn: raw?.cdn ?? { status: 'degraded', uptime: 0 },
    };
  }
}

export const apiClient = new ApiClient(API_URL);

export const register = (data: RegisterData) => apiClient.register(data);
export const login = (data: LoginData) => apiClient.login(data);
export const getVaultEntries = (params?: Parameters<typeof apiClient.getVaultEntries>[0]) =>
  apiClient.getVaultEntries(params);
export const getVaultEntry = (id: string) => apiClient.getVaultEntry(id);
export const createVaultEntry = (data: CreateVaultEntryData) =>
  apiClient.createVaultEntry(data);
export const updateVaultEntry = (id: string, data: Partial<CreateVaultEntryData>) =>
  apiClient.updateVaultEntry(id, data);
export const deleteVaultEntry = (id: string) => apiClient.deleteVaultEntry(id);
export const getCategoryCounts = () => apiClient.getCategoryCounts();

// Admin API exports
export const adminApi = {
  getUsers: (page?: number, limit?: number, search?: string) =>
    apiClient.getUsers(page, limit, search),
  getApps: (page?: number, limit?: number, status?: 'pending' | 'approved' | 'blocked') =>
    apiClient.getApps(page, limit, status),
  getAppDetails: (id: string) => apiClient.getAppDetails(id),
  updateAppStatus: (id: string, status: 'approved' | 'blocked', reason?: string) =>
    apiClient.updateAppStatus(id, status, reason),
  updateUserStatus: (id: string, status: 'active' | 'suspended', reason?: string) =>
    apiClient.updateUserStatus(id, status, reason),
  getAuditLogs: (
    page?: number,
    limit?: number,
    filters?: {
      action?: string;
      targetType?: string;
      startDate?: string;
      endDate?: string;
    }
  ) => apiClient.getAuditLogs(page, limit, filters),
  getDashboardStats: () => apiClient.getDashboardStats(),
  getSystemHealth: () => apiClient.getSystemHealth(),
};
