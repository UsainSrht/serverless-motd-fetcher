import { BotHealth, CreateServerInput, PreviewResponse, Server, SyncResult, UpdateType } from '../types';

const STORAGE_KEYS = {
  API_URL: 'mc_motd_api_url',
  API_KEY: 'mc_motd_api_key',
};

export function getStoredApiUrl(): string {
  return localStorage.getItem(STORAGE_KEYS.API_URL) || '';
}

export function setStoredApiUrl(url: string): void {
  localStorage.setItem(STORAGE_KEYS.API_URL, url.replace(/\/$/, ''));
}

export function getStoredApiKey(): string {
  return localStorage.getItem(STORAGE_KEYS.API_KEY) || '';
}

export function setStoredApiKey(key: string): void {
  localStorage.setItem(STORAGE_KEYS.API_KEY, key.trim());
}

async function apiRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const baseUrl = getStoredApiUrl();
  const apiKey = getStoredApiKey();

  const url = `${baseUrl}${endpoint}`;
  const headers = new Headers(options.headers || {});

  headers.set('Content-Type', 'application/json');
  if (apiKey) {
    headers.set('X-API-Key', apiKey);
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMsg = `HTTP ${response.status}: ${response.statusText}`;
    try {
      const data = await response.json();
      if (data && data.error) {
        errorMsg = data.error;
      }
    } catch {
      // Ignored
    }
    throw new Error(errorMsg);
  }

  return response.json() as Promise<T>;
}

export const api = {
  async getHealth(): Promise<BotHealth> {
    return apiRequest<BotHealth>('/api/health');
  },

  async verifyApiKey(apiKey: string): Promise<boolean> {
    const res = await apiRequest<{ valid: boolean }>('/api/auth/verify', {
      method: 'POST',
      body: JSON.stringify({ apiKey }),
    });
    return res.valid;
  },

  async getServers(): Promise<Server[]> {
    const res = await apiRequest<{ servers: Server[] }>('/api/servers');
    return res.servers;
  },

  async createServer(data: CreateServerInput): Promise<Server> {
    const res = await apiRequest<{ server: Server }>('/api/servers', {
      method: 'POST',
      body: JSON.stringify(data),
    });
    return res.server;
  },

  async updateServer(id: number, data: Partial<CreateServerInput>): Promise<Server> {
    const res = await apiRequest<{ server: Server }>(`/api/servers/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    return res.server;
  },

  async deleteServer(id: number): Promise<void> {
    await apiRequest(`/api/servers/${id}`, {
      method: 'DELETE',
    });
  },

  async syncServer(id: number): Promise<SyncResult> {
    const res = await apiRequest<{ result: SyncResult }>(`/api/servers/${id}/sync`, {
      method: 'POST',
    });
    return res.result;
  },

  async syncAll(): Promise<SyncResult[]> {
    const res = await apiRequest<{ results: SyncResult[] }>('/api/sync-all', {
      method: 'POST',
    });
    return res.results;
  },

  async initMessage(id: number): Promise<{ messageId: string; channelId: string }> {
    return apiRequest<{ messageId: string; channelId: string }>(`/api/servers/${id}/init-message`, {
      method: 'POST',
    });
  },

  async getPreview(data: {
    mc_address: string;
    format_template: string;
    update_type: UpdateType;
    name?: string;
  }): Promise<PreviewResponse> {
    return apiRequest<PreviewResponse>('/api/preview', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async testDiscord(channelId?: string): Promise<{ success: boolean; bot?: any; channel?: any }> {
    return apiRequest<{ success: boolean; bot?: any; channel?: any }>('/api/discord/test', {
      method: 'POST',
      body: JSON.stringify({ channel_id: channelId }),
    });
  },
};
