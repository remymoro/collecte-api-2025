import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Query,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { CreateCollecteDto } from '../dto/create-collecte.dto';
import { UpdateCollecteDto } from '../dto/update-collecte.dto';
import { CollecteService } from '../services/collecte.service';
import type { CollecteResponseDto } from '../dto/collecte-response.dto';
import type { PaginationQuery } from 'src/shared/interfaces/pagination-query.interface';
import type { PaginationResult } from 'src/shared/interfaces/pagination-result.interface';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/jwt/jwt-auth.guard';

@Controller('collectes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
export class CollecteController {
  constructor(private readonly service: CollecteService) {}

  // Liste complète (non paginée) - utile pour des sélecteurs
  @Get('all')
  async findAllRaw(): Promise<CollecteResponseDto[]> {
    return this.service.findAll();
  }

  // Liste paginée
  @Get()
  async findAll(
    @Query() query: PaginationQuery,
  ): Promise<PaginationResult<CollecteResponseDto>> {
    return this.service.findAllPaginated(query);
  }

  // Détail
  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CollecteResponseDto> {
    return this.service.findById(id);
  }

  // Création
  @Post()
  async create(@Body() dto: CreateCollecteDto): Promise<CollecteResponseDto> {
    return this.service.create(dto);
  }

  // Mise à jour partielle
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCollecteDto,
  ): Promise<CollecteResponseDto> {
    return this.service.update(id, dto);
  }

  // Suppression douce
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; id: number }> {
    const success = await this.service.remove(id);
    return { success, id };
  }

  // Maintenance: recalcul des statuts
  @Post('update-statuses')
  async updateStatuses(): Promise<{ updated: number }> {
    const updated = await this.service.updateAllStatuses();
    return { updated };
  }
}
