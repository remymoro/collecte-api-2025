import {
  Controller,      // Permet de définir un contrôleur NestJS
  Get,              // Décorateur pour les routes GET
  Post,             // Décorateur pour les routes POST
  Patch,            // Décorateur pour les routes PATCH
  Body,             // Permet de récupérer le corps de la requête
  Query,            // Permet de récupérer les paramètres de query
  Param,            // Permet de récupérer les paramètres d'URL
  Delete,           // Décorateur pour les routes DELETE
  UseGuards,        // Permet d'appliquer des guards (sécurité)
  ParseIntPipe,     // Pipe pour convertir un paramètre en entier
} from '@nestjs/common';

import { CreateCollecteDto } from '../dto/create-collecte.dto'; // DTO pour la création d'une collecte
import { UpdateCollecteDto } from '../dto/update-collecte.dto'; // DTO pour la mise à jour d'une collecte
import { CollecteService } from '../services/collecte.service'; // Service métier pour les collectes

import type { CollecteResponseDto } from '../dto/collecte-response.dto'; // Typage de la réponse d'une collecte
import type { PaginationQuery } from 'src/shared/interfaces/pagination-query.interface'; // Typage de la query de pagination
import type { PaginationResult } from 'src/shared/interfaces/pagination-result.interface'; // Typage du résultat paginé

import { Roles } from 'src/modules/auth/decorators/roles.decorator'; // Décorateur pour restreindre l'accès selon le rôle
import { RolesGuard } from 'src/modules/auth/guards/roles.guard'; // Guard qui vérifie le rôle de l'utilisateur
import { JwtAuthGuard } from 'src/modules/auth/jwt/jwt-auth.guard'; // Guard JWT pour sécuriser les routes

@Controller('collectes') // Toutes les routes de ce contrôleur seront préfixées par /collectes
@UseGuards(JwtAuthGuard, RolesGuard) // Toutes les routes sont protégées par JWT et contrôle de rôle
@Roles('ADMIN') // Seuls les utilisateurs avec le rôle ADMIN peuvent accéder à ces routes
export class CollecteController {
  constructor(private readonly service: CollecteService) {}

  // GET /collectes/all : Retourne la liste complète des collectes (non paginée)
  @Get('all')
  async findAllRaw(): Promise<CollecteResponseDto[]> {
    return this.service.findAll();
  }

  // GET /collectes : Retourne la liste paginée des collectes selon la query (page, limit, tri)
  @Get()
  async findAll(
    @Query() query: PaginationQuery,
  ): Promise<PaginationResult<CollecteResponseDto>> {
    return this.service.findAllPaginated(query);
  }

  // GET /collectes/:id : Retourne une collecte par son id (avec conversion en number)
  @Get(':id')
  async findById(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<CollecteResponseDto> {
    return this.service.findById(id);
  }

  // POST /collectes : Crée une nouvelle collecte
  @Post()
  async create(@Body() dto: CreateCollecteDto): Promise<CollecteResponseDto> {
    return this.service.create(dto);
  }

  // PATCH /collectes/:id : Met à jour une collecte existante (partiellement)
  @Patch(':id')
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCollecteDto,
  ): Promise<CollecteResponseDto> {
    return this.service.update(id, dto);
  }

  // DELETE /collectes/:id : Suppression douce d'une collecte (soft delete)
  @Delete(':id')
  async remove(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ success: boolean; id: number }> {
    const success = await this.service.remove(id);
    return { success, id };
  }

  // POST /collectes/update-statuses : Maintenance, recalcul des statuts de toutes les collectes
  @Post('update-statuses')
  async updateStatuses(): Promise<{ updated: number }> {
    const updated = await this.service.updateAllStatuses();
    return { updated };
  }
}
