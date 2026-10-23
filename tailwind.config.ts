import type { Config } from "tailwindcss";

// Semua token desain ada di sini supaya desainer bisa menggantinya.
// Warna dasar mengikuti situs Ruang Setara versi peneliti (ink, green, lime, paper, line, muted).
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        tinta: "#183F37", // teks utama, hijau tua kontras tinggi
        utama: { DEFAULT: "#245C4C", gelap: "#183F37", muda: "#E9F0EA" }, // hijau tenang: tombol dan penanda langkah
        limau: "#DDEBAF", // aksen muda
        kertas: "#FAFBF7", // latar halaman
        putih: "#FFFFFF",
        garis: "#DBE2D8", // pembatas lembut
        redup: "#586B62", // teks sekunder (kontras ≥ 4,5:1 di atas kertas)
        garisKontrol: "#6B7B73", // batas kontrol formulir (kontras ≥ 3:1)
        perhatian: { DEFAULT: "#8A3B0F", muda: "#FBEBDD" }, // hangat: butuh penyesuaian
        info: { DEFAULT: "#1D4E89", muda: "#E6F0FA" }, // biru: terisi dari foto
        draf: { DEFAULT: "#7A4B00", muda: "#FFF1CC" },
        bahaya: { DEFAULT: "#A32020", muda: "#FDEDED" },
      },
      fontFamily: { sans: ["system-ui", "-apple-system", "Segoe UI", "Roboto", "sans-serif"] },
      borderRadius: { kartu: "16px", tombol: "12px" },
      boxShadow: { kartu: "0 1px 2px rgba(24,63,55,0.06), 0 2px 8px rgba(24,63,55,0.05)" },
      fontSize: {
        judul: ["1.75rem", { lineHeight: "1.2", fontWeight: "700", letterSpacing: "-0.02em" }],
        subjudul: ["1.25rem", { lineHeight: "1.35", fontWeight: "700", letterSpacing: "-0.01em" }],
        isi: ["1rem", { lineHeight: "1.55" }],
        kecil: ["0.875rem", { lineHeight: "1.5" }],
        mikro: ["0.75rem", { lineHeight: "1.3", letterSpacing: "0.06em" }],
      },
      minHeight: { sentuh: "44px" },
      minWidth: { sentuh: "44px" },
    },
  },
} satisfies Config;
