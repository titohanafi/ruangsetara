import { describe, expect, it } from "vitest";
import {
  LEBAR_KANVAS,
  TINGGI_KANVAS,
  ZOOM_PANEL,
  garisUbin,
  garisUbinLantai,
  gambarShower,
  langkahGambarShower,
  latarPanel,
  kerangkaPanel,
  posisiKait,
  sudutSinggung,
  susunGambar,
  titik,
  ukuranShower,
  type Kerangka,
  type ModeGambar,
  type Primitif,
  type Titik,
} from "../src/domain/gambarShower";
import { JENIS_BENDA, bingkaiBenda, gambarBenda, susunBenda } from "../src/domain/gambarBenda";
import { VARIAN_SHOWER } from "../src/domain/denahPindai";
import { UKURAN_AKSESIBEL, nilaiAcuan } from "../src/domain/ukuranAksesibel";

const MODE: ModeGambar[] = ["kondisi", "hack", "permanen"];

function semuaTitik(p: Primitif): Titik[] {
  switch (p.jenis) {
    case "poligon":
    case "jalur":
    case "garisPoli":
      return p.titik;
    case "garis":
      return [p.dari, p.ke];
    case "elips":
      return [
        [p.cx - p.rx, p.cy - p.ry],
        [p.cx + p.rx, p.cy + p.ry],
      ];
    case "badan":
      return [
        [p.cx - p.rx, p.yAtas - p.ry],
        [p.cx + p.rx, p.yBawah + p.ry],
      ];
    case "cakram":
      return [
        [p.cx - p.r, p.cy - p.r],
        [p.cx + p.r, p.cy + p.r],
      ];
    case "baut":
      return [[p.cx, p.cy]];
    case "tanda":
      return [[p.x, p.y]];
  }
}

describe("nilai acuan ukuran", () => {
  it("PerMen diutamakan, ADA dipakai bila PerMen tidak punya angkanya", () => {
    expect(nilaiAcuan("pancuran-tinggi-kran", "maks_cm")).toMatchObject({ cm: 120, rujukan: "permen_pupr_14_2017" });
    expect(nilaiAcuan("pancuran-selang-hand-shower", "min_cm")).toMatchObject({ cm: 150, rujukan: "ada_2010" });
  });
  it("kosong bila id atau kunci tidak ada", () => {
    expect(nilaiAcuan("tidak-ada", "min_cm")).toBeNull();
    expect(nilaiAcuan("pancuran-tinggi-kran", "lebar_cm")).toBeNull();
  });
  it("urutan di tabel tidak menentukan: PerMen tetap menang walau ditaruh setelah ADA", () => {
    const t = structuredClone(UKURAN_AKSESIBEL);
    const e = t.entri.find((x) => x.id === "pancuran-tinggi-kran");
    e?.nilai.reverse();
    expect(nilaiAcuan("pancuran-tinggi-kran", "maks_cm", t)?.rujukan).toBe("permen_pupr_14_2017");
  });
});

describe("ukuran shower dari tabel", () => {
  it("zona jangkauan diturunkan dari tabel dengan skala gambar", () => {
    const u = ukuranShower();
    expect(u.zonaAtas).toBeCloseTo(120);
    expect(u.zonaBawah).toBeCloseTo(38);
    expect(u.zonaBawah).toBeLessThan(u.zonaAtas);
  });
});

describe("posisi kait hand shower", () => {
  it("kondisi di luar zona jangkauan, hack dan permanen di dalam", () => {
    const u = ukuranShower();
    expect(posisiKait("kondisi", u).uAtas).toBeGreaterThan(u.zonaAtas);
    expect(posisiKait("hack", u).uAtas).toBeLessThanOrEqual(u.zonaAtas);
    expect(posisiKait("permanen", u).uAtas).toBeLessThanOrEqual(u.zonaAtas);
  });
});

