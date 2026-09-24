import fs from 'fs';
import zlib from 'zlib';

function createPNG(width, height, drawFn) {
  // RGBA buffer: width * 4 bytes per row + 1 filter byte per row
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type 0 (None)
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressed = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // Bit depth
  ihdrData[9] = 6; // Color type 6 (RGBA)
  ihdrData[10] = 0; // Compression
  ihdrData[11] = 0; // Filter
  ihdrData[12] = 0; // Interlace

  const ihdrChunk = createChunk('IHDR', ihdrData);
  const idatChunk = createChunk('IDAT', compressed);
  const iendChunk = createChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function createChunk(type, data) {
  const length = data.length;
  const chunk = Buffer.alloc(8 + length + 4);
  chunk.writeUInt32BE(length, 0);
  chunk.write(type, 4, 4, 'ascii');
  data.copy(chunk, 8);

  const crc = crc32(chunk.subarray(4, 8 + length));
  chunk.writeUInt32BE(crc, 8 + length);
  return chunk;
}

// Standard CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c >>> 0;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function drawIcon(isMaskable) {
  return (x, y, w, h) => {
    const cx = w / 2;
    const cy = h / 2;
    const radius = w * (isMaskable ? 0.48 : 0.44);

    // Distance from center
    const dx = x - cx;
    const dy = y - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);

    // Background: Sky blue gradient (#0284c7 to #0369a1)
    const t = y / h;
    const bgR = Math.round(2 + t * 1);
    const bgG = Math.round(132 - t * 27);
    const bgB = Math.round(199 - t * 38);

    // If maskable, fill entire canvas with background
    let r = bgR, g = bgG, b = bgB, a = 255;

    // If not maskable, rounded rect or circle boundary
    if (!isMaskable) {
      const cornerR = w * 0.22;
      // Check rounded rectangle
      const qx = Math.max(0, Math.abs(x - cx) - (w * 0.5 - cornerR));
      const qy = Math.max(0, Math.abs(y - cy) - (h * 0.5 - cornerR));
      const qdist = Math.sqrt(qx * qx + qy * qy);
      if (qdist > cornerR) {
        return [0, 0, 0, 0]; // transparent outside
      }
    }

    // Cylinder Graphic in center
    // Normalized coords (-1 to 1) in center 60%
    const scale = w * 0.28;
    const nx = (x - cx) / scale;
    const ny = (y - cy) / scale;

    // Cylinder body: x in [-0.5, 0.5], y in [-0.8, 0.8]
    // Top cap: valve at [-0.15, 0.15], y in [-1.1, -0.8]
    if (Math.abs(nx) <= 0.15 && ny >= -1.15 && ny <= -0.75) {
      // Valve / handle
      return [224, 242, 254, 255]; // sky-100
    }

    if (Math.abs(nx) <= 0.55 && ny >= -0.75 && ny <= 0.95) {
      // Rounded top and bottom of cylinder
      const topDist = Math.sqrt(nx * nx + (ny - (-0.4)) * (ny - (-0.4)));
      const botDist = Math.sqrt(nx * nx + (ny - 0.6) * (ny - 0.6));

      // Shading based on nx (cylindrical highlight)
      const highlight = Math.cos(nx * 2.2);
      const cVal = Math.round(240 + highlight * 15);
      
      // Decorative gas bands
      if (ny >= -0.2 && ny <= -0.05) {
        // Emerald green band (Oxigênio)
        return [16, 185, 129, 255];
      }
      if (ny >= 0.1 && ny <= 0.25) {
        // Dark ring
        return [14, 116, 144, 255];
      }

      return [cVal, cVal, cVal, 255];
    }

    return [r, g, b, a];
  };
}

fs.mkdirSync('public', { recursive: true });

fs.writeFileSync('public/pwa-192x192.png', createPNG(192, 192, drawIcon(false)));
fs.writeFileSync('public/pwa-512x512.png', createPNG(512, 512, drawIcon(false)));
fs.writeFileSync('public/pwa-maskable-512x512.png', createPNG(512, 512, drawIcon(true)));
fs.writeFileSync('public/apple-touch-icon.png', createPNG(180, 180, drawIcon(false)));

console.log('PWA icons created successfully!');
