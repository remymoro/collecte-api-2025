// src/modules/files/files.service.ts
import {
  Injectable,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  BlobServiceClient,
  generateBlobSASQueryParameters,
  BlobSASPermissions,
  SASProtocol,
  StorageSharedKeyCredential,
} from '@azure/storage-blob';
import { v4 as uuid } from 'uuid';
import type { Express, Response } from 'express';

@Injectable()
export class FilesService {
  private readonly blobService: BlobServiceClient;
  private readonly containerName = 'magasins';
  private readonly accountName: string;
  private readonly accountKey: string;

  constructor() {
    const conn = process.env.AZURE_STORAGE_CONNECTION_STRING;
    if (!conn) throw new Error('AZURE_STORAGE_CONNECTION_STRING manquante');

    if (conn === 'UseDevelopmentStorage=true') {
      this.accountName = 'devstoreaccount1';
      this.accountKey = 'Eby8vdM02xNOcqFeqCnf2P==';
    } else {
      const nameMatch = /AccountName=([^;]+)/i.exec(conn);
      const keyMatch  = /AccountKey=([^;]+)/i.exec(conn);
      if (!nameMatch || !keyMatch) {
        throw new Error('AccountName/AccountKey introuvables dans la connection string');
      }
      this.accountName = nameMatch[1];
      this.accountKey  = keyMatch[1];
    }

    this.blobService = BlobServiceClient.fromConnectionString(conn);
  }

  async uploadImage(file: Express.Multer.File): Promise<{ url: string; blobName: string }> {
    if (!file?.buffer) throw new BadRequestException('Fichier manquant');
    if (!file.mimetype?.startsWith('image/')) {
      throw new BadRequestException('Type non supporté (image uniquement)');
    }

    try {
      const container = this.blobService.getContainerClient(this.containerName);
      await container.createIfNotExists();

      // ✅ Rendre public en DEV uniquement (si souhaité)
      // Correct SDK signature: setAccessPolicy(signedIdentifiers?, options?)
      if (process.env.PUBLIC_BLOB_ACCESS === 'true') {
        try {
          await container.setAccessPolicy('blob');
        } catch {
          // Azurite / versions : ignore si non supporté
        }
      }

      const safeName = (file.originalname || 'image').replace(/[^\w.\-]/g, '_');
      const blobName = `${uuid()}-${safeName}`;
      const blob = container.getBlockBlobClient(blobName);

      await blob.uploadData(file.buffer, {
        blobHTTPHeaders: { blobContentType: file.mimetype },
      });

      return { url: blob.url, blobName };
    } catch (e) {
      console.error('Upload image Azure échoué:', e);
      throw new InternalServerErrorException('Upload image échoué');
    }
  }

  async deleteByBlobName(blobName: string): Promise<void> {
    const container = this.blobService.getContainerClient(this.containerName);
    await container.deleteBlob(blobName, { deleteSnapshots: 'include' });
  }

  // ✅ Génère une SAS fiable (Azurite ou Azure) à partir de la connection string
  async getBlobSasUrl(blobName: string, ttlSeconds = 3600): Promise<string> {
    const container = this.blobService.getContainerClient(this.containerName);
    const blob = container.getBlockBlobClient(blobName);

    const cred = new StorageSharedKeyCredential(this.accountName, this.accountKey);

    // Anti "clock skew" : démarre 5 min en arrière
    const startsOn  = new Date(Date.now() - 5 * 60 * 1000);
    const expiresOn = new Date(Date.now() + ttlSeconds * 1000);

    const sas = generateBlobSASQueryParameters(
      {
        containerName: this.containerName,
        blobName,
        permissions: BlobSASPermissions.parse('r'),
        protocol: SASProtocol.HttpsAndHttp, // Azurite tourne en HTTP
        startsOn,
        expiresOn,
      },
      cred,
    ).toString();

    return `${blob.url}?${sas}`;
  }

  async streamBlobToResponse(blobName: string, res: Response): Promise<void> {
    const container = this.blobService.getContainerClient(this.containerName);
    const blob = container.getBlockBlobClient(blobName);
    const dl = await blob.download(0); // auth via ta connection string
    res.setHeader('Content-Type', dl.contentType ?? 'application/octet-stream');
    (dl.readableStreamBody as NodeJS.ReadableStream).pipe(res);
  }
}
