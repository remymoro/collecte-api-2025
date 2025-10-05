import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/modules/auth/jwt/jwt-auth.guard';
import { CollecteUtilisateurService } from '../services/collecte-utilisateur.service';
import { Magasin } from 'src/modules/magasins/entities/magasin.entity';

@UseGuards(JwtAuthGuard)
@Controller('collecte-utilisateurs')
export class CollecteUtilisateurController {
  constructor(
    private readonly service: CollecteUtilisateurService
  ) {}

  @Get('magasins-actifs')
  async getMagasinsActifs(@Req() req): Promise<Magasin[]> {
    const centreId = req.user.centreId;
    return await this.service.getActiveMagasinsForOpenCollecteToday(centreId);
  }
}