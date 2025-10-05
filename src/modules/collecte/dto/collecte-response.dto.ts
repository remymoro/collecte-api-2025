import { CollecteStatus } from '../enums/collecte-status.enum';

export interface CollecteResponseDto {
  id: number;
  year: number;
  title?: string;
  slug?: string;
  defaultStartAt: string | null;
  defaultEndAt: string | null;
  graceUntil: string | null;
  lockedAt: string | null;
  status: CollecteStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
}
