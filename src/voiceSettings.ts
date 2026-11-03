// DT215 v3 (0.3.66, board Stories162b; Coach Milan 2 November 23:37, Go): how Chef Mealan reads to you while you cook, on this
// phone. Read aloud on or off is the cook's own voice choice (chefmealan-cook-voice, cook.ts); the voice, the speed and cut in
// live here. The phone's own voices: free, nothing leaves the phone.
export type Speed = "slower" | "normal" | "faster";
export type VoiceSettings = { voice: string | null; speed: Speed; cutIn: boolean };
export const VOICE_SETTINGS_KEY = "chefmealan-voice-settings";
export const DEFAULT_VOICE: VoiceSettings = { voice: null, speed: "normal", cutIn: true };
export const RATE: Record<Speed, number> = { slower: 0.8, normal: 0.95, faster: 1.15 };
export function voiceSettings(): VoiceSettings {
  try { const v = JSON.parse(localStorage.getItem(VOICE_SETTINGS_KEY) || "null"); if (!v || typeof v !== "object") return { ...DEFAULT_VOICE };
    return { voice: typeof v.voice === "string" ? v.voice : null, speed: v.speed === "slower" || v.speed === "faster" ? v.speed : "normal", cutIn: v.cutIn !== false }; } catch { return { ...DEFAULT_VOICE }; }
}
export function setVoiceSettings(v: VoiceSettings) { try { localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify(v)); } catch { /* private mode: the defaults */ } }
export type PhoneVoice = { uri: string; name: string; lang: string };
// the phone's voices, English first, the phone's language next, then the rest, each group by name
export function sortVoices(vs: PhoneVoice[], home = "en"): PhoneVoice[] {
  const rank = (v: PhoneVoice) => (/^en/i.test(v.lang) ? 0 : v.lang.toLowerCase().startsWith(home.toLowerCase()) ? 1 : 2);
  return [...vs].sort((a, b) => rank(a) - rank(b) || a.name.localeCompare(b.name));
}
// the language as words: en-GB → English (UK)
export function langWords(lang: string): string {
  const [l, r] = lang.split(/[-_]/);
  try { const name = new Intl.DisplayNames(["en"], { type: "language" }).of(l) ?? l; const reg = r ? ({ GB: "UK", US: "US", AU: "Australia", IE: "Ireland", IN: "India", ZA: "South Africa", CA: "Canada" } as Record<string, string>)[r.toUpperCase()] ?? new Intl.DisplayNames(["en"], { type: "region" }).of(r.toUpperCase()) : null; return reg ? `${name} (${reg})` : name; } catch { return lang; }
}
// the line on the Settings row: Read aloud · Daniel, English (UK) · normal speed · cut in on
export function voiceLine(on: boolean, s: VoiceSettings, voices: PhoneVoice[]): string {
  if (!on) return "Read aloud off · the buttons steer";
  const v = voices.find((x) => x.uri === s.voice);
  return `Read aloud · ${v ? `${v.name.replace(/^Google /, "Google ")}, ${langWords(v.lang)}` : "the phone's voice"} · ${s.speed} speed · cut in ${s.cutIn ? "on" : "off"}`;
}
// the phone's voices; they can arrive a moment after the page opens
export function phoneVoices(): PhoneVoice[] {
  try { return (window.speechSynthesis?.getVoices?.() ?? []).map((v) => ({ uri: v.voiceURI, name: v.name, lang: v.lang })); } catch { return []; }
}
export function utterance(text: string, s: VoiceSettings = voiceSettings(), lang = "en-GB"): SpeechSynthesisUtterance {
  const u = new SpeechSynthesisUtterance(text); u.lang = lang; u.rate = RATE[s.speed];
  try {
    const all = window.speechSynthesis.getVoices();
    const v = s.voice ? all.find((x) => x.voiceURI === s.voice) : null;
    // DT203 (0.3.76): a line in another language takes a voice of that language (Serbian, else Croatian or Bosnian, which read it)
    const same = (x: SpeechSynthesisVoice) => x.lang.toLowerCase().startsWith(lang.slice(0, 2).toLowerCase());
    const other = lang.startsWith("sr") ? all.find((x) => /^(sr|hr|bs)/i.test(x.lang)) : null;
    if (v && same(v)) { u.voice = v; u.lang = v.lang; } else if (other) { u.voice = other; u.lang = other.lang; }
  } catch { /* the phone's default voice */ }
  return u;
}
export const SAMPLE = "Step 1. Put 2 eggs in a bowl and whisk them until smooth.";