describe("gambar shower", () => {
  it.each(VARIAN_SHOWER.flatMap((v) => MODE.map((m) => [v, m] as const)))(
    "%s / %s: semua titik terhingga dan di dalam kanvas",
    (varian, mode) => {
      const daftar = susunGambar(varian, mode, "kanan", { anotasi: true });
      expect(daftar.length).toBeGreaterThan(0);
      for (const p of daftar) {
        for (const [x, y] of semuaTitik(p)) {
          expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
          expect(x).toBeGreaterThanOrEqual(-1);
          expect(x).toBeLessThanOrEqual(LEBAR_KANVAS + 1);
          expect(y).toBeGreaterThanOrEqual(-1);
          expect(y).toBeLessThanOrEqual(TINGGI_KANVAS + 1);
        }
      }
    },
  );

  it("tidak_jelas hanya berisi bentuk bergaris putus-putus, tanpa benda padat", () => {
    const padat = gambarShower("tidak_jelas").filter((p) => "peran" in p && p.peran !== "hantu");
    expect(padat).toEqual([]);
  });

  it("hack memberi bayangan posisi lama dan bagian baru beraksen; permanen beraksen tanpa bayangan", () => {
    const peran = (m: ModeGambar) => new Set(gambarShower("hand_shower_gantung", m).flatMap((p) => ("peran" in p ? [p.peran] : [])));
    expect(peran("kondisi")).toEqual(new Set(["netral"]));
    expect(peran("hack")).toEqual(new Set(["netral", "aksen", "hantu"]));
    expect(peran("permanen")).toEqual(new Set(["netral", "aksen"]));
  });

  it("permanen memasang baut dan hack tidak", () => {
    const jumlahBaut = (m: ModeGambar) => gambarShower("hand_shower_gantung", m).filter((p) => p.jenis === "baut").length;
    expect(jumlahBaut("permanen")).toBe(2);
    expect(jumlahBaut("hack")).toBe(0);
  });

  it("anotasi hanya muncul bila diminta", () => {
    const tanpa = gambarShower("hand_shower_gantung", "kondisi");
    const dengan = gambarShower("hand_shower_gantung", "kondisi", { anotasi: true });
    expect(dengan.length).toBeGreaterThan(tanpa.length);
    expect(dengan.some((p) => p.jenis === "poligon" && p.muka === "zona")).toBe(true);
    expect(tanpa.some((p) => p.jenis === "poligon" && p.muka === "zona")).toBe(false);
  });

  it("gambar tidak pernah memuat angka sebagai tulisan", () => {
    for (const v of VARIAN_SHOWER) {
      for (const m of MODE) {
        const teks = susunGambar(v, m, "kanan", { anotasi: true }).flatMap((p) => (p.jenis === "tanda" ? [p.teks] : []));
        for (const t of teks) expect(t).not.toMatch(/\d/);
      }
    }
  });

  it("latar: dinding putih dan lantai lebih gelap, keduanya berkeramik tipis sebagai penggaris", () => {
    const l = latarPanel();
    const poligon = l.filter((p) => p.jenis === "poligon");
    expect(poligon.map((p) => p.muka)).toEqual(["lantai", "latar"]);
    const gaya = new Set(l.filter((p) => p.jenis === "garis").map((p) => (p.jenis === "garis" ? p.gaya : "")));
    expect([...gaya].sort()).toEqual(["ubin", "ubinLantai"]);
  });

  it("garis keramik lantai berjarak 30 cm dalam dua arah dan dimulai dari titik acuan", () => {
    const k: Kerangka = { dinding: "belakang", sepanjang: 0, bidang: 0, proyeksi: (x, y): Titik => [x, y], skala: 1 };
    const garis = garisUbinLantai(k, 0, 100, 0, 100, 0, 0);
    const sejajarN = garis.filter((g) => g.jenis === "garis" && g.dari[0] === g.ke[0]).map((g) => (g.jenis === "garis" ? g.dari[0] : 0));
    const sejajarA = garis.filter((g) => g.jenis === "garis" && g.dari[1] === g.ke[1]).map((g) => (g.jenis === "garis" ? g.dari[1] : 0));
    expect(sejajarN).toEqual([30, 60, 90]);
    expect(sejajarA).toEqual([30, 60, 90]);
  });

  it("garis keramik berjarak sama dengan ukuran ubin dan dimulai dari titik acuan", () => {
    const k: Kerangka = { dinding: "belakang", sepanjang: 0, bidang: 0, proyeksi: (x, y, z): Titik => [x, -z + y], skala: 1 };
    const garis = garisUbin(k, 0, 100, 100, 0);
    const tegak = garis.filter((g) => g.jenis === "garis" && g.dari[0] === g.ke[0]).map((g) => (g.jenis === "garis" ? g.dari[0] : 0));
    const datar = garis.filter((g) => g.jenis === "garis" && g.dari[1] === g.ke[1]).map((g) => (g.jenis === "garis" ? -g.dari[1] : 0));
    expect(tegak).toEqual([30, 60, 90]);
    expect(datar).toEqual([30, 60, 90]);
  });
});

