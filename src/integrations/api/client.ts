const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request(endpoint: string, options: RequestInit = {}): Promise<any> {
    const url = `${this.baseURL}${endpoint}`;
    const token = localStorage.getItem('auth_token');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    try {
      const response = await fetch(url, config);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Auth methods
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(email: string, password: string, firstName?: string, lastName?: string) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, firstName, lastName }),
    });
  }

  async getProfile() {
    return this.request('/auth/profile');
  }

  // Asset methods
  async getAssets() {
    return this.request('/assets');
  }

  async getAsset(id: string) {
    return this.request(`/assets/${id}`);
  }

  async createAsset(asset: any) {
    return this.request('/assets', {
      method: 'POST',
      body: JSON.stringify(asset),
    });
  }

  async updateAsset(id: string, asset: any) {
    return this.request(`/assets/${id}`, {
      method: 'PUT',
      body: JSON.stringify(asset),
    });
  }

  async deleteAsset(id: string) {
    return this.request(`/assets/${id}`, {
      method: 'DELETE',
    });
  }

  // Service Request methods
  async getServiceRequests() {
    return this.request('/service-requests');
  }

  async getServiceRequest(id: string) {
    return this.request(`/service-requests/${id}`);
  }

  async createServiceRequest(request: any) {
    return this.request('/service-requests', {
      method: 'POST',
      body: JSON.stringify(request),
    });
  }

  async updateServiceRequest(id: string, request: any) {
    return this.request(`/service-requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(request),
    });
  }

  async deleteServiceRequest(id: string) {
    return this.request(`/service-requests/${id}`, {
      method: 'DELETE',
    });
  }

  // Notification methods
  async getNotifications() {
    return this.request('/notifications');
  }

  async createNotification(notification: any) {
    return this.request('/notifications', {
      method: 'POST',
      body: JSON.stringify(notification),
    });
  }

  async markNotificationAsRead(id: string) {
    return this.request(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  }

  async deleteNotification(id: string) {
    return this.request(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);