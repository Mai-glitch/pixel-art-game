# Homepage Puzzle Colors - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Afficher les puzzles sur la page d'accueil avec leurs couleurs originales en opacité réduite (au lieu de gris)

**Architecture:** Ajouter un mode de rendu "homepage" à CanvasEngine qui garde les couleurs originales mais avec une opacité réduite. Le mode éditeur reste inchangé (gris pour non peint). PuzzleCard utilisera ce nouveau mode de rendu.

**Tech Stack:** Vanilla JavaScript ES6 modules

---

## File Structure

**Files to modify:**
- `/Users/mickaelross/devX/test-supapowa/core/CanvasEngine.js` (lines 83-138): Ajouter paramètre de mode de rendu + méthode d'opacité couleur
- `/Users/mickaelross/devX/test-supapowa/components/PuzzleCard.js` (line 42): Passer mode "homepage" au rendu

---

### Task 1: Add render mode support and color opacity helper

**Files:**
- Modify: `/Users/mickaelross/devX/test-supapowa/core/CanvasEngine.js:83-138`

**Current code analysis:**
- Ligne 83-89: `desaturateColor(hex, opacity = 0.3)` - convertit en gris
- Ligne 91-101: `render()` - méthode principale de rendu
- Ligne 116-117: `desaturateColor()` appliqué aux pixels non peints

**Plan:**
1. Ajouter méthode `applyColorOpacity(hex, opacity)` pour garder les couleurs RGB mais réduire alpha
2. Modifier `render()` pour accepter paramètre `renderMode = 'editor'`
3. Dans drawGrid, selon mode: 'editor' → gris (actuel), 'homepage' → couleurs + opacité

```javascript
// À ajouter après desaturateColor (ligne 89)
applyColorOpacity(hex, opacity = 0.4) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}
```

```javascript
// Modifier render() signature (ligne 91)
render(targetGrid, paintedGrid, palette, renderMode = 'editor') {
  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
  this.ctx.save();
  this.ctx.translate(this.transform.offsetX, this.transform.offsetY);
  this.ctx.scale(this.transform.scale, this.transform.scale);
  this.drawGrid(targetGrid, paintedGrid, palette, renderMode);
  this.ctx.restore();
}
```

```javascript
// Modifier drawGrid signature (ligne 103)
drawGrid(targetGrid, paintedGrid, palette, renderMode = 'editor') {
  for (let y = 0; y < this.gridSize; y++) {
    for (let x = 0; x < this.gridSize; x++) {
      const targetColor = targetGrid[y]?.[x] || 0;
      const isPainted = paintedGrid[y]?.[x] === 1;
      const pixelX = x * this.pixelSize;
      const pixelY = y * this.pixelSize;

      if (targetColor > 0) {
        if (isPainted) {
          this.ctx.fillStyle = palette[targetColor - 1];
          this.ctx.fillRect(pixelX, pixelY, this.pixelSize, this.pixelSize);
        } else {
          // Mode spécifique
          if (renderMode === 'homepage') {
            // Homepage: couleurs originales avec opacité
            const fadedColor = this.applyColorOpacity(palette[targetColor - 1]);
            this.ctx.fillStyle = fadedColor;
            this.ctx.fillRect(pixelX, pixelY, this.pixelSize, this.pixelSize);
          } else {
            // Editor (défaut): gris desaturé
            const desaturated = this.desaturateColor(palette[targetColor - 1]);
            this.ctx.fillStyle = desaturated;
            this.ctx.fillRect(pixelX, pixelY, this.pixelSize, this.pixelSize);

            // Numéros de couleur seulement en mode editor
            this.ctx.fillStyle = '#ffffff';
            this.ctx.font = `bold ${this.pixelSize * 0.5}px sans-serif`;
            this.ctx.textAlign = 'center';
            this.ctx.textBaseline = 'middle';
            this.ctx.fillText(
              targetColor.toString(),
              pixelX + this.pixelSize / 2,
              pixelY + this.pixelSize / 2
            );
          }
        }
      }
      this.ctx.strokeStyle = '#4a1c4a';
      this.ctx.lineWidth = 1;
      this.ctx.strokeRect(pixelX, pixelY, this.pixelSize, this.pixelSize);
    }
  }
}
```

- [ ] **Step 1: Add applyColorOpacity helper method (after line 89)**

```javascript
  applyColorOpacity(hex, opacity = 0.4) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${opacity})`;
  }
