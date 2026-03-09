---
description: 'Architecture css'
applyTo: '**/*.scss, **/*.css'
---

# Organisation des fichiers CSS

Si le dossier css n'existe pas, en créer un. 
Il doit se positionner au même niveau que le dossier app:
- /src
  - /app
  - /css
Il doit contenir les sous-dossiers suivants :
- /css
  - /elements
  - /components
  - /generic
  - /tools
  - /settings
  - /utils

Chaque dossier doit comprendre au moins un fichier index.scss qui va faire un forward de tous les fichiers présents dans le dossier.

## Dossier generic
Le dossier generic contient 2 fichiers et un index.scss :
- _generic.reset.scss : reset des styles par défaut du navigateur
- _generic.box-sizing.scss

Contenu du fichier _generic.box-sizing.scss:
`
/*------------------------------------*\
  #BOX-SIZING
\*------------------------------------*/

/**
 * More sensible default box-sizing:
 * css-tricks.com/inheriting-box-sizing-probably-slightly-better-best-practice
 */

html {
  -webkit-box-sizing: border-box;
  -moz-box-sizing: border-box;
  box-sizing: border-box;
}

* {
  &,
  &:before,
  &:after {
    -webkit-box-sizing: inherit;
    -moz-box-sizing: inherit;
    box-sizing: inherit;
  }
}
`
Le fichier _generic.reset.scss contient le contenu suivant:
`
/*------------------------------------*\
  #RESET
\*------------------------------------*/

/**
 * A very simple reset that sits on top of Normalize.css.
 */

body,
h1,
h2,
h3,
h4,
h5,
h6,
p,
blockquote,
pre,
dl,
dd,
ol,
ul,
form,
fieldset,
legend,
figure,
table,
th,
td,
caption,
hr {
  margin: 0;
  padding: 0;
}

/**
 * Remove trailing margins from nested lists.
 */
li > {
  ul,
  ol {
    margin-bottom: 0;
  }
}

/**
 * Remove spaces between table cells.
 */
table {
  border-collapse: collapse;
  border-spacing: 0;
}

td,
th {
  padding: 0;
}
`
Le fichier index.scss du dossier css doit contenir le contenu suivant :
@forward 'generic.reset';
@forward 'generic.box-sizing';

## Dossier tools
Le dossier tools doit comprendre un fichier _tools.mixins.scss qui contiendra les mixins globales.
voici son contenu initial :
`
/*------------------------------------*\
  #MIXINS
\*------------------------------------*/
@mixin hocus() {
  &:hover,
  &:focus {
    @content;
  }
}
`

Contenu du fichier index.scss du dossier tools :
@forward 'tools.mixins';

## Dossier utils

Il doit comprendre un fichier _utils.width.scss avec le contenu suivant:

`
/*------------------------------------*\
  #WIDTHS
\*------------------------------------*/
$widths: 20, 30, 50, 80, 90, 100;

@each $size in $widths {
  .w-#{$size} {
    width: calc($size * 1%);
  }
}
`
Il doit comprendre un fichier _utils.spacing.scss avec le contenu suivant:
`
/*------------------------------------*\
  #SPACING
\*------------------------------------*/
$sizes: 5, 10, 15, 20, 30, 40, 50, 60;

@each $size in $sizes {
  .gap-#{$size} {
    gap: $size + px;
  }
  .mb-#{$size} {
    margin-bottom: $size + px;
  }
  .padding-#{$size} {
    padding: $size + px;
  }
}

.m-auto {
  margin: 0 auto;
}

.ml-auto {
  margin-left: auto;
}
.mt-auto {
  margin-top: auto;
}
.mr-auto {
  margin-right: auto;
}
.mb-auto {
  margin-bottom: auto;
}
`
Il doit comprendre un fichier _utils.flex.scss avec le contenu suivant:

`
/*------------------------------------*\
  #FLEXBOX  
\*------------------------------------*/
$justify-content-values:
  flex-start, flex-end, center, space-between, space-around, space-evenly, start, end, left, right;
@each $value in $justify-content-values {
  .justify-content-#{$value} {
    justify-content: $value;
  }
}

$align-items: stretch, flex-start, flex-end, center, baseline, start, end, self-start, self-end;
@each $value in $align-items {
  .align-items-#{$value} {
    align-items: $value;
  }
}

$align-self: stretch, flex-start, flex-end, center, baseline, start, end, self-start, self-end;
@each $value in $align-items {
  .align-self-#{$value} {
    align-self: $value;
  }
}

$flex-direction: row, row-reverse, column, column-reverse;
@each $value in $flex-direction {
  .flex-direction-#{$value} {
    flex-direction: $value;
  }
}

$flex-wrap: nowrap, wrap, wrap-reverse;
@each $value in $flex-wrap {
  .flex-wrap-#{$value} {
    flex-wrap: $value;
  }
}

.d-flex {
  display: flex;
}

.d-inline-flex {
  display: inline-flex;
}

.d-none {
  display: none;
}
`

Il doit comprendre un fichier _utils.global-link.scss avec le contenu suivant:

`
/*------------------------------------*\
  #GLOBAL LINKS
\*------------------------------------*/
.u-global-link:before {
  content: '';
  display: block;
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 2;
  background: transparent;
}
`
et un fichier index.scss avec le contenu suivant :
@forward 'utils.flex';
@forward 'utils.global-link';
@forward 'utils.spacing';
@forward 'utils.width';

## Fichier principal styles.scss
Contenu du fichier final /src/styles.scss :
//Order mattes, do not put code above @use
//GENERICS
@use './css/generic' as generic;

//SETTINGS
@use './css/settings' as settings;

//TOOLS
@use './css/tools' as tools;

//ELEMENTS
@use './css/elements' as elements;

//COMPONENTS
@use './css/components' as components;

//UTILS
@use './css/utils' as utils;
