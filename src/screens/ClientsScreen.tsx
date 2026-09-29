import { CoachArea } from "./CoachScreen";
import type { AppApi } from "./api";
export function ClientsScreen(p: AppApi) {
  if (p.profile.role !== "coach" || !p.user) return <div className="strip">Clients are for coach accounts.</div>;
  return <CoachArea {...p} />;
}
