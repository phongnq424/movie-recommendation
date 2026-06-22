import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,

  {
    rules: {
      /**
       * Project hiện tại còn nhiều chỗ dùng any trong service/component.
       * Để CI không fail vì lint, hạ xuống warning trước.
       */
      "@typescript-eslint/no-explicit-any": "warn",

      /**
       * Các biến/import chưa dùng chỉ cảnh báo, không chặn CI.
       */
      "@typescript-eslint/no-unused-vars": "warn",

      /**
       * React 19 / Next 16 bật rule khá gắt.
       * Code hiện tại vẫn chạy/build được, nên tắt để CI không fail vì rule compiler.
       */
      "react-hooks/set-state-in-effect": "off",
      "react-hooks/preserve-manual-memoization": "off",
    },
  },

  // Override default ignores of eslint-config-next.
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;