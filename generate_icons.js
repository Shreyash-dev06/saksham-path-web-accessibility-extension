const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Minimal PNG generator using Node.js built-in zlib
function createPNG(width, height, pixelShader) {
  const rowSize = width * 4;
  const rawData = Buffer.alloc((rowSize + 1) * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * (rowSize + 1);
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const [r, g, b, a] = pixelShader(x, y, width, height);
      const pxOffset = rowOffset + 1 + x * 4;
      rawData[pxOffset] = r;
      rawData[pxOffset + 1] = g;
      rawData[pxOffset + 2] = b;
      rawData[pxOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  function crc32(buf) {
    let table = [];
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) {
        c = ((c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1));
      }
      table[i] = c >>> 0;
    }
    let crc = 0 ^ (-1);
    for (let i = 0; i < buf.length; i++) {
      crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xFF];
    }
    return (crc ^ (-1)) >>> 0;
  }

  function chunk(type, data) {
    const len = Buffer.alloc(4);
    len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crc = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crc, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 6; // color type RGBA
  ihdr[10] = 0; // compression
  ihdr[11] = 0; // filter
  ihdr[12] = 0; // interlace

  const ihdrChunk = chunk('IHDR', ihdr);
  const idatChunk = chunk('IDAT', compressed);
  const iendChunk = chunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

// Icon rendering shader: Accessibility icon with blue rounded backdrop
function iconShader(x, y, w, h) {
  const cx = w / 2;
  const cy = h / 2;
  const r = w / 2 - 1;
  const dx = x - cx;
  const dy = y - cy;
  const dist = Math.sqrt(dx * dx + dy * dy);

  // Transparent background
  if (dist > r) return [0, 0, 0, 0];

  // Soft anti-aliased edge
  let bgAlpha = 255;
  if (dist > r - 1) {
    bgAlpha = Math.round(255 * (r - dist));
  }

  // Deep Royal Blue background (#2563EB)
  const bgR = 37, bgG = 99, bgB = 235;

  // Normalized coords inside icon (-1 to 1)
  const nx = (x - cx) / (w * 0.45);
  const ny = (y - cy) / (h * 0.45);

  let isWhite = false;

  // Head circle
  const headDist = Math.sqrt(nx * nx + (ny + 0.55) * (ny + 0.55));
  if (headDist < 0.22) isWhite = true;

  // Arms horizontal bar
  if (ny >= -0.32 && ny <= -0.12 && Math.abs(nx) <= 0.82) isWhite = true;

  // Body torso
  if (ny >= -0.15 && ny <= 0.25 && Math.abs(nx) <= 0.2) isWhite = true;

  // Left Leg
  if (ny > 0.2 && ny <= 0.8) {
    const legX = -0.35 * (ny - 0.2) / 0.6;
    if (Math.abs(nx - legX) <= 0.16) isWhite = true;
  }

  // Right Leg
  if (ny > 0.2 && ny <= 0.8) {
    const legX = 0.35 * (ny - 0.2) / 0.6;
    if (Math.abs(nx - legX) <= 0.16) isWhite = true;
  }

  if (isWhite) {
    return [255, 255, 255, bgAlpha];
  }

  return [bgR, bgG, bgB, bgAlpha];
}

const iconsDir = path.join(__dirname, 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

[16, 48, 128].forEach(size => {
  const buf = createPNG(size, size, iconShader);
  fs.writeFileSync(path.join(iconsDir, `icon${size}.png`), buf);
  console.log(`Generated icon${size}.png (${size}x${size})`);
});
