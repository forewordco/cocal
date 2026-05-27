import React, { useState, useEffect, useMemo } from "react";

// ---------------------------------------------------------------------------
// Co-parenting summer calendar
// B = Bobby, A = Allie. Question-mark items render faded with a Resolve action.
// Auto-saves to the artifact persistent store.
// ---------------------------------------------------------------------------

const STORAGE_KEY = "coparenting-summer-2026";

// Seed data transcribed from Bobby's schedule.
// parent: "B" | "A" | "BA" | null    unresolved: boolean (the "?" items)
const SEED = {
  "2026-05-27": { parent: "B", notes: "Desi all-day school (camping theme day). B picks up 3:15.", time: "3:15 PM" },
  "2026-05-28": { parent: "B", notes: "Desi all-day school. Charlie field trip. Walt school picnic. Desi school picnic — B brings potluck dish. Walt soccer game (skip)." },
  "2026-05-29": { parent: "B", notes: "Allie at SPSNL." },
  "2026-05-30": { parent: "B", notes: "B drops at 1pm.", time: "1:00 PM" },
  "2026-05-31": { parent: "A", notes: "" },
  "2026-06-01": { parent: "A", notes: "" },
  "2026-06-02": { parent: "A", notes: "" },
  "2026-06-03": { parent: "A", notes: "Charlie last day of 4th grade — mid-day picnic 12–2. Walter all-lower-elementary carnival 10:30–12:30." },
  "2026-06-04": { parent: "B", notes: "B brings Desi for ECFE. Walt to school. Charles with B. Soccer." },
  "2026-06-05": { parent: "A", notes: "Allie's exam." },
  "2026-06-06": { parent: "B", notes: "Extra day with B before camp." },
  "2026-06-07": { parent: "B", notes: "Birthday. B drops for Du Nord around 10.", time: "10:00 AM" },
  "2026-06-08": { parent: "A", notes: "Du Nord." },
  "2026-06-09": { parent: "A", notes: "Du Nord." },
  "2026-06-10": { parent: "A", notes: "Du Nord." },
  "2026-06-11": { parent: "A", notes: "Du Nord." },
  "2026-06-12": { parent: "A", notes: "Du Nord." },
  "2026-06-13": { parent: "B", notes: "Du Nord. Night with B? Or Ireland?", unresolved: true },
  "2026-06-14": { parent: "B", notes: "B (different days because of camp)." },
  "2026-06-15": { parent: "A", notes: "B drops kids with Allie before work. Swimming lessons start." },
  "2026-06-16": { parent: "A", notes: "" },
  "2026-06-17": { parent: "A", notes: "New trial summer schedule begins." },
  "2026-06-18": { parent: "B", notes: "B picks up at 9am.", time: "9:00 AM" },
  "2026-06-19": { parent: "B", notes: "" },
  "2026-06-20": { parent: "B", notes: "" },
  "2026-06-21": { parent: "B", notes: "Father's Day (B decides when to drop)." },
  "2026-06-22": { parent: "A", notes: "" },
  "2026-06-23": { parent: "A", notes: "" },
  "2026-06-24": { parent: "A", notes: "B picks up after work, before dinner. Allie would theoretically leave for work by 5, but this remains unclear.", unresolved: true },
  "2026-06-25": { parent: "B", notes: "" },
  "2026-06-26": { parent: "B", notes: "" },
  "2026-06-27": { parent: "B", notes: "B drops at 6pm.", time: "6:00 PM" },
  "2026-06-28": { parent: "A", notes: "" },
  "2026-06-29": { parent: "A", notes: "" },
  "2026-06-30": { parent: "BA", notes: "Brother's Day? Leave with Bobby?", unresolved: true },
  "2026-07-01": { parent: "B", notes: "Extra time with Bobby before camp." },
  "2026-07-02": { parent: "B", notes: "Extra time with Bobby before camp." },
  "2026-07-03": { parent: "B", notes: "Extra time with Bobby before camp." },
  "2026-07-04": { parent: "B", notes: "Extra time with Bobby before camp." },
  "2026-07-05": { parent: "B", notes: "B drops morning, start drive to CO.", time: "Morning" },
  "2026-07-06": { parent: "A", notes: "CO." },
  "2026-07-07": { parent: "A", notes: "CO." },
  "2026-07-08": { parent: "A", notes: "CO." },
  "2026-07-09": { parent: "A", notes: "CO." },
  "2026-07-10": { parent: "A", notes: "CO." },
  "2026-07-11": { parent: "A", notes: "CO." },
  "2026-07-12": { parent: "A", notes: "CO." },
  "2026-07-13": { parent: "B", notes: "Drive home from Lincoln. Night with B." },
  "2026-07-14": { parent: "B", notes: "Extra time with B after CO." },
  "2026-07-15": { parent: "B", notes: "Extra time with B after CO." },
  "2026-07-16": { parent: "B", notes: "Extra time with B after CO." },
  "2026-07-17": { parent: "B", notes: "Extra time with B after CO." },
  "2026-07-18": { parent: "A", notes: "B drops at normal time." },
  "2026-07-19": { parent: "A", notes: "" },
  "2026-07-20": { parent: "A", notes: "" },
  "2026-07-21": { parent: "A", notes: "" },
  "2026-07-29": { parent: null, notes: "Des's birthday." },
};

