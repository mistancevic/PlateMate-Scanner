// Coach Milan, 1 November 12:49: the public pages say the app's version at the bottom, so it shows when signed out too
export const VERSION = String(import.meta.env.VITE_VERSION ?? "") || "0";
export const VERSION_LINE = `Version ${VERSION}`;
