# État — Preuve Haine

## Fait
- v1.2.0 publiée sur GitHub (public) : https://github.com/Fab-hue/preuve-haine
- Release v1.2.0 avec `Preuve-Haine.zip` ; lien stable : https://github.com/Fab-hue/preuve-haine/releases/latest/download/Preuve-Haine.zip
- Page d'installation GitHub Pages (`docs/index.html` = copie de GUIDE-INSTALLATION.html) : https://fab-hue.github.io/preuve-haine/

## Publier une nouvelle version
1. Monter `version` dans `extension/manifest.json`, `npm run package`.
2. `cp GUIDE-INSTALLATION.html docs/index.html`, commit, push.
3. `cp dist/Preuve-Haine-v<X>.zip dist/Preuve-Haine.zip` puis `gh release create v<X> dist/Preuve-Haine.zip dist/Preuve-Haine-v<X>.zip`.
4. Copier le ZIP dans `C:\Users\fabie\Claude\A envoyer\`.

## À faire
- Option : publier sur le Chrome Web Store (5 $ une fois, revue Google) pour une vraie installation en 1 clic.
