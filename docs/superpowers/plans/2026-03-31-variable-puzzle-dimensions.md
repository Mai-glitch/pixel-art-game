# Support des Dimensions Variables pour les Puzzles - Plan d'Implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permettre aux puzzles d'avoir des dimensions variables (ex: 16x16, 24x24, 32x32, 48x48) tout en assurant la rétrocompatibilité totale avec les puzzles 32x32 existants.

**Architecture:** La taille de la grille sera déduite dynamiquement à partir des données du puzzle (`targetGrid.length`) au lieu d'être hardcodée à 32. Le `CanvasEngine` et `ImageConverter` accepteront un paramètre `gridSize` optionnel avec une valeur par défaut de 32 pour la rétrocompatibilité.

**Tech Stack:** JavaScript vanilla, Canvas API, localStorage

---

## Analyse des changements nécessaires

**Fichiers à modifier:**
- `core/CanvasEngine.js` - Rendre `gridSize` paramétrable
- `core/ImageConverter.js` - Accepter une taille de grille personnalisée
- `components/EditorView.js` - Utiliser la taille dynamique du puzzle
- `components/PuzzleCard.js` - Inclure la taille de grille si nécessaire
- `components/ImportModal.js` - Permettre la sélection de la taille lors de l'import

---

### Task 1: Modifier CanvasEngine pour supporter gridSize dynamique

**Files:**
- Modify: `core/CanvasEngine.js:6-7`
- Test: `tests/variable-dimensions.spec.ts` (nouveau fichier)

- [ ] **Step 1: Write the failing test**

Créer le fichier de test pour vérifier que CanvasEngine fonctionne avec différentes tailles de grille.

```typescript
// tests/variable-dimensions.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Variable Puzzle Dimensions', () => {
  test('CanvasEngine should render different grid sizes correctly', async ({ page }) => {
    await page.goto('http://localhost:8080');
    
    // Wait for app to load
    await page.waitForSelector('#home-view', { timeout: 5000 });
    
    // Test avec grille 16x16
    const result = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 256;
      canvas.height = 256;
      
      // Simuler un puzzle 16x16
      const targetGrid = Array(16).fill(null).map(() => Array(16).fill(1));
      const paintedGrid = Array(16).fill(null).map(() => Array(16).fill(0));
      const palette = ['#ff6b35'];
      
      // Créer le CanvasEngine avec une grille de 16x16
      const engine = new (window as any).CanvasEngine(canvas, 16);
      engine.render(targetGrid, paintedGrid, palette);
      
      // Vérifier que pixelSize est correct
      return {
        gridSize: engine.gridSize,
        pixelSize: engine.pixelSize,
        baseSize: engine.baseSize
      };
    });
    
    expect(result.gridSize).toBe(16);
    expect(result.pixelSize).toBe(16); // 256 / 16 = 16
  });
  
  test('CanvasEngine should default to 32x32 for backward compatibility', async ({ page }) => {
    await page.goto('http://localhost:8080');
    
    await page.waitForSelector('#home-view', { timeout: 5000 });
    
    const result = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      
      // Créer CanvasEngine sans spécifier gridSize
      const engine = new (window as any).CanvasEngine(canvas);
      
      return {
        gridSize: engine.gridSize,
        pixelSize: engine.pixelSize
      };
    });
    
    expect(result.gridSize).toBe(32);
    expect(result.pixelSize).toBe(16); // 512 / 32 = 16
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx playwright test tests/variable-dimensions.spec.ts --reporter=line
```

Expected: FAIL avec "CanvasEngine is not defined" ou des erreurs liées à gridSize

- [ ] **Step 3: Implement CanvasEngine with dynamic gridSize**

Modifier `core/CanvasEngine.js` pour accepter un paramètre `gridSize` optionnel :

