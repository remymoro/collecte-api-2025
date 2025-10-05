// Contrôleur Users : gestion des utilisateurs (CRUD, reset password, profil)
// Toutes les routes sont protégées par JWT + rôles (ADMIN sauf /me)
import { Body, Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Patch, Post, Delete, Query, UseGuards, Request } from '@nestjs/common';

import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UsersService } from '../services/users.service';
import { Roles } from 'src/modules/auth/decorators/roles.decorator';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/jwt/jwt-auth.guard';
import { User } from '../entities/user.entity';
import { PaginationResult } from 'src/shared/interfaces/pagination-result.interface';



@Controller('admin/users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  /**
   * GET /admin/users/me
   * Retourne le profil de l'utilisateur connecté (self-service)
   * - Accessible à tout utilisateur authentifié (ADMIN, CENTRE, VOLUNTEER)
   * - Utilise JwtAuthGuard + RolesGuard pour vérifier le JWT et les rôles
   */


  /**
   * GET /admin/users/:id
   * Récupère un utilisateur par son id (ADMIN uniquement)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Get(':id')
  getById(@Param('id', ParseIntPipe) id: number): Promise<User> {
    return this.service.findById(id);
  }
  


  /**
   * POST /admin/users
   * Crée un nouvel utilisateur (ADMIN uniquement)
   * - Utilise CreateUserDto pour valider les données
   * - Accessible uniquement aux ADMIN
   */
  //@UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Post()
  create(@Body() dto: CreateUserDto) {
    return this.service.createUserWithHashedPassword(dto);
  }

  /**
   * GET /admin/users
   * Liste paginée des utilisateurs (ADMIN uniquement)
   * - Query params : page, limit
   * - Accessible uniquement aux ADMIN
   */
  

      @UseGuards(JwtAuthGuard, RolesGuard)
      @Roles('ADMIN')
      @Get()
      list(
        @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
        @Query('limit', new DefaultValuePipe(20), ParseIntPipe) limit: number
      ): Promise<PaginationResult<User>> {
        return this.service.findAllPaginated({ page, limit });
      }


  /**
   * PATCH /admin/users/:id
   * Met à jour un utilisateur (ADMIN uniquement)
   * - Utilise UpdateUserDto pour valider les données
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id')
  update(@Param('id', ParseIntPipe) id: number, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }

  /**
   * PATCH /admin/users/:id/reset-password
   * Réinitialise le mot de passe d'un utilisateur (ADMIN uniquement)
   * - Utilise ResetPasswordDto pour valider le nouveau mot de passe
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Patch(':id/reset-password')
  reset(@Param('id', ParseIntPipe) id: number, @Body() dto: ResetPasswordDto) {
    return this.service.resetPassword(id, dto);
  }

  /**
   * DELETE /admin/users/:id
   * Supprime (soft delete) un utilisateur (ADMIN uniquement)
   */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN')
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.service.remove(id);
  }
}


