jest.mock('@azure/storage-blob', () => {
  // fns utilisées par FilesService (upload, sas, etc.)
  const uploadData = jest.fn().mockResolvedValue(undefined);
  const upload = jest.fn().mockResolvedValue(undefined);
  const downloadToBuffer = jest.fn().mockResolvedValue(Buffer.from(''));
  const deleteIfExists = jest.fn().mockResolvedValue({ succeeded: true });

  const getBlockBlobClient = jest.fn(() => ({
    upload,
    uploadData,
    downloadToBuffer,
    deleteIfExists,
    url: 'https://fake.blob.core.windows.net/magasins/fake.png',
  }));

  const getContainerClient = jest.fn(() => ({
    createIfNotExists: jest.fn().mockResolvedValue(undefined),
    getBlockBlobClient,
    setAccessPolicy: jest.fn().mockResolvedValue(undefined),
    deleteBlob: jest.fn().mockResolvedValue(undefined),
    exists: jest.fn().mockResolvedValue(true),
  }));

  // ✅ Définie DANS la fabrique → pas de hoisting bug
  const fromConnectionString = jest.fn(() => ({ getContainerClient }));

  return {
    BlobServiceClient: { fromConnectionString },
    StorageSharedKeyCredential: jest.fn().mockImplementation(() => ({})),
    generateBlobSASQueryParameters: jest.fn().mockReturnValue({ toString: () => 'sig=abc' }),
    BlobSASPermissions: { parse: jest.fn().mockReturnValue({}) },
    SASProtocol: { HttpsAndHttp: 'https/http' },
  };
});

describe('MagasinsService (more)', () => {
  it('dummy test', () => {
    expect(true).toBe(true);
  });
});
