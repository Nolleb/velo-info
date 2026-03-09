---
description: 'best practices CSS'
applyTo: '**/*.scss, **/*.css'
---

# Règles d'architecture et bonnes pratiques CSS
https://github.com/ahmadajmi/awesome-itcss

## Règles de base et principe de fonctionnement du CSS

- Ne pas utiliser de !important sauf cas exceptionnel pour écraser du javascript.
- Ne pas utiliser du css obsolète dans les composants comme ::ng-deep
- Si du css dans un composant se répète dans plusieurs composants, le déplacer dans le dossier /css/components
- Concernant les medias queries, utiliser un seul sélecteur et non pas plusieurs de manière à garder le code à un endroit unique.
Bon exemple:
`
.responsive-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;

  @include medium {
    grid-template-columns: 1fr 1fr;
    gap: 15px;
  }
}
`
Mauvais exemple:
`
.responsive-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}
@media (max-width: 480px) {
  .responsive-grid {
    gap: 15px;
  }
}
`
- Utiliser toujours des class css pour le style des éléments de manière à ce qu'ils aient toujours le même poids. Ne pas utiliser des ids ou autre sélecteurs compliqués sauf cas particulier

- Ne pas faire d'imbrication de sélecteurs sauf pour surcharger ou dans le cas d'utilisation du BEM (Block Element Modifier).

Bonne pratique:
`
.button-primary {
  background-color: blue;
  .alert & {
    background-color: red;
  }
}
`
Mauvais pratique:
`
#button-primary {
  background-color: blue;
}

.alert #button-primary {
  background-color: red;
}
`

- Privilégier l'utilisation du BEM (Block Element Modifier) pour nommer les classes css.


- Utilisation de @property pour définir des variables CSS réutilisables. Exemple:
`
@property <custom-property-name> {
  <declaration-list>
}

@property --hue {
  syntax: "<number>";
  initial-value: 0;
  inherits: false;
}

voir les détails ici :
https://css-tricks.com/almanac/rules/p/property/
`

### tips

- Possibilité d'ajouter du texte pour l'accessibilité via les pseudo-éléments ::before et ::after. 
Exemple :
`
.required::after {
 content: "→" / "Right pointing arrow";
}
`
- Utilisation de la fonction clamp() pour des tailles réactives. 
The CSS clamp() function locks a value between a minimum and maximum, using a preferred value within that range.
Exemple :
`
.container {
  width: clamp(200px, 50%, 800px); /* 200px min, 50% preferred, 800px max */
}
`

- Animation fluide de 0 à auto:
`
:root {
 interpolate-size: allow-keywords;
}
`
- Texe auto contrasté:
`
.text {
 mix-blend-mode: difference; //A tester
}
`

- Responsive card sans media queries:

`
grid-template-columns:
repeat(
auto-fill,
minmax(min(450px, 100%), 1fr) //4450px valeur à adapter
);
`

- textarea auto expanding:
`
textarea {
 field-sizing: content;
 ...
}
`

- Auto position des tooltips:

`
//give your tooltip a home address.
.icon {
 anchor-name: --icon;
}
.tooltip {
 position: absolute;
 position-anchor: --icon;
 position-area: top;
 position-try: bottom, left, right;
}
`

- Possibilité d'utiliser des conditions if / else : 
`
.card {
 padding: if(media(max-width: 600px): 1rem, else: 2rem);
}
`