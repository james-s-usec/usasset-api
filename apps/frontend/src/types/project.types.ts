export const ProjectStatus = {
  DRAFT: 'DRAFT',
  ACTIVE: 'ACTIVE',
  ON_HOLD: 'ON_HOLD',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export type ProjectStatus = typeof ProjectStatus[keyof typeof ProjectStatus];

export const ProjectRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  MEMBER: 'MEMBER',
  VIEWER: 'VIEWER',
} as const;

export type ProjectRole = typeof ProjectRole[keyof typeof ProjectRole];

export interface Project {
  id: string;
  name: string;
  description?: string;
  status: ProjectStatus;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  status?: ProjectStatus;
  owner_id: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: ProjectStatus;
}

export interface ProjectMember {
  id: string;
  user: {
    id: string;
    email: string;
    name?: string;
  };
  role: ProjectRole;
  joined_at: string;
}

export interface AssignUserToProjectDto {
  user_id: string;
  role?: ProjectRole;
}

export interface BulkAssignUsersDto {
  assignments: Array<{
    user_id: string;
    role?: ProjectRole;
  }>;
}

export interface UpdateMemberRoleDto {
  role: ProjectRole;
}

export interface UserProject {
  id?: string;
  name?: string;
  description?: string | null;
  status?: string;
  role: string;
  joined_at: Date;
}

export interface ProjectSearchParams {
  page?: number;
  limit?: number;
  name?: string;
  status?: string;
  owner_id?: string;
}