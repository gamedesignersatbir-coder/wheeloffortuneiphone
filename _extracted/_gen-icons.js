// Generate icon-180.png and icon-192.png from icon.png (the 512 master).
// Pure-JS PNG decode/encode — no dependencies beyond Node's zlib.
// Rerun whenever icon.png changes.
//
// Supports: 8-bit RGBA, non-interlaced, standard filters (0–4). That's
// the format our source icon uses; anything else will throw.

const fs = require('fs');
const zlib = require('zlib');
const path = require('path');

const SRC_PATH = path.resolve(__dirname, '..', 'icon.png');
const OUT_SIZES = [180, 192];

// ── CRC32 ──────────────────────────────────────────────────────────────────
const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c;
  }
  return t;
})();
const crc32 = (buf) => {
  let c = 0xFFFFFFFF;
  for (const b of buf) c = CRC_TABLE[(c ^ b) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
};

// ── Decode a minimal RGBA 8-bit non-interlaced PNG ────────────────────────
function decodePng(buf) {
  if (buf.readBigUInt64BE(0) !== 0x89504E470D0A1A0An) throw new Error('Not PNG');
  const width = buf.readUInt32BE(16);
  const height = buf.readUInt32BE(20);
  const bitDepth = buf[24], colorType = buf[25], interlace = buf[28];
  if (bitDepth !== 8 || colorType !== 6 || interlace !== 0) {
    throw new Error(`Unsupported PNG flavour: bd=${bitDepth} ct=${colorType} int=${interlace} (need RGBA 8-bit non-interlaced)`);
  }
  // Walk chunks, collect IDAT
  const idats = [];
  let pos = 33; // 8 sig + 4 len + 4 type + 13 data + 4 crc
  while (pos < buf.length) {
    const len = buf.readUInt32BE(pos);
    const type = buf.slice(pos + 4, pos + 8).toString();
    if (type === 'IDAT') idats.push(buf.slice(pos + 8, pos + 8 + len));
    else if (type === 'IEND') break;
    pos += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(idats));
  // Unfilter scanlines into raw RGBA pixel buffer
  const stride = width * 4;
  const pixels = Buffer.alloc(width * height * 4);
  let r = 0;
  for (let y = 0; y < height; y++) {
    const filter = raw[r++];
    for (let x = 0; x < stride; x++) {
      const v = raw[r++];
      const left   = x >= 4                  ? pixels[y * stride + x - 4]       : 0;
      const up     = y > 0                   ? pixels[(y - 1) * stride + x]     : 0;
      const upLeft = (y > 0 && x >= 4)       ? pixels[(y - 1) * stride + x - 4] : 0;
      let recon;
      switch (filter) {
        case 0: recon = v; break;
        case 1: recon = (v + left) & 0xFF; break;
        case 2: recon = (v + up) & 0xFF; break;
        case 3: recon = (v + ((left + up) >> 1)) & 0xFF; break;
        case 4: {
          const p = left + up - upLeft;
          const pa = Math.abs(p - left), pb = Math.abs(p - up), pc = Math.abs(p - upLeft);
          const pred = pa <= pb && pa <= pc ? left : pb <= pc ? up : upLeft;
          recon = (v + pred) & 0xFF;
          break;
        }
        default: throw new Error(`Unknown PNG filter ${filter}`);
      }
      pixels[y * stride + x] = recon;
    }
  }
  return { width, height, pixels };
}

// ── Area-averaged downscale (proper box filter) ───────────────────────────
// For each dst pixel, sum the weighted contribution of every source pixel
// that its rectangle overlaps. Best quality for 2x+ downscales.
function areaResize(src, sw, sh, dw, dh) {
  const dst = Buffer.alloc(dw * dh * 4);
  const rx = sw / dw, ry = sh / dh;
  for (let y = 0; y < dh; y++) {
    const y0f = y * ry, y1f = (y + 1) * ry;
    const y0 = Math.floor(y0f), y1 = Math.min(sh, Math.ceil(y1f));
    for (let x = 0; x < dw; x++) {
      const x0f = x * rx, x1f = (x + 1) * rx;
      const x0 = Math.floor(x0f), x1 = Math.min(sw, Math.ceil(x1f));
      let sr = 0, sg = 0, sb = 0, sa = 0, w = 0;
      for (let sy = y0; sy < y1; sy++) {
        const wy = Math.min(y1f, sy + 1) - Math.max(y0f, sy);
        for (let sx = x0; sx < x1; sx++) {
          const wx = Math.min(x1f, sx + 1) - Math.max(x0f, sx);
          const ww = wx * wy, idx = (sy * sw + sx) * 4;
          sr += src[idx    ] * ww;
          sg += src[idx + 1] * ww;
          sb += src[idx + 2] * ww;
          sa += src[idx + 3] * ww;
          w  += ww;
        }
      }
      const d = (y * dw + x) * 4;
      dst[d    ] = Math.round(sr / w);
      dst[d + 1] = Math.round(sg / w);
      dst[d + 2] = Math.round(sb / w);
      dst[d + 3] = Math.round(sa / w);
    }
  }
  return dst;
}

// ── Encode RGBA 8-bit non-interlaced PNG (filter=None) ─────────────────────
function encodePng(width, height, pixels) {
  const stride = width * 4;
  const filtered = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    filtered[y * (stride + 1)] = 0; // filter None
    pixels.copy(filtered, y * (stride + 1) + 1, y * stride, (y + 1) * stride);
  }
  const idatData = zlib.deflateSync(filtered, { level: 9 });
  const chunk = (type, data) => {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  };
  const sig = Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;  ihdr[9] = 6;  ihdr[10] = 0;  ihdr[11] = 0;  ihdr[12] = 0;
  return Buffer.concat([sig, chunk('IHDR', ihdr), chunk('IDAT', idatData), chunk('IEND', Buffer.alloc(0))]);
}

// ── Main ──────────────────────────────────────────────────────────────────
const src = decodePng(fs.readFileSync(SRC_PATH));
console.log(`source: icon.png (${src.width}×${src.height})`);
for (const s of OUT_SIZES) {
  const resized = areaResize(src.pixels, src.width, src.height, s, s);
  const png = encodePng(s, s, resized);
  const outPath = path.resolve(__dirname, '..', `icon-${s}.png`);
  fs.writeFileSync(outPath, png);
  console.log(`  wrote icon-${s}.png  (${png.length.toLocaleString()} bytes)`);
}
