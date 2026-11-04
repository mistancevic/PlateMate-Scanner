import { ConfirmButton } from "./Confirm";
import { w } from "../words";
import { APP_NAME } from "./Mark";
import { ADULT_ONLY } from "../safety";

// Release A (7 October 2026, canvas board R1): Chef Mealan is for adults. After the sign-in, before anything else,
// the welcome says what Chef Mealan does, that the AI can be wrong, and asks for one tap: 18 or older. The tap is kept with its date.
export function Welcome({ name, onConfirm, onSignOut }: { name: string; onConfirm: () => void; onSignOut: (() => void) | null }) {
  return (
    <div className="app-shell">
      <main className="gate">
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
export function AdultOnly({ onCorrect, onDelete }: { onCorrect: () => void; onDelete: (() => void) | null }) {
  return (
    <main className="gate">
      <b className="gate-brand">{APP_NAME}</b>
      <h1>{w("welcome.chefMealanIsForAdults")}</h1>
      <p>{ADULT_ONLY}</p>
      <p>{w("welcome.yourBirthYearMeansYou")}</p>
      <p>{w("welcome.ifYouTypedTheYear")}</p>
      <div className="actions gate-actions">
        <button className="pill pill-primary action-main" onClick={onCorrect}>{w("welcome.correctMyBirthYear")}</button>
        {onDelete && <ConfirmButton className="link action-cancel" label={w("welcome.deleteMyAccount")} confirmLabel={w("welcome.tapAgainToDeleteEverything")} onConfirm={onDelete} />}
      </div>
    </main>
  );
}
