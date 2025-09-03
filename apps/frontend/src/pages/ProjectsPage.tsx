import React from 'react';
import { Container } from '@mui/material';
import { useProjectsPageLogic } from '../hooks/useProjectsPageLogic';
import { ProjectsPageHeader } from '../components/ProjectsPageHeader';
import { ProjectsPageContent } from '../components/ProjectsPageContent';
import { ProjectDialog } from '../components/ProjectDialog';
import { ProjectMembersDialog } from '../components/ProjectMembersDialog';

// Mock current user ID - in a real app, this would come from auth context
// Using the seeded admin user ID as placeholder until auth is implemented
const CURRENT_USER_ID = '98d068b7-fa06-431c-bff0-f19b1ebfdcf5';

/**
 * ProjectsPage component
 * Responsibility: Pure UI composition, all logic delegated to hooks
 * Follows complexity budget: 29 lines in arrow function, < 15 statements
 */
export const ProjectsPage: React.FC = () => {
  const logic = useProjectsPageLogic();

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <ProjectsPageHeader onCreateClick={logic.onCreateClick} />
      
      <ProjectsPageContent
        loading={logic.loading} error={logic.error}
        projects={logic.projects} total={logic.total}
        page={logic.page} pageSize={logic.pageSize}
        onPageChange={logic.onPageChange}
        onPageSizeChange={logic.onPageSizeChange}
        onEdit={logic.onEditClick}
        onDelete={logic.onDelete}
        onManageMembers={logic.onMembersClick}
      />

      <ProjectDialog
        open={logic.dialogOpen} project={logic.selectedProject}
        currentUserId={CURRENT_USER_ID}
        onClose={logic.closeProjectDialog} onSave={logic.onSave}
      />

      <ProjectMembersDialog
        open={logic.membersDialogOpen}
        project={logic.membersProject}
        onClose={logic.closeMembersDialog}
      />
    </Container>
  );
};