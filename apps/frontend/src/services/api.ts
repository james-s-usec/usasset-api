import config from '../config'
import { CorrelationIdService } from './correlation-id'

class ApiService {
  private baseUrl: string
  private timeout: number

  constructor() {
    this.baseUrl = config.api.baseUrl
    this.timeout = config.api.timeout
  }

  private createAbortController(): { controller: AbortController; timeoutId: NodeJS.Timeout } {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.timeout)
    return { controller, timeoutId }
  }

  private buildHeaders(options: RequestInit): HeadersInit {
    return {
      'Content-Type': 'application/json',
      ...CorrelationIdService.getHeaders(),
      ...options.headers,
    }
  }

  private handleError(error: unknown): never {
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new Error('Request timeout')
      }
      throw error
    }
    throw new Error('Unknown error occurred')
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const { controller, timeoutId } = this.createAbortController()

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        signal: controller.signal,
        headers: this.buildHeaders(options),
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      // Handle 204 No Content responses (e.g., successful deletions)
      if (response.status === 204) {
        return {} as T
      }

      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      this.handleError(error)
    }
  }

  async get<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'GET' })
  }

  async post<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  async put<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  }

  async patch<T>(endpoint: string, data?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(data),
    })
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: 'DELETE' })
  }

  async postFormData<T>(endpoint: string, formData: FormData): Promise<T> {
    const { controller, timeoutId } = this.createAbortController()

    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: 'POST',
        body: formData,
        signal: controller.signal,
        headers: {
          ...CorrelationIdService.getHeaders(),
          // Don't set Content-Type for FormData - browser sets it with boundary
        },
      })

      clearTimeout(timeoutId)

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`)
      }

      return response.json()
    } catch (error) {
      clearTimeout(timeoutId)
      this.handleError(error)
    }
  }

  async health(): Promise<{ status: string }> {
    return this.get<{ status: string }>('/health')
  }
}

export const apiService = new ApiService()
export default apiService