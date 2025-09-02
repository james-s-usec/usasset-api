import { apiService } from './api';
import type { 
  Project, 
  CreateProjectDto, 
  UpdateProjectDto,
  AssignUserToProjectDto,
  BulkAssignUsersDto,
  UpdateMemberRoleDto,
  ProjectMember,
  UserProject
} from '../types/project.types';
import type { ApiResponse } from '../types/user';

export interface ProjectSearchParams {
  page?: number;
  limit?: number;
  name?: string;
  status?: string;
  owner_id?: string;
}

export interface PaginatedProjectsResponse {
  data: Project[];
  total: number;
}

export class ProjectApiService {
  private static readonly basePath = '/api/projects';

  private buildSearchParams(params?: ProjectSearchParams): URLSearchParams {
    const searchParams = new URLSearchParams();
    if (!params) return searchParams;
    
    if (params.page) searchParams.append('page', params.page.toString());
    if (params.limit) searchParams.append('limit', params.limit.toString());
    if (params.name) searchParams.append('name', params.name);
    if (params.status) searchParams.append('status', params.status);
    if (params.owner_id) searchParams.append('owner_id', params.owner_id);
    
    return searchParams;
  }

  // Project CRUD operations
  public async getProjects(params?: ProjectSearchParams): Promise<PaginatedProjectsResponse> {
    const searchParams = this.buildSearchParams(params);
    const response = await apiService.get<ApiResponse<PaginatedProjectsResponse>>(
      `${ProjectApiService.basePath}?${searchParams.toString()}`
    );
    return response.data;
  }

  public async getProject(id: string): Promise<Project> {
    const response = await apiService.get<ApiResponse<Project>>(
      `${ProjectApiService.basePath}/${id}`
    );
    return response.data;
  }

  public async createProject(data: CreateProjectDto): Promise<Project> {
    const response = await apiService.post<ApiResponse<Project>>(
      ProjectApiService.basePath, 
      data
    );
    return response.data;
  }

  public async updateProject(id: string, data: UpdateProjectDto): Promise<Project> {
    const response = await apiService.put<ApiResponse<Project>>(
      `${ProjectApiService.basePath}/${id}`, 
      data
    );
    return response.data;
  }

  public async deleteProject(id: string): Promise<void> {
    await apiService.delete(`${ProjectApiService.basePath}/${id}`);
  }

  // Member management operations
  public async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    const response = await apiService.get<ApiResponse<ProjectMember[]>>(
      `${ProjectApiService.basePath}/${projectId}/members`
    );
    return response.data;
  }

  public async assignUserToProject(
    projectId: string, 
    data: AssignUserToProjectDto
  ): Promise<ProjectMember> {
    const response = await apiService.post<ApiResponse<ProjectMember>>(
      `${ProjectApiService.basePath}/${projectId}/members`, 
      data
    );
    return response.data;
  }

  public async bulkAssignUsers(
    projectId: string, 
    data: BulkAssignUsersDto
  ): Promise<{ count: number }> {
    const response = await apiService.post<ApiResponse<{ count: number }>>(
      `${ProjectApiService.basePath}/${projectId}/members/bulk`, 
      data
    );
    return response.data;
  }

  public async updateMemberRole(
    projectId: string, 
    userId: string, 
    data: UpdateMemberRoleDto
  ): Promise<void> {
    await apiService.put(
      `${ProjectApiService.basePath}/${projectId}/members/${userId}`, 
      data
    );
  }

  public async removeUserFromProject(projectId: string, userId: string): Promise<void> {
    await apiService.delete(`${ProjectApiService.basePath}/${projectId}/members/${userId}`);
  }

  // User-centric operations
  public async getUserProjects(userId: string): Promise<UserProject[]> {
    const response = await apiService.get<ApiResponse<UserProject[]>>(
      `${ProjectApiService.basePath}/user/${userId}/projects`
    );
    return response.data;
  }
}

// Export singleton instance
export const projectApi = new ProjectApiService();