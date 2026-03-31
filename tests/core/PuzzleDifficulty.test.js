import { describe, it, expect } from 'vitest';
import { calculateDifficulty } from '../../core/PuzzleDifficulty.js';

describe('calculateDifficulty', () => {
  it('should return 3 for 32x32 grid with 5 colors (basketball)', () => {
    const grid = Array(32).fill(null).map(() => Array(32).fill(0));
    const palette = [[255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0], [255, 0, 255]];
    expect(calculateDifficulty(grid, palette)).toBe(3);
  });
});
