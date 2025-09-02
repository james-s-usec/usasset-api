import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  NotFoundException,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProjectQueryService } from '../services/project-query.service';
import { ProjectCommandService } from '../services/project-command.service';
import { ProjectMemberQueryService } from '../services/project-member-query.service';
import { ProjectMemberCommandService } from '../services/project-member-command.service';
import { CreateProjectDto } from '../dto/create-project.dto';
import { UpdateProjectDto } from '../dto/update-project.dto';
import { AssignUserToProjectDto } from '../dto/assign-user-to-project.dto';
import { BulkAssignUsersDto } from '../dto/bulk-assign-users.dto';
import { UpdateMemberRoleDto } from '../dto/update-member-role.dto';
import { SafeProjectDto } from '../dto/safe-project.dto';
import { ProjectMemberDto } from '../dto/project-member.dto';
import { ProjectSearchDto } from '../dto/project-search.dto';
import { SanitizationPipe } from '@/common/pipes/sanitization.pipe';

@ApiTags('projects')
@Controller('api/projects')
@ApiBearerAuth()
export class ProjectController {
  public constructor(
    private readonly queryService: ProjectQueryService,
    private readonly commandService: ProjectCommandService,
    private readonly memberQueryService: ProjectMemberQueryService,
    private readonly memberCommandService: ProjectMemberCommandService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiResponse({
    status: 201,
    description: 'Project created',
    type: SafeProjectDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  public async create(
    @Body(SanitizationPipe, ValidationPipe) dto: CreateProjectDto,
  ): Promise<SafeProjectDto> {
    const project = await this.commandService.create(dto);
    return project;
  }

  @Get()
  @ApiOperation({ summary: 'Get all projects with pagination' })
  @ApiResponse({ status: 200, description: 'Projects retrieved' })
  public async findAll(
    @Query(ValidationPipe) searchDto: ProjectSearchDto,
  ): Promise<{ data: SafeProjectDto[]; total: number }> {
    const page = searchDto.page || 1;
    const DEFAULT_LIMIT = 10;
    const limit = searchDto.limit || DEFAULT_LIMIT;

    const result = await this.queryService.findManyPaginated(page, limit);

    return {
      data: result.data,
      total: result.meta.total,
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get project by ID' })
  @ApiResponse({
    status: 200,
    description: 'Project found',
    type: SafeProjectDto,
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  public async findOne(@Param('id') id: string): Promise<SafeProjectDto> {
    const project = await this.queryService.findById(id);
    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }
    return project;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update project' })
  @ApiResponse({
    status: 200,
    description: 'Project updated',
    type: SafeProjectDto,
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  public async update(
    @Param('id') id: string,
    @Body(SanitizationPipe, ValidationPipe) dto: UpdateProjectDto,
  ): Promise<SafeProjectDto> {
    const project = await this.commandService.update(id, dto);
    return project;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete project' })
  @ApiResponse({ status: 204, description: 'Project deleted' })
  @ApiResponse({ status: 404, description: 'Project not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  public async remove(@Param('id') id: string): Promise<void> {
    await this.commandService.delete(id);
  }

  // Member management endpoints
  @Get(':id/members')
  @ApiOperation({ summary: 'Get project members' })
  @ApiResponse({
    status: 200,
    description: 'Members retrieved',
    type: [ProjectMemberDto],
  })
  public async getMembers(
    @Param('id') projectId: string,
  ): Promise<ProjectMemberDto[]> {
    return this.memberQueryService.getProjectMembers(projectId);
  }

  @Post(':id/members')
  @ApiOperation({ summary: 'Assign user to project' })
  @ApiResponse({
    status: 201,
    description: 'User assigned',
    type: ProjectMemberDto,
  })
  @ApiResponse({ status: 409, description: 'User already member' })
  public async assignUser(
    @Param('id') projectId: string,
    @Body(SanitizationPipe, ValidationPipe) dto: AssignUserToProjectDto,
  ): Promise<ProjectMemberDto> {
    return this.memberCommandService.assignUserToProject(projectId, dto);
  }

  @Post(':id/members/bulk')
  @ApiOperation({ summary: 'Bulk assign users to project' })
  @ApiResponse({ status: 201, description: 'Users assigned' })
  public async bulkAssignUsers(
    @Param('id') projectId: string,
    @Body(SanitizationPipe, ValidationPipe) dto: BulkAssignUsersDto,
  ): Promise<{ count: number }> {
    return this.memberCommandService.bulkAssignUsers(projectId, dto);
  }

  @Put(':id/members/:userId')
  @ApiOperation({ summary: 'Update member role' })
  @ApiResponse({ status: 204, description: 'Role updated' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  public async updateMemberRole(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
    @Body(SanitizationPipe, ValidationPipe) dto: UpdateMemberRoleDto,
  ): Promise<void> {
    await this.memberCommandService.updateMemberRole(projectId, userId, dto);
  }

  @Delete(':id/members/:userId')
  @ApiOperation({ summary: 'Remove user from project' })
  @ApiResponse({ status: 204, description: 'User removed' })
  @ApiResponse({ status: 404, description: 'Member not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  public async removeMember(
    @Param('id') projectId: string,
    @Param('userId') userId: string,
  ): Promise<void> {
    await this.memberCommandService.removeUserFromProject(projectId, userId);
  }

  // User-centric endpoints
  @Get('user/:userId/projects')
  @ApiOperation({ summary: 'Get projects for a specific user' })
  @ApiResponse({ status: 200, description: 'User projects retrieved' })
  public async getUserProjects(@Param('userId') userId: string): Promise<
    Array<{
      id: string | undefined;
      name: string | undefined;
      description: string | null | undefined;
      status: string | undefined;
      role: string;
      joined_at: Date;
    }>
  > {
    return this.memberQueryService.getUserProjects(userId);
  }
}
