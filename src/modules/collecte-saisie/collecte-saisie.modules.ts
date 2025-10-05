import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CollecteSaisie } from './entities/collecte-saisie.entity';
import { CollecteSaisieService } from './services/collecte-saisie.service';
import { CollecteSaisieController } from './controllers/collecte-saisie.controller';
import { CollecteMagasin } from '../collecte/entities/collecte-magasin.entity';
import { Magasin } from '../magasins/entities/magasin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([CollecteSaisie,CollecteMagasin,Magasin])],
  providers: [CollecteSaisieService],
  controllers: [CollecteSaisieController],
  exports: [CollecteSaisieService],
})
export class CollecteSaisieModule {}