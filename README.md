# babylonjs-vite-ts-github-starter

Starter for BabylonsJS, Vite, Typescript and Github

## Adopting the template

(Only strictly required if you plan to publish your package to npm)
- Adopt project name in `package.json` and `package-lock.json`:
- Search for `babylonjs-vite-ts-github-starter` and replace it with your package name.

## Deployment to github pages
The repository is prepared to build and publish to github-pages on every commit.
You have to enable github pages in your project:

If you want to publish only on release, change the trigger in the workflow file `publish-to-pages.yml`.

## Automatic dependency upgrades
The repository is prepared to have [dependanbot](https://github.com/dependabot) automatically create pull requests for outdated dependencies.

## Related work:
- https://github.com/paganaye/babylonjs-vite-boilerplate
  This repository is more opinionated compared to papaganaye's work:
  - Change to babylon playground code to use the three-shakeable imports.
  - Prepare github infrastructure: Deploy to github-pages and using dependabot.
