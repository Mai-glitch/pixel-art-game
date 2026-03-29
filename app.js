import { HomeView } from './components/HomeView.js';
import { EditorView } from './components/EditorView.js';
import { PuzzleStorage } from './core/PuzzleStorage.js';

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
    const view = new EditorView(this.app, puzzleId);
    this.currentView = view;
    await view.mount();
  }
}

new PixelArtApp();
