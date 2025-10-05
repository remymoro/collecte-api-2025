/**
 * UserDto : interface exposée à l'API pour un utilisateur
 *
 * - Sépare la structure publique de l'entité interne
 * - Utilisée par le mapper pour contrôler les champs exposés
 */
export interface UserDto {
  id: number;
  login: string;
  role: string;
  centreId?: number | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string | null;
}
