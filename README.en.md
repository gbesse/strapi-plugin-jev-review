# Jev Review for Strapi 5

Server plugin for editorial review using TypeSafe Jev typed decisions. It evaluates a draft, returns `approve`, `escalate`, or `revise` with confidence, and can block unapproved publication. Draft content is never included in the decision result.

## Install

```sh
npm install github:gbesse/strapi-plugin-jev-review
```

Set `JEV_API_KEY` in the Strapi server environment. Do not put the key in source code or tracked configuration. Then add this to `config/plugins.js`:

```js
module.exports = ({ env }) => ({
  'jev-review': {
    enabled: true,
    config: {
      locale: 'en',
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

The field can be a path such as `content.body`. The guard intercepts Document Service `publish`: it reads the draft, asks Jev a `choice` question, and allows only `approve` above the threshold. If Jev fails, publication is blocked. The guard is disabled by default so installing the plugin does not alter editorial flows.

You can also request a decision from Strapi code:

```js
const decision = await strapi
  .plugin('jev-review')
  .service('review')
  .evaluate('api::article.article', documentId);
```

`decision` contains `choice`, `confidence`, `probabilities`, `model`, `stateHash`, and `action`. The plugin does not yet include a Strapi admin review screen; uncertain items are blocked and should be reviewed in the Content Manager.

## Limits and security

- Draft text is sent to the TypeSafe API. Explicitly choose eligible content types.
- Sent text is capped at `maxChars` (16,000 by default). Account for truncation in your editorial policy.
- A Jev decision is not a security authorization. Keep Strapi permissions and human review for sensitive publication.
- Validate the model, threshold, and criteria on your own examples before enabling the guard.

Run `npm test` for local tests. MIT licensed. Independent community project, unaffiliated with TypeSafe AI or Strapi.

[Français](README.md) · [Español](README.es.md)

## Adoption check

[Try a concrete case and check its limits](examples/adoption-check.md).
