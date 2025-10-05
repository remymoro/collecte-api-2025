import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Magasin } from './entities/magasin.entity'; // Entité Magasin
import { Centre } from '../centres/entities/centre.entity'; // Entité Centre (relation)
import { MagasinsService } from './services/magasins.service'; // Service métier pour les magasins
import { MagasinsController } from './controllers/magasins.controller'; // Contrôleur des magasins
import { CollecteMagasin } from '../collecte/entities/collecte-magasin.entity'; // Entité de liaison collecte-magasin
import { FilesModule } from '../files/file.module'; // Module pour la gestion des fichiers

@Module({
  imports: [
    TypeOrmModule.forFeature([Magasin, Centre, CollecteMagasin]), // Déclare les entités utilisées par TypeORM
    FilesModule 
  ],
  controllers: [MagasinsController], // Déclare le contrôleur pour les routes magasins
  providers: [MagasinsService],      // Déclare le service métier
  exports: [MagasinsService],        // Rend le service disponible pour d'autres modules
})
export class MagasinsModule {}

