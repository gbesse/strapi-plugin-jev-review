# Jev Review para Strapi 5

Plugin de servidor para revisión editorial mediante decisiones tipadas de TypeSafe Jev. Evalúa un borrador, devuelve `approve`, `escalate` o `revise` con confianza y puede bloquear una publicación no aprobada. El contenido del borrador nunca aparece en el resultado de la decisión.

## Instalación

```sh
npm install github:gbesse/strapi-plugin-jev-review
```

Defina `JEV_API_KEY` en el entorno del servidor Strapi. No ponga la clave en el código ni en una configuración seguida por Git. Añada esto a `config/plugins.js`:

```js
module.exports = ({ env }) => ({
  'jev-review': {
    enabled: true,
    config: {
      locale: 'es',
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

El campo puede ser una ruta como `content.body`. La protección intercepta `publish` en Document Service: lee el borrador, hace una pregunta `choice` a Jev y solo permite `approve` por encima del umbral. Si Jev falla, bloquea la publicación. Está desactivada por defecto para no alterar el flujo editorial al instalar el plugin.

También puede pedir una decisión desde código Strapi:

```js
const decision = await strapi
  .plugin('jev-review')
  .service('review')
  .evaluate('api::article.article', documentId);
```

`decision` contiene `choice`, `confidence`, `probabilities`, `model`, `stateHash` y `action`. El plugin todavía no incluye una pantalla de revisión en el panel de Strapi; los casos inciertos quedan bloqueados y deben revisarse en Content Manager.

## Límites y seguridad

- El texto del borrador se envía a la API TypeSafe. Seleccione expresamente los tipos de contenido permitidos.
- El texto enviado se limita mediante `maxChars` (16 000 por defecto). Tenga en cuenta el truncamiento en su política editorial.
- Una decisión de Jev no es una autorización de seguridad. Mantenga los permisos de Strapi y la revisión humana para publicaciones sensibles.
- Valide el modelo, el umbral y los criterios con sus propios ejemplos antes de activar la protección.

Ejecute `npm test` para las pruebas locales. Licencia MIT. Proyecto comunitario independiente, sin afiliación con TypeSafe AI ni Strapi.

[Français](README.md) · [English](README.en.md)

## Comprobación de adopción

[Pruebe un caso concreto y compruebe sus límites](examples/adoption-check.md).
