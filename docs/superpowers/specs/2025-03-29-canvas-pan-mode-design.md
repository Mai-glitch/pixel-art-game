# Canvas Pan Mode - Design Specification

**Goal:** Ajouter un système de mode (dessin/pan) dans l'éditeur avec zoom contrôlé uniquement en mode PAN.

**Architecture:** Utiliser un state machine simple à deux états (`draw` | `pan`) dans EditorView. Le CanvasEngine reste inchangé - il gère déjà le pan et le zoom. Les interactions sont routées différemment selon le mode actif.

**Tech Stack:** Vanilla JS, HTML5 Canvas, Pointer Events API

---

## 1. UI Components

### 1.1 Mode Switcher Toolbar
Position: Dans le header, à droite du titre

**Éléments:**
- Bouton "Dessin" avec icône 🖌️ (actif par défaut)
- Bouton "Déplacer" avec icône ✋

**Styling:**
- Bouton actif: background blanc, texte noir
- Bouton inactif: background transparent, texte blanc
- Transition douce entre les états

### 1.2 Zoom Controls Toolbar
Position: À côté des boutons de mode (uniquement visible/enabled en mode PAN)

**Éléments:**
- Bouton "-" (zoom out)
- Label "XXX%" (zoom level actuel)
- Bouton "+" (zoom in)
- Bouton "⟲" (reset view)

**Comportement:**
- Incrément: ±10% par clic
- Min zoom: 50%
- Max zoom: 500%
- Reset: remet à 100% et centre le canvas

## 2. State Management

```javascript
// Dans EditorView
this.currentMode = 'draw' | 'pan'  // 'draw' par défaut
this.isPanning = false             // uniquement utilisé en mode 'pan'
this.lastPanPos = { x: 0, y: 0 }   // dernière position pour le calcul delta
```

## 3. Interactions par Mode

### Mode DESSIN (default)
**Pointer Events:**
- `pointerdown` (bouton gauche) → commence le dessin
- `pointermove` (pendant drag) → continue le dessin sur les pixels survolés
- `pointerup/pointerleave` → arrête le dessin

**Comportements:**
- Curseur: `crosshair`
- Zoom controls: disabled, opacity 0.5
- Wheel scroll: ignoré (pas de zoom)
- Pinch 2 doigts: ignoré (pas de zoom)

### Mode PAN
**Pointer Events:**
- `pointerdown` (bouton gauche) → `isPanning = true`, sauvegarde position
- `pointermove` → si `isPanning`, calcule delta et appelle `engine.pan(dx, dy)`
- `pointerup/pointerleave` → `isPanning = false`

**Comportements:**
- Curseur: `grab` (normal) → `grabbing` (pendant drag)
- Zoom controls: enabled, opacity 1.0
- Wheel scroll: zoom in/out à la position du curseur
- Pinch 2 doigts: zoom (maintenir le pinch du code existant)
- Boutons +/-: zoom par incrément fixe

## 4. Code Structure

### Fichiers modifiés
- `components/EditorView.js` - Toute la logique

### Fichiers inchangés
- `core/CanvasEngine.js` - Aucune modification nécessaire

## 5. Accessibility & Mobile

**Mobile:**
- Mode PAN très utile sur mobile (écran petit)
- Touch events fonctionnent comme pointer events (grace à pointer API)
- Pinch-to-zoom maintenu en mode PAN

**Keyboard shortcuts (bonus/future):**
- `Space` + drag = temp pan mode
- `Ctrl/Cmd + 0` = reset zoom
- `Ctrl/Cmd + +/-` = zoom in/out

## 6. Edge Cases

**Changement de mode pendant une action:**
- Si on switch de PAN à DESSIN pendant un drag: annuler le pan en cours
- Si on switch de DESSIN à PAN pendant un dessin: arrêter le dessin

**Limites de pan:**
- Le `CanvasEngine.constrainPan()` s'assure qu'on ne pan pas hors du canvas visible
- Pas de modification nécessaire ici

**Reset View:**
- Appelle `engine.resetView()`
- Met à jour le label de zoom à 100%
