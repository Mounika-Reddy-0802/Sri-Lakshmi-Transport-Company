// Frontend (Next.js) lint config. /server has its own and is ignored here.
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { FlatCompat } from "@eslint/eslintrc";
import base from "./eslint.config.base.mjs";

const compat = new FlatCompat({ baseDirectory: dirname(fileURLToPath(import.meta.url)) });

const config = [
  { ignores: ["node_modules/**", ".next/**", "out/**", "dist/**", "server/**", "next-env.d.ts"] },
  ...base,
  ...compat.extends("next/core-web-vitals"),
];

export default config;
