import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { isi, UI } from "../domain/konten";
import { useStore } from "../state/store";

export const JALUR = ["/", "/profil", "/prioritas", "/pertanyaan", "/hasil"] as const;

function Merek() {
  return (
    <a href="#/" className="flex items-center text-[1.4rem] font-bold tracking-tight text-tinta no-underline">
      <span aria-hidden className="mr-2.5 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-utama text-[1.4rem] text-putih">
        ⌂
      </span>
      <span>{UI.merek.nama.slice(0, 4)}</span>
      <span className="font-normal">{UI.merek.nama.slice(4)}</span>
    </a>
  );
}

/** Kerangka halaman: header, daftar langkah (kolom kiri di layar lebar, bilah progres di ponsel), dan isi. */
export function Layout({ langkah, label, children }: { langkah: number; label: string; children: ReactNode }) {
  const { kirim } = useStore();
  const pindah = useNavigate();
  const total = UI.langkah.length;
  const mulaiUlang = () => {
    kirim({ jenis: "ulang" });
    pindah("/");
  };
  return (
    <div className="min-h-screen">
      <a
        href="#isi"
        className="sr-only focus:not-sr-only focus:absolute focus:left-2 focus:top-2 focus:z-10 focus:rounded focus:bg-putih focus:p-2"
      >
        {UI.merek.lewatiKonten}
      </a>
      <header className="tanpa-cetak flex min-h-16 flex-wrap items-center gap-x-6 gap-y-2 border-b border-garis bg-putih px-[5%] py-3">
        <Merek />
        <span className="hidden rounded-full border border-garis px-3 py-1.5 text-mikro font-semibold uppercase text-redup sm:inline">
          {UI.merek.lencana}
        </span>
        <button
          type="button"
          onClick={mulaiUlang}
          className="ml-auto min-h-sentuh text-kecil font-semibold text-utama underline-offset-4 hover:underline"
        >
          {UI.merek.mulaiUlang} ↗
        </button>
      </header>
      <div className="lg:grid lg:grid-cols-[320px_1fr]">
        <aside className="tanpa-cetak hidden border-r border-garis bg-utama-muda px-8 py-10 lg:block">
          <p className="label-mikro">{UI.samping.label}</p>
          <h2 className="mt-3 text-judul">{UI.samping.judul}</h2>
          <p className="mt-4 text-kecil text-redup">{UI.samping.isi}</p>
          <ol className="mt-8 space-y-4">
            {UI.langkah.map((nama, i) => (
              <li key={nama} aria-current={i === langkah ? "step" : undefined} className="flex items-center gap-3">
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full border text-kecil font-bold ${
                    i === langkah
                      ? "border-utama bg-utama text-putih"
                      : i < langkah
                        ? "border-utama bg-limau text-tinta"
                        : "border-garisKontrol text-redup"
                  }`}
                >
                  {i < langkah ? "✓" : i + 1}
                </span>
                <span className={i === langkah ? "font-semibold" : "text-redup"}>{nama}</span>
              </li>
            ))}
          </ol>
          <div className="mt-10 border-t border-garis pt-5 text-kecil">
            <p className="font-semibold">{UI.samping.privasiJudul}</p>
            <p className="mt-1 text-redup">{UI.samping.privasiIsi}</p>
          </div>
        </aside>
        <main id="isi" className="mx-auto w-full max-w-3xl px-[5%] py-6 lg:px-10 lg:py-10">
          <div className="tanpa-cetak mb-5 lg:hidden" role="group" aria-label={isi(UI.langkahLabel, { n: langkah + 1, total })}>
            <div className="h-1.5 overflow-hidden rounded-full bg-garis">
              <div className="h-full bg-utama" style={{ width: `${((langkah + 1) / total) * 100}%` }} />
            </div>
          </div>
          <p className="label-mikro">
            {isi(UI.langkahLabel, { n: langkah + 1, total })} · {label}
          </p>
          {children}
        </main>
      </div>
    </div>
  );
}
