import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { Magasin } from '../entities/magasin.entity';
import { Centre } from '../../centres/entities/centre.entity';
import { CreateMagasinDto } from '../dto/create-magasin.dto';
import { UpdateMagasinDto } from '../dto/update-magasin.dto';
import { PaginationQuery } from 'src/shared/interfaces/pagination-query.interface';
import { CollecteMagasin } from 'src/modules/collecte/entities/collecte-magasin.entity';
import { FilesService } from '../../files/files.service';

// Extrait le blobName depuis une URL de type http://127.0.0.1:10000/devstoreaccount1/magasins/<blobName>



/**
 * MagasinsService
 * - Gestion CRUD des magasins (avec unicité adresse par centre)
 * - Gestion des collectes annuelles (activation, fenêtre, validation, bulk)
 */
@Injectable()
export class MagasinsService {
  constructor(
    @InjectRepository(Magasin) private readonly repo: Repository<Magasin>,
   @InjectRepository(CollecteMagasin) private readonly collecteMagasinRepo: Repository<CollecteMagasin>,
    @InjectRepository(Centre) private readonly centres: Repository<Centre>,
     private readonly files: FilesService, // ✅ ici
  ) {}


async findByCentrePaginated(centreId: number, query: PaginationQuery) {
  const page = query.page ?? 1;
  const limit = query.limit ?? 20;
  const [items, total] = await this.repo.findAndCount({
    where: { centre: { id: centreId } },
    relations: ['collectes', 'collectes.collecte'],
    skip: (page - 1) * limit,
    take: limit,
  });
  return { items, total, page, limit };
}
  /**
   * Vérifie qu'aucun autre magasin du même centre n'a déjà cette adresse.
   * excludeId permet d'ignorer l'enregistrement courant lors d'une mise à jour.
   */
  private async assertUniqueAddressInCentre(address: string, centreId: number, excludeId?: number) {
    const exists = await this.repo.exist({
      where: {
        address: address.trim().replace(/\s+/g, ' '),
        centre: { id: centreId },
        ...(excludeId ? { id: Not(excludeId) } : {}),
      },
    });
    if (exists) throw new ConflictException('Adresse déjà utilisée pour ce centre');
  }

  /**
   * Création d'un magasin rattaché à un centre donné.
   * Étapes:
   * 1. Vérif centre
   * 2. Vérif unicité adresse dans ce centre
   * 3. Normalisation adresse
   * 4. Sauvegarde + gestion doublon SQL (filet de sécurité)
   */
  async create(dto: CreateMagasinDto): Promise<Magasin> {
    const centre = await this.centres.findOne({ where: { id: dto.centreId } });
    if (!centre) throw new NotFoundException('Centre introuvable');

    await this.assertUniqueAddressInCentre(dto.address, dto.centreId);
    try {
      const entity = this.repo.create({
        ...dto,
        address: dto.address.trim().replace(/\s+/g, ' '),
        centre,
      });
      return await this.repo.save(entity);
    } catch (e: any) {
      if (e?.code === 'ER_DUP_ENTRY' || e?.driverError?.errno === 1062) {
        throw new ConflictException('Adresse déjà utilisée pour ce centre');
      }
      throw e;
    }
  }

  /**
   * Mise à jour d'un magasin.
   * - Rech. entité
   * - Vérif adresse (si modifiée)
   * - Normalisation
   * - Sauvegarde avec gestion des doublons
   */
  async update(id: number, dto: UpdateMagasinDto): Promise<Magasin | null> {
    const magasin = await this.repo.findOne({ where: { id } });
    if (!magasin) return null;

    // Vérifie unicité adresse si modifiée
    if (dto.address && dto.address.trim().replace(/\s+/g, ' ') !== magasin.address) {
      await this.assertUniqueAddressInCentre(dto.address, magasin.centre.id, id);
      magasin.address = dto.address.trim().replace(/\s+/g, ' ');
    }

    // Met à jour les autres champs
    if (dto.name) magasin.name = dto.name.trim().replace(/\s+/g, ' ');
    if (dto.phone) magasin.phone = dto.phone.trim();
    if (dto.email) magasin.email = dto.email.trim().toLowerCase();
    if (dto.externalRef) magasin.externalRef = dto.externalRef.trim();

    return await this.repo.save(magasin);
  }

  async findById(id: number): Promise<Magasin | null> {
    return this.repo.findOne({ where: { id }, relations: { centre: true } });
  }


async bulkToggleCollecte(
  magasinIds: number[],
  collecteId: number,
  enabled: boolean
): Promise<any[]> {
  await Promise.all(
    magasinIds.map(async magasinId => {
      let cm = await this.collecteMagasinRepo.findOne({
        where: {
          magasin: { id: magasinId },
          collecte: { id: collecteId },
        },
      });
      if (!cm) {
        // Création du lien si absent
        cm = this.collecteMagasinRepo.create({
          magasin: { id: magasinId },
          collecte: { id: collecteId },
          enabled,
        });
      } else {
        cm.enabled = enabled;
      }
      await this.collecteMagasinRepo.save(cm);
    })
  );
  // Retourne la liste des magasins avec leurs collectes à jour
  return this.repo.find({
    where: { id: In(magasinIds) },
    relations: ['collectes', 'collectes.collecte'],
  });
}

 async uploadMagasinImage(id: number, file: Express.Multer.File): Promise<Magasin> {
  const magasin = await this.repo.findOneByOrFail({ id });
  const { url, blobName } = await this.files.uploadImage(file);
  magasin.imageUrl = url;
  magasin.blobName = blobName; // <-- stocke le nom du blob
  return this.repo.save(magasin);
}

  
}