// Pembanding: dinding kiri harus sama dengan dinding belakang yang dicerminkan terhadap sumbu tengah kanvas,
// dengan sisi terang/gelap (muka kanan/kiri) bertukar.
function cerminkanUji(daftar: Primitif[]): Primitif[] {
  const x = (v: number) => LEBAR_KANVAS - v;
  const p = (t: Titik): Titik => [x(t[0]), t[1]];
  const tukar = <T extends string>(m: T): T => (m === "kanan" ? ("kiri" as T) : m === "kiri" ? ("kanan" as T) : m);
  return daftar.map((s): Primitif => {
    switch (s.jenis) {
      case "poligon":
        return { ...s, muka: tukar(s.muka), titik: s.titik.map(p) };
      case "elips":
        return { ...s, cx: x(s.cx) };
      case "badan":
        // badan silinder tegak: nada terang/gelapnya tetap (cahaya dari arah yang sama), tidak ikut tertukar
        return { ...s, cx: x(s.cx) };
      case "cakram":
        return { ...s, cx: x(s.cx), sumbuA: [-s.sumbuA[0], s.sumbuA[1]] };
      case "garis":
        return { ...s, dari: p(s.dari), ke: p(s.ke) };
      case "jalur":
      case "garisPoli":
        return { ...s, titik: s.titik.map(p) };
      case "baut":
        return { ...s, cx: x(s.cx) };
      case "tanda":
        return { ...s, x: x(s.x) };
    }
  });
}
// Urutan titik pada poligon dan urutan sisi satu kotak boleh beda (arah putar berbalik saat dicerminkan); yang
// dibandingkan bentuknya.
const bulat = (v: number) => Math.round(v * 1e2) / 1e2 + 0;
const urut = (p: Titik, q: Titik) => p[0] - q[0] || p[1] - q[1];
const bulatkan = (daftar: Primitif[]) =>
  JSON.stringify(
    daftar
      .map((s) => {
        let n: Primitif = s;
        if (s.jenis === "poligon") n = { ...s, titik: [...s.titik].sort(urut) };
        if (s.jenis === "garis") n = urut(s.dari, s.ke) > 0 ? { ...s, dari: s.ke, ke: s.dari } : s;
        if (s.jenis === "garisPoli")
          n = { ...s, titik: urut(s.titik[0], s.titik[s.titik.length - 1]) > 0 ? [...s.titik].reverse() : s.titik };
        return JSON.stringify(n, (_k, v: unknown) => (typeof v === "number" ? bulat(v) : v));
      })
      .sort(),
  );

describe("dinding kiri", () => {
  it.each(VARIAN_SHOWER.flatMap((v) => MODE.map((m) => [v, m] as const)))(
    "%s / %s: sama dengan dinding kanan yang dicerminkan",
    (varian, mode) => {
      const kanan = susunGambar(varian, mode, "kanan", { anotasi: true });
      const kiri = susunGambar(varian, mode, "kiri", { anotasi: true });
      expect(bulatkan(kiri)).toBe(bulatkan(cerminkanUji(kanan)));
    },
  );
});

