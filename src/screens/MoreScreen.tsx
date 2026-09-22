import { Camera, Plus, Utensils, LockKeyhole, Unlock, Trash2, Download, Upload, X, Sparkles, ArrowRight, ScanBarcode, SlidersHorizontal } from "lucide-react";
import { aggregate, candidateFood, category, density, uid } from "../pilot";
import { fmt } from "../ui";
import type { ScannerMode } from "../types";
import type { AppApi } from "./api";

export function MoreScreen(p: AppApi) {
  const { state, services, exportData, importRef, setAccessOpen, setGoalsOpen, pdRef } = p;
  return (
    <div className="more-screen">
      <section className="panel">
        <h2>Daily reference</h2>
        <p>
          {fmt(state.goals.calories, 0)} kcal · {fmt(state.goals.protein)} g protein · PD {fmt(pdRef, 2)}
        </p>
        <p className="small">
          Set by you and your coach. This app does not prescribe targets.
        </p>
        <button className="primary" onClick={() => setGoalsOpen(true)}>
          <SlidersHorizontal size={16} /> Edit reference
        </button>
      </section>
      <section className="panel">
        <h2>Your data</h2>
        <p className="small">
          Everything lives in this browser. Export a backup before changing devices or clearing site data.
        </p>
        <div className="button-row">
          <button className="subtle" onClick={exportData}>
            <Download size={15} /> Export backup
          </button>
          <button className="subtle" onClick={() => importRef.current?.click()}>
            <Upload size={15} /> Import backup
          </button>
        </div>
      </section>
      <section className="panel">
        <h2>Server & services</h2>
        <p className="small">
          AI label reading: {services?.ai ? "configured" : "not connected"}
          <br />
          Airtable sync: {services?.airtable ? "configured" : "not connected"}
        </p>
        <button className="subtle" onClick={() => setAccessOpen(true)}>
          Server access
        </button>
      </section>
      <section className="panel">
        <h2>About this pilot</h2>
        <p className="small">
          PlateMate · Mealan pilot 0.4. Barcode data:{" "}
          <a href="https://world.openfoodfacts.org" target="_blank" rel="noreferrer">
            Open Food Facts
          </a>{" "}
          (community data; verify the package). No medical or meal-completeness claims.
        </p>
      </section>
    </div>
  );
}
