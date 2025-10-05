import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Centre } from './entities/centre.entity';
import { Magasin } from '../magasins/entities/magasin.entity';
import { CentresService } from './services/centres.service';
import { CentresController } from './controllers/centres.controller';

@Module({
  imports: [TypeOrmModule.forFeature([Centre, Magasin])],
  controllers:[CentresController],
  providers: [CentresService],
  
})
export class CentresModule {}
