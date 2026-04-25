import { defineConfig } from "astro/config";

export default defineConfig({
  output: "static",
  vite: {
    server: {
      fs: {
        // allow serving asset files from the project root
        allow: [".."],
      },
    },
  },
});