```

- [ ] **Step 2: Modify render() signature (line 91)**

Remplacer:
```javascript
  render(targetGrid, paintedGrid, palette) {
```

Par:
```javascript
  render(targetGrid, paintedGrid, palette, renderMode = 'editor') {
```

- [ ] **Step 3: Update drawGrid call in render() (line 98)**

Remplacer:
```javascript
    this.drawGrid(targetGrid, paintedGrid, palette);
```

Par:
```javascript
    this.drawGrid(targetGrid, paintedGrid, palette, renderMode);
```

- [ ] **Step 4: Modify drawGrid() signature (line 103)**

Remplacer:
```javascript
  drawGrid(targetGrid, paintedGrid, palette) {
```

Par:
```javascript
  drawGrid(targetGrid, paintedGrid, palette, renderMode = 'editor') {
```

- [ ] **Step 5: Implement render mode logic in drawGrid() (lines 116-129)**

Remplacer les lignes 116-129 par:

```javascript
          } else {
            if (renderMode === 'homepage') {
              const fadedColor = this.applyColorOpacity(palette[targetColor - 1]);
              this.ctx.fillStyle = fadedColor;
              this.ctx.fillRect(pixelX, pixelY, this.pixelSize, this.pixelSize);
            } else {
              const desaturated = this.desaturateColor(palette[targetColor - 1]);
              this.ctx.fillStyle = desaturated;
              this.ctx.fillRect(pixelX, pixelY, this.pixelSize, this.pixelSize);

              this.ctx.fillStyle = '#ffffff';
              this.ctx.font = `bold ${this.pixelSize * 0.5}px sans-serif`;
              this.ctx.textAlign = 'center';
              this.ctx.textBaseline = 'middle';
              this.ctx.fillText(
                targetColor.toString(),
                pixelX + this.pixelSize / 2,
                pixelY + this.pixelSize / 2
              );
            }
          }
```

- [ ] **Step 6: Commit changes**

```bash
git add core/CanvasEngine.js
git commit -m "feat: add render mode support for homepage puzzle display"
```

---

### Task 2: Update PuzzleCard to use homepage render mode

**Files:**
- Modify: `/Users/mickaelross/devX/test-supapowa/components/PuzzleCard.js:42`

**Current code (line 42):**
```javascript
    engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
```

**Changes needed:**
1. Pass 'homepage' as 4ème argument à render()

- [ ] **Step 1: Update render call with homepage mode (line 42)**

Remplacer:
```javascript
    engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
```

Par:
```javascript
    engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette, 'homepage');
```

- [ ] **Step 2: Commit changes**

```bash
git add components/PuzzleCard.js
git commit -m "feat: render puzzle cards with original colors and reduced opacity"
```

---

### Task 3: Verify editor mode unchanged

**Files:**
- Check: `/Users/mickaelross/devX/test-supapowa/components/EditorView.js`

**Verification steps:**
- [ ] **Step 1: Verify EditorView uses default render mode**

Rechercher dans EditorView.js les appels à engine.render() pour s'assurer qu'ils n'ont pas de 4ème argument (donc utilisent 'editor' par défaut).

```bash
grep -n "engine.render" components/EditorView.js
```

**Expected:** Les appels n'ont que 3 arguments (targetGrid, paintedGrid, palette), pas de 4ème argument.

Si des appels avec le 4ème argument existent, ils DOIVENT rester sans argument pour garder 'editor' comme défaut.

- [ ] **Step 2: Test manually (if environment supports)**

Ouvrir l'application et vérifier:
1. Page d'accueil: puzzles en couleurs avec opacité réduite
2. Éditeur: pixels non peints restent gris avec numéros

---

## Summary of Changes

| File | Lines | Change |
|------|-------|--------|
| `core/CanvasEngine.js` | 90-91 | Add `applyColorOpacity()` helper |
| `core/CanvasEngine.js` | 91-101 | Update `render()` signature + pass renderMode |
| `core/CanvasEngine.js` | 103-138 | Update `drawGrid()` with mode-specific rendering |
| `components/PuzzleCard.js` | 42 | Pass 'homepage' mode to render() |

**Visual result:**
- **Before:** Puzzles sur homepage = gris avec 30% opacité
- **After:** Puzzles sur homepage = couleurs originales avec 40% opacité
- **Editor remains:** Gris avec numéros pour pixels non peints
