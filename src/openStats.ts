// Storage release 1: a number to compare before and after. How long the app took to open on this phone (from the page
// starting to load until the main screen showed), how big the saved data is, and how many photos the photo store holds.
export const openStats = { ms: null as number | null, photos: 0 };
export const savedDataKb = () => { try { return Math.round(((localStorage.getItem("platemate-pilot-v1") ?? "").length * 2) / 1024); } catch { return 0; } };
// DT231 (0.3.70): shown in Settings, Dev data (MenuScreen.tsx), for the admin only
