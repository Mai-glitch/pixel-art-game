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

  loadHomeView() {
    this.app.innerHTML = '<div id="home-view">Home View Placeholder</div>';
  }

  loadEditorView(puzzleId) {
    this.app.innerHTML = `<div id="editor-view">Editor View: ${puzzleId}</div>`;
  }
}

new PixelArtApp();
