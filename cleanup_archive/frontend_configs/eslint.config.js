import js from "@eslint/js";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import tseslint from "typescript-eslint";

export default [
  js.config({
    files: ["**/*.js", "**/*.jsx", "**/*.ts", "**/*.tsx"],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "module",
    },
    rules: {
      "no-unused-vars": "warn",
    },
  }),
  tseslint.config({
    files: ["**/*.ts", "**/*.tsx"],
    rules: {
      "@typescript-eslint/no-unused-vars": "warn",
    },
  }),
  react.config({
    files: ["**/*.jsx", "**/*.tsx"],
    settings: { react: { version: "detect" } },
    rules: {
      "react/prop-types": "off",
    },
  }),
  reactHooks.config({
    files: ["**/*.jsx", "**/*.tsx"],
  }),
];
