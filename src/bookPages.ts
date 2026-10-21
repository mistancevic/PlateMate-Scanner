// BK69 (Milan 21 October 2026, 10:08): one landing address per book, chefmealan.com/<slug>, printed in the book and used in
// social posts. It opens the home page at the form with one line about the book. A visit counts per book (one number per
// day, no cookie, no visitor id) and a request remembers the book by its slug, never free text. A new book is one line here.
export const BOOK_PAGES: Record<string, string> = {
  "worthy-numbers": "Worthy Numbers",
};
// the slug of a book address, or null: "/worthy-numbers" and "/worthy-numbers/" both count
export function bookOfPath(path: string): string | null {
  const m = /^\/([a-z0-9-]{1,40})\/?$/.exec(path);
  return m && BOOK_PAGES[m[1]] ? m[1] : null;
}
// the daily count for a book: book_worthy_numbers
export const bookHit = (slug: string) => `book_${slug.replace(/-/g, "_")}`;
export const BOOK_HITS = Object.keys(BOOK_PAGES).map(bookHit);
