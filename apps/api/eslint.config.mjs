import { defineConfig, globalIgnores } from "eslint/config";

const eslintConfig = defineConfig([globalIgnores(["node_modules/**", "dist/**", "generated/**"])]);

export default eslintConfig;
