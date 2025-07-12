// Jest setup file for DOM testing
import '@testing-library/jest-dom';

// Mock fetch globally
global.fetch = jest.fn();

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
};

// Polyfill structuredClone for Node < 17
if (typeof global.structuredClone !== 'function') {
  global.structuredClone = (obj: any) => JSON.parse(JSON.stringify(obj));
} 