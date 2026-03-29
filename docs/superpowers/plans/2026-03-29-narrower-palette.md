# Réduction largeur Palette de Couleurs - Plan d'Implémentation

> **Pour les agents:** SKILL REQUISE: Utiliser superpowers:subagent-driven-development (recommandé) ou superpowers:executing-plans pour implémenter ce plan tâche par tâche. Les étapes utilisent la syntaxe checkbox (`- [ ]`) pour le suivi.

**Objectif:** Réduire la largeur du bloc de palette de couleurs à droite dans la phase de coloration du puzzle pour qu'il occupe moins d'espace.

**Architecture:** Modifier le composant `EditorView.js` pour optimiser la taille et l'affichage de la palette de couleurs en réduisant les dimensions des boutons et en ajustant le layout.

**Tech Stack:** Vanilla JavaScript (ES6+), CSS inline via JavaScript

---

## Mapping des Fichiers

| Fichier | Responsabilité | Action |
|---------|---------------|---------|
| `components/EditorView.js` | Rendu de la palette de couleurs | Modifier les styles de `renderPalette()` |
| `styles.css` | Styles globaux et media queries | Optionnel: ajouter styles responsive |

---

## Tâche 1: Réduire la taille des boutons de couleur

**Fichiers:**
- Modifier: `components/EditorView.js:186-194`

- [ ] **Étape 1: Identifier les dimensions actuelles**

Lire les lignes 186-194 dans `renderPalette()` :
```javascript
btn.style.cssText = `
  width: 48px;
  height: 48px;
  border: 3px solid ${index + 1 === this.selectedColor ? 'white' : 'transparent'};
  border-radius: 8px;
  background: ${color};
  cursor: pointer;
  position: relative;
`;
```

- [ ] **Étape 2: Modifier les dimensions des boutons**

Remplacer par des dimensions plus compactes (36px au lieu de 48px):
```javascript
btn.style.cssText = `
  width: 36px;
  height: 36px;
  border: 2px solid ${index + 1 === this.selectedColor ? 'white' : 'transparent'};
  border-radius: 6px;
  background: ${color};
  cursor: pointer;
  position: relative;
  flex-shrink: 0;
`;
```

- [ ] **Étape 3: Réduire la taille du numéro dans le bouton**

Modifier les lignes 196-205 :
```javascript
const number = document.createElement('span');
number.textContent = index + 1;
number.style.cssText = `
  position: absolute;
  top: 1px;
  left: 3px;
  font-size: 9px;
  font-weight: bold;
  color: ${this.getContrastColor(color)};
`;
```

- [ ] **Étape 4: Réduire l'espacement de la palette**

Modifier les lignes 173-182 :
```javascript
palette.style.cssText = `
  display: flex;
  gap: 8px;
  padding: 12px;
  justify-content: center;
  flex-wrap: wrap;
  background: var(--bg-card);
  border-radius: 8px;
  margin-top: 12px;
  max-width: 100%;
`;
```

- [ ] **Étape 5: Lancer l'application et vérifier visuellement**

```bash
# Si un serveur de développement existe
python -m http.server 8000
# ou
npx serve .
```

Ouvrir `http://localhost:8000` dans le navigateur, sélectionner un puzzle, et vérifier que:
- Les boutons de couleur sont plus petits (36px)
- La palette occupe moins de largeur
- Le tout reste utilisable et lisible

- [ ] **Étape 6: Commit**

```bash
git add components/EditorView.js
git commit -m "style: reduce palette button size from 48px to 36px for narrower layout"
```

---

## Tâche 2: Optimiser le layout responsive de la palette (Optionnel)

**Fichiers:**
- Modifier: `styles.css:66-76`

- [ ] **Étape 1: Ajouter des styles pour le mode desktop**

Ajouter après la ligne 76 dans `styles.css`:
```css
  .palette {
    max-width: 280px;
    justify-content: flex-start;
    padding: 12px;
  }
  
  .palette button {
    width: 36px;
    height: 36px;
  }
}
```

- [ ] **Étape 2: Tester sur différentes tailles d'écran**

Redimensionner la fenêtre du navigateur pour vérifier:
- Mobile (< 1024px): Palette en bas, wrap normalement
- Desktop (>= 1024px): Palette à droite, max-width limitée

- [ ] **Étape 3: Commit**

```bash
git add styles.css
git commit -m "style: add responsive constraints to palette width on desktop"
```

---

## Vérification Finale

- [ ] **Vérification 1: Chargement**
L'application se charge sans erreur dans la console

- [ ] **Vérification 2: Navigation**
On peut naviguer vers un puzzle et voir la palette réduite

- [ ] **Vérification 3: Fonctionnalité**
- Cliquer sur un bouton de couleur sélectionne la bonne couleur
- Le numéro de couleur sélectionnée s'affiche correctement
- La bordure blanche apparaît sur le bouton actif

- [ ] **Vérification 4: Responsive**
- La palette s'affiche correctement sur mobile
- La palette est plus compacte sur desktop

---

## Résumé des Changements

| Élément | Avant | Après |
|---------|-------|-------|
| Taille bouton | 48x48px | 36x36px |
| Bordure | 3px | 2px |
| Border radius | 8px | 6px |
| Gap entre boutons | 12px | 8px |
| Padding palette | 16px | 12px |
| Taille numéro | 10px | 9px |
| Largeur max (desktop) | illimitée | 280px |
