// API lint config — shares the monorepo rule set in ../eslint.config.base.mjs.
import base from "../eslint.config.base.mjs";

export default [{ ignores: ["node_modules/**", "dist/**"] }, ...base];
