// jest.config.ts
import type { Config } from 'jest';

const config: Config = {
  // ✅ Support ESM avec TypeScript (module: "nodenext")
  preset: 'ts-jest/presets/default-esm',
  testEnvironment: 'node',

  // ✅ Transforme les fichiers .ts avec ESM activé
  extensionsToTreatAsEsm: ['.ts'],
  transform: {
    '^.+\\.ts$': [
      'ts-jest',
      {
        useESM: true,
        tsconfig: 'tsconfig.json',
      },
    ],
  },

  // ✅ Mappe les imports alias (ex: "src/..." vers le vrai dossier)
  moduleNameMapper: {
    '^src/(.*)$': '<rootDir>/src/$1',
  },

  // ✅ Optionnel : utile pour "import 'reflect-metadata'" automatique
  setupFiles: ['<rootDir>/jest.setup.ts'],

  // ✅ Pour que Jest trouve tous les tests *.spec.ts
  testMatch: ['**/*.spec.ts'],
};

export default config;
