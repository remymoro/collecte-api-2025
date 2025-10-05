import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Collecte } from './entities/collecte.entity';
import { CollecteMagasin } from './entities/collecte-magasin.entity';
import { CollecteService } from './services/collecte.service';
import { CollecteController } from './controllers/collecte.controller';
// import { CollecteService } from './collecte.service';
// import { CollecteController } from './collecte.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([Collecte, CollecteMagasin]),
  ],
  providers: [CollecteService],
   controllers: [CollecteController],
  exports: [CollecteService],
})
export class CollecteModule {}