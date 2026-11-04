import { CoachArea } from "./CoachScreen";
import { w } from "../words";
import type { AppApi } from "./api";
import { coachDemoOn, demoRows } from "../coachDemo";
export function ClientsScreen(p: AppApi) {
  // without accounts, the example clients (0.2.6); never on the live app
  if (coachDemoOn()) return <CoachArea {...p} demo={demoRows()} />;
  if (p.profile.role !== "coach" || !p.user) return <div className="strip">{w("clients.clientsAreForCoachAccounts")}</div>;
  return <CoachArea {...p} />;
}
