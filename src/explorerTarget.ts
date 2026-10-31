// DT188 (0.3.30): a page elsewhere can send the person to one Explorer page (a coach's suggestion accepted on Today). The
// target is kept until Explorer mounts and takes it.
export type ExplorerTarget = { part: "nutrients" | "body" | "situations"; id?: string; member?: string };
let target: ExplorerTarget | null = null;
export const setExplorerTarget = (t: ExplorerTarget | null) => { target = t; };
export const takeExplorerTarget = () => { const t = target; target = null; return t; };
