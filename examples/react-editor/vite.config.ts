// In your own app you would `npm i awesome-agent-avatars` and drop the alias; here it points at the repo source.
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { libraryAlias } from "../../site/vite.config";

export default defineConfig({ root: fileURLToPath(new URL(".", import.meta.url)), plugins: [react()], resolve: { alias: libraryAlias } });
