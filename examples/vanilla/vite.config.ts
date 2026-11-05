// In your own app you would `npm i bot-styles` and drop the alias; here it points at the repo source.
import { defineConfig } from "vite";
import { fileURLToPath } from "node:url";
import { botStylesAlias } from "../../site/vite.config";

export default defineConfig({ root: fileURLToPath(new URL(".", import.meta.url)), resolve: { alias: botStylesAlias } });
