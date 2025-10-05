import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-local';
import { AuthService } from '../services/auth.service';
import { AuthUser } from '../interfaces/auth-user.interface';

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly authService: AuthService) {
    super({ usernameField: 'login', passwordField: 'password' });
  }

  // Passport appelle validate(login, password)
  async validate(login: string, password: string): Promise<AuthUser> {
    const user = await this.authService.validateUser(login, password);
    // Pas de throw ici: validateUser lève déjà UnauthorizedException si besoin
    return {
      id: user.id,
      login: user.login,
      role: user.role,
      centreId: user.centreId ?? null,
    };
  }
}
