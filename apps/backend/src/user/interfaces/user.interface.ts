import { UserRole } from '../enums/user-role.enum';

export interface User {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
  created_at: Date;
  updated_at: Date;
}
