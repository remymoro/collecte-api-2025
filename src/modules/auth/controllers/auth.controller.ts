// src/auth/controllers/auth.controller.ts

// Import des décorateurs et utilitaires NestJS
import { Controller, Post, UseGuards, Res, HttpCode, Get } from '@nestjs/common';
// Import du guard Passport (ici "local")
import { AuthGuard } from '@nestjs/passport';
// Type Response (Express) pour typer la réponse HTTP
import type { Response } from 'express';

// Service métier d’authentification
import { AuthService } from '../services/auth.service';
// Décorateur custom qui rend la route publique (ignorée par JwtAuthGuard global)
import { Public } from '../decorators/public.decorator';
// Décorateur custom qui injecte l’utilisateur typé depuis req.user
import { User } from '../decorators/user.decorator';
// Nom de cookie centralisé (pour éviter d’avoir la string en dur partout)
import { ACCESS_TOKEN_COOKIE } from '../constants/auth.constants';
// Typage de l’utilisateur injecté
import type { AuthUser } from '../interfaces/auth-user.interface';
import { JwtAuthGuard } from '../jwt/jwt-auth.guard';

@Controller('auth') // Toutes les routes seront préfixées par /auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()                 // Cette route est accessible sans JWT (ex: login initial)
  @Post('login')            // POST /auth/login
  @UseGuards(AuthGuard('local')) // Protégée par la stratégie "local" (login/password)
  @HttpCode(200)            // Force le code HTTP 200 (et pas 201 par défaut)
  async login(
    @User() user: AuthUser,                       // Injecte l’utilisateur validé (via LocalStrategy)
    @Res({ passthrough: true }) res: Response,    // Response Express pour poser le cookie
  ) {
    // Génére un token et retourne aussi un user "safe" (sans password)
    const { access_token, user: safeUser, maxAgeMs } =
      await this.authService.issueTokens(user);

    // Active le flag secure uniquement en prod (HTTPS obligatoire)
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie(ACCESS_TOKEN_COOKIE, access_token, {
      httpOnly: true, // Cookie inaccessible en JS (protège contre XSS)
      secure: isProd, // true = seulement en HTTPS (important en prod)
      sameSite: 'lax',  // Protection CSRF tout en permettant la plupart des navigations
      path: '/',        // Le cookie est envoyé sur toutes les routes
      maxAge: maxAgeMs ?? 3600_000, // Durée de vie alignée avec le token
    });

    // Réponse au front : uniquement l’utilisateur "safe"
    return { user: safeUser };
  }

  @Post('logout')          // POST /auth/logout
  @HttpCode(200)
  async logout(@Res({ passthrough: true }) res: Response) {
    // Efface le cookie JWT côté client
    res.clearCookie(ACCESS_TOKEN_COOKIE, { path: '/' });
    return { success: true }; // Renvoie une réponse simple
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async me(@User() user: AuthUser) {
    return { user };
  }
}
