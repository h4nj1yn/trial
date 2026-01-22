/**
 * API Client for CCTV Backend
 * Handles all communication with Django REST API
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000/api';

interface Camera {
  id: number;
  name: string;
  is_active: boolean;
  camera_index: number;
  created_at: string;
}

interface Detection {
  id: number;
  camera: number;
  camera_name: string;
  detection_type: 'person' | 'car' | 'object' | 'motion';
  confidence: number;
  timestamp: string;
}

interface ApiResponse<T> {
  data: T;
  status: number;
  error?: string;
}

class CCTVApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const defaultOptions: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
      },
      ...options,
    };

    try {
      const response = await fetch(url, defaultOptions);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`Request failed: ${endpoint}`, error);
      throw error;
    }
  }

  // Camera Endpoints
  async getCameras(): Promise<Camera[]> {
    return this.request<Camera[]>('/cameras/');
  }

  async getActiveCameras(): Promise<Camera[]> {
    return this.request<Camera[]>('/cameras/active_cameras/');
  }

  async getCamera(id: number): Promise<Camera> {
    return this.request<Camera>(`/cameras/${id}/`);
  }

  async createCamera(data: Partial<Camera>): Promise<Camera> {
    return this.request<Camera>('/cameras/', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateCamera(id: number, data: Partial<Camera>): Promise<Camera> {
    return this.request<Camera>(`/cameras/${id}/`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteCamera(id: number): Promise<void> {
    return this.request<void>(`/cameras/${id}/`, {
      method: 'DELETE',
    });
  }

  // Detection Endpoints
  async getDetections(): Promise<Detection[]> {
    return this.request<Detection[]>('/detections/');
  }

  async getRecentDetections(limit: number = 10): Promise<Detection[]> {
    return this.request<Detection[]>(`/detections/recent/?limit=${limit}`);
  }

  async getDetectionsByCamera(cameraId: number): Promise<Detection[]> {
    return this.request<Detection[]>(
      `/detections/by_camera/?camera_id=${cameraId}`
    );
  }

  // Stream Endpoints
  getStreamUrl(cameraId: number): string {
    return `${this.baseUrl.replace('/api', '')}/cameras/${cameraId}/stream/`;
  }

  getLegacyStreamUrl(streamName: '1' | '2'): string {
    return `${this.baseUrl.replace('/api', '')}/stream_${streamName}/`;
  }
}

export const cctvClient = new CCTVApiClient();
export type { Camera, Detection, ApiResponse };
