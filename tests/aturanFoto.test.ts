import { describe, expect, it } from "vitest";
import pindaiJson from "../content/pindai.json";
import { aturanFoto, DAFTAR_AREA, PERTANYAAN } from "../src/domain/konten";

const PENGECUALIAN = Object.keys((pindaiJson as { pengecualian: Record<string, string> }).pengecualian);

// Aturan baca foto mengikuti kolom "Cara Verifikasi" di sheet peneliti (lihat scripts/aturan_foto.py). Tes ini menjaga
// agar content/pindai.json tidak menyimpang dari sheet bila diedit tangan.
const TAK_BISA_DARI_FOTO = /\b(ukur|uji|simulasi|simulasikan|konfirmasi|kekokohan|genangan|langsung)\b/i;
const OPSIONAL = /bila (diperlukan|memungkinkan)/i;

describe("aturan foto mengikuti Cara Verifikasi di sheet", () => {
  for (const area of DAFTAR_AREA) {
    it(`${area.nama}: wawancara = tidak, ukur/uji/konfirmasi = paling jauh sebagian`, () => {
      const aturan = aturanFoto(area.id);
      for (const p of PERTANYAAN[area.id].pertanyaan) {
        // Pengecualian tertulis (dengan alasan di pindai.json) dikecualikan dari aturan kata kunci.
        if (PENGECUALIAN.includes(`${area.id}/${p.id}`)) continue;
        const cara = (p.cara_verifikasi ?? "")
          .split(/[;\n]/)
          .filter((k) => !OPSIONAL.test(k))
          .join("; ");
        if (/wawancara/i.test(cara)) expect(aturan[p.id], p.id).toBe("tidak");
        else if (TAK_BISA_DARI_FOTO.test(cara)) expect(aturan[p.id], p.id).toBe("sebagian");
        else expect(aturan[p.id], p.id).toBe("bisa");
      }
    });
  }

  it("perlengkapan mandi (M-07) tidak boleh terjawab Ya dari foto", () => {
    expect(aturanFoto("kamar-mandi")["M-07"]).toBe("sebagian");
  });

  it("pengecualian tertulis: M-08 boleh Ya atau Tidak dari foto, dengan alasan tertulis", () => {
    expect(aturanFoto("kamar-mandi")["M-08"]).toBe("bisa");
    expect(PENGECUALIAN).toEqual(["kamar-mandi/M-08"]);
    const alasan = (pindaiJson as { pengecualian: Record<string, string> }).pengecualian["kamar-mandi/M-08"];
    expect(alasan.length).toBeGreaterThan(40);
  });
});
