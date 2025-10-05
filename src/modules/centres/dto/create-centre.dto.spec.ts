// Test de validation du DTO CreateCentreDto avec class-validator et class-transformer
import { validate } from 'class-validator'; // Permet de valider les contraintes du DTO
import { plainToInstance } from 'class-transformer'; // Transforme un objet brut en instance du DTO
import { CreateCentreDto } from './create-centre.dto'; // DTO à tester

// Fonction utilitaire pour valider un payload avec le DTO
async function validateDto(payload: any) {
  const dto = plainToInstance(CreateCentreDto, payload); // Transformation en instance DTO
  return validate(dto); // Validation des contraintes
}

// Bloc de tests unitaires pour CreateCentreDto
describe('CreateCentreDto', () => {
  // Test : un payload correct ne génère aucune erreur
  it('valide un payload correct', async () => {
    const errors = await validateDto({ name: 'AB', address: 'Adresse valide', email: 'a@b.fr' });
    expect(errors).toHaveLength(0);
  });

  // Test : un nom trop court est rejeté
  it('rejette name trop court', async () => {
    const errors = await validateDto({ name: 'A', address: 'Adresse valide' });
    expect(errors.length).toBeGreaterThan(0);
  });

  // Test : un email invalide est rejeté
  it('rejette email invalide', async () => {
    const errors = await validateDto({ name: 'Ok', address: 'Adresse', email: 'not-an-email' });
    expect(errors.some(e => e.property === 'email')).toBe(true);
  });

  // Test : le champ phone respecte la regex attendue
  it('phone respecte la regex', async () => {
    const ok = await validateDto({ name: 'Ok', address: 'Adresse', phone: '+33 6 12 34 56 78' });
    expect(ok).toHaveLength(0);
    const ko = await validateDto({ name: 'Ok', address: 'Adresse', phone: 'abc123' });
    expect(ko.some(e => e.property === 'phone')).toBe(true);
  });
});
