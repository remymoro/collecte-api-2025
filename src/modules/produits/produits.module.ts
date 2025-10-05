import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Produit } from './entities/produit.entity';
import { AdminProduitsController } from './controllers/admin-produits.controller';
import { ProduitsPublicController } from './controllers/produits-public.controller';
import { AdminProduitService } from './services/admin-produit-service';
import { ProduitsPublicService } from './services/produits-public.service';

@Module({
  imports: [TypeOrmModule.forFeature([Produit])],
  controllers: [AdminProduitsController, ProduitsPublicController],
  providers: [AdminProduitService,ProduitsPublicService],
  exports: [],
})
export class ProduitsModule {}