import { CanvasEngine } from '../core/CanvasEngine.js';

export class PuzzleCard {
  constructor(puzzle, onClick) {
    this.puzzle = puzzle;
    this.onClick = onClick;
    this.element = null;
  }

  render() {
    const card = document.createElement('div');
    card.className = 'puzzle-card';
    card.style.cssText = `
      background: var(--bg-card);
      border-radius: 12px;
      overflow: hidden;
      cursor: pointer;
      transition: transform 0.2s;
      display: flex;
      flex-direction: column;
    `;
    
    card.addEventListener('mouseenter', () => {
      card.style.transform = 'scale(1.05)';
    });
    card.addEventListener('mouseleave', () => {
      card.style.transform = 'scale(1)';
    });
    card.addEventListener('click', () => this.onClick(this.puzzle.id));
    
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    canvas.style.cssText = `
      width: 100%;
      height: auto;
      aspect-ratio: 1;
      image-rendering: pixelated;
    `;
    
    const engine = new CanvasEngine(canvas);
    engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette, 'homepage');
    
    const info = document.createElement('div');
    info.style.cssText = `
      padding: 12px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    `;
    
    const name = document.createElement('h3');
    name.textContent = this.puzzle.name;
    name.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      margin: 0;
    `;
    
    const progress = document.createElement('div');
    progress.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    
    const progressBar = document.createElement('div');
    progressBar.style.cssText = `
      flex: 1;
      height: 8px;
      background: rgba(255,255,255,0.2);
      border-radius: 4px;
      overflow: hidden;
    `;
    
    const progressFill = document.createElement('div');
    progressFill.style.cssText = `
      height: 100%;
      width: ${this.puzzle.completedPercent}%;
      background: var(--accent-primary);
      transition: width 0.3s;
    `;
    
    progressBar.appendChild(progressFill);
    
    const progressText = document.createElement('span');
    progressText.textContent = `${this.puzzle.completedPercent}%`;
    progressText.style.fontSize = '12px';
    
    progress.appendChild(progressBar);
    progress.appendChild(progressText);
    info.appendChild(name);
    info.appendChild(progress);
    
    card.appendChild(canvas);
    card.appendChild(info);
    
    this.element = card;
    return card;
  }

  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
