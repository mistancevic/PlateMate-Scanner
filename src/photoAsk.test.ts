import { test } from "node:test";
import assert from "node:assert/strict";
import { exifTime, startWho, photoFrom, chipWord, whoLine, atTime, hhmm } from "./photoAsk";

// a minimal JPEG with an EXIF block: IFD0 points to the Exif IFD, which holds DateTimeOriginal
function jpegWithExif(when: string, le = true): ArrayBuffer {
  const tiff: number[] = [];
  const u16 = (n: number) => (le ? [n & 255, n >> 8] : [n >> 8, n & 255]);
  const u32 = (n: number) => (le ? [n & 255, (n >> 8) & 255, (n >> 16) & 255, n >>> 24] : [n >>> 24, (n >> 16) & 255, (n >> 8) & 255, n & 255]);
  tiff.push(...(le ? [0x49, 0x49] : [0x4d, 0x4d]), ...u16(42), ...u32(8));
  // IFD0 at 8: one entry, ExifIFD pointer to 26
  tiff.push(...u16(1), ...u16(0x8769), ...u16(4), ...u32(1), ...u32(26), ...u32(0));
  // Exif IFD at 26: DateTimeOriginal, ASCII, 20 bytes at 44
  tiff.push(...u16(1), ...u16(0x9003), ...u16(2), ...u32(20), ...u32(44), ...u32(0));
  for (const c of when + "\0") tiff.push(c.charCodeAt(0));
  const app1 = [0x45, 0x78, 0x69, 0x66, 0, 0, ...tiff];
  const len = app1.length + 2;
  return new Uint8Array([0xff, 0xd8, 0xff, 0xe1, len >> 8, len & 255, ...app1, 0xff, 0xd9]).buffer;
}

test("DT130: the photo's time from its EXIF, either byte order; none without", () => {
  const d = exifTime(jpegWithExif("2026:10:26 12:40:07"))!;
  assert.deepEqual([d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()], [2026, 10, 26, 12, 40]);
  assert.equal(hhmm(exifTime(jpegWithExif("2026:10:25 19:10:00", false))!), "19:10");
  assert.equal(exifTime(new Uint8Array([0xff, 0xd8, 0xff, 0xd9]).buffer), null);
  assert.equal(exifTime(new Uint8Array([1, 2, 3]).buffer), null);
});

test("DT130: which chip starts on: the last half hour is now, today or yesterday ate, older an idea", () => {
  const now = new Date(2026, 9, 26, 13, 5);
  assert.equal(startWho(new Date(2026, 9, 26, 12, 50), now), "now");
  assert.equal(startWho(new Date(2026, 9, 26, 12, 20), now), "ate");
  assert.equal(startWho(new Date(2026, 9, 25, 19, 10), now), "ate");
  assert.equal(startWho(new Date(2026, 9, 20, 19, 10), now), "idea");
});

test("DT130: the words: short chips, the line under them says what the chip on does", () => {
  const now = new Date(2026, 9, 26, 13, 5);
  assert.equal(photoFrom(new Date(2026, 9, 26, 12, 40), now), "A photo from 12:40 today.");
  assert.equal(photoFrom(new Date(2026, 9, 25, 19, 10), now), "A photo from yesterday, 19:10.");
  assert.match(photoFrom(new Date(2026, 9, 20, 19, 10), now), /^A photo from Tuesday 20 October, 19:10\.$/);
  assert.deepEqual(["ate", "now", "idea"].map((w) => chipWord(w as any, "12:40")), ["Ate at 12:40", "Eating now", "An idea"]);
  assert.equal(whoLine("ate", "12:40", "lunch"), "Logged at 12:40, as lunch. Tap the time to change it.");
  assert.equal(whoLine("idea", "12:40", null), "Not logged. Chef Mealan reads it as an idea to cook.");
  const t = atTime(new Date(2026, 9, 25, 19, 10), "20:05");
  assert.deepEqual([t.getDate(), t.getHours(), t.getMinutes()], [25, 20, 5]);
});
