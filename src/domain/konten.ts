// Memuat dan memvalidasi semua konten di content/. Dipakai aplikasi, fungsi server, dan skrip validasi.
import { z } from "zod";
import areaJson from "../../content/area.json";
import profilJson from "../../content/profil.json";
import hasilJson from "../../content/hasil.json";
import pindaiJson from "../../content/pindai.json";
import uiJson from "../../content/ui.json";
import mobilitas from "../../content/pertanyaan/mobilitas.json";
import dapur from "../../content/pertanyaan/dapur.json";
import kamarTidur from "../../content/pertanyaan/kamar-tidur.json";
import kamarMandi from "../../content/pertanyaan/kamar-mandi.json";
import { ATURAN_FOTO, SkemaArea, SkemaBerkasPertanyaan, SkemaHasilKonten, SkemaPindaiKonten, SkemaProfil } from "./skema";

export type Pertanyaan = z.infer<typeof SkemaBerkasPertanyaan>["pertanyaan"][number];
export type Area = z.infer<typeof SkemaArea>["area"][number];
export type AturanFoto = (typeof ATURAN_FOTO)[number];
export type Ui = typeof uiJson;

export const DAFTAR_AREA: Area[] = SkemaArea.parse(areaJson).area;
export const PROFIL = SkemaProfil.parse(profilJson);
export const HASIL = SkemaHasilKonten.parse(hasilJson);
export const UI: Ui = uiJson;

const BERKAS: Record<string, unknown> = { mobilitas, dapur, "kamar-tidur": kamarTidur, "kamar-mandi": kamarMandi };

export const PERTANYAAN: Record<string, { fokus: string | null; pertanyaan: Pertanyaan[] }> = Object.fromEntries(
  DAFTAR_AREA.map((a) => [a.id, SkemaBerkasPertanyaan.parse(BERKAS[a.id])]),
);

const PINDAI = SkemaPindaiKonten.parse(pindaiJson);

/** Aturan foto per pertanyaan untuk satu area; kosong bila area itu tidak dibaca AI. */
export function aturanFoto(areaId: string): Record<string, AturanFoto> {
  const b = PINDAI[areaId];
  return b && typeof b === "object" ? b : {};
}

export function cariArea(id: string | null | undefined): Area | undefined {
  return DAFTAR_AREA.find((a) => a.id === id);
}

/** Mengisi {n}, {total}, dan sejenisnya di teks antarmuka. */
export function isi(teks: string, nilai: Record<string, string | number>): string {
  return teks.replace(/\{(\w+)\}/g, (_, k: string) => String(nilai[k] ?? ""));
}
