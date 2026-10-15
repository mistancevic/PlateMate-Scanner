import { CoachArea } from "./CoachScreen";
import type { AppApi } from "./api";
import { coachDemoOn, demoRows } from "../coachDemo";
export function ClientsScreen(p: AppApi) {
  // without accounts, the example clients (0.2.6); never on the live app
  if (coachDemoOn()) return <CoachArea {...p} demo={demoRows()} />;
  if (p.profile.role !== "coach" || !p.user) return <div className="strip">Clients are for coach accounts.</div>;
  return <CoachArea {...p} />;
}
