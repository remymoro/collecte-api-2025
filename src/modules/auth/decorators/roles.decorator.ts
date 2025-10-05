import { SetMetadata } from '@nestjs/common';
import { Role } from '../interfaces/role.interface';
import { ROLES_KEY } from '../constants/auth.constants';

/**
 * Décorateur @Roles(...)
 * Associe une liste de rôles autorisés à une route.
 */
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);
