import { defineWorkspace } from 'vitest/config'

export default defineWorkspace([
  {
    test: {
      name: 'unit',
      include: ['backend/src/modules/**/__tests__/*.service.test.ts'],
      environment: 'node',
      globals: true,
    },
    coverage: {
      provider: 'v8',
      include: [
        'backend/src/modules/**/*.ts',
        'backend/src/lib/**/*.ts',
        'backend/src/middleware/**/*.ts',
      ],
      exclude: [
        'backend/src/modules/**/__tests__/**',
      ],
      reporter: ['text', 'json-summary'],
    },
  },
  {
    test: {
      name: 'integration',
      include: [
        'backend/src/modules/**/__tests__/*.repository.test.ts',
        'backend/src/modules/**/__tests__/*.http.test.ts',
      ],
      environment: 'node',
      globals: true,
      setupFiles: ['backend/src/test/setup.ts'],
      pool: 'forks',
      poolOptions: {
        forks: { singleFork: true },
      },
    },
  },
])
