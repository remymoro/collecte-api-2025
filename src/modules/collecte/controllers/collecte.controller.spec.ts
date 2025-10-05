import { Test } from '@nestjs/testing';
import { INestApplication, CanActivate, ExecutionContext } from '@nestjs/common';
import request from 'supertest';
import { CollecteController } from './collecte.controller';
import { CollecteStatus } from '../enums/collecte-status.enum';
import { CollecteService } from '../services/collecte.service';
import { RolesGuard } from 'src/modules/auth/guards/roles.guard';
import { JwtAuthGuard } from 'src/modules/auth/jwt/jwt-auth.guard';

class AllowGuard implements CanActivate {
  canActivate(_ctx: ExecutionContext) { return true; }
}

describe('CollectesController (e2e light)', () => {
  let app: INestApplication;

  const serviceMock = {
    findById: jest.fn().mockResolvedValue({
      id: 12, year: 2025, status: CollecteStatus.ACTIVE,
      title: 'c', slug: 's',
      defaultStartAt: null, defaultEndAt: null,
      graceUntil: null, lockedAt: null,
      createdAt: '2025-10-05T08:48:00.000Z',
      updatedAt: '2025-10-05T08:48:00.000Z',
      deletedAt: null,
    }),
  };

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [CollecteController],
      providers: [{ provide: CollecteService, useValue: serviceMock }],
    })
      // Remplacement des guards globaux du contrôleur
      .overrideGuard((CollecteController as any))
      .useValue(new AllowGuard())
      .overrideGuard(JwtAuthGuard)
      .useValue(new AllowGuard())
      .overrideGuard(RolesGuard)
      .useValue(new AllowGuard())
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /collectes/12 → 200 et id=12 (ParseIntPipe OK)', async () => {
    await request(app.getHttpServer())
      .get('/collectes/12')
      .expect(200)
      .expect((res) => {
        expect(res.body.id).toBe(12);
      });
  });
});
