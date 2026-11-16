import { test } from "node:test";
import assert from "node:assert/strict";
import { exifTime, startWho, photoFrom, chipWord, whoLine, atTime, hhmm, photoWho, photoFromYours, photoMealLine } from "./photoAsk";

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
  assert.deepEqual(["ate", "now", "idea"].map((w) => chipWord(w as any, "12:40")), ["Ate at 12:40", "Eating now", "Just looking"]);
  assert.equal(whoLine("ate", "12:40", "lunch"), "Logged at 12:40, as lunch. Tap the time to change it.");
  assert.equal(whoLine("idea", "12:40", null), "Not your meal, not logged. Chef Mealan reads it: cook it, keep it as an idea, or plan it.");
  assert.equal(startWho(new Date("2026-11-02T12:30:00"), new Date("2026-11-02T12:35:00"), true), "idea", "0.3.62: the pencil block on Exploring starts on Exploring");
  const t = atTime(new Date(2026, 9, 25, 19, 10), "20:05");
  assert.deepEqual([t.getDate(), t.getHours(), t.getMinutes()], [25, 20, 5]);
});

// DT305 (0.3.151, board Stories230): the photo screen asks nothing; the photo says it
test("DT305: who a photo is: taken now or in the last half hour is now; older is a meal you ate then; Just looking stays", () => {
  const now = new Date(2026, 10, 16, 19, 0);
  assert.equal(photoWho(now, now, true, false), "now", "a photo you take");
  assert.equal(photoWho(new Date(2026, 10, 16, 18, 40), now, false, false), "now", "from Your photos, 20 minutes ago");
  assert.equal(photoWho(new Date(2026, 10, 16, 13, 10), now, false, false), "ate", "earlier today");
  assert.equal(photoWho(new Date(2026, 10, 15, 19, 40), now, false, false), "ate", "yesterday");
  assert.equal(photoWho(new Date(2026, 10, 2, 19, 40), now, false, false), "ate", "two weeks ago: a meal of that day, unless the meal line says Just looking");
  assert.equal(photoWho(new Date(2026, 10, 17, 9, 0), now, false, false), "now", "a photo dated after now is the meal in front of you");
  assert.equal(photoWho(new Date(2026, 10, 15, 19, 40), now, false, true), "idea", "Just looking in the meal line stays Just looking");
  assert.equal(photoWho(now, now, true, true), "idea");
});

test("DT305: the words: where the photo is from, and the meal line it fills in", () => {
  const now = new Date(2026, 10, 16, 19, 0);
  assert.equal(photoFromYours(new Date(2026, 10, 16, 13, 10), now), "A photo from 13:10 today, from Your photos.");
  assert.equal(photoFromYours(new Date(2026, 10, 15, 19, 40), now), "A photo from yesterday, 19:40, from Your photos.");
  assert.equal(photoFromYours(new Date(2026, 10, 2, 19, 40), now), "A photo from Monday 2 November, 19:40, from Your photos.");
  assert.equal(photoMealLine("Lunch", new Date(2026, 10, 16, 13, 10), now), "Lunch, today at 13:10");
  assert.equal(photoMealLine("Dinner", new Date(2026, 10, 15, 19, 40), now), "Dinner, yesterday at 19:40");
  assert.equal(photoMealLine("Dinner", new Date(2026, 10, 2, 19, 40), now), "Dinner, Monday 2 November at 19:40");
});
