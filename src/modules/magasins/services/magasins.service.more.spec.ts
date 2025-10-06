import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository, Not, In } from 'typeorm';
import { MagasinsService } from './magasins.service';
import { Magasin } from '../entities/magasin.entity';
import { Centre } from '../../centres/entities/centre.entity';
import { CollecteMagasin } from 'src/modules/collecte/entities/collecte-magasin.entity';
import { ConflictException, NotFoundException } from '@nestjs/common';
import { FilesService } from '../../files/files.service';

const fromConnectionString = jest.fn().mockReturnValue({
  getContainerClient: jest.fn().mockReturnValue({
    createIfNotExists: jest.fn(),
    getBlockBlobClient: jest.fn().mockReturnValue({
      uploadData: jest.fn(),
      url: 'http://127.0.0.1:10000/devstoreaccount1/magasins/fake.png',
    }),
    setAccessPolicy: jest.fn(),
    deleteBlob: jest.fn(),
  }),
});

jest.mock('@azure/storage-blob', () => ({
  BlobServiceClient: { fromConnectionString },
  StorageSharedKeyCredential: jest.fn().mockImplementation(() => ({})),
  generateBlobSASQueryParameters: jest.fn().mockReturnValue({ toString: () => 'sig=abc' }),
  BlobSASPermissions: { parse: jest.fn().mockReturnValue({}) },
  SASProtocol: { HttpsAndHttp: 'https/http' },
}));

describe('MagasinsService (more)', () => {
  let service: MagasinsService;
  let magasinRepo: jest.Mocked<Repository<Magasin>>;
  let centreRepo: jest.Mocked<Repository<Centre>>;
  let cmRepo: jest.Mocked<Repository<CollecteMagasin>>;

  const files = { uploadImage: jest.fn() } as any;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MagasinsService,
        { provide: getRepositoryToken(Magasin), useValue: {
          exist: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
          findOne: jest.fn(),
          find: jest.fn(),
          findAndCount: jest.fn(),
          findOneByOrFail: jest.fn(),
        }},
        { provide: getRepositoryToken(Centre), useValue: { findOne: jest.fn() }},
        { provide: getRepositoryToken(CollecteMagasin), useValue: {
          findOne: jest.fn(),
          create: jest.fn(),
          save: jest.fn(),
        }},
        { provide: FilesService, useValue: files },
      ],
    }).compile();

    service = moduleRef.get(MagasinsService);
    magasinRepo = moduleRef.get(getRepositoryToken(Magasin));
    centreRepo = moduleRef.get(getRepositoryToken(Centre));
    cmRepo = moduleRef.get(getRepositoryToken(CollecteMagasin));
  });

  afterEach(() => jest.clearAllMocks());

  it('create - NotFound si centre inexistant', async () => {
    centreRepo.findOne.mockResolvedValue(null as any);
    await expect(service.create({ name:'A', address:'x', centreId:1 } as any))
      .rejects.toBeInstanceOf(NotFoundException);
  });

  it('create - OK et normalise adresse', async () => {
    centreRepo.findOne.mockResolvedValue({ id: 1 } as any);
    magasinRepo.exist.mockResolvedValue(false);
    const created = { id: 10, name: 'A', address: 'x', centre: { id: 1 } } as any;
    magasinRepo.create.mockReturnValue(created);
    magasinRepo.save.mockResolvedValue(created);

    const res = await service.create({ name:'A', address:'  12  rue  X  ', centreId:1 } as any);
    expect(magasinRepo.exist).toHaveBeenCalled();
    expect(magasinRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      address: '12 rue X',
    }));
    expect(res.id).toBe(10);
  });

  it('create - conflit adresse (filet de sécurité MySQL)', async () => {
    centreRepo.findOne.mockResolvedValue({ id: 1 } as any);
    magasinRepo.exist.mockResolvedValue(false);
    magasinRepo.create.mockReturnValue({} as any);
    const dupErr: any = { code: 'ER_DUP_ENTRY', driverError: { errno: 1062 } };
    magasinRepo.save.mockRejectedValue(dupErr);

    await expect(service.create({ name:'A', address:'x', centreId:1 } as any))
      .rejects.toBeInstanceOf(ConflictException);
  });

  it('update - NotFound retourne null', async () => {
    magasinRepo.findOne.mockResolvedValue(null as any);
    const res = await service.update(99, { name: 'N' } as any);
    expect(res).toBeNull();
  });

  it('bulkToggleCollecte - crée le lien si absent puis save', async () => {
    cmRepo.findOne.mockResolvedValueOnce(null as any);
    cmRepo.create.mockReturnValue({} as any);
    cmRepo.save.mockResolvedValue({} as any);
    magasinRepo.find.mockResolvedValue([{ id: 1 } as any, { id: 2 } as any]);

    const res = await service.bulkToggleCollecte([1,2], 6, true);
    expect(cmRepo.create).toHaveBeenCalledWith(expect.objectContaining({
      magasin: { id: 1 }, collecte: { id: 6 }, enabled: true
    }));
    expect(cmRepo.save).toHaveBeenCalled();
    expect(magasinRepo.find).toHaveBeenCalledWith({
      where: { id: In([1,2]) },
      relations: ['collectes', 'collectes.collecte'],
    });
    expect(res.length).toBe(2);
  });
});
