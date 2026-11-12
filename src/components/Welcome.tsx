import { useState } from "react";
import { DeleteCheck } from "./DeleteCheck";
import { linkInUrl } from "../cloud";
import { w } from "../words";
import { APP_NAME } from "./Mark";
import { ADULT_ONLY } from "../safety";
import { LangAsk } from "./LangAsk";
import { useLang } from "../lang";

// Release A (7 October 2026, canvas board R1): Chef Mealan is for adults. After the sign-in, before anything else,
// the welcome says what Chef Mealan does, that the AI can be wrong, and asks for one tap: 18 or older. The tap is kept with its date.
export function Welcome({ name, onConfirm, onSignOut }: { name: string; onConfirm: () => void; onSignOut: (() => void) | null }) {
  useLang();
  return (
    <div className="app-shell">
      <main className="gate">
        {/* DT236 v3 (0.3.93): opened straight from a coach's invite, never on the home page: the same box once */}
        <LangAsk onHome={false} />
        <b className="gate-brand">{APP_NAME}</b>
        <h1>{name ? w("welcome.welcomeName", { name }) : w("welcome.welcome")}</h1>
        <p className="gate-lead">{w("welcome.eatWhatYouCraveChef")}</p>
        <ul className="gate-list">
          <li><b>{w("welcome.scanALabel")}</b> {w("welcome.andChefMealanReadsIt")}</li>
          <li><b>{w("welcome.pickWhat")}</b> {w("welcome.andGetTheAmountsThat")}</li>
          <li><b>{w("welcome.askChefMealan")}</b> {w("welcome.forInspirationAndRecipesThat")}</li>
        </ul>
        <p>{w("welcome.chefMealanUsesAiTo")}</p>
        <p>{w("welcome.thatAiIsForAdults")}</p>
        <div className="actions gate-actions">
          <button className="pill pill-primary action-main" onClick={onConfirm}>{w("welcome.iMOrOlderLet")}</button>
          {onSignOut && <button className="link action-cancel" onClick={onSignOut}>{w("welcome.notYetSignOut")}</button>}
        </div>
      </main>
    </div>
  );
}

// Canvas board R2: a birth year under 18 on the profile, at setup or later. The reason is the AI; the person corrects the year or deletes the account.
export function AdultOnly({ onCorrect, onDelete, email }: { onCorrect: () => void; onDelete: (() => Promise<void>) | null; email?: string }) {
  // DT259e: the same check that it is you as in the Menu
  const [deleting, setDeleting] = useState(() => linkInUrl() === "delete");
  return (
    <main className="gate">
      <b className="gate-brand">{APP_NAME}</b>
      <h1>{w("welcome.chefMealanIsForAdults")}</h1>
      <p>{ADULT_ONLY}</p>
      <p>{w("welcome.yourBirthYearMeansYou")}</p>
      <p>{w("welcome.ifYouTypedTheYear")}</p>
      <div className="actions gate-actions">
        <button className="pill pill-primary action-main" onClick={onCorrect}>{w("welcome.correctMyBirthYear")}</button>
        {onDelete && !deleting && <button className="pill pill-small pill-danger-line action-cancel" onClick={() => setDeleting(true)}>{w("welcome.deleteMyAccount")}</button>}
      </div>
      {onDelete && deleting && <DeleteCheck email={email ?? ""} run={onDelete} cancel={() => setDeleting(false)} />}
    </main>
  );
}
