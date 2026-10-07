import { ZONES, type Intensity } from "../plan";

// the zones of one kind of training: how each feels and what usually falls in it
export function Zones({ level, walkNote = false }: { level: Intensity; walkNote?: boolean }) {
  return <>{ZONES[level].map((z) => <span className="zone" key={z.zone}><small><b>{z.zone}</b> · {z.feel}</small><small className="zone-ex">{z.examples}{walkNote ? ". Walking goes in steps." : ""}</small></span>)}</>;
}
