# Canvas Pan Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter un système de mode (dessin/pan) avec zoom contrôlé uniquement en mode PAN

**Architecture:** Utiliser une state machine simple à deux états (`this.currentMode = 'draw' | 'pan'`) dans EditorView. Le CanvasEngine reste inchangé. Router les interactions différemment selon le mode.

**Tech Stack:** Vanilla JS, Pointer Events, HTML5 Canvas

**Spec Reference:** `docs/superpowers/specs/2025-03-29-canvas-pan-mode-design.md`

---

### Task 1: Ajouter les contrôles UI (Mode Switcher + Zoom Controls)

**Files:**
- Modify: `components/EditorView.js:44-88` (renderHeader method)
- Modify: `components/EditorView.js:15-17` (constructor - ajouter state)

**État à ajouter dans le constructor:**

- [ ] **Step 1: Ajouter le state dans le constructor**

Ajouter dans `EditorView.constructor` après la ligne 16:
```javascript
    this.currentMode = 'draw';
```

- [ ] **Step 2: Modifier renderHeader pour ajouter les contrôles**

Modifier `renderHeader()` pour remplacer la section après `appendChild(progress)` par:
```javascript
    // Mode Switcher
    const modeControls = document.createElement('div');
    modeControls.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
    `;
    
    const drawBtn = document.createElement('button');
    drawBtn.textContent = '🖌️ Dessin';
    drawBtn.className = 'mode-btn mode-draw';
    drawBtn.style.cssText = this.getModeButtonStyle('draw');
    drawBtn.addEventListener('click', () => this.setMode('draw'));
    
    const panBtn = document.createElement('button');
    panBtn.textContent = '✋ Déplacer';
    panBtn.className = 'mode-btn mode-pan';
    panBtn.style.cssText = this.getModeButtonStyle('pan');
    panBtn.addEventListener('click', () => this.setMode('pan'));
    
    modeControls.appendChild(drawBtn);
    modeControls.appendChild(panBtn);
    
    // Zoom Controls (only visible in pan mode)
    const zoomControls = document.createElement('div');
    zoomControls.className = 'zoom-controls';
    zoomControls.style.cssText = `
      display: flex;
      gap: 8px;
      align-items: center;
      margin-left: 16px;
      opacity: 0.5;
      pointer-events: none;
    `;
    
    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.textContent = '-';
    zoomOutBtn.style.cssText = this.getZoomButtonStyle();
    zoomOutBtn.addEventListener('click', () => this.zoom(-0.1));
    
    const zoomLabel = document.createElement('span');
    zoomLabel.className = 'zoom-label';
    zoomLabel.textContent = '100%';
    zoomLabel.style.cssText = 'color: white; font-weight: 600; min-width: 50px; text-align: center;';
    
    const zoomInBtn = document.createElement('button');
    zoomInBtn.textContent = '+';
    zoomInBtn.style.cssText = this.getZoomButtonStyle();
    zoomInBtn.addEventListener('click', () => this.zoom(0.1));
    
    const resetBtn = document.createElement('button');
    resetBtn.textContent = '⟲';
    resetBtn.style.cssText = this.getZoomButtonStyle();
    resetBtn.addEventListener('click', () => this.resetView());
    
    zoomControls.appendChild(zoomOutBtn);
    zoomControls.appendChild(zoomLabel);
    zoomControls.appendChild(zoomInBtn);
    zoomControls.appendChild(resetBtn);
    
    // Wrapper pour les contrôles
    const controlsWrapper = document.createElement('div');
    controlsWrapper.style.cssText = `
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    controlsWrapper.appendChild(modeControls);
    controlsWrapper.appendChild(zoomControls);
    
    header.appendChild(backBtn);
    header.appendChild(title);
    header.appendChild(progress);
    header.appendChild(controlsWrapper);
```

- [ ] **Step 3: Ajouter les méthodes utilitaires de style**

Ajouter ces méthodes dans la classe `EditorView`:
```javascript
  getModeButtonStyle(mode) {
    const isActive = this.currentMode === mode;
    return `
      background: ${isActive ? '#ffffff' : 'rgba(255,255,255,0.1)'};
      color: ${isActive ? '#1a1a2e' : '#ffffff'};
      border: none;
      padding: 8px 16px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      transition: all 0.2s ease;
    `;
  }
  
  getZoomButtonStyle() {
    return `
      background: rgba(255,255,255,0.1);
      color: white;
      border: none;
      padding: 8px 12px;
      border-radius: 6px;
      cursor: pointer;
      font-weight: 600;
      min-width: 36px;
    `;
  }
```

- [ ] **Step 4: Vérifier que le header s'affiche avec les nouveaux boutons**

