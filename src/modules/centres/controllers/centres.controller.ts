// -----------------------------------------------------------------------------
// Importation des décorateurs et outils NestJS nécessaires
// -----------------------------------------------------------------------------
import {
  Controller,    // Permet de définir un contrôleur (classe qui gère les routes)
  Get, Post, Patch, Delete,  // Décorateurs pour définir les méthodes HTTP
  Param, Body, Query,        // Pour extraire des données de la requête
  ParseIntPipe,               // Transforme un paramètre string (ex: ":id") en nombre
  UseGuards
} from '@nestjs/common';

import { CentresService } from '../services/centres.service';  // Service métier du module
import { CreateCentreDto } from '../dto/create-centre.dto';     // DTO pour la création
import { UpdateCentreDto } from '../dto/update-centre.dto';     // DTO pour la mise à jour
import type { PaginationResult } from 'src/shared/interfaces/pagination-result.interface';

import { CentreResponse } from '../interfaces/centre-response.interface'; // Structure de sortie d’un centre
import type { PaginationQuery } from 'src/shared/interfaces/pagination-query.interface';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/jwt/jwt-auth.guard';
// -----------------------------------------------------------------------------
// Définition du contrôleur "centres"
// Toutes les routes seront préfixées par "/api/centres"
// -----------------------------------------------------------------------------
@Controller('centres')
@UseGuards(JwtAuthGuard, RolesGuard) // Protège toutes les routes par JWT et rôles
@Roles('ADMIN') // Seuls les admins peuvent accéder à ce contrôle
export class CentresController {

  // Injection du service métier via le constructeur
  // 👉 Cela permet au contrôleur d’appeler la logique du domaine "Centres"
  constructor(private readonly centresService: CentresService) {}

  // ---------------------------------------------------------------------------
  // POST /api/centres
  // Crée un nouveau centre à partir d’un DTO validé
  // ---------------------------------------------------------------------------
  @Post()
  create(@Body() dto: CreateCentreDto): Promise<CentreResponse> {
    // Le décorateur @Body() extrait le corps JSON de la requête HTTP.
    // Le ValidationPipe (activé globalement dans main.ts) valide et transforme
    // ce JSON en instance de CreateCentreDto.
    return this.centresService.create(dto);
  }

  // ---------------------------------------------------------------------------
  // GET /api/centres?page=1&limit=10
  // Récupère la liste paginée des centres (format PaginationResult)
  // ---------------------------------------------------------------------------
  @Get()
  findAll(@Query() query: PaginationQuery): Promise<PaginationResult<CentreResponse>> {
    // Le décorateur @Query() lit les paramètres d’URL (ex: ?page=2&limit=20)
    // Le service gère la logique de pagination et renvoie un objet typé :
    // { items: [...], total: 42, page: 1, limit: 10 }
    return this.centresService.findAll(query);
  }

  // ---------------------------------------------------------------------------
  // GET /api/centres/all
  // Récupère la liste complète (sans pagination)
  // Utile pour les menus déroulants ou les sélecteurs dans Angular.
  // ---------------------------------------------------------------------------
  @Get('all')
  findAllSimple(): Promise<CentreResponse[]> {
    return this.centresService.findAllSimple();
  }

  // ---------------------------------------------------------------------------
  // GET /api/centres/:id
  // Récupère un centre spécifique par son identifiant numérique
  // ---------------------------------------------------------------------------
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number): Promise<CentreResponse> {
    // @Param('id') lit la valeur depuis l’URL (ex: /centres/3)
    // ParseIntPipe transforme le paramètre string "3" en nombre 3
    return this.centresService.findOne(id);
  }

  // ---------------------------------------------------------------------------
  // PATCH /api/centres/:id
  // Met à jour partiellement un centre existant
  // ---------------------------------------------------------------------------
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,   // identifiant du centre à modifier
    @Body() dto: UpdateCentreDto,            // corps JSON contenant les champs à modifier
  ): Promise<CentreResponse> {
    return this.centresService.update(id, dto);
  }

  // ---------------------------------------------------------------------------
  // DELETE /api/centres/:id
  // Supprime (logiquement) un centre (soft delete)
  // ---------------------------------------------------------------------------
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number): Promise<{ success: boolean }> {
    // Appelle la méthode de service qui fait un softDelete()
    // et renvoie un petit objet de confirmation { success: true }
    return this.centresService.remove(id);
  }
}
