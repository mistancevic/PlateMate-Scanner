import test from "node:test";
import assert from "node:assert/strict";
import { calendarEvents, eventId, at, syncCalendar, kindOn, type CalInput, type Fetch } from "./gcal";
import type { PlanDay } from "./plan";

const slots = [{ id: "s1", name: "Breakfast", time: "06:30" }, { id: "s2", name: "Lunch", time: "13:15" }, { id: "s3", name: "Dinner", time: "20:00" }];
const strength: PlanDay = { work: true, kind: "strength" as any, intensity: "hard" as any, at: "17:30", minutes: 60 };
const base = (over: Partial<CalInput> = {}): CalInput => ({
  days: ["2026-11-02", "2026-11-03"], slotsOf: () => slots, trainingOf: (d) => (d === "2026-11-02" ? strength : null),
  planned: { "2026-11-02": { s3: { title: "Chicken rice bowl", kcal: 600, protein: 50, source: "mine", mealId: "m1" }, s2: { title: "Canteen", kcal: 500, protein: 30, source: "plate", skipped: true } } } as any,
  cooked: (id) => id === "m1", settings: { on: true }, weigh: true, checkIn: { date: "2026-11-03", name: "Check-in with Coach Milan" },
  shopping: [{ n: 1, at: "2026-11-03T10:00" }], origin: "https://chefmealan.com", timeZone: "Europe/Berlin", ...over,
});

test("DT178: meals, cooking, training and shopping go in; weigh in and check-in wait to be turned on", () => {
  const ev = calendarEvents(base());
  const names = ev.map((e) => `${e.start.dateTime ?? e.start.date} ${e.summary}`);
  assert.ok(names.includes("2026-11-02T06:30:00 Breakfast"));
  assert.ok(names.includes("2026-11-02T20:00:00 Dinner · Chicken rice bowl"));
  assert.ok(names.includes("2026-11-02T19:30:00 Cook dinner · Chicken rice bowl"));
  assert.ok(names.some((n) => n.startsWith("2026-11-02T17:30:00 ")), "training at its time");
  assert.ok(names.includes("2026-11-03T10:00:00 Shopping list 1"));
  assert.ok(!names.some((n) => /Weigh in|Check-in/.test(n)));
  // a meal skipped on purpose is not in the calendar
  assert.ok(!names.some((n) => n.startsWith("2026-11-02T13:15")));
  assert.equal(kindOn({ on: true }, "weigh"), false);
});

test("DT178: an event says the name, the time and a link; never a number", () => {
  for (const e of calendarEvents(base({ settings: { on: true, kinds: { weigh: true, checkin: true } } }))) {
    assert.match(e.description, /^Open in Chef Mealan: https:\/\/chefmealan\.com\/plan\?day=\d{4}-\d{2}-\d{2}$/);
    assert.doesNotMatch(`${e.summary} ${e.description}`, /kcal|protein|\bg\b|PD/i);
  }
});

test("DT178: Weigh in and Check-in when turned on; the dish's name can be left out", () => {
  const ev = calendarEvents(base({ settings: { on: true, kinds: { weigh: true, checkin: true }, dish: false } }));
  const names = ev.map((e) => `${e.start.dateTime ?? e.start.date} ${e.summary}`);
  assert.ok(names.includes("2026-11-02T06:15:00 Weigh in"));
  assert.ok(names.includes("2026-11-03 Check-in with Coach Milan"));
  assert.ok(names.includes("2026-11-02T20:00:00 Dinner"));
  assert.ok(names.includes("2026-11-02T19:30:00 Cook dinner"));
});

test("DT178: no cooking in a hotel with no kitchen; times past midnight roll to the next date", () => {
  assert.ok(!calendarEvents(base({ noKitchen: () => true })).some((e) => e.summary.startsWith("Cook")));
  assert.equal(at("2026-11-02", 23 * 60 + 50 + 30), "2026-11-03T00:20:00");
  assert.equal(at("2026-11-02", -15), "2026-11-01T23:45:00");
});

test("DT178: event ids are Google's letters, the same for the same meal and date", () => {
  const a = eventId("2026-11-02|meal|s1"), b = eventId("2026-11-02|meal|s1"), c = eventId("2026-11-03|meal|s1");
  assert.equal(a, b); assert.notEqual(a, c);
  assert.match(a, /^[a-v0-9]{5,1024}$/);
});

