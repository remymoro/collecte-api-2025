import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Magasin } from './entities/magasin.entity';
import { Centre } from '../centres/entities/centre.entity';
import { MagasinsService } from './services/magasins.service';
import { MagasinsController } from './controllers/magasins.controller';
import { CollecteMagasin } from '../collecte/entities/collecte-magasin.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Magasin, Centre,CollecteMagasin])],
  controllers: [MagasinsController],
  providers: [MagasinsService],
  exports: [MagasinsService],
})
export class MagasinsModule {}