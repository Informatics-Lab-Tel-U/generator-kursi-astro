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

// Metode pengecekan: DOM Measurement (mendukung semua browser modern dan kebal anti-fingerprinting)

// Metode fallback: bandingkan lebar teks render (untuk browser lama / edge case)
function checkFontFallback(fontName: string): boolean {
  if (typeof document === 'undefined' || !document.body) return false; // Safety for SSR
  
  // Gunakan teks yang panjang dan memiliki berbagai macam bentuk karakter 
  // agar perbedaan kerning/metrics sekecil apapun akan terakumulasi dan mengubah offsetWidth.
  const testString = "mmmmmmmmmmlliiiO0wwwwwwwwwww@#%&!";
  const testSize = "72px";
  
  // BERALIH KE DOM MEASUREMENT (BUKAN CANVAS)
  // Alasan 1: Canvas measureText sering di-fuzz/diacak oleh fitur Anti-Fingerprinting 
  // (misal Brave Shields, Safari Advanced Tracking Protection) yang mereturn nilai palsu,
  // menyebabkan false-positive terus-menerus.
  // Alasan 2: DOM layout (offsetWidth) jarang di-fuzz karena dapat merusak CSS/layout website.
  const span = document.createElement("span");
  span.style.position = "absolute";
  span.style.left = "-9999px";
  span.style.top = "-9999px";
  span.style.fontSize = testSize;
  span.style.lineHeight = "normal"; // Pastikan line-height standar agar offsetHeight akurat
  span.style.whiteSpace = "nowrap"; // Mencegah text-wrapping yang bisa mengacaukan ukuran lebar
  // --- FIX UTAMA: matikan font-boosting mobile ---
  ;(span.style as any).webkitTextSizeAdjust = "none";
  ;(span.style as any).textSizeAdjust = "none";
  // --- matikan transition kalau ada global CSS reset yang nempel ---
  span.style.transition = "none";
  span.innerHTML = testString;
  document.body.appendChild(span);

  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  let detected = false;

  for (const baseFont of baseFonts) {
    // 1. CONTROL GROUP: Cek ukuran saat menggunakan font fiktif (mengkapitalisasi fallback murni).
    // Ini menyelesaikan masalah quirk fallback di Safari/Android.
    span.style.fontFamily = `"ThisFontDoesNotExist123", ${baseFont}`;
    // paksa baca offsetWidth (force reflow) agar layout benar-benar settle sebelum pengukuran asli
    void span.offsetWidth;
    const fallbackWidth = span.offsetWidth;
    const fallbackHeight = span.offsetHeight;

    // 2. TARGET: Cek ukuran pakai font rahasia kita.
    span.style.fontFamily = `"${fontName}", ${baseFont}`;
    // force reflow sekali lagi untuk target
    void span.offsetWidth;
    const targetWidth = span.offsetWidth;
    const targetHeight = span.offsetHeight;

    // Jika terjadi perbedaan ukuran fisik (lebar atau tinggi) yang kasat mata pada DOM,
    // berarti font kita BERHASIL dirender.
    if (targetWidth !== fallbackWidth || targetHeight !== fallbackHeight) {
      detected = true;
      break;
    }
  }

  // Bersihkan DOM
  document.body.removeChild(span);

  return detected;
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
    const isMatch = checkFontFallback(fontName);

    if (isMatch) {
      // Format TULT0604 menjadi TULT 0604 agar konsisten dengan overview
      return roomCode.replace(/([a-zA-Z]+)(\d+)/, '$1 $2');
    }
  }
  return null;
}
