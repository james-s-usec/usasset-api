import '@testing-library/jest-dom'
import { vi } from 'vitest'

// Mock the logger to prevent backend calls during tests
vi.mock('../services/logger', () => ({
  logger: {
    info: vi.fn(),
    debug: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
  }
}))

// Mock fetch globally for all tests
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ 
      data: { 
        status: 'connected', 
        timestamp: new Date().toISOString() 
      } 
    }),
  } as Response)
)
