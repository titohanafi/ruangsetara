import { readFileSync } from "node:fs";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { build } from "esbuild";
import { describe, expect, it } from "vitest";

// Vercel menjalankan `api/analisis.mjs` (bundel mandiri dari `server/analisis.ts`), bukan sumbernya. Tes ini memastikan bundel yang
// di-commit selalu sama dengan hasil bundel dari sumber, dan bisa dimuat serta menjawab di Node biasa (tanpa tsx/Vite).
const BERKAS = resolve("api/analisis.mjs");

describe("bundel fungsi analisis foto untuk Vercel", () => {
  it("api/analisis.mjs sama dengan hasil bundel server/analisis.ts (jalankan `npm run bundel:api` bila berbeda)", async () => {
    const hasil = await build({
      entryPoints: [resolve("server/analisis.ts")],
      bundle: true,
      platform: "node",
      format: "esm",
      target: "node22",
      write: false,
      logLevel: "silent",
    });
    expect(readFileSync(BERKAS, "utf8")).toBe(hasil.outputFiles[0].text);
  });

  it("dimuat di Node biasa dan menjawab dengan galat yang ditangani (bukan jatuh)", async () => {
    const m = (await import(pathToFileURL(BERKAS).href)) as { POST: (r: Request) => Promise<Response> };
    const sebelum = process.env.GEMINI_API_KEY;
    try {
      delete process.env.GEMINI_API_KEY;
      const tanpaKunci = await m.POST(new Request("http://x/api/analisis", { method: "POST", body: "{}" }));
      expect(tanpaKunci.status).toBe(500);
      expect(await tanpaKunci.json()).toEqual({ galat: "kunci belum diatur" });
      process.env.GEMINI_API_KEY = "uji";
      const kosong = await m.POST(new Request("http://x/api/analisis", { method: "POST", body: "{}" }));
      expect(kosong.status).toBe(400);
      const situsLain = await m.POST(
        new Request("http://x/api/analisis", { method: "POST", headers: { origin: "https://jahat.example", host: "x" }, body: "{}" }),
      );
      expect(situsLain.status).toBe(403);
    } finally {
      if (sebelum === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = sebelum;
    }
  });
});

describe("bundel fungsi denah untuk Vercel", () => {
  const berkas = resolve("api/denah.mjs");

  it("api/denah.mjs sama dengan hasil bundel server/denah.ts (jalankan `npm run bundel:api` bila berbeda)", async () => {
    const hasil = await build({
      entryPoints: [resolve("server/denah.ts")],
      bundle: true,
      platform: "node",
      format: "esm",
      target: "node22",
      write: false,
      logLevel: "silent",
    });
    expect(readFileSync(berkas, "utf8")).toBe(hasil.outputFiles[0].text);
  });

  it("dimuat di Node biasa dan menolak permintaan yang salah tanpa jatuh", async () => {
    const m = (await import(pathToFileURL(berkas).href)) as { POST: (r: Request) => Promise<Response> };
    const sebelum = process.env.GEMINI_API_KEY;
    try {
      delete process.env.GEMINI_API_KEY;
      expect((await m.POST(new Request("http://x/api/denah", { method: "POST", body: "{}" }))).status).toBe(500);
      process.env.GEMINI_API_KEY = "uji";
      expect((await m.POST(new Request("http://x/api/denah", { method: "POST", body: "{}" }))).status).toBe(400);
      expect(
        (await m.POST(new Request("http://x/api/denah", { method: "POST", body: JSON.stringify({ gambar: "x".repeat(900_001) }) }))).status,
      ).toBe(400);
      const situsLain = new Request("http://x/api/denah", {
        method: "POST",
        headers: { origin: "https://jahat.example", host: "x" },
        body: "{}",
      });
      expect((await m.POST(situsLain)).status).toBe(403);
    } finally {
      if (sebelum === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = sebelum;
    }
  });
});
