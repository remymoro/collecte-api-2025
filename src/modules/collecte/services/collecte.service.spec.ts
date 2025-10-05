import 'reflect-metadata';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CollecteService } from './collecte.service';
import { Collecte } from '../entities/collecte.entity';
import { createRepoMock, RepoMock } from '../../../../test/utils/typeorm-repo.mock';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { CollecteStatus } from '../enums/collecte-status.enum';

// Petit helper pour fabriquer une collecte rapidement
const makeCollecte = (over: Partial<Collecte> = {}): Collecte => ({
  id: over.id ?? 1,
  year: over.year ?? 2025,
  title: over.title ?? 'Collecte 2025',
  slug: over.slug ?? 'collecte-2025',
  defaultStartAt: over.defaultStartAt ?? null,
  defaultEndAt: over.defaultEndAt ?? null,
  graceUntil: over.graceUntil ?? null,
  lockedAt: over.lockedAt ?? null,
  status: over.status ?? CollecteStatus.DRAFT,
  createdAt: over.createdAt ?? new Date('2025-10-01T00:00:00.000Z'),
  updatedAt: over.updatedAt ?? new Date('2025-10-01T00:00:00.000Z'),
  deletedAt: over.deletedAt ?? null,
});

describe('CollecteService', () => {
  let service: CollecteService;
  let repo: RepoMock<Collecte>;

  // On fige "maintenant" pour des tests temporels stables
  const NOW = new Date('2025-10-05T10:00:00.000Z');

  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(NOW);
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(async () => {
    repo = createRepoMock<Collecte>();

    const module = await Test.createTestingModule({
      providers: [
        CollecteService,
        { provide: getRepositoryToken(Collecte), useValue: repo },
      ],
    }).compile();

    service = module.get(CollecteService);
    jest.clearAllMocks();
  });

  // ----------------- computeStatus (via toDto) -----------------

  it('status = DRAFT quand pas de dates', async () => {
    const c = makeCollecte({ defaultStartAt: null, defaultEndAt: null, status: CollecteStatus.DRAFT });
    repo.find.mockResolvedValue([c]);

    const [dto] = await service.findAll();
    expect(dto.status).toBe(CollecteStatus.DRAFT);
  });

  it('status = SCHEDULED avant defaultStartAt', async () => {
    const c = makeCollecte({
      defaultStartAt: new Date('2025-10-10T00:00:00.000Z'),
      defaultEndAt:   new Date('2025-10-12T00:00:00.000Z'),
      status: CollecteStatus.SCHEDULED,
    });
    repo.find.mockResolvedValue([c]);

    const [dto] = await service.findAll();
    expect(dto.status).toBe(CollecteStatus.SCHEDULED);
  });

  it('status = ACTIVE entre start et end', async () => {
    const c = makeCollecte({
      defaultStartAt: new Date('2025-10-04T00:00:00.000Z'),
      defaultEndAt:   new Date('2025-10-06T23:59:59.000Z'),
    });
    repo.find.mockResolvedValue([c]);

    const [dto] = await service.findAll();
    expect(dto.status).toBe(CollecteStatus.ACTIVE);
  });

  it('status = CLOSED après end mais avant graceUntil', async () => {
    const c = makeCollecte({
      defaultStartAt: new Date('2025-10-01T00:00:00.000Z'),
      defaultEndAt:   new Date('2025-10-02T00:00:00.000Z'),
      graceUntil:     new Date('2025-10-10T00:00:00.000Z'),
    });
    repo.find.mockResolvedValue([c]);

    const [dto] = await service.findAll();
    expect(dto.status).toBe(CollecteStatus.CLOSED);
  });

  it('status = ARCHIVED après graceUntil', async () => {
    const c = makeCollecte({
      defaultStartAt: new Date('2025-09-01T00:00:00.000Z'),
      defaultEndAt:   new Date('2025-09-02T00:00:00.000Z'),
      graceUntil:     new Date('2025-09-10T00:00:00.000Z'),
    });
    repo.find.mockResolvedValue([c]);

    const [dto] = await service.findAll();
    expect(dto.status).toBe(CollecteStatus.ARCHIVED);
  });

  it('status = ARCHIVED si deletedAt non nul', async () => {
    const c = makeCollecte({
      defaultStartAt: new Date('2025-10-01T00:00:00.000Z'),
      defaultEndAt:   new Date('2025-10-02T00:00:00.000Z'),
      deletedAt:      new Date('2025-10-03T00:00:00.000Z'),
    });
    repo.find.mockResolvedValue([c]);

    const [dto] = await service.findAll();
    expect(dto.status).toBe(CollecteStatus.ARCHIVED);
  });

  // ----------------- create -----------------

  it('create: lève ConflictException si year déjà existant', async () => {
    repo.findOne.mockResolvedValue(makeCollecte({ year: 2025 }));

    await expect(
      service.create({ year: 2025 }),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('create: succès et retourne un DTO', async () => {
    repo.findOne.mockResolvedValue(null);
    repo.create.mockImplementation((x) => makeCollecte(x));
    repo.save.mockImplementation(async (x) => ({ ...x, id: 42 }));

    const dto = await service.create({
      year: 2026,
      defaultStartAt: new Date('2026-03-01T00:00:00.000Z') as any,
      defaultEndAt:   new Date('2026-03-03T00:00:00.000Z') as any,
    });

    expect(dto.id).toBe(42);
    expect(dto.year).toBe(2026);
    expect(dto.defaultStartAt).toBe('2026-03-01T00:00:00.000Z');
    expect(dto.status).toBeDefined();
  });

  // ----------------- findById -----------------

  it('findById: not found -> NotFoundException', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.findById(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findById: renvoie le DTO transformé', async () => {
    const c = makeCollecte({
      id: 10,
      defaultStartAt: new Date('2025-10-04T00:00:00.000Z'),
      defaultEndAt:   new Date('2025-10-06T23:59:59.000Z'),
    });
    repo.findOne.mockResolvedValue(c);

    const dto = await service.findById(10);
    expect(dto.id).toBe(10);
    expect(dto.status).toBe(CollecteStatus.ACTIVE);
  });

  // ----------------- findAllPaginated -----------------

  it('findAllPaginated: renvoie items + total + page/limit', async () => {
    const c1 = makeCollecte({ id: 1 });
    const c2 = makeCollecte({ id: 2 });

    repo.findAndCount.mockResolvedValue([[c1, c2], 2]);

    const res = await service.findAllPaginated({ page: 1, limit: 20 });
    expect(res.total).toBe(2);
    expect(res.items).toHaveLength(2);
    expect(res.items[0].id).toBe(1);
  });

  // ----------------- update -----------------

  it('update: not found -> NotFoundException', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.update(99, { title: 'x' })).rejects.toBeInstanceOf(NotFoundException);
  });

  it('update: met à jour et renvoie DTO', async () => {
    const existing = makeCollecte({ id: 5, title: 'Old' });
    repo.findOne.mockResolvedValue(existing);
    repo.save.mockImplementation(async (x) => ({ ...existing, ...x, updatedAt: NOW }));

    const dto = await service.update(5, { title: 'New' });
    expect(dto.id).toBe(5);
    expect(dto.title).toBe('New');
  });

  // ----------------- remove (soft) -----------------

  it('remove: not found -> NotFoundException', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('remove: softRemove appelé et renvoie true', async () => {
    const existing = makeCollecte({ id: 7 });
    repo.findOne.mockResolvedValue(existing);
    repo.softRemove.mockResolvedValue(existing);

    const ok = await service.remove(7);
    expect(ok).toBe(true);
    expect(repo.softRemove).toHaveBeenCalledWith(existing);
  });

  // ----------------- updateAllStatuses (cron) -----------------

  it('updateAllStatuses: met à jour si status change', async () => {
    const active = makeCollecte({
      id: 1,
      defaultStartAt: new Date('2025-10-04T00:00:00.000Z'),
      defaultEndAt:   new Date('2025-10-06T23:59:59.000Z'),
      status: CollecteStatus.SCHEDULED, // devrait passer à ACTIVE
    });
    const draft = makeCollecte({
      id: 2,
      defaultStartAt: null,
      defaultEndAt: null,
      status: CollecteStatus.DRAFT, // ne bougera pas
    });

    repo.find.mockResolvedValue([active, draft]);
    repo.save.mockImplementation(async (x) => x);

    const updated = await service.updateAllStatuses();
    expect(updated).toBe(1); // seule la 1 change
  });
});
