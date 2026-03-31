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
    this.ERASER_INDEX = 0; // 0 means eraser mode
    this.element = null;
    this.canvas = null;
    this.isPainting = false;
    this.isDragging = false;
    this.lastMousePos = null;
    this.resizeHandler = null;
    this.currentMode = 'draw';
    this.pinchState = {
      isPinching: false,
      startDistance: 0,
      startScale: 1,
      centerX: 0,
      centerY: 0
    };

    // New properties for continuous drawing
    this.lastPointerId = undefined;
    this.boundGlobalPointerMove = null;
    this.boundGlobalPointerUp = null;
    
    // Flag pour éviter les célébrations multiples
    this.hasCelebrated = false;
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
    
    // Set initial cursor based on default mode
    this.canvas.style.cursor = 'crosshair';
    
    // Initialize zoom controls visibility
    this.updateZoomControls();
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
    backBtn.textContent = 'Retour';
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
    
    const modeSwitcher = document.createElement('div');
    modeSwitcher.style.cssText = `
      display: flex;
      gap: 8px;
      background: rgba(255,255,255,0.1);
      padding: 4px;
      border-radius: 8px;
    `;
    
    const drawBtn = document.createElement('button');
    drawBtn.innerHTML = '🖌️ Dessiner';
    drawBtn.style.cssText = this.getModeButtonStyle('draw');
    drawBtn.addEventListener('click', () => {
      this.setMode('draw');
    });
    drawBtn.id = 'mode-draw';
    
    const panBtn = document.createElement('button');
    panBtn.innerHTML = '✋ Déplacer';
    panBtn.style.cssText = this.getModeButtonStyle('pan');
    panBtn.addEventListener('click', () => {
      this.setMode('pan');
    });
    panBtn.id = 'mode-pan';
    
    modeSwitcher.appendChild(drawBtn);
    modeSwitcher.appendChild(panBtn);
    
    const zoomControls = document.createElement('div');
    zoomControls.id = 'zoom-controls';
    zoomControls.style.cssText = `
      display: flex;
      gap: 4px;
      align-items: center;
      opacity: 0.5;
      pointer-events: none;
      transition: opacity 0.2s;
    `;
    
    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.innerHTML = '−';
    zoomOutBtn.style.cssText = this.getZoomButtonStyle();
    zoomOutBtn.addEventListener('click', () => {
      if (this.engine) this.zoom(-0.1);
    });
    
    const zoomInBtn = document.createElement('button');
    zoomInBtn.innerHTML = '+';
    zoomInBtn.style.cssText = this.getZoomButtonStyle();
    zoomInBtn.addEventListener('click', () => {
      if (this.engine) this.zoom(0.1);
    });
    
    const zoomLabel = document.createElement('span');
    zoomLabel.className = 'zoom-label';
    zoomLabel.textContent = '100%';
    zoomLabel.style.cssText = 'color: white; font-weight: 600; min-width: 50px; text-align: center;';
    
    const zoomResetBtn = document.createElement('button');
    zoomResetBtn.innerHTML = '⟲';
    zoomResetBtn.style.cssText = this.getZoomButtonStyle();
    zoomResetBtn.addEventListener('click', () => {
      if (this.engine) this.resetView();
    });
    
    zoomControls.appendChild(zoomOutBtn);
    zoomControls.appendChild(zoomLabel);
    zoomControls.appendChild(zoomInBtn);
    zoomControls.appendChild(zoomResetBtn);
    
    header.appendChild(modeSwitcher);
    header.appendChild(zoomControls);
    this.element.appendChild(header);
  }

  getModeButtonStyle(mode) {
    const isActive = this.currentMode === mode;
    return `
      background: ${isActive ? 'white' : 'transparent'};
      color: ${isActive ? '#1a1a2e' : 'white'};
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: ${isActive ? '600' : '400'};
      transition: all 0.2s;
    `;
  }

  getZoomButtonStyle() {
    return `
      background: rgba(255,255,255,0.1);
      color: white;
      border: none;
      width: 32px;
      height: 32px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: background 0.2s;
    `;
  }

  setMode(mode) {
    if (this.currentMode === mode) return;
    
    this.isPainting = false;
    this.isDragging = false;
    this.lastMousePos = null;
    
    this.currentMode = mode;
    this.updateModeUI();
    this.updateZoomControls();
    
    if (this.canvas) {
      this.canvas.style.cursor = mode === 'draw' ? 'crosshair' : 'grab';
    }
  }

  updateModeUI() {
    const drawBtn = document.getElementById('mode-draw');
    const panBtn = document.getElementById('mode-pan');
    if (drawBtn) drawBtn.style.cssText = this.getModeButtonStyle('draw');
    if (panBtn) panBtn.style.cssText = this.getModeButtonStyle('pan');
  }

  updateZoomControls() {
    const zoomControls = document.getElementById('zoom-controls');
    if (zoomControls) {
      if (this.currentMode === 'pan') {
        zoomControls.style.opacity = '1';
        zoomControls.style.pointerEvents = 'auto';
      } else {
        zoomControls.style.opacity = '0.5';
        zoomControls.style.pointerEvents = 'none';
      }
    }
  }

  zoom(delta) {
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    this.engine.zoom(delta, centerX, centerY);
    this.updateZoomLabel();
    this.engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
  }

  getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  getPinchCenter(touches) {
    return {
      x: (touches[0].clientX + touches[1].clientX) / 2,
      y: (touches[0].clientY + touches[1].clientY) / 2
    };
  }

  resetView() {
    this.engine.resetView();
    this.updateZoomLabel();
    this.engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
  }

  updateZoomLabel() {
    const label = this.element.querySelector('.zoom-label');
    if (label) {
      const percent = Math.round(this.engine.transform.scale * 100);
      label.textContent = `${percent}%`;
    }
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
    const newScale = Math.max(0.5, scale);
    
    // Si le scale a changé significativement, recentrer le canvas
    if (Math.abs(newScale - this.engine.transform.scale) > 0.01) {
      this.engine.transform.scale = newScale;
      this.engine.centerCanvas();
    }
    
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
      background: var(--bg-card);
    `;
    
    // Add eraser button first
    const isEraserSelected = this.selectedColor === this.ERASER_INDEX;
    const eraserBtn = document.createElement('button');
    eraserBtn.style.cssText = `
      width: 36px;
      height: 36px;
      border: ${isEraserSelected ? '3px solid #ff6b35' : '2px solid rgba(255,255,255,0.3)'};
      border-radius: 6px;
      background: #2a2a3e;
      cursor: pointer;
      position: relative;
      flex-shrink: 0;
      transform: ${isEraserSelected ? 'scale(1.15)' : 'scale(1)'};
      box-shadow: ${isEraserSelected ? '0 0 8px rgba(255, 107, 53, 0.6)' : 'none'};
      z-index: ${isEraserSelected ? '10' : '1'};
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    `;
    
    const eraserIcon = document.createElement('span');
    eraserIcon.innerHTML = '🧼';
    eraserIcon.style.cssText = 'font-size: 18px;';
    
    const eraserLabel = document.createElement('span');
    eraserLabel.textContent = 'G';
    eraserLabel.style.cssText = `
      position: absolute;
      bottom: 2px;
      right: 4px;
      font-size: 10px;
      font-weight: bold;
      color: #888;
    `;
    
    eraserBtn.appendChild(eraserIcon);
    eraserBtn.appendChild(eraserLabel);
    eraserBtn.addEventListener('click', () => {
      this.selectedColor = this.ERASER_INDEX;
      this.renderPalette();
    });
    
    palette.appendChild(eraserBtn);
    
    this.puzzle.palette.forEach((color, index) => {
      const isSelected = index + 1 === this.selectedColor;
      const btn = document.createElement('button');
      btn.style.cssText = `
        width: 36px;
        height: 36px;
        border: ${isSelected ? '3px solid #ff6b35' : '2px solid transparent'};
        border-radius: 6px;
        background: ${color};
        cursor: pointer;
        position: relative;
        flex-shrink: 0;
        transform: ${isSelected ? 'scale(1.15)' : 'scale(1)'};
        box-shadow: ${isSelected ? '0 0 8px rgba(255, 107, 53, 0.6)' : 'none'};
        z-index: ${isSelected ? '10' : '1'};
        transition: all 0.2s ease;
      `;
      
      const number = document.createElement('span');
      number.textContent = index + 1;
      number.style.cssText = `
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        font-size: 14px;
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
    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (this.currentMode === 'pan') {
        this.isDragging = true;
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.canvas.style.cursor = 'grabbing';
      } else if (this.currentMode === 'draw') {
        if (e.button === 0) {
          this.isPainting = true;
          this.canvas.setPointerCapture(e.pointerId);
          this.lastPointerId = e.pointerId;
          this.attachGlobalPaintingListeners();
          this.paintAt(x, y);
        }
      }
    });

    this.canvas.addEventListener('pointermove', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (this.currentMode === 'pan' && this.isDragging) {
        const dx = e.clientX - this.lastMousePos.x;
        const dy = e.clientY - this.lastMousePos.y;
        this.engine.pan(dx, dy);
        this.lastMousePos = { x: e.clientX, y: e.clientY };
        this.engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
      } else if (this.currentMode === 'draw' && this.isPainting) {
        this.paintAt(x, y);
      }
    });

    this.canvas.addEventListener('pointerup', () => {
      if (this.currentMode === 'pan' && this.isDragging) {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
      } else if (this.currentMode === 'draw' && this.isPainting) {
        this.stopPainting();
      }
    });

    this.canvas.addEventListener('pointerleave', () => {
      // Only handle pan mode cleanup on leave
      if (this.currentMode === 'pan' && this.isDragging) {
        this.isDragging = false;
        this.canvas.style.cursor = 'grab';
      }
      // Note: Drawing mode no longer stops on pointerleave
      // The global pointerup handler will stop painting
    });

    this.canvas.addEventListener('contextmenu', (e) => {
      e.preventDefault();
    });

    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();

      if (this.currentMode !== 'pan') return;

      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? -0.2 : 0.2;

      this.engine.zoom(delta, x, y);
      this.engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
    }, { passive: false });

    // Double-click to zoom
    this.canvas.addEventListener('dblclick', (e) => {
      e.preventDefault();

      if (this.currentMode !== 'pan') return;

      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      this.engine.zoom(0.3, x, y);
      this.updateZoomLabel();
      this.engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
    });

    // Handle window resize
    this.resizeHandler = () => {
      this.fitCanvasToContainer();
    };
    window.addEventListener('resize', this.resizeHandler);

    // Pinch-to-zoom gesture handling
    this.canvas.addEventListener('touchstart', (e) => {
      if (this.currentMode !== 'pan') return;
      
      if (e.touches.length === 2) {
        e.preventDefault();
        this.pinchState.isPinching = true;
        this.pinchState.startDistance = this.getPinchDistance(e.touches);
        this.pinchState.startScale = this.engine.transform.scale;
        const center = this.getPinchCenter(e.touches);
        const rect = this.canvas.getBoundingClientRect();
        this.pinchState.centerX = center.x - rect.left;
        this.pinchState.centerY = center.y - rect.top;
      }
    }, { passive: false });

    this.canvas.addEventListener('touchmove', (e) => {
      if (this.currentMode !== 'pan') return;
      
      if (this.pinchState.isPinching && e.touches.length === 2) {
        e.preventDefault();
        const currentDistance = this.getPinchDistance(e.touches);
        const scaleRatio = currentDistance / this.pinchState.startDistance;
        const newScale = this.pinchState.startScale * scaleRatio;
        const delta = newScale - this.engine.transform.scale;
        
        this.engine.zoom(delta, this.pinchState.centerX, this.pinchState.centerY);
        this.updateZoomLabel();
        this.engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
      }
    }, { passive: false });

    this.canvas.addEventListener('touchend', (e) => {
      if (this.currentMode !== 'pan') return;
      
      if (this.pinchState.isPinching && e.touches.length < 2) {
        this.pinchState.isPinching = false;
      }
    });

    this.canvas.addEventListener('touchcancel', (e) => {
      if (this.currentMode !== 'pan') return;
      
      if (this.pinchState.isPinching) {
        this.pinchState.isPinching = false;
      }
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

  attachGlobalPaintingListeners() {
    // Remove any existing global listeners first
    this.detachGlobalPaintingListeners();
    
    // Create bound handlers using the properties from constructor
    this.boundGlobalPointerMove = (e) => this.handleGlobalPointerMove(e);
    this.boundGlobalPointerUp = (e) => this.handleGlobalPointerUp(e);
    
    // Attach to document
    document.addEventListener('pointermove', this.boundGlobalPointerMove);
    document.addEventListener('pointerup', this.boundGlobalPointerUp);
  }

  detachGlobalPaintingListeners() {
    if (this.boundGlobalPointerMove) {
      document.removeEventListener('pointermove', this.boundGlobalPointerMove);
      this.boundGlobalPointerMove = null;
    }
    if (this.boundGlobalPointerUp) {
      document.removeEventListener('pointerup', this.boundGlobalPointerUp);
      this.boundGlobalPointerUp = null;
    }
  }

  handleGlobalPointerMove(e) {
    if (!this.isPainting) return;
    
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Continue painting even if coordinates are outside canvas
    this.paintAt(x, y);
  }

  handleGlobalPointerUp(e) {
    if (!this.isPainting) return;
    
    // Only process if it's the same pointer we captured
    if (e.pointerId === this.lastPointerId) {
      this.stopPainting();
    }
  }

  stopPainting() {
    if (!this.isPainting) return;
    
    this.isPainting = false;
    this.canvas.style.cursor = 'crosshair';
    
    // Release pointer capture
    if (this.lastPointerId !== undefined) {
      try {
        this.canvas.releasePointerCapture(this.lastPointerId);
      } catch (e) {
        // Pointer might already be released
      }
      this.lastPointerId = undefined;
    }
    
    // Detach global listeners
    this.detachGlobalPaintingListeners();
    
    // Check completion
    this.checkCompletion();
  }

  updateProgress() {
    const percent = this.storage.calculatePercent(this.puzzle);
    const progressEl = this.element.querySelector('header span');
    if (progressEl) {
      progressEl.textContent = `${percent}%`;
    }
  }

  checkCompletion() {
    // Ne pas célébrer si déjà fait dans cette session
    if (this.hasCelebrated) return;
    
    // Calculer le vrai compte de pixels (pas seulement le pourcentage)
    let totalPixels = 0;
    let paintedPixels = 0;
    
    for (let y = 0; y < this.puzzle.targetGrid.length; y++) {
      for (let x = 0; x < this.puzzle.targetGrid[y].length; x++) {
        if (this.puzzle.targetGrid[y][x] > 0) {
          totalPixels++;
          if (this.puzzle.paintedGrid[y]?.[x] === 1) {
            paintedPixels++;
          }
        }
      }
    }
    
    // Ne célébrer que quand TOUS les pixels sont réellement peints
    if (paintedPixels === totalPixels && totalPixels > 0) {
      this.hasCelebrated = true;
      this.showCompletionCelebration();
    }
  }

  showCompletionCelebration() {
    // Créer le conteneur principal qui capture les clics
    const overlay = document.createElement('div');
    overlay.id = 'completion-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 998;
      cursor: pointer;
    `;
    
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
      pointer-events: none;
    `;
    celebration.textContent = 'Bravo, vous avez terminé !';
    
    const style = document.createElement('style');
    style.textContent = `
      @keyframes celebrate {
        0% { transform: translate(-50%, -50%) scale(0); }
        50% { transform: translate(-50%, -50%) scale(1.2); }
        100% { transform: translate(-50%, -50%) scale(1); }
      }
      
      @keyframes confetti-fall {
        0% {
          transform: translateY(0) rotate(0deg);
          opacity: 1;
        }
        100% {
          transform: translateY(100vh) rotate(720deg);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
    document.body.appendChild(celebration);
    document.body.appendChild(overlay);
    
    this.celebrationOverlay = overlay;
    this.celebrationElement = celebration;
    this.celebrationStyle = style;
    
    // Démarrer la pluie de confettis en continu
    this.startConfettiRain();
    
    // Ajouter le gestionnaire de clic pour fermer
    const closeCelebration = () => {
      this.closeCompletionCelebration();
    };
    
    overlay.addEventListener('click', closeCelebration);
  }

  startConfettiRain() {
    this.confettiInterval = setInterval(() => {
      this.createConfettiBatch();
    }, 500);
  }

  createConfettiBatch() {
    const colors = ['#ff6b35', '#f7931e', '#ffd23f', '#06ffa5', '#3a86ff', '#ff006e', '#8338ec'];
    const confettiCount = 20;
    
    if (!this.celebrationOverlay) return;
    
    for (let i = 0; i < confettiCount; i++) {
      const confetti = document.createElement('div');
      const color = colors[Math.floor(Math.random() * colors.length)];
      const left = Math.random() * 100;
      const duration = 3 + Math.random() * 2;
      const size = 8 + Math.random() * 8;
      
      confetti.style.cssText = `
        position: fixed;
        width: ${size}px;
        height: ${size}px;
        background: ${color};
        left: ${left}%;
        top: -20px;
        border-radius: ${Math.random() > 0.5 ? '50%' : '2px'};
        transform: rotate(${Math.random() * 360}deg);
        animation: confetti-fall ${duration}s ease-out forwards;
        opacity: 1;
        z-index: 999;
        pointer-events: none;
      `;
      
      document.body.appendChild(confetti);
      
      // Nettoyer après l'animation
      setTimeout(() => {
        confetti.remove();
      }, duration * 1000);
    }
  }

  closeCompletionCelebration() {
    // Arrêter la pluie de confettis
    if (this.confettiInterval) {
      clearInterval(this.confettiInterval);
      this.confettiInterval = null;
    }
    
    // Supprimer les éléments
    if (this.celebrationOverlay) {
      this.celebrationOverlay.remove();
      this.celebrationOverlay = null;
    }
    if (this.celebrationElement) {
      this.celebrationElement.remove();
      this.celebrationElement = null;
    }
    if (this.celebrationStyle) {
      this.celebrationStyle.remove();
      this.celebrationStyle = null;
    }
    
    // Supprimer tous les confettis restants
    document.querySelectorAll('[style*="confetti-fall"]').forEach(el => el.remove());
  }

  destroy() {
    // Fermer la célébration si ouverte
    this.closeCompletionCelebration();
    
    // Clean up global painting listeners
    this.detachGlobalPaintingListeners();
    
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
