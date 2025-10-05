import {
  Injectable,
  Logger,
  InternalServerErrorException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collecte } from '../entities/collecte.entity';
import { CreateCollecteDto } from '../dto/create-collecte.dto';
import { CollecteResponseDto } from '../dto/collecte-response.dto';
import { PaginationQuery } from 'src/shared/interfaces/pagination-query.interface';
import { PaginationResult } from 'src/shared/interfaces/pagination-result.interface';
import { CollecteStatus } from '../enums/collecte-status.enum';
import { Cron, CronExpression } from '@nestjs/schedule';

@Injectable()
export class CollecteService {
  private readonly logger = new Logger(CollecteService.name);

  constructor(
    @InjectRepository(Collecte)
    private readonly repo: Repository<Collecte>,
  ) {}

  // Transforme une entité Collecte en DTO pour la réponse API, en recalculant le statut
  private toDto(c: Collecte): CollecteResponseDto {
    const computedStatus = this.computeStatus(c);
    return {
      id: c.id,
      year: c.year,
      title: c.title,
      slug: c.slug,
      defaultStartAt: c.defaultStartAt?.toISOString() ?? null,
      defaultEndAt: c.defaultEndAt?.toISOString() ?? null,
      graceUntil: c.graceUntil?.toISOString() ?? null,
      lockedAt: c.lockedAt?.toISOString() ?? null,
      status: computedStatus,
      createdAt: c.createdAt?.toISOString() ?? '',
      updatedAt: c.updatedAt?.toISOString() ?? '',
      deletedAt: c.deletedAt?.toISOString() ?? null,
    };
  }

  // Calcule le statut métier d'une collecte selon ses dates et son état
  private computeStatus(c: Collecte): CollecteStatus {
    const now = new Date();

    // 1️⃣ Archivée si soft delete
    if (c.deletedAt) return CollecteStatus.ARCHIVED;
    // 2️⃣ Brouillon si dates manquantes
    if (!c.defaultStartAt || !c.defaultEndAt) return CollecteStatus.DRAFT;
    // 3️⃣ Programmée si pas encore commencée
    if (now < c.defaultStartAt) return CollecteStatus.SCHEDULED;
    // 4️⃣ Active si en cours
    if (now >= c.defaultStartAt && now <= c.defaultEndAt) return CollecteStatus.ACTIVE;
    // 5️⃣ Fermée si terminée mais encore dans la période de grâce
    if (c.graceUntil && now > c.defaultEndAt && now <= c.graceUntil) return CollecteStatus.CLOSED;
    // 6️⃣ Archivée si totalement passée
    if (now > (c.graceUntil ?? c.defaultEndAt)) return CollecteStatus.ARCHIVED;
    // Fallback : statut courant ou brouillon
    return c.status ?? CollecteStatus.DRAFT;
  }

  // Crée une nouvelle collecte après vérification de l'unicité de l'année
  async create(dto: CreateCollecteDto): Promise<CollecteResponseDto> {
    try {
      // Vérifie qu'il n'existe pas déjà une collecte pour cette année
      const existing = await this.repo.findOne({ where: { year: dto.year } });
      if (existing) {
        throw new ConflictException(`Une collecte pour ${dto.year} existe déjà.`);
      }
      // Prépare l'entité à sauvegarder
      const collecte = this.repo.create({
        ...dto,
        title: dto.title ?? `Collecte ${dto.year}`,
        slug: dto.slug ?? `collecte-${dto.year}`,
        defaultStartAt: dto.defaultStartAt ? new Date(dto.defaultStartAt) : null,
        defaultEndAt: dto.defaultEndAt ? new Date(dto.defaultEndAt) : null,
        graceUntil: dto.graceUntil ? new Date(dto.graceUntil) : null,
        lockedAt: dto.lockedAt ? new Date(dto.lockedAt) : null,
      });
      // Sauvegarde en base et retourne le DTO
      const saved = await this.repo.save(collecte);
      return this.toDto(saved);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error(`Erreur lors de la création d'une collecte: ${error.message}`);
      throw new InternalServerErrorException('Erreur lors de la création de la collecte.');
    }
  }

