// Global test setup file
// This file contains common mocks and utilities used across multiple test files

// ===== COMMON MODULE MOCKS =====

// Mock chalk - commonly used ESM module
jest.mock("chalk", () => ({
  blue: jest.fn((text: string) => text),
  yellow: jest.fn((text: string) => text),
  green: jest.fn((text: string) => text),
  red: jest.fn((text: string) => text),
  bold: jest.fn((text: string) => text),
  cyan: jest.fn((text: string) => text),
  gray: jest.fn((text: string) => text),
}));

// Mock child_process - commonly used in command execution tests
jest.mock("child_process");

// ===== GLOBAL MOCK UTILITIES =====

// Global console mocks - can be accessed by all tests
export const mockConsole = {
  log: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
  info: jest.fn(),
};

// Global process mocks
export const mockProcess = {
  exit: jest.fn(),
  platform: process.platform, // Store original platform
};

// ===== SETUP GLOBAL MOCKS =====

// Override console methods globally
Object.defineProperty(console, "log", {
  value: mockConsole.log,
  writable: true,
});

Object.defineProperty(console, "warn", {
  value: mockConsole.warn,
  writable: true,
});

Object.defineProperty(console, "error", {
  value: mockConsole.error,
  writable: true,
});

Object.defineProperty(console, "info", {
  value: mockConsole.info,
  writable: true,
});

// Override process.exit globally
Object.defineProperty(process, "exit", {
  value: mockProcess.exit,
  writable: true,
});

// ===== TEST UTILITIES =====

// Utility to mock process.platform for cross-platform testing
export const mockPlatform = (platform: NodeJS.Platform) => {
  Object.defineProperty(process, "platform", {
    value: platform,
    writable: true,
  });
};

// Utility to restore process.platform
export const restorePlatform = () => {
  Object.defineProperty(process, "platform", {
    value: mockProcess.platform,
    writable: true,
  });
};

// Utility to clear all mocks
export const clearAllMocks = () => {
  jest.clearAllMocks();
  mockConsole.log.mockClear();
  mockConsole.warn.mockClear();
  mockConsole.error.mockClear();
  mockConsole.info.mockClear();
  mockProcess.exit.mockClear();
};

// ===== TEMP DIRECTORY UTILITIES =====
import fs from "fs";
import path from "path";
import os from "os";

let tempDir: string | undefined;

// Utility to create a temp directory for tests
export const createTempTestDir = (): string => {
  tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "generate-react-app-test-"));
  return tempDir;
};

// Utility to get the current temp directory
export const getTempDir = (): string => {
  if (!tempDir) {
    throw new Error(
      "Temp directory not created. Call createTempTestDir() first."
    );
  }
  return tempDir;
};

// Utility to create a temp file
export const createTempFile = (
  relativePath: string,
  content: string
): string => {
  if (!tempDir) {
    throw new Error(
      "Temp directory not created. Call createTempTestDir() first."
    );
  }

  const fullPath = path.join(tempDir, relativePath);
  const dir = path.dirname(fullPath);

  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  fs.writeFileSync(fullPath, content);
  return fullPath;
};

// Utility to create a temp directory
export const createTempDir = (relativePath: string): string => {
  if (!tempDir) {
    throw new Error(
      "Temp directory not created. Call createTempTestDir() first."
    );
  }

  const fullPath = path.join(tempDir, relativePath);
  fs.mkdirSync(fullPath, { recursive: true });
  return fullPath;
};

// Utility to clean up temp directory
export const cleanupTempDir = (): void => {
  if (tempDir && fs.existsSync(tempDir)) {
    fs.rmSync(tempDir, { recursive: true, force: true });
    tempDir = undefined;
  }
};

// ===== BEFOREEACH/AFTEREACH SETUP =====

// Global beforeEach to clear mocks (but not temp directory utilities)
beforeEach(() => {
  // Clear mocks but preserve temp directory state
  jest.clearAllMocks();
  mockConsole.log.mockClear();
  mockConsole.warn.mockClear();
  mockConsole.error.mockClear();
  mockConsole.info.mockClear();
  mockProcess.exit.mockClear();
  restorePlatform();
});

// Export commonly used mock types for convenience
export type MockedConsole = typeof mockConsole;
export type MockedProcess = typeof mockProcess;
