// src/modules/centres/interfaces/centre-response.interface.ts
import { CentreBase } from './centre-base.interface';

export interface CentreResponse extends CentreBase {
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
}