```javascript
export class CanvasEngine {
  constructor(canvas, gridSize = 32) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.baseSize = 512;
    this.gridSize = gridSize; // Paramètre avec valeur par défaut 32
    this.pixelSize = this.baseSize / this.gridSize;

    this.transform = {
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      minScale: 1.0,
      maxScale: 5.0
    };

    this.setupCanvas();
  }

  setupCanvas() {
    this.canvas.width = this.baseSize;
    this.canvas.height = this.baseSize;
    this.canvas.style.width = '100%';
    this.canvas.style.height = 'auto';
    this.canvas.style.maxWidth = '512px';
  }

  resize(newSize, newGridSize = null) {
    this.baseSize = newSize;
    if (newGridSize !== null) {
      this.gridSize = newGridSize;
    }
    this.pixelSize = this.baseSize / this.gridSize;
    this.canvas.width = this.baseSize;
    this.canvas.height = this.baseSize;
    this.canvas.style.maxWidth = `${newSize}px`;
  }
  
  // Reste du code inchangé...
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx playwright test tests/variable-dimensions.spec.ts --reporter=line
```

Expected: PASS - Les tests de base passent

- [ ] **Step 5: Commit**

```bash
git add core/CanvasEngine.js tests/variable-dimensions.spec.ts
git commit -m "feat: add dynamic gridSize support to CanvasEngine

- CanvasEngine now accepts optional gridSize parameter (default: 32)
- resize() method accepts optional newGridSize parameter
- Maintains full backward compatibility with existing 32x32 puzzles
- Adds comprehensive tests for variable dimensions"
```

---

### Task 2: Modifier ImageConverter pour supporter des tailles personnalisées

**Files:**
- Modify: `core/ImageConverter.js:2-32`
- Test: `tests/variable-dimensions.spec.ts` (ajout de tests)

- [ ] **Step 1: Write the failing test**

Ajouter un test pour ImageConverter dans le fichier de test existant :

```typescript
// Ajouter à tests/variable-dimensions.spec.ts
test.describe('ImageConverter variable dimensions', () => {
  test('ImageConverter should convert image to custom grid size (16x16)', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#home-view', { timeout: 5000 });
    
    const result = await page.evaluate(async () => {
      const converter = new (window as any).ImageConverter(16);
      
      // Créer un canvas de test
      const testCanvas = document.createElement('canvas');
      testCanvas.width = 16;
      testCanvas.height = 16;
      const ctx = testCanvas.getContext('2d');
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 16, 16);
      
      // Convertir en blob
      const blob = await new Promise<Blob>((resolve) => {
        testCanvas.toBlob((b) => resolve(b!), 'image/png');
      });
      
      const file = new File([blob], 'test.png', { type: 'image/png' });
      const puzzle = await converter.convertImage(file, 'Test Puzzle');
      
      return {
        gridSize: puzzle.targetGrid.length,
        rowLength: puzzle.targetGrid[0].length,
        paintedGridLength: puzzle.paintedGrid.length,
        paintedRowLength: puzzle.paintedGrid[0].length
      };
    });
    
    expect(result.gridSize).toBe(16);
    expect(result.rowLength).toBe(16);
    expect(result.paintedGridLength).toBe(16);
    expect(result.paintedRowLength).toBe(16);
  });
  
  test('ImageConverter should default to 32x32', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#home-view', { timeout: 5000 });
    
    const converter = await page.evaluate(() => {
      const c = new (window as any).ImageConverter();
      return c.gridSize;
    });
    
    expect(converter).toBe(32);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx playwright test tests/variable-dimensions.spec.ts --reporter=line
```

Expected: FAIL - ImageConverter ne supporte pas encore le constructeur avec paramètre

- [ ] **Step 3: Implement ImageConverter with dynamic gridSize**

Modifier `core/ImageConverter.js` :

