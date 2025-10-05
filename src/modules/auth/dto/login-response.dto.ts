import { Role } from '../interfaces/role.interface';

/**
 * LoginResponseDto : structure de la réponse de connexion
 *
 * ⚠️ À n’utiliser que si tu renvoies encore access_token en JSON
 * (si tu passes 100% par cookie → créer un UserResponseDto séparé).
 */
export class LoginResponseDto {
  access_token: string;
  user: {
    id: number;
    login: string;
    role: Role;
    centreId: number | null;
  };
}
