/**
 * Client-side image compression for scans. Mirrors the native app's rule
 * (~/FlipCheck/app/src/lib/image.ts): downscale to <=1024px wide, JPEG q0.7, base64.
 * Controlling pixels controls the per-scan vision cost. Returns RAW base64 (no data:
 * prefix) because the proxy /api/scan expects raw base64, plus a dataUrl for preview.
 */
export interface Compressed {
  base64: string;
  dataUrl: string;
  width: number;
  height: number;
}

const MAX_W = 1024;
const QUALITY = 0.7;

export async function compressForScan(file: File | Blob): Promise<Compressed> {
  // `from-image` applies EXIF orientation so iOS photos aren't sideways.
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' });
  let width = bitmap.width;
  let height = bitmap.height;
  if (width > MAX_W) {
    height = Math.round((height * MAX_W) / width);
    width = MAX_W;
  }

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas not supported');
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close?.();

  const dataUrl = canvas.toDataURL('image/jpeg', QUALITY);
  const base64 = dataUrl.split(',')[1] ?? '';
  return { base64, dataUrl, width, height };
}

/** Tiny square thumb (96px, q0.5 data-URI) for the localStorage history strip. */
export async function makeThumb(dataUrl: string): Promise<string> {
  try {
    const img = new Image();
    img.src = dataUrl;
    await img.decode();
    const S = 96;
    const canvas = document.createElement('canvas');
    canvas.width = S;
    canvas.height = S;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '';
    const side = Math.min(img.width, img.height);
    ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, S, S);
    return canvas.toDataURL('image/jpeg', 0.5);
  } catch {
    return '';
  }
}
