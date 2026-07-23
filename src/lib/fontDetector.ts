/**
 * Deteksi PC Lab via Font Fingerprinting
 * ----------------------------------------
 * Setiap ruangan Lab punya font rahasia unik: IFLab-<KODERUANGAN>-Secret
 * Font ini sudah di-install permanen (sebelum DeepFreeze) di 1 PC per ruangan.
 * Web hanya perlu cek apakah font sesuai lab_id yang diklaim benar-benar ada di sistem.
 */

// Daftar ruangan yang valid (harus sinkron dengan lab_font_mapping)
export const VALID_ROOMS = [
  "TULT0604",
  "TULT0605",
  "TULT0617",
  "TULT0618",
  "TULT0704",
  "TULT0705",
  "TULT0712",
  "TULT0713",
];

export function buildFontName(roomCode: string): string {
  return `IFLab-${roomCode}-Secret`;
}

// Metode utama: Font Loading API (didukung semua browser modern, termasuk Incognito)
async function checkFontPrimary(fontName: string): Promise<boolean> {
  await document.fonts.ready;
  return document.fonts.check(`12px "${fontName}"`);
}

// Metode fallback: bandingkan lebar teks render (untuk browser lama / edge case)
function checkFontFallback(fontName: string): boolean {
  if (typeof document === 'undefined') return false; // Safety for SSR
  
  const testString = "mmmmmmmmmmlli";
  const testSize = "72px";
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d");
  
  if (!ctx) return false;

  ctx.font = `${testSize} monospace`;
  const baselineWidth = ctx.measureText(testString).width;

  ctx.font = `${testSize} "${fontName}", monospace`;
  const testWidth = ctx.measureText(testString).width;

  return testWidth !== baselineWidth;
}

/**
 * Deteksi ruangan Lab dari PC yang sedang membuka web ini.
 * Mengecek SEMUA font ruangan yang valid, lalu return ruangan mana yang cocok
 * (berguna kalau URL tidak/tidak perlu membawa parameter lab_id sama sekali).
 */
export async function detectCurrentLabRoom(): Promise<string | null> {
  if (typeof document === 'undefined') return null; // Safety for SSR
  
  await document.fonts.ready;

  for (const roomCode of VALID_ROOMS) {
    const fontName = buildFontName(roomCode);
    const isMatch = (await checkFontPrimary(fontName)) || checkFontFallback(fontName);

    if (isMatch) {
      return roomCode;
    }
  }
  return null;
}
