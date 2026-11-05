// DT203 (0.3.76, board Stories175 v2; Coach Milan 3 November 19:22 to 19:39, Go): the Language page in Settings.
// English, Srpski (latinica), Deutsch (Beta) since 0.3.92. Chef Mealan speaks the chosen language; the screens stay English for now.
import { w } from "../words";
import { useLang, setLang, LANG_NAMES, type Lang } from "../lang";

const CHOICES: { id: Lang; name: string; line: string }[] = [
  { id: "en", name: "English", get line() { return w("langpanel.everythingInEnglish"); } },
  { id: "sr-Latn", get name() { return w("langpanel.srpskiLatinica"); }, get line() { return w("langpanel.chefMealanHisQuestionsHis"); } },
  // DT238 (0.3.92, board Stories179; Coach Milan 5 November 11:36, Go): Deutsch (Beta), Claude's German for testers
  { id: "de", name: LANG_NAMES.de, get line() { return w("langpanel.deutschLine"); } },
];

export function LanguagePanel({ hasCoach = false }: { hasCoach?: boolean }) {
  const lang = useLang();
  return (
    <>
      <p className="small">{w("langpanel.theLanguageChefMealanSpeaks")}</p>
      <div className="menu-list me-rows lang-rows" role="radiogroup" aria-label={w("langpanel.language")}>
        {CHOICES.map((c) => { const on = lang === c.id; return (
          <button key={c.id} type="button" role="radio" aria-checked={on} className={`menu-row lang-row${on ? " on" : ""}`} onClick={() => setLang(c.id)}>
            <span className="menu-row-text"><b>{c.name}</b><small>{c.line}</small></span>{on && <b aria-hidden="true">✓</b>}
          </button>); })}
      </div>
      {/* DT237 v2 (0.3.88): the coach reads the summary in the coach's own language, whatever is picked here */}
      {hasCoach && <p className="small lang-coach">{w("langpanel.coachReads")}</p>}
      <small className="muted lang-note">{w("langpanel.thePrivacyNoticeAndThe")}</small>
    </>
  );
}
