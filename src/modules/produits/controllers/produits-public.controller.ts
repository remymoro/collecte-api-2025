import { Controller, Get, Param } from '@nestjs/common';
import { ProduitsPublicService } from '../services/produits-public.service';
import { Produit } from '../entities/produit.entity';

@Controller('produits')
export class ProduitsPublicController {
  constructor(
    private readonly produitService: ProduitsPublicService
  ) {}

  @Get('produit-by-barcode/:barcode')
  async getProduitByBarcode(@Param('barcode') barcode: string): Promise<Produit> {
    return await this.produitService.findByBarcode(barcode);
  }


}