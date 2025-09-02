# Feature Implementation Blueprint

This guide provides a step-by-step blueprint for implementing features across the full stack in the USAsset project, based on the users feature architecture.

## 📋 Table of Contents
1. [Overview](#overview)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [Many-to-Many Relationships](#many-to-many-relationships)
5. [Testing Strategy](#testing-strategy)
6. [Step-by-Step Checklist](#step-by-step-checklist)
7. [Example: Projects Feature](#example-projects-feature)

## Overview

The USAsset project follows a clean architecture pattern with clear separation of concerns:

```
Frontend (React) → API Calls → Backend (NestJS) → Database (PostgreSQL)
```

### Key Principles
- **One Thing Per File**: Each file has a single responsibility
- **Feature Boundaries**: Features are isolated and communicate through shared services
- **Simple Data Flow**: Request → Controller → Service → Repository → Database
- **Complexity Budget**: Services have 3-5 public methods, methods have 20-30 lines max

## API Discovery and Documentation

### Finding API Endpoints

#### 1. **Swagger/OpenAPI Documentation**
The backend automatically generates API documentation at:
```
http://localhost:3000/api
```
This provides:
- All available endpoints with HTTP methods
- Request/response schemas
- Try-it-out functionality
- Authentication requirements

#### 2. **Controller Files**
API endpoints are defined in controller files:
```bash
# Find all controllers
find apps/backend/src -name "*.controller.ts" -type f

# Search for specific endpoints
grep -r "@Get\|@Post\|@Put\|@Delete\|@Patch" apps/backend/src --include="*.controller.ts"

# Example locations:
apps/backend/src/features/users/user.controller.ts
apps/backend/src/features/projects/project.controller.ts
```

#### 3. **Route Decorators**
Look for these NestJS decorators in controllers:
- `@Get()` - GET endpoints
- `@Post()` - POST endpoints
- `@Put()` - PUT endpoints
- `@Delete()` - DELETE endpoints
- `@Patch()` - PATCH endpoints

Example:
```typescript
@Controller('users')  // Base path: /users
export class UserController {
  @Get()              // GET /users
  @Get(':id')         // GET /users/:id
  @Post()             // POST /users
  @Put(':id')         // PUT /users/:id
  @Delete(':id')      // DELETE /users/:id
}
```

### Finding Database Schema

#### 1. **Prisma Schema File**
The complete database schema is in:
```
apps/backend/prisma/schema.prisma
```

#### 2. **Schema Inspection Commands**
```bash
# View current schema
cd apps/backend
cat prisma/schema.prisma

# Generate Prisma client (shows all models)
npx prisma generate

# Open Prisma Studio (visual database browser)
npx prisma studio

# View migration history
ls prisma/migrations/
```

#### 3. **Schema Discovery Pattern**
```bash
# Find all models
grep "^model" apps/backend/prisma/schema.prisma

# Find specific model
grep -A 20 "^model User" apps/backend/prisma/schema.prisma

# Find all enums
grep "^enum" apps/backend/prisma/schema.prisma

# Find relationships
grep "@relation" apps/backend/prisma/schema.prisma
```

### API Testing and Exploration

#### 1. **Using CLI Tools**
```bash
# List all API endpoints
cd apps/cli
./bin/usasset api-docs

# Test specific endpoint
curl -X GET http://localhost:3000/users \
  -H "Authorization: Bearer YOUR_TOKEN"

# Get endpoint details
./bin/usasset api-docs --endpoint="/users" --method="GET"
```

#### 2. **Frontend API Services**
API definitions are in frontend service files:
```bash
# Find all API service files
find apps/frontend/src/services -name "*-api.ts"

# Example:
apps/frontend/src/services/user-api.ts
apps/frontend/src/services/project-api.ts
```

#### 3. **Postman/Insomnia Collections**
Export API documentation as collections:
```bash
# Generate Postman collection
curl http://localhost:3000/api-json > usasset-api.postman.json
```

### Schema and API Documentation Standards

#### 1. **DTO Documentation**
DTOs define the shape of API requests/responses:
```typescript
// Always document DTOs with JSDoc
/**
 * DTO for creating a new user
 * @example
 * {
 *   "email": "user@example.com",
 *   "name": "John Doe",
 *   "role": "USER"
 * }
 */
export class CreateUserDto {
  @ApiProperty({ description: 'User email address' })
  @IsEmail()
  email: string;
}
```

#### 2. **Controller Documentation**
```typescript
@ApiTags('users')  // Groups endpoints in Swagger
@Controller('users')
export class UserController {
  @Get()
  @ApiOperation({ summary: 'Get paginated users' })
  @ApiResponse({ status: 200, description: 'List of users' })
  async findMany() { }
}
```

#### 3. **Schema Comments**
```prisma
/// User account in the system
model User {
  id         String   @id @default(uuid())
  /// Unique email address
  email      String   @unique
  /// Optional display name
  name       String?
  created_at DateTime @default(now())
}
```

### Quick Reference Commands

```bash
# Backend API discovery
npm run start:dev                    # Start backend with hot reload
open http://localhost:3000/api       # Open Swagger UI

# Database schema
npx prisma studio                    # Visual database browser
npx prisma db pull                   # Pull schema from database
npx prisma migrate dev               # Create/run migrations

# Find specific features
grep -r "class.*Service" apps/backend/src --include="*.ts"
grep -r "interface.*Dto" apps/backend/src --include="*.ts"

# API testing
curl http://localhost:3000/health    # Health check
```

## Backend Implementation

### 1. Database Schema (Prisma)

First, define your entity in `apps/backend/prisma/schema.prisma`:

```prisma
model Project {
  id          String   @id @default(uuid())
  name        String
  description String?
  status      ProjectStatus @default(DRAFT)
  owner_id    String
  is_deleted  Boolean  @default(false)
  created_at  DateTime @default(now())
  updated_at  DateTime @updatedAt
  
  // Relations
  owner       User     @relation(fields: [owner_id], references: [id])
  members     ProjectMember[]
  
  @@index([owner_id])
  @@index([status])
}

model ProjectMember {
  id         String   @id @default(uuid())
  project_id String
  user_id    String
  role       ProjectRole @default(MEMBER)
  joined_at  DateTime @default(now())
  
  // Relations
  project    Project  @relation(fields: [project_id], references: [id])
  user       User     @relation(fields: [user_id], references: [id])
  
  @@unique([project_id, user_id])
  @@index([user_id])
}

enum ProjectStatus {
  DRAFT
  ACTIVE
  COMPLETED
  ARCHIVED
}

enum ProjectRole {
  OWNER
  ADMIN
  MEMBER
  VIEWER
}
```

Run migration:
```bash
cd apps/backend
npx prisma migrate dev --name add_projects
```

### 2. DTOs (Data Transfer Objects)

Create DTOs in `apps/backend/src/features/projects/dto/`:

#### create-project.dto.ts
```typescript
import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ProjectStatus } from '@prisma/client';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(ProjectStatus)
  @IsOptional()
  status?: ProjectStatus;

  @IsString()
  owner_id: string;
}
```

#### update-project.dto.ts
```typescript
import { PartialType } from '@nestjs/mapped-types';
import { CreateProjectDto } from './create-project.dto';

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}
```

#### safe-project.dto.ts
```typescript
export class SafeProjectDto {
  id: string;
  name: string;
  description: string | null;
  status: string;
  owner_id: string;
  created_at: Date;
  updated_at: Date;
}
```

### 3. Repository Layer

Create `apps/backend/src/features/projects/project.repository.ts`:

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/core/prisma/prisma.service';
import { Project } from '@prisma/client';

@Injectable()
export class ProjectRepository {
  constructor(private prisma: PrismaService) {}

  async findManyPaginated(page: number, limit: number) {
    const skip = (page - 1) * limit;
    
    const [data, total] = await this.prisma.$transaction([
      this.prisma.project.findMany({
        where: { is_deleted: false },
        skip,
        take: limit,
        orderBy: { created_at: 'desc' },
      }),
      this.prisma.project.count({ where: { is_deleted: false } }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(id: string): Promise<Project | null> {
    return this.prisma.project.findFirst({
      where: { id, is_deleted: false },
    });
  }

  async create(data: Omit<Project, 'id' | 'created_at' | 'updated_at'>): Promise<Project> {
    return this.prisma.project.create({ data });
  }

  async update(id: string, data: Partial<Project>): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Project> {
    return this.prisma.project.update({
      where: { id },
      data: { is_deleted: true },
    });
  }
}
```

### 4. Service Layer

Create separate services for queries and commands:

#### project-query.service.ts
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from './project.repository';
import { SafeProjectDto } from './dto/safe-project.dto';

@Injectable()
export class ProjectQueryService {
  constructor(private projectRepository: ProjectRepository) {}

  async findManyPaginated(page: number, limit: number) {
    const result = await this.projectRepository.findManyPaginated(page, limit);
    
    return {
      data: result.data.map(this.toSafeDto),
      meta: result.meta,
    };
  }

  async findById(id: string): Promise<SafeProjectDto> {
    const project = await this.projectRepository.findById(id);
    
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    
    return this.toSafeDto(project);
  }

  private toSafeDto(project: any): SafeProjectDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      owner_id: project.owner_id,
      created_at: project.created_at,
      updated_at: project.updated_at,
    };
  }
}
```

#### project-command.service.ts
```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { ProjectRepository } from './project.repository';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { SafeProjectDto } from './dto/safe-project.dto';

@Injectable()
export class ProjectCommandService {
  constructor(private projectRepository: ProjectRepository) {}

  async create(dto: CreateProjectDto): Promise<SafeProjectDto> {
    const project = await this.projectRepository.create({
      ...dto,
      is_deleted: false,
    });
    
    return this.toSafeDto(project);
  }

  async update(id: string, dto: UpdateProjectDto): Promise<SafeProjectDto> {
    const existing = await this.projectRepository.findById(id);
    
    if (!existing) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    
    const updated = await this.projectRepository.update(id, dto);
    return this.toSafeDto(updated);
  }

  async delete(id: string): Promise<void> {
    const existing = await this.projectRepository.findById(id);
    
    if (!existing) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    
    await this.projectRepository.softDelete(id);
  }

  private toSafeDto(project: any): SafeProjectDto {
    return {
      id: project.id,
      name: project.name,
      description: project.description,
      status: project.status,
      owner_id: project.owner_id,
      created_at: project.created_at,
      updated_at: project.updated_at,
    };
  }
}
```

### 5. Controller

Create `apps/backend/src/features/projects/project.controller.ts`:

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  DefaultValuePipe,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProjectQueryService } from './project-query.service';
import { ProjectCommandService } from './project-command.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { JwtAuthGuard } from '@/features/auth/guards/jwt-auth.guard';

@ApiTags('projects')
@Controller('projects')
@UseGuards(JwtAuthGuard)
export class ProjectController {
  constructor(
    private projectQueryService: ProjectQueryService,
    private projectCommandService: ProjectCommandService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'Get paginated projects' })
  async findMany(
    @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
    @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  ) {
    return this.projectQueryService.findManyPaginated(page, limit);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  async findOne(@Param('id') id: string) {
    return this.projectQueryService.findById(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create new project' })
  async create(@Body() dto: CreateProjectDto) {
    return this.projectCommandService.create(dto);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project' })
  async update(@Param('id') id: string, @Body() dto: UpdateProjectDto) {
    return this.projectCommandService.update(id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project' })
  async delete(@Param('id') id: string) {
    await this.projectCommandService.delete(id);
    return { message: 'Project deleted successfully' };
  }
}
```

### 6. Module

Create `apps/backend/src/features/projects/project.module.ts`:

```typescript
import { Module } from '@nestjs/common';
import { ProjectController } from './project.controller';
import { ProjectQueryService } from './project-query.service';
import { ProjectCommandService } from './project-command.service';
import { ProjectRepository } from './project.repository';
import { PrismaModule } from '@/core/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ProjectController],
  providers: [
    ProjectRepository,
    ProjectQueryService,
    ProjectCommandService,
  ],
  exports: [ProjectQueryService, ProjectCommandService],
})
export class ProjectModule {}
```

Register in `app.module.ts`:
```typescript
imports: [
  // ... other modules
  ProjectModule,
]
```

## Frontend Implementation

### 1. API Service

Create `apps/frontend/src/services/project-api.ts`:

```typescript
import { apiClient } from '@/lib/api-client';
import { PaginatedResponse } from '@/types/common';

export interface Project {
  id: string;
  name: string;
  description: string | null;
  status: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface CreateProjectDto {
  name: string;
  description?: string;
  status?: string;
  owner_id: string;
}

export interface UpdateProjectDto {
  name?: string;
  description?: string;
  status?: string;
}

export const projectApi = {
  async getProjects(page = 1, limit = 10): Promise<PaginatedResponse<Project>> {
    console.log('📋 Fetching projects', { page, limit });
    const response = await apiClient.get('/projects', {
      params: { page, limit },
    });
    return response.data;
  },

  async getProject(id: string): Promise<Project> {
    console.log('📋 Fetching project', { id });
    const response = await apiClient.get(`/projects/${id}`);
    return response.data;
  },

  async createProject(data: CreateProjectDto): Promise<Project> {
    console.log('📋 Creating project', data);
    const response = await apiClient.post('/projects', data);
    return response.data;
  },

  async updateProject(id: string, data: UpdateProjectDto): Promise<Project> {
    console.log('📋 Updating project', { id, data });
    const response = await apiClient.put(`/projects/${id}`, data);
    return response.data;
  },

  async deleteProject(id: string): Promise<void> {
    console.log('📋 Deleting project', { id });
    await apiClient.delete(`/projects/${id}`);
  },
};
```

### 2. React Hooks

Create `apps/frontend/src/hooks/useProjects.ts`:

```typescript
import { useState, useEffect, useCallback } from 'react';
import { projectApi, Project } from '@/services/project-api';
import { useNotification } from '@/hooks/useNotification';

export const useProjects = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
  });
  
  const { showSuccess, showError } = useNotification();

  const fetchProjects = useCallback(async (page = 1, limit = 10) => {
    try {
      setLoading(true);
      const response = await projectApi.getProjects(page, limit);
      setProjects(response.data);
      setPagination(response.meta);
      setError(null);
    } catch (err) {
      setError('Failed to fetch projects');
      showError('Failed to fetch projects');
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const createProject = useCallback(async (data: any) => {
    try {
      const newProject = await projectApi.createProject(data);
      await fetchProjects(pagination.page, pagination.limit);
      showSuccess('Project created successfully');
      return newProject;
    } catch (err) {
      showError('Failed to create project');
      throw err;
    }
  }, [fetchProjects, pagination, showSuccess, showError]);

  const updateProject = useCallback(async (id: string, data: any) => {
    try {
      const updated = await projectApi.updateProject(id, data);
      await fetchProjects(pagination.page, pagination.limit);
      showSuccess('Project updated successfully');
      return updated;
    } catch (err) {
      showError('Failed to update project');
      throw err;
    }
  }, [fetchProjects, pagination, showSuccess, showError]);

  const deleteProject = useCallback(async (id: string) => {
    try {
      await projectApi.deleteProject(id);
      await fetchProjects(pagination.page, pagination.limit);
      showSuccess('Project deleted successfully');
    } catch (err) {
      showError('Failed to delete project');
      throw err;
    }
  }, [fetchProjects, pagination, showSuccess, showError]);

  useEffect(() => {
    fetchProjects();
  }, []);

  return {
    projects,
    loading,
    error,
    pagination,
    fetchProjects,
    createProject,
    updateProject,
    deleteProject,
  };
};
```

### 3. React Components

Create `apps/frontend/src/components/projects/ProjectsTable.tsx`:

```typescript
import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import { Project } from '@/services/project-api';

interface ProjectsTableProps {
  projects: Project[];
  onEdit: (project: Project) => void;
  onDelete: (project: Project) => void;
}

export const ProjectsTable: React.FC<ProjectsTableProps> = ({
  projects,
  onEdit,
  onDelete,
}) => {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'COMPLETED': return 'primary';
      case 'ARCHIVED': return 'default';
      default: return 'warning';
    }
  };

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Name</TableCell>
            <TableCell>Description</TableCell>
            <TableCell>Status</TableCell>
            <TableCell>Created</TableCell>
            <TableCell align="right">Actions</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.id}>
              <TableCell>{project.name}</TableCell>
              <TableCell>{project.description || '-'}</TableCell>
              <TableCell>
                <Chip
                  label={project.status}
                  size="small"
                  color={getStatusColor(project.status)}
                />
              </TableCell>
              <TableCell>
                {new Date(project.created_at).toLocaleDateString()}
              </TableCell>
              <TableCell align="right">
                <IconButton onClick={() => onEdit(project)} size="small">
                  <Edit />
                </IconButton>
                <IconButton onClick={() => onDelete(project)} size="small">
                  <Delete />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
```

### 4. Main Page Component

Create `apps/frontend/src/pages/ProjectsPage.tsx`:

```typescript
import React, { useState } from 'react';
import {
  Box,
  Button,
  Typography,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useProjects } from '@/hooks/useProjects';
import { ProjectsTable } from '@/components/projects/ProjectsTable';
import { ProjectDialog } from '@/components/projects/ProjectDialog';
import { Project } from '@/services/project-api';

export const ProjectsPage: React.FC = () => {
  const { projects, loading, error, createProject, updateProject, deleteProject } = useProjects();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);

  const handleCreate = () => {
    setSelectedProject(null);
    setDialogOpen(true);
  };

  const handleEdit = (project: Project) => {
    setSelectedProject(project);
    setDialogOpen(true);
  };

  const handleSave = async (data: any) => {
    if (selectedProject) {
      await updateProject(selectedProject.id, data);
    } else {
      await createProject(data);
    }
    setDialogOpen(false);
  };

  const handleDelete = async (project: Project) => {
    if (window.confirm(`Delete project "${project.name}"?`)) {
      await deleteProject(project.id);
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" p={4}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Projects</Typography>
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={handleCreate}
        >
          New Project
        </Button>
      </Box>

      <ProjectsTable
        projects={projects}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />

      <ProjectDialog
        open={dialogOpen}
        project={selectedProject}
        onClose={() => setDialogOpen(false)}
        onSave={handleSave}
      />
    </Box>
  );
};
```

## Many-to-Many Relationships

### User-Project Assignment Pattern

This section demonstrates how to implement many-to-many relationships, using user-project assignments as an example.

### 1. Database Schema

The relationship is managed through a join table (ProjectMember) that includes additional metadata:

```prisma
model User {
  id       String   @id @default(uuid())
  email    String   @unique
  name     String?
  // ... other fields
  
  projects ProjectMember[]
}

model Project {
  id      String   @id @default(uuid())
  name    String
  // ... other fields
  
  members ProjectMember[]
}

model ProjectMember {
  id         String      @id @default(uuid())
  project_id String
  user_id    String
  role       ProjectRole @default(MEMBER)
  joined_at  DateTime    @default(now())
  
  project    Project     @relation(fields: [project_id], references: [id])
  user       User        @relation(fields: [user_id], references: [id])
  
  @@unique([project_id, user_id]) // Prevent duplicate assignments
  @@index([user_id])
}
```

### 2. Assignment DTOs

Create DTOs for managing assignments:

```typescript
// assign-user-to-project.dto.ts
export class AssignUserToProjectDto {
  @IsString()
  user_id: string;

  @IsEnum(ProjectRole)
  @IsOptional()
  role?: ProjectRole = ProjectRole.MEMBER;
}

// bulk-assign-users.dto.ts
export class BulkAssignUsersDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AssignUserToProjectDto)
  assignments: AssignUserToProjectDto[];
}

// update-member-role.dto.ts
export class UpdateMemberRoleDto {
  @IsEnum(ProjectRole)
  role: ProjectRole;
}
```

### 3. Assignment Repository

```typescript
@Injectable()
export class ProjectMemberRepository {
  constructor(private prisma: PrismaService) {}

  async findProjectMembers(projectId: string) {
    return this.prisma.projectMember.findMany({
      where: { project_id: projectId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { joined_at: 'desc' },
    });
  }

  async findUserProjects(userId: string) {
    return this.prisma.projectMember.findMany({
      where: { user_id: userId },
      include: {
        project: {
          select: {
            id: true,
            name: true,
            description: true,
            status: true,
          },
        },
      },
      orderBy: { joined_at: 'desc' },
    });
  }

  async assignUserToProject(projectId: string, userId: string, role: ProjectRole) {
    return this.prisma.projectMember.create({
      data: {
        project_id: projectId,
        user_id: userId,
        role,
      },
      include: {
        user: true,
        project: true,
      },
    });
  }

  async updateMemberRole(projectId: string, userId: string, role: ProjectRole) {
    return this.prisma.projectMember.update({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: userId,
        },
      },
      data: { role },
    });
  }

  async removeUserFromProject(projectId: string, userId: string) {
    return this.prisma.projectMember.delete({
      where: {
        project_id_user_id: {
          project_id: projectId,
          user_id: userId,
        },
      },
    });
  }

  async bulkAssignUsers(projectId: string, assignments: { user_id: string; role: ProjectRole }[]) {
    return this.prisma.$transaction(
      assignments.map(({ user_id, role }) =>
        this.prisma.projectMember.upsert({
          where: {
            project_id_user_id: {
              project_id: projectId,
              user_id,
            },
          },
          update: { role },
          create: {
            project_id: projectId,
            user_id,
            role,
          },
        })
      )
    );
  }
}
```

### 4. Assignment Services

```typescript
// project-member-query.service.ts
@Injectable()
export class ProjectMemberQueryService {
  constructor(private memberRepository: ProjectMemberRepository) {}

  async getProjectMembers(projectId: string) {
    const members = await this.memberRepository.findProjectMembers(projectId);
    
    return members.map(member => ({
      id: member.id,
      user: {
        id: member.user.id,
        email: member.user.email,
        name: member.user.name,
      },
      role: member.role,
      joined_at: member.joined_at,
    }));
  }

  async getUserProjects(userId: string) {
    const projects = await this.memberRepository.findUserProjects(userId);
    
    return projects.map(membership => ({
      id: membership.project.id,
      name: membership.project.name,
      description: membership.project.description,
      status: membership.project.status,
      role: membership.role,
      joined_at: membership.joined_at,
    }));
  }
}

// project-member-command.service.ts
@Injectable()
export class ProjectMemberCommandService {
  constructor(
    private memberRepository: ProjectMemberRepository,
    private projectRepository: ProjectRepository,
    private userRepository: UserRepository,
  ) {}

  async assignUserToProject(projectId: string, dto: AssignUserToProjectDto) {
    // Validate project exists
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    // Validate user exists
    const user = await this.userRepository.findById(dto.user_id);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    try {
      return await this.memberRepository.assignUserToProject(
        projectId,
        dto.user_id,
        dto.role || ProjectRole.MEMBER
      );
    } catch (error) {
      if (error.code === 'P2002') { // Unique constraint violation
        throw new ConflictException('User is already assigned to this project');
      }
      throw error;
    }
  }

  async updateMemberRole(projectId: string, userId: string, dto: UpdateMemberRoleDto) {
    try {
      return await this.memberRepository.updateMemberRole(projectId, userId, dto.role);
    } catch (error) {
      if (error.code === 'P2025') { // Record not found
        throw new NotFoundException('Member not found in project');
      }
      throw error;
    }
  }

  async removeUserFromProject(projectId: string, userId: string) {
    try {
      await this.memberRepository.removeUserFromProject(projectId, userId);
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('Member not found in project');
      }
      throw error;
    }
  }

  async bulkAssignUsers(projectId: string, dto: BulkAssignUsersDto) {
    const project = await this.projectRepository.findById(projectId);
    if (!project) {
      throw new NotFoundException('Project not found');
    }

    return await this.memberRepository.bulkAssignUsers(
      projectId,
      dto.assignments.map(a => ({
        user_id: a.user_id,
        role: a.role || ProjectRole.MEMBER,
      }))
    );
  }
}
```

### 5. Assignment Controller Endpoints

Add these endpoints to your project controller:

```typescript
@Controller('projects')
export class ProjectController {
  // ... existing endpoints

  @Get(':id/members')
  @ApiOperation({ summary: 'Get project members' })
  async getProjectMembers(@Param('id') projectId: string) {
    return this.projectMemberQueryService.getProjectMembers(projectId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Assign user to project' })
  async assignUser(
    @Param('id') projectId: string,
    @Body() dto: AssignUserToProjectDto,
  ) {
    return this.projectMemberCommandService.assignUserToProject(projectId, dto);
  }

  @Post(':id/members/bulk')
  @ApiOperation({ summary: 'Bulk assign users to project' })
  async bulkAssignUsers(
    @Param('id') projectId: string,
    @Body() dto: BulkAssignUsersDto,
  ) {
    return this.projectMemberCommandService.bulkAssignUsers(projectId, dto);
  }

  @Put(':id/members/:userId')
  @ApiOperation({ summary: 'Update member role' })
  async updateMemberRole(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
    @Body() dto: UpdateMemberRoleDto,
  ) {
    return this.projectMemberCommandService.updateMemberRole(projectId, userId, dto);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove user from project' })
  async removeUser(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
  ) {
    await this.projectMemberCommandService.removeUserFromProject(projectId, userId);
    return { message: 'User removed from project' };
  }
}

// Also add to UserController:
@Controller('users')
export class UserController {
  // ... existing endpoints

  @Get(':id/projects')
  @ApiOperation({ summary: 'Get user projects' })
  async getUserProjects(@Param('id') userId: string) {
    return this.projectMemberQueryService.getUserProjects(userId);
  }
}
```

### 6. Frontend Implementation

#### API Service Extensions

```typescript
// project-api.ts additions
export interface ProjectMember {
  id: string;
  user: {
    id: string;
    email: string;
    name: string;
  };
  role: string;
  joined_at: string;
}

export const projectApi = {
  // ... existing methods

  async getProjectMembers(projectId: string): Promise<ProjectMember[]> {
    console.log('👥 Fetching project members', { projectId });
    const response = await apiClient.get(`/projects/${projectId}/members`);
    return response.data;
  },

  async assignUserToProject(projectId: string, userId: string, role = 'MEMBER'): Promise<ProjectMember> {
    console.log('👥 Assigning user to project', { projectId, userId, role });
    const response = await apiClient.post(`/projects/${projectId}/members`, {
      user_id: userId,
      role,
    });
    return response.data;
  },

  async updateMemberRole(projectId: string, userId: string, role: string): Promise<ProjectMember> {
    console.log('👥 Updating member role', { projectId, userId, role });
    const response = await apiClient.put(`/projects/${projectId}/members/${userId}`, { role });
    return response.data;
  },

  async removeUserFromProject(projectId: string, userId: string): Promise<void> {
    console.log('👥 Removing user from project', { projectId, userId });
    await apiClient.delete(`/projects/${projectId}/members/${userId}`);
  },
};
```

#### Project Members Component

```typescript
// ProjectMembersDialog.tsx
import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  Select,
  MenuItem,
  Chip,
  Box,
  Typography,
} from '@mui/material';
import { Delete, PersonAdd } from '@mui/icons-material';
import { Project, ProjectMember, projectApi } from '@/services/project-api';
import { UserSearchAutocomplete } from '@/components/shared/UserSearchAutocomplete';

interface ProjectMembersDialogProps {
  open: boolean;
  project: Project | null;
  onClose: () => void;
}

export const ProjectMembersDialog: React.FC<ProjectMembersDialogProps> = ({
  open,
  project,
  onClose,
}) => {
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [selectedRole, setSelectedRole] = useState('MEMBER');

  useEffect(() => {
    if (open && project) {
      fetchMembers();
    }
  }, [open, project]);

  const fetchMembers = async () => {
    if (!project) return;
    
    setLoading(true);
    try {
      const data = await projectApi.getProjectMembers(project.id);
      setMembers(data);
    } catch (error) {
      console.error('Failed to fetch members:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddMember = async () => {
    if (!project || !selectedUser) return;

    try {
      await projectApi.assignUserToProject(project.id, selectedUser, selectedRole);
      await fetchMembers();
      setSelectedUser(null);
      setSelectedRole('MEMBER');
    } catch (error) {
      console.error('Failed to add member:', error);
    }
  };

  const handleUpdateRole = async (userId: string, newRole: string) => {
    if (!project) return;

    try {
      await projectApi.updateMemberRole(project.id, userId, newRole);
      await fetchMembers();
    } catch (error) {
      console.error('Failed to update role:', error);
    }
  };

  const handleRemoveMember = async (userId: string) => {
    if (!project) return;

    if (window.confirm('Remove this member from the project?')) {
      try {
        await projectApi.removeUserFromProject(project.id, userId);
        await fetchMembers();
      } catch (error) {
        console.error('Failed to remove member:', error);
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'OWNER': return 'error';
      case 'ADMIN': return 'warning';
      case 'MEMBER': return 'primary';
      case 'VIEWER': return 'default';
      default: return 'default';
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogTitle>
        {project?.name} - Team Members
      </DialogTitle>
      <DialogContent>
        <Box mb={3} display="flex" gap={2} alignItems="center">
          <UserSearchAutocomplete
            value={selectedUser}
            onChange={setSelectedUser}
            excludeIds={members.map(m => m.user.id)}
            sx={{ flex: 1 }}
          />
          <Select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            size="small"
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="MEMBER">Member</MenuItem>
            <MenuItem value="ADMIN">Admin</MenuItem>
            <MenuItem value="VIEWER">Viewer</MenuItem>
          </Select>
          <Button
            variant="contained"
            startIcon={<PersonAdd />}
            onClick={handleAddMember}
            disabled={!selectedUser}
          >
            Add
          </Button>
        </Box>

        <List>
          {members.map((member) => (
            <ListItem key={member.id}>
              <ListItemText
                primary={member.user.name || member.user.email}
                secondary={`Joined ${new Date(member.joined_at).toLocaleDateString()}`}
              />
              <Chip
                label={member.role}
                size="small"
                color={getRoleColor(member.role)}
                sx={{ mr: 2 }}
              />
              <ListItemSecondaryAction>
                {member.role !== 'OWNER' && (
                  <>
                    <Select
                      value={member.role}
                      onChange={(e) => handleUpdateRole(member.user.id, e.target.value)}
                      size="small"
                      sx={{ mr: 1 }}
                    >
                      <MenuItem value="ADMIN">Admin</MenuItem>
                      <MenuItem value="MEMBER">Member</MenuItem>
                      <MenuItem value="VIEWER">Viewer</MenuItem>
                    </Select>
                    <IconButton
                      edge="end"
                      onClick={() => handleRemoveMember(member.user.id)}
                    >
                      <Delete />
                    </IconButton>
                  </>
                )}
              </ListItemSecondaryAction>
            </ListItem>
          ))}
        </List>

        {members.length === 0 && (
          <Typography variant="body2" color="textSecondary" align="center">
            No members yet. Add some team members to collaborate!
          </Typography>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
};
```

#### User Projects View

```typescript
// UserProjectsList.tsx
import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Chip,
  Grid,
  Box,
} from '@mui/material';
import { userApi } from '@/services/user-api';

interface UserProject {
  id: string;
  name: string;
  description: string | null;
  status: string;
  role: string;
  joined_at: string;
}

interface UserProjectsListProps {
  userId: string;
}

export const UserProjectsList: React.FC<UserProjectsListProps> = ({ userId }) => {
  const [projects, setProjects] = useState<UserProject[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserProjects();
  }, [userId]);

  const fetchUserProjects = async () => {
    try {
      const data = await userApi.getUserProjects(userId);
      setProjects(data);
    } catch (error) {
      console.error('Failed to fetch user projects:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Typography>Loading projects...</Typography>;

  return (
    <Grid container spacing={2}>
      {projects.map((project) => (
        <Grid item xs={12} sm={6} md={4} key={project.id}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                {project.name}
              </Typography>
              <Typography variant="body2" color="textSecondary" paragraph>
                {project.description || 'No description'}
              </Typography>
              <Box display="flex" justifyContent="space-between" alignItems="center">
                <Chip label={project.status} size="small" />
                <Chip 
                  label={project.role} 
                  size="small" 
                  color="primary"
                  variant="outlined"
                />
              </Box>
              <Typography variant="caption" color="textSecondary" display="block" mt={1}>
                Joined {new Date(project.joined_at).toLocaleDateString()}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
};
```

### 7. UI/UX Patterns for Assignments

#### Quick Assignment Actions
- **Drag & Drop**: Allow dragging users from a list onto projects
- **Bulk Actions**: Select multiple users and assign them at once
- **Role Templates**: Pre-defined role sets for common team structures

#### Visual Indicators
- **Role Badges**: Color-coded chips for different roles
- **Member Count**: Show total members on project cards
- **Recent Activity**: Display recent joins/leaves

#### Assignment Interfaces
1. **From Project View**: "Manage Team" button opens member dialog
2. **From User View**: "Projects" tab shows all assigned projects
3. **Quick Assign**: Autocomplete search in project header
4. **Bulk Import**: CSV upload for large team assignments

### Best Practices

1. **Prevent Circular Dependencies**: Use events or shared services for cross-feature communication
2. **Audit Trail**: Log all assignment changes for compliance
3. **Permission Checks**: Validate user has permission to manage assignments
4. **Soft Deletes**: Consider soft-deleting assignments for history
5. **Performance**: Use pagination for large member lists
6. **Caching**: Cache member lists that don't change frequently

## Testing Strategy

### Backend Tests

#### Unit Test Example
```typescript
// project-query.service.spec.ts
describe('ProjectQueryService', () => {
  let service: ProjectQueryService;
  let repository: jest.Mocked<ProjectRepository>;

  beforeEach(() => {
    // Test setup
  });

  it('should return paginated projects', async () => {
    // Test implementation
  });
});
```

#### Integration Test Example
```typescript
// project.controller.spec.ts
describe('ProjectController (e2e)', () => {
  let app: INestApplication;

  beforeEach(async () => {
    // Test setup
  });

  it('/GET projects', () => {
    return request(app.getHttpServer())
      .get('/projects')
      .expect(200)
      .expect((res) => {
        expect(res.body.data).toBeInstanceOf(Array);
      });
  });
});
```

### Frontend Tests

#### Component Test Example
```typescript
// ProjectsTable.test.tsx
describe('ProjectsTable', () => {
  it('renders projects correctly', () => {
    // Test implementation
  });
});
```

## Step-by-Step Checklist

### Backend Checklist
- [ ] Define Prisma schema
- [ ] Run database migration
- [ ] Create DTOs (Create, Update, Safe)
- [ ] Implement Repository
- [ ] Create Query Service
- [ ] Create Command Service
- [ ] Build Controller
- [ ] Create Module
- [ ] Register Module in app.module.ts
- [ ] Add unit tests for services
- [ ] Add integration tests for controller

### Frontend Checklist
- [ ] Create TypeScript interfaces
- [ ] Build API service
- [ ] Create custom hook (useProjects)
- [ ] Build table/list component
- [ ] Create form/dialog component
- [ ] Build main page component
- [ ] Add routing
- [ ] Write component tests
- [ ] Test API integration

### General Checklist
- [ ] Update API documentation
- [ ] Add logging with correlation IDs
- [ ] Configure error handling
- [ ] Set up validation rules
- [ ] Add authorization checks
- [ ] Test end-to-end flow
- [ ] Update deployment scripts

## Example: Projects Feature

Here's a concrete example of implementing a Projects feature:

### 1. Backend Structure
```
apps/backend/src/features/projects/
├── dto/
│   ├── create-project.dto.ts
│   ├── update-project.dto.ts
│   ├── safe-project.dto.ts
│   └── index.ts
├── project.controller.ts
├── project-query.service.ts
├── project-command.service.ts
├── project.repository.ts
├── project.module.ts
└── tests/
    ├── project.controller.spec.ts
    └── project-query.service.spec.ts
```

### 2. Frontend Structure
```
apps/frontend/src/
├── services/
│   └── project-api.ts
├── hooks/
│   └── useProjects.ts
├── components/projects/
│   ├── ProjectsTable.tsx
│   ├── ProjectDialog.tsx
│   └── ProjectFormFields.tsx
└── pages/
    └── ProjectsPage.tsx
```

### 3. Key Implementation Notes

1. **Always sanitize outputs**: Use SafeDTOs to exclude sensitive fields
2. **Implement soft deletes**: Use is_deleted flag instead of hard deletes
3. **Add pagination**: All list endpoints should support pagination
4. **Use correlation IDs**: Track requests across frontend and backend
5. **Handle errors gracefully**: Show user-friendly messages
6. **Follow naming conventions**: Consistent naming across the stack

## Common Pitfalls to Avoid

1. **Don't skip layers**: Always go through Controller → Service → Repository
2. **Don't mix concerns**: Keep business logic in services, not controllers
3. **Don't forget validation**: Use DTOs for all inputs
4. **Don't ignore errors**: Handle all edge cases
5. **Don't hardcode values**: Use environment variables
6. **Don't skip tests**: Test critical paths

## Resources

- [NestJS Documentation](https://docs.nestjs.com/)
- [Prisma Documentation](https://www.prisma.io/docs/)
- [React Documentation](https://react.dev/)
- [Material-UI Documentation](https://mui.com/)

---

This blueprint provides a comprehensive guide for implementing features in the USAsset project. Follow these patterns to ensure consistency and maintainability across the codebase.