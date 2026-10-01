
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

function checkFontFallback(fontName: string): boolean {
  if (typeof document === 'undefined' || !document.body) return false;

  const testString = "mmmmmmmmmmlliiiO0wwwwwwwwwww@#%&!";
  const testSize = "72px";

  const span = document.createElement("span");
  span.style.position = "absolute";
  span.style.left = "-9999px";
  span.style.top = "-9999px";
  span.style.fontSize = testSize;
  span.style.lineHeight = "normal";
  span.style.whiteSpace = "nowrap";
  ;(span.style as any).webkitTextSizeAdjust = "none";
  ;(span.style as any).textSizeAdjust = "none";
  span.style.transition = "none";
  span.innerHTML = testString;
  document.body.appendChild(span);

  const baseFonts = ['monospace', 'sans-serif', 'serif'];
  let detected = false;

  for (const baseFont of baseFonts) {
    span.style.fontFamily = `"ThisFontDoesNotExist123", ${baseFont}`;
    void span.offsetWidth;
    const fallbackWidth = span.offsetWidth;
    const fallbackHeight = span.offsetHeight;

    span.style.fontFamily = `"${fontName}", ${baseFont}`;
    void span.offsetWidth;
    const targetWidth = span.offsetWidth;
    const targetHeight = span.offsetHeight;

    if (targetWidth !== fallbackWidth || targetHeight !== fallbackHeight) {
      detected = true;
      break;
    }
  }

  document.body.removeChild(span);

  return detected;
}

export async function detectCurrentLabRoom(): Promise<string | null> {
  if (typeof document === 'undefined') return null;

  await document.fonts.ready;

  for (const roomCode of VALID_ROOMS) {
    const fontName = buildFontName(roomCode);
    const isMatch = checkFontFallback(fontName);

    if (isMatch) {
      return roomCode.replace(/([a-zA-Z]+)(\d+)/, '$1 $2');
    }
  }
  return null;
}
