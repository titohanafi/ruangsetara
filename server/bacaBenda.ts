// Penangan POST bersama untuk fungsi server pembaca benda ruang (denah dapur, kamar tidur, dst.): satu foto ke Gemini dengan prompt
// dan skema masing-masing, jawaban berupa boolean per benda. Prompt checklist (analisis.ts) dan denah kamar mandi (denah.ts) tidak
// memakai berkas ini, supaya yang sudah teruji tidak berubah.
const MAKS_KARAKTER = 900_000; // base64; foto dari aplikasi sudah dikecilkan (sekitar 150-300 KB)

// Model gratis sering sibuk (429/503): coba model utama, lalu cadangan, dengan jeda singkat.
const MODEL_CADANGAN = ["gemini-3.1-flash-lite", "gemini-3.5-flash-lite", "gemini-flash-lite-latest"];
const SEMENTARA = [429, 500, 502, 503, 504];

const jawab = (badan: unknown, status = 200) =>
  new Response(JSON.stringify(badan), { status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" } });

/** Menolak panggilan dari situs lain (browser mengirim Origin); panggilan dari alamat yang sama atau tanpa Origin lolos. */
function asalSama(request: Request): boolean {
  const asal = request.headers.get("origin");
  if (!asal) return true;
  try {
    return new URL(asal).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export interface OpsiBaca {
  prompt: string;
  skema: object;
  /** Memilih bagian jawaban model yang diteruskan ke aplikasi. */
  ambil: (hasil: Record<string, unknown>) => unknown;
  pesanGagal: string;
}

export function buatPOST({ prompt, skema, ambil, pesanGagal }: OpsiBaca): (request: Request) => Promise<Response> {
  return async (request) => {
    if (!asalSama(request)) return jawab({ galat: "tidak diizinkan" }, 403);
    const kunci = process.env.GEMINI_API_KEY;
    if (!kunci) return jawab({ galat: "kunci belum diatur" }, 500);

    let gambar: unknown;
    try {
      gambar = ((await request.json()) as { gambar?: unknown }).gambar;
    } catch {
      return jawab({ galat: "permintaan salah" }, 400);
    }
    if (typeof gambar !== "string" || gambar.length === 0 || gambar.length > MAKS_KARAKTER) {
      return jawab({ galat: "gambar tidak valid" }, 400);
    }

    const daftarModel = [process.env.GEMINI_MODEL ?? MODEL_CADANGAN[0], ...MODEL_CADANGAN].filter((m, i, semua) => semua.indexOf(m) === i);
    const badan = JSON.stringify({
      contents: [{ parts: [{ text: prompt }, { inlineData: { mimeType: "image/jpeg", data: gambar } }] }],
      generationConfig: { responseMimeType: "application/json", responseSchema: skema, temperature: 0 },
    });

    let status = 0;
    for (const [i, model] of daftarModel.entries()) {
      if (i > 0) await new Promise((r) => setTimeout(r, 700));
      let res: Response;
      try {
        res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`, {
          method: "POST",
          headers: { "Content-Type": "application/json", "x-goog-api-key": kunci },
          body: badan,
        });
      } catch (e) {
        console.log("gemini jaringan", model, String(e));
        continue;
      }
      status = res.status;
      if (!res.ok) {
        console.log("gemini", model, status, (await res.text()).slice(0, 300));
        if (SEMENTARA.includes(status) || status === 404) continue;
        break;
      }
      try {
        const data = (await res.json()) as { candidates?: { content?: { parts?: { text?: string }[] } }[] };
        const hasil = JSON.parse(data.candidates?.[0]?.content?.parts?.[0]?.text ?? "") as Record<string, unknown>;
        return jawab(ambil(hasil));
      } catch {
        console.log("gemini respons tidak terbaca", model);
      }
    }
    // Kuota habis atau terlalu sering dipanggil: teruskan 429 supaya aplikasi menampilkan "coba lagi sebentar lagi".
    return jawab({ galat: pesanGagal, status }, status === 429 ? 429 : 502);
  };
}
