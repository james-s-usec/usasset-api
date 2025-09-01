import axios from "axios";
import {
  DEFAULT_API_BASE_URL,
  HTTP_TIMEOUT_MS,
  DEFAULT_PAGE_LIMIT,
} from "./constants.js";

export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserRequest {
  firstName: string;
  lastName: string;
  email: string;
  role: string;
}

export interface UpdateUserRequest {
  firstName?: string;
  lastName?: string;
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
    return response.data as UsersResponse;
  }

  public async getUserById(id: number): Promise<User> {
    const response = await axios.get(`${this.baseUrl}/users/${id}`, {
      timeout: HTTP_TIMEOUT_MS,
    });
    return response.data as User;
  }

  public async createUser(userData: CreateUserRequest): Promise<User> {
    const response = await axios.post(`${this.baseUrl}/users`, userData, {
      timeout: HTTP_TIMEOUT_MS,
    });
    return response.data as User;
  }

  public async updateUser(
    id: number,
    userData: UpdateUserRequest,
  ): Promise<User> {
    const response = await axios.patch(
      `${this.baseUrl}/users/${id}`,
      userData,
      {
        timeout: HTTP_TIMEOUT_MS,
      },
    );
    return response.data as User;
  }

  public async deleteUser(id: number): Promise<void> {
    await axios.delete(`${this.baseUrl}/users/${id}`, {
      timeout: HTTP_TIMEOUT_MS,
    });
  }
}
