# Feature Implementation Blueprint

This guide provides a step-by-step blueprint for implementing features across the full stack in the USAsset project, based on the users feature architecture.

## 📋 Table of Contents
1. [Overview](#overview)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [Testing Strategy](#testing-strategy)
5. [Step-by-Step Checklist](#step-by-step-checklist)
6. [Example: Projects Feature](#example-projects-feature)

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
  
  @@index([owner_id])
  @@index([status])
}

enum ProjectStatus {
  DRAFT
  ACTIVE
  COMPLETED
  ARCHIVED
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