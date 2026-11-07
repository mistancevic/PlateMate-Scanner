// DT243 part two: a weekday's name by its place in the week, Monday first (0 to 6), in the app's language. The phone's
// calendar writes it, as dateText does: Monday · ponedeljak · Montag. 1 January 2024 was a Monday.
import { dateText, dateV, type Val } from "./words";
const dayAt = (i: number) => new Date(2024, 0, 1 + (((i % 7) + 7) % 7), 12);
export const weekdayName = (i: number): string => dateText(dayAt(i), { weekday: "long" });
export const weekdayV = (i: number): Val => dateV(dayAt(i), { weekday: "long" });
// the short name: Mon · pon
export const weekdayShort = (i: number): string => dateText(dayAt(i), { weekday: "short" });
