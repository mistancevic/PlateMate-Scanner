// DT188 (0.3.30, board Stories137, Milan 31 October 16:26 Go): Admin, for the superadmin only. Release 1 is a page of doors:
// people and roles are set in the Firebase console as before; the privacy tracker and the walkthroughs page are linked; the
// kitchen screen is a session on a client's Me. Nothing here writes to anyone's account.
import type { AppApi } from "./api";
export function AdminPanel(p: AppApi) {
  const rows: { name: string; what: string; href?: string }[] = [
    { name: "People and roles", what: "Set in the Firebase console: role coach or superadmin on the user's document. Nobody can sign up as a coach.", href: "https://console.firebase.google.com/project/project-fb3c5fab-00d1-4d11-ac7/firestore" },
    { name: "Coach links", what: "A client joins a coach with the coach's code; either side ends it on Me, My coach. The link is on the client's document." },
    { name: "Kitchen sessions", what: "A second phone on the counter is a session of a client's account, started and ended on Me. Not a role." },
    { name: "The privacy tracker", what: "Every finding, what was done, what is open.", href: "https://claude.ai/artifact/BsHzpZSNwMWhtRWFjmpB3Y" },
    { name: "The walkthroughs", what: "Every walkthrough of the last run, with its checks.", href: "https://claude.ai/artifact/BmXrQ4R7uP9yt6C6RS7864" },
  ];
  return (
    <>
      <p className="small muted page-why">Superadmin: everything a coach has, and these doors. Signed in as {p.user?.name ?? "you"}.</p>
      <div className="menu-list">
        {rows.map((r) => r.href
          ? <a key={r.name} className="menu-row" href={r.href} target="_blank" rel="noreferrer"><span className="menu-row-text"><b>{r.name}</b><small>{r.what}</small></span><span aria-hidden="true">›</span></a>
          : <div key={r.name} className="menu-row" style={{ cursor: "default" }}><span className="menu-row-text"><b>{r.name}</b><small>{r.what}</small></span></div>)}
      </div>
    </>
  );
}
