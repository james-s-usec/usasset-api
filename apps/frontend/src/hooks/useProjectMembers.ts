import type { 
  ProjectMember,
  AssignUserToProjectDto,
  BulkAssignUsersDto,
  ProjectRole
} from '../types/project.types';
import { useProjectMemberState } from './useProjectMemberState';
import { useProjectMembersList } from './useProjectMembersList';
import { useProjectMemberCRUD } from './useProjectMemberCRUD';
import { useProjectMemberBulk } from './useProjectMemberBulk';

interface UseProjectMembersReturn {
  members: ProjectMember[];
  loading: boolean;
  error: string | null;
  fetchMembers: (projectId: string) => Promise<void>;
  assignUser: (projectId: string, data: AssignUserToProjectDto) => Promise<ProjectMember | undefined>;
  bulkAssignUsers: (projectId: string, data: BulkAssignUsersDto) => Promise<number | undefined>;
  updateMemberRole: (projectId: string, userId: string, role: ProjectRole) => Promise<boolean>;
  removeMember: (projectId: string, userId: string) => Promise<boolean>;
}

export function useProjectMembers(): UseProjectMembersReturn {
  const state = useProjectMemberState();
  const list = useProjectMembersList(state);
  const crud = useProjectMemberCRUD(state);
  const bulk = useProjectMemberBulk(state, list);

  return {
    members: state.members,
    loading: state.loading,
    error: state.error,
    fetchMembers: list.fetchMembers,
    assignUser: crud.assignUser,
    bulkAssignUsers: bulk.bulkAssignUsers,
    updateMemberRole: crud.updateMemberRole,
    removeMember: crud.removeMember,
  };
}