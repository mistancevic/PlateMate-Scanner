// BP1 version 5, rows 7 and 8 (0.3.52; Coach Milan 2 November 09:35 and 09:39): the video behind See it work on /built.
// Seven home page clips recorded again on the app as it is now, then joined in the order the board drew: the Plate, Recipes,
// Cook mode, a coach's clients, Explorer, then Scan a label and Photo of my meal. Every rule in docs/rules/home-clips.md is
// checked by the recorder first; nothing is written when one fails. The home page's own clips in public/landing are not
// touched. Run after npm run build: node scripts/record-built-video.cjs. Writes public/built/see-it-work.mp4, .webm, .webp.
const { execFileSync } = require("node:child_process");
const fs = require("node:fs"), path = require("node:path"), os = require("node:os");
const ROOT = path.resolve(__dirname, ".."), OUT = path.join(ROOT, "public/built");
const ORDER = ["plate", "recipes", "cook", "coach", "explorer", "label", "meal"];
const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "built-video-"));
execFileSync(process.execPath, [path.join(__dirname, "record-home-clips.cjs")], { cwd: ROOT, stdio: "inherit", env: { ...process.env, CLIPS: ORDER.join(","), CLIPS_OUT: tmp } });
const parts = ORDER.map((k) => path.join(tmp, `way-${k}.mp4`));
const missing = parts.filter((p) => !fs.existsSync(p));
if (missing.length) { console.error("missing clips: " + missing.map((p) => path.basename(p)).join(", ")); process.exit(1); }
const inputs = parts.flatMap((p) => ["-i", p]);
const filter = parts.map((_, k) => `[${k}:v]`).join("") + `concat=n=${parts.length}:v=1:a=0[v]`;
const base = path.join(OUT, "see-it-work");
fs.mkdirSync(OUT, { recursive: true });
execFileSync("ffmpeg", ["-y", ...inputs, "-filter_complex", filter, "-map", "[v]", "-c:v", "libx264", "-preset", "veryfast", "-crf", "28", "-pix_fmt", "yuv420p", "-movflags", "+faststart", `${base}.mp4`], { stdio: "ignore" });
execFileSync("ffmpeg", ["-y", "-i", `${base}.mp4`, "-c:v", "libvpx-vp9", "-crf", "40", "-b:v", "0", "-deadline", "good", "-cpu-used", "4", `${base}.webm`], { stdio: "ignore" });
// the poster: the first clip's own poster, the Plate
fs.copyFileSync(path.join(tmp, "way-plate.webp"), `${base}.webp`);
const len = Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", `${base}.mp4`], { encoding: "utf8" }).trim());
console.log(`see-it-work: ${ORDER.length} clips, ${len.toFixed(1)} s`);
