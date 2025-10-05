import { Test } from '@nestjs/testing'; // Utilitaire NestJS pour créer un module de test
import { CentresController } from './centres.controller'; // Contrôleur à tester
import { CentresService } from '../services/centres.service'; // Service métier mocké

// Bloc de test du contrôleur CentresController
describe('CentresController', () => {
  let ctrl: CentresController; // Instance du contrôleur à tester

  // Mock du service CentresService : chaque méthode est simulée avec jest.fn()
  const serviceMock = {
    create: jest.fn(),
    findAll: jest.fn(),
    findAllSimple: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  // Avant chaque test, on crée un module de test NestJS avec le contrôleur et le service mocké
  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [CentresController], // On déclare le contrôleur à tester
      providers: [{ provide: CentresService, useValue: serviceMock }], // On injecte le mock du service
    }).compile();

    ctrl = module.get(CentresController); // On récupère l'instance du contrôleur
    jest.clearAllMocks(); // On réinitialise les mocks avant chaque test
  });

  // Test : la méthode create du contrôleur appelle bien le service
  it('create délègue au service', async () => {
    serviceMock.create.mockResolvedValue({ id: 1, name: 'X' }); // On simule la réponse du service
    await ctrl.create({} as any); // On appelle la méthode du contrôleur
    expect(serviceMock.create).toHaveBeenCalled(); // On vérifie que le service a été appelé
  });

  // Test : la méthode findAll transmet la query telle quelle au service
  it('findAll passe la query telle quelle', async () => {
    serviceMock.findAll.mockResolvedValue({ items: [], total: 0, page: 1, limit: 10 }); // Mock de la réponse
    await ctrl.findAll({ page: 1, limit: 10 } as any); // Appel avec une query
    expect(serviceMock.findAll).toHaveBeenCalledWith({ page: 1, limit: 10 }); // Vérification des paramètres transmis
  });

  // Test : la méthode findOne appelle le service et retourne le bon résultat
  it('findOne délègue au service', async () => {
    serviceMock.findOne.mockResolvedValue({ id: 7, name: 'C' }); // Mock de la réponse
    const res = await ctrl.findOne(7 as any); // Appel avec un id
    expect(serviceMock.findOne).toHaveBeenCalledWith(7); // Vérifie que le service est appelé avec le bon id
    expect(res.id).toBe(7); // Vérifie que la réponse contient le bon id
  });
});
