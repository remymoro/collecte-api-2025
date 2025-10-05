

// Module d'authentification principal de l'application
// Regroupe tous les composants nécessaires à la gestion de l'auth (services, stratégies, contrôleurs)

import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthController } from './controllers/auth.controller';
import { JwtStrategy } from './jwt/jwt.strategy';
import { AuthService } from './services/auth.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';
import { LocalStrategy } from './jwt/local.strategy';



@Module({
  imports: [
    // Module utilisateur : permet d'accéder aux users pour l'auth
    UsersModule,
    // Module Passport : fournit l'infrastructure pour les stratégies d'authentification
    PassportModule,
    // Module de configuration : permet d'accéder aux variables d'env (JWT_SECRET, etc.)
    ConfigModule,
    // Module JWT : gère la signature et la vérification des tokens JWT
    JwtModule.registerAsync({
      imports: [ConfigModule],
      // useFactory : permet de configurer dynamiquement le module JWT avec les variables d'env
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'), // Clé secrète pour signer les tokens
        signOptions: {
          expiresIn: parseInt(configService.get<string>('ACCESS_TOKEN_VALIDITY_DURATION_IN_SEC') || '3600'), // Durée de validité du token
        },
      }),
      inject: [ConfigService],
    }),
  ],
  // Fournit le service d'authentification et la stratégie JWT à l'application
  providers: [AuthService, JwtStrategy,LocalStrategy],
  // Contrôleur qui expose les routes d'authentification (login, etc.)
  controllers: [AuthController],
  // Exporte AuthService et JwtModule pour les utiliser dans d'autres modules (ex : guards)
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
