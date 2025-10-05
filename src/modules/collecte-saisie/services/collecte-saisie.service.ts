import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CollecteSaisie } from '../entities/collecte-saisie.entity';
import { CreateCollecteSaisieDto } from '../dto/create-collecte-saisie.dto';
import { Collecte } from 'src/modules/collecte/entities/collecte.entity';
import { CollecteMagasin } from 'src/modules/collecte/entities/collecte-magasin.entity';
import { Magasin } from 'src/modules/magasins/entities/magasin.entity';
import { Produit } from 'src/modules/produits/entities/produit.entity';

@Injectable()
export class CollecteSaisieService {
  constructor(
    @InjectRepository(CollecteSaisie)
    private readonly repo: Repository<CollecteSaisie>,
    @InjectRepository(CollecteMagasin)
    private readonly collecteMagasinRepo: Repository<CollecteMagasin>,
  ) {}

  async createSaisie(dto: CreateCollecteSaisieDto): Promise<CollecteSaisie> {
    const saisie = this.repo.create(dto);
    return await this.repo.save(saisie);
  }

  async getActiveCollecteIdForMagasinToday(magasinId: number): Promise<number> {
    const today = new Date();

    // 1. Cherche la collecte ouverte aujourd'hui
    const collecte = await this.repo.manager.getRepository(Collecte)
      .createQueryBuilder('collecte')
      .where('collecte.status = :status', { status: 'ACTIVE' })
      .andWhere('collecte.defaultStartAt <= :today', { today })
      .andWhere('collecte.defaultEndAt >= :today', { today })
      .getOne();

    if (!collecte) throw new Error('Aucune collecte ouverte aujourd\'hui');

    // 2. Vérifie que le magasin est actif pour cette collecte (sans startAt/endAt)
    const cm = await this.collecteMagasinRepo.createQueryBuilder('cm')
      .where('cm.magasinId = :magasinId', { magasinId })
      .andWhere('cm.collecteId = :collecteId', { collecteId: collecte.id })
      .andWhere('cm.enabled = true')
      .getOne();
      console.log({ collecteId: collecte.id, magasinId, cm });
    if (!cm) throw new Error('Ce magasin n\'est pas actif pour la collecte ouverte');

    return cm.collecteId;
  }

  async getCollecteById(id: number): Promise<Collecte | null> {
    return await this.repo.manager.getRepository(Collecte).findOne({ where: { id } });
  }

  async getMagasinById(id: number): Promise<Magasin | null> {
    return await this.repo.manager.getRepository(Magasin).findOne({ where: { id } });
  }

  async getSaisiesForCollecte(collecteId: number): Promise<CollecteSaisie[]> {
    return await this.repo.find({ where: { collecteId } });
  }

  async getSaisiesWithProduitForCollecte(collecteId: number): Promise<{ produit: Produit, poids: number }[]> {
    const saisies = await this.repo.find({ where: { collecteId } });

    // Récupère tous les produitId uniques
    const produitIds = [...new Set(saisies.map(s => s.produitId))];
    if (produitIds.length === 0) return [];

    // Charge tous les produits
    const produits = await this.repo.manager.getRepository(Produit).findByIds(produitIds);

    // Regroupe les poids par produitId
    return produits.map(produit => {
      const poidsTotal = saisies
        .filter(s => s.produitId === produit.id)
        .reduce((sum, s) => sum + s.poids, 0);

      return {
        produit,
        poids: poidsTotal
      };
    });
  }

  async getSaisiesWithProduitForCollecteAndMagasin(
    collecteId: number,
    magasinId: number,
    centreId?: number
  ): Promise<{ produit: Produit, poids: number }[]> {
    const where: any = { collecteId, magasinId };
    if (centreId) where.centreId = centreId;

    const saisies = await this.repo.find({ where });

    if (saisies.length === 0) return [];

    // Charge tous les produits concernés
    const produitIds = [...new Set(saisies.map(s => s.produitId))];
    const produits = await this.repo.manager.getRepository(Produit).findByIds(produitIds);

    // Retourne chaque saisie avec son produit et son poids
    return saisies.map(saisie => ({
      produit: produits.find(p => p.id === saisie.produitId)!,
      poids: saisie.poids
    }));
  }

  async getSaisiesLigneParLigne(
    collecteId: number,
    magasinId: number,
    centreId?: number
  ): Promise<any[]> {
    const qb = this.repo.createQueryBuilder('e')
      .innerJoin(Produit, 'p', 'p.id = e.produitId')
      .select('e.id', 'id')
      .addSelect('e.produitId', 'produitId')
      .addSelect('e.poids', 'poids')
      .addSelect('e.createdAt', 'date')
      .addSelect('p.gtin', 'gtin')
      .addSelect('p.family', 'family')
      .addSelect('p.subFamily', 'subFamily')
      .where('e.collecteId = :collecteId', { collecteId })
      .andWhere('e.magasinId = :magasinId', { magasinId })
      .orderBy('e.createdAt', 'DESC');

    if (centreId) qb.andWhere('e.centreId = :centreId', { centreId });

    const rows = await qb.getRawMany<{
      id: string; produitId: string; poids: string; date: Date | string;
      nom: string; gtin: string; family?: string; subFamily?: string;
    }>();

    return rows.map(r => ({
      id: Number(r.id),
      produitId: Number(r.produitId),
      poids: Number(r.poids),
      date: new Date(r.date),
      nom: r.nom,
      gtin: r.gtin,
      family: r.family ?? undefined,
      subFamily: r.subFamily ?? undefined,
    }));
  }
}