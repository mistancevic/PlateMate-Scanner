// DT203 (0.3.76, board Stories175 v2; Coach Milan 3 November 19:22 to 19:39, Go): the Language page in Settings.
// English, Srpski (latinica), Deutsch coming soon. Chef Mealan speaks the chosen language; the screens stay English for now.
import { useLang, setLang, type Lang } from "../lang";

const CHOICES: { id: Lang; name: string; line: string }[] = [
  { id: "en", name: "English", line: "Everything in English" },
  { id: "sr-Latn", name: "Srpski (latinica)", line: "Chef Mealan: his questions, his answers, the safety lines and cook mode's words. The screens stay English for now." },
];

export function LanguagePanel() {
  const lang = useLang();
  return (
    <>
      <p className="small">The language Chef Mealan speaks to you. The screens follow, part by part.</p>
      <div className="menu-list me-rows lang-rows" role="radiogroup" aria-label="Language">
        {CHOICES.map((c) => { const on = lang === c.id; return (
          <button key={c.id} type="button" role="radio" aria-checked={on} className={`menu-row lang-row${on ? " on" : ""}`} onClick={() => setLang(c.id)}>
            <span className="menu-row-text"><b>{c.name}</b><small>{c.line}</small></span>{on && <b aria-hidden="true">✓</b>}
          </button>); })}
        <div className="menu-row lang-row settings-soon" aria-disabled="true">
          <span className="menu-row-text"><b>Deutsch</b><small>After Serbian, once a German speaker has checked it</small></span><span className="me-todo soon">Coming soon</span>
        </div>
      </div>
      <small className="muted lang-note">The privacy notice and the disclaimer stay in English. Food names already come in Serbian where the shop region is Serbia.</small>
    </>
  );
}
