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
  Inject,
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
import { FolderService } from '../../../folder/folder.service';
import { CreateFolderDto } from '../../../folder/dto/create-folder.dto';
import { UpdateFolderDto } from '../../../folder/dto/update-folder.dto';
import { FolderResponseDto } from '../../../folder/dto/folder-response.dto';
import { DocumentsService } from '../../../documents/services/documents.service';
import { AssetDocumentResponseDto } from '../../../documents/dto/asset-document-response.dto';

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

  // Injected services (following clean architecture pattern)
  @Inject(FolderService)
  private readonly folderService!: FolderService;

  @Inject(DocumentsService)
  private readonly documentsService!: DocumentsService;

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

  // Project-scoped folder endpoints
  @Get(':projectId/folders')
  @ApiOperation({ summary: 'Get all folders for a specific project' })
  @ApiResponse({
    status: 200,
    description: 'Project folders retrieved successfully',
    type: [FolderResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Project not found' })
  public async getProjectFolders(
    @Param('projectId') projectId: string,
  ): Promise<FolderResponseDto[]> {
    return this.folderService.findByProject(projectId);
  }

  @Post(':projectId/folders')
  @ApiOperation({ summary: 'Create new folder within project' })
  @ApiResponse({
    status: 201,
    description: 'Folder created successfully',
    type: FolderResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid folder data' })
  @ApiResponse({
    status: 409,
    description: 'Folder name already exists in project',
  })
  public async createProjectFolder(
    @Param('projectId') projectId: string,
    @Body(SanitizationPipe, ValidationPipe)
    dto: Omit<CreateFolderDto, 'project_id'>,
  ): Promise<FolderResponseDto> {
    const folderData: CreateFolderDto = { ...dto, project_id: projectId };
    return this.folderService.create(folderData);
  }

  @Get(':projectId/folders/:folderId')
  @ApiOperation({ summary: 'Get specific folder within project' })
  @ApiResponse({
    status: 200,
    description: 'Folder retrieved successfully',
    type: FolderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Folder or project not found' })
  public async getProjectFolder(
    @Param('projectId') projectId: string,
    @Param('folderId') folderId: string,
  ): Promise<FolderResponseDto> {
    return this.folderService.findByIdAndProject(folderId, projectId);
  }

  @Put(':projectId/folders/:folderId')
  @ApiOperation({ summary: 'Update folder within project' })
  @ApiResponse({
    status: 200,
    description: 'Folder updated successfully',
    type: FolderResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Folder or project not found' })
  public async updateProjectFolder(
    @Param('projectId') projectId: string,
    @Param('folderId') folderId: string,
    @Body(SanitizationPipe, ValidationPipe) dto: UpdateFolderDto,
  ): Promise<FolderResponseDto> {
    return this.folderService.updateInProject(folderId, projectId, dto);
  }

  @Delete(':projectId/folders/:folderId')
  @ApiOperation({ summary: 'Delete folder within project' })
  @ApiResponse({ status: 204, description: 'Folder deleted successfully' })
  @ApiResponse({ status: 404, description: 'Folder or project not found' })
  @HttpCode(HttpStatus.NO_CONTENT)
  public async deleteProjectFolder(
    @Param('projectId') projectId: string,
    @Param('folderId') folderId: string,
  ): Promise<void> {
    await this.folderService.deleteFromProject(folderId, projectId);
  }

  // Asset documentation endpoints (tracer bullet implementation)
  @Get(':projectId/assets/:assetId/documents')
  @ApiOperation({ summary: 'Get all documents for specific asset' })
  @ApiResponse({
    status: 200,
    description: 'Asset documents retrieved successfully',
    type: [AssetDocumentResponseDto],
  })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  public async getAssetDocuments(
    @Param('projectId') projectId: string,
    @Param('assetId') assetId: string,
  ): Promise<AssetDocumentResponseDto[]> {
    return this.documentsService.findByAsset(assetId);
  }

  @Get(':projectId/assets/:assetId/documentation')
  @ApiOperation({
    summary: 'Get complete asset documentation (documents + statistics)',
  })
  @ApiResponse({
    status: 200,
    description: 'Asset documentation retrieved successfully',
  })
  @ApiResponse({ status: 404, description: 'Asset not found' })
  public async getCompleteAssetDocumentation(
    @Param('projectId') projectId: string,
    @Param('assetId') assetId: string,
  ): Promise<{
    documents: AssetDocumentResponseDto[];
    documentCount: number;
    documentsByType: Record<string, number>;
  }> {
    return this.documentsService.getCompleteDocumentation(assetId);
  }
}