  // Retourne toutes les collectes triées par année décroissante
  async findAll(): Promise<CollecteResponseDto[]> {
    try {
      const rows = await this.repo.find({ order: { year: 'DESC' } });
      return rows.map((c) => this.toDto(c));
    } catch (error) {
      this.logger.error('Erreur lors du chargement des collectes', error.stack);
      throw new InternalServerErrorException('Erreur interne serveur.');
    }
  }

  // Retourne les collectes paginées selon la query (page, limit, tri)
  async findAllPaginated(query: PaginationQuery): Promise<PaginationResult<CollecteResponseDto>> {
    const page = Number(query.page) || 1;
    const limit = Number(query.limit) || 20;
    try {
      const [rows, total] = await this.repo.findAndCount({
        skip: (page - 1) * limit,
        take: limit,
        order: query.sort ? { [query.sort]: query.order ?? 'ASC' } : { year: 'DESC' },
      });
      return {
        items: rows.map((c) => this.toDto(c)),
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error('Erreur lors de la pagination des collectes', error.stack);
      throw new InternalServerErrorException('Erreur serveur lors de la pagination.');
    }
  }

  // Retourne une collecte par son id, ou lève une erreur si non trouvée
  async findById(id: number): Promise<CollecteResponseDto> {
    const c = await this.repo.findOne({ where: { id } });
    if (!c) throw new NotFoundException(`Collecte ${id} introuvable.`);
    return this.toDto(c);
  }

  // Met à jour une collecte existante (partiellement), ou lève une erreur si non trouvée
  async update(id: number, dto: Partial<CreateCollecteDto>): Promise<CollecteResponseDto> {
    const collecte = await this.repo.findOne({ where: { id } });
    if (!collecte) throw new NotFoundException(`Collecte ${id} introuvable.`);
    Object.assign(collecte, {
      ...dto,
      defaultStartAt: dto.defaultStartAt ? new Date(dto.defaultStartAt) : collecte.defaultStartAt,
      defaultEndAt: dto.defaultEndAt ? new Date(dto.defaultEndAt) : collecte.defaultEndAt,
      graceUntil: dto.graceUntil ? new Date(dto.graceUntil) : collecte.graceUntil,
      lockedAt: dto.lockedAt ? new Date(dto.lockedAt) : collecte.lockedAt,
    });
    const saved = await this.repo.save(collecte);
    return this.toDto(saved);
  }

  // Suppression douce d'une collecte (soft delete)
  async remove(id: number): Promise<boolean> {
    const collecte = await this.repo.findOne({ where: { id } });
    if (!collecte) throw new NotFoundException(`Collecte ${id} introuvable.`);
    await this.repo.softRemove(collecte); // Suppression logique (soft delete)
    return true;
  }

  /**
   * Met à jour le champ status de toutes les collectes si besoin.
   * Parcourt toutes les collectes, recalcule leur statut métier,
   * et sauvegarde en base si le statut a changé.
   * Retourne le nombre de collectes modifiées.
   */
  async updateAllStatuses(): Promise<number> {
    const rows = await this.repo.find();
    let updated = 0;
    for (const collecte of rows) {
      const newStatus = this.computeStatus(collecte);
      if (collecte.status !== newStatus) {
        collecte.status = newStatus;
        await this.repo.save(collecte);
        updated++;
      }
    }
    return updated; // Nombre de collectes mises à jour
  }

  /**
   * Tâche cron automatique : met à jour les statuts tous les jours à minuit.
   * Permet de garder le champ status cohérent avec les dates et la logique métier.
   */
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleCronUpdateStatuses() {
    await this.updateAllStatuses();
    this.logger.log('Statuts des collectes mis à jour automatiquement');
  }
}
