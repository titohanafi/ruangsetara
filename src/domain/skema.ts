import { z } from "zod";

export const SkemaStatusValidasi = z.enum(["draf", "ditinjau_ahli", "disetujui"]);

export const SkemaPertanyaan = z.object({
  id: z.string().regex(/^[A-Z]-\d{2}$/),
  elemen: z.string().min(1),
  pertanyaan: z.string().min(1),
  indikator: z.string().min(1),
  cara_verifikasi: z.string().min(1),
  referensi: z.string().nullable(),
  hack: z.string().nullable(),
  modifikasi: z.string().nullable(),
  referensi_rekomendasi: z.array(z.string()),
  status_validasi: SkemaStatusValidasi,
});

export const SkemaBerkasPertanyaan = z.object({
  fokus: z.string().nullable(),
  pertanyaan: z.array(SkemaPertanyaan).min(1),
});

export const SkemaArea = z.object({
  area: z.array(
    z.object({
      id: z.string(),
      nama: z.string(),
      ikon: z.string(),
      deskripsi: z.string(),
      aktivitas: z.array(z.string()).min(1),
      bisa_dipindai: z.boolean(),
      foto_teruji: z.boolean(),
    }),
  ),
});

export const SkemaProfil = z.object({
  pengantar: z.string(),
  catatan_caregiver: z.string(),
  pertanyaan: z.array(z.object({ id: z.string(), pertanyaan: z.string(), pilihan: z.array(z.string()).min(2) })),
});

export const SkemaHasilKonten = z.object({
  kategori: z.array(z.object({ nilai: z.enum(["A", "B", "C", "D"]), status: z.string(), makna: z.string(), tindak_lanjut: z.string() })),
  aturan_penting: z.string().nullable(),
  acuan: z.array(z.object({ acuan: z.string(), penggunaan: z.string() })),
  catatan_acuan: z.string().nullable(),
});

export const ATURAN_FOTO = ["bisa", "sebagian", "tidak"] as const;
export const SkemaPindaiKonten = z
  .object({ catatan: z.string() })
  .catchall(z.union([z.string(), z.record(z.string(), z.enum(ATURAN_FOTO))]));