const MONTHS = [
  { year: 2026, month: 4 },  // May
  { year: 2026, month: 5 },  // June
  { year: 2026, month: 6 },  // July
  { year: 2026, month: 7 },  // August
  { year: 2026, month: 8 },  // September
];

const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const DOW = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];

// Range bounds: Memorial Day 2026 (May 25) through Labor Day 2026 (Sep 7).
const RANGE_START = "2026-05-25";
const RANGE_END = "2026-09-07";

function ymd(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function inRange(key) {
  return key >= RANGE_START && key <= RANGE_END;
}

const PARENT_META = {
  B: { label: "Bobby", short: "B" },
  A: { label: "Allie", short: "A" },
  BA: { label: "Both / TBD", short: "B+A" },
};

export default function CoparentingCalendar() {
  const [data, setData] = useState(SEED);
  const [loaded, setLoaded] = useState(false);
  const [editing, setEditing] = useState(null); // date key being edited
  const [draft, setDraft] = useState(null);

  // Load saved state on mount
  useEffect(() => {
    (async () => {
      try {
        const res = await window.storage.get(STORAGE_KEY);
        if (res && res.value) setData(JSON.parse(res.value));
      } catch (e) {
        // no saved state yet — fine, use seed
      } finally {
        setLoaded(true);
      }
    })();
  }, []);

  // Persist whenever data changes (after initial load)
  useEffect(() => {
    if (!loaded) return;
    (async () => {
      try {
        await window.storage.set(STORAGE_KEY, JSON.stringify(data));
      } catch (e) {
        console.error("Save failed", e);
      }
    })();
  }, [data, loaded]);

  const openEditor = (key) => {
    const existing = data[key] || { parent: null, notes: "", time: "" };
    setDraft({
      parent: existing.parent || "",
      time: existing.time || "",
      notes: existing.notes || "",
      unresolved: !!existing.unresolved,
    });
    setEditing(key);
  };

  const closeEditor = () => { setEditing(null); setDraft(null); };

  const saveEditor = () => {
    setData((prev) => {
      const next = { ...prev };
      const cleaned = {
        parent: draft.parent || null,
        notes: draft.notes.trim(),
        time: draft.time.trim(),
      };
      if (draft.unresolved) cleaned.unresolved = true;
      // If everything is empty, remove the entry entirely.
      if (!cleaned.parent && !cleaned.notes && !cleaned.time) {
        delete next[editing];
      } else {
        next[editing] = cleaned;
      }
      return next;
    });
    closeEditor();
  };

  const deleteEntry = () => {
    setData((prev) => {
      const next = { ...prev };
      delete next[editing];
      return next;
    });
    closeEditor();
  };

  const resolveEntry = (key) => {
    setData((prev) => {
      const next = { ...prev };
      if (next[key]) {
        const { unresolved, ...rest } = next[key];
        next[key] = rest;
      }
      return next;
    });
  };

  const resetAll = async () => {
    if (!window.confirm("Reset the whole calendar back to the original schedule? Your edits will be lost.")) return;
    setData(SEED);
    try { await window.storage.set(STORAGE_KEY, JSON.stringify(SEED)); } catch (e) {}
  };

  // Transition (exchange) days: a day whose parent differs from the previous
  // in-range day with a parent. Marks the day the kids arrive at the new house.
  const transitionMap = useMemo(() => {
    const map = {};
    let prevParent = null;
    let cursor = RANGE_START;
    const end = new Date(RANGE_END + "T00:00:00");
    let walker = new Date(RANGE_START + "T00:00:00");
    while (walker <= end) {
      const key = `${walker.getFullYear()}-${String(walker.getMonth() + 1).padStart(2, "0")}-${String(walker.getDate()).padStart(2, "0")}`;
      const entry = data[key];
      const cur = entry?.parent || null;
      if (cur) {
        if (prevParent && prevParent !== cur && !entry?.unresolved) {
          map[key] = { from: prevParent, to: cur };
        }
        prevParent = cur;
      }
      walker.setDate(walker.getDate() + 1);
    }
    return map;
  }, [data]);

  const counts = useMemo(() => {
    let b = 0, a = 0, q = 0;
    Object.entries(data).forEach(([k, v]) => {
      if (!inRange(k)) return;
      if (v.unresolved) q++;
      if (v.parent === "B") b++;
      else if (v.parent === "A") a++;
    });
    return { b, a, q };
  }, [data]);

  const transitionCount = Object.keys(transitionMap).length;

  return (
    <div className="cc-root">
      <style>{CSS}</style>

      <header className="cc-header">
        <div className="cc-title-wrap">
          <h1 className="cc-title">Summer Co-Parenting</h1>
          <p className="cc-subtitle">Memorial Day → Labor Day 2026 · pickups, dropoffs &amp; handoffs</p>
        </div>
        <div className="cc-legend">
          <span className="cc-chip cc-chip-b"><i /> Bobby · {counts.b}</span>
          <span className="cc-chip cc-chip-a"><i /> Allie · {counts.a}</span>
          {transitionCount > 0 && <span className="cc-chip cc-chip-t"><i /> Transition · {transitionCount}</span>}
          {counts.q > 0 && <span className="cc-chip cc-chip-q"><i /> Unresolved · {counts.q}</span>}
          <button className="cc-reset" onClick={resetAll} title="Reset to original schedule">Reset</button>
        </div>
      </header>

      <div className="cc-months">
        {MONTHS.map((m) => (
          <MonthGrid
            key={`${m.year}-${m.month}`}
            year={m.year}
            month={m.month}
            data={data}
            transitionMap={transitionMap}
            onDayClick={openEditor}
            onResolve={resolveEntry}
          />
        ))}
      </div>

      <p className="cc-foot">
        Click any day to edit, add a time, or remove an entry. Days with a gradient are transitions — the kids
        change houses, shown as a blend from one parent's color into the other (e.g. A→B). Faded entries are
        unresolved; open them and hit Resolve once a plan is set. Everything saves automatically in this browser.
      </p>

      {editing && draft && (
        <Editor
          dateKey={editing}
          draft={draft}
          setDraft={setDraft}
          onSave={saveEditor}
          onCancel={closeEditor}
          onDelete={deleteEntry}
          hasEntry={!!data[editing]}
        />
      )}
    </div>
  );
}

function MonthGrid({ year, month, data, transitionMap, onDayClick, onResolve }) {
  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  // Skip a month entirely if no day in it falls in range (shouldn't happen here)
  const anyInRange = Array.from({ length: daysInMonth }, (_, i) => ymd(year, month, i + 1)).some(inRange);
  if (!anyInRange) return null;

  return (
    <section className="cc-month">
      <h2 className="cc-month-name">{MONTH_NAMES[month]} <span>{year}</span></h2>
      <div className="cc-dow">{DOW.map((d) => <span key={d}>{d}</span>)}</div>
      <div className="cc-grid">
        {cells.map((d, idx) => {
          if (d === null) return <div key={idx} className="cc-cell cc-empty" />;
          const key = ymd(year, month, d);
          const active = inRange(key);
          const entry = data[key];
          return (
            <DayCell
              key={key}
              day={d}
              dateKey={key}
              active={active}
              entry={entry}
              transition={transitionMap[key]}
              onClick={() => active && onDayClick(key)}
              onResolve={() => onResolve(key)}
            />
          );
        })}
      </div>
    </section>
  );
}

function DayCell({ day, dateKey, active, entry, transition, onClick, onResolve }) {
  const parent = entry?.parent;
  const unresolved = entry?.unresolved;
  const isTransition = !!transition && !unresolved;
  const cls = [
    "cc-cell",
    active ? "cc-active" : "cc-out",
    parent === "B" ? "cc-b" : parent === "A" ? "cc-a" : parent === "BA" ? "cc-ba" : "cc-none",
    unresolved ? "cc-unresolved" : "",
    isTransition ? "cc-transition" : "",
  ].join(" ");

  // Diagonal blend from the giving parent's tint into the receiving parent's tint.
  const softVar = (p) => p === "B" ? "var(--b-soft)" : p === "A" ? "var(--a-soft)" : "var(--ba-soft)";
  const transStyle = isTransition
    ? { backgroundImage: `linear-gradient(135deg, ${softVar(transition.from)} 0%, ${softVar(transition.from)} 40%, ${softVar(transition.to)} 60%, ${softVar(transition.to)} 100%)` }
    : undefined;

  return (
    <div className={cls} style={transStyle} onClick={onClick} role={active ? "button" : undefined} tabIndex={active ? 0 : undefined}>
      <div className="cc-cell-top">
        <span className="cc-daynum">{day}</span>
        {isTransition
          ? <span className="cc-tag cc-tag-trans">{PARENT_META[transition.from]?.short}→{PARENT_META[transition.to]?.short}</span>
          : parent && <span className="cc-tag">{PARENT_META[parent]?.short}</span>}
      </div>
      {entry?.time && <div className="cc-time">{entry.time}</div>}
      {entry?.notes && <div className="cc-notes">{entry.notes}</div>}
      {unresolved && (
        <button
          className="cc-resolve"
          onClick={(e) => { e.stopPropagation(); onResolve(); }}
        >
          Resolve
        </button>
      )}
    </div>
  );
}

function Editor({ dateKey, draft, setDraft, onSave, onCancel, onDelete, hasEntry }) {
  const dateObj = new Date(dateKey + "T00:00:00");
  const pretty = dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  const set = (patch) => setDraft({ ...draft, ...patch });

  return (
    <div className="cc-modal-backdrop" onClick={onCancel}>
      <div className="cc-modal" onClick={(e) => e.stopPropagation()}>
        <h3 className="cc-modal-title">{pretty}</h3>

        <label className="cc-field-label">Who has the kids?</label>
        <div className="cc-parent-pick">
          {[["", "—"], ["B", "Bobby"], ["A", "Allie"], ["BA", "Both / TBD"]].map(([val, lbl]) => (
            <button
              key={val || "none"}
              className={`cc-pp ${draft.parent === val ? "cc-pp-on" : ""} ${val ? `cc-pp-${val.toLowerCase()}` : ""}`}
              onClick={() => set({ parent: val })}
            >
              {lbl}
            </button>
          ))}
        </div>

        <label className="cc-field-label">Pickup / dropoff time</label>
        <input
          className="cc-input"
          value={draft.time}
          placeholder="e.g. 3:15 PM, Morning, before dinner"
          onChange={(e) => set({ time: e.target.value })}
        />

        <label className="cc-field-label">Notes</label>
        <textarea
          className="cc-textarea"
          value={draft.notes}
          rows={3}
          placeholder="Anything worth remembering for this day…"
          onChange={(e) => set({ notes: e.target.value })}
        />

        <label className="cc-checkrow">
          <input
            type="checkbox"
            checked={draft.unresolved}
            onChange={(e) => set({ unresolved: e.target.checked })}
          />
          Mark as unresolved (faded until a plan is set)
        </label>

        <div className="cc-modal-actions">
          {hasEntry && <button className="cc-btn cc-btn-del" onClick={onDelete}>Delete</button>}
          <div className="cc-modal-actions-right">
            <button className="cc-btn cc-btn-ghost" onClick={onCancel}>Cancel</button>
            <button className="cc-btn cc-btn-save" onClick={onSave}>Save</button>
          </div>
        </div>
      </div>
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,500;9..144,600;9..144,700&family=Newsreader:ital,opsz@0,6..72;1,6..72&display=swap');

.cc-root {
  --b: #3a6b3f;        /* Bobby — forest green */
  --b-soft: #e6efe4;
  --b-line: #bcd4b9;
  --a: #8a6d2f;        /* Allie — olive / amber-clay */
  --a-soft: #f1ead7;
  --a-line: #d8c79a;
  --ba: #715e3c;       /* both — muted bronze */
  --ba-soft: #ece4d5;
  --ink: #2c2a22;
  --muted: #857f70;
  --paper: #f7f4ec;
  --card: #fffdf7;
  --line: #e4ddcd;
  font-family: 'Newsreader', Georgia, serif;
  color: var(--ink);
  background:
    radial-gradient(1200px 600px at 80% -10%, #fff 0%, transparent 60%),
    var(--paper);
  padding: 28px clamp(14px, 4vw, 44px) 64px;
  min-height: 100vh;
  box-sizing: border-box;
}
* { box-sizing: border-box; }

.cc-header {
  display: flex; flex-wrap: wrap; gap: 18px;
  align-items: flex-end; justify-content: space-between;
  border-bottom: 2px solid var(--ink);
  padding-bottom: 18px; margin-bottom: 28px;
}
.cc-title {
  font-family: 'Fraunces', serif; font-weight: 600;
  font-size: clamp(30px, 5vw, 52px); line-height: 0.98;
  margin: 0; letter-spacing: -0.02em;
}
.cc-subtitle { margin: 6px 0 0; color: var(--muted); font-size: 16px; font-style: italic; }

.cc-legend { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
.cc-chip {
  display: inline-flex; align-items: center; gap: 7px;
  font-size: 13.5px; font-family: 'Fraunces', serif; font-weight: 500;
  padding: 6px 12px; border-radius: 999px; border: 1px solid var(--line);
  background: var(--card); white-space: nowrap;
}
.cc-chip i { width: 11px; height: 11px; border-radius: 3px; display: inline-block; }
.cc-chip-b i { background: var(--b); }
.cc-chip-a i { background: var(--a); }
.cc-chip-t i { background: linear-gradient(135deg, var(--a) 0%, var(--a) 45%, var(--b) 55%, var(--b) 100%); }
.cc-chip-q i { background: repeating-linear-gradient(45deg, #b9b2aa, #b9b2aa 2px, #d8d2ca 2px, #d8d2ca 4px); }
.cc-reset {
  margin-left: 4px; border: 1px solid var(--line); background: transparent;
  color: var(--muted); font-family: 'Fraunces', serif; font-size: 13px;
  padding: 6px 12px; border-radius: 999px; cursor: pointer; transition: .15s;
}
.cc-reset:hover { color: var(--ink); border-color: var(--ink); }

.cc-months {
  display: grid; gap: 30px;
  grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
}
.cc-month-name {
  font-family: 'Fraunces', serif; font-weight: 600; font-size: 22px;
  margin: 0 0 10px; letter-spacing: -0.01em;
}
.cc-month-name span { color: var(--muted); font-weight: 500; }

.cc-dow {
  display: grid; grid-template-columns: repeat(7, 1fr);
  font-family: 'Fraunces', serif; font-size: 11px; letter-spacing: .08em;
  text-transform: uppercase; color: var(--muted); margin-bottom: 6px;
}
.cc-dow span { text-align: center; padding: 2px 0; }

.cc-grid {
  display: grid; grid-template-columns: repeat(7, 1fr);
  gap: 5px;
}
.cc-cell {
  position: relative; min-height: 76px; border-radius: 9px;
  border: 1px solid var(--line); background: var(--card);
  padding: 6px 7px; font-size: 11.5px; line-height: 1.28;
  display: flex; flex-direction: column; overflow: hidden;
  transition: transform .12s ease, box-shadow .12s ease;
}
.cc-empty { border: none; background: transparent; min-height: 0; }
.cc-out { opacity: .32; background: transparent; }
.cc-active { cursor: pointer; }
.cc-active:hover { transform: translateY(-2px); box-shadow: 0 6px 16px rgba(60,40,20,.12); }

.cc-cell-top { display: flex; align-items: center; justify-content: space-between; margin-bottom: 3px; }
.cc-daynum { font-family: 'Fraunces', serif; font-weight: 600; font-size: 14px; }
.cc-tag {
  font-family: 'Fraunces', serif; font-weight: 700; font-size: 9.5px;
  padding: 1px 6px; border-radius: 999px; letter-spacing: .03em;
}
.cc-time {
  font-family: 'Fraunces', serif; font-weight: 600; font-size: 11.5px;
  margin-bottom: 2px;
}
.cc-notes { color: var(--ink); opacity: .82; font-size: 10.8px; flex: 1; }

/* Parent color treatments */
.cc-b { background: var(--b-soft); border-color: var(--b-line); }
.cc-b .cc-tag { background: var(--b); color: #fff; }
.cc-b .cc-time { color: var(--b); }
.cc-a { background: var(--a-soft); border-color: var(--a-line); }
.cc-a .cc-tag { background: var(--a); color: #fff; }
.cc-a .cc-time { color: var(--a); }
.cc-ba { background: var(--ba-soft); border-color: #d3c6ad; }
.cc-ba .cc-tag { background: var(--ba); color: #fff; }
.cc-ba .cc-time { color: var(--ba); }
.cc-none { background: var(--card); }

/* Transition (exchange) day: diagonal two-tone via inline background-image.
   A subtle seam line reinforces the split; text forced to ink for contrast. */
.cc-transition {
  border-color: #cdbf9f;
  position: relative;
}
.cc-transition::after {
  content: ""; position: absolute; inset: 0; pointer-events: none;
  background: linear-gradient(135deg, transparent 0%, transparent 48%, rgba(44,42,34,.16) 50%, transparent 52%, transparent 100%);
  border-radius: inherit;
}
.cc-transition .cc-time { color: var(--ink); }
.cc-tag-trans {
  background: var(--ink) !important; color: #fff;
  letter-spacing: .02em;
}

/* Unresolved = desaturated/greyed version */
.cc-unresolved {
  filter: grayscale(0.85) opacity(0.7);
  background: #f3efe9; border-color: #ddd5cb;
  border-style: dashed;
}
.cc-unresolved .cc-tag { background: #9a9089 !important; color: #fff; }
.cc-unresolved .cc-time { color: #6f665f !important; }

.cc-resolve {
  margin-top: 5px; align-self: flex-start;
  font-family: 'Fraunces', serif; font-weight: 600; font-size: 10px;
  letter-spacing: .03em; padding: 3px 9px; border-radius: 999px;
  border: 1px solid #b3a99f; background: #fff; color: #5f574f;
  cursor: pointer; transition: .15s;
}
.cc-resolve:hover { background: #2b2724; color: #fff; border-color: #2b2724; }

.cc-foot {
  margin: 30px auto 0; max-width: 720px; text-align: center;
  color: var(--muted); font-style: italic; font-size: 14px; line-height: 1.5;
}

/* Modal */
.cc-modal-backdrop {
  position: fixed; inset: 0; background: rgba(43,39,36,.42);
  backdrop-filter: blur(3px); display: flex; align-items: center;
  justify-content: center; padding: 20px; z-index: 50;
  animation: ccfade .15s ease;
}
@keyframes ccfade { from { opacity: 0; } to { opacity: 1; } }
.cc-modal {
  background: var(--card); border-radius: 16px; width: min(460px, 100%);
  padding: 26px 26px 22px; box-shadow: 0 24px 60px rgba(40,25,10,.3);
  border: 1px solid var(--line); animation: ccpop .18s ease;
}
@keyframes ccpop { from { transform: translateY(8px) scale(.98); opacity: 0; } to { transform: none; opacity: 1; } }
.cc-modal-title { font-family: 'Fraunces', serif; font-weight: 600; font-size: 24px; margin: 0 0 18px; }
.cc-field-label {
  display: block; font-family: 'Fraunces', serif; font-size: 12px;
  letter-spacing: .05em; text-transform: uppercase; color: var(--muted);
  margin: 14px 0 7px;
}
.cc-parent-pick { display: flex; gap: 7px; flex-wrap: wrap; }
.cc-pp {
  font-family: 'Fraunces', serif; font-size: 14px; padding: 8px 16px;
  border-radius: 9px; border: 1px solid var(--line); background: #fff;
  cursor: pointer; transition: .14s; color: var(--ink);
}
.cc-pp:hover { border-color: var(--ink); }
.cc-pp-on { background: var(--ink); color: #fff; border-color: var(--ink); }
.cc-pp-b.cc-pp-on { background: var(--b); border-color: var(--b); }
.cc-pp-a.cc-pp-on { background: var(--a); border-color: var(--a); }
.cc-pp-ba.cc-pp-on { background: var(--ba); border-color: var(--ba); }

.cc-input, .cc-textarea {
  width: 100%; font-family: 'Newsreader', serif; font-size: 15px;
  padding: 10px 12px; border-radius: 9px; border: 1px solid var(--line);
  background: var(--paper); color: var(--ink); resize: vertical;
}
.cc-input:focus, .cc-textarea:focus { outline: 2px solid var(--b); border-color: var(--b); }

.cc-checkrow {
  display: flex; align-items: center; gap: 9px; margin-top: 16px;
  font-size: 14px; color: var(--ink); cursor: pointer;
}
.cc-checkrow input { width: 16px; height: 16px; accent-color: var(--b); }

.cc-modal-actions {
  display: flex; align-items: center; justify-content: space-between;
  margin-top: 24px; gap: 10px;
}
.cc-modal-actions-right { display: flex; gap: 10px; margin-left: auto; }
.cc-btn {
  font-family: 'Fraunces', serif; font-size: 14px; font-weight: 600;
  padding: 9px 18px; border-radius: 9px; cursor: pointer; border: 1px solid transparent;
  transition: .14s;
}
.cc-btn-ghost { background: transparent; border-color: var(--line); color: var(--muted); }
.cc-btn-ghost:hover { color: var(--ink); border-color: var(--ink); }
.cc-btn-save { background: var(--ink); color: #fff; }
.cc-btn-save:hover { background: #46403a; }
.cc-btn-del { background: transparent; color: var(--a); border-color: var(--a-line); }
.cc-btn-del:hover { background: var(--a); color: #fff; }
`;
