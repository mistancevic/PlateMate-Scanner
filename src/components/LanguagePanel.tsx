// DT203 (0.3.76, board Stories175 v2; Coach Milan 3 November 19:22 to 19:39, Go): the Language page in Settings.
// English, Srpski (latinica), Deutsch coming soon. Chef Mealan speaks the chosen language; the screens stay English for now.
import { w } from "../words";
import { useLang, setLang, type Lang } from "../lang";

const CHOICES: { id: Lang; name: string; line: string }[] = [
  { id: "en", name: "English", get line() { return w("langpanel.everythingInEnglish"); } },
  { id: "sr-Latn", get name() { return w("langpanel.srpskiLatinica"); }, get line() { return w("langpanel.chefMealanHisQuestionsHis"); } },
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
        <div className="menu-row lang-row settings-soon" aria-disabled="true">
          <span className="menu-row-text"><b>{w("langpanel.deutsch")}</b><small>{w("langpanel.afterSerbianOnceAGerman")}</small></span><span className="me-todo soon">{w("langpanel.comingSoon")}</span>
        </div>
      </div>
      {/* DT237 v2 (0.3.88): the coach reads the summary in the coach's own language, whatever is picked here */}
      {hasCoach && <p className="small lang-coach">{w("langpanel.coachReads")}</p>}
      <small className="muted lang-note">{w("langpanel.thePrivacyNoticeAndThe")}</small>
    </>
  );
}
