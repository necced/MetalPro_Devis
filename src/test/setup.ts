import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Polyfill IndexedDB for tests using Dexie
import 'fake-indexeddb/auto';

/**
 * Vitest Global Setup
 * Per Cahier des Charges Technique MVP v2.0
 */

// Mock IntersectionObserver (used by some Radix UI components)
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: undefined,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Suppress console.error in tests unless explicitly testing errors
const originalError = console.error;
console.error = (...arguments_) => {
  if (
    arguments_[0]?.includes?.('Warning: ReactDOM.render is no longer supported') ||
    arguments_[0]?.includes?.('act(...)')
  ) {
    return;
  }
  originalError.call(console, ...arguments_);
};
