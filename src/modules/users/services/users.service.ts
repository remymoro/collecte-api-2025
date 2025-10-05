
import { BadRequestException, Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Not, Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';

import { CreateUserDto } from '../dto/create-user.dto';
import { ResetPasswordDto } from '../dto/reset-password.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { User } from '../entities/user.entity';
import { Centre } from 'src/modules/centres/entities/centre.entity';
import { PaginationResult } from 'src/shared/interfaces/pagination-result.interface';

// Génère un mot de passe aléatoire sécurisé (par défaut 12 caractères)
function genPassword(len = 12) {
  const chars = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ23456789@#$%';
  return Array.from({ length: len }, () => chars[Math.floor(Math.random()*chars.length)]).join('');
}

@Injectable()
// Service de gestion des utilisateurs (CRUD, sécurité, rôles, etc.)
export class UsersService {
  constructor(
    @InjectRepository(User) private readonly repo: Repository<User>,
    @InjectRepository(Centre) private readonly centres: Repository<Centre>,
  ) {}





    async findAllPaginated(query: { page?: number; limit?: number }): Promise<PaginationResult<User>> {
      const page = query.page ?? 1;
      const limit = query.limit ?? 20;
      const [items, total] = await this.repo.findAndCount({
        where: { deletedAt: IsNull() },
        skip: (page - 1) * limit,
        take: limit,
        order: { id: 'ASC' },
      });
      return { items, total, page, limit };
    }
      

  // Vérifie qu'un centre valide est fourni pour les rôles non-ADMIN
  private async assertCentreIfNeeded(role: string | undefined, centreId?: number | null) {
    if (role && role !== 'ADMIN') {
      if (!centreId) throw new BadRequestException({ code: 'CENTRE_REQUIRED', message: 'centreId requis pour ce rôle.' });
      const ok = await this.centres.exist({ where: { id: centreId, deletedAt: IsNull() } });
      if (!ok) throw new BadRequestException({ code: 'CENTRE_NOT_FOUND', message: 'Centre introuvable.' });
    }
  }


    /**
   * Crée un utilisateur après avoir vérifié l'unicité du login et hashé le mot de passe.
   * @param registerDto Données d'inscription (contenant le mot de passe en clair)
   * @returns L'utilisateur créé (sans exposer le hash)
   */
  async createUserWithHashedPassword(registerDto: CreateUserDto): Promise<User> {
    const login = registerDto.login.toLowerCase();
    const existingUser = await this.findByUsername(login);
    if (existingUser) {
      throw new BadRequestException("L'e-mail existe déjà");
    }
    if (!registerDto.password) {
      throw new BadRequestException('Mot de passe requis');
    }
    const passwordHash = await bcrypt.hash(registerDto.password, 10);
    const user = this.repo.create({
      login,
      passwordHash,
      role: registerDto.role,
      centreId: registerDto.role === 'ADMIN' ? null : registerDto.centreId!,
      isActive: true,
    });
    return this.repo.save(user);
  }


  // Crée un nouvel utilisateur (login unique, mot de passe hashé, gestion du rôle/centre)

  
  // Récupère un utilisateur par son id (pour /users/me)
 
async findById(id: number): Promise<User> {
  const user = await this.repo.findOne({ where: { id } });
  if (!user) throw new NotFoundException('Utilisateur introuvable');
  return user;
}

  

  // Récupère un utilisateur par son login (pour l'authentification)
  async findByUsername(login: string) {
    // On force la sélection du champ passwordHash (select: false par défaut)
    return this.repo.findOne({
      where: { login, deletedAt: IsNull() },
      select: ['id', 'login', 'role', 'centreId', 'isActive', 'createdAt', 'updatedAt', 'lastLoginAt', 'deletedAt', 'passwordHash'],
    });
  }
  


  // Liste paginée des utilisateurs (hors supprimés)




  // Récupère un utilisateur par id (détail admin)
  
  // Met à jour un utilisateur (login, rôle, centre, mot de passe, activation)
  async update(id: number, dto: UpdateUserDto) {
    const u = await this.repo.findOne({ where: { id, deletedAt: IsNull() } });
    if (!u) throw new NotFoundException({ code: 'USER_NOT_FOUND' });

    if (dto.login && dto.login.toLowerCase() !== u.login) {
      // Vérifie l'unicité du nouveau login
      const taken = await this.repo.exist({ where: { login: dto.login.toLowerCase(), id: Not(id), deletedAt: IsNull() } });
      if (taken) throw new BadRequestException({ code: 'LOGIN_TAKEN', message: 'Login déjà utilisé.' });
      u.login = dto.login.toLowerCase();
    }

  // Gestion du rôle et du centreId
    if (dto.role) {
      await this.assertCentreIfNeeded(dto.role, dto.centreId ?? u.centreId);
      u.role = dto.role;
      u.centreId = dto.role === 'ADMIN' ? null : (dto.centreId ?? u.centreId)!;
    } else if (dto.centreId !== undefined) {
      await this.assertCentreIfNeeded(u.role, dto.centreId);
      u.centreId = u.role === 'ADMIN' ? null : dto.centreId!;
    }

    if (dto.password) {
      // Hash le nouveau mot de passe si fourni
      u.passwordHash = await bcrypt.hash(dto.password, 10);
    }

  if (dto.isActive !== undefined) u.isActive = dto.isActive;

    const saved = await this.repo.save(u);
    return saved;
  }

  // Réinitialise le mot de passe d'un utilisateur (admin)
  async resetPassword(id: number, dto: ResetPasswordDto) {
    const u = await this.repo.findOne({ where: { id, deletedAt: IsNull() } });
    if (!u) throw new NotFoundException({ code: 'USER_NOT_FOUND' });

    const password = dto.password ?? genPassword();
    u.passwordHash = await bcrypt.hash(password, 10);
    await this.repo.save(u);
    return { id: u.id, login: u.login, tempPassword: password };
  }

  // Supprime (soft delete) un utilisateur
  async remove(id: number) {
    const res = await this.repo.softDelete({ id });
    if (!res.affected) throw new NotFoundException({ code: 'USER_NOT_FOUND' });
    return { success: true };
  }
}
