# Canvas Responsive - Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rendre le canvas du puzzle éditeur responsive qui occupe le maximum d'espace disponible à l'écran et s'adapte au redimensionnement de la fenêtre.

**Architecture:** Modifier `CanvasEngine` pour supporter le redimensionnement dynamique du canvas et adapter `EditorView` pour calculer la taille optimale basée sur le container réel, tout en ajoutant un listener de redimensionnement pour maintenir le canvas responsive.

**Tech Stack:** JavaScript vanilla, CSS, HTML5 Canvas

---

## Fichier Structure

- **Modifier:** `core/CanvasEngine.js` - Ajouter méthode de redimensionnement
- **Modifier:** `components/EditorView.js` - Calcul taille dynamique + resize handler
- **Modifier:** `styles.css` - Styles responsive pour le canvas

---

### Task 1: Ajouter la méthode resize dans CanvasEngine

**Files:**
- Modify: `core/CanvasEngine.js`
- Test: Manuel - vérifier que le canvas se redimensionne

- [ ] **Step 1: Ajouter méthode `resize()` dans CanvasEngine**

Dans `core/CanvasEngine.js`, ajouter une méthode pour redimensionner le canvas:

```javascript
resize(newSize) {
  this.baseSize = newSize;
  this.pixelSize = this.baseSize / this.gridSize;
  this.canvas.width = this.baseSize;
  this.canvas.height = this.baseSize;
  // Garder le max-width pour ne pas dépasser sur petits écrans
  this.canvas.style.maxWidth = `${newSize}px`;
}
```

À ajouter après la méthode `setupCanvas()` (après ligne 26).

- [ ] **Step 2: Tester que la méthode existe**

Pas de test automatisé pour cette feature visuelle.
Vérification manuelle: s'assurer que le code se charge sans erreur.

- [ ] **Step 3: Commit**

```bash
git add core/CanvasEngine.js
git commit -m "feat: add resize method to CanvasEngine"
```

---

### Task 2: Modifier EditorView pour calculer la taille optimale

**Files:**
- Modify: `components/EditorView.js`

- [ ] **Step 1: Extraire la logique de calcul de taille dans une méthode**

Dans `components/EditorView.js`, créer une méthode `calculateOptimalCanvasSize()`:

```javascript
calculateOptimalCanvasSize() {
  const canvasContainer = this.element.querySelector('.canvas-container');
  if (!canvasContainer) return 512;
  
  const containerRect = canvasContainer.getBoundingClientRect();
  // Soustraire le padding (16px de chaque côté)
  const availableWidth = containerRect.width - 32;
  const availableHeight = containerRect.height - 32;
  
  // Prendre la dimension la plus petite pour garder le ratio carré
  const minDimension = Math.min(availableWidth, availableHeight);
  
  // Limiter entre 256px (minimum utilisable) et 1024px (maximum)
  return Math.max(256, Math.min(1024, Math.floor(minDimension)));
}
```

À ajouter après la méthode `renderCanvasArea()` (après ligne 128).

- [ ] **Step 2: Modifier renderCanvasArea pour utiliser la nouvelle méthode**

Remplacer le `setTimeout` existant (lignes 121-127) par:

```javascript
// Auto-fit to container on load
setTimeout(() => {
  this.fitCanvasToContainer();
}, 0);
```

- [ ] **Step 3: Créer la méthode fitCanvasToContainer**

Ajouter la méthode `fitCanvasToContainer()`:

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
  this.engine.transform.scale = Math.max(0.5, scale);
  
  this.engine.render(this.puzzle.targetGrid, this.puzzle.paintedGrid, this.puzzle.palette);
}
```

À ajouter après `calculateOptimalCanvasSize()`.

- [ ] **Step 4: Commit**

```bash
git add components/EditorView.js
git commit -m "feat: calculate optimal canvas size based on container"
```

---

### Task 3: Ajouter le handler de redimensionnement de fenêtre

**Files:**
- Modify: `components/EditorView.js`

- [ ] **Step 1: Ajouter le listener resize dans setupEventListeners**

Dans `setupEventListeners()` (après ligne 305, avant la fermeture de la méthode), ajouter:

```javascript
// Handle window resize
this.resizeHandler = () => {
  this.fitCanvasToContainer();
};
window.addEventListener('resize', this.resizeHandler);
```

- [ ] **Step 2: Modifier destroy() pour nettoyer le listener**

Dans `destroy()` (lignes 368-373), remplacer par:

```javascript
destroy() {
  if (this.resizeHandler) {
    window.removeEventListener('resize', this.resizeHandler);
  }
  if (this.element) {
    this.element.remove();
    this.element = null;
  }
}
```

- [ ] **Step 3: Stocker le resizeHandler dans le constructeur**

Dans le constructeur (après ligne 16), ajouter:

```javascript
this.resizeHandler = null;
```

- [ ] **Step 4: Commit**

```bash
git add components/EditorView.js
git commit -m "feat: add responsive resize handler"
```

---

### Task 4: Mettre à jour les styles CSS pour supporter le responsive

**Files:**
- Modify: `styles.css`

- [ ] **Step 1: Ajouter styles pour le canvas-container et canvas**

Dans `styles.css`, après la ligne 98, ajouter:

```css
/* Canvas responsive styles */
.canvas-container {
  flex: 1;
  display: flex;
  justify-content: center;
  align-items: center;
  overflow: hidden;
}

.canvas-container canvas {
  max-width: 100%;
  max-height: 100%;
  width: auto;
  height: auto;
}

/* Ensure canvas takes full available space on desktop */
@media (min-width: 1024px) {
  #editor-view {
    height: 100vh;
    max-height: 100vh;
  }
  
  .canvas-container {
    flex: 1;
    min-height: 0; /* Important pour que flex fonctionne correctement */
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add styles.css
git commit -m "feat: add responsive styles for canvas"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- Canvas prend le maximum de l'écran ✅
- Responsive au redimensionnement ✅
- Maintient le ratio carré ✅
- Fonctionne sur mobile et desktop ✅

**2. Placeholder scan:**
- Tous les codes sont complets ✅
- Pas de "TBD" ou "TODO" ✅
- Pas de "similar to Task X" ✅

**3. Type consistency:**
- `fitCanvasToContainer` utilisé dans Task 2 et 3 ✅
- `resizeHandler` utilisé dans Task 3 ✅
- Méthodes cohérentes avec CanvasEngine ✅

---

## Test Manuel

Après implémentation:
1. Ouvrir un puzzle dans l'éditeur
2. Vérifier que le canvas occupe le maximum d'espace disponible
3. Redimensionner la fenêtre du navigateur
4. Vérifier que le canvas s'adapte automatiquement
5. Tester sur mobile (mode responsive du navigateur)
6. Vérifier que le zoom et le pan fonctionnent toujours correctement

---

## Commandes de vérification

```bash
# Vérifier qu'il n'y a pas d'erreurs de syntaxe
npm run lint 2>/dev/null || echo "Pas de linter configuré"

# Ouvrir le fichier dans un navigateur et tester manuellement
```
