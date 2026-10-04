import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
// @ts-expect-error - plain JS plugin, no type declarations
import prerenderRoutes from "./vite-plugins/prerender-routes.mjs";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  base: './',
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    prerenderRoutes(),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
    dedupe: ["react", "react-dom"],
  },
  esbuild: {
    // Acelera la carga eliminando logs y depuración en producción
    drop: mode === "production" ? ["console", "debugger"] : [],
  },
  build: {
    target: "es2020",
    cssCodeSplit: true,
    sourcemap: false,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        // FIX vendor-ui (DeepSeek): react+radix+router+icons UNIFICADOS — separados causaban forwardRef undefined.
        // especialmente útil en la app de escritorio (Electron) y PWA instalada.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-dom") || id.match(/[\/]react[\/]/) || id.includes("react-router") || id.includes("@radix-ui") || id.includes("lucide-react") || id.includes("react-day-picker") || id.includes("recharts") || id.includes("d3-")) return "vendor-ui";
          if (id.includes("exceljs")) return "vendor-exceljs";
          if (id.includes("pdfjs-dist")) return "vendor-pdfjs";
          if (id.includes("html5-qrcode")) return "vendor-qrcode";
          if (id.includes("@supabase")) return "vendor-supabase";
          if (id.includes("@tanstack")) return "vendor-query";
          if (id.includes("date-fns")) return "vendor-datefns";
          return "vendor";
        },
      },
    },
  },
}));
