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
        // Separación de vendors pesados para mejorar caché y paralelismo de descarga,
        // especialmente útil en la app de escritorio (Electron) y PWA instalada.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("react-dom") || id.match(/[\\/]react[\\/]/)) return "vendor-react";
          if (id.includes("react-router")) return "vendor-router";
          if (id.includes("@radix-ui")) return "vendor-radix";
          if (id.includes("lucide-react")) return "vendor-icons";
          if (id.includes("recharts") || id.includes("d3-")) return "vendor-charts";
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
