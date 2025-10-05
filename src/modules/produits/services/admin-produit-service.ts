import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Produit } from '../entities/produit.entity';
import { CreateProduitDto } from '../dto/create-produit.dto';
import { UpdateProduitDto } from '../dto/update-produit.dto';
import { PaginationQuery } from 'src/shared/interfaces/pagination-query.interface';
import { PaginationResult } from 'src/shared/interfaces/pagination-result.interface';

@Injectable()
export class AdminProduitService {
  constructor(
    @InjectRepository(Produit)
    private readonly repo: Repository<Produit>,
  ) {}

  async create(dto: CreateProduitDto): Promise<Produit> {
    const produit = this.repo.create(dto);
    return this.repo.save(produit);
  }


    async findAllPaginated( query: PaginationQuery): Promise<PaginationResult<Produit>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;
    const [items, total] = await this.repo.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        order: { id: 'ASC' },
    });
    return { items, total, page, limit };
    }

    
  async findAll(): Promise<Produit[]> {
    return this.repo.find();
  }

  async findById(id: number): Promise<Produit> {
    const produit = await this.repo.findOne({ where: { id } });
    if (!produit) throw new NotFoundException('Produit introuvable');
    return produit;
  }

  async update(id: number, dto: UpdateProduitDto): Promise<Produit> {
    const produit = await this.findById(id);
    Object.assign(produit, dto);
    return this.repo.save(produit);
  }

  async remove(id: number): Promise<{ success: boolean }> {
    await this.repo.delete(id);
    return { success: true };
  }
}