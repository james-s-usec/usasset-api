import { useEffect } from 'react';
import type { Project, ProjectMember } from '../types/project.types';
import { ProjectRole } from '../types/project.types';
import { useProjectMembers } from './useProjectMembers';
import { useUsers } from './useUsers';
interface User {
  id: string;
  email: string;
  name?: string;
}

interface UseProjectMemberActionsReturn {
  members: ProjectMember[];
  loading: boolean;
  error: string | null;
  availableUsers: User[];
  handleAddMember: (userId: string, role: ProjectRole) => Promise<void>;
  handleUpdateRole: (memberId: string, role: ProjectRole) => Promise<void>;
  handleRemoveMember: (memberId: string) => Promise<void>;
}

export const useProjectMemberActions = (open: boolean, project: Project | null): UseProjectMemberActionsReturn => {
  const { 
    members, 
    loading, 
    error,
    fetchMembers,
    assignUser,
    updateMemberRole,
    removeMember,
  } = useProjectMembers();
  
  const { users, fetchUsers } = useUsers();

  useEffect(() => {
    if (open && project) {
      void fetchMembers(project.id);
      void fetchUsers();
    }
  }, [open, project, fetchMembers, fetchUsers]);

  const handleAddMember = async (userId: string, role: ProjectRole): Promise<void> => {
    if (!project) return;
    await assignUser(project.id, { user_id: userId, role });
  };

  const handleUpdateRole = async (memberId: string, role: ProjectRole): Promise<void> => {
    if (!project) return;
    const member = members.find(m => m.id === memberId);
    if (member) {
      await updateMemberRole(project.id, member.user.id, role);
    }
  };

  const handleRemoveMember = async (memberId: string): Promise<void> => {
    if (!project) return;
    const member = members.find(m => m.id === memberId);
    if (member && member.role !== ProjectRole.OWNER) {
      if (window.confirm(`Remove ${member.user.name || member.user.email} from the project?`)) {
        await removeMember(project.id, member.user.id);
      }
    }
  };

  const availableUsers = users.filter(
    (user) => !members.some(member => member.user.id === user.id)
  );

  return {
    members,
    loading,
    error,
    availableUsers,
    handleAddMember,
    handleUpdateRole,
    handleRemoveMember,
  };
};