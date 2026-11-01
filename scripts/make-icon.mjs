/**
 * Generates the app icon (1024x1024 PNG) without any image dependency, then
 * `tauri icon` derives the .ico/.png set from it.
 */
import { writeFileSync } from "node:fs";
import { deflateSync } from "node:zlib";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const SIZE = 1024;
const SS = 3; // supersampling factor per axis

/* ------------------------------------------------------------- PNG writer -- */
const crcTable = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();
function crc32(buf) {
  let c = 0xffffffff;
  for (let i = 0; i < buf.length; i++) c = crcTable[(c ^ buf[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, "latin1"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}
function encodePNG(rgba, w, h) {
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w, 0);
  ihdr.writeUInt32BE(h, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // RGBA
  const raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) {
    raw[y * (w * 4 + 1)] = 0;
    rgba.copy(raw, y * (w * 4 + 1) + 1, y * w * 4, (y + 1) * w * 4);
  }
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}

/* -------------------------------------------------------------- rasterise -- */
const px = new Float32Array(SIZE * SIZE * 4); // straight RGBA, 0..1

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const mix = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];

function blend(x, y, rgb, a) {
  if (a <= 0) return;
  const i = (y * SIZE + x) * 4;
  const dst = [px[i], px[i + 1], px[i + 2]];
  const da = px[i + 3];
  const oa = a + da * (1 - a);
  if (oa <= 0) return;
  for (let k = 0; k < 3; k++) {
    px[i + k] = (rgb[k] * a + dst[k] * da * (1 - a)) / oa;
  }
  px[i + 3] = oa;
}

// Signed coverage of a shape sampled SS x SS per pixel.
function paint(bounds, inside, colorAt) {
  const [x0, y0, x1, y1] = bounds.map((v) => Math.max(0, Math.min(SIZE, Math.round(v))));
  const step = 1 / SS;
  for (let y = y0; y < y1; y++) {
    for (let x = x0; x < x1; x++) {
      let hits = 0;
      for (let sy = 0; sy < SS; sy++) {
        for (let sx = 0; sx < SS; sx++) {
          if (inside(x + (sx + 0.5) * step, y + (sy + 0.5) * step)) hits++;
        }
      }
      if (hits === 0) continue;
      const a = hits / (SS * SS);
      blend(x, y, colorAt(x, y), a);
    }
  }
}

const inRoundRect = (x0, y0, x1, y1, r) => (x, y) => {
  if (x < x0 || x > x1 || y < y0 || y > y1) return false;
  const cx = Math.min(Math.max(x, x0 + r), x1 - r);
  const cy = Math.min(Math.max(y, y0 + r), y1 - r);
  const dx = x - cx;
  const dy = y - cy;
  return dx * dx + dy * dy <= r * r;
};
const inRect = (x0, y0, x1, y1) => (x, y) => x >= x0 && x <= x1 && y >= y0 && y <= y1;
const inPoly = (pts) => (x, y) => {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i];
    const [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
};

/* --------------------------------------------------------------- compose -- */
const BG_TOP = hex("#1b2838");
const BG_BOTTOM = hex("#0a0e14");
const GOLD = hex("#f0cf8e");
const GOLD_DEEP = hex("#c9a15c");
const COVER_TOP = hex("#1f4b74");
const COVER_BOTTOM = hex("#112a44");
const PAGE = hex("#f4ecd9");

// Background plate
paint([0, 0, SIZE, SIZE], inRoundRect(0, 0, SIZE - 1, SIZE - 1, 200), (_x, y) =>
  mix(BG_TOP, BG_BOTTOM, Math.min(1, y / SIZE)),
);

// Warm halo behind the book
const halo = (x, y) => {
  const dx = (x - SIZE / 2) / 470;
  const dy = (y - SIZE * 0.46) / 470;
  const d = Math.sqrt(dx * dx + dy * dy);
  return Math.max(0, 1 - d) ** 2;
};
paint([0, 0, SIZE, SIZE], inRoundRect(0, 0, SIZE - 1, SIZE - 1, 200), (x, y) =>
  mix(BG_TOP, GOLD_DEEP, halo(x, y) * 0.32),
);

// Book cover
const cover = inRoundRect(232, 196, 792, 828, 40);
paint([232, 196, 792, 828], cover, (_x, y) => mix(COVER_TOP, COVER_BOTTOM, (y - 196) / 632));

// Gold hairline frame on the cover
const frameOuter = inRoundRect(272, 236, 752, 788, 24);
const frameInner = inRoundRect(286, 250, 738, 774, 18);
paint([272, 236, 752, 788], (x, y) => frameOuter(x, y) && !frameInner(x, y), () => GOLD_DEEP);

// Page block (right edge) so it reads as a closed book
paint([752, 236, 790, 788], inRect(752, 236, 790, 788), (x) => mix(PAGE, hex("#d8cdb4"), (x - 752) / 38));
// Spine shadow on the left
paint([232, 196, 300, 828], inRect(232, 196, 300, 828), (x) => mix(hex("#0b1c2c"), COVER_TOP, (x - 232) / 68));

// Cross
paint([466, 330, 558, 690], inRoundRect(466, 330, 558, 690, 14), (x, y) => mix(GOLD, GOLD_DEEP, (y - 330) / 360));
paint([374, 438, 650, 522], inRoundRect(374, 438, 650, 522, 12), (x, y) => mix(GOLD, GOLD_DEEP, (y - 438) / 84));

// Ribbon marker
paint([648, 770, 716, 936], inPoly([
  [648, 770],
  [716, 770],
  [716, 936],
  [682, 898],
  [648, 936],
]), () => hex("#c8443f"));

/* ---------------------------------------------------------------- output -- */
const out = Buffer.alloc(SIZE * SIZE * 4);
for (let i = 0; i < SIZE * SIZE; i++) {
  const a = px[i * 4 + 3];
  out[i * 4] = Math.round(px[i * 4]);
  out[i * 4 + 1] = Math.round(px[i * 4 + 1]);
  out[i * 4 + 2] = Math.round(px[i * 4 + 2]);
  out[i * 4 + 3] = Math.round(a * 255);
}
const file = join(root, "app-icon.png");
writeFileSync(file, encodePNG(out, SIZE, SIZE));
console.log("wrote", file);
