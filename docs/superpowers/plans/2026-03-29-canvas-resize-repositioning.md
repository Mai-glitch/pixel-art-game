# Canvas Resize Repositioning Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Faire en sorte que le canvas se repositionne correctement au resize de la page pour rester visible et centré dans le container.

**Architecture:** Modifier la fonction `fitCanvasToContainer()` dans `EditorView.js` pour recalculer non seulement la taille et le scale, mais aussi recentrer le canvas dans le container après un redimensionnement. Ajouter une méthode `centerCanvas()` dans `CanvasEngine` pour réinitialiser les offsets.

**Tech Stack:** JavaScript, Canvas API

---

## File Structure

**Modified Files:**
- `core/CanvasEngine.js:36-40` - Ajouter méthode `centerCanvas()` pour réinitialiser les offsets
- `components/EditorView.js:333-352` - Modifier `fitCanvasToContainer()` pour appeler le centrage après resize

---

### Task 1: Add centerCanvas Method to CanvasEngine

**Files:**
- Modify: `core/CanvasEngine.js:36-40` (après resetView)

- [ ] **Step 1: Ajouter la méthode centerCanvas**

Ajouter après la méthode `resetView()` (ligne 40):

```javascript
  centerCanvas() {
    // Reset offsets to center the canvas in the viewport
    this.transform.offsetX = 0;
    this.transform.offsetY = 0;
    this.constrainPan();
  }
```

- [ ] **Step 2: Commit**

```bash
git add core/CanvasEngine.js
git commit -m "feat: add centerCanvas method to reset canvas position"
```

---

### Task 2: Update fitCanvasToContainer to Center on Resize

**Files:**
- Modify: `components/EditorView.js:333-352`

- [ ] **Step 1: Modifier fitCanvasToContainer**

Remplacer la fonction (lignes 333-352) par:

```javascript
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
```

- [ ] **Step 2: Commit**

```bash
git add components/EditorView.js
git commit -m "fix: center canvas on resize to keep it visible"
```

---

### Task 3: Test the Resize Behavior

**Files:**
- Test: Visual/manual testing

- [ ] **Step 1: Lancer l'application**

```bash
# Si vous avez un serveur de développement
python3 -m http.server 8000
# ou
npx serve .
```

- [ ] **Step 2: Tester le resize**

1. Ouvrir un puzzle dans l'éditeur
2. Redimensionner la fenêtre du navigateur (agrandir/rétrécir)
3. Vérifier que le canvas reste centré et visible
4. Vérifier sur desktop (large) et mobile (étroit)

- [ ] **Step 3: Commit**

```bash
git commit --allow-empty -m "test: verify canvas repositioning on resize"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- ✓ Canvas se repositionne au resize - Task 2
- ✓ Centre correctement dans le container - Task 2 avec centerCanvas()
- ✓ Fonctionne sur desktop et mobile - Responsive par défaut

**2. Placeholder scan:**
- ✓ Aucun TBD/TODO
- ✓ Code complet fourni
- ✓ Commandes exactes

**3. Type consistency:**
- ✓ Méthode centerCanvas() cohérente avec l'existant
- ✓ Appel correct depuis fitCanvasToContainer()

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-03-29-canvas-resize-repositioning.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
