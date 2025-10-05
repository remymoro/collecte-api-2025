import { Controller, Post, Body, UseGuards, Req, Param, Get, ForbiddenException } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt/jwt-auth.guard';
import { CollecteSaisieService } from '../services/collecte-saisie.service';
import { CreateCollecteSaisieDto } from '../dto/create-collecte-saisie.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Magasin } from 'src/modules/magasins/entities/magasin.entity';
import { Repository } from 'typeorm';

@UseGuards(JwtAuthGuard)
@Controller('collecte-saisie')
export class CollecteSaisieController {
  constructor(
    private readonly service: CollecteSaisieService,
    @InjectRepository(Magasin)
    private readonly magasinRepo: Repository<Magasin>,
  ) {}

  @Post('saisie/:magasinId')
  async createSaisie(
    @Param('magasinId') magasinId: number,
    @Body() dto: Omit<CreateCollecteSaisieDto, 'collecteId' | 'magasinId' | 'centreId'>,
    @Req() req
  ) {
    const centreId = req.user.centreId;
    const magasin = await this.magasinRepo.findOne({ where: { id: magasinId } });
    if (!magasin || magasin.centreId !== centreId) {
      throw new ForbiddenException('Accès interdit à ce magasin');
    }
    const collecteId = await this.service.getActiveCollecteIdForMagasinToday(magasinId);
    return await this.service.createSaisie({
      ...dto,
      collecteId,
      magasinId,
      centreId
    });
  }

  @Get('infos/:magasinId')
  async getInfosAvantSaisie(
    @Param('magasinId') magasinId: number,
    @Req() req
  ) {
    const centreId = req.user.centreId;
    const magasin = await this.magasinRepo.findOne({ where: { id: magasinId } });
    if (!magasin || magasin.centreId !== centreId) {
      throw new ForbiddenException('Accès interdit à ce magasin');
    }
    const collecteId = await this.service.getActiveCollecteIdForMagasinToday(magasinId);

    const collecte = await this.service.getCollecteById(collecteId);
    // Utilise magasin déjà chargé
    return {
      collecteId,
      collecteNom: collecte?.title,
      magasinId,
      magasinNom: magasin?.name,
      magasinAdress: magasin?.address,
      centreId
    };
  }

  @Get('produits-collecte/:collecteId')
  async getProduitsForCollecte(@Param('collecteId') collecteId: number) {
    return await this.service.getSaisiesWithProduitForCollecte(collecteId);
  }

  @Get('produits-magasin/:collecteId/:magasinId')
  async getProduitsForCollecteAndMagasin(
    @Param('collecteId') collecteId: number,
    @Param('magasinId') magasinId: number,
    @Req() req
  ) {
    const centreId = req.user.centreId;
    const magasin = await this.magasinRepo.findOne({ where: { id: magasinId } });
    if (!magasin || magasin.centreId !== centreId) {
      throw new ForbiddenException('Accès interdit à ce magasin');
    }
    return await this.service.getSaisiesWithProduitForCollecteAndMagasin(collecteId, magasinId, centreId);
  }

  @Get('saisies-ligne/:collecteId/:magasinId')
  async getSaisiesLigneParLigne(
    @Param('collecteId') collecteId: number,
    @Param('magasinId') magasinId: number,
    @Req() req
  ) {
    const centreId = req.user.centreId;
    const magasin = await this.magasinRepo.findOne({ where: { id: magasinId } });
    if (!magasin || magasin.centreId !== centreId) {
      throw new ForbiddenException('Accès interdit à ce magasin');
    }
    return await this.service.getSaisiesLigneParLigne(collecteId, magasinId, centreId);
  }
}