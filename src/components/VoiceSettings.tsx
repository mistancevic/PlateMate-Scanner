// DT215 v3 (0.3.66, board Stories162b): Voice while cooking. Read aloud on or off, the phone's voices with a sample, the speed,
// cut in. In Settings, and over cook mode from its Voice › link.
import { w } from "../words";
import { useLang, langLine } from "../lang";
import { useEffect, useState } from "react";
import { voiceChoice, setVoiceChoice } from "../cook";
import { voiceSettings, setVoiceSettings, sortVoices, langWords, phoneVoices, utterance, voiceLine, SAMPLE, type VoiceSettings as VS, type PhoneVoice, type Speed } from "../voiceSettings";

export function usePhoneVoices(): PhoneVoice[] {
  const [vs, setVs] = useState<PhoneVoice[]>(() => sortVoices(phoneVoices()));
  useEffect(() => {
    const s = typeof window !== "undefined" ? window.speechSynthesis : null; if (!s) return;
    const take = () => setVs(sortVoices(phoneVoices()));
    take(); try { s.addEventListener?.("voiceschanged", take); } catch { /* older phones */ }
    const t = window.setTimeout(take, 600);
    return () => { clearTimeout(t); try { s.removeEventListener?.("voiceschanged", take); } catch { /* gone */ } };
  }, []);
  return vs;
}

export function VoiceSettingsPanel({ onChange }: { onChange?: (on: boolean, s: VS) => void }) {
  const [on, setOn] = useState(() => voiceChoice() !== "off");
  const [s, setS] = useState<VS>(() => voiceSettings());
  const [all, setAll] = useState(false);
  const voices = usePhoneVoices();
  const save = (next: VS) => { setS(next); setVoiceSettings(next); onChange?.(on, next); };
  const read = (v: boolean) => { setOn(v); setVoiceChoice(v ? "on" : "off"); onChange?.(v, s); };
  const sample = (uri: string | null) => { try { window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance(SAMPLE, { ...s, voice: uri })); } catch { /* no voice here */ } };
  const shown = all ? voices : voices.slice(0, 5);
  return (
    <div className="voice-settings">
      <section className="card vs-card" aria-label={w("voice.readAloud")}>
        <b>{w("voice.readAloud")}</b>
        <div className="button-row" role="radiogroup" aria-label={w("voice.readAloud")}>
          <button type="button" className={`choice${on ? " on" : ""}`} aria-pressed={on} onClick={() => read(true)}>{w("voice.on")}</button>
          <button type="button" className={`choice${!on ? " on" : ""}`} aria-pressed={!on} onClick={() => read(false)}>{w("voice.off")}</button>
        </div>
        <small className="muted">{w("voice.offTheStepsStayOn")}</small>
      </section>
      <section className="card vs-card" aria-label={w("voice.voice")}>
        <b>{w("voice.voice")}</b>
        {voices.length ? (<>
          <small className="muted">{w("voice.voicesOnPhone")}</small>
          {shown.map((v) => { const sel = s.voice === v.uri; return (
            <div key={v.uri} className="vs-voice">
              <button type="button" className={`choice${sel ? " on" : ""}`} aria-pressed={sel} onClick={() => save({ ...s, voice: v.uri })}><b>{v.name}</b>&nbsp;<small className="muted">{langWords(v.lang)}</small></button>
              <button type="button" className="pill pill-small" aria-label={`Sample ${v.name}`} onClick={() => sample(v.uri)}>▶ Sample</button>
            </div>); })}
          {voices.length > 5 && <button type="button" className="link vs-all" onClick={() => setAll(!all)}>{all ? w("voice.fewerVoices") : w("voice.showAll", { n: voices.length })}</button>}
        </>) : <small className="muted">{w("voice.thisPhoneGivesNoVoices")}</small>}
      </section>
      <section className="card vs-card" aria-label={w("voice.speed")}>
        <b>{w("voice.speed")}</b>
        <div className="button-row" role="radiogroup" aria-label={w("voice.speed")}>
          {(["slower", "normal", "faster"] as Speed[]).map((k) => <button key={k} type="button" className={`choice${s.speed === k ? " on" : ""}`} aria-pressed={s.speed === k} onClick={() => { save({ ...s, speed: k }); sample(s.voice); }}>{k.charAt(0).toUpperCase() + k.slice(1)}</button>)}
        </div>
      </section>
      <section className="card vs-card" aria-label={w("voice.cutIn")}>
        <b>{w("voice.cutIn")}</b>
        <label className="vs-switch"><input type="checkbox" role="switch" checked={s.cutIn} onChange={(e) => save({ ...s, cutIn: e.target.checked })} /><span>{w("voice.nextBackAndStopCut")}</span></label>
        <small className="muted">{w("voice.onSayNextAndThe")}</small>
      </section>
      <section className="card vs-card vs-later" aria-label={w("voice.chefMealanSOwnVoice")}>
        <b>{w("voice.chefMealanSOwnVoice")}</b>
        <small className="muted">{w("voice.laterAnAiVoiceThat")}</small>
      </section>
    </div>
  );
}

// Settings: how the app works for you, on this phone. A list like Me; the parts not built yet show, marked Coming soon.
export function SettingsList({ open, dev }: { open: (id: "voice" | "dev" | "language") => void; dev?: boolean }) {
  const voices = usePhoneVoices();
  const on = voiceChoice() !== "off";
  const lang = useLang();
  return (
    <div className="menu-list me-rows settings-rows">
      <button type="button" className="menu-row" onClick={() => open("voice")}>
        <span className="menu-icon" aria-hidden="true">🔊</span><span className="menu-row-text"><b>{w("voice.voiceWhileCooking")}</b><small>{voiceLine(on, voiceSettings(), voices)}</small></span><span aria-hidden="true">›</span>
      </button>
      {/* DT203 (0.3.76, board Stories175 v2): Language opens; its line says what is in Serbian so far */}
      <button type="button" className="menu-row" onClick={() => open("language")}>
        <span className="menu-icon" aria-hidden="true">🌐</span><span className="menu-row-text"><b>{w("voice.language")}</b><small>{lang === "sr-Latn" ? w("langpanel.lineSr") : langLine(lang)}</small></span><span aria-hidden="true">›</span>
      </button>
      {/* DT231 (0.3.70, board Stories170; Coach Milan 3 November 10:32 to 14:38): Dev data, last, only for the admin */}
      {dev && <button type="button" className="menu-row" onClick={() => open("dev")}>
        <span className="menu-icon" aria-hidden="true">🛠️</span><span className="menu-row-text"><b>{w("voice.devData")}</b><small>{w("voice.onlyYouSeeThisOpening")}</small></span><span aria-hidden="true">›</span>
      </button>}
    </div>
  );
}
