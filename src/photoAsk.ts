// DT130 (0.2.110, board Stories78, variant A; Milan 26 October 12:00, 15:45 and 16:18, "An idea. Build"). A photo picked
// from Your photos in the meal camera asks one thing before the read: whose plate, and when. Three chips, one on: Ate at
// 12:40 (the photo's time; Ate it logs it then, in the meal that time belongs to), Eating now (as from the camera), An idea
// (a friend's dinner, a plate online: the same read, nothing logged). This file holds the rules, by code: the photo's time
// from the file, which chip starts on, and the line under the chips.

export type Who = "ate" | "now" | "idea";
export const WHO_ORDER: Who[] = ["ate", "now", "idea"];

// the time the photo was taken: DateTimeOriginal from the JPEG's EXIF when it has one (camera photos), else null; the
// caller falls back to the file's own time (a photo saved from WhatsApp keeps no EXIF: the time it was saved)
export function exifTime(buf: ArrayBuffer): Date | null {
  try {
    const v = new DataView(buf);
    if (v.byteLength < 4 || v.getUint16(0) !== 0xffd8) return null;
    let o = 2;
    while (o + 4 < v.byteLength) {
      const marker = v.getUint16(o), len = v.getUint16(o + 2);
      if (marker === 0xffe1 && v.getUint32(o + 4) === 0x45786966) return tiffTime(v, o + 10);
      if ((marker & 0xff00) !== 0xff00 || marker === 0xffda) return null;
      o += 2 + len;
    }
  } catch { /* a broken file has no time */ }
  return null;
}
function tiffTime(v: DataView, t: number): Date | null {
  const le = v.getUint16(t) === 0x4949;
  const u16 = (p: number) => v.getUint16(p, le), u32 = (p: number) => v.getUint32(p, le);
  const tag = (ifd: number, want: number): number | null => {
    const n = u16(ifd);
    for (let i = 0; i < n; i++) { const e = ifd + 2 + i * 12; if (u16(e) === want) return e; }
    return null;
  };
  const ascii = (e: number) => { const n = u32(e + 4), at = n > 4 ? t + u32(e + 8) : e + 8; let s = ""; for (let i = 0; i < n - 1; i++) s += String.fromCharCode(v.getUint8(at + i)); return s; };
  const ifd0 = t + u32(t + 4);
  const ptr = tag(ifd0, 0x8769);
  const sub = ptr !== null ? tag(t + u32(ptr + 8), 0x9003) : null;
  const e = sub ?? tag(ifd0, 0x0132); // DateTimeOriginal, else DateTime
  if (e === null) return null;
  const m = /^(\d{4}):(\d{2}):(\d{2}) (\d{2}):(\d{2})/.exec(ascii(e));
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3], +m[4], +m[5]);
  return Number.isNaN(d.getTime()) ? null : d;
}

const ymdOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
export const hhmm = (d: Date) => `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

// which chip starts on: a photo from the last half hour is the meal in front of you; earlier today or yesterday, a meal you
// ate then; older than that, an idea. A tap changes it.
export function startWho(at: Date, now: Date): Who {
  const mins = (now.getTime() - at.getTime()) / 60000;
  if (mins >= -5 && mins <= 30) return "now";
  const y = new Date(now); y.setDate(y.getDate() - 1);
  return ymdOf(at) === ymdOf(now) || ymdOf(at) === ymdOf(y) ? "ate" : "idea";
}

// "A photo from 12:40 today." / "from yesterday, 19:10" / "from Sunday 25 October, 19:10"
export function photoFrom(at: Date, now: Date): string {
  const y = new Date(now); y.setDate(y.getDate() - 1);
  if (ymdOf(at) === ymdOf(now)) return `A photo from ${hhmm(at)} today.`;
  if (ymdOf(at) === ymdOf(y)) return `A photo from yesterday, ${hhmm(at)}.`;
  return `A photo from ${at.toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" })}, ${hhmm(at)}.`;
}

// the chip's words: short (Milan 15:45)
export function chipWord(who: Who, time: string): string { return who === "ate" ? `Ate at ${time}` : who === "now" ? "Eating now" : "An idea"; }

// the line under the chips: what the one that is on does
export function whoLine(who: Who, time: string, meal: string | null): string {
  if (who === "idea") return "Not logged. Chef Mealan reads it as an idea to cook.";
  if (who === "now") return `As from the camera: the plate in front of you${meal ? `, as ${meal}` : ""}.`;
  return `Logged at ${time}${meal ? `, as ${meal}` : ""}. Tap the time to change it.`;
}

// the photo's date with the time picked on the chip
export function atTime(at: Date, time: string): Date {
  const m = /^(\d{1,2}):(\d{2})$/.exec(time); const d = new Date(at);
  if (m) d.setHours(+m[1], +m[2], 0, 0);
  return d;
}
