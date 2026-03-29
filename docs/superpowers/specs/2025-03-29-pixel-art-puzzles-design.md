# Pixel Art Puzzles - Design Document

## Context

Projet : Jeu de coloriage de pixel art (supapowa)
Emplacement des images sources : `/images/`
Fichier cible : `data/defaultPuzzles.json`

## Goal

Convertir 10 images 32x32 (ou redimensionnables à 32x32) en puzzles de coloriage par défaut, remplaçant le puzzle actuel "Simple Heart". Les puzzles seront disponibles sur l'écran d'accueil du jeu.

## Images à convertir

1. `basketball.png` → "Basketball"
2. `burger.jpeg` → "Burger"
3. `cat.png` → "Cat"
4. `dog.jpg` → "Dog"
5. `duck.png` -> "Duck"
6. `joker.png` → "Joker"
7. `pokemon1.jpeg` → "Pokemon 1"
8. `pokemon2.jpg` → "Pokemon 2"
9. `pokemon3.png` → "Pokemon 3"
10. `starwars.jpg` → "Star Wars"

## Technical Requirements

### Algorithme de conversion

Pour chaque image :

1. **Redimensionnement** : Resize à 32x32 pixels si dimensions différentes
2. **Extraction des pixels** : Lire les valeurs RGBA de chaque pixel
3. **Transparence** : Pixels avec alpha < 128 sont considérés transparents (valeur 0 dans la grille)
4. **Quantification des couleurs** : Limite à 16 couleurs maximum (modifié depuis 8)
   - Utiliser l'algorithme k-means pour réduire la palette
   - Ignorer les pixels transparents pour le clustering
5. **Mapping vers la grille** : Chaque pixel coloré reçoit l'index de la couleur la plus proche dans la palette (1-16)
6. **Format de sortie** : Générer un objet JSON compatible avec le jeu

### Format du puzzle JSON

```json
{
  "id": "default-{filename-sans-extension}",
  "name": "{Nom formatté}",
  "targetGrid": [[...], [...], ...], // 32 lignes de 32 valeurs (0-16)
  "paintedGrid": [[0,0,...], ...], // 32x32 rempli de 0
  "palette": ["#000000", "#ffffff", ...], // 3-16 couleurs hex
  "completedPercent": 0,
  "lastPlayed": null
}
```

### Spécifications de l'algorithme k-means

- **Initialisation** : Choisir aléatoirement 16 pixels parmi les pixels opaques
- **Itérations** : Maximum 20 iterations ou jusqu'à convergence
- **Distance** : Distance euclidienne dans l'espace RGB
- **Mise à jour** : Recalculer les centroides comme moyenne des pixels assignés

### Dépendances

- `sharp` : Librairie Node.js pour le traitement d'image (resize, extraction de pixels)
- Pas de dépendance supplémentaire pour k-means (implémentation manuelle)

## File Structure

```
scripts/
  build-puzzles.js      # Script principal de conversion
  utils/
    kMeans.js           # Algorithme k-means pour quantification
    imageProcessor.js   # Extraction et resize des images

data/
  defaultPuzzles.json   # Généré automatiquement (ne pas modifier manuellement)
```

## Commande npm

Ajouter dans `package.json` :
```json
"scripts": {
  "build:puzzles": "node scripts/build-puzzles.js"
}
```

## Processus de build

1. Lire le dossier `images/`
2. Pour chaque fichier image valide (png, jpg, jpeg) :
   - Extraire les métadonnées (nom du fichier)
   - Charger l'image avec sharp
   - Redimensionner à 32x32 (cover mode pour garder les proportions si nécessaire)
   - Extraire les pixels raw (RGBA)
   - Appliquer k-means pour obtenir 16 couleurs max
   - Créer la grille de mapping (0 = transparent, 1-16 = index couleur)
   - Générer l'objet puzzle
3. Écrire le tableau de puzzles dans `data/defaultPuzzles.json`
4. Afficher un résumé (nombre de puzzles générés, palette moyenne, etc.)

## Validation

Le script doit vérifier :
- Chaque puzzle a exactement 32 lignes dans targetGrid
- Chaque ligne a exactement 32 valeurs
- Les valeurs sont entre 0 et 16
- La palette contient entre 3 et 16 couleurs
- Le format JSON est valide

## Notes

- Le puzzle "Simple Heart" (demo-1) sera supprimé
- Les IDs générés seront du type : `default-basketball`, `default-cat`, etc.
- Les noms affichés seront capitalisés automatiquement
