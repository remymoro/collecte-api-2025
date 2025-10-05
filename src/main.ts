// src/main.ts

// Importation des modules nécessaires de NestJS et des packages tiers.
import { NestFactory } from '@nestjs/core'; // Permet de créer l'application NestJS.
import { AppModule } from './app.module'; // Module principal de l'application.
import { ValidationPipe, ClassSerializerInterceptor, BadRequestException, Logger } from '@nestjs/common'; // Outils pour la validation et la gestion des réponses.
import { Reflector } from '@nestjs/core'; // Utilitaire pour les métadonnées (utilisé par l'interceptor).
import helmet from 'helmet'; // Sécurise les headers HTTP.
import cookieParser from 'cookie-parser'; // Permet de lire les cookies dans les requêtes.
import type { ValidationError } from 'class-validator'; // Type pour les erreurs de validation.
import { GlobalExceptionFilter } from './common/filters/global-exception.filter';

// Fonction utilitaire pour extraire tous les messages d'erreur de validation dans un tableau plat.
function flatten(errors: ValidationError[]): string[] {
  const out: string[] = [];
  const walk = (e: ValidationError) => {
    if (e.constraints) out.push(...Object.values(e.constraints)); // Ajoute les messages d'erreur du champ courant.
    e.children?.forEach(walk); // Parcourt récursivement les enfants (pour les objets imbriqués).
  };
  errors.forEach(walk); // Applique la fonction à chaque erreur.
  return out; // Retourne le tableau de messages.
}

// Fonction utilitaire pour organiser les erreurs par champ, utile pour le front.
function toFields(errors: ValidationError[]) {
  const map: Record<string, string[]> = {};
  const walk = (prefix: string, e: ValidationError) => {
    const key = prefix ? `${prefix}.${e.property}` : e.property; // Gère les champs imbriqués (ex: "user.email").
    if (e.constraints) map[key] = Object.values(e.constraints); // Ajoute les messages pour le champ courant.
    e.children?.forEach(c => walk(key, c)); // Parcourt les enfants.
  };
  errors.forEach(e => walk('', e)); // Applique la fonction à chaque erreur.
  return map; // Retourne l'objet des erreurs par champ.
}

// Fonction principale qui démarre l'application NestJS.
async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['error', 'warn', 'log', 'debug', 'verbose'], // Active tous les niveaux de log
  }); // Création de l'application à partir du module principal.

  // Configuration du CORS pour autoriser le front à accéder à l'API.
  app.enableCors({
    origin: process.env.FRONT_URL ?? 'http://localhost:4200', // URL du front autorisée.
    credentials: true, // Autorise l'envoi des cookies.
  });

  app.use(helmet()); // Ajoute des headers de sécurité.
  app.use(cookieParser()); // Active la lecture des cookies.
  app.setGlobalPrefix('api'); // Toutes les routes commenceront par /api.

  // Ajout d'un pipe de validation global pour toutes les requêtes.
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Seuls les champs attendus sont acceptés.
    transform: true, // Transforme les payloads en objets DTO.
    forbidNonWhitelisted: true, // Erreur si des champs non attendus sont envoyés.
    forbidUnknownValues: false, // Permet les valeurs inconnues (optionnel).
    exceptionFactory: (errors: ValidationError[]) =>
      new BadRequestException({
        statusCode: 400, // Code HTTP.
        error: 'Bad Request', // Message d'erreur général.
        message: flatten(errors),   // Tableau des messages d'erreur.
        fields: toFields(errors),   // Détail des erreurs par champ.
        code: 'VALIDATION_ERROR',   // Code d'erreur spécifique.
      }),
  }));

  // Ajout d'un interceptor pour formater les réponses selon les DTO.
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new GlobalExceptionFilter()); // Active le filtre global

  await app.listen(3000); // Démarre le serveur sur le port 3000.
  Logger.log('NestJS démarré sur le port 3000');
}
bootstrap(); // Appelle la fonction pour lancer l'application.
