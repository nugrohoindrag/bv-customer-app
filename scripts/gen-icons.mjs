// Membuat ikon PWA/native (PNG 192/512 + maskable + splash 1024) tanpa dependensi: rasterisasi logo BVRooms
// (huruf "b" putih di kotak hijau Figma #2ECC71, mengikuti ikon "p" Premirooms) ke PNG via zlib.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const out = path.join(here, "../public/icons");
fs.mkdirSync(out, { recursive: true });

const GREEN = [0x2e, 0xcc, 0x71];
const GREEN_DARK = [0x27, 0xae, 0x60];
const WHITE = [255, 255, 255];

function crc32(buf) {
  let c, crc = 0xffffffff;
  for (let n = 0; n < buf.length; n++) {
    c = (crc ^ buf[n]) & 0xff;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    crc = (crc >>> 8) ^ c;
  }
  return (crc ^ 0xffffffff) >>> 0;
}
function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const td = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(td));
  return Buffer.concat([len, td, crc]);
}
function png(size, pixel) {
  const raw = Buffer.alloc((size * 4 + 1) * size);
  for (let y = 0; y < size; y++) {
    raw[y * (size * 4 + 1)] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = pixel(x, y);
      const o = y * (size * 4 + 1) + 1 + x * 4;
      raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8; ihdr[9] = 6; ihdr[10] = 0; ihdr[11] = 0; ihdr[12] = 0;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ihdr), chunk("IDAT", zlib.deflateSync(raw, { level: 9 })), chunk("IEND", Buffer.alloc(0))]);
}

// Huruf "b": batang vertikal kiri + mangkuk (cincin) di bawah kanan. Semua ukuran relatif ke `s` (skala logo).
function insideB(u, v, cx, cy, s) {
  const stem = s * 0.13; // tebal batang
  const stemX = cx - s * 0.22;
  const top = cy - s * 0.42, bottom = cy + s * 0.30;
  if (u >= stemX - stem / 2 && u <= stemX + stem / 2 && v >= top && v <= bottom) return true;
  const bx = cx + s * 0.02, by = cy + s * 0.08; // pusat mangkuk
  const R = s * 0.30, r = R - stem;
  const d = Math.hypot(u - bx, v - by);
  return d <= R && d >= r;
}
function logoPixel(size, { maskable = false, splash = false } = {}) {
  const cx = size / 2, cy = size / 2;
  const pad = maskable ? size * 0.1 : 0;
  const r = size / 2 - pad;
  const rad = maskable || splash ? 0 : size * 0.22;
  return (x, y) => {
    const u = x + 0.5, v = y + 0.5;
    if (splash) {
      // splash: latar putih, ikon kotak hijau di tengah (~28% lebar)
      const box = size * 0.28, brad = box * 0.22;
      const ax = Math.max(Math.abs(u - cx) - (box / 2 - brad), 0), ay = Math.max(Math.abs(v - cy) - (box / 2 - brad), 0);
      if (Math.hypot(ax, ay) > brad) return [...WHITE, 255];
      return insideB(u, v, cx, cy, box * 0.78) ? [...WHITE, 255] : [...GREEN, 255];
    }
    let bg = true;
    if (!maskable) {
      const ax = Math.max(Math.abs(u - cx) - (r - rad), 0), ay = Math.max(Math.abs(v - cy) - (r - rad), 0);
      bg = Math.hypot(ax, ay) <= rad;
    }
    if (!bg) return [0, 0, 0, 0];
    const g = v / size;
    const base = [0, 1, 2].map((i) => Math.round(GREEN[i] * (1 - g * 0.6) + GREEN_DARK[i] * g * 0.6));
    const s = size * (maskable ? 0.62 : 0.8);
    return insideB(u, v, cx, cy, s) ? [...WHITE, 255] : [...base, 255];
  };
}

for (const [name, size, opts] of [
  ["icon-192.png", 192, {}],
  ["icon-512.png", 512, {}],
  ["icon-maskable-512.png", 512, { maskable: true }],
  ["icon-1024.png", 1024, {}],
  ["splash-1024.png", 1024, { splash: true }],
]) {
  fs.writeFileSync(path.join(out, name), png(size, logoPixel(size, opts)));
  console.log("wrote", name);
}
const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2ECC71"/><stop offset="1" stop-color="#27AE60"/></linearGradient></defs><rect width="512" height="512" rx="112" fill="url(#g)"/><path d="M166 84v300" stroke="#fff" stroke-width="52" stroke-linecap="round"/><circle cx="264" cy="288" r="96" fill="none" stroke="#fff" stroke-width="52"/></svg>`;
fs.writeFileSync(path.join(out, "icon.svg"), svg);
console.log("wrote icon.svg");