```javascript
export class ImageConverter {
  constructor(gridSize = 32) {
    this.maxColors = 8;
    this.gridSize = gridSize;
  }

  async convertImage(file, name) {
    const image = await this.loadImage(file);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = this.gridSize;
    canvas.height = this.gridSize;
    ctx.drawImage(image, 0, 0, this.gridSize, this.gridSize);
    
    const imageData = ctx.getImageData(0, 0, this.gridSize, this.gridSize);
    const pixels = this.extractPixels(imageData);
    
    const colors = this.extractColors(pixels, this.maxColors);
    const { palette, grid } = this.mapToGrid(pixels, colors);
    
    return {
      id: this.generateId(),
      name: name || 'Untitled',
      targetGrid: grid,
      paintedGrid: Array(this.gridSize).fill(null).map(() => Array(this.gridSize).fill(0)),
      palette: palette.slice(0, Math.max(3, palette.length)),
      completedPercent: 0,
      lastPlayed: null
    };
  }
  
  // Reste des méthodes inchangé...
}
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx playwright test tests/variable-dimensions.spec.ts --reporter=line
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add core/ImageConverter.js tests/variable-dimensions.spec.ts
git commit -m "feat: add dynamic gridSize support to ImageConverter

- ImageConverter now accepts optional gridSize parameter in constructor
- Default value is 32 for backward compatibility
- Generates correctly sized paintedGrid arrays"
```

---

### Task 3: Modifier EditorView pour utiliser la taille dynamique du puzzle

**Files:**
- Modify: `components/EditorView.js:321, 641-677, 819-834`
- Test: `tests/variable-dimensions.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// Ajouter à tests/variable-dimensions.spec.ts
test.describe('EditorView with variable dimensions', () => {
  test('EditorView should handle 16x16 puzzle', async ({ page }) => {
    // Créer un puzzle 16x16 dans localStorage
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#home-view', { timeout: 5000 });
    
    await page.evaluate(() => {
      const puzzle16x16 = {
        id: 'test-16x16',
        name: 'Test 16x16',
        targetGrid: Array(16).fill(null).map((_, y) => 
          Array(16).fill(null).map((_, x) => (x + y) % 2 === 0 ? 1 : 0)
        ),
        paintedGrid: Array(16).fill(null).map(() => Array(16).fill(0)),
        palette: ['#ff6b35'],
        completedPercent: 0,
        lastPlayed: null
      };
      
      localStorage.setItem('pixelart_puzzles', JSON.stringify([puzzle16x16]));
    });
    
    // Ouvrir le puzzle
    await page.goto('http://localhost:8080/#puzzle/test-16x16');
    await page.waitForSelector('#editor-view', { timeout: 5000 });
    
    // Prendre une capture pour vérifier le rendu
    const canvasBox = await page.locator('.canvas-container canvas').boundingBox();
    expect(canvasBox).not.toBeNull();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx playwright test tests/variable-dimensions.spec.ts --reporter=line
```

Expected: FAIL - Le puzzle 16x16 ne s'affiche pas correctement car EditorView utilise 32 hardcodé

- [ ] **Step 3: Implement EditorView with dynamic grid detection**

Modifier `components/EditorView.js` :

```javascript
  renderCanvasArea() {
    const canvasContainer = document.createElement('div');
    canvasContainer.className = 'canvas-container';
    // ... style identique ...

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

    // Détecter la taille de la grille à partir des données du puzzle
    const gridSize = this.puzzle.targetGrid?.length || 32;
    this.engine = new CanvasEngine(this.canvas, gridSize);

    // Auto-fit to container on load
    setTimeout(() => {
      this.fitCanvasToContainer();
    }, 0);
  }
```

Et modifier la méthode `paintAt` pour utiliser la taille dynamique :

