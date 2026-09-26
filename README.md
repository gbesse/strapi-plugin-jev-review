# Jev Review pour Strapi 5

Plugin serveur de revue éditoriale avec les décisions typées de TypeSafe Jev. Il évalue un brouillon, renvoie `approve`, `escalate` ou `revise` avec sa confiance, et peut empêcher une publication non validée. Le contenu n'est jamais inclus dans le résultat de la décision.

## Installation

```sh
npm install github:gbesse/strapi-plugin-jev-review
```

Définissez `JEV_API_KEY` dans l'environnement du serveur Strapi. Ne placez pas la clé dans le code ni dans une configuration suivie par Git. Ajoutez ensuite au fichier `config/plugins.js` :

```js
module.exports = ({ env }) => ({
  'jev-review': {
    enabled: true,
    config: {
      locale: 'fr',
      model: 'jev-1.13.0',
      guardPublishing: true,
      minConfidence: 0.8,
      contentTypes: {
        'api::article.article': { field: 'body' },
      },
    },
  },
});
```

Le champ peut être un chemin comme `content.body`. La garde intercepte `publish` dans le Document Service : elle lit le brouillon, pose une question `choice` à Jev et ne laisse passer que `approve` au-dessus du seuil. Si Jev échoue, la publication est bloquée. Elle est désactivée par défaut pour éviter de modifier un parcours éditorial lors de l'installation.

La décision peut aussi être demandée depuis du code Strapi :

```js
const decision = await strapi
  .plugin('jev-review')
  .service('review')
  .evaluate('api::article.article', documentId);
```

`decision` contient `choice`, `confidence`, `probabilities`, `model`, `stateHash` et `action`. Le plugin ne fournit pas encore d'écran de revue dans l'administration Strapi ; les cas incertains sont bloqués et doivent être revus dans le Content Manager.

## Limites et sécurité

- Le texte du brouillon est envoyé à l'API TypeSafe. Choisissez explicitement les types de contenus admissibles.
- Le texte envoyé est limité à `maxChars` (16 000 par défaut). La troncature doit être prise en compte dans votre politique éditoriale.
- La décision Jev n'est pas une autorisation de sécurité. Conservez les permissions Strapi et la validation humaine pour les publications sensibles.
- Le modèle, le seuil et les critères doivent être validés sur vos propres exemples avant d'activer la garde.

Exécutez `npm test` pour les tests locaux. Licence MIT. Projet communautaire indépendant, sans affiliation à TypeSafe AI ou Strapi.

[English](README.en.md) · [Español](README.es.md)
