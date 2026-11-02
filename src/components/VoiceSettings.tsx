// DT215 v3 (0.3.66, board Stories162b): Voice while cooking. Read aloud on or off, the phone's voices with a sample, the speed,
// cut in. In Settings, and over cook mode from its Voice › link.
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
      <section className="card vs-card" aria-label="Read aloud">
        <b>Read aloud</b>
        <div className="button-row" role="radiogroup" aria-label="Read aloud">
          <button type="button" className={`choice${on ? " on" : ""}`} aria-pressed={on} onClick={() => read(true)}>On</button>
          <button type="button" className={`choice${!on ? " on" : ""}`} aria-pressed={!on} onClick={() => read(false)}>Off</button>
        </div>
        <small className="muted">Off: the steps stay on the screen and the buttons steer.</small>
      </section>
      <section className="card vs-card" aria-label="Voice">
        <b>Voice</b>
        {voices.length ? (<>
          <small className="muted">The voices on this phone, English first. ▶ Sample reads one step.</small>
          {shown.map((v) => { const sel = s.voice === v.uri; return (
            <div key={v.uri} className="vs-voice">
              <button type="button" className={`choice${sel ? " on" : ""}`} aria-pressed={sel} onClick={() => save({ ...s, voice: v.uri })}><b>{v.name}</b>&nbsp;<small className="muted">{langWords(v.lang)}</small></button>
              <button type="button" className="pill pill-small" aria-label={`Sample ${v.name}`} onClick={() => sample(v.uri)}>▶ Sample</button>
            </div>); })}
          {voices.length > 5 && <button type="button" className="link vs-all" onClick={() => setAll(!all)}>{all ? "Fewer voices" : `Show all ${voices.length} voices ›`}</button>}
        </>) : <small className="muted">This phone gives no voices to choose from: it reads with its own.</small>}
      </section>
      <section className="card vs-card" aria-label="Speed">
        <b>Speed</b>
        <div className="button-row" role="radiogroup" aria-label="Speed">
          {(["slower", "normal", "faster"] as Speed[]).map((k) => <button key={k} type="button" className={`choice${s.speed === k ? " on" : ""}`} aria-pressed={s.speed === k} onClick={() => { save({ ...s, speed: k }); sample(s.voice); }}>{k.charAt(0).toUpperCase() + k.slice(1)}</button>)}
        </div>
      </section>
      <section className="card vs-card" aria-label="Cut in">
        <b>Cut in</b>
        <label className="vs-switch"><input type="checkbox" role="switch" checked={s.cutIn} onChange={(e) => save({ ...s, cutIn: e.target.checked })} /><span>Next, back and stop cut in while I read</span></label>
        <small className="muted">On: say next and the reading stops and moves on. Off: I finish the sentence first.</small>
      </section>
      <section className="card vs-card vs-later" aria-label="Chef Mealan's own voice">
        <b>Chef Mealan's own voice</b>
        <small className="muted">Later: an AI voice that talks both ways. Not yet.</small>
      </section>
    </div>
  );
}

// Settings: how the app works for you, on this phone. A list like Me; the parts not built yet show, marked Coming soon.
export function SettingsList({ open }: { open: (id: "voice") => void }) {
  const voices = usePhoneVoices();
  const on = voiceChoice() !== "off";
  return (
    <div className="menu-list me-rows settings-rows">
      <button type="button" className="menu-row" onClick={() => open("voice")}>
        <span className="menu-icon" aria-hidden="true">🔊</span><span className="menu-row-text"><b>Voice while cooking</b><small>{voiceLine(on, voiceSettings(), voices)}</small></span><span aria-hidden="true">›</span>
      </button>
      <div className="menu-row settings-soon" aria-disabled="true">
        <span className="menu-icon" aria-hidden="true">🌐</span><span className="menu-row-text"><b>Language</b><small>English. Serbian and German are coming.</small></span><span className="me-todo soon">Coming soon</span>
      </div>
      <div className="menu-row settings-soon" aria-disabled="true">
        <span className="menu-icon" aria-hidden="true">⚖️</span><span className="menu-row-text"><b>Units</b><small>Grams and millilitres. Ounces and cups are coming.</small></span><span className="me-todo soon">Coming soon</span>
      </div>
    </div>
  );
}
