// DT327 AC8 (Coach Milan 19 November 15:34): the note under the home page videos names the version they were recorded on.
// scripts/record-home-clips.cjs writes public/landing/clips.json when it writes the twelve clips, from the app that ran,
// so the page can never name a version the videos were not made on.
import clips from "../public/landing/clips.json" with { type: "json" };
export const CLIPS_VERSION: string = clips.version;
