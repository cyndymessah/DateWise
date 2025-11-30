import axios, { AxiosInstance, AxiosError } from 'axios';
import type {
  ApiResponse,
  AuthResponse,
  LoginCredentials,
  RegisterData,
  UserProfile,
  Activity,
  MatchDisplay,
  MutualMatch,
  DashboardData,
  Message,
  DatePlan,
} from '../types';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || '/api',
      headers: {
        'Content-Type': 'application/json',
      },
      withCredentials: true,
    });

    // Add auth token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle auth errors
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth endpoints
  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>(
      '/auth/register',
      data
    );
    return response.data.data!;
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await this.client.post<ApiResponse<AuthResponse>>(
      '/auth/login',
      credentials
    );
    return response.data.data!;
  }

  async getCurrentUser(): Promise<UserProfile> {
    const response = await this.client.get<ApiResponse<UserProfile>>('/auth/me');
    return response.data.data!;
  }

  // Profile endpoints
  async getProfile(): Promise<UserProfile> {
    const response = await this.client.get<ApiResponse<UserProfile>>('/profile');
    return response.data.data!;
  }

  async updateProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    const response = await this.client.put<ApiResponse<UserProfile>>(
      '/profile',
      data
    );
    return response.data.data!;
  }

  async addActivity(
    activityId: number,
    details: {
      specific_venue?: string;
      location_area?: string;
      preferred_time?: string;
      notes?: string;
    }
  ): Promise<void> {
    await this.client.post('/profile/activities', {
      activity_id: activityId,
      ...details,
    });
  }

  async removeActivity(userActivityId: number): Promise<void> {
    await this.client.delete(`/profile/activities/${userActivityId}`);
  }

  async updateActivity(
    userActivityId: number,
    details: {
      specific_venue?: string;
      location_area?: string;
      preferred_time?: string;
      notes?: string;
    }
  ): Promise<void> {
    await this.client.put(`/profile/activities/${userActivityId}`, details);
  }

  // Activity endpoints
  async getActivities(params?: {
    category?: string;
    country?: string;
  }): Promise<Activity[]> {
    const response = await this.client.get<ApiResponse<Activity[]>>(
      '/activities',
      { params }
    );
    return response.data.data!;
  }

  async getActivitiesByCategory(country?: string): Promise<Record<string, Activity[]>> {
    const response = await this.client.get<ApiResponse<Record<string, Activity[]>>>(
      '/activities/by-category',
      { params: { country } }
    );
    return response.data.data!;
  }

  // Match endpoints
  async getDashboard(): Promise<DashboardData> {
    const response = await this.client.get<ApiResponse<DashboardData>>(
      '/matches/dashboard'
    );
    return response.data.data!;
  }

  async getDailyMatches(): Promise<MatchDisplay[]> {
    const response = await this.client.get<ApiResponse<MatchDisplay[]>>(
      '/matches/daily'
    );
    return response.data.data!;
  }

  async expressInterest(
    matchId: number,
    interested: boolean
  ): Promise<{ isMutualMatch: boolean }> {
    const response = await this.client.post<
      ApiResponse<{ interest: any; isMutualMatch: boolean }>
    >(`/matches/${matchId}/interest`, { interested });
    return { isMutualMatch: response.data.data!.isMutualMatch };
  }

  async getMutualMatches(): Promise<MutualMatch[]> {
    const response = await this.client.get<ApiResponse<MutualMatch[]>>(
      '/matches/mutual'
    );
    return response.data.data!;
  }

  // Message endpoints
  async getMessages(matchId: number): Promise<Message[]> {
    const response = await this.client.get<ApiResponse<Message[]>>(
      `/messages/${matchId}`
    );
    return response.data.data!;
  }

  async sendMessage(matchId: number, message: string): Promise<Message> {
    const response = await this.client.post<ApiResponse<Message>>(
      `/messages/${matchId}`,
      { message }
    );
    return response.data.data!;
  }

  async getUnreadCount(): Promise<number> {
    const response = await this.client.get<ApiResponse<{ unreadCount: number }>>(
      '/messages/unread'
    );
    return response.data.data!.unreadCount;
  }

  // Date plan endpoints
  async getDatePlan(matchId: number): Promise<DatePlan | null> {
    const response = await this.client.get<ApiResponse<DatePlan | null>>(
      `/date-plans/${matchId}`
    );
    return response.data.data!;
  }

  async updateDatePlan(
    matchId: number,
    data: {
      selectedActivityId?: number;
      venueName?: string;
      dateTime?: string;
      status?: string;
      contact?: string;
    }
  ): Promise<DatePlan> {
    const response = await this.client.put<ApiResponse<DatePlan>>(
      `/date-plans/${matchId}`,
      data
    );
    return response.data.data!;
  }

  async submitFeedback(
    matchId: number,
    feedback: 'good' | 'not_good' | 'no_show'
  ): Promise<void> {
    await this.client.post(`/date-plans/${matchId}/feedback`, { feedback });
  }
}

export const api = new ApiClient();
export default api;
