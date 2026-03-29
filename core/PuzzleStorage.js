const STORAGE_KEY = 'pixelart_puzzles';

export class PuzzleStorage {
  constructor() {
    this.defaultPuzzles = null;
  }

  async getDefaultPuzzles() {
    if (!this.defaultPuzzles) {
      try {
        const response = await fetch('./data/defaultPuzzles.json');
        if (!response.ok) {
          throw new Error(`Failed to fetch default puzzles: ${response.status}`);
        }
        this.defaultPuzzles = await response.json();
      } catch (error) {
        console.error('Error loading default puzzles:', error);
        this.defaultPuzzles = [];
      }
    }
    return this.defaultPuzzles;
  }

  getAll() {
    if (!this._isLocalStorageAvailable()) {
      return [];
    }
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];
    try {
      return JSON.parse(stored);
    } catch (error) {
      console.error('Error parsing stored puzzles:', error);
      return [];
    }
  }

  getById(id) {
    const puzzles = this.getAll();
    return puzzles.find(p => p.id === id) || null;
  }

  save(puzzle) {
    if (!this._isLocalStorageAvailable()) {
      return;
    }
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
    
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(puzzles));
    } catch (error) {
      console.error('Error saving puzzle:', error);
    }
  }

  saveProgress(id, paintedGrid) {
    const puzzle = this.getById(id);
    if (!puzzle) return;
    
    puzzle.paintedGrid = paintedGrid;
    puzzle.completedPercent = this.calculatePercent(puzzle);
    puzzle.lastPlayed = new Date().toISOString();
    
    this.save(puzzle);
  }

  _isLocalStorageAvailable() {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, testKey);
      localStorage.removeItem(testKey);
      return true;
    } catch (e) {
      return false;
    }
  }

  delete(id) {
    if (!this._isLocalStorageAvailable()) {
      return;
    }
    const puzzles = this.getAll().filter(p => p.id !== id);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(puzzles));
    } catch (error) {
      console.error('Error deleting puzzle:', error);
    }
  }

  calculatePercent(puzzle) {
    if (!puzzle.paintedGrid) {
      return 0;
    }
    
    let total = 0;
    let painted = 0;
    
    for (let y = 0; y < puzzle.targetGrid.length; y++) {
      for (let x = 0; x < puzzle.targetGrid[y].length; x++) {
        if (puzzle.targetGrid[y][x] > 0) {
          total++;
          if (puzzle.paintedGrid[y] && puzzle.paintedGrid[y][x] === 1) {
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
      try {
        const defaults = await this.getDefaultPuzzles();
        defaults.forEach(p => this.save(p));
      } catch (error) {
        console.error('Error initializing default puzzles:', error);
      }
    }
  }
}
