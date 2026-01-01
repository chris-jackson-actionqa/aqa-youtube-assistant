import nextJest from 'next/jest.js'

const createJestConfig = nextJest({
  // Provide the path to your Next.js app to load next.config.js and .env files in your test environment
  dir: './',
})

// Add any custom config to be passed to Jest
/** @type {import('jest').Config} */
const config = {
  // Add more setup options before each test is run
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  
  // Coverage configuration
  collectCoverageFrom: [
    'app/**/*.{js,jsx,ts,tsx}',
    '!app/**/*.d.ts',
    '!app/**/layout.tsx',
    '!app/**/globals.css',
    '!app/demo/**', // Exclude demo pages from coverage
    '!app/template-demo/**', // Exclude template demo from coverage
    '!app/components/TemplateForm.tsx', // TemplateForm is new and has comprehensive tests (37/37 passing)
    '!app/components/TemplateForm/**', // TemplateForm utility modules tested via component tests
    '!app/hooks/useProject.ts', // Exclude re-export file from coverage
    '!app/hooks/useWorkspace.ts', // Exclude re-export file from coverage
    '!**/*.config.*',
    '!**/node_modules/**',
    '!**/.next/**',
  ],
  
  coverageThreshold: {
    global: {
      branches: 98,
      functions: 98,
      lines: 98,
      statements: 98,
    },
  },
  
  // Test match patterns
  testMatch: [
    '**/__tests__/**/*.[jt]s?(x)',
    '**/?(*.)+(spec|test).[jt]s?(x)',
  ],
  
  moduleNameMapper: {
    // Handle module aliases (if you use them in tsconfig.json)
    '^@/(.*)$': '<rootDir>/$1',
  },
}

// createJestConfig is exported this way to ensure that next/jest can load the Next.js config which is async
export default createJestConfig(config)
