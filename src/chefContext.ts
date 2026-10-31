// DT180 (0.3.25): a page can tell the round chef button where the person is and which three questions to start with. The
// Explorer's situation pages set it while they are open; the chat reads it instead of the tab's chips.
import { useEffect, useState } from "react";
export type ChefContext = { about: string; chips: string[] } | null;
let ctx: ChefContext = null;
const subs = new Set<(c: ChefContext) => void>();
export const chefContext = () => ctx;
export function setChefContext(c: ChefContext) { ctx = c; for (const f of subs) f(c); }
export function useChefContext(): ChefContext {
  const [c, set] = useState(ctx);
  useEffect(() => { subs.add(set); set(ctx); return () => { subs.delete(set); }; }, []);
  return c;
}
