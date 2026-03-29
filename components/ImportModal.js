import { ImageConverter } from '../core/ImageConverter.js';
import { PuzzleStorage } from '../core/PuzzleStorage.js';

export class ImportModal {
  constructor(container) {
    this.container = container;
    this.converter = new ImageConverter();
    this.storage = new PuzzleStorage();
    this.element = null;
    this.selectedFile = null;
    this.previewImage = null;
  }

  mount() {
    this.element = document.createElement('div');
    this.element.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.8);
      display: flex;
      justify-content: center;
      align-items: center;
      z-index: 1000;
      padding: 20px;
    `;
    
    const modal = document.createElement('div');
    modal.style.cssText = `
      background: var(--bg-card);
      border-radius: 16px;
      padding: 32px;
      max-width: 500px;
      width: 100%;
      max-height: 90vh;
      overflow-y: auto;
    `;
    
    const title = document.createElement('h2');
    title.textContent = 'Import Image';
    title.style.cssText = `
      margin: 0 0 24px 0;
      font-size: 24px;
    `;
    
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.accept = 'image/*';
    fileInput.style.cssText = `
      width: 100%;
      padding: 12px;
      margin-bottom: 24px;
      background: rgba(255,255,255,0.1);
      border: 2px dashed var(--accent-primary);
      border-radius: 8px;
      color: white;
      cursor: pointer;
    `;
    
    fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
    
    const preview = document.createElement('div');
    preview.id = 'import-preview';
    preview.style.cssText = `
      margin-bottom: 24px;
      text-align: center;
    `;
    
    const nameInput = document.createElement('input');
    nameInput.type = 'text';
    nameInput.placeholder = 'Puzzle name (optional)';
    nameInput.style.cssText = `
      width: 100%;
      padding: 12px;
      margin-bottom: 24px;
      background: rgba(255,255,255,0.1);
      border: 1px solid rgba(255,255,255,0.2);
      border-radius: 8px;
      color: white;
      font-size: 16px;
    `;
    
    const buttons = document.createElement('div');
    buttons.style.cssText = `
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    `;
    
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Cancel';
    cancelBtn.style.cssText = `
      background: rgba(255,255,255,0.1);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
    `;
    cancelBtn.addEventListener('click', () => this.close());
    
    const importBtn = document.createElement('button');
    importBtn.textContent = 'Import';
    importBtn.id = 'import-btn';
    importBtn.disabled = true;
    importBtn.style.cssText = `
      background: var(--accent-primary);
      color: white;
      border: none;
      padding: 12px 24px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 16px;
      font-weight: 600;
      opacity: 0.5;
    `;
    importBtn.addEventListener('click', () => this.importPuzzle(nameInput.value));
    
    buttons.appendChild(cancelBtn);
    buttons.appendChild(importBtn);
    
    modal.appendChild(title);
    modal.appendChild(fileInput);
    modal.appendChild(preview);
    modal.appendChild(nameInput);
    modal.appendChild(buttons);
    
    this.element.appendChild(modal);
    this.container.appendChild(this.element);
    
    // Close on backdrop click
    this.element.addEventListener('click', (e) => {
      if (e.target === this.element) {
        this.close();
      }
    });
  }

  handleFileSelect(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    this.selectedFile = file;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      this.previewImage = event.target.result;
      this.updatePreview();
    };
    reader.readAsDataURL(file);
  }

  updatePreview() {
    const preview = this.element.querySelector('#import-preview');
    preview.innerHTML = '';
    
    const img = document.createElement('img');
    img.src = this.previewImage;
    img.style.cssText = `
      max-width: 200px;
      max-height: 200px;
      border-radius: 8px;
    `;
    
    preview.appendChild(img);
    
    const importBtn = this.element.querySelector('#import-btn');
    importBtn.disabled = false;
    importBtn.style.opacity = '1';
  }

  async importPuzzle(name) {
    if (!this.selectedFile) return;
    
    const importBtn = this.element.querySelector('#import-btn');
    importBtn.disabled = true;
    importBtn.textContent = 'Processing...';
    
    try {
      const puzzle = await this.converter.convertImage(this.selectedFile, name || this.selectedFile.name);
      this.storage.save(puzzle);
      window.location.hash = `#editor/${puzzle.id}`;
      this.close();
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import image. Please try another file.');
      importBtn.disabled = false;
      importBtn.textContent = 'Import';
    }
  }

  close() {
    window.location.hash = '#home';
  }

  destroy() {
    if (this.element) {
      this.element.remove();
      this.element = null;
    }
  }
}
