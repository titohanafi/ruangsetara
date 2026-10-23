import { loadEnv, type Plugin } from "vite";
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import autoprefixer from "autoprefixer";
import tailwindcss from "tailwindcss";
import tailwindConfig from "./tailwind.config.ts";

// Saat `npm run dev`, fungsi server di folder server/ (yang di Vercel berjalan sebagai api/analisis.mjs) dijalankan langsung
// oleh Vite, dengan variabel lingkungan dari .env.local, supaya pembacaan foto bisa dicoba tanpa `vercel dev`.
function apiLokal(): Plugin {
  return {
    name: "api-lokal",
    apply: "serve",
    configureServer(server) {
      for (const [k, v] of Object.entries(loadEnv(server.config.mode, process.cwd(), ""))) process.env[k] ??= v;
      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url ?? "/", "http://localhost");
        const cocok = /^\/api\/([\w-]+)$/.exec(url.pathname);
        if (!cocok) return next();
        try {
          const modul = (await server.ssrLoadModule(`/server/${cocok[1]}.ts`)) as Record<string, (r: Request) => Promise<Response>>;
          const penangan = modul[req.method ?? "GET"];
          if (!penangan) {
            res.statusCode = 405;
            return res.end();
          }
          const potongan: Buffer[] = [];
          for await (const p of req) potongan.push(p as Buffer);
          const hasil = await penangan(
            new Request(`http://${req.headers.host}${req.url}`, {
              method: req.method,
              headers: req.headers as Record<string, string>,
              body: req.method === "GET" || req.method === "HEAD" ? undefined : Buffer.concat(potongan),
            }),
          );
          res.statusCode = hasil.status;
          hasil.headers.forEach((v, k) => res.setHeader(k, v));
          res.end(Buffer.from(await hasil.arrayBuffer()));
        } catch (e) {
          server.config.logger.error(String(e));
          res.statusCode = 500;
          res.end();
        }
      });
    },
  };
}

export default defineConfig({
  plugins: [react(), apiLokal()],
  base: "./",
  // Konfigurasi Tailwind diberikan langsung dari sini supaya perubahan token langsung terbaca tanpa memulai ulang server.
  css: { postcss: { plugins: [tailwindcss(tailwindConfig), autoprefixer()] } },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes("node_modules/zod")) return "zod";
          if (id.includes("react-router") || id.includes("@remix-run")) return "router";
          if (id.includes("node_modules/react") || id.includes("node_modules/scheduler")) return "react";
        },
      },
    },
  },
  test: { include: ["tests/**/*.test.{ts,tsx}"] },
});
