import { Controller, UseGuards, Post, Body, Get, Query, Patch, Param, ParseIntPipe } from '@nestjs/common';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { CreateProduitDto } from '../dto/create-produit.dto';
import { UpdateProduitDto } from '../dto/update-produit.dto';
import { Produit } from '../entities/produit.entity';
import { AdminProduitService } from '../services/admin-produit-service';
import { PaginationResult } from 'src/shared/interfaces/pagination-result.interface';
import type { PaginationQuery } from 'src/shared/interfaces/pagination-query.interface';
import { JwtAuthGuard } from 'src/modules/auth/jwt/jwt-auth.guard';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('admin/produits')
export class AdminProduitsController {
  constructor(
    private readonly service: AdminProduitService,
  ) {}

  @Post()
  async create(@Body() dto: CreateProduitDto): Promise<Produit> {
    return await this.service.create(dto);
  }

  @Get()
  async list(
    @Query() query: PaginationQuery
  ): Promise<PaginationResult<Produit>> {
    return await this.service.findAllPaginated(query);
  }

  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateProduitDto
  ): Promise<Produit> {
    return await this.service.update(id, dto);
  }

  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number
  ): Promise<Produit> {
    return await this.service.findById(id);
  }
}