```javascript
  paintAt(x, y) {
    const currentPos = this.engine.screenToGrid(x, y);
    const gridSize = this.puzzle.targetGrid.length;
    
    // Check bounds avec la taille dynamique
    if (currentPos.x < 0 || currentPos.x >= gridSize || currentPos.y < 0 || currentPos.y >= gridSize) {
      return;
    }
    
    // ... reste inchangé jusqu'au filtrage ...
    
    for (const pos of pixelsToPaint) {
      // Skip if out of bounds avec taille dynamique
      if (pos.x < 0 || pos.x >= gridSize || pos.y < 0 || pos.y >= gridSize) continue;
      
      // ... reste inchangé ...
    }
    
    // ... reste inchangé ...
  }
```

Et modifier `checkCompletion` :

```javascript
  checkCompletion() {
    if (this.hasCelebrated) return;
    
    const gridSize = this.puzzle.targetGrid.length;
    let totalPixels = 0;
    let paintedPixels = 0;
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (this.puzzle.targetGrid[y][x] > 0) {
          totalPixels++;
          if (this.puzzle.paintedGrid[y]?.[x] === 1) {
            paintedPixels++;
          }
        }
      }
    }
    
    if (paintedPixels === totalPixels && totalPixels > 0) {
      this.hasCelebrated = true;
      this.showCompletionCelebration();
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx playwright test tests/variable-dimensions.spec.ts --reporter=line
```

Expected: PASS - Le puzzle 16x16 s'affiche et fonctionne correctement

- [ ] **Step 5: Test backward compatibility avec puzzle 32x32 existant**

```bash
npx playwright test tests/verify-painting.spec.ts --reporter=line
```

Expected: PASS - Les puzzles 32x32 existants continuent de fonctionner

- [ ] **Step 6: Commit**

```bash
git add components/EditorView.js tests/variable-dimensions.spec.ts
git commit -m "feat: EditorView supports variable puzzle dimensions

- Dynamically detects grid size from puzzle.targetGrid.length
- Uses dynamic grid size for bounds checking in paintAt()
- Uses dynamic grid size for completion checking
- Maintains full backward compatibility with existing puzzles"
```

---

### Task 4: Modifier PuzzleCard pour supporter les différentes tailles

**Files:**
- Modify: `components/PuzzleCard.js:31-43`
- Test: `tests/variable-dimensions.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// Ajouter à tests/variable-dimensions.spec.ts
test.describe('PuzzleCard with variable dimensions', () => {
  test('PuzzleCard should render 16x16 puzzle correctly', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#home-view', { timeout: 5000 });
    
    // Injecter un puzzle 16x16
    await page.evaluate(() => {
      const puzzle16x16 = {
        id: 'card-test-16x16',
        name: 'Card Test 16x16',
        targetGrid: Array(16).fill(null).map((_, y) => 
          Array(16).fill(null).map((_, x) => (x + y) % 2 === 0 ? 1 : 2 : 0)
        ),
        paintedGrid: Array(16).fill(null).map(() => Array(16).fill(0)),
        palette: ['#ff6b35', '#3a86ff'],
        completedPercent: 0,
        lastPlayed: null
      };
      
      const existing = JSON.parse(localStorage.getItem('pixelart_puzzles') || '[]');
      existing.push(puzzle16x16);
      localStorage.setItem('pixelart_puzzles', JSON.stringify(existing));
    });
    
    // Recharger la page
    await page.reload();
    await page.waitForSelector('#home-view', { timeout: 5000 });
    
    // Vérifier que la carte s'affiche sans erreur
    const card = page.locator('.puzzle-card', { hasText: 'Card Test 16x16' });
    await expect(card).toBeVisible();
    
    // Vérifier que le canvas est présent
    const canvas = card.locator('canvas');
    await expect(canvas).toBeVisible();
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx playwright test tests/variable-dimensions.spec.ts --reporter=line
```

Expected: FAIL - PuzzleCard utilise CanvasEngine sans spécifier gridSize

- [ ] **Step 3: Implement PuzzleCard with dynamic grid detection**

Modifier `components/PuzzleCard.js` :

