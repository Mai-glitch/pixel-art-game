import { HomeView } from './components/HomeView.js';
import { EditorView } from './components/EditorView.js';
import { ImportModal } from './components/ImportModal.js';
import { PuzzleStorage } from './core/PuzzleStorage.js';
import { CanvasEngine } from './core/CanvasEngine.js';
import { ImageConverter } from './core/ImageConverter.js';

class PixelArtApp {
  constructor() {
    this.app = document.getElementById('app');
    this.currentView = null;
    this.init();
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    this.handleRoute();
  }

  handleRoute() {
    const hash = window.location.hash || '#home';
    const [route, param] = hash.slice(1).split('/');
    
    this.cleanupCurrentView();
    
    switch(route) {
      case 'home':
        this.loadHomeView();
        break;
      case 'editor':
        this.loadEditorView(param);
        break;
      case 'import':
        this.loadImportModal();
        break;
      default:
        this.loadHomeView();
    }
  }

  cleanupCurrentView() {
    if (this.currentView) {
      this.currentView.destroy?.();
      this.currentView = null;
    }
    this.app.innerHTML = '';
  }

  async loadHomeView() {
    const view = new HomeView(this.app);
    this.currentView = view;
    await view.mount();
  }

  async loadEditorView(puzzleId) {
    if (!puzzleId) {
      window.location.hash = '#home';
      return;
    }
    // Decode URL-encoded puzzle ID (e.g., spaces become %20)
    const decodedId = decodeURIComponent(puzzleId);
    const view = new EditorView(this.app, decodedId);
    this.currentView = view;
    await view.mount();
  }

  loadImportModal() {
    const modal = new ImportModal(this.app);
    this.currentView = modal;
    modal.mount();
  }
}

new PixelArtApp();

// Expose classes for testing
if (typeof window !== 'undefined') {
  window.CanvasEngine = CanvasEngine;
  window.ImageConverter = ImageConverter;
}
