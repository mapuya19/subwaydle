import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  { ignores: ["dist", "build", "node_modules", ".yarn"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],
      // Convention: unused vars/args prefixed with underscore are intentionally unused.
      "@typescript-eslint/no-unused-vars": [
        "error",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
      // react-hooks v7 flags *any* setState inside useEffect, including standard
      // patterns like animation triggers (set state → setTimeout → clear) and
      // async loading states. The rule has no configuration to allowlist specific
      // patterns, so it must be disabled globally. All 7 usages in this codebase
      // are intentional: 3 animation triggers (CurrentRow, GameGrid, Key),
      // 2 modal state syncs (PracticeModal, SolutionModal), 1 visibility toggle
      // (Toast), and 1 async loading state (useGameData).
      "react-hooks/set-state-in-effect": "off",
    },
  },
  // Polyfill shim: bridges semantic-ui-react to React 19 by replacing the removed
  // ReactDOM.findDOMNode API. Inherently works with untyped React internals
  // (fiber $$typeof, internal .ref property, callback ref forwarding) where
  // fabricating types would be incorrect and fragile. The file also exports
  // helper functions alongside components, which react-refresh flags.
  {
    files: ["src/polyfills/**/*.{ts,tsx}"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "react-refresh/only-export-components": "off",
    },
  },
  // Context files co-locate providers with their hooks (useGame, useSettings,
  // useDarkMode, useStats). This is the standard React context pattern — splitting
  // hooks into separate files would fragment tightly coupled code for no benefit.
  // Using allowExportNames instead of blanket "off" so the rule still catches
  // accidental non-component/non-hook exports.
  {
    files: ["src/contexts/**/*.{ts,tsx}"],
    rules: {
      "react-refresh/only-export-components": [
        "warn",
        {
          allowConstantExport: true,
          allowExportNames: ["useGame", "useSettings", "useDarkMode", "useStats"],
        },
      ],
    },
  }
);
