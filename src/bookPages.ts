// BK69 and BP70 (Milan 21 October 2026): one page per book at chefmealan.com/<slug>, printed in the book and used in
// social posts. The page shows the book, what is inside, the download, and the way into Chef Mealan. A visit counts per
// book (one number per day, no cookie, no visitor id) and a request remembers the book by its slug, never free text.
// A new book is one entry here.
export type BookPage = {
  name: string;
  kicker: string;
  subtitle: string;
  intro: string;
  cover: string;          // the cover, drawn from the book
  share: string;          // 1200 x 630, for links in social posts
  inside: { name: string; says: string; key?: boolean }[];
  pdf?: string;           // empty while the book is in its last edit: the page shows a placeholder
  // BP70 (Milan 11:29): the book's key idea, explained for a cold reader, with one worked example and a way to try it
  hook?: { title: string; text: string[]; from: { label: string; pd: string; sub: string }; to: { label: string; pd: string; sub: string }; after: string; tryIt: string };
};
export const BOOKS: Record<string, BookPage> = {
  "worthy-numbers": {
    name: "Worthy Numbers",
    kicker: "A guide to food labels",
    subtitle: "The numbers on your food, and which ones help you decide.",
    intro: "Short pages on the numbers you see on food every day: what each one tells you, what it can't, and how to use it at your next meal.",
    cover: "/books/worthy-numbers-cover.webp",
    share: "/books/worthy-numbers-og.jpg",
    inside: [
      { name: "The label", says: "100 g" },
      { name: "Nutri-Score", says: "A to E" },
      { name: "High protein", says: "20%" },
      { name: "Protein quality", says: "1.0" },
      { name: "GI and GL", says: "0 to 100, per portion" },
      { name: "Protein density (PD)", says: "protein per 100 kcal", key: true },
    ],
    hook: {
      title: "PD, the number no pack prints",
      text: [
        "PD means protein density: grams of protein in 100 kcal. You work it out from two lines of any label, protein and energy.",
        "Granola: 9 g of protein in 450 kcal is PD 2. Skyr: 11 g in 63 kcal is about PD 17. The higher the PD, the more protein you get for the same calories.",
      ],
      from: { label: "60 g of granola with 200 ml of milk 1.5%", pd: "PD 3.4", sub: "364 kcal, 12 g protein" },
      to: { label: "With 150 g of skyr on top", pd: "PD 6.3", sub: "459 kcal, 29 g protein" },
      after: "The book shows how PD works next to the label, the protein claims and Nutri-Score, and how to set your own target.",
      tryIt: "Try PD on your own craving",
    },
  },
};
export const BOOK_PAGES: Record<string, string> = Object.fromEntries(Object.entries(BOOKS).map(([slug, b]) => [slug, b.name]));
// the slug of a book address, or null: "/worthy-numbers" and "/worthy-numbers/" both count
export function bookOfPath(path: string): string | null {
  const m = /^\/([a-z0-9-]{1,40})\/?$/.exec(path);
  return m && BOOKS[m[1]] ? m[1] : null;
}
// the daily count for a book: book_worthy_numbers
export const bookHit = (slug: string) => `book_${slug.replace(/-/g, "_")}`;
export const BOOK_HITS = Object.keys(BOOKS).map(bookHit);