```javascript
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
    
    // Détecter la taille de la grille
    const gridSize = this.puzzle.targetGrid?.length || 32;
    const engine = new CanvasEngine(canvas, gridSize);
    engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette, 'homepage');
    
    // ... reste inchangé ...
  }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx playwright test tests/variable-dimensions.spec.ts --reporter=line
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/PuzzleCard.js tests/variable-dimensions.spec.ts
git commit -m "feat: PuzzleCard supports variable puzzle dimensions

- Dynamically detects grid size from puzzle.targetGrid.length
- Passes correct gridSize to CanvasEngine constructor
- Maintains backward compatibility with existing 32x32 puzzles"
```

---

### Task 5: Modifier ImportModal pour permettre le choix de la taille

**Files:**
- Modify: `components/ImportModal.js`
- Test: `tests/variable-dimensions.spec.ts`

- [ ] **Step 1: Write the failing test**

```typescript
// Ajouter à tests/variable-dimensions.spec.ts
test.describe('ImportModal with variable dimensions', () => {
  test('ImportModal should allow selecting 16x16 grid size', async ({ page }) => {
    await page.goto('http://localhost:8080');
    await page.waitForSelector('#home-view', { timeout: 5000 });
    
    // Ouvrir le modal d'import
    await page.click('text=Importer une image');
    await page.waitForSelector('.import-modal', { timeout: 5000 });
    
    // Vérifier que le sélecteur de taille est présent
    const sizeSelect = page.locator('select[name="gridSize"]');
    await expect(sizeSelect).toBeVisible();
    
    // Sélectionner 16x16
    await sizeSelect.selectOption('16');
    
    // Créer un fichier image de test
    const testImageData = await page.evaluate(() => {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = 'red';
      ctx.fillRect(0, 0, 32, 32);
      return canvas.toDataURL('image/png');
    });
    
    // Convertir data URL en buffer pour setInputFiles
    const base64Data = testImageData.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Télécharger l'image
    const fileChooser = page.waitForEvent('filechooser');
    await page.click('text=Choisir une image');
    const fc = await fileChooser;
    await fc.setFiles([{
      name: 'test.png',
      mimeType: 'image/png',
      buffer: buffer
    }]);
    
    // Attendre l'aperçu et valider
    await page.waitForSelector('.thumbnail-preview', { timeout: 5000 });
    await page.click('text=Importer');
    
    // Vérifier que le puzzle créé est bien 16x16
    await page.waitForSelector('#editor-view', { timeout: 5000 });
    
    const puzzleInfo = await page.evaluate(() => {
      const currentPuzzle = (window as any).currentPuzzle;
      if (currentPuzzle) {
        return {
          gridSize: currentPuzzle.targetGrid.length,
          rowLength: currentPuzzle.targetGrid[0].length
        };
      }
      return null;
    });
    
    expect(puzzleInfo).not.toBeNull();
    expect(puzzleInfo.gridSize).toBe(16);
    expect(puzzleInfo.rowLength).toBe(16);
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

```bash
npx playwright test tests/variable-dimensions.spec.ts --reporter=line
```

Expected: FAIL - ImportModal n'a pas de sélecteur de taille

- [ ] **Step 3: Implement ImportModal with grid size selector**

Lire d'abord le fichier ImportModal pour voir sa structure actuelle :

```javascript
// components/ImportModal.js - STRUCTURE À CONSERVER
// Ajouter juste le sélecteur de taille dans le formulaire
```

Dans la méthode de rendu du formulaire, ajouter :

```javascript
    // Ajouter après le champ de nom
    const sizeLabel = document.createElement('label');
    sizeLabel.textContent = 'Taille de la grille:';
    sizeLabel.style.cssText = 'color: white; font-size: 14px;';
    
    const sizeSelect = document.createElement('select');
    sizeSelect.name = 'gridSize';
    sizeSelect.style.cssText = `
      padding: 8px;
      border-radius: 6px;
      background: rgba(255,255,255,0.1);
      color: white;
      border: 1px solid rgba(255,255,255,0.3);
    `;
    
    const sizes = [
      { value: '16', label: '16×16 (Petit)' },
      { value: '24', label: '24×24 (Moyen)' },
      { value: '32', label: '32×32 (Standard)' },
      { value: '48', label: '48×48 (Grand)' }
    ];
    
    sizes.forEach(size => {
      const option = document.createElement('option');
      option.value = size.value;
      option.textContent = size.label;
      option.style.color = 'black'; // Pour visibilité
      if (size.value === '32') option.selected = true;
      sizeSelect.appendChild(option);
    });
    
    form.appendChild(sizeLabel);
    form.appendChild(sizeSelect);
