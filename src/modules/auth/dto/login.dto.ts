import { IsString, MinLength } from 'class-validator';

/**
 * LoginDto : Data Transfer Object pour la connexion
 *
 * - Sert à valider et typer les données envoyées lors du login (POST /auth/login)
 * - Utilisé par le contrôleur pour garantir que le body contient bien un login et un mot de passe
 */
export class LoginDto {
  @IsString()
  readonly login: string;

  @IsString()
  @MinLength(4)
  readonly password: string;
}
