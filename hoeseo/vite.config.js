import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { createDevApiPlugin } from "./scripts/dev-api-plugin.js";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  return {
    plugins: [react(), tailwindcss(), createDevApiPlugin(env)],
    server: {
      host: true,
      port: 5173,
    },
  };
});
