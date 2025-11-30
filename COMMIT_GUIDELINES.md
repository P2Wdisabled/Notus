# Lignes directrices pour les commits

## Format du message

1. Ligne de titre : `[type] Sujet court` limité à 72 caractères.
2. Ligne vide.
3. Corps optionnel enveloppé à ~72 caractères par ligne, décrivant le **pourquoi**, les impacts et les tests effectués.
4. Utilisez des puces `-` ou des paragraphes courts pour le corps.

## Types autorisés

- `[feature]` : ajout d’une fonctionnalité ou d’une API.
- `[fix]` : résolution d’un bug utilisateur ou d’une régression.
- `[update]` : amélioration mineure (UI, contenu, configuration légère).
- `[refactor]` : modifications internes sans impact fonctionnel.
- `[perf]` : optimisation de performance.
- `[docs]` : documentation ou guides uniquement.
- `[test]` : ajout/mise à jour de tests.
- `[chore]` : tâches de maintenance (dépendances, tooling, scripts).
- `[ci]` : pipelines CI/CD, automation, checks.
- `[security]` : correctifs ou durcissements liés à la sécurité.
- `[revert]` : annulation explicite d’un commit antérieur (indiquer son hash).

## Bonnes pratiques

- Préfixez chaque commit d’un seul type.
- Utilisez l’impératif présent : « Ajoute », « Corrige », « Met à jour ».
- Lorsque pertinent, ajoutez un bloc `Tests:` dans le corps avec les commandes exécutées.
- Évitez les commits mélangeant plusieurs intentions ; découpez au besoin.
- Exemples :
  - `[feature] Ajoute la duplication de workspace`
  - `[fix] Corrige la reconnexion socket en cas de timeout`

