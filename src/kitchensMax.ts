// DT334 (0.3.178, board Stories278; Go 23 November 2026, 08:43): up to 3 kitchens you cook. The app lets you pick 3; the server
// sends Chef Mealan the first 3 in the order they were tapped (a profile from before with more keeps its list; until 0.3.177
// he got 8). Kept in a file of its own, with no imports, so the server and the app share it.
export const KITCHENS_MAX = 3;
export const kitchensOf = (x: unknown): string[] => (Array.isArray(x) ? x : []).slice(0, KITCHENS_MAX).map((k: unknown) => String(k).slice(0, 30));
