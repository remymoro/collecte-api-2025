// =============================================================================
// CentresService (version typée et documentée)
// =============================================================================

import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not } from 'typeorm';
import { Centre } from '../entities/centre.entity';
import { Magasin } from '../../magasins/entities/magasin.entity';
import { CreateCentreDto } from '../dto/create-centre.dto';
import { UpdateCentreDto } from '../dto/update-centre.dto';
import { PaginationQuery } from 'src/shared/interfaces/pagination-query.interface';
import { PaginationResult } from 'src/shared/interfaces/pagination-result.interface';

// --- Nouvelles interfaces de notre module
import {
  CentreResponse,
} from '../interfaces/centre-response.interface'; // (index.ts exporte tout)
import { CentreWithMagasins } from '../interfaces';

@Injectable()
export class CentresService {
  constructor(
    @InjectRepository(Centre)
    private readonly repo: Repository<Centre>,

    @InjectRepository(Magasin)
    private readonly magasinRepo: Repository<Magasin>,
  ) {}

  // ---------------------------------------------------------------------------
  // Vérifie les champs devant être uniques (externalRef, email)
  // ---------------------------------------------------------------------------
  private async assertUniqueFields(
    dto: Partial<Centre>,
    excludeId?: number,
  ): Promise<void> {
    const externalRef = dto.externalRef?.trim();
    const email = dto.email?.trim();

    if (externalRef) {
      const exists = await this.repo.exist({
        where: { externalRef, ...(excludeId ? { id: Not(excludeId) } : {}) },
      });
      if (exists) throw new ConflictException('externalRef déjà utilisé');
    }

    if (email) {
      const exists = await this.repo.exist({
        where: { email, ...(excludeId ? { id: Not(excludeId) } : {}) },
      });
      if (exists) throw new ConflictException('email déjà utilisé');
    }
  }

  // ---------------------------------------------------------------------------
  // create(dto)
  // ---------------------------------------------------------------------------
  async create(dto: CreateCentreDto): Promise<CentreResponse> {
    await this.assertUniqueFields(dto);

    try {
      const entity = this.repo.create({
        ...dto,
        externalRef: dto.externalRef?.trim(),
        email: dto.email?.trim(),
      });

      const saved = await this.repo.save(entity);
      return this.toResponse(saved);
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY' || e?.driverError?.errno === 1062) {
        const msg = /email/i.test(e?.driverError?.sqlMessage || '')
          ? 'email déjà utilisé'
          : 'externalRef déjà utilisé';
        throw new ConflictException(msg);
      }
      throw e;
    }
  }

  // ---------------------------------------------------------------------------
  // findAll() - Pagination + typage
  // ---------------------------------------------------------------------------
  async findAll(
    query: PaginationQuery,
  ): Promise<PaginationResult<CentreResponse>> {
    const page = query.page ?? 1;
    const limit = query.limit ?? 20;

    const [items, total] = await this.repo.findAndCount({
      skip: (page - 1) * limit,
      take: limit,
      order: { name: 'ASC' },
    });

    return {
      items: items.map((c) => this.toResponse(c)),
      total,
      page,
      limit,
    };
  }

  // ---------------------------------------------------------------------------
  // findAllSimple() - pour listes déroulantes
  // ---------------------------------------------------------------------------
  async findAllSimple(): Promise<CentreResponse[]> {
    const centres = await this.repo.find({ order: { name: 'ASC' } });
    return centres.map((c) => this.toResponse(c));
  }

  // ---------------------------------------------------------------------------
  // findOne(id)
  // ---------------------------------------------------------------------------
  async findOne(id: number): Promise<CentreResponse> {
    const centre = await this.repo.findOne({ where: { id } });
    if (!centre) throw new NotFoundException('Centre introuvable');
    return this.toResponse(centre);
  }

  // ---------------------------------------------------------------------------
  // update(id, dto)
  // ---------------------------------------------------------------------------
  async update(id: number, dto: UpdateCentreDto): Promise<CentreResponse> {
    const centre = await this.findOneEntity(id); // version interne (entité)
    await this.assertUniqueFields(dto, id);

    Object.assign(centre, {
      ...dto,
      externalRef: dto.externalRef?.trim() ?? centre.externalRef,
      email: dto.email?.trim() ?? centre.email,
    });

    try {
      const saved = await this.repo.save(centre);
      return this.toResponse(saved);
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY' || e?.driverError?.errno === 1062) {
        const msg = /email/i.test(e?.driverError?.sqlMessage || '')
          ? 'email déjà utilisé'
          : 'externalRef déjà utilisé';
        throw new ConflictException(msg);
      }
      throw e;
    }
  }

  // ---------------------------------------------------------------------------
  // remove(id)
  // ---------------------------------------------------------------------------
  async remove(id: number): Promise<{ success: boolean }> {
    const result = await this.repo.softDelete(id);
    if (result.affected === 0)
      throw new NotFoundException('Centre introuvable');
    return { success: true };
  }

  // ---------------------------------------------------------------------------
  // getMagasinsByCentre(centreId)
  // ---------------------------------------------------------------------------
  async getMagasinsByCentre(
    centreId: number,
  ): Promise<CentreWithMagasins> {
    const centre = await this.repo.findOne({
      where: { id: centreId },
      relations: ['magasins', 'magasins.collectes', 'magasins.collectes.collecte'],
    });

    if (!centre) throw new NotFoundException('Centre introuvable');

    return {
      ...this.toResponse(centre),
      magasins: centre.magasins ?? [],
    };
  }

  // ---------------------------------------------------------------------------
  // Méthodes internes (helpers)
  // ---------------------------------------------------------------------------

  private async findOneEntity(id: number): Promise<Centre> {
    const centre = await this.repo.findOne({ where: { id } });
    if (!centre) throw new NotFoundException('Centre introuvable');
    return centre;
  }

  private toResponse(entity: Centre): CentreResponse {
    return {
      id: entity.id,
      name: entity.name,
      address: entity.address,
      phone: entity.phone,
      email: entity.email,
      externalRef: entity.externalRef,
      createdAt: entity.createdAt?.toISOString(),
      updatedAt: entity.updatedAt?.toISOString(),
      deletedAt: entity.deletedAt ? entity.deletedAt.toISOString() : null,
    };
  }
}