Lancer l'app et vérifier que les boutons "🖌️ Dessin" et "✋ Déplacer" apparaissent dans le header.

- [ ] **Step 5: Commit**

```bash
git add components/EditorView.js
git commit -m "feat: add mode switcher and zoom controls UI"
```

---

### Task 2: Implémenter le changement de mode

**Files:**
- Modify: `components/EditorView.js` (ajouter méthodes setMode, updateModeUI)

- [ ] **Step 1: Ajouter la méthode setMode**

Ajouter dans la classe `EditorView`:
```javascript
  setMode(mode) {
    if (this.currentMode === mode) return;
    
    // Cancel any ongoing actions
    this.isPainting = false;
    this.isDragging = false;
    this.lastMousePos = null;
    
    this.currentMode = mode;
    this.updateModeUI();
    this.updateZoomControls();
    
    // Update cursor
    this.canvas.style.cursor = mode === 'draw' ? 'crosshair' : 'grab';
  }
```

- [ ] **Step 2: Ajouter updateModeUI**

```javascript
  updateModeUI() {
    const drawBtn = this.element.querySelector('.mode-draw');
    const panBtn = this.element.querySelector('.mode-pan');
    
    if (drawBtn) drawBtn.style.cssText = this.getModeButtonStyle('draw');
    if (panBtn) panBtn.style.cssText = this.getModeButtonStyle('pan');
  }
```

- [ ] **Step 3: Ajouter updateZoomControls**

```javascript
  updateZoomControls() {
    const zoomControls = this.element.querySelector('.zoom-controls');
    if (zoomControls) {
      const isPanMode = this.currentMode === 'pan';
      zoomControls.style.opacity = isPanMode ? '1' : '0.5';
      zoomControls.style.pointerEvents = isPanMode ? 'auto' : 'none';
    }
  }
```

- [ ] **Step 4: Tester le changement de mode**

Cliquer sur "Déplacer" et vérifier:
- Le bouton "✋ Déplacer" devient blanc avec texte noir
- Le bouton "🖌️ Dessin" devient semi-transparent
- Les contrôles zoom deviennent opaques et cliquables

- [ ] **Step 5: Commit**

```bash
git add components/EditorView.js
git commit -m "feat: implement mode switching with UI updates"
```

---

### Task 3: Implémenter le routing des interactions par mode

**Files:**
- Modify: `components/EditorView.js:221-330` (setupEventListeners)

- [ ] **Step 1: Refactoriser pointerdown**

Remplacer le handler `pointerdown` (lignes 226-243) par:
```javascript
    this.canvas.addEventListener('pointerdown', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (this.currentMode === 'pan') {
        // PAN MODE: Any click starts panning
        isPanning = true;
        lastX = e.clientX;
        lastY = e.clientY;
        this.canvas.style.cursor = 'grabbing';
      } else {
        // DRAW MODE: Left click paints
        if (e.button === 0) {
          isPainting = true;
          this.paintAt(x, y);
        }
      }
    });
```

- [ ] **Step 2: Refactoriser pointermove**

Remplacer le handler `pointermove` (lignes 245-261) par:
```javascript
    this.canvas.addEventListener('pointermove', (e) => {
      e.preventDefault();
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      if (this.currentMode === 'pan') {
        // PAN MODE
        if (isPanning) {
          const dx = e.clientX - lastX;
          const dy = e.clientY - lastY;
          this.engine.pan(dx, dy);
          lastX = e.clientX;
          lastY = e.clientY;
          this.engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
        }
      } else {
        // DRAW MODE
        if (isPainting) {
          this.paintAt(x, y);
        }
      }
    });
```

- [ ] **Step 3: Refactoriser pointerup/pointerleave**

Remplacer les handlers (lignes 263-274) par:
```javascript
    this.canvas.addEventListener('pointerup', () => {
      if (this.currentMode === 'pan') {
        isPanning = false;
        this.canvas.style.cursor = 'grab';
      } else {
        isPainting = false;
        this.canvas.style.cursor = 'crosshair';
        this.checkCompletion();
      }
    });
    
    this.canvas.addEventListener('pointerleave', () => {
      if (this.currentMode === 'pan') {
        isPanning = false;
        this.canvas.style.cursor = 'grab';
      } else {
        isPainting = false;
        this.canvas.style.cursor = 'crosshair';
      }
    });
```

- [ ] **Step 4: Refactoriser wheel pour n'agir qu'en mode PAN**

Remplacer le handler `wheel` (lignes 280-289) par:
```javascript
    this.canvas.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (this.currentMode !== 'pan') return; // Only zoom in pan mode
      
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const delta = e.deltaY > 0 ? -0.1 : 0.1;
      
      this.engine.zoom(delta, x, y);
      this.updateZoomLabel();
      this.engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
    }, { passive: false });
```

