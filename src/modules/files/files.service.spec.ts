import { BadRequestException } from '@nestjs/common';
import { FilesService } from './files.service';

// --- Mocks Azure SDK v12 ---
const uploadData = jest.fn();
const download = jest.fn();
const deleteBlob = jest.fn();
const getBlockBlobClient = jest.fn().mockReturnValue({
  uploadData,
  download,
  url: 'http://127.0.0.1:10000/devstoreaccount1/magasins/uuid-x.png',
});
const createIfNotExists = jest.fn();
const setAccessPolicy = jest.fn();
const getContainerClient = jest.fn().mockReturnValue({
  createIfNotExists,
  setAccessPolicy,
  getBlockBlobClient,
  deleteBlob,
});
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

describe('FilesService', () => {
  const GOOD_CONN =
    'DefaultEndpointsProtocol=http;AccountName=devstoreaccount1;AccountKey=devkey;BlobEndpoint=http://127.0.0.1:10000/devstoreaccount1;';
  const IMG_FILE = {
    buffer: Buffer.from('img'),
    mimetype: 'image/png',
    originalname: 'logo x.png',
  } as any;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.AZURE_STORAGE_CONNECTION_STRING = GOOD_CONN;
    delete process.env.PUBLIC_BLOB_ACCESS;
  });

  it('ctor - throw si connection string absente', () => {
    delete process.env.AZURE_STORAGE_CONNECTION_STRING;
    expect(() => new FilesService()).toThrow(/AZURE_STORAGE_CONNECTION_STRING/);
  });

  it('uploadImage - OK (création conteneur + upload + url retour)', async () => {
    const svc = new FilesService();
    const res = await svc.uploadImage(IMG_FILE);

    expect(fromConnectionString).toHaveBeenCalledWith(GOOD_CONN);
    expect(getContainerClient).toHaveBeenCalledWith('magasins');
    expect(createIfNotExists).toHaveBeenCalled();
    expect(uploadData).toHaveBeenCalledWith(expect.any(Buffer), {
      blobHTTPHeaders: { blobContentType: 'image/png' },
    });
    expect(res.url).toContain('/magasins/');
    expect(res.blobName).toMatch(/\.png$/);
  });

  it('uploadImage - refuse non-image', async () => {
    const svc = new FilesService();
    const bad = { buffer: Buffer.from('x'), mimetype: 'application/pdf', originalname: 'x.pdf' } as any;
    await expect(svc.uploadImage(bad)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('uploadImage - refuse fichier manquant', async () => {
    const svc = new FilesService();
    await expect(svc.uploadImage(undefined as any)).rejects.toBeInstanceOf(BadRequestException);
  });

  it('deleteByBlobName - appelle deleteBlob', async () => {
    const svc = new FilesService();
    await svc.deleteByBlobName('uuid-x.png');
    expect(deleteBlob).toHaveBeenCalledWith('uuid-x.png', { deleteSnapshots: 'include' });
  });

  it('getBlobSasUrl - retourne une SAS avec ?sig=', async () => {
    const svc = new FilesService();
    const url = await svc.getBlobSasUrl('uuid-x.png', 600);
    expect(url).toContain('uuid-x.png?sig=');
  });

  it('uploadImage - peut rendre public en dev quand PUBLIC_BLOB_ACCESS=true', async () => {
    process.env.PUBLIC_BLOB_ACCESS = 'true';
    const svc = new FilesService();
    await svc.uploadImage(IMG_FILE);
    expect(setAccessPolicy).toHaveBeenCalled(); // tolérant: Azurite peut ignorer
  });
});
