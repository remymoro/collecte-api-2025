import { Module } from "@nestjs/common";
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollecteUtilisateurController } from "./controllers/collecte-utilisateur";
import { CollecteUtilisateurService } from "./services/collecte-utilisateur.service";
import { Magasin } from 'src/modules/magasins/entities/magasin.entity';
import { Collecte } from 'src/modules/collecte/entities/collecte.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Magasin, Collecte])
  ],
  providers: [CollecteUtilisateurService],
  controllers: [CollecteUtilisateurController],
  exports: [CollecteUtilisateurService],
})
export class CollecteUtilisateurModule {}