describe("kerangka dinding di ruangan", () => {
  const proyeksi = (x: number, y: number, z: number): Titik => [(x - y) * Math.cos(Math.PI / 6) + 283, (x + y) * 0.5 - z + 215];
  const dindingSemua = ["belakang", "kiri", "kanan", "depan"] as const;

  it.each(dindingSemua)("benda di dinding %s menjorok ke dalam ruangan 200x300", (dinding) => {
    const bidang = { belakang: 0, kiri: 0, kanan: 200, depan: 300 }[dinding];
    const sepanjang = dinding === "belakang" || dinding === "depan" ? 100 : 150;
    const k = { dinding, sepanjang, bidang, proyeksi, skala: 0.6 };
    const dasar = titik(k, 0, 0, 0);
    const masuk = titik(k, 0, 40, 0);
    const [x, y] = [masuk[0] - dasar[0], masuk[1] - dasar[1]];
    // menjauhi dinding ke dalam: belakang +y (kiri-bawah), kiri +x (kanan-bawah), kanan -x (kiri-atas), depan -y (kanan-atas)
    const diharapkan = { belakang: [-1, 1], kiri: [1, 1], kanan: [-1, -1], depan: [1, -1] }[dinding];
    expect(Math.sign(x)).toBe(diharapkan[0]);
    expect(Math.sign(y)).toBe(diharapkan[1]);
  });

  it.each(dindingSemua)("skala mengecilkan seluruh gambar secara seragam di dinding %s", (dinding) => {
    const mk = (skala: number) => ({
      dinding,
      sepanjang: 0,
      bidang: 0,
      proyeksi: (x: number, y: number, z: number): Titik => [x - y, x + y - z],
      skala,
    });
    const a = gambarShower("hand_shower_gantung", "kondisi", { kerangka: mk(1) });
    const b = gambarShower("hand_shower_gantung", "kondisi", { kerangka: mk(0.5) });
    expect(b).toHaveLength(a.length);
    const jangkauan = (d: Primitif[]) => {
      const pts = d.flatMap(semuaTitik);
      const xs = pts.map((p) => p[0]);
      const ys = pts.map((p) => p[1]);
      return [Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)];
    };
    const [wa, ha] = jangkauan(a);
    const [wb, hb] = jangkauan(b);
    expect(wb / wa).toBeGreaterThan(0.4);
    expect(wb / wa).toBeLessThan(0.65);
    expect(hb / ha).toBeGreaterThan(0.4);
    expect(hb / ha).toBeLessThan(0.65);
  });

  it("semua varian bisa digambar di semua dinding tanpa titik tak terhingga", () => {
    for (const dinding of dindingSemua) {
      for (const v of VARIAN_SHOWER) {
        const k = { dinding, sepanjang: 50, bidang: 0, proyeksi, skala: 0.6 };
        for (const m of MODE) {
          for (const p of gambarShower(v, m, { kerangka: k })) {
            for (const [x, y] of semuaTitik(p)) expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
          }
        }
      }
    }
  });
});

describe("sisi kotak yang terlihat dari kamera", () => {
  const proyeksi = (x: number, y: number, z: number): Titik => [(x - y) * 0.866, (x + y) * 0.5 - z];
  const buat = (lihat: { x: 1 | -1; y: 1 | -1 }) =>
    gambarShower("tidak_jelas", "kondisi", { kerangka: { dinding: "belakang", sepanjang: 0, bidang: 0, proyeksi, skala: 1, lihat } });
  const kotakHantu = (d: Primitif[]) => d.filter((p) => p.jenis === "poligon");

  it("selalu tiga sisi: atas, satu terang, satu gelap", () => {
    for (const x of [1, -1] as const) {
      for (const y of [1, -1] as const) {
        const muka = kotakHantu(buat({ x, y })).map((p) => (p.jenis === "poligon" ? p.muka : ""));
        expect(muka.sort()).toEqual(["atas", "kanan", "kiri"]);
      }
    }
  });

  it("kamera dari sisi sebaliknya menggambar sisi tegak yang berbeda", () => {
    const ambil = (d: Primitif[]) => JSON.stringify(kotakHantu(d).map((p) => (p.jenis === "poligon" ? p.titik : [])));
    expect(ambil(buat({ x: 1, y: 1 }))).not.toBe(ambil(buat({ x: -1, y: 1 })));
    expect(ambil(buat({ x: 1, y: 1 }))).not.toBe(ambil(buat({ x: 1, y: -1 })));
  });

  it("memakai skala layar proyeksi: lingkaran dan garis ikut membesar", () => {
    const besar =
      (m: number) =>
      (x: number, y: number, z: number): Titik => [(x - y) * 0.866 * m, ((x + y) * 0.5 - z) * m];
    const radius = (m: number) => {
      const d = gambarShower("hand_shower_gantung", "kondisi", {
        kerangka: { dinding: "belakang", sepanjang: 0, bidang: 0, proyeksi: besar(m), skala: 0.5 },
      });
      const c = d.find((p) => p.jenis === "cakram");
      return c && c.jenis === "cakram" ? Math.hypot(...c.sumbuA) * c.r : 0;
    };
    expect(radius(60) / radius(1)).toBeCloseTo(60, 5);
  });
});

