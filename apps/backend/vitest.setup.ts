/**
 * Vitest global setup — Jest compatibility shim
 *
 * Many test files in tests/ were originally written for Jest and use:
 *   jest.fn(), jest.mock(), jest.spyOn(), jest.clearAllMocks(), etc.
 *
 * Since vitest.config.ts sets `globals: true`, `vi` is already available
 * globally. This file maps `global.jest` → `vi` so all Jest-style tests
 * continue to work without modification.
 *
 * Note: vi.mock() hoisting works differently from jest.mock().
 * For files using top-level jest.mock() calls, those will be treated as
 * vi.mock() calls. The behavior is compatible for most use cases.
 */
import { vi } from "vitest";

// Provide `jest` as a global alias for `vi`
// This makes jest.fn(), jest.mock(), jest.spyOn(), jest.clearAllMocks() etc. all work
(globalThis as any).jest = vi;
