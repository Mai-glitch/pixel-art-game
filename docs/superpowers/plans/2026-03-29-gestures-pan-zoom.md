# Gestures Pan/Zoom Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ajouter le pinch-to-zoom et le double-clic pour zoomer en mode 'pan', en plus des boutons +/- existants.

**Architecture:** Utiliser l'API Pointer Events déjà en place pour détecter le pinch (2 doigts) et ajouter un écouteur dblclick pour le double-clic. Le zoom utilisera la méthode `engine.zoom()` existante.

**Tech Stack:** Vanilla JavaScript ES6 modules, HTML5 Canvas API, CSS3

---

## File Structure

| File | Responsibility |
|------|---------------|
| `/Users/mickaelross/devX/test-supapowa/components/EditorView.js` | Gestion des événements tactiles (pinch) et double-clic, mise à jour UI |
| `/Users/mickaelross/devX/test-supapowa/styles.css` | Aucune modification nécessaire (touch-action: none déjà présent) |

---

### Task 1: Double-click to Zoom

**Files:**
- Modify: `/Users/mickaelross/devX/test-supapowa/components/EditorView.js:447-465` (après l'écouteur wheel)
- Test: À tester manuellement (double-clic sur le canvas en mode pan)

- [ ] **Step 1: Ajouter l'écouteur dblclick dans setupEventListeners**

Ajouter après l'écouteur wheel (ligne 464) :

```javascript
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
```

- [ ] **Step 2: Commit**

```bash
git add components/EditorView.js
git commit -m "feat: add double-click to zoom in pan mode"
```

---

### Task 2: Pinch-to-Zoom Implementation

**Files:**
- Modify: `/Users/mickaelross/devX/test-supapowa/components/EditorView.js` (ajout gestionnaire de gestes)

**Choix technique:** Utiliser touch events (touchstart, touchmove, touchend) pour détecter le pinch avec 2 doigts. L'API Pointer Events ne gère pas nativement les gestes multi-touch comme le pinch.

- [ ] **Step 1: Ajouter les propriétés de suivi du pinch dans le constructeur**

Modifier le constructor (après la ligne 18) :

```javascript
    this.currentMode = 'draw';
    this.pinchState = {
      isPinching: false,
      startDistance: 0,
      startScale: 1,
      centerX: 0,
      centerY: 0
    };
```

- [ ] **Step 2: Ajouter les méthodes utilitaires pour le pinch**

Ajouter après la méthode `zoom()` (après la ligne 245) :

```javascript
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
```

- [ ] **Step 3: Ajouter les écouteurs touch events dans setupEventListeners**

Ajouter à la fin de la méthode `setupEventListeners()` (après l'écouteur resize, ligne 470) :

```javascript
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
```

- [ ] **Step 4: Commit**

```bash
git add components/EditorView.js
git commit -m "feat: add pinch-to-zoom gesture support in pan mode"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- ✅ Double-click pour zoomer - Task 1
- ✅ Pinch avec 2 doigts pour zoomer/dézoomer - Task 2
- ✅ Fonctionne uniquement en mode 'pan' (vérifié avec `this.currentMode !== 'pan'` dans tous les écouteurs)

**2. Placeholder scan:**
- ✅ Aucun "TBD", "TODO", ou code incomplet
- ✅ Code complet fourni pour chaque étape
- ✅ Pas de référence à des méthodes inexistantes

**3. Type consistency:**
- ✅ `this.engine.zoom()` signature compatible (delta, x, y)
- ✅ `this.updateZoomLabel()` existe déjà
- ✅ `this.engine.transform.scale` propriété existante

---

## Testing Manual

1. Ouvrir l'éditeur et basculer en mode 'pan'
2. **Test double-clic:** Double-cliquer sur le canvas → zoom avant de 30%
3. **Test pinch:** 
   - Sur mobile ou avec devtools en mode device
   - Poser 2 doigts et les écarter → zoom avant
   - Rapprocher les doigts → zoom arrière
4. Vérifier que les boutons +/- continuent de fonctionner
5. Vérifier que la molette continue de fonctionner
6. Vérifier qu'en mode 'draw', ni le pinch ni le double-clic ne fonctionnent

---

**Plan complet et sauvegardé dans `docs/superpowers/plans/2026-03-29-gestures-pan-zoom.md`.**

**Deux options d'implémentation :**

**1. Subagent-Driven (recommandé)** - Je dispatche un subagent frais par tâche, revue entre tâches, itération rapide

**2. Inline Execution** - Exécuter les tâches dans cette session, exécution par lots avec checkpoints

**Quelle approche préfères-tu ?**