import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = fileURLToPath(new URL(".", import.meta.url));
const src = resolve(here, "../packages/bot-styles/src");
// Point "bot-styles" at the source so the site and examples never drift from the library.
export const botStylesAlias = [
  { find: /^bot-styles$/, replacement: resolve(src, "index.ts") },
  { find: /^bot-styles\/react$/, replacement: resolve(src, "react.tsx") },
  { find: /^bot-styles\/dicebear$/, replacement: resolve(src, "dicebear.ts") },
  { find: /^bot-styles\/styles\/(.*)$/, replacement: resolve(src, "styles/$1.ts") },
];

export default defineConfig({
  root: here,
  base: "/",
  plugins: [react()],
  resolve: { alias: [...botStylesAlias, { find: /^@examples\/(.*)$/, replacement: resolve(here, "../examples/$1") }] },
  build: {
    outDir: resolve(here, "dist"),
    emptyOutDir: true,
    rollupOptions: { input: { index: resolve(here, "index.html"), playground: resolve(here, "playground.html"), editor: resolve(here, "editor.html") } },
  },
});
