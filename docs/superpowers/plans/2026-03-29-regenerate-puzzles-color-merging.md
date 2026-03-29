# Regenerate Puzzles with Aggressive Color Merging Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Régénérer les 10 puzzles à partir des images dans `/images` avec un maximum de 16 couleurs où les couleurs très proches sont regroupées sous une même couleur.

**Architecture:** Le script `build-puzzles.js` utilise déjà k-means pour quantifier les couleurs. Pour rendre le clustering plus aggressif, nous allons ajouter une étape de fusion post-kMeans qui regroupe les centroids similaires selon un seuil de distance colorimétrique, puis réassigne les pixels aux nouvelles couleurs fusionnées.

**Tech Stack:** Node.js, k-means clustering, color distance calculation

---

## File Structure

**Modified Files:**
- `scripts/utils/kMeans.js:1-129` - Ajouter fonction `mergeSimilarColors()` pour fusionner les couleurs proches
- `scripts/build-puzzles.js:1-164` - Modifier `convertImageToPuzzle()` pour utiliser la fusion de couleurs

**Generated Files:**
- `data/defaultPuzzles.json` - Puzzles régénérés avec le nouveau clustering

---

### Task 1: Add Color Merging Function to kMeans Module

**Files:**
- Modify: `scripts/utils/kMeans.js:124-129`
- Test: Aucun test existant pour ce module

- [ ] **Step 1: Ajouter la fonction `mergeSimilarColors` dans kMeans.js**

Ajouter après la fonction `rgbToHex` et avant `module.exports`:

```javascript
/**
 * Merge colors that are too similar to each other
 * @param {Array<{r: number, g: number, b: number}>} colors - Array of colors
 * @param {number} threshold - Distance threshold for merging (default: 30)
 * @returns {Array<{r: number, g: number, b: number}>} Merged colors
 */
function mergeSimilarColors(colors, threshold = 30) {
  if (colors.length <= 3) {
    return colors;
  }

  const merged = [];
  const used = new Set();

  for (let i = 0; i < colors.length; i++) {
    if (used.has(i)) continue;

    let color = { ...colors[i] };
    const group = [color];

    for (let j = i + 1; j < colors.length; j++) {
      if (used.has(j)) continue;

      const dist = colorDistance(color, colors[j]);
      if (dist < threshold) {
        group.push(colors[j]);
        used.add(j);
      }
    }

    // Calculate average of merged group
    if (group.length > 1) {
      color = {
        r: Math.round(group.reduce((sum, c) => sum + c.r, 0) / group.length),
        g: Math.round(group.reduce((sum, c) => sum + c.g, 0) / group.length),
        b: Math.round(group.reduce((sum, c) => sum + c.b, 0) / group.length)
      };
    }

    merged.push(color);
  }

  return merged;
}
```

- [ ] **Step 2: Exporter la nouvelle fonction**

Modifier le `module.exports` à la fin du fichier:

```javascript
module.exports = {
  kMeans,
  colorDistance,
  findClosestColor,
  rgbToHex,
  mergeSimilarColors
};
```

- [ ] **Step 3: Commit**

```bash
git add scripts/utils/kMeans.js
git commit -m "feat: add color merging function for aggressive palette reduction"
```

---

### Task 2: Update build-puzzles.js to Use Color Merging

**Files:**
- Modify: `scripts/build-puzzles.js:1-5`
- Modify: `scripts/build-puzzles.js:20-30`

- [ ] **Step 1: Importer `mergeSimilarColors`**

Modifier l'importation:

```javascript
const { kMeans, findClosestColor, rgbToHex, mergeSimilarColors } = require('./utils/kMeans.js');
```

- [ ] **Step 2: Modifier `convertImageToPuzzle` pour fusionner les couleurs**

Remplacer la section de génération de palette (lignes 20-30) par:

```javascript
  // Get palette using k-means (limit to MAX_COLORS)
  const kMeansResult = kMeans(opaquePixels, MAX_COLORS);
  
  // Merge similar colors to create more distinct palette
  const mergedColors = mergeSimilarColors(kMeansResult, 35); // Threshold of 35 for aggressive merging
  
  // Ensure we don't exceed MAX_COLORS after merging
  let finalColors = mergedColors;
  if (finalColors.length > MAX_COLORS) {
    // If still too many colors after merging, run k-means again
    finalColors = kMeans(finalColors, MAX_COLORS);
  }
  
  const palette = finalColors.map(rgbToHex);

  // Ensure minimum 3 colors
  while (palette.length < 3) {
    palette.push('#808080');
  }
```

- [ ] **Step 3: Commit**

```bash
git add scripts/build-puzzles.js
git commit -m "feat: apply aggressive color merging in puzzle generation"
```

---

### Task 3: Regenerate All Puzzles

**Files:**
- Generate: `data/defaultPuzzles.json`

- [ ] **Step 1: Exécuter le script de génération**

```bash
node scripts/build-puzzles.js
```

Expected output:
```
Building puzzles...

Found 10 images to process
Processing: basketball.png
  ✓ basketball.png -> Basketball (X colors)
Processing: burger.jpeg
  ✓ burger.jpeg -> Burger (Y colors)
...
Successfully processed 10/10 images

✓ Output written to: /Users/mickaelross/devX/test-supapowa/data/defaultPuzzles.json

Puzzles generated:
  1. Basketball (N colors)
  2. Burger (N colors)
  3. Cat (N colors)
  4. Dog (N colors)
  5. Duck (N colors)
  6. Joker (N colors)
  7. Pokemon 1 (N colors)
  8. Pokemon 2 (N colors)
  9. Pokemon 3 (N colors)
  10. Star Wars (N colors)
```

- [ ] **Step 2: Vérifier que tous les puzzles ont été générés**

```bash
node -e "const puzzles = require('./data/defaultPuzzles.json'); console.log('Total puzzles:', puzzles.length); puzzles.forEach(p => console.log(p.name, '-', p.palette.length, 'colors'));"
```

Expected output:
```
Total puzzles: 10
Basketball - N colors
Burger - N colors
Cat - N colors
Dog - N colors
Duck - N colors
Joker - N colors
Pokemon 1 - N colors
Pokemon 2 - N colors
Pokemon 3 - N colors
Star Wars - N colors
```

- [ ] **Step 3: Commit**

```bash
git add data/defaultPuzzles.json
git commit -m "chore: regenerate all 10 puzzles with aggressive color merging"
```

---

## Self-Review Checklist

**1. Spec coverage:**
- ✓ Régénérer 10 puzzles à partir des images dans `/images` - Task 3
- ✓ Maximum 16 couleurs - La logique de fusion + limite k-means garantit ≤ 16
- ✓ Couleurs très proches regroupées - `mergeSimilarColors()` avec seuil de 35

**2. Placeholder scan:**
- ✓ Aucun TBD/TODO
- ✓ Code complet fourni pour chaque étape
- ✓ Commandes exactes avec output attendu

**3. Type consistency:**
- ✓ Fonction `mergeSimilarColors` utilise les mêmes types que `kMeans`
- ✓ Retourne `Array<{r: number, g: number, b: number}>` comme attendu

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-03-29-regenerate-puzzles-color-merging.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** - I dispatch a fresh subagent per task, review between tasks, fast iteration

**2. Inline Execution** - Execute tasks in this session using executing-plans, batch execution with checkpoints

Which approach?
