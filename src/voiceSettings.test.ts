// DT215 v3 (0.3.66): voice settings, kept on the phone
import { test } from "node:test";
import assert from "node:assert/strict";
import { sortVoices, voiceLine, langWords, DEFAULT_VOICE } from "./voiceSettings";
test("DT215: English voices first, then the rest; the Settings line says what is set", () => {
  const vs = [{ uri: "a", name: "Anna", lang: "de-DE" }, { uri: "s", name: "Serena", lang: "en-GB" }, { uri: "d", name: "Daniel", lang: "en-GB" }];
  assert.deepEqual(sortVoices(vs).map((v) => v.name), ["Daniel", "Serena", "Anna"]);
  assert.equal(langWords("en-GB"), "English (UK)");
  assert.equal(voiceLine(true, { voice: "s", speed: "faster", cutIn: false }, vs), "Read aloud · Serena, English (UK) · faster speed · cut in off");
  assert.equal(voiceLine(true, DEFAULT_VOICE, vs), "Read aloud · the phone's voice · normal speed · cut in on");
  assert.equal(voiceLine(false, DEFAULT_VOICE, vs), "Read aloud off · the buttons steer");
});
