import { PuzzleStorage } from '../core/PuzzleStorage.js';
import { PuzzleCard } from './PuzzleCard.js';

export class HomeView {
  constructor(container) {
    this.container = container;
    this.storage = new PuzzleStorage();
    this.cards = [];
    this.element = null;
  }

  async mount() {
    await this.storage.initDefaults();
    this.element = document.createElement('div');
    this.element.id = 'home-view';
    this.element.style.cssText = `
      padding: 20px;
      max-width: 1200px;
      margin: 0 auto;
    `;
    
    const header = document.createElement('header');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 24px;
      flex-wrap: wrap;
      gap: 16px;
    `;
    
    const title = document.createElement('h1');
    title.textContent = 'Pixel Art Coloring';
    title.style.cssText = `
      font-size: 24px;
      font-weight: 700;
      margin: 0;
    `;
    
    const importBtn = document.createElement('button');
    importBtn.textContent = 'Import Image';
    importBtn.style.cssText = `
      background: var(--accent-primary);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      font-size: 16px;
      cursor: pointer;
      font-weight: 600;
    `;
    importBtn.addEventListener('click', () => this.onImportClick());
    
    header.appendChild(title);
    header.appendChild(importBtn);
    this.element.appendChild(header);
    
    const puzzles = this.storage.getAll();
    
    if (puzzles.length === 0) {
      const emptyState = document.createElement('div');
      emptyState.style.cssText = `
        text-align: center;
        padding: 60px 20px;
        color: rgba(255,255,255,0.5);
      `;
      emptyState.innerHTML = `
        <p>No puzzles yet!</p>
        <p>Import an image to create your first puzzle.</p>
      `;
      this.element.appendChild(emptyState);
    } else {
      const grid = document.createElement('div');
      grid.className = 'puzzle-grid';
      grid.style.cssText = `
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 20px;
      `;
      
      puzzles.forEach(puzzle => {
        const card = new PuzzleCard(puzzle, (id) => {
          window.location.hash = `#editor/${id}`;
        });
        this.cards.push(card);
        grid.appendChild(card.render());
      });
      
      this.element.appendChild(grid);
    }
    
    this.container.appendChild(this.element);
  }

  onImportClick() {
    window.location.hash = '#import';
  }

  destroy() {
    this.cards.forEach(card => card.destroy());
    this.cards = [];
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
