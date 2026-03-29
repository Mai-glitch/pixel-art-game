import { CanvasEngine } from '../core/CanvasEngine.js';
import { PuzzleStorage } from '../core/PuzzleStorage.js';

export class EditorView {
  constructor(container, puzzleId) {
    this.container = container;
    this.puzzleId = puzzleId;
    this.storage = new PuzzleStorage();
    this.puzzle = null;
    this.engine = null;
    this.selectedColor = 1;
    this.element = null;
    this.canvas = null;
    this.isPainting = false;
    this.isDragging = false;
    this.lastMousePos = null;
  }

  async mount() {
    this.puzzle = this.storage.getById(this.puzzleId);
    if (!this.puzzle) {
      window.location.hash = '#home';
      return;
    }
    
    this.element = document.createElement('div');
    this.element.id = 'editor-view';
    this.element.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100vh;
      padding: 16px;
    `;
    
    this.renderHeader();
    this.renderCanvasArea();
    this.renderPalette();
    
    this.container.appendChild(this.element);
    this.setupEventListeners();
  }

  renderHeader() {
    const header = document.createElement('header');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
      flex-wrap: wrap;
      gap: 12px;
    `;
    
    const backBtn = document.createElement('button');
    backBtn.textContent = 'Back';
    backBtn.style.cssText = `
      background: rgba(255,255,255,0.1);
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
    `;
    backBtn.addEventListener('click', () => {
      window.location.hash = '#home';
    });
    
    const title = document.createElement('h2');
    title.textContent = this.puzzle.name;
    title.style.cssText = `
      font-size: 18px;
      margin: 0;
      flex: 1;
      text-align: center;
    `;
    
    const progress = document.createElement('div');
    progress.innerHTML = `
      <span style="color: var(--accent-primary); font-weight: 600;">
        ${this.puzzle.completedPercent}%
      </span>
    `;
    
    header.appendChild(backBtn);
    header.appendChild(title);
    header.appendChild(progress);
    this.element.appendChild(header);
  }

  renderCanvasArea() {
    const canvasContainer = document.createElement('div');
    canvasContainer.style.cssText = `
      flex: 1;
      display: flex;
      justify-content: center;
      align-items: center;
      background: rgba(0,0,0,0.3);
      border-radius: 12px;
      padding: 16px;
      overflow: hidden;
      position: relative;
    `;
    
    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      cursor: crosshair;
    `;
    
    canvasContainer.appendChild(this.canvas);
    this.element.appendChild(canvasContainer);
    
    this.engine = new CanvasEngine(this.canvas);
    this.engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
  }

  renderPalette() {
    const palette = document.createElement('div');
    palette.style.cssText = `
      display: flex;
      gap: 12px;
      padding: 16px;
      justify-content: center;
      flex-wrap: wrap;
      background: var(--bg-card);
      border-radius: 12px;
      margin-top: 16px;
    `;
    
    this.puzzle.palette.forEach((color, index) => {
      const btn = document.createElement('button');
      btn.style.cssText = `
        width: 48px;
        height: 48px;
        border: 3px solid ${index + 1 === this.selectedColor ? 'white' : 'transparent'};
        border-radius: 8px;
        background: ${color};
        cursor: pointer;
        position: relative;
      `;
      
      const number = document.createElement('span');
      number.textContent = index + 1;
      number.style.cssText = `
        position: absolute;
        top: 2px;
        left: 4px;
        font-size: 10px;
        font-weight: bold;
        color: ${this.getContrastColor(color)};
      `;
      
      btn.appendChild(number);
      btn.addEventListener('click', () => {
        this.selectedColor = index + 1;
        this.renderPalette();
      });
      
      palette.appendChild(btn);
    });
    
    this.element.appendChild(palette);
  }

  getContrastColor(hex) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }

  setupEventListeners() {
    // Canvas interactions will be added in Task 7
  }

  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
