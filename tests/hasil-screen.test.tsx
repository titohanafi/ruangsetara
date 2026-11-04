import { describe, expect, it } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { MemoryRouter } from "react-router-dom";
import { StoreProvider } from "../src/state/store";
import { AWAL } from "../src/state/reducer";
import { HasilScreen } from "../src/screens/Hasil";
import { PERTANYAAN } from "../src/domain/konten";
import type { Nilai } from "../src/domain/asesmen";

describe("recommendations in every room", () => {
  for (const areaId of Object.keys(PERTANYAAN)) {
    for (const nilai of ["tidak", "belum", "ya"] as Nilai[]) {
      it(areaId + ": " + nilai + " without photo layout", () => {
        const daftar = PERTANYAAN[areaId].pertanyaan;
        const jawaban = Object.fromEntries(daftar.map(p => [p.id, { nilai, sumber: "pengguna" as const }]));
        const html = renderToStaticMarkup(<MemoryRouter><StoreProvider awal={{...AWAL, areaId, jawaban}}><HasilScreen /></StoreProvider></MemoryRouter>);
        const controls = html.match(/name="rekomendasi"/g) ?? [];
        expect(controls).toHaveLength(nilai === "ya" ? 0 : daftar.length);
        if (nilai !== "ya") {
          expect(html.match(/checked=""/g)).toHaveLength(1);
          expect(html.match(/<h3 /g)).toHaveLength(1);
          if (nilai === "tidak") expect(html).toContain(daftar[0].hack);
        }
      });
    }
  }
});
