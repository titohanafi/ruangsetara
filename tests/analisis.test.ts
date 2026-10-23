import { describe, expect, it } from "vitest";
import { POST, PROMPT, SKEMA, bersihkan } from "../server/analisis";

describe("prompt dan skema", () => {
  it("memuat pertanyaan peneliti dan hanya 11 id (tanpa M-12)", () => {
    expect(PROMPT).toContain("M-07");
    expect(PROMPT).toContain("Apakah wastafel dapat digunakan dari posisi duduk?");
    expect(PROMPT).not.toContain("M-12");
    expect(SKEMA.properties.jawaban.items.properties.id.enum).toHaveLength(11);
  });

  it("menandai pertanyaan 'sebagian' sebagai tidak boleh dijawab Ya dari foto", () => {
    const m01 = PROMPT.split("\n").find((l) => l.startsWith("- M-01"));
    expect(m01).toContain('answer "tidak" only');
    const m09 = PROMPT.split("\n").find((l) => l.startsWith("- M-09"));
    expect(m09).toContain('both "ya" and "tidak"');
  });
});

describe("bersihkan", () => {
  it("membuang id tak dikenal dan ganda, serta menurunkan Ya pada pertanyaan 'sebagian'", () => {
    const r = bersihkan({
      kamar_mandi: true,
      jawaban: [
        { id: "M-01", nilai: "ya", alasan: "pintu lebar" },
        { id: "M-07", nilai: "ya", alasan: "ada ruang" },
        { id: "M-07", nilai: "tidak", alasan: "ganda" },
        { id: "M-12", nilai: "ya", alasan: "bukan ditanya" },
        { id: "M-09", nilai: "ngawur", alasan: 5 },
      ],
    });
    expect(r.jawaban).toEqual([
      { id: "M-01", nilai: "tidak_jelas", alasan: "pintu lebar" },
      { id: "M-07", nilai: "ya", alasan: "ada ruang" },
      { id: "M-09", nilai: "tidak_jelas", alasan: "" },
    ]);
  });

  it("masukan rusak menghasilkan jawaban kosong dan bukan kamar mandi", () => {
    expect(bersihkan(null)).toEqual({ kamar_mandi: false, jawaban: [] });
    expect(bersihkan({ kamar_mandi: "ya", jawaban: "x" })).toEqual({ kamar_mandi: false, jawaban: [] });
  });
});

describe("POST", () => {
  const permintaan = (badan: unknown, asal?: string) =>
    new Request("http://localhost/api/analisis", {
      method: "POST",
      headers: { host: "localhost", ...(asal ? { origin: asal } : {}) },
      body: typeof badan === "string" ? badan : JSON.stringify(badan),
    });

  it("403 untuk asal lain, 500 tanpa kunci, 400 untuk isi tidak valid", async () => {
    const kunciLama = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    expect((await POST(permintaan({ gambar: ["a"] }, "https://situs-lain.example"))).status).toBe(403);
    expect((await POST(permintaan({ gambar: ["a"] }))).status).toBe(500);
    process.env.GEMINI_API_KEY = "kunci-uji";
    expect((await POST(permintaan("bukan json"))).status).toBe(400);
    expect((await POST(permintaan({ gambar: [] }))).status).toBe(400);
    expect((await POST(permintaan({ gambar: "string" }))).status).toBe(400);
    expect((await POST(permintaan({ gambar: Array(7).fill("a") }))).status).toBe(400);
    expect((await POST(permintaan({ gambar: [1] }))).status).toBe(400);
    if (kunciLama) process.env.GEMINI_API_KEY = kunciLama;
    else delete process.env.GEMINI_API_KEY;
  });
});
