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
          {/* board B, 12 October 2026: the product role first, then the coaching after hours */}
          <p><b>Chef Mealan is built and run by {OPERATOR.name} in Munich. Product builder by day, fitness and nutrition coach after hours.</b></p>
          <p>Milan is a senior product manager with about 20 years in B2B and B2B2C software, and the founder of several startups and agencies. One of the startups, an event planner app, was acquired. He designs and builds Chef Mealan with AI, from the first sketch to every release.</p>
          <p>After hours, Milan is a certified fitness and nutrition coach, known to his clients as Coach Milan. He cooks every day for himself and his family, and tries every recipe and every number on himself first.</p>
          <p>In Chef Mealan, a calculator calculates the numbers, the AI reads labels and talks, and you and your coach decide. Chef Mealan is being tested by a small group right now; most people join with a code from their coach.</p>
          <p>Milan is also the author of Worth Building, a product playbook.</p>
          <div className="about-links"><a href="/built">How Chef Mealan is built</a><a href="/built#books">Worth Building</a><a href="https://www.linkedin.com/in/milanstancevic" target="_blank" rel="noreferrer">Milan on LinkedIn</a></div>
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
          <p className="small muted">GDPR Articles 13 and 14 · Datenschutzerklärung · Last updated 30 October 2026 (voice in cook mode; daily backups kept 30 days; product search on Open Food Facts; what goes to Gemini with each request; your private part; Your summary and your coach)</p>
          <h2>1. Who is responsible</h2>
          <p>{OPERATOR.name}, {OPERATOR.city}, {OPERATOR.country}. <a href={`mailto:${OPERATOR.email}`}>{OPERATOR.email}</a>. No data protection officer is appointed; the pilot is below the thresholds that require one.</p>
          <h2>2. What Chef Mealan keeps, and why</h2>
          <ul>
            <li><b>Account.</b> Your Google sign-in (name, email, user ID), so the app knows it is you, and the date you confirmed that you're 18 or over. Legal basis: the contract, Art. 6(1)(b).</li>
            <li><b>Body data.</b> Female or male (the formulas differ), birth year, height, weight, body fat if you give it, and the weigh-ins you add. Used only to calculate your numbers and show your trend to you and your coach. This is health data; it is kept only after you agree on the profile, Art. 9(2)(a), and you can withdraw by deleting it or the account.</li>
            <li><b>Your declarations.</b> What you tick under "Is any of this true for you?", allergies and intolerances, with the date, so Chef Mealan steps back where it should. Health data, same basis, same withdrawal.</li>
            <li><b>Your foods, plates, cards and photos.</b> What you scan, build, cook and rate, and the photos of packs and plates you take or pick from your phone. A plate photo you pick can be of someone else's plate (a meal shared with you, a plate online): it is kept as an idea, never logged as your meal, and never offered to members or on a public page. Legal basis: the contract.</li>
            <li><b>The coach link.</b> Which coach you joined, what you chose to share with them, and what they sent you. Your coach sees the cards you share, the goal, and that you ticked a situation and when, never the words you typed. Your coach also sees your week: each day, the meals planned against the meals eaten, with their names, PD and kcal, and your weigh-ins, and your measured burn: what you ate on full days, what your weight line did, and the result. Your coach's notes and your replies are kept with your account. Legal basis: the contract.</li>
            <li><b>Your private part.</b> Your body data, your health answers and allergies, every declaration, your foods, plates, notes and where you shop are kept in a part of your account only you can open; the database's rules enforce it, not only the app's screens. Your coach's part holds what your coach sees: your week, your goal and its numbers, your weigh-ins as a trend in percent of your weight (in kilograms only when you share your body data on Your summary), and which health situation you ticked and when. A coach can change only the coach's things on your account: your goal, the formula, notes, the check-in day, the answer on your numbers and the confirmation of Chef Mealan's chat. Our server reads your private part only to keep Chef Mealan safe for you: that you're 18 or over, your allergies and the situations you ticked.</li>
            <li><b>Your summary, and what your coach sees of it.</b> Your summary puts your answers in one place. With a coach, you choose, part by part, which parts your coach sees: goal and numbers, your day, how you eat, your training week and where you shop and cook are on until you switch them off; what you eat, alcohol, your own words, your allergies and your body data are off until you switch them on. Allergies and body data are health data: switching them on is your consent, dated, Art. 9(2)(a), and you withdraw it by switching them off. Your coach sees the shared parts as they are today, with what changed and when; a change to a part you don't share never reaches your coach. Switching a part off removes it and its past changes from what your coach sees; leaving your coach or deleting your account removes it all. A PDF your coach saves is your coach's own copy. Legal basis: the contract, Art. 6(1)(b), and for health data your consent.</li>
            <li><b>A request to join, from the home page.</b> Your name, your email, what you wrote, and a mobile number if you give one, so Coach Milan can send you a personal code. The number is used only to message you on WhatsApp or by text about joining; a WhatsApp chat runs under WhatsApp's own terms. Legal basis: your request, Art. 6(1)(b). Deleted with your account, or when you ask by email.</li>
            <li><b>Recipes you share with members.</b> When you tap Share with members on a recipe, every member of Chef Mealan can see its name, foods, amounts, steps, kitchen and the cover you picked, calculated for their own day. Your first name goes with it only when you switch Show my first name on; it is off until you do. Never your notes, ratings, other photos or anything you declared. Take it back removes it; a copy a member already kept stays theirs. Coach Milan, who runs the pilot, can take a shared recipe down. Legal basis: the contract, Art. 6(1)(b).</li>
            <li><b>Pictures drawn by Chef Mealan.</b> A recipe you keep without a photo gets one drawn picture, made from its name, foods and amounts, labelled Picture by Chef Mealan. The picture stays with your recipe. Our server keeps only which recipes got one and how many were drawn each day, to hold the limits. Legal basis: the contract.</li>
            <li><b>Book sign-ups, from How Chef Mealan is built.</b> Your email and the books you picked, used for one email when a book is out, nothing else. Legal basis: your consent, Art. 6(1)(a); withdraw by email at any time.</li>
            <li><b>A pilot log.</b> What you tapped in the app (a mix shown, a tip taken), with no photos and no free text, to improve the pilot. Legal basis: legitimate interest, Art. 6(1)(f); you can object by email.</li>
          </ul>
          <h2>3. Where it is, and who processes it</h2>
          <ul>
            <li><b>Google Cloud, Frankfurt (EU).</b> The app runs on Cloud Run; your data sits in Firestore and Firebase Authentication, and your photos as image files in Firebase Storage, region europe-west1/europe-west3. Only you can open your photos; your coach sees a plate's photo only when you share that card. Google Ireland Ltd is the processor under its Cloud data processing terms.</li>
            <li><b>Google Gemini API.</b> When you scan a label, take or pick a photo of a meal, or write to Chef Mealan, the photo or the text is sent to Google's Gemini API to be read, and the answer comes back. For a drawn cover, the recipe's name, foods and amounts are sent, and a picture comes back. So that every suggestion is safe and fits you, the request also carries, with no name, email or account id: your allergies and intolerances and the health situations you ticked (health data, Art. 9(2)(a), on your consent), your goal's numbers, how you eat (your diet, carbs and fat, how often you drink, where you eat, work travel, wake-up and bedtime, your work hours), your taste chips and own words, your kitchens and what you cook with, and, for Chef's review of your plates, the notes on those cards. Chef Mealan uses the paid Gemini API: under its terms, Google does not use that content to train its models.</li>
            <li><b>Open Food Facts.</b> A barcode you scan is looked up there, and so are the words you type when you search for a product, with your country so the right shop's products come first. Neither is personal data; nothing else is sent, no name, email or account id.</li>
            <li><b>Your browser's speech service, in cook mode.</b> Only when you turn voice on while cooking: your browser turns what you say into words, Google in Chrome, Apple in Safari, under their own terms, and the phone's own voice reads the steps. Chef Mealan keeps no recordings and sends none of it to Gemini. Buttons only turns it off.</li>
            <li>No advertising, no analytics beyond the pilot log above and the visit counts in section 7, no sale or sharing of your data with anyone else.</li>
          </ul>
          <h2>4. How long</h2>
          <p>While your account exists. Delete the account, from Menu, Account, and everything goes: profile, declarations, foods, cards, photos, recipes, the recipes you shared with members, the sign-in. Once a day the database is backed up by Google, in the same Frankfurt location, and each backup is deleted after 30 days, so after you delete your account your data leaves the backups within 30 days. A backup is only ever used to restore the app after a failure. When the photos moved into image files in October 2026, their old copies in the database stayed for 30 days, then were removed.</p>
          <h2>5. Your rights</h2>
          <p>Access, rectification, erasure, restriction, portability and objection, Art. 15 to 21. In the app: Menu, Account, Export my data gives you everything as one file; Delete my account removes it. By email: {OPERATOR.email}. You may complain to a supervisory authority; for Bavaria that is the Bayerisches Landesamt für Datenschutzaufsicht (BayLDA), Ansbach.</p>
          <h2>6. Age</h2>
          <p>Chef Mealan is for people 18 and over, because the AI it uses is only allowed for adults. You confirm your age when you first sign in. If we learn that an account belongs to someone under 18, we close it and delete its data.</p>
          <h2>7. Cookies, storage and counting</h2>
          <p>No tracking cookies. The browser keeps your sign-in session and a local copy of your data so the app works offline; both are cleared when you sign out or delete the account.</p>
          <p><b>Counting visits.</b> We count visits to chefmealan.com per day: how many people open a page, use the calculator or tap Try Chef Mealan. We set no cookie, and we store no IP address or visitor ID with these counts, so a count can't be traced back to you. We do this to know whether the site works (legitimate interest, Art. 6(1)(f) GDPR).</p>
          <p><b>How the pilot is used.</b> In the app, the pilot log (for example, a meal saved or a label read) goes to our server in Frankfurt with your member number, not your email. It contains no free text, photos or food names. We keep it for 12 months, and we delete it with your account.</p>
          <h2>8. Automated decisions</h2>
          <p>Chef Mealan is an AI chef. It suggests; it does not decide anything with legal or similar effect on you. Whether Chef Mealan's chat is on for an account follows the rules on the profile and, for one declared situation, your coach's confirmation, which a person makes.</p>
        </article>
      )}
      {page === "disclaimer" && (
        <article>
          <h1>Disclaimer</h1>
          <p><b>Chef Mealan is an AI chef, not a doctor, dietitian or therapist.</b> It can be wrong. A number it reads from a label is an estimate until you check it against the pack; a plate it suggests is a chef's suggestion, not a prescription.</p>
          <p><b>Not medical advice.</b> Nothing in Chef Mealan diagnoses, treats or prevents a condition. If you are pregnant or breastfeeding, have diabetes or take insulin, have an allergy or an intolerance, take medication that affects food, or have or had a difficult relationship with eating, the app steps back and names who to talk to; that person's advice comes first. In an emergency, call 112.</p>
          <p><b>Numbers.</b> Calories, protein and the rest come from the pack, a database, or a reading by the model; the arithmetic is code. Daily numbers are calculated from what you entered on the profile with a standard formula and are a starting point, not a prescription.</p>
          <p><b>Allergens.</b> Chef Mealan checks a food's name and its label lines against what you declared. It cannot see what a label does not say, and it never replaces reading the pack. If you have a serious allergy, read every pack.</p>
          <p><b>Your coach.</b> What a coach sets or sends is the coach's; the app carries it.</p>
        </article>
      )}
      <footer className="l-foot"><span>© 2026 {OPERATOR.name} · <a href="/impressum">Impressum</a> · <a href="/privacy">Privacy</a> · <a href="/disclaimer">Disclaimer</a> · <a href="/about">Who's behind it</a></span></footer>
    </div>
  );
}
