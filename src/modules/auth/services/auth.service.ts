import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { LoginDto } from '../dto/login.dto';
import { LoginResponseDto } from '../dto/login-response.dto';
import { UsersService } from 'src/modules/users/services/users.service';
import { AuthUser } from '../interfaces/auth-user.interface';

// Déplace ça dans src/auth/interfaces/jwt-payload.interface.ts si tu veux le réutiliser partout
interface JwtPayload {
  sub: number;
  login: string;
  role: AuthUser['role'];         // <- plus besoin d'importer l'entité User
  centreId: number | null;
}

type IssueTokensResult = {
  access_token: string;
  user: AuthUser;
  maxAgeMs?: number;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  /**
   * Utilisée par la stratégie locale.
   * Ne révèle jamais si c'est le login ou le mot de passe qui est faux.
   */
  async validateUser(login: string, password: string) {
    const user = await this.usersService.findByUsername(login); // ou findByLogin
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw new UnauthorizedException('Invalid credentials');

    return user;
  }

  /**
   * Variante "API classique" (sans AuthGuard('local')).
   * Réutilise validateUser + issueTokens pour éviter le code dupliqué.
   */
  async login(dto: LoginDto): Promise<LoginResponseDto> {
    const user = await this.validateUser(dto.login, dto.password);
    const { access_token } = await this.issueTokens({
      id: user.id,
      login: user.login,
      role: user.role,
      centreId: user.centreId ?? null,
    });

    return {
      access_token,
      user: { id: user.id, login: user.login, role: user.role, centreId: user.centreId ?? null },
    };
  }

  /**
   * Source de vérité pour signer le JWT et calculer maxAgeMs (pour cookie).
   * Utilisée après AuthGuard('local') dans le contrôleur.
   */
  async issueTokens(user: AuthUser): Promise<IssueTokensResult> {
    const payload: JwtPayload = {
      sub: user.id,
      login: user.login,
      role: user.role,
      centreId: user.centreId ?? null,
    };

    const access_token = await this.jwtService.signAsync(payload);

    // maxAge calculé depuis exp (si 'expiresIn' est configuré dans JwtModule)
    const decoded: any = this.jwtService.decode(access_token);
    const maxAgeMs = decoded?.exp ? decoded.exp * 1000 - Date.now() : undefined;

    return { access_token, user, maxAgeMs };
  }
}
