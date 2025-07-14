module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^(\\.\\./)*client/public/js/(.*)$': '<rootDir>/src/client/public/js/$2',
    '^(\\.\\./)*common/(.*)\\.js$': '<rootDir>/src/client/public/js/common/$2.ts',
    '^(\\.\\./)*modules/(.*)\\.js$': '<rootDir>/src/client/public/js/modules/$2.ts',
  },
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: 'src/__tests__/tsconfig.json',
    }],
  },
  setupFilesAfterEnv: ['<rootDir>/src/__tests__/setup.ts'],
  moduleDirectories: ['node_modules', 'src'],
  // Performance optimizations
  maxWorkers: '50%', // Use half of available CPU cores
  cache: true, // Enable Jest cache
  cacheDirectory: '<rootDir>/.jest-cache',
  clearMocks: false, // Don't clear mocks between tests (faster)
  restoreMocks: false, // Don't restore mocks between tests (faster)
  // Reduce verbosity for faster output
  verbose: false,
  // Skip coverage by default (can be enabled with --coverage)
  collectCoverage: false,
  // Optimize for speed
  bail: false, // Don't stop on first failure
  // Reduce memory usage
  maxConcurrency: 5,
  // Change detection optimizations
  changedSince: process.env.CHANGED_SINCE || undefined,
  lastCommit: process.env.LAST_COMMIT === 'true',
}; 