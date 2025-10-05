export interface MagasinResponse {
  id: number;
  name: string;
  address: string;
  phone?: string;
  email?: string;
  externalRef?: string;
  isActive?: boolean;
  centreId: number;
}
