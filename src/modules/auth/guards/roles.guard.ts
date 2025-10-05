import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../constants/auth.constants';   // <- import depuis constants
import type { AuthUser } from '../interfaces/auth-user.interface';
import type { Role } from '../interfaces/role.interface';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    // Récupère la liste des rôles requis (posés par @Roles(...))
    const required = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);

    // Si aucun rôle requis, accès autorisé
    if (!required || required.length === 0) return true;

    // Récupère l'utilisateur injecté par la stratégie JWT
    const req = ctx.switchToHttp().getRequest();
    const user = req.user as AuthUser | undefined;

    if (!user?.role) {
      // Normalement capté par JwtAuthGuard, mais on garde un message clair
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Role manquant' });
    }

    if (!required.includes(user.role)) {
      throw new ForbiddenException({ code: 'FORBIDDEN', message: 'Insufficient role' });
    }

    return true;
  }
}
