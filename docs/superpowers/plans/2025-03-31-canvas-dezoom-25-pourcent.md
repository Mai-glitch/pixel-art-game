# Canvas Dézoom jusqu'à 25% Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Permettre de dézoomer jusqu'à 25% tout en maintenant le canvas centré dans la fenêtre.

**Architecture:** Modifier la contrainte minimale de zoom dans CanvasEngine de 1.0 à 0.25, ajuster les mécanismes de centrage pour maintenir le positionnement centré même à bas zoom.

**Tech Stack:** Vanilla JavaScript, Canvas API

---

## File Structure

**Modified Files:**
- `core/CanvasEngine.js` - Modifier les limites de zoom et le centrage
- `components/EditorView.js` - Mettre à jour les contrôles et init

---

### Task 1: Modifier la limite minScale dans CanvasEngine

**Files:**
- Modify: `core/CanvasEngine.js:17-23`

- [ ] **Step 1: Changer minScale de 1.0 à 0.25**

Remplacer les lignes 17-23 par : this.transform = { scale: 1.0, offsetX: 0, offsetY: 0, minScale: 0.25, maxScale: 5.0 };

- [ ] **Step 2: Vérifier**

Run: `grep -n "minScale: 0.25" core/CanvasEngine.js`
Expected: `21:      minScale: 0.25,`

- [ ] **Step 3: Commit**

git add core/CanvasEngine.js && git commit -m "feat: allow zoom down to 25% instead of 100%"

---

### Task 2: Améliorer le centrage dans constrainPan

**Files:**
- Modify: `core/CanvasEngine.js:86-108`

- [ ] **Step 1: Modifier constrainPan pour centrer quand scale < 1**

Remplacer la méthode constrainPan par :
  constrainPan() {
    const scaledWidth = this.canvasWidth * this.transform.scale;
    const scaledHeight = this.canvasHeight * this.transform.scale;
    const rect = this.canvas.getBoundingClientRect();
    
    if (scaledWidth <= rect.width) {
      this.transform.offsetX = (rect.width - scaledWidth) / 2;
    } else {
      this.transform.offsetX = Math.max(
        rect.width - scaledWidth,
        Math.min(0, this.transform.offsetX)
      );
    }
    
    if (scaledHeight <= rect.height) {
      this.transform.offsetY = (rect.height - scaledHeight) / 2;
    } else {
      this.transform.offsetY = Math.max(
        rect.height - scaledHeight,
        Math.min(0, this.transform.offsetY)
      );
    }
  }

- [ ] **Step 2: Commit**

git add core/CanvasEngine.js && git commit -m "feat: center canvas when zoomed out below 100%"

---

### Task 3: Modifier fitCanvasToContainer

**Files:**
- Modify: `components/EditorView.js:347-372`

- [ ] **Step 1: Mettre à jour fitCanvasToContainer pour utiliser minScale**

Remplacer les lignes 362-363 par :
    const scale = Math.min(this.engine.transform.maxScale, availableSpace / optimalSize);
    const newScale = Math.max(this.engine.transform.minScale, scale);

- [ ] **Step 2: Commit**

git add components/EditorView.js && git commit -m "feat: use engine minScale in fitCanvasToContainer"

---

### Task 4: Modifier resetView

**Files:**
- Modify: `components/EditorView.js:279-283`

- [ ] **Step 1: Modifier resetView pour calculer le scale optimal**

Remplacer les lignes 279 par :
  resetView() {
    const canvasContainer = this.element.querySelector('.canvas-container');
    const containerRect = canvasContainer.getBoundingClientRect();
    const availableSpace = Math.min(
      containerRect.width - 32,
      containerRect.height - 32
    );
    
    const optimalSize = this.calculateOptimalCanvasSize();
    const scale = Math.min(1, availableSpace / optimalSize);
    const newScale = Math.max(this.engine.transform.minScale, scale);
    
    this.engine.transform.scale = newScale;
    this.engine.centerCanvas();
    this.updateZoomLabel();
    this.engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
  }

- [ ] **Step 2: Commit**

git add components/EditorView.js && git commit -m "feat: resetView calculates optimal scale instead of defaulting to 100%"

---

### Task 5: Mettre à jour les boutons de zoom

**Files:**
- Modify: `components/EditorView.js:154-159` et `161-166`

- [ ] **Step 1: Modifier zoomOutBtn pour respecter minScale**

Remplacer la création du bouton zoomOutBtn et son listener par :
    const zoomOutBtn = document.createElement('button');
    zoomOutBtn.innerHTML = '-';
    zoomOutBtn.style.cssText = this.getZoomButtonStyle();
    zoomOutBtn.addEventListener('click', () => {
      if (this.engine) {
        const newScale = this.engine.transform.scale - 0.1;
        if (newScale >= this.engine.transform.minScale) {
          this.zoom(-0.1);
        }
      }
    });

- [ ] **Step 2: Modifier zoomInBtn pour respecter maxScale**

Remplacer la création du bouton zoomInBtn et son listener par :
    const zoomInBtn = document.createElement('button');
    zoomInBtn.innerHTML = '+';
    zoomInBtn.style.cssText = this.getZoomButtonStyle();
    zoomInBtn.addEventListener('click', () => {
      if (this.engine) {
        const newScale = this.engine.transform.scale + 0.1;
        if (newScale <= this.engine.transform.maxScale) {
          this.zoom(0.1);
        }
      }
    });

- [ ] **Step 3: Commit**

git add components/EditorView.js && git commit -m "feat: disable zoom buttons at limits (25% min, 500% max)"

---

## Résumé des modifications

1. **CanvasEngine.js:21**: minScale passe de 1.0 à 0.25
2. **CanvasEngine.js:86-108**: constrainPan centre le canvas quand scaledWidth/Height <= rect.width/height
3. **EditorView.js:279-293**: resetView calcule le scale optimal au lieu de 1.0
4. **EditorView.js:362-363**: fitCanvasToContainer utilise this.engine.transform.minScale
5. **EditorView.js:154-159**: zoomOutBtn vérifie minScale avant de zoomer
6. **EditorView.js:161-166**: zoomInBtn vérifie maxScale avant de zoomer

Ces modifications permettent :
- Dézoom jusqu'à 25%
- Canvas toujours centré dans la fenêtre
- Les boutons respectent les limites
- Le reset recalcule le zoom optimal
