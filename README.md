# Site M'jy

Site vitrine et atelier de composition 3D pour M'jy, bijoux faits main.
Site statique : aucune installation, aucun build, aucune dépendance à installer.

---

## Mettre le site en ligne

### 1. GitHub

1. Sur github.com, **New repository** → nom : `mjy-site` → **Create**.
2. Sur la page du dépôt vide : **uploading an existing file**.
3. Décompressez le zip sur votre ordinateur, puis glissez **le contenu du dossier** (et non le dossier lui-même) dans la fenêtre : `index.html` doit se retrouver à la racine du dépôt.
4. **Commit changes**.

### 2. Vercel

1. Sur vercel.com : **Add New** → **Project** → **Import** le dépôt `mjy-site`.
2. Framework Preset : **Other**. Laissez les champs Build et Output vides.
3. **Deploy**. L'aperçu est en ligne en une minute environ.
4. Onglet **Domains** pour brancher `mjy-bijoux.fr` ou tout autre nom de domaine.

Chaque nouveau commit sur GitHub redéploie le site automatiquement.

---

## À personnaliser avant la mise en ligne

Ces valeurs sont des exemples, à remplacer par les vraies.

| Quoi | Où | Valeur actuelle |
|---|---|---|
| Numéro WhatsApp | `build/` non requis — cherchez `590690000000` dans les fichiers `.html` | `590690000000` |
| Adresse e-mail | cherchez `bonjour@mjy-bijoux.fr` dans les `.html` | `bonjour@mjy-bijoux.fr` |
| Instagram | déjà correct | `@mjy.jewelry` |
| Mentions légales | `mentions.html` | SIRET, adresse et forme juridique à compléter |

Le format du numéro WhatsApp est international sans `+` ni espaces : pour la Guadeloupe, `590` puis le numéro (`590690123456`).

### Prix des pièces

Les prix de la collection sont écrits directement dans `index.html` et `collection.html` (cherchez `€`). Tarifs actuels : de 150 € à 395 €.

### Prix du configurateur

Tout se règle en haut de `js/atelier.js` :

- `PIERRES` : le prix **par perle** de chaque pierre, sa couleur et sa finition.
- `PRIX_PLANCHER` : le prix minimum affiché (150 €).
- Dans la fonction `prix()` : `78` est le forfait de base (lien, fermoir argent, façon), `38` le supplément chaîne argent, `25` la gravure.

Exemple : une turquoise est à 2,60 € la perle. Sur un bracelet de 17 cm (40 emplacements, 20 turquoises et 19 anneaux d'argent avec une perle de Tahiti), l'estimation tombe à 170 €.

---

## Remplacer les photos

Toutes les images sont dans `assets/img/`. Pour changer une photo, remplacez le fichier **en gardant exactement le même nom**. Format conseillé : JPEG, portrait 3/4, environ 1200 px de large.

Les fichiers `p-*.jpg` sont les visuels produits, `m-*.jpg` les visuels de marque, les autres viennent des publications Instagram et restent en basse définition : ce sont eux à remplacer en priorité.

Photo de couverture de la page d'accueil : `bracelet-signature.jpg`.

---

## Structure

```
index.html          Page vitrine
collection.html     Les dix pièces
atelier.html        Le configurateur 3D
contact.html        Formulaire et canaux
mentions.html       Mentions légales
css/style.css       Toute la mise en forme
js/main.js          Animations, fil de défilement, curseur, formulaire
js/atelier.js       Le configurateur 3D
js/vendor/          three.js (embarqué, aucun CDN)
assets/img/         Les photos
favicon.svg         L'étoile M'jy
vercel.json         Réglages de cache
```

---

## Le formulaire de contact

Le site est 100 % statique : il n'enregistre rien et ne dépose aucun cookie. Le formulaire ouvre la messagerie ou WhatsApp du visiteur avec le message déjà rédigé. C'est volontaire — pas de base de données à gérer, pas de RGPD à traiter.

Si vous voulez un jour recevoir les demandes par e-mail sans que le visiteur ouvre sa messagerie, un service gratuit comme Formspree se branche en changeant deux lignes dans `contact.html`.

---

## Les textures des pierres

Les pierres du configurateur ne sont pas des aplats de couleur : chaque matière a une vraie texture dans `assets/tex/` (`turquoise.jpg` pour la couleur, `turquoise-r.jpg` pour le relief et la brillance). Elles servent aussi de pastilles dans le panneau de réglages.

Pour changer une matière, remplacez les deux fichiers en gardant les noms, en 256 × 256 px et raccordables (l'image doit pouvoir se répéter sans couture). Le script qui les a fabriquées est reproductible : bruit fractal filtré en Fourier, veines en bruit crêté, rayures étirées pour les métaux.

## Le fil

Le fil qui descend la page est une vraie corde : `assets/img/fil-brut.png` (coton ciré naturel) et `fil-vif.png` (turquoise) sont deux tranches de corde tressée, tirées de la texture Rope001. `js/main.js` les pose tranche par tranche le long d'un tracé souple, avec une ombre portée. À chaque section, la corde fait une boucle et enfile une perle d'argent. Sous la ligne de lecture la corde est naturelle, au-dessus elle devient turquoise, et l'étoile M'jy marque la jonction.

Épaisseur, amplitude et taille des boucles se règlent dans la fonction `reglages()` de `js/main.js` ; tout est proportionnel à la marge de la page.

## Le configurateur, en bref

- Tour de poignet de 14 à 21 cm : le nombre d'emplacements s'ajuste tout seul.
- Neuf liens (coton ciré, cuir, chaîne argent), douze pierres véritables, quatre répartitions.
- Montage serré ou noué : les nœuds entre les perles sont modélisés, comme sur les pièces montées sur cuir.
- Le nombre d'emplacements se recale tout seul : une perle de Tahiti prend deux fois la place d'une rondelle.
- **Un clic sur une perle la remplace** par la pierre sélectionnée : c'est là que se fait le vrai mélange.
- « Composer pour moi » propose une harmonie cohérente à retoucher ensuite.
- Le récapitulatif part sur WhatsApp, se copie, et l'aperçu 3D se télécharge en image.

Les pierres ne sont jamais identiques d'une perle à l'autre : teinte, grain et brillance varient légèrement, et le rang n'est pas parfaitement plat.
