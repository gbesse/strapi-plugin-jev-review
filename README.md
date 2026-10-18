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

## Contrôle d’adoption · Adoption check · Comprobación de adopción

[Français : essayer un cas concret](examples/adoption-check.md) · [English: try a concrete case](examples/adoption-check.md) · [Español: pruebe un caso concreto](examples/adoption-check.md).

## Revue complète et actualisée

Un brouillon dépassant `maxChars` échoue avant envoi, au lieu d’approuver un préfixe tronqué. Le garde de publication lit la locale demandée, puis relit le texte après décision et bloque une modification. Le service `evaluate` accepte aussi une locale optionnelle. Les redirections fournisseur sont refusées. La relecture ne constitue pas un verrou transactionnel : un changement après vérification reste possible. Tests simulés du middleware Strapi 5, sans instance ou compte réel.


FR : Une réponse doit fournir exactement les probabilités `approve`, `escalate` et `revise`, finies dans [0,1], dont la somme vaut 1 à 0,001 près. Le choix doit être un maximum ; un modèle déclaré différent est refusé. Politique et critères sont figés avant transport. Un format incomplet est une indisponibilité, jamais une approbation. Ces contrôles ne calibrent pas les probabilités et ne valident pas l’hôte Strapi natif.

EN: A response must provide exactly `approve`, `escalate` and `revise` probabilities, finite in [0,1] and summing to 1 within 0.001. The selected choice must be a maximum; a different declared model is rejected. Policy and criteria are snapshotted before transport. An incomplete format is unavailable, never an approval. These checks do not calibrate probabilities or validate the native Strapi host.

ES: La respuesta debe proporcionar exactamente probabilidades `approve`, `escalate` y `revise`, finitas en [0,1] y cuya suma sea 1 con tolerancia 0,001. La elección debe ser máxima; se rechaza un modelo declarado diferente. Política y criterios se fijan antes del transporte. Un formato incompleto implica indisponibilidad, nunca aprobación. Estos controles no calibran probabilidades ni validan el host Strapi nativo.