describe("proyeksi", () => {
  it("naik 1 cm menggeser titik sebesar pembesaran panel ke atas layar", () => {
    const k = kerangkaPanel("kanan");
    const [x1, y1] = titik(k, 10, 5, 0);
    const [x2, y2] = titik(k, 10, 5, 1);
    expect(x2).toBe(x1);
    expect(y2).toBeCloseTo(y1 - ZOOM_PANEL);
  });
  it("sudut singgung silinder cakram: garis siluet sejajar arah tebal", () => {
    const d: Titik = [-8.66, 5];
    const sumbu: Titik = [Math.sqrt(3) / 2, 0.5];
    const naik: Titik = [0, -1];
    const th = sudutSinggung(sumbu, naik, d);
    const turunan: Titik = [-Math.sin(th) * sumbu[0] + Math.cos(th) * naik[0], -Math.sin(th) * sumbu[1] + Math.cos(th) * naik[1]];
    expect(turunan[0] * d[1] - turunan[1] * d[0]).toBeCloseTo(0);
  });
});

describe("langkah gambar yang ditampilkan", () => {
  it("tiga langkah hanya untuk hand shower yang perlu perhatian", () => {
    expect(langkahGambarShower("hand_shower_gantung", true)).toEqual(["kondisi", "hack", "permanen"]);
    expect(langkahGambarShower("hand_shower_gantung", false)).toEqual(["kondisi"]);
  });
  it("varian lain hanya kondisi, dan tidak_jelas tanpa gambar", () => {
    expect(langkahGambarShower("shower_tetap", true)).toEqual(["kondisi"]);
    expect(langkahGambarShower("ember_gayung", true)).toEqual(["kondisi"]);
    expect(langkahGambarShower("tidak_jelas", true)).toEqual([]);
  });
});

