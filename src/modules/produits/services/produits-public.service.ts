import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produit } from '../entities/produit.entity';

@Injectable()
export class ProduitsPublicService {
  constructor(
    @InjectRepository(Produit)
    private readonly repo: Repository<Produit>,
  ) {}



  async findByBarcode(barcode: string): Promise<Produit> {
    const produit = await this.repo.findOne({
      where: { gtin: barcode },
    });
    if (!produit) throw new NotFoundException('Produit non trouvé');
    return produit;
  }
}