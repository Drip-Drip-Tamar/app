// Test setup file
import { vi } from 'vitest';

// Mock environment variables for testing
process.env.DATABASE_URL = 'postgres://test:test@localhost:5432/test';
process.env.NODE_ENV = 'test';

// Mock console to avoid noise in test output
global.console = {
  ...console,
  // Suppress expected error logs in tests
  error: vi.fn(),
  warn: vi.fn(),
};