// Shared lint rules for both apps in this monorepo: the Next.js frontend at the
// repo root and the Express API in /server. Each app's own eslint.config.mjs
// spreads this and adds whatever is specific to it.
import js from "@eslint/js";
import tseslint from "typescript-eslint";

const baseConfig = [
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      // TypeScript already resolves identifiers; the base rule only produces
      // false positives on type-only and ambient declarations.
      "no-undef": "off",
      // Global Rules: no implicit any, and no silent @ts-ignore.
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/ban-ts-comment": [
        "error",
        { "ts-ignore": true, "ts-expect-error": "allow-with-description" },
      ],
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_", caughtErrorsIgnorePattern: "^_" },
      ],
    },
  },
];

export default baseConfig;
