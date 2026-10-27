# Preuve Haine

Extension Chrome / Brave / Edge (Manifest V3) qui archive des preuves de commentaires haineux et prépare leur signalement groupé (Pharos, Unia, associations). Rien n'est envoyé sans validation humaine.

Le guide pour les utilisateurs est dans `GUIDE-INSTALLATION.html`.

## Développement

```
npm install
npm run build   # bundle src/ vers extension/
npm run package # build + dist/Preuve-Haine-v<version>.zip à partager
```

Charger `extension/` comme extension non empaquetée.

## Structure

- `src/background.js` : menu contextuel, double capture (publication + commentaire), anonymisation, lancement de l'analyse
- `src/images.js` : recadrage et masquage des captures
- `src/analyse.js` : qualification par l'API Claude (facultative, clé saisie dans les options)
- `src/dossier.js` : tri des pièces, qualification à la main
- `src/rapport.js` : dossier groupé, ZIP, brouillon de mail aux associations en CCI
- `src/stockage.js` : `chrome.storage.local`

Aucune clé n'est incluse : chaque utilisateur saisit la sienne, ou qualifie les pièces lui-même.
