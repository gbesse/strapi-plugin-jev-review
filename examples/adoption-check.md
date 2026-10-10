# strapi-plugin-jev-review — contrôle d’adoption · adoption check · comprobación de adopción

## Français

Point de départ local, après la préparation indiquée dans le README :

```sh
npm test
```

Un brouillon à faible confiance doit rester révisable avant publication. Vérifiez la configuration `guardPublishing` et le traitement du type de contenu choisi dans les tests du plugin.

## English

Local starting point, after the setup described in the README:

```sh
npm test
```

A low-confidence draft should remain reviewable before publication. Check `guardPublishing` configuration and handling of the selected content type in the plugin tests.

## Español

Punto de partida local, después de la preparación descrita en el README:

```sh
npm test
```

Un borrador de baja confianza debe poder revisarse antes de publicarse. Compruebe la configuración `guardPublishing` y el tratamiento del tipo de contenido elegido en las pruebas del plugin.
## Variante synthétique · Synthetic variation · Variante sintética

```text
guardPublishing=true; confidence=0.50; draft=true
```

FR : adaptez une copie de la fixture locale à cette situation, puis vérifiez le comportement décrit ci-dessus. Les valeurs sont illustratives, pas des résultats Jev mesurés.

EN: adapt a copy of the local fixture to this situation, then check the behavior described above. Values are illustrative, not measured Jev output.

ES: adapte una copia de la fixture local a esta situación y compruebe el comportamiento descrito arriba. Los valores son ilustrativos, no resultados Jev medidos.

## Second cas · Second case · Segundo caso

```text
confidence=0.79; minConfidence=0.80; guardPublishing=true
```

**FR :** Un brouillon juste sous le seuil configuré doit rester soumis à la garde de publication. Vérifiez le résultat dans le type de contenu concerné.

**EN:** A draft just below the configured threshold should remain subject to the publishing guard. Check the outcome on the relevant content type.

**ES:** Un borrador justo por debajo del umbral configurado debe seguir sujeto a la protección de publicación. Compruebe el resultado en el tipo de contenido pertinente.
