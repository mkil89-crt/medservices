import type {
  User,
  DoctorContactInfo,
  ServiceItem,
  ServiceRequest,
  AdminDashboardData,
  RevenueData,
  AuditLog,
  EmailNotification,
} from '../types.js';

const TOKEN_KEY = 'medservices_admin_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredToken(token: string | null) {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.error || `Erreur serveur (${response.status})`);
  }

  return data as T;
}

export const api = {
  // Founder Admin Auth
  async login(email: string, password: string): Promise<{ token: string; user: User }> {
    return request('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async getMe(): Promise<{ user: User }> {
    return request('/api/auth/me');
  },

  async updateAdminProfile(body: {
    full_name?: string;
    email?: string;
    phone_whatsapp?: string;
    current_password?: string;
    new_password?: string;
  }): Promise<{ message: string; user: User }> {
    return request('/api/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async logout(): Promise<void> {
    try {
      await request('/api/auth/logout', { method: 'POST' });
    } finally {
      setStoredToken(null);
    }
  },

  // Services
  async getServices(): Promise<{ services: ServiceItem[] }> {
    return request('/api/services');
  },

  async getAdminServices(): Promise<{ services: ServiceItem[] }> {
    return request('/api/services/admin/all');
  },

  async createAdminService(body: any): Promise<{ message: string; serviceId: string }> {
    return request('/api/services/admin', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async updateAdminService(serviceId: string, body: any): Promise<{ message: string }> {
    return request(`/api/services/admin/${serviceId}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },

  async toggleAdminService(serviceId: string): Promise<{ message: string; is_active: boolean }> {
    return request(`/api/services/admin/${serviceId}/toggle`, {
      method: 'PATCH',
    });
  },

  async deleteAdminService(serviceId: string): Promise<{ message: string }> {
    return request(`/api/services/admin/${serviceId}`, {
      method: 'DELETE',
    });
  },

  async addServiceField(serviceId: string, body: any): Promise<{ message: string; fieldId: string }> {
    return request(`/api/services/admin/${serviceId}/fields`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },

  async deleteServiceField(serviceId: string, fieldId: string): Promise<{ message: string }> {
    return request(`/api/services/admin/${serviceId}/fields/${fieldId}`, {
      method: 'DELETE',
    });
  },

  // Requests
  async submitBulkRequests(
    doctor_info: DoctorContactInfo,
    submissions: any[]
  ): Promise<{ message: string; requests: any[] }> {
    return request('/api/requests/bulk', {
      method: 'POST',
      body: JSON.stringify({ doctor_info, submissions }),
    });
  },

  async getRequests(filters?: {
    status?: string;
    service_id?: string;
    city?: string;
    date_from?: string;
    date_to?: string;
    search?: string;
  }): Promise<{ requests: ServiceRequest[] }> {
    let url = '/api/requests';
    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v && v !== 'all') params.append(k, v);
      });
      const qs = params.toString();
      if (qs) url += `?${qs}`;
    }
    return request(url);
  },

  async getRequestDetail(id: string): Promise<{ request: ServiceRequest }> {
    return request(`/api/requests/${id}`);
  },

  async updateAdminRequest(
    id: string,
    body: {
      status?: string;
      admin_internal_notes?: string;
      admin_public_message?: string;
      billed_amount?: number;
      revenue_type?: string;
    }
  ): Promise<{ message: string; request: Partial<ServiceRequest> }> {
    return request(`/api/requests/admin/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },

  // Admin Specific
  async getAdminDashboard(): Promise<AdminDashboardData> {
    return request('/api/admin/dashboard');
  },

  async getAdminDoctors(): Promise<{ doctors: any[] }> {
    return request('/api/admin/doctors');
  },

  async getAdminRevenue(): Promise<RevenueData> {
    return request('/api/admin/revenue');
  },

  async getAdminAuditLogs(): Promise<{ logs: AuditLog[] }> {
    return request('/api/admin/audit-logs');
  },

  async getAdminNotifications(): Promise<{ notifications: EmailNotification[] }> {
    return request('/api/admin/notifications');
  },
};

// Formatting helpers
export function formatDateFR(isoDate?: string | null): string {
  if (!isoDate) return '—';
  try {
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  } catch {
    return isoDate;
  }
}

export function formatDateTimeFR(isoDate?: string | null): string {
  if (!isoDate) return '—';
  try {
    const d = new Date(isoDate);
    const day = String(d.getDate()).padStart(2, '0');
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const year = d.getFullYear();
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${day}/${month}/${year} à ${hours}:${minutes}`;
  } catch {
    return isoDate;
  }
}

export function formatMAD(amount?: number | null): string {
  if (amount === undefined || amount === null) return '0 MAD';
  return `${amount.toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 })} MAD`;
}

export function buildWhatsAppLink(phone?: string | null, message?: string): string {
  if (!phone) return '#';
  let cleanPhone = phone.replace(/[^\d+]/g, '');
  if (cleanPhone.startsWith('+')) {
    cleanPhone = cleanPhone.substring(1);
  } else if (cleanPhone.startsWith('0')) {
    cleanPhone = '212' + cleanPhone.substring(1);
  }
  const encodedMsg = message ? encodeURIComponent(message) : '';
  return `https://wa.me/${cleanPhone}${encodedMsg ? `?text=${encodedMsg}` : ''}`;
}

export function buildMailtoLink(email?: string | null, subject?: string, body?: string): string {
  if (!email) return '#';
  const s = subject ? encodeURIComponent(subject) : '';
  const b = body ? encodeURIComponent(body) : '';
  return `mailto:${email}?subject=${s}&body=${b}`;
}
