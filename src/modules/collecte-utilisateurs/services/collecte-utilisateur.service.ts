import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Magasin } from 'src/modules/magasins/entities/magasin.entity';
import { Collecte } from 'src/modules/collecte/entities/collecte.entity';

@Injectable()
export class CollecteUtilisateurService {
  constructor(
    @InjectRepository(Magasin)
    private readonly magasinRepo: Repository<Magasin>,
    @InjectRepository(Collecte)
    private readonly collecteRepo: Repository<Collecte>,
  ) {}

  async getActiveMagasinsForOpenCollecteToday(centreId: number): Promise<Magasin[]> {
    // 1. Cherche la collecte ouverte pour ce centre et la date du jour
    const today = new Date();
    const collecte = await this.collecteRepo.createQueryBuilder('collecte')
      .where('collecte.status = :status', { status: 'ACTIVE' })
      .andWhere('collecte.defaultStartAt <= :today', { today })
      .andWhere('collecte.defaultEndAt >= :today', { today })
      .getOne();

    if (!collecte) throw new NotFoundException('Aucune collecte ouverte actuellement');

    // 2. Retourne les magasins actifs pour cette collecte et ce centre
    return this.magasinRepo
      .createQueryBuilder('magasin')
      .innerJoin('magasin.collectes', 'cm', 'cm.collecteId = :collecteId AND cm.enabled = true', { collecteId: collecte.id })
      .where('magasin.centreId = :centreId', { centreId })
      .getMany();
  }
}