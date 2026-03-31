import { describe, it, expect } from 'vitest';
import { calculateDifficulty } from '../../core/PuzzleDifficulty.js';

describe('calculateDifficulty', () => {
  it('should return 3 for 32x32 grid with 5 colors (basketball)', () => {
    const grid = Array(32).fill(null).map(() => Array(32).fill(0));
    const palette = [[255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0], [255, 0, 255]];
    expect(calculateDifficulty(grid, palette)).toBe(3);
  });

  it('should return 1 for 16x16 grid with 4 colors', () => {
    const grid = Array(16).fill(null).map(() => Array(16).fill(0));
    const palette = [[255, 0, 0], [0, 255, 0], [0, 0, 255], [255, 255, 0]];
    expect(calculateDifficulty(grid, palette)).toBe(1);
  });

  it('should return 5 for 64x64 grid with 12 colors', () => {
    const grid = Array(64).fill(null).map(() => Array(64).fill(0));
    const palette = Array(12).fill(null).map((_, i) => [i * 20, i * 20, i * 20]);
    expect(calculateDifficulty(grid, palette)).toBe(5);
  });

  it('should return 1 for missing grid', () => {
    expect(calculateDifficulty(null, [[255, 0, 0]])).toBe(1);
  });

  it('should return 1 for missing palette', () => {
    const grid = Array(10).fill(null).map(() => Array(10).fill(0));
    expect(calculateDifficulty(grid, null)).toBe(1);
  });

  it('should return 1 for empty palette', () => {
    const grid = Array(10).fill(null).map(() => Array(10).fill(0));
    expect(calculateDifficulty(grid, [])).toBe(1);
  });
});
