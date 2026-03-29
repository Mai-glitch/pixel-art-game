const STORAGE_KEY = 'pixelart_puzzles';

export class PuzzleStorage {
  constructor() {
    this.defaultPuzzles = null;
  }

  async getDefaultPuzzles() {
    if (!this.defaultPuzzles) {
      const response = await fetch('./data/defaultPuzzles.json');
      this.defaultPuzzles = await response.json();
    }
    return this.defaultPuzzles;
  }

  getAll() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    return JSON.parse(stored);
  }

  getById(id) {
    const puzzles = this.getAll();
    return puzzles.find(p => p.id === id) || null;
  }

  save(puzzle) {
    const puzzles = this.getAll();
    const index = puzzles.findIndex(p => p.id === puzzle.id);
    const puzzleWithTimestamp = {
      ...puzzle,
      lastPlayed: new Date().toISOString()
    };
    
    if (index >= 0) {
      puzzles[index] = puzzleWithTimestamp;
    } else {
      puzzles.push(puzzleWithTimestamp);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(puzzles));
  }

  saveProgress(id, paintedGrid) {
    const puzzle = this.getById(id);
    if (!puzzle) return;
    
    puzzle.paintedGrid = paintedGrid;
    puzzle.completedPercent = this.calculatePercent(puzzle);
    puzzle.lastPlayed = new Date().toISOString();
    
    this.save(puzzle);
  }

  delete(id) {
    const puzzles = this.getAll().filter(p => p.id !== id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(puzzles));
  }

  calculatePercent(puzzle) {
    let total = 0;
    let painted = 0;
    
    for (let y = 0; y < puzzle.targetGrid.length; y++) {
      for (let x = 0; x < puzzle.targetGrid[y].length; x++) {
        if (puzzle.targetGrid[y][x] > 0) {
          total++;
          if (puzzle.paintedGrid[y][x] === 1) {
            painted++;
          }
        }
      }
    }
    
    return total === 0 ? 0 : Math.round((painted / total) * 100);
  }

  getRecentPuzzles(limit = 10) {
    return this.getAll()
      .filter(p => p.lastPlayed)
      .sort((a, b) => new Date(b.lastPlayed) - new Date(a.lastPlayed))
      .slice(0, limit);
  }

  async initDefaults() {
    const existing = this.getAll();
    if (existing.length === 0) {
      const defaults = await this.getDefaultPuzzles();
      defaults.forEach(p => this.save(p));
    }
  }
}
