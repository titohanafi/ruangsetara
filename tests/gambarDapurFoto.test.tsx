import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";
import { GambarRuangTetapKartu } from "../src/components/GambarRuangTetapKartu";
import { UI } from "../src/domain/konten";

describe("kartu gambar dapur dari hasil baca foto", () => {
  it("tidak ada benda terbaca: hanya keterangan, tanpa gambar contoh", () => {
    const html = renderToStaticMarkup(<GambarRuangTetapKartu areaId="dapur" id="K-03" tidakTerbaca />);
    expect(html).toContain(UI.ruang.tidakTerbaca.slice(0, 40));
    expect(html).not.toContain('role="img"');
  });

  it("ada benda terbaca: gambar dibuat dengan catatan yang menyebut hasil baca foto", () => {
    const html = renderToStaticMarkup(<GambarRuangTetapKartu areaId="dapur" id="K-03" ada={new Set(["wastafel"])} />);
    expect(html).toContain('role="img"');
    expect(html).toContain(UI.ruang.catatanDapurFoto.slice(0, 40));
    expect(html).not.toContain(UI.ruang.catatanDapur.slice(0, 40));
  });

  it("kamar tidur dan mobilitas tetap memakai catatan tata letak contoh", () => {
    const html = renderToStaticMarkup(<GambarRuangTetapKartu areaId="kamar-tidur" id="B-01" />);
    expect(html).toContain(UI.ruang.catatanKamarTidur.slice(0, 40));
  });
});
