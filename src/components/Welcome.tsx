import { ConfirmButton } from "./Confirm";
import { APP_NAME } from "./Mark";
import { ADULT_ONLY } from "../safety";

// Release A (7 October 2026, canvas board R1): Chef Mealan is for adults. After the sign-in, before anything else,
// the welcome says what Chef Mealan does, that the AI can be wrong, and asks for one tap: 18 or older. The tap is kept with its date.
export function Welcome({ name, onConfirm, onSignOut }: { name: string; onConfirm: () => void; onSignOut: (() => void) | null }) {
  return (
    <div className="app-shell">
      <main className="gate">
        <b className="gate-brand">{APP_NAME}</b>
        <h1>{name ? `Welcome, ${name}` : "Welcome"}</h1>
        <p className="gate-lead">Eat what you crave. Chef Mealan tells you how much.</p>
        <ul className="gate-list">
          <li><b>Scan a label or a plate,</b> and Chef Mealan reads it.</li>
          <li><b>Pick what you want to eat,</b> and get the amounts that fit your goal.</li>
          <li><b>Ask Chef Mealan</b> for inspiration and recipes that fit your planned day and your cravings.</li>
        </ul>
        <p>Chef Mealan uses AI to read labels and photos, and to answer you in the chat. AI can get things wrong, so take a second look at what it reads and says. Your numbers come from a calculator, not from the AI.</p>
        <p>That AI is for adults, so Chef Mealan is too.</p>
        <div className="actions gate-actions">
          <button className="pill pill-primary action-main" onClick={onConfirm}>I'm 18 or older, let's start</button>
          {onSignOut && <button className="link action-cancel" onClick={onSignOut}>Not yet 18? Sign out</button>}
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
      <h1>Chef Mealan is for adults</h1>
      <p>{ADULT_ONLY}</p>
      <p>Your birth year means you're under 18, so you can't use Chef Mealan yet.</p>
      <p>If you typed the year wrong, correct it and carry on.</p>
      <div className="actions gate-actions">
        <button className="pill pill-primary action-main" onClick={onCorrect}>Correct my birth year</button>
        {onDelete && <ConfirmButton className="link action-cancel" label="Delete my account" confirmLabel="Tap again to delete everything" onConfirm={onDelete} />}
      </div>
    </main>
  );
}
