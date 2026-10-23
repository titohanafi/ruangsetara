import { describe, expect, it } from "vitest";
import { POST, bersihkan, susun } from "../server/analisis";
import { DAFTAR_AREA, PERTANYAAN } from "../src/domain/konten";

const kamarMandi = susun("kamar-mandi")!;

describe("susun (prompt dan skema per area)", () => {
  it("kamar mandi: memuat pertanyaan peneliti dan hanya 11 id (tanpa M-12)", () => {
    expect(kamarMandi.prompt).toContain("M-07");
    expect(kamarMandi.prompt).toContain("Apakah wastafel dapat digunakan dari posisi duduk?");
    expect(kamarMandi.prompt).not.toContain("M-12");
    expect(kamarMandi.ids).toHaveLength(11);
    expect(kamarMandi.skema.properties.jawaban.items.properties.id.enum).toEqual(kamarMandi.ids);
  });

  it("menandai pertanyaan 'sebagian' sebagai tidak boleh dijawab Ya dari foto", () => {
    const m01 = kamarMandi.prompt.split("\n").find((l) => l.startsWith("- M-01"));
    expect(m01).toContain('answer "tidak" only');
    const m09 = kamarMandi.prompt.split("\n").find((l) => l.startsWith("- M-09"));
    expect(m09).toContain('both "ya" and "tidak"');
  });

  it("kamar mandi tetap memakai aturan jangkauan yang sudah teruji; area lain memakai versi umum", () => {
    expect(kamarMandi.prompt).toContain("the tap, the shower head holder and the soap shelf");
    expect(susun("dapur")!.prompt).toContain("switches, door handles, controls, shelves");
    expect(susun("dapur")!.prompt).not.toContain("shower head holder");
  });

  it("tiap area yang bisa dipindai punya prompt sesuai jenis ruangnya, dan hanya pertanyaan yang tidak berstatus 'tidak'", () => {
    const jenis: Record<string, string> = {
      mobilitas: "indoor space",
      dapur: "a kitchen",
      "kamar-tidur": "a bedroom",
      "kamar-mandi": "a bathroom",
    };
    for (const a of DAFTAR_AREA.filter((x) => x.bisa_dipindai)) {
      const s = susun(a.id)!;
      expect(s.prompt).toContain(jenis[a.id]);
      const tanpaAI = PERTANYAAN[a.id].pertanyaan.filter((p) => s.aturan[p.id] === "tidak").map((p) => p.id);
      for (const id of tanpaAI) expect(s.ids).not.toContain(id);
      expect(s.ids.length + tanpaAI.length).toBe(PERTANYAAN[a.id].pertanyaan.length);
    }
  });

  it("area tidak dikenal atau bukan string: null", () => {
    expect(susun("garasi")).toBeNull();
    expect(susun(undefined)).toBeNull();
    expect(susun(5)).toBeNull();
  });
});

describe("bersihkan", () => {
  it("membuang id tak dikenal dan ganda, serta menurunkan Ya pada pertanyaan 'sebagian'", () => {
    const r = bersihkan(
      {
        kamar_mandi: true,
        jawaban: [
          { id: "M-01", nilai: "ya", alasan: "pintu lebar" },
          { id: "M-09", nilai: "ya", alasan: "ada ruang" },
          { id: "M-09", nilai: "tidak", alasan: "ganda" },
          { id: "M-12", nilai: "ya", alasan: "bukan ditanya" },
          { id: "G-05", nilai: "ya", alasan: "id area lain" },
          { id: "M-10", nilai: "ngawur", alasan: 5 },
        ],
      },
      kamarMandi,
    );
    expect(r.jawaban).toEqual([
      { id: "M-01", nilai: "tidak_jelas", alasan: "pintu lebar" },
      { id: "M-09", nilai: "ya", alasan: "ada ruang" },
      { id: "M-10", nilai: "tidak_jelas", alasan: "" },
    ]);
  });

  it("membaca field ruangan sesuai area (kamar mandi tetap 'kamar_mandi', area lain punya nama sendiri)", () => {
    expect(kamarMandi.field).toBe("kamar_mandi");
    expect(susun("dapur")!.field).toBe("dapur");
    expect(bersihkan({ dapur: true, jawaban: [] }, susun("dapur")!).ruang_sesuai).toBe(true);
    expect(bersihkan({ ruang_sesuai: true, jawaban: [] }, susun("dapur")!).ruang_sesuai).toBe(false);
  });

  it("masukan rusak menghasilkan jawaban kosong dan ruangan tidak sesuai", () => {
    expect(bersihkan(null, kamarMandi)).toEqual({ ruang_sesuai: false, jawaban: [] });
    expect(bersihkan({ kamar_mandi: "ya", jawaban: "x" }, kamarMandi)).toEqual({ ruang_sesuai: false, jawaban: [] });
  });
});

describe("POST", () => {
  const permintaan = (badan: unknown, asal?: string) =>
    new Request("http://localhost/api/analisis", {
      method: "POST",
      headers: { host: "localhost", ...(asal ? { origin: asal } : {}) },
      body: typeof badan === "string" ? badan : JSON.stringify(badan),
    });
  const area = "kamar-mandi";

  it("403 untuk asal lain, 500 tanpa kunci, 400 untuk isi atau area tidak valid", async () => {
    const kunciLama = process.env.GEMINI_API_KEY;
    delete process.env.GEMINI_API_KEY;
    expect((await POST(permintaan({ gambar: ["a"], area }, "https://situs-lain.example"))).status).toBe(403);
    expect((await POST(permintaan({ gambar: ["a"], area }))).status).toBe(500);
    process.env.GEMINI_API_KEY = "kunci-uji";
    expect((await POST(permintaan("bukan json"))).status).toBe(400);
    expect((await POST(permintaan({ gambar: ["a"] }))).status).toBe(400); // tanpa area
    expect((await POST(permintaan({ gambar: ["a"], area: "garasi" }))).status).toBe(400);
    expect((await POST(permintaan({ gambar: [], area }))).status).toBe(400);
    expect((await POST(permintaan({ gambar: "string", area }))).status).toBe(400);
    expect((await POST(permintaan({ gambar: Array(7).fill("a"), area }))).status).toBe(400);
    expect((await POST(permintaan({ gambar: [1], area }))).status).toBe(400);
    if (kunciLama) process.env.GEMINI_API_KEY = kunciLama;
    else delete process.env.GEMINI_API_KEY;
  });
});
