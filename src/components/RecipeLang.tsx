// DT250 (0.3.99, board Stories185; Coach Milan 7 November 06:14 to 08:05, Go): a recipe in your language, on its page.
// An older recipe in another language than the app's: Chef Mealan offers once (Show it in English, or Keep it in Srpski).
// A translated recipe: the translation shows, with a switch to the original. A recipe that came in from a link or screenshots
// and was read in your language says so, with Original ›. Start cooking asks once, for a recipe not yet in your language.
import { useState, type ReactNode } from "react";
import { w } from "../words";
import { useLang, type Lang } from "../lang";
import { say, inLangWord } from "../chefScript";
import { offerFrom, showsTranslation, shownMeal, patchShown } from "../recipeLang";
import { RecipePage } from "./RecipePage";
import type { Meal } from "../pilot";
import { ChefLine } from "./ChefLine";

type Done = Promise<boolean>;
type Translate = (id: string) => Done;
const nameOf = (l: Lang) => w(l === "sr-Latn" ? "lang.nameSr" : l === "de" ? "lang.nameDe" : "lang.nameEn");

export function useRecipeLang(meal: Meal, x: { aiOn: boolean; translate: Translate; patch: (p: Partial<Meal>) => void; cook: () => void }): { before: ReactNode; atStart: ReactNode; onCook: () => void } {
  const lang = useLang();
  const [busy, setBusy] = useState(false);
  const [asking, setAsking] = useState(false);
  const from = x.aiOn ? offerFrom(meal, lang) : null;
  const run = async (then?: () => void) => { setBusy(true); const ok = await x.translate(meal.id); setBusy(false); if (ok || then) then?.(); };
  const keep = () => x.patch({ trNo: [...(meal.trNo ?? []), lang] });
  const tr = meal.tr && meal.tr.lang === lang ? meal.tr : null;
  let before: ReactNode = null;
  if (busy) before = <section className="card rq-lang" role="status"><small className="rq-drafting">{w("recipe.trWorking")}</small></section>;
  else if (tr) {
    const shown = showsTranslation(meal, lang);
    before = (
      <section className="card rq-lang" aria-label={w("recipe.trWhich")}>
        {tr.auto && meal.source && shown ? (
          <p className="small rq-lang-came"><b>{w(meal.source.from === "link" ? "recipe.trFromLink" : "recipe.trFromShot", { lang: inLangWord(lang, lang) })}</b> {w("recipe.trPageWas", { lang: inLangWord(lang, tr.from) })} <button type="button" className="link" onClick={() => x.patch({ trShow: "orig" })}>{w("recipe.trSeeOriginal")}</button></p>
        ) : (<>
          <div className="chips-row rq-lang-switch" role="group">
            <button type="button" className={`choice${shown ? " on" : ""}`} aria-pressed={shown} onClick={() => x.patch({ trShow: "tr" })}>{nameOf(lang)}</button>
            <button type="button" className={`choice${shown ? "" : " on"}`} aria-pressed={!shown} onClick={() => x.patch({ trShow: "orig" })}>{w("recipe.trOriginal", { lang: nameOf(tr.from) })}</button>
          </div>
          {shown && <small className="muted">{w("recipe.trBy")}</small>}
        </>)}
      </section>
    );
  } else if (from) {
    before = (
      <section className="chef-ask rq-lang-offer" aria-label={say("recipeOther", from, lang)}>
        <ChefLine text={say("recipeOther", from, lang)} />
        <div className="ca-go"><button type="button" className="pill pill-primary" onClick={() => void run()}>{w("recipe.trShowIt", { lang: inLangWord(lang, lang) })}</button>
          <button type="button" className="pill" onClick={keep}>{w("recipe.trKeepIt", { lang: inLangWord(lang, from) })}</button></div>
        <small>{w("recipe.trOfferHelp")}</small>
      </section>
    );
  }
  // b): Start cooking asks once, for a recipe not yet in your language
  const atStart: ReactNode = asking && from ? (
    <section className="chef-ask rq-lang-cook" aria-label={say("cookOther", from, lang)}>
      <ChefLine text={say("cookOther", from, lang)} />
      <div className="ca-go"><button type="button" className="pill pill-primary" disabled={busy} onClick={() => void run(() => { setAsking(false); x.cook(); })}>{busy ? w("recipe.trWorking") : w("recipe.trCookIt", { lang: inLangWord(lang, lang) })}</button>
        <button type="button" className="pill" disabled={busy} onClick={() => { keep(); setAsking(false); x.cook(); }}>{w("recipe.trAsWritten")}</button></div>
      <small>{w("recipe.trCookHelp")}</small>
    </section>
  ) : null;
  return { before, atStart, onCook: () => (from ? setAsking(true) : x.cook()) };
}

// the recipe's page in the language it shows in: edits made while the translation shows go into the translation
type PageProps = Parameters<typeof RecipePage>[0];
export function LangRecipePage(props: PageProps & { aiOn: boolean; translate: Translate }) {
  const { aiOn, translate, ...page } = props;
  const lang = useLang();
  const patch = (pt: Partial<Meal>) => page.onPatch(patchShown(page.meal, lang, pt));
  const l = useRecipeLang(page.meal, { aiOn, translate, patch, cook: () => page.onCookIt?.() });
  return <RecipePage {...page} meal={shownMeal(page.meal, lang)} onPatch={patch}
    onRename={(t) => (showsTranslation(page.meal, lang) ? patch({ title: t }) : page.onRename(t))}
    onCookIt={page.onCookIt ? l.onCook : page.onCookIt} beforeSteps={l.before} atStart={l.atStart} />;
}
