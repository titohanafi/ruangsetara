"""Menurunkan content/pindai.json (aturan baca foto per pertanyaan) dari kolom "Cara Verifikasi" di sheet peneliti.

Aturan (ikut sheet, bukan tebakan):
- ada wawancara                                   -> tidak     (tidak ditanyakan ke AI)
- ada ukur / uji / simulasi / konfirmasi / kekokohan / genangan / langsung -> sebagian  (hanya "Tidak" yang boleh terisi dari foto)
- selain itu (observasi atau foto saja)           -> bisa      (Ya dan Tidak boleh terisi)
Klausa yang berisi "bila diperlukan" atau "bila memungkinkan" dianggap opsional dan tidak dihitung.
Pengecualian per pertanyaan ada di PENGECUALIAN (dengan alasan tertulis).
Jalankan setelah scripts/impor_xlsx.py: python3 scripts/aturan_foto.py  (tambah --cek untuk hanya membandingkan)
"""
import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
AREA = ["mobilitas", "dapur", "kamar-tidur", "kamar-mandi"]
CATATAN = (
    "Diturunkan dari kolom 'Cara Verifikasi' di sheet peneliti oleh scripts/aturan_foto.py (jangan edit tangan). "
    "'bisa': hanya observasi atau foto, jadi Ya maupun Tidak boleh terisi dari foto. "
    "'sebagian': verifikasi butuh ukur, uji, konfirmasi pengguna, atau periksa kekokohan, jadi hanya Tidak (hambatan yang jelas terlihat) yang boleh terisi. "
    "'tidak': verifikasi butuh wawancara, jadi tidak ditanyakan ke AI. Aturan ini belum ditinjau peneliti."
)
WAWANCARA = re.compile(r"wawancara", re.I)
TAK_BISA_DARI_FOTO = re.compile(r"\b(ukur|uji|simulasi|simulasikan|konfirmasi|kekokohan|genangan|langsung)\b", re.I)
OPSIONAL = re.compile(r"bila (diperlukan|memungkinkan)", re.I)


# Pengecualian tertulis atas keputusan pemilik: pertanyaan yang hambatan utamanya kelihatan di foto dan sheet menyebut "foto"
# pada Cara Verifikasi-nya. Tiap pengecualian wajib punya alasan, ikut tertulis di pindai.json, dan perlu ditinjau peneliti.
PENGECUALIAN = {
    ("kamar-mandi", "M-08"): (
        "bisa",
        "Cara Verifikasi di sheet diawali 'Foto area mandi', dan hambatan utamanya (ambang, bibir bak) kelihatan di foto. "
        "Foto tidak membuktikan ambang kecil, ruang pendekatan, atau metode mandi, jadi jawabannya tetap bertanda 'Terisi dari foto' dan bisa diubah.",
    ),
}


def aturan(cara) -> str:
    klausa = [k for k in re.split(r"[;\n]", cara or "") if k.strip() and not OPSIONAL.search(k)]
    teks = "; ".join(klausa)
    if WAWANCARA.search(teks):
        return "tidak"
    if TAK_BISA_DARI_FOTO.search(teks):
        return "sebagian"
    return "bisa"


def turunkan() -> dict:
    hasil: dict = {"catatan": CATATAN}
    for a in AREA:
        d = json.loads((ROOT / "content" / "pertanyaan" / f"{a}.json").read_text(encoding="utf-8"))
        hasil[a] = {p["id"]: PENGECUALIAN.get((a, p["id"]), (aturan(p["cara_verifikasi"]),))[0] for p in d["pertanyaan"]}
    hasil["pengecualian"] = {f"{a}/{i}": alasan for (a, i), (_, alasan) in PENGECUALIAN.items()}
    return hasil


if __name__ == "__main__":
    baru = turunkan()
    berkas = ROOT / "content" / "pindai.json"
    lama = json.loads(berkas.read_text(encoding="utf-8"))
    for a in AREA:
        for i, n in baru[a].items():
            if lama[a].get(i) != n:
                print(f"{i}: {lama[a].get(i)} -> {n}")
    if "--cek" not in sys.argv:
        berkas.write_text(json.dumps(baru, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print("pindai.json ditulis")
