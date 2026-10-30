// PWA icons (pure Node): mountain peaks + sun on a deep teal tile.
import { deflateSync } from 'node:zlib'
import { writeFileSync, mkdirSync, existsSync, rmSync } from 'node:fs'
function crc32(buf) { let c, crc = ~0; for (let n = 0; n < buf.length; n++) { c = (crc ^ buf[n]) & 0xff; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crc = (crc >>> 8) ^ c } return ~crc >>> 0 }
function chunk(type, data) { const len = Buffer.alloc(4); len.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type), data]); const crc = Buffer.alloc(4); crc.writeUInt32BE(crc32(td)); return Buffer.concat([len, td, crc]) }
function png(size, draw) {
  const raw = Buffer.alloc((size * 4 + 1) * size)
  for (let y = 0; y < size; y++) { raw[y * (size * 4 + 1)] = 0; for (let x = 0; x < size; x++) { const [r, g, b, a] = draw(x / size, y / size); const o = y * (size * 4 + 1) + 1 + x * 4; raw[o] = r; raw[o + 1] = g; raw[o + 2] = b; raw[o + 3] = a } }
  const ihdr = Buffer.alloc(13); ihdr.writeUInt32BE(size, 0); ihdr.writeUInt32BE(size, 4); ihdr[8] = 8; ihdr[9] = 6
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk('IHDR', ihdr), chunk('IDAT', deflateSync(raw)), chunk('IEND', Buffer.alloc(0))])
}
const BG = [12, 26, 31, 255], PEAK = [233, 241, 244, 255], PEAK2 = [94, 154, 170, 255], SUN = [251, 191, 36, 255]
const tri = (x, y, cx, top, base, half) => y >= top && y <= base && Math.abs(x - cx) <= ((y - top) / (base - top)) * half
const glyph = (scale, round) => (u, v) => {
  const x = (u - 0.5) / scale + 0.5, y = (v - 0.5) / scale + 0.5
  if (round) { const cx = Math.min(u, 1 - u), cy = Math.min(v, 1 - v), r = 0.2; if (cx < r && cy < r && (r - cx) ** 2 + (r - cy) ** 2 > r * r) return [0, 0, 0, 0] }
  if ((x - 0.72) ** 2 + (y - 0.3) ** 2 < 0.007) return SUN
  if (tri(x, y, 0.42, 0.26, 0.72, 0.3)) return PEAK
  if (tri(x, y, 0.68, 0.42, 0.72, 0.24)) return PEAK2
  if (tri(x, y, 0.24, 0.5, 0.72, 0.18)) return PEAK2
  return BG
}
mkdirSync('public/icons', { recursive: true })
writeFileSync('public/icons/icon-192.png', png(192, glyph(1, true)))
writeFileSync('public/icons/icon-512.png', png(512, glyph(1, true)))
writeFileSync('public/icons/maskable-512.png', png(512, glyph(0.72, false)))
writeFileSync('public/icons/apple-touch-icon.png', png(180, glyph(0.85, false)))
console.log('icons written')


// Android launcher icons (legacy PNGs; the template adaptive-icon XML is removed so these are used)
const RES = 'android/app/src/main/res'
if (existsSync(RES)) {
  const sizes = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 }
  for (const [d, s] of Object.entries(sizes)) {
    for (const name of ['ic_launcher.png', 'ic_launcher_round.png', 'ic_launcher_foreground.png']) {
      writeFileSync(RES + '/mipmap-' + d + '/' + name, png(s, glyph(name.includes('foreground') ? 0.72 : 1, true)))
    }
  }
  rmSync(RES + '/mipmap-anydpi-v26', { recursive: true, force: true })
  console.log('android icons written')
}