- [ ] **Step 5: Supprimer les vieux event listeners de pan**

Supprimer le bloc de code qui gère le middle/right click + shift (lignes 232-243 dans le code original) car c'est remplacé par le mode switcher.

- [ ] **Step 6: Commit**

```bash
git add components/EditorView.js
git commit -m "feat: route interactions based on current mode"
```

---

### Task 4: Implémenter les controles de zoom

**Files:**
- Modify: `components/EditorView.js` (ajouter méthodes zoom, resetView, updateZoomLabel)

- [ ] **Step 1: Ajouter la méthode zoom**

```javascript
  zoom(delta) {
    // Get canvas center for zoom
    const rect = this.canvas.getBoundingClientRect();
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    
    this.engine.zoom(delta, centerX, centerY);
    this.updateZoomLabel();
    this.engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
  }
```

- [ ] **Step 2: Ajouter resetView**

```javascript
  resetView() {
    this.engine.resetView();
    this.updateZoomLabel();
    this.engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
  }
```

- [ ] **Step 3: Ajouter updateZoomLabel**

```javascript
  updateZoomLabel() {
    const zoomLabel = this.element.querySelector('.zoom-label');
    if (zoomLabel) {
      const percent = Math.round(this.engine.transform.scale * 100);
      zoomLabel.textContent = `${percent}%`;
    }
  }
```

- [ ] **Step 4: Tester les controles de zoom**

En mode PAN, tester:
- Bouton "-" diminue le zoom (centre du canvas)
- Bouton "+" augmente le zoom (centre du canvas)
- Label affiche le pourcentage correct
- Bouton "⟲" reset à 100% et centre
- Scroll wheel zoom à la position du curseur

- [ ] **Step 5: Commit**

```bash
git add components/EditorView.js
git commit -m "feat: implement zoom controls functionality"
```

---

### Task 5: Gestion du mode lors du resize et affichage initial

**Files:**
- Modify: `components/EditorView.js` (mount et fitCanvasToContainer)

- [ ] **Step 1: Mettre à jour mount pour définir le curseur initial**

Dans `mount()`, après `setupEventListeners()`, ajouter:
```javascript
    // Set initial cursor based on default mode
    this.canvas.style.cursor = 'crosshair';
```

- [ ] **Step 2: S'assurer que le zoom controls est initialisé correctement**

Dans `mount()`, après `setupEventListeners()`, ajouter:
```javascript
    // Initialize zoom controls visibility
    this.updateZoomControls();
```

- [ ] **Step 3: Commit final**

```bash
git add components/EditorView.js
git commit -m "feat: initialize mode and cursor on mount"
```

---

### Task 6: Tests manuels et validation

**Test Checklist:**

- [ ] **Test 1: Mode Dessin**
  - Cliquer sur un pixel le colore
  - Drag dessine une ligne de pixels
  - Zoom controls sont désactivés (opacity 0.5, pas cliquables)
  - Wheel scroll ne fait rien
  - Curseur est `crosshair`

- [ ] **Test 2: Switch vers Mode PAN**
  - Cliquer sur "✋ Déplacer" change le mode
  - Bouton devient actif (style blanc)
  - Zoom controls deviennent actifs
  - Curseur devient `grab`

- [ ] **Test 3: Mode PAN - Déplacement**
  - Click+drag déplace le canvas
  - Le canvas reste dans les limites (constrainPan)
  - Relâcher remet le curseur à `grab`

- [ ] **Test 4: Mode PAN - Zoom**
  - Boutons +/- zooment de 10%
  - Label affiche le bon pourcentage
  - Wheel zoom à la position du curseur
  - Pinch 2 doigts fonctionne sur mobile
  - Reset (⟲) remet à 100% et centre

- [ ] **Test 5: Edge Cases**
  - Changer de mode pendant un drag: l'action en cours s'arrête proprement
  - Redimensionner la fenêtre: le canvas s'adapte, le mode reste actif

---

## Self-Review Checklist

**Spec Coverage:**
- ✅ Mode switcher UI avec 2 boutons
- ✅ Zoom controls avec 4 boutons et label
- ✅ State management (`this.currentMode`)
- ✅ Routing des pointer events par mode
- ✅ Zoom uniquement en mode PAN
- ✅ Curseurs appropriés (crosshair/grab/grabbing)
- ✅ Méthodes utilitaires (zoom, resetView, updateZoomLabel)

**No Placeholders:** All steps have complete code

**Type Consistency:** All method signatures and usages match
