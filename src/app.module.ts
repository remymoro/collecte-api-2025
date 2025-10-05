import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CentresModule } from './modules/centres/centres.module';
import { MagasinsModule } from './modules/magasins/magasins.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { ProduitsModule } from './modules/produits/produits.module';
import { CollecteModule } from './modules/collecte/collecte.module';
import { CollecteUtilisateurModule } from './modules/collecte-utilisateurs/collecte-utilisateur.module';
import { CollecteSaisieModule } from './modules/collecte-saisie/collecte-saisie.modules';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }), // charge .env → process.env
    TypeOrmModule.forRoot({
      type: 'mysql',
      host: process.env.DB_HOST,
      port: Number(process.env.DB_PORT ?? 3306),
      username: process.env.DB_USER,
      password: process.env.DB_PASS,
      database: process.env.DB_NAME,
      autoLoadEntities: true,
      synchronize: true, // juste pour démarrer
    }),
   CentresModule,
    MagasinsModule, // <-- importer le module magasins
    AuthModule,
    UsersModule,
    ProduitsModule,
    CollecteModule,
    CollecteUtilisateurModule,
    CollecteSaisieModule
  ],
})
export class AppModule {}
