
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node', // Use node environment as these are server actions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json', 'node'],
  transform: {
    '^.+\\.(ts|tsx)$': ['ts-jest', {
      tsconfig: 'tsconfig.json', // Point to your tsconfig.json
    }],
  },
  testPathIgnorePatterns: ['/node_modules/', '/.next/'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1', // Map your @/ imports to the root directory
  },
  setupFilesAfterEnv: [],
};