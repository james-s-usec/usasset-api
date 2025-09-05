import { Module } from '@nestjs/common';
import { ProjectController } from './controllers/project.controller';
import { ProjectQueryService } from './services/project-query.service';
import { ProjectCommandService } from './services/project-command.service';
import { ProjectMemberQueryService } from './services/project-member-query.service';
import { ProjectMemberCommandService } from './services/project-member-command.service';
import { ProjectRepository } from './project.repository';
import { ProjectMemberRepository } from './project-member.repository';
import { DatabaseModule } from '@/database/database.module';
import { FolderService } from '../../folder/folder.service';
import { DocumentsModule } from '../../documents/documents.module';

@Module({
  imports: [DatabaseModule, DocumentsModule],
  controllers: [ProjectController],
  providers: [
    ProjectQueryService,
    ProjectCommandService,
    ProjectMemberQueryService,
    ProjectMemberCommandService,
    ProjectRepository,
    ProjectMemberRepository,
    FolderService,
  ],
  exports: [ProjectQueryService, ProjectMemberQueryService],
})
export class ProjectModule {}
