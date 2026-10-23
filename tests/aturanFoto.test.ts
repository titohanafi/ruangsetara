import { describe, expect, it } from "vitest";
import { aturanFoto, DAFTAR_AREA, PERTANYAAN } from "../src/domain/konten";

// Aturan baca foto mengikuti kolom "Cara Verifikasi" di sheet peneliti (lihat scripts/aturan_foto.py). Tes ini menjaga
// agar content/pindai.json tidak menyimpang dari sheet bila diedit tangan.
const TAK_BISA_DARI_FOTO = /\b(ukur|uji|simulasi|simulasikan|konfirmasi|kekokohan|genangan|langsung)\b/i;
const OPSIONAL = /bila (diperlukan|memungkinkan)/i;

describe("aturan foto mengikuti Cara Verifikasi di sheet", () => {
  for (const area of DAFTAR_AREA) {
    it(`${area.nama}: wawancara = tidak, ukur/uji/konfirmasi = paling jauh sebagian`, () => {
      const aturan = aturanFoto(area.id);
      for (const p of PERTANYAAN[area.id].pertanyaan) {
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
});
