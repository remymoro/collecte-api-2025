// src/modules/centres/interfaces/centre-base.interface.ts
export interface CentreBase {
  id?: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  externalRef?: string;
}
