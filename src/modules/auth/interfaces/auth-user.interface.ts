import { Role } from './role.interface';

export interface AuthUser {
  id: number;
  login: string;
  role: Role;
  centreId: number | null;
}
