import { Centre } from '../../src/modules/centres/entities/centre.entity';

export function makeCentre(partial: Partial<Centre> = {}): Centre {
  return {
    id: partial.id ?? 1,
    name: partial.name ?? 'Centre Agen',
    address: partial.address ?? '97 rue Montesquieu',
    phone: partial.phone ?? '0700000000',
    email: partial.email ?? 'contact@restos.fr',
    externalRef: partial.externalRef ?? 'EXT-001',
    createdAt: partial.createdAt ?? new Date(),
    updatedAt: partial.updatedAt ?? new Date(),
    deletedAt: partial.deletedAt ?? null,
    magasins: partial.magasins ?? [],
  };
}
