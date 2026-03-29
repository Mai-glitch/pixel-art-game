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
    this.resizeHandler = null;
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
    canvasContainer.className = 'canvas-container';
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
      min-height: 300px;
    `;

    this.canvas = document.createElement('canvas');
    this.canvas.style.cssText = `
      max-width: 100%;
      max-height: 100%;
      width: auto;
      height: auto;
      cursor: crosshair;
    `;

    canvasContainer.appendChild(this.canvas);
    this.element.appendChild(canvasContainer);

    this.engine = new CanvasEngine(this.canvas);

    // Auto-fit to container on load
    setTimeout(() => {
      this.fitCanvasToContainer();
    }, 0);
  }

  calculateOptimalCanvasSize() {
    const canvasContainer = this.element.querySelector('.canvas-container');
    if (!canvasContainer) return 512;
    
    const containerRect = canvasContainer.getBoundingClientRect();
    // Soustraire le padding (16px de chaque côté)
    const availableWidth = containerRect.width - 32;
    const availableHeight = containerRect.height - 32;
    
    // Prendre la dimension la plus petite pour garder le ratio carré
    const minDimension = Math.min(availableWidth, availableHeight);
    
    // Limiter entre 256px (minimum utilisable) et 1024px (maximum)
    return Math.max(256, Math.min(1024, Math.floor(minDimension)));
  }

  fitCanvasToContainer() {
    const optimalSize = this.calculateOptimalCanvasSize();
    
    if (optimalSize !== this.engine.baseSize) {
      this.engine.resize(optimalSize);
    }
    
    // Calculer le scale pour que le canvas remplisse le container
    const canvasContainer = this.element.querySelector('.canvas-container');
    const containerRect = canvasContainer.getBoundingClientRect();
    const availableSpace = Math.min(
      containerRect.width - 32,
      containerRect.height - 32
    );
    
    const scale = Math.min(1, availableSpace / optimalSize);
    this.engine.transform.scale = Math.max(0.5, scale);
    
    this.engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
  }

  renderPalette() {
    // Remove existing palette if it exists to prevent duplication
    const existingPalette = this.element.querySelector('.palette');
    if (existingPalette) {
      existingPalette.remove();
    }
    
    const palette = document.createElement('div');
    palette.className = 'palette';
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
    let isPanning = false;
    let isPainting = false;
    let lastX, lastY;
    
    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (e.button === 1 || e.button === 2 || e.shiftKey) {
        // Middle mouse, right click, or shift+click = pan
        isPanning = true;
        lastX = e.clientX;
        lastY = e.clientY;
        this.canvas.style.cursor = 'grabbing';
      } else {
        // Left click = paint
        isPainting = true;
        this.paintAt(x, y);
      }
    });
    
    this.canvas.addEventListener('pointermove', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (isPanning) {
        const dx = e.clientX - lastX;
        const dy = e.clientY - lastY;
        this.engine.pan(dx, dy);
        lastX = e.clientX;
        lastY = e.clientY;
        this.engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
      } else if (isPainting) {
        this.paintAt(x, y);
      }
    });
    
    this.canvas.addEventListener('pointerup', () => {
      isPanning = false;
      isPainting = false;
      this.canvas.style.cursor = 'crosshair';
      this.checkCompletion();
    });
    
    this.canvas.addEventListener('pointerleave', () => {
      isPanning = false;
      isPainting = false;
      this.canvas.style.cursor = 'crosshair';
    });
    
    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });
    
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? -0.2 : 0.2;
      
      this.engine.zoom(delta, x, y);
      this.engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
    }, { passive: false });
    
    // Touch gestures
    let lastDistance = 0;
    let lastTouchCenter = null;
    
    this.canvas.addEventListener('touchstart', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        lastDistance = Math.sqrt(dx * dx + dy * dy);
        lastTouchCenter = {
          x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
          y: (e.touches[0].clientY + e.touches[1].clientY) / 2
        };
      }
    }, { passive: false });
    
    this.canvas.addEventListener('touchmove', (e) => {
      if (e.touches.length === 2) {
        e.preventDefault();
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (lastDistance > 0) {
          const scale = distance / lastDistance;
          const delta = (scale - 1) * 2;
          const centerX = lastTouchCenter.x - this.canvas.getBoundingClientRect().left;
          const centerY = lastTouchCenter.y - this.canvas.getBoundingClientRect().top;
          
          this.engine.zoom(delta, centerX, centerY);
          this.engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
        }
        
        lastDistance = distance;
      }
    }, { passive: false });
    
    this.canvas.addEventListener('touchend', () => {
      lastDistance = 0;
      lastTouchCenter = null;
    });
  }

  paintAt(x, y) {
    const gridPos = this.engine.screenToGrid(x, y);
    
    if (this.engine.paintPixel(gridPos.x, gridPos.y, this.selectedColor, this.puzzle.targetGrid)) {
      this.puzzle.paintedGrid[gridPos.y][gridPos.x] = 1;
      this.storage.saveProgress(this.puzzleId, this.puzzle.paintedGrid);
      this.engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
      this.updateProgress();
    }
  }

  updateProgress() {
    const percent = this.storage.calculatePercent(this.puzzle);
    const progressEl = this.element.querySelector('header span');
    if (progressEl) {
      progressEl.textContent = `${percent}%`;
    }
  }

  checkCompletion() {
    const percent = this.storage.calculatePercent(this.puzzle);
    if (percent === 100) {
      this.showCompletionCelebration();
    }
  }

  showCompletionCelebration() {
    const celebration = document.createElement('div');
    celebration.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--accent-primary);
      color: white;
      padding: 32px 48px;
      border-radius: 16px;
      font-size: 24px;
      font-weight: bold;
      z-index: 1000;
      animation: celebrate 0.5s ease-out;
    `;
    celebration.textContent = 'Complete!';
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes celebrate {
        0% { transform: translate(-50%, -50%) scale(0); }
        50% { transform: translate(-50%, -50%) scale(1.2); }
        100% { transform: translate(-50%, -50%) scale(1); }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(celebration);
    
    setTimeout(() => {
      celebration.remove();
      style.remove();
    }, 2000);
  }

  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
