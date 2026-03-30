/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/__tests__/**/*.test.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    // Mock native modules that can't run in Node test environment
    '^expo-secure-store$': '<rootDir>/src/__mocks__/expo-secure-store.ts',
    '^react-native$': '<rootDir>/src/__mocks__/react-native.ts',
    '^@/lib/supabase$': '<rootDir>/src/__mocks__/@/lib/supabase.ts',
  },
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        jsx: 'react',
      },
    }],
  },
}
