import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MagasinsService } from './magasins.service';
import { Magasin } from '../entities/magasin.entity';
import { CollecteMagasin } from 'src/modules/collecte/entities/collecte-magasin.entity';
import { Centre } from 'src/modules/centres/entities/centre.entity';
import { NotFoundException } from '@nestjs/common';
import { FilesService } from '../../files/files.service'; // Ajoute cet import

// --- util local simple si tu n'as pas createRepoMock ---
// const createRepoMock = <T extends object>() => ({
//   findAndCount: jest.fn(),
//   exist: jest.fn(),
//   create: jest.fn(),
//   save: jest.fn(),
//   findOne: jest.fn(),
//   findOneByOrFail: jest.fn(),
//   find: jest.fn(),
// });

/** Si tu as déjà un util: décommente cette ligne et supprime celui ci-dessus */
// import { createRepoMock } from '../../../../../test/utils/typeorm-repo.mock';

describe('MagasinsService', () => {
  let service: MagasinsService;
  let magasinRepo: jest.Mocked<Repository<Magasin>>;
  let collecteMagasinRepo: jest.Mocked<Repository<CollecteMagasin>>;
  let centreRepo: jest.Mocked<Repository<Centre>>;
  const filesService = {
    uploadImage: jest.fn(),
    deleteByBlobName: jest.fn(),
    getBlobSasUrl: jest.fn(),
    // helper éventuel si tu l'as dans FilesService
    getBlobNameFromUrl: jest.fn(),
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MagasinsService,
        { provide: getRepositoryToken(Magasin), useValue: {
          findAndCount: jest.fn(),
          exist: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
          findOne: jest.fn(),
          findOneByOrFail: jest.fn(),
          find: jest.fn(),
        }},
        { provide: getRepositoryToken(CollecteMagasin), useValue: {
          findOne: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
        }},
        { provide: getRepositoryToken(Centre), useValue: {
          findOne: jest.fn(),
        }},
        { provide: FilesService, useValue: filesService }, // <-- Utilise la classe ici !
      ],
    })
    // 💡 NOTE: ton Service injecte FilesService via `private readonly files: FilesService`
    // Pour faire marcher l'injection avec le bon token, remplace la ligne ci-dessus par:
    // { provide: FilesService, useValue: filesService }
    // ...et n'oublie pas d'importer FilesService du bon chemin:
    // import { FilesService } from '../../files/files.service';
    .compile();

    service = moduleRef.get(MagasinsService);
    magasinRepo = moduleRef.get(getRepositoryToken(Magasin));
    collecteMagasinRepo = moduleRef.get(getRepositoryToken(CollecteMagasin));
    centreRepo = moduleRef.get(getRepositoryToken(Centre));
  });

  afterEach(() => jest.clearAllMocks());

  // ---------------------------------------------------------------------------
  // Upload d'image
  // ---------------------------------------------------------------------------
  it('uploadMagasinImage - met à jour imageUrl + blobName', async () => {
    const m: Magasin = { id: 1, name: 'X', address: 'A', centreId: 10 } as any;

    magasinRepo.findOneByOrFail.mockResolvedValue(m);
    filesService.uploadImage.mockResolvedValue({
      url: 'http://127.0.0.1:10000/devstoreaccount1/magasins/uuid-x.png',
      blobName: 'uuid-x.png',
    } as any);
    magasinRepo.save.mockImplementation(async (arg) => arg as Magasin);

    const fakeFile = {
      buffer: Buffer.from('img'),
      mimetype: 'image/png',
      originalname: 'x.png',
    } as any;

    const res = await service.uploadMagasinImage(1, fakeFile);

    expect(magasinRepo.findOneByOrFail).toHaveBeenCalledWith({ id: 1 });
    expect(filesService.uploadImage).toHaveBeenCalledWith(fakeFile);
    expect(magasinRepo.save).toHaveBeenCalledWith(expect.objectContaining({
      imageUrl: expect.stringContaining('/magasins/'),
      blobName: 'uuid-x.png',
    }));
    expect(res.imageUrl).toBeDefined();
    expect(res.blobName).toBe('uuid-x.png');
  });

  it('uploadMagasinImage - NotFound si magasin absent', async () => {
    magasinRepo.findOneByOrFail.mockRejectedValue(new Error('not found'));

    const fakeFile = { buffer: Buffer.from('x'), mimetype: 'image/png', originalname: 'x.png' } as any;

    await expect(service.uploadMagasinImage(999, fakeFile)).rejects.toThrow();
    expect(filesService.uploadImage).not.toHaveBeenCalled();
  });

  // ---------------------------------------------------------------------------
  // Pagination par centre
  // ---------------------------------------------------------------------------
  it('findByCentrePaginated - renvoie items + total + meta', async () => {
    const items: Magasin[] = [
      { id: 1, name: 'M1', address: 'A', centreId: 2 } as any,
      { id: 2, name: 'M2', address: 'B', centreId: 2 } as any,
    ];
    magasinRepo.findAndCount.mockResolvedValue([items, 2]);

    const res = await service.findByCentrePaginated(2, { page: 1, limit: 20 });

    expect(magasinRepo.findAndCount).toHaveBeenCalledWith(expect.objectContaining({
      where: { centre: { id: 2 } },
      relations: ['collectes', 'collectes.collecte'],
      skip: 0,
      take: 20,
    }));
    expect(res.items).toHaveLength(2);
    expect(res.total).toBe(2);
    expect(res.page).toBe(1);
    expect(res.limit).toBe(20);
  });
});
