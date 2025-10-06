export const BlobSASPermissions = { parse: jest.fn().mockReturnValue({}) };
export const generateBlobSASQueryParameters = jest.fn().mockReturnValue({ toString: () => 'sig=abc' });
export const StorageSharedKeyCredential = jest.fn().mockImplementation(() => ({}));
export const SASProtocol = { HttpsAndHttp: 'https/http' };

const uploadData = jest.fn().mockResolvedValue(undefined);
const upload = jest.fn().mockResolvedValue(undefined);
const downloadToBuffer = jest.fn().mockResolvedValue(Buffer.from(''));
const deleteIfExists = jest.fn().mockResolvedValue({ succeeded: true });

const getBlockBlobClient = jest.fn(() => ({ upload, uploadData, downloadToBuffer, deleteIfExists, url: 'https://fake/blob.png' }));
const getContainerClient = jest.fn(() => ({ createIfNotExists: jest.fn(), getBlockBlobClient, setAccessPolicy: jest.fn(), deleteBlob: jest.fn(), exists: jest.fn().mockResolvedValue(true) }));

export const BlobServiceClient = {
  fromConnectionString: jest.fn(() => ({ getContainerClient })),
};
