import { UserRole } from '../../../generated/prisma';

export interface UserData {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}

export interface CreateUserRequest {
  email: string;
  name?: string;
  role?: UserRole;
}

export interface UpdateUserRequest {
  email?: string;
  name?: string;
  role?: UserRole;
}

export interface UserWhereInput {
  id?: string;
  email?: string;
  role?: UserRole;
  created_at?: {
    gte?: Date;
    lte?: Date;
  };
}