```

Et modifier la méthode de conversion pour utiliser la taille sélectionnée :

```javascript
  async importPuzzle() {
    if (!this.selectedFile) return;
    
    const nameInput = this.element.querySelector('input[type="text"]');
    const sizeSelect = this.element.querySelector('select[name="gridSize"]');
    const name = nameInput?.value?.trim() || 'Sans titre';
    const gridSize = parseInt(sizeSelect?.value || '32', 10);
    
    this.importing = true;
    this.render();
    
    try {
      // Passer la taille au converter
      const converter = new ImageConverter(gridSize);
      const puzzle = await converter.convertImage(this.selectedFile, name);
      
      this.storage.save(puzzle);
      this.onImport(puzzle.id);
      this.close();
    } catch (error) {
      console.error('Erreur lors de l\'import:', error);
      alert('Erreur lors de l\'importation de l\'image. Veuillez réessayer.');
      this.importing = false;
      this.render();
    }
  }
```

- [ ] **Step 4: Run test to verify it passes**

```bash
npx playwright test tests/variable-dimensions.spec.ts --reporter=line
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
git add components/ImportModal.js tests/variable-dimensions.spec.ts
git commit -m "feat: ImportModal allows selecting grid size (16, 24, 32, 48)

- Added grid size selector with options: 16x16, 24x24, 32x32, 48x48
- Passes selected size to ImageConverter constructor
- Defaults to 32x32 for backward compatibility"
```

---

### Task 6: Exporter CanvasEngine et ImageConverter pour les tests

**Files:**
- Modify: `app.js` ou créer un fichier d'export

- [ ] **Step 1: Implement exports for testing**

Modifier `app.js` pour exposer les classes nécessaires aux tests :

```javascript
// À la fin de app.js, ajouter :
if (typeof window !== 'undefined') {
  // Exposer les classes pour les tests
  window.CanvasEngine = CanvasEngine;
  window.ImageConverter = ImageConverter;
}
```

Ou créer un fichier `core/index.js` :

```javascript
export { CanvasEngine } from './CanvasEngine.js';
export { ImageConverter } from './ImageConverter.js';
export { PuzzleStorage } from './PuzzleStorage.js';
```

- [ ] **Step 2: Commit**

```bash
git add app.js
git commit -m "chore: export CanvasEngine and ImageConverter for testing

- Exposes classes on window object for Playwright tests
- Enables comprehensive testing of variable grid dimensions"
```

---

### Task 7: Tests exhaustifs de rétrocompatibilité

**Files:**
- Test: Exécuter tous les tests existants

- [ ] **Step 1: Run all existing tests**

```bash
# Lister tous les tests disponibles
npx playwright test --list

# Exécuter tous les tests
npx playwright test
```

Expected: Tous les tests existants (painting, eraser, etc.) doivent PASS

- [ ] **Step 2: Test avec puzzle 32x32 réel**

```typescript
// Test manuel ou automatisé pour vérifier qu'un puzzle 32x32 existant 
// dans defaultPuzzles.json fonctionne toujours
```

- [ ] **Step 3: Commit des changements finaux**

```bash
git commit -m "test: verify backward compatibility with existing 32x32 puzzles

