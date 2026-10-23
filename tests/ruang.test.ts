import { describe, expect, it } from "vitest";
import { POSISI_BAWAAN, type LetakDenah, type ObjekDenah } from "../src/domain/denahPindai";
import { sudutAwal } from "../src/domain/ruang";

describe("gambar Ruang Anda", () => {
  it("sudut awal: pilih sisi yang menampilkan paling banyak benda, seri jatuh ke kanan", () => {
    const letak = (o: Partial<Record<ObjekDenah, LetakDenah>>) => (id: ObjekDenah) => o[id] ?? POSISI_BAWAAN[id];
    expect(sudutAwal((id) => POSISI_BAWAAN[id])).toBe("kanan");
    const kiri = letak({ kloset: { dinding: "kiri", posisi: "tengah" }, area_mandi: { dinding: "kiri", posisi: "tengah" } });
    expect(sudutAwal(kiri)).toBe("kiri");
    // Benda yang tidak terlihat tidak ikut dihitung.
    expect(sudutAwal(kiri, ["kloset", "area_mandi"])).toBe("kanan");
  });
});
