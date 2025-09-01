import axios from "axios";
import {
  DEFAULT_API_BASE_URL,
  HTTP_TIMEOUT_MS,
  DEFAULT_PAGE_LIMIT,
} from "./constants.js";

export interface User extends Record<string, unknown> {
  id: string;
  email: string;
  name?: string;
  role: string;
  is_deleted: boolean;
  created_at: string;
  created_by?: string | null;
  updated_at: string;
  updated_by?: string | null;
  deleted_at?: string | null;
  deleted_by?: string | null;
}

export interface CreateUserRequest {
  email: string;
  name?: string;
  role?: string;
}

export interface UpdateUserRequest {
  name?: string;
  email?: string;
  role?: string;
}

export interface UsersResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
}

export class UserApiClient {
  private baseUrl: string;

  public constructor(baseUrl: string = DEFAULT_API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  public async listUsers(
    page: number = 1,
    limit: number = DEFAULT_PAGE_LIMIT,
  ): Promise<UsersResponse> {
    const response = await axios.get(`${this.baseUrl}/users`, {
      params: { page, limit },
      timeout: HTTP_TIMEOUT_MS,
    });

    // Map backend response format to expected format
    const backendResponse = response.data as {
      success: boolean;
      data: {
        users: User[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      };
    };

    return {
      data: backendResponse.data.users,
      total: backendResponse.data.pagination.total,
      page: backendResponse.data.pagination.page,
      limit: backendResponse.data.pagination.limit,
    };
  }

  public async getUserById(id: string): Promise<User> {
    const response = await axios.get(`${this.baseUrl}/users/${id}`, {
      timeout: HTTP_TIMEOUT_MS,
    });

    // Handle wrapped response format
    const backendResponse = response.data as {
      success: boolean;
      data: User;
    };

    return backendResponse.data;
  }

  public async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await axios.post(`${this.baseUrl}/users`, userData, {
      timeout: HTTP_TIMEOUT_MS,
    });

    // Handle wrapped response format
    const backendResponse = response.data as {
      success: boolean;
      data: User;
    };

    return backendResponse.data;
  }

  public async updateUser(
    id: string,
    userData: UpdateUserRequest,
  ): Promise<User> {
    const response = await axios.patch(
      `${this.baseUrl}/users/${id}`,
      userData,
      {
        timeout: HTTP_TIMEOUT_MS,
      },
    );

    // Handle wrapped response format
    const backendResponse = response.data as {
      success: boolean;
      data: User;
    };

    return backendResponse.data;
  }

  public async deleteUser(id: string): Promise<void> {
    await axios.delete(`${this.baseUrl}/users/${id}`, {
      timeout: HTTP_TIMEOUT_MS,
    });
  }

  public async bulkCreateUsers(users: CreateUserRequest[]): Promise<User[]> {
    const response = await axios.post(
      `${this.baseUrl}/users/bulk`,
      { users },
      {
        timeout: HTTP_TIMEOUT_MS,
      },
    );

    // Handle wrapped response format
    const backendResponse = response.data as {
      success: boolean;
      data: User[];
    };

    return backendResponse.data;
  }

  public async bulkUpdateUsers(
    updates: Array<{ id: string } & Partial<UpdateUserRequest>>,
  ): Promise<User[]> {
    const response = await axios.patch(
      `${this.baseUrl}/users/bulk`,
      { updates },
      {
        timeout: HTTP_TIMEOUT_MS,
      },
    );

    // Handle wrapped response format
    const backendResponse = response.data as {
      success: boolean;
      data: User[];
    };

    return backendResponse.data;
  }

  public async bulkDeleteUsers(ids: string[]): Promise<{ deleted: number }> {
    const response = await axios.delete(`${this.baseUrl}/users/bulk`, {
      data: { ids },
      timeout: HTTP_TIMEOUT_MS,
    });

    // Handle wrapped response format
    const backendResponse = response.data as {
      success: boolean;
      data: { deleted: number };
    };

    return backendResponse.data;
  }
}