// a Google Calendar in memory, enough for the sync
function fakeGoogle() {
  const cals = new Map<string, Map<string, any>>(); let n = 0; const calls: string[] = [];
  const f: Fetch = async (url, init) => {
    const u = new URL(url), m = (init?.method || "GET"), body = init?.body ? JSON.parse(String(init.body)) : null;
    calls.push(`${m} ${u.pathname}`);
    const json = (s: number, j: unknown) => new Response(s === 204 ? null : JSON.stringify(j), { status: s });
    if (m === "POST" && u.pathname.endsWith("/calendars")) { const id = `cal${++n}@group.calendar.google.com`; cals.set(id, new Map()); return json(200, { id }); }
    const parts = u.pathname.split("/").map(decodeURIComponent), cid = parts[4], cal = cals.get(cid);
    if (!cal) return json(404, { error: { message: "Not Found" } });
    if (m === "DELETE" && parts.length === 5) { cals.delete(cid); return json(204, null); }
    const eid = parts[6];
    if (m === "GET") return json(200, { items: [...cal.values()].filter((e) => e.status !== "cancelled") });
    if (m === "POST") { if (cal.has(body.id)) return json(409, { error: { message: "The requested identifier already exists." } }); cal.set(body.id, body); return json(200, body); }
    if (m === "PUT") { cal.set(eid, body); return json(200, body); }
    if (m === "DELETE") { const e = cal.get(eid); if (!e) return json(404, {}); e.status = "cancelled"; return json(204, null); }
    return json(400, {});
  };
  return { f, cals, calls };
}

test("DT178: the first sync makes the calendar and puts the events in; a second one with nothing changed sends nothing", async () => {
  const g = fakeGoogle(), ev = calendarEvents(base());
  const r = await syncCalendar(g.f, "t", undefined, ev, "2026-11-02", "2026-11-03", "Europe/Berlin");
  assert.equal(r.created, true); assert.equal(r.made, ev.length);
  g.calls.length = 0;
  const r2 = await syncCalendar(g.f, "t", r.id, ev, "2026-11-02", "2026-11-03", "Europe/Berlin");
  assert.deepEqual([r2.made, r2.changed, r2.removed], [0, 0, 0]);
  assert.deepEqual(g.calls, [`GET /calendar/v3/calendars/${encodeURIComponent(r.id)}/events`]);
});

test("DT178: a moved lunch is updated, an emptied meal taken out, an event added by hand stays", async () => {
  const g = fakeGoogle();
  const r = await syncCalendar(g.f, "t", undefined, calendarEvents(base()), "2026-11-02", "2026-11-03", "Europe/Berlin");
  g.cals.get(r.id)!.set("mine1", { id: "mine1", summary: "Dentist" });
  const moved = calendarEvents(base({ slotsOf: () => [slots[0], { ...slots[1], time: "12:30" }, slots[2]], planned: {} as any }));
  const r2 = await syncCalendar(g.f, "t", r.id, moved, "2026-11-02", "2026-11-03", "Europe/Berlin");
  assert.ok(r2.changed >= 1, "lunch moved");
  assert.ok(r2.removed >= 1, "cooking gone with the emptied dinner");
  assert.ok(g.cals.get(r.id)!.has("mine1"));
  const lunch = g.cals.get(r.id)!.get(eventId("2026-11-03|meal|s2"));
  assert.equal(lunch.start.dateTime, "2026-11-03T12:30:00");
  // the dinner comes back: its old id is taken, so it is brought back, not refused
  const r3 = await syncCalendar(g.f, "t", r.id, calendarEvents(base()), "2026-11-02", "2026-11-03", "Europe/Berlin");
  assert.ok(r3.made >= 1);
  assert.equal(g.cals.get(r.id)!.get(eventId("2026-11-02|cook|s3")).status, "confirmed");
});

test("DT178: a calendar removed in Google is made again", async () => {
  const g = fakeGoogle();
  const r = await syncCalendar(g.f, "t", undefined, calendarEvents(base()), "2026-11-02", "2026-11-03", "Europe/Berlin");
  g.cals.delete(r.id);
  const r2 = await syncCalendar(g.f, "t", r.id, calendarEvents(base()), "2026-11-02", "2026-11-03", "Europe/Berlin");
  assert.equal(r2.created, true); assert.notEqual(r2.id, r.id);
});
