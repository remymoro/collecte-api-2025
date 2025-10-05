// src/modules/centres/services/centres.service.spec.ts
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { CentresService } from './centres.service';
import { Centre } from '../entities/centre.entity';
import { Magasin } from '../../magasins/entities/magasin.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { createRepoMock } from '../../../../test/utils/typeorm-repo.mock';
import { makeCentre } from '../../../../test/factories/centre.factory';

describe('CentresService', () => {
  let service: CentresService;
  const centreRepo = createRepoMock<Centre>();
  const magasinRepo = createRepoMock<Magasin>();

  beforeEach(async () => {
    // important: reset implémentations + appels
    jest.resetAllMocks();

    const module = await Test.createTestingModule({
      providers: [
        CentresService,
        { provide: getRepositoryToken(Centre), useValue: centreRepo },
        { provide: getRepositoryToken(Magasin), useValue: magasinRepo },
      ],
    }).compile();

    service = module.get(CentresService);
  });

  // ---------------------------------------------------------------------------
  // create()
  // ---------------------------------------------------------------------------
  it('create(): crée un centre et trim les champs', async () => {
    // pas de conflit (quel que soit le champ vérifié)
    centreRepo.exist.mockResolvedValue(false);

    const dto = {
      name: '  Centre Agen  ',
      address: '  97 rue  ',
      phone: ' 0700 ',
      email: '  mail@ex.fr ',
      externalRef: '  EXT-1 ',
    };
    const entity = makeCentre({ ...dto });
    centreRepo.create.mockReturnValue(entity);
    centreRepo.save.mockResolvedValue({
      ...entity,
      email: 'mail@ex.fr',
      externalRef: 'EXT-1',
    });

    const res = await service.create(dto as any);

    expect(centreRepo.create).toHaveBeenCalled();
    expect(centreRepo.save).toHaveBeenCalled();
    expect(res.email).toBe('mail@ex.fr');
    expect(res.externalRef).toBe('EXT-1');
  });

  it('create(): refuse externalRef dupliquée', async () => {
    // DTO contient externalRef → 1 appel à exist() pour externalRef
    centreRepo.exist.mockResolvedValueOnce(true);

    await expect(
      service.create({ name: 'a', address: 'b', externalRef: 'X' } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('create(): refuse email dupliqué', async () => {
    // DTO contient email (pas externalRef) → 1 appel pour email
    centreRepo.exist.mockResolvedValueOnce(true);

    await expect(
      service.create({ name: 'a', address: 'b', email: 'x@x.fr' } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  it('create(): mappe ER_DUP_ENTRY (1062) en ConflictException', async () => {
    centreRepo.exist.mockResolvedValue(false);
    const entity = makeCentre();
    centreRepo.create.mockReturnValue(entity);
    centreRepo.save.mockRejectedValue({
      code: 'ER_DUP_ENTRY',
      driverError: { errno: 1062, sqlMessage: 'Duplicate entry ... email' },
    });

    await expect(
      service.create({ name: 'A', address: 'B', email: 'x@x.fr' } as any),
    ).rejects.toBeInstanceOf(ConflictException);
  });

  // ---------------------------------------------------------------------------
  // findAll()
  // ---------------------------------------------------------------------------
  it('findAll(): retourne pagination mappée', async () => {
    const items = [makeCentre({ id: 1 }), makeCentre({ id: 2 })];
    centreRepo.findAndCount.mockResolvedValue([items, 2]);

    const res = await service.findAll({ page: 2, limit: 10 });

    expect(centreRepo.findAndCount).toHaveBeenCalledWith({
      skip: 10,
      take: 10,
      order: { name: 'ASC' },
    });
    expect(res.total).toBe(2);
    expect(res.page).toBe(2);
    expect(res.items).toHaveLength(2);
    expect(res.items[0]).toMatchObject({ id: 1, name: expect.any(String) });
    // on n'expose pas magasins dans la response simple
    expect((res.items[0] as any).magasins).toBeUndefined();
  });

  // ---------------------------------------------------------------------------
  // findAllSimple()
  // ---------------------------------------------------------------------------
  it('findAllSimple(): liste triée par nom', async () => {
    centreRepo.find.mockResolvedValue([makeCentre({ id: 3 })]);

    const res = await service.findAllSimple();

    expect(centreRepo.find).toHaveBeenCalledWith({ order: { name: 'ASC' } });
    expect(res).toHaveLength(1);
    expect(res[0].id).toBe(3);
  });

  // ---------------------------------------------------------------------------
  // findOne()
  // ---------------------------------------------------------------------------
  it('findOne(): OK', async () => {
    centreRepo.findOne.mockResolvedValue(makeCentre({ id: 9 }));

    const res = await service.findOne(9);

    expect(res.id).toBe(9);
  });

  it('findOne(): NotFound', async () => {
    centreRepo.findOne.mockResolvedValue(null);

    await expect(service.findOne(999)).rejects.toBeInstanceOf(NotFoundException);
  });

  it('findOne(): createdAt/updatedAt en ISO, deletedAt null', async () => {
    const d = new Date('2025-01-01T10:20:30.000Z');
    centreRepo.findOne.mockResolvedValue(
      makeCentre({ id: 5, createdAt: d, updatedAt: d, deletedAt: null }),
    );

    const res = await service.findOne(5);

    expect(res.createdAt).toBe(d.toISOString());
    expect(res.updatedAt).toBe(d.toISOString());
    expect(res.deletedAt).toBeNull();
  });

  // ---------------------------------------------------------------------------
  // update()
  // ---------------------------------------------------------------------------
  it('update(): met à jour + trim + unicité OK', async () => {
    centreRepo.findOne.mockResolvedValue(
      makeCentre({ id: 1, email: 'old@x.fr', externalRef: 'OLD' }),
    );
    // DTO contient externalRef + email → 2 appels à exist()
    centreRepo.exist
      .mockResolvedValueOnce(false) // externalRef OK
      .mockResolvedValueOnce(false); // email OK
    centreRepo.save.mockResolvedValue(
      makeCentre({ id: 1, email: 'new@x.fr', externalRef: 'NEW' }),
    );

    const res = await service.update(1, {
      email: '  new@x.fr ',
      externalRef: ' NEW ',
    });

    expect(centreRepo.save).toHaveBeenCalled();
    expect(res.email).toBe('new@x.fr');
    expect(res.externalRef).toBe('NEW');
  });

  it('update(): NotFound si entité absente', async () => {
    centreRepo.findOne.mockResolvedValue(null);

    await expect(service.update(1, { name: 'x' })).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });

  it('update(): conflit email', async () => {
    centreRepo.findOne.mockResolvedValue(makeCentre({ id: 1 }));
    // DTO ne contient que email → 1 appel à exist()
    centreRepo.exist.mockResolvedValueOnce(true); // email déjà utilisé

    await expect(service.update(1, { email: 'dup@x.fr' })).rejects.toBeInstanceOf(
      ConflictException,
    );
  });

  // ---------------------------------------------------------------------------
  // remove()
  // ---------------------------------------------------------------------------
  it('remove(): soft delete OK', async () => {
    (centreRepo.softDelete as jest.Mock).mockResolvedValue({ affected: 1 }); // suppression OK

    const res = await service.remove(1);

    expect(centreRepo.softDelete).toHaveBeenCalledWith(1);
    expect(res).toEqual({ success: true });
  });

  // ---------------------------------------------------------------------------
  // Teste le cas où la suppression douce (soft delete) ne trouve aucune entité à supprimer
  it('remove(): NotFound si affected=0', async () => {
    // On simule que la suppression n'a affecté aucune ligne (entité non trouvée)
    centreRepo.softDelete.mockResolvedValue({ affected: 0 });

    // On attend que le service lève une exception NotFoundException
    await expect(service.remove(1)).rejects.toBeInstanceOf(NotFoundException);
  });

  // ---------------------------------------------------------------------------
  // getMagasinsByCentre()
  // ---------------------------------------------------------------------------
  it('getMagasinsByCentre(): charge relations et renvoie magasins', async () => {
    const centre = makeCentre({ id: 1 });
    (centre as any).magasins = [{ id: 10 }, { id: 11 }] as any;
    centreRepo.findOne.mockResolvedValue(centre);

    const res = await service.getMagasinsByCentre(1);

    expect(centreRepo.findOne).toHaveBeenCalledWith({
      where: { id: 1 },
      relations: [
        'magasins',
        'magasins.collectes',
        'magasins.collectes.collecte',
      ],
    });
    expect(res.id).toBe(1);
    expect(res.magasins).toHaveLength(2);
  });

  it('getMagasinsByCentre(): NotFound', async () => {
    centreRepo.findOne.mockResolvedValue(null);

    await expect(
      service.getMagasinsByCentre(999),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