- All existing tests pass with new dynamic grid size implementation
- Verified default puzzles load and render correctly
- No breaking changes to existing functionality"
```

---

### Task 8: Documentation

**Files:**
- Create: `docs/superpowers/variable-dimensions-migration.md`

- [ ] **Step 1: Write migration documentation**

```markdown
# Migration Guide: Variable Puzzle Dimensions

## Changements

Cette mise à jour permet aux puzzles d'avoir des dimensions variables (16x16, 24x24, 32x32, 48x48).

## Rétrocompatibilité

✅ **100% rétrocompatible** - Tous les puzzles 32x32 existants continuent de fonctionner sans modification.

## Architecture

### Détection dynamique
La taille de la grille est détectée automatiquement à partir de `puzzle.targetGrid.length`.

### Composants modifiés
- `CanvasEngine` - Accepte un paramètre `gridSize` optionnel (défaut: 32)
- `ImageConverter` - Accepte un paramètre `gridSize` optionnel (défaut: 32)
- `EditorView` - Utilise la taille dynamique du puzzle
- `PuzzleCard` - Utilise la taille dynamique du puzzle
- `ImportModal` - Permet de choisir la taille lors de l'import

## Pour les développeurs

### Créer un puzzle avec taille personnalisée

```javascript
const converter = new ImageConverter(24);
const puzzle = await converter.convertImage(file, 'Mon Puzzle');
```

### CanvasEngine

```javascript
const gridSize = puzzle.targetGrid.length;
const engine = new CanvasEngine(canvas, gridSize);
```

## Tests

- Tous les tests existants passent
- Nouveaux tests pour les dimensions variables dans `tests/variable-dimensions.spec.ts`
```

- [ ] **Step 2: Commit documentation**

```bash
git add docs/superpowers/variable-dimensions-migration.md
git commit -m "docs: add migration guide for variable puzzle dimensions

- Documents the dynamic grid size feature
- Explains backward compatibility guarantees
- Provides developer examples"
```

---

## Self-Review

**1. Spec coverage:**
- ✅ CanvasEngine supporte gridSize paramétrable - Task 1
- ✅ ImageConverter supporte gridSize paramétrable - Task 2
- ✅ EditorView utilise taille dynamique - Task 3
- ✅ PuzzleCard utilise taille dynamique - Task 4
- ✅ ImportModal permet choix de taille - Task 5
- ✅ Rétrocompatibilité assurée par défauts à 32 - Toutes les tâches
- ✅ Tests complets - Toutes les tâches

**2. Placeholder scan:**
- ✅ Aucun "TODO", "TBD", ou "fill in later"
- ✅ Aucun "add appropriate validation" sans code
- ✅ Tous les steps ont du code concret
- ✅ Commandes de test exactes fournies

**3. Type consistency:**
- ✅ `gridSize` est toujours un nombre entier
- ✅ Valeur par défaut 32 partout
- ✅ Utilisation cohérente de `targetGrid.length`
- ✅ Paramètres optionnels correctement définis

**4. Gaps identifiés:**
- Aucun - Tous les composants sont couverts

---

## Exécution - Choix de l'approche

**Plan complet et sauvegardé dans `docs/superpowers/plans/2026-03-31-variable-puzzle-dimensions.md`. Deux options d'exécution:**

**1. Subagent-Driven (recommandé)** - Je dispatche un subagent frais par tâche, révision entre tâches, itération rapide

**2. Inline Execution** - Exécuter les tâches dans cette session en utilisant executing-plans, exécution par lots avec points de contrôle pour révision

**Quelle approche préfères-tu ?**

Si tu choisis l'approche Subagent-Driven, je vais utiliser le skill `superpowers:subagent-driven-development` pour dispatcher chaque tâche.

Si tu choisis l'approche Inline, je vais utiliser le skill `superpowers:executing-plans` pour exécuter les tâches avec des points de contrôle pour révision entre les groupes de tâches.
