import { Test } from '@nestjs/testing';
import { MagasinsController } from './magasins.controller';
import { MagasinsService } from '../services/magasins.service';
import { FilesService } from '../../files/files.service'; // <-- Ajoute l'import

describe('MagasinsController', () => {
  let controller: MagasinsController;
  const service = {
    findByCentrePaginated: jest.fn(),
    findById: jest.fn(),
    update: jest.fn(),
    bulkToggleCollecte: jest.fn(),
    create: jest.fn(),
    uploadMagasinImage: jest.fn(),
  };
  const filesService = {
    uploadImage: jest.fn(),
    // Ajoute d'autres méthodes mockées si besoin
  };

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      controllers: [MagasinsController],
      providers: [
        { provide: MagasinsService, useValue: service },
        { provide: FilesService, useValue: filesService }, // <-- Ajoute le mock ici
      ],
    }).compile();

    controller = moduleRef.get(MagasinsController);
  });

  afterEach(() => jest.clearAllMocks());

  it('uploadImage - appelle le service avec id + file', async () => {
    const file: any = { buffer: Buffer.from('x'), mimetype: 'image/png', originalname: 'x.png' };
    const saved = { id: 1, imageUrl: 'http://...', blobName: 'uuid-x.png' };
    service.uploadMagasinImage.mockResolvedValue(saved);

    const res = await controller.uploadImage(1 as any, file);
    expect(service.uploadMagasinImage).toHaveBeenCalledWith(1, file);
    expect(res).toEqual(saved);
  });

  it('listByCentrePaginated - délègue au service', async () => {
    service.findByCentrePaginated.mockResolvedValue({ items: [], total: 0, page: 1, limit: 20 });
    const r = await controller.listByCentrePaginated(2 as any, { page: 1, limit: 20 } as any);
    expect(service.findByCentrePaginated).toHaveBeenCalledWith(2, { page: 1, limit: 20 });
    expect(r.total).toBe(0);
  });
});
