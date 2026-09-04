import { describe, expect, it, vi } from 'vitest';
import { withJitter } from '../executeQuery.js';

describe('withJitter()', () => {
  it('never returns less than the base wait', () => {
    vi.spyOn(Math, 'random').mockReturnValue(0);
    expect(withJitter(2)).toBe(2);
    expect(withJitter(45)).toBe(45);
    vi.restoreAllMocks();
  });

  it('doubles a base wait smaller than the cap', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);
    expect(withJitter(2)).toBe(4);
    vi.restoreAllMocks();
  });

  it('caps the extra wait for a base larger than the cap', () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);
    expect(withJitter(45)).toBe(50);
    vi.restoreAllMocks();
  });
});