describe("gambar benda kamar mandi", () => {
  it.each(JENIS_BENDA)("%s: ada isi dan semua titik terhingga dan di dalam kanvas", (jenis) => {
    const daftar = susunBenda(jenis, "kanan");
    expect(daftar.length).toBeGreaterThan(2);
    for (const p of daftar) {
      for (const [x, y] of semuaTitik(p)) {
        expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
        expect(x).toBeGreaterThanOrEqual(-1);
        expect(x).toBeLessThanOrEqual(LEBAR_KANVAS + 1);
        expect(y).toBeGreaterThanOrEqual(-1);
        expect(y).toBeLessThanOrEqual(TINGGI_KANVAS + 1);
      }
    }
  });

  it.each(JENIS_BENDA)("%s: dinding kiri sama dengan dinding kanan yang dicerminkan", (jenis) => {
    expect(bulatkan(susunBenda(jenis, "kiri"))).toBe(bulatkan(cerminkanUji(susunBenda(jenis, "kanan"))));
  });

  it.each(JENIS_BENDA)("%s: bingkai pas dengan benda dan berasio panel", (jenis) => {
    const [x, y, w, h] = bingkaiBenda(jenis, "kanan");
    expect(w / h).toBeCloseTo(380 / 500, 5);
    for (const p of gambarBenda(jenis)) {
      for (const [px, py] of semuaTitik(p)) {
        expect(px).toBeGreaterThanOrEqual(x - 1);
        expect(px).toBeLessThanOrEqual(x + w + 1);
        expect(py).toBeGreaterThanOrEqual(y - 1);
        expect(py).toBeLessThanOrEqual(y + h + 1);
      }
    }
  });

  it("benda bisa dipasang di keempat dinding tanpa titik tak terhingga", () => {
    const proyeksi = (x: number, y: number, z: number): Titik => [(x - y) * 0.866, (x + y) * 0.5 - z];
    for (const dinding of ["belakang", "kiri", "kanan", "depan"] as const) {
      for (const lihat of [
        { x: 1, y: 1 },
        { x: -1, y: 1 },
      ] as const) {
        for (const jenis of JENIS_BENDA) {
          const k = { dinding, sepanjang: 10, bidang: 0, proyeksi, skala: 0.5, lihat };
          for (const p of gambarBenda(jenis, k))
            for (const [x, y] of semuaTitik(p)) expect(Number.isFinite(x) && Number.isFinite(y)).toBe(true);
        }
      }
    }
  });

  it("wastafel: keran bersih (alas tepi + garis tipis) dan meja berbentuk D di atas penopang", () => {
    const daftar = gambarBenda("wastafel");
    const poligon = daftar.filter((p) => p.jenis === "poligon");
    const tepi = poligon.filter((p) => p.tepi);
    const tipis = poligon.filter((p) => p.garisTipis);
    // Dua kotak keran (tiang dan cerat), masing-masing tiga sisi terlihat.
    expect(tepi).toHaveLength(6);
    expect(tipis).toHaveLength(6);
    // Alas tepi digambar sebelum semua poligon bergaris tipis.
    expect(daftar.indexOf(tepi[tepi.length - 1])).toBeLessThan(daftar.indexOf(tipis[0]));
    // Benda lain tidak memakai gaya ini.
    for (const jenis of ["kloset_duduk", "kloset_jongkok", "pintu"] as const)
      expect(gambarBenda(jenis).some((p) => p.jenis === "poligon" && (p.tepi || p.garisTipis))).toBe(false);
  });

  it("kloset duduk: mangkuk bergeser sama relatif ke tangki di semua dinding dan sudut pandang (cermin untuk sisi berlawanan)", () => {
    const proyeksi =
      (az: number) =>
      (x: number, y: number, z: number): Titik => {
        const [c, s] = [Math.cos(az), Math.sin(az)];
        return [(x * s - y * c) * 0.866, (x * c + y * s) * 0.5 - z];
      };
    const pusatRongga = (k: Kerangka): Titik => {
      const rongga = gambarBenda("kloset_duduk", k).filter((p) => p.jenis === "poligon" && p.muka === "rongga");
      const t = (rongga[rongga.length - 1] as { titik: Titik[] }).titik;
      return [t.reduce((a, p) => a + p[0], 0) / t.length, t.reduce((a, p) => a + p[1], 0) / t.length];
    };
    // Dinding belakang dan kiri, kamera di sisi positif: bayangan cermin satu sama lain.
    const dasar = { sepanjang: 0, bidang: 0, skala: 1, proyeksi: proyeksi(Math.PI / 4), lihat: { x: 1, y: 1 } } as const;
    const belakang = pusatRongga({ ...dasar, dinding: "belakang" });
    const kiri = pusatRongga({ ...dasar, dinding: "kiri" });
    const tangki = (k: Kerangka): Titik => titik(k, 0, 9, 60);
    const relB = belakang[0] - tangki({ ...dasar, dinding: "belakang" })[0];
    const relK = kiri[0] - tangki({ ...dasar, dinding: "kiri" })[0];
    expect(relB).toBeCloseTo(-relK, 6);
  });

  it("pintu: daun digambar sebelum kusen bila membuka menjauhi kamera, sesudahnya bila mendekati", () => {
    const proyeksi = (x: number, y: number, z: number): Titik => [(x - y) * 0.866, (x + y) * 0.5 - z];
    // Kamera di sisi +x/+y. Dinding belakang: arah masuk (n) = +y, mendekati kamera. Dinding depan: n = -y, menjauhi.
    const terakhir = (dinding: "belakang" | "depan") => {
      const daftar = gambarBenda("pintu", { dinding, sepanjang: 0, bidang: 0, proyeksi, skala: 1, lihat: { x: 1, y: 1 } });
      return daftar[daftar.length - 1] as { titik: Titik[] };
    };
    const tinggiLayar = (p: { titik: Titik[] }) => Math.max(...p.titik.map((t) => t[1])) - Math.min(...p.titik.map((t) => t[1]));
    // Yang digambar terakhir: gagang pada daun (tipis, 4 satuan) bila daun mendekati kamera, atau kusen atas (8 satuan)
    // bila daun menjauhi kamera.
    expect(tinggiLayar(terakhir("belakang"))).toBeLessThan(tinggiLayar(terakhir("depan")));
  });
});
