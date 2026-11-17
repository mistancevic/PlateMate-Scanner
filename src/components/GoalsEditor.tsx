// Your daily reference: the numbers of the day, edited in a dialog.
// 0.3.156: moved out of App.tsx as it was.
import { Goals, KEYS, density, numberInput } from "../pilot";
import { fmt } from "../ui";
import { useState } from "react";
import { w } from "../words";
import { Modal } from "./Modal";
import { inputValue, NUTRIENT_WORD } from "./nutrientFields";

export function GoalsEditor({
  goals,
  close,
  save,
}: {
  goals: Goals;
  close: () => void;
  save: (g: Goals) => void;
}) {
  const [values, setValues] = useState(
    Object.fromEntries(KEYS.map((k) => [k, inputValue(goals[k])])) as Record<
      string,
      string
    >,
  );
  const [error, setError] = useState("");
  return (
    <Modal title={w("app.yourDailyReference")} close={close}>
      <p>
        {w("app.goalsEditorWhy")}
      </p>
      <div className="form-grid">
        {KEYS.map((k) => (
          <label key={k}>
            {w(NUTRIENT_WORD[k])} ({k === "calories" ? "kcal" : "g"})
            <input
              inputMode="decimal"
              value={values[k]}
              placeholder={w("app.notSet")}
              onChange={(e) => setValues({ ...values, [k]: e.target.value })}
            />
          </label>
        ))}
      </div>
      <p className="small">
        {w("app.referencePd", { pd: fmt(density(numberInput(values.protein), numberInput(values.calories)), 2) })}
      </p>
      {error && <p className="notice">{error}</p>}
      <button
        className="primary wide"
        onClick={() => {
          if (
            KEYS.some(
              (k) =>
                values[k].trim() !== "" &&
                (numberInput(values[k]) === null ||
                  numberInput(values[k]) === 0),
            )
          ) {
            setError(w("app.positiveTargets"));
            return;
          }
          save(
            Object.fromEntries(
              KEYS.map((k) => [k, numberInput(values[k])]),
            ) as Goals,
          );
        }}
      >
        {w("app.saveDailyReference")}
      </button>
    </Modal>
  );
}
