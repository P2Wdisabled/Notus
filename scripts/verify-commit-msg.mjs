#!/usr/bin/env node
import { readFileSync } from "node:fs";

const allowedTypes = [
  "feature",
  "feat",
  "fix",
  "update",
  "refactor",
  "perf",
  "docs",
  "test",
  "chore",
  "ci",
  "security",
  "revert",
  "delete",
];

const commitMsgFile = process.argv[2];

const helpHint =
  "Consultez COMMIT_GUIDELINES.md ou exécutez `cat COMMIT_GUIDELINES.md` pour plus de détails.";

if (!commitMsgFile) {
  console.error("Erreur: chemin du message de commit manquant.");
  console.error(helpHint);
  process.exit(1);
}

const commitMsg = readFileSync(commitMsgFile, "utf8").split("\n")[0].trim();

const bracketPattern = `^\\[(${allowedTypes.join("|")})\\]\\s.+`;
const colonPattern = `^(${allowedTypes.join("|")}):\\s.+`;
const bracketRegex = new RegExp(bracketPattern);
const colonRegex = new RegExp(colonPattern);

const errors = [];

if (!commitMsg) {
  errors.push(
    "Le message de commit ne peut pas être vide. Ajoutez un sujet après le type."
  );
}

if (!bracketRegex.test(commitMsg) && !colonRegex.test(commitMsg)) {
  errors.push(
    `Le message doit commencer par [type] sujet ou type: sujet. Types autorisés: ${allowedTypes.join(", ")}.`
  );
}

if (commitMsg.length > 100) {
  errors.push(
    `La première ligne doit faire 100 caractères maximum (actuellement ${commitMsg.length}).`
  );
}

if (errors.length) {
  console.error("Commit refusé:");
  errors.forEach((err) => console.error(`- ${err}`));
  console.error("");
  console.error("Astuce:");
  console.error(`- ${helpHint}`);
  console.error("- Exemple: [feature] Ajoute la duplication de workspace");
  console.error("- Exemple: feature: ajoute la duplication de workspace");
  process.exit(1);
}

process.exit(0);
