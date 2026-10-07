import { Mark, APP_NAME } from "../components/Mark";

// The pages the law asks for, readable without signing in: /impressum, /privacy, /disclaimer, /about.
// Not legal advice; a lawyer's half hour before anyone beyond friends joins. The street address waits for an address service.
export type LegalPage = "impressum" | "privacy" | "disclaimer" | "about";
export const LEGAL_PATHS: Record<string, LegalPage> = { "/impressum": "impressum", "/privacy": "privacy", "/datenschutz": "privacy", "/disclaimer": "disclaimer", "/about": "about" };
export const legalPageFromPath = (path: string): LegalPage | null => LEGAL_PATHS[path.replace(/\/+$/, "") || "/"] ?? null;

const OPERATOR = {
  name: "Milan Stancevic",
  city: "80689 München",
  country: "Germany",
  email: "hello@chefmealan.com",
};

export function LegalScreen({ page, back }: { page: LegalPage; back: () => void }) {
  const nav = (
    <nav className="legal-nav">
      {(["about", "impressum", "privacy", "disclaimer"] as LegalPage[]).map((p) => (
        <a key={p} href={`/${p}`} className={p === page ? "on" : ""}>{{ about: "Who's behind it", impressum: "Impressum", privacy: "Privacy notice", disclaimer: "Disclaimer" }[p]}</a>
      ))}
    </nav>
  );
  return (
    <div className="legal">
      <header className="l-top">
        <div className="l-brand"><Mark size={30} color="var(--brand)" /><b>{APP_NAME}</b></div>
        <button className="pill pill-small" onClick={back}>Back to the app</button>
      </header>
      {nav}
      {page === "about" && (
        <article>
          <h1>Who's behind Chef Mealan</h1>
          <p>Chef Mealan is built and run by {OPERATOR.name}, a product manager in Munich and a certified fitness and nutrition coach.</p>
          <p>It is a closed pilot: a coach gives out a code, a person joins with it, and the two of them decide together what the plate should be. Mealan is the AI chef in between: it reads labels, fits amounts to a goal, and stays a chef. The numbers come from code; the model reads labels, menus and shelves; you and your coach decide.</p>
          <p>Questions, feedback, a code: <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>.</p>
        </article>
      )}
      {page === "impressum" && (
        <article>
          <h1>Impressum</h1>
          <p className="small muted">Angaben gemäß § 5 DDG (formerly § 5 TMG)</p>
          <p>{OPERATOR.name}<br />{OPERATOR.city}<br />{OPERATOR.country}</p>
          <p>E-Mail: <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a></p>
          <p>Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV: {OPERATOR.name}, {OPERATOR.city}.</p>
          <h2>Haftung für Inhalte</h2>
          <p>Die Inhalte dieser Seiten wurden mit größter Sorgfalt erstellt. Für die Richtigkeit, Vollständigkeit und Aktualität der Inhalte, insbesondere der von einem KI-Modell gelesenen Nährwerte, kann keine Gewähr übernommen werden. Nährwerte sind Schätzungen; maßgeblich ist die Angabe auf der Verpackung.</p>
          <h2>Streitschlichtung</h2>
          <p>Wir sind nicht bereit oder verpflichtet, an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teilzunehmen.</p>
        </article>
      )}
      {page === "privacy" && (
        <article>
          <h1>Privacy notice</h1>
          <p className="small muted">GDPR Articles 13 and 14 · Datenschutzerklärung · Last updated 7 October 2026 (photos as files)</p>
          <h2>1. Who is responsible</h2>
          <p>{OPERATOR.name}, {OPERATOR.city}, {OPERATOR.country}. <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>. No data protection officer is appointed; the pilot is below the thresholds that require one.</p>
          <h2>2. What Chef Mealan keeps, and why</h2>
          <ul>
            <li><b>Account.</b> Your Google sign-in (name, email, user ID), so the app knows it is you, and the date you confirmed that you're 18 or over. Legal basis: the contract, Art. 6(1)(b).</li>
            <li><b>Body data.</b> Sex, birth year, height, weight, body fat if you give it, and the weigh-ins you add. Used only to calculate your numbers and show your trend to you and your coach. This is health data; it is kept only after you agree on the profile, Art. 9(2)(a), and you can withdraw by deleting it or the account.</li>
            <li><b>Your declarations.</b> What you tick under "Is any of this true for you?", allergies and intolerances, with the date, so Mealan steps back where it should. Health data, same basis, same withdrawal.</li>
            <li><b>Your foods, plates, cards and photos.</b> What you scan, build, cook and rate, and the photos you take of packs and plates. Legal basis: the contract.</li>
            <li><b>The coach link.</b> Which coach you joined, what you chose to share with them, and what they sent you. Your coach sees the cards you share, the goal, and that you ticked a situation and when, never the words you typed. Legal basis: the contract.</li>
            <li><b>A pilot log.</b> What you tapped in the app (a mix shown, a tip taken), with no photos and no free text, to improve the pilot. Legal basis: legitimate interest, Art. 6(1)(f); you can object by email.</li>
          </ul>
          <h2>3. Where it is, and who processes it</h2>
          <ul>
            <li><b>Google Cloud, Frankfurt (EU).</b> The app runs on Cloud Run; your data sits in Firestore and Firebase Authentication, and your photos as image files in Firebase Storage, region europe-west1/europe-west3. Only you can open your photos; your coach sees a plate's photo only when you share that card. Google Ireland Ltd is the processor under its Cloud data processing terms.</li>
            <li><b>Google Gemini API.</b> When you scan a label or write to Mealan, the photo or the text is sent to Google's Gemini API to be read, and the answer comes back. Chef Mealan uses the paid Gemini API: under its terms, Google does not use that content to train its models.</li>
            <li><b>Open Food Facts.</b> A barcode you scan is looked up there. The barcode is not personal data; nothing else is sent.</li>
            <li>No advertising, no analytics beyond the pilot log above, no sale or sharing of your data with anyone else.</li>
          </ul>
          <h2>4. How long</h2>
          <p>While your account exists. Delete the account, from Menu, Account, and everything goes: profile, declarations, foods, cards, photos, recipes, the sign-in. Chef Mealan keeps no separate backup copies. When the photos moved into image files in October 2026, their old copies in the database stayed for 30 days, then were removed.</p>
          <h2>5. Your rights</h2>
          <p>Access, rectification, erasure, restriction, portability and objection, Art. 15 to 21. In the app: Menu, Account, Export my data gives you everything as one file; Delete my account removes it. By email: {OPERATOR.email}. You may complain to a supervisory authority; for Bavaria that is the Bayerisches Landesamt für Datenschutzaufsicht (BayLDA), Ansbach.</p>
          <h2>6. Age</h2>
          <p>Chef Mealan is for people 18 and over, because the AI it uses is only allowed for adults. You confirm your age when you first sign in. If we learn that an account belongs to someone under 18, we close it and delete its data.</p>
          <h2>7. Cookies and storage</h2>
          <p>No tracking cookies. The browser keeps your sign-in session and a local copy of your data so the app works offline; both are cleared when you sign out or delete the account.</p>
          <h2>8. Automated decisions</h2>
          <p>Mealan is an AI chef. It suggests; it does not decide anything with legal or similar effect on you. Whether Mealan's chat is on for an account follows the rules on the profile and, for one declared situation, your coach's confirmation, which a person makes.</p>
        </article>
      )}
      {page === "disclaimer" && (
        <article>
          <h1>Disclaimer</h1>
          <p><b>Mealan is an AI chef, not a doctor, dietitian or therapist.</b> It can be wrong. A number it reads from a label is an estimate until you check it against the pack; a plate it suggests is a chef's suggestion, not a prescription.</p>
          <p><b>Not medical advice.</b> Nothing in Chef Mealan diagnoses, treats or prevents a condition. If you are pregnant or breastfeeding, have diabetes or take insulin, have an allergy or an intolerance, take medication that affects food, or have or had a difficult relationship with eating, the app steps back and names who to talk to; that person's advice comes first. In an emergency, call 112.</p>
          <p><b>Numbers.</b> Calories, protein and the rest come from the pack, a database, or a reading by the model; the arithmetic is code. Daily numbers are calculated from what you entered on the profile with a standard formula and are a starting point, not a prescription.</p>
          <p><b>Allergens.</b> Mealan checks a food's name and its label lines against what you declared. It cannot see what a label does not say, and it never replaces reading the pack. If you have a serious allergy, read every pack.</p>
          <p><b>Your coach.</b> What a coach sets or sends is the coach's; the app carries it.</p>
        </article>
      )}
      <footer className="l-foot"><span>© 2026 {OPERATOR.name} · <a href="/impressum">Impressum</a> · <a href="/privacy">Privacy</a> · <a href="/disclaimer">Disclaimer</a> · <a href="/about">Who's behind it</a></span></footer>
    </div>
  );
}
