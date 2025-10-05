export type RepoMock<T = any> = {
  find: jest.Mock<Promise<T[]>, any>;
  findOne: jest.Mock<Promise<T | null>, any>;
  findAndCount: jest.Mock<Promise<[T[], number]>, any>;
  save: jest.Mock<Promise<T>, any>;
  create: jest.Mock<T, any>;
  softRemove: jest.Mock<Promise<T>, any>;
  delete: jest.Mock<Promise<{ affected?: number }>, any>;
  exist: jest.Mock<Promise<boolean>, any>; // <-- added line
  softDelete: jest.Mock<Promise<T>, any>; // <-- added line
};

export function createRepoMock<T>(): RepoMock<T> {
  return {
    find:       jest.fn(),
    findOne:    jest.fn(),
    findAndCount: jest.fn(),
    save:       jest.fn(),
    create:     jest.fn(),
    exist:      jest.fn(),        // <-- added line
    softDelete: jest.fn() as jest.Mock<Promise<{ affected: number }>, [any]>,       // <-- added line
    softRemove: jest.fn(),
    delete:     jest.fn(),
  } as any;
}
