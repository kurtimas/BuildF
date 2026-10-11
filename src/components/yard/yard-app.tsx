import { useEffect, useRef, useState, type CSSProperties, type FormEvent, type PointerEvent as ReactPointerEvent } from "react";
import {
  Download,
  GripVertical,
  Minus,
  Plus,
  Redo2,
  RotateCcw,
  Search,
  Sun,
  Moon,
  Undo2,
  Upload,
  X,
} from "lucide-react";
import { cn } from "@/lib/cn";
import {
  maxHeight,
  PRODUCTS,
  createStack,
  findStack,
  kindName,
  markColor,
  markStyle,
  productName,
  railColor,
  sanitizeLayout,
  stackLabel,
  stackMatches,
  tally,
  type Bay,
  type FilterId,
  type Layer,
  type ProductId,
  type Stack,
  type StackKind,
} from "@/lib/yard/data";
import { useYard } from "@/lib/yard/use-yard";
import { loadPublishedFloor, savePublishedFloor } from "@/lib/yard/publish";

type Over = { bayId: string; index: number; x?: number; y?: number };

export function YardApp() {
  const yard = useYard();
  const { bays } = yard;
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<FilterId>("all");
  const [carrying, setCarrying] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [status, setStatus] = useState("");
  const [live, setLive] = useState("");
  const [publishOpen, setPublishOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [publishing, setPublishing] = useState(false);
  const [sharedAt, setSharedAt] = useState<string | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [ghost, setGhost] = useState<{ id: string; x: number; y: number } | null>(null);
  const [over, setOver] = useState<Over | null>(null);
  const [snapCol, setSnapCol] = useState<string | null>(null);
  const drag = useRef<{ id: string; pid: number; x: number; y: number; active: boolean } | null>(null);
  const overRef = useRef<Over | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const loadedShared = useRef(false);
  const counts = tally(bays);
  const selected = selectedId ? findStack(bays, selectedId) : null;
  const ghostStack = ghost ? findStack(bays, ghost.id)?.stack : null;

  useEffect(() => {
    if (selectedId && !findStack(bays, selectedId)) setSelectedId(null);
  }, [bays, selectedId]);

  useEffect(() => {
    if (!status) return;
    const timer = window.setTimeout(() => setStatus(""), 4500);
    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    if (!yard.ready || loadedShared.current) return;
    loadedShared.current = true;
    loadPublishedFloor()
      .then((result) => {
        setHasPassword(result.hasPassword);
        if (!result.layout) return;
        setSharedAt(result.updatedAt);
        if (localStorage.getItem("yard-floor-dirty") === "1") return;
        let next = null;
        try {
          next = sanitizeLayout(JSON.parse(result.layout) as unknown);
        } catch {
          next = null;
        }
        if (next) yard.adopt(next);
      })
      .catch(() => {
        loadedShared.current = false;
      });
  }, [yard.ready, yard.adopt]);

  async function publishFloor(event: FormEvent) {
    event.preventDefault();
    setPublishing(true);
    try {
      const result = await savePublishedFloor({
        data: { password, layout: JSON.stringify({ version: 1, bays }) },
      });
      if (!result.ok) {
        setStatus(result.error);
        return;
      }
      yard.markSaved();
      setHasPassword(true);
      setSharedAt(result.updatedAt);
      setPassword("");
      setPublishOpen(false);
      setStatus("Saved to the server. Anyone who opens the floor gets this layout.");
    } catch {
      setStatus("Could not reach the server. The change is still saved in this browser.");
    } finally {
      setPublishing(false);
    }
  }

  async function loadShared() {
    try {
      const result = await loadPublishedFloor();
      let next = null;
      try {
        next = result.layout ? sanitizeLayout(JSON.parse(result.layout) as unknown) : null;
      } catch {
        next = null;
      }
      if (!next) {
        setStatus("Nothing has been saved to the server yet.");
        return;
      }
      yard.adopt(next);
      setSharedAt(result.updatedAt);
      setHasPassword(result.hasPassword);
      setSelectedId(null);
      setCarrying(false);
      setStatus("Loaded the shared floor.");
    } catch {
      setStatus("Could not load the shared floor.");
    }
  }

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const target = event.target as HTMLElement | null;
      const typing = target && ["INPUT", "TEXTAREA", "SELECT"].includes(target.tagName);
      if (event.key === "Escape") {
        setCarrying(false);
        setGhost(null);
        setOver(null);
        setSnapCol(null);
        overRef.current = null;
        drag.current = null;
        return;
      }
      if (typing) return;
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "z") {
        event.preventDefault();
        if (event.shiftKey) yard.redo();
        else yard.undo();
      } else if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "y") {
        event.preventDefault();
        yard.redo();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [yard]);

  function rememberOver(next: Over | null) {
    overRef.current = next;
    setOver(next);
  }

  function drop(stackId: string, bayId: string, index: number, at?: { x: number; y: number }) {
    const hit = findStack(bays, stackId);
    const target = bays.find((bay) => bay.id === bayId);
    if (!hit || !target) return;
    if (target.zone === "lane" && at) {
      const parked = yard.parkInLaneAt(stackId, at.x, at.y);
      if (!parked) return;
      setLive(`Parked ${stackLabel(hit.stack)} in the forklift lane.`);
      setSelectedId(stackId);
      setCarrying(false);
      return;
    }
    const displaced = target.slots[index];
    const moved = yard.moveStack(stackId, bayId, index);
    if (!moved) return;
    const name = stackLabel(hit.stack);
    if (displaced && displaced.id !== stackId) {
      setLive(`Swapped ${name} with ${stackLabel(displaced)} in ${target.title}, cell ${index + 1}.`);
    } else {
      setLive(`Moved ${name} to ${target.title}, cell ${index + 1}.`);
    }
    setSelectedId(stackId);
    setCarrying(false);
  }

  function onPointerDown(event: ReactPointerEvent<HTMLButtonElement>, id: string) {
    if (event.button !== 0) return;
    drag.current = { id, pid: event.pointerId, x: event.clientX, y: event.clientY, active: false };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function snapTarget(x: number, y: number) {
    const columns = [...document.querySelectorAll<HTMLElement>("[data-col]")];
    let column: HTMLElement | null = null;
    let bestCol = Infinity;
    for (const el of columns) {
      const rect = el.getBoundingClientRect();
      const dx = x < rect.left ? rect.left - x : x > rect.right ? x - rect.right : 0;
      const dy = y < rect.top ? rect.top - y : y > rect.bottom ? y - rect.bottom : 0;
      const dist = Math.hypot(dx, dy);
      if (dist < bestCol) {
        bestCol = dist;
        column = el;
      }
    }
    if (!column || bestCol > 56) return null;
    if (column.dataset.col === "lane") {
      const floor = column.querySelector<HTMLElement>(".lane-floor") ?? column;
      const rect = floor.getBoundingClientRect();
      if (rect.width < 1 || rect.height < 1) return null;
      const xPct = ((x - rect.left) / rect.width) * 100;
      const yPct = ((y - rect.top) / rect.height) * 100;
      if (xPct < -8 || xPct > 108 || yPct < -8 || yPct > 108) return null;
      return {
        col: "lane",
        over: {
          bayId: "lane",
          index: -1,
          x: Math.min(96, Math.max(4, xPct)),
          y: Math.min(96, Math.max(4, yPct)),
        } satisfies Over,
        x,
        y,
      };
    }
    const rows = [...column.querySelectorAll<HTMLElement>("[data-row]")];
    let best: { el: HTMLElement; dist: number } | null = null;
    for (const el of rows) {
      const band = el.querySelector(".sheet-stacks") ?? el;
      const rect = band.getBoundingClientRect();
      const mid = rect.top + rect.height / 2;
      const dist = Math.abs(y - mid);
      if (!best || dist < best.dist) best = { el, dist };
    }
    if (!best) return null;
    const slots = [...best.el.querySelectorAll<HTMLElement>("[data-slot]")];
    let slot: HTMLElement | null = null;
    let bestDx = Infinity;
    for (const candidate of slots) {
      const rect = candidate.getBoundingClientRect();
      const dx = Math.abs(x - (rect.left + rect.width / 2));
      if (dx < bestDx) {
        bestDx = dx;
        slot = candidate;
      }
    }
    if (!slot?.dataset.bay || slot.dataset.index == null) return null;
    const band = best.el.querySelector(".sheet-stacks") ?? slot;
    const bandRect = band.getBoundingClientRect();
    const slotRect = slot.getBoundingClientRect();
    return {
      col: column.dataset.col ?? null,
      over: { bayId: slot.dataset.bay, index: Number(slot.dataset.index) } satisfies Over,
      x: slotRect.left + slotRect.width / 2,
      y: bandRect.top + bandRect.height / 2,
    };
  }

  function onPointerMove(event: ReactPointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || event.pointerId !== current.pid) return;
    const distance = Math.hypot(event.clientX - current.x, event.clientY - current.y);
    if (!current.active && distance < 8) return;
    current.active = true;
    const snap = snapTarget(event.clientX, event.clientY);
    setGhost({ id: current.id, x: snap?.x ?? event.clientX, y: snap?.y ?? event.clientY });
    rememberOver(snap?.over ?? null);
    setSnapCol(snap?.col ?? null);
  }

  function clearDrag() {
    drag.current = null;
    setGhost(null);
    rememberOver(null);
    setSnapCol(null);
  }

  function onPointerUp(event: ReactPointerEvent<HTMLButtonElement>, slot: Over) {
    const current = drag.current;
    if (!current || event.pointerId !== current.pid) return;
    const wasDrag = current.active;
    const target = overRef.current;
    clearDrag();
    if (wasDrag) {
      if (target) drop(current.id, target.bayId, target.index, target.x != null && target.y != null ? { x: target.x, y: target.y } : undefined);
      return;
    }
    if (carrying && selectedId) {
      if (selectedId !== current.id) drop(selectedId, slot.bayId, slot.index);
      return;
    }
    setSelectedId((prev) => (prev === current.id ? null : current.id));
  }

  function onPointerCancel(event: ReactPointerEvent<HTMLButtonElement>) {
    const current = drag.current;
    if (!current || event.pointerId !== current.pid) return;
    clearDrag();
  }

  function sendSelected(bayId: string) {
    if (!selected) return;
    const name = stackLabel(selected.stack);
    const target = bays.find((bay) => bay.id === bayId);
    const ok = yard.sendToBay(selected.stack.id, bayId);
    if (!ok) {
      setStatus(target ? `${target.title} is full.` : "That aisle is not on the floor.");
      return;
    }
    setLive(`Moved ${name} to ${target?.title ?? "another aisle"}.`);
    setCarrying(false);
    document.getElementById(`bay-${bayId}`)?.scrollIntoView({ block: "nearest" });
  }

  function exportLayout() {
    const blob = new Blob([JSON.stringify({ version: 1, bays }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "yard-floor.json";
    link.click();
    URL.revokeObjectURL(url);
    setStatus("Downloaded this floor as yard-floor.json.");
  }

  function importLayout(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = sanitizeLayout(JSON.parse(String(reader.result)) as unknown);
        if (!parsed) {
          setStatus("That file is not a yard floor layout.");
          return;
        }
        yard.replaceAll(parsed);
        setSelectedId(null);
        setCarrying(false);
        setStatus("Loaded the layout from file.");
      } catch {
        setStatus("Could not read that file.");
      }
    };
    reader.readAsText(file);
  }

  function extraTools() {
    return (
      <>
        {confirmReset ? null : (
          <button type="button" className="btn btn-quiet" onClick={() => setConfirmReset(true)}>
            <RotateCcw className="size-4" aria-hidden />
            Reset
          </button>
        )}
        <button type="button" className="btn btn-quiet" onClick={exportLayout}>
          <Download className="size-4" aria-hidden />
          Export
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => fileRef.current?.click()}>
          <Upload className="size-4" aria-hidden />
          Import
        </button>
        <button type="button" className="btn btn-quiet" onClick={() => window.print()}>
          Print
        </button>
        <button type="button" className="btn btn-primary" onClick={() => setPublishOpen((open) => !open)}>
          Save to server
        </button>
        <button type="button" className="btn btn-quiet" onClick={loadShared} disabled={!sharedAt}>
          Load shared
        </button>
      </>
    );
  }

  const anyMatch = bays.some((bay) =>
    bay.slots.some((slot) => slot && stackMatches(slot, bay, filter, query)),
  );

  return (
    <main className="min-h-screen bg-paper text-ink">
      <div className={cn("mx-auto max-w-7xl px-4 py-3 pb-28 sm:px-6 sm:py-5", selected && "max-lg:pb-64")}>
        <header className="mb-3 flex flex-col gap-3 border-b border-line pb-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-end gap-4">
              <img
                src="/iemc-logo.png"
                alt="IEMC"
                className="h-12 w-auto shrink-0 sm:h-16 lg:h-20"
              />
              <h1 className="pb-1 font-display text-3xl leading-none tracking-tight text-ink sm:pb-1.5 sm:text-4xl">
                Building F
              </h1>
            </div>
            <div className="flex flex-col items-start gap-2 lg:items-end">
              <p className="font-mono text-sm tabular-nums text-ink">
                {counts.units} <span className="text-muted">units</span>
                <span className="text-muted"> · </span>
                {counts.stacks} <span className="text-muted">stacks</span>
              </p>
              <div className="no-print flex flex-wrap gap-2">
                <ThemeSwitch />
                <button type="button" className="btn btn-quiet" aria-label="Undo" disabled={!yard.canUndo} onClick={yard.undo}>
                  <Undo2 className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Undo</span>
                </button>
                <button type="button" className="btn btn-quiet" aria-label="Redo" disabled={!yard.canRedo} onClick={yard.redo}>
                  <Redo2 className="size-4" aria-hidden />
                  <span className="hidden sm:inline">Redo</span>
                </button>
                {confirmReset ? (
                  <>
                    <button
                      type="button"
                      className="btn btn-danger"
                      onClick={() => {
                        yard.reset();
                        setSelectedId(null);
                        setCarrying(false);
                        setConfirmReset(false);
                        setStatus("Restored the survey layout.");
                      }}
                    >
                      Restore survey
                    </button>
                    <button type="button" className="btn btn-quiet" onClick={() => setConfirmReset(false)}>
                      Cancel
                    </button>
                  </>
                ) : null}
                <div className="hidden max-w-xl flex-wrap justify-end gap-2 lg:flex">{extraTools()}</div>
                <details className="tool-more lg:hidden">
                  <summary className="btn btn-quiet">More</summary>
                  <div className="tool-more-panel">{extraTools()}</div>
                </details>
                <input
                  ref={fileRef}
                  className="sr-only"
                  type="file"
                  accept="application/json,.json"
                  aria-label="Import layout file"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    event.target.value = "";
                    if (file) importLayout(file);
                  }}
                />
              </div>
            </div>
          </div>
          {publishOpen ? (
            <form className="no-print flex flex-wrap items-end gap-2" onSubmit={publishFloor}>
              <label className="block min-w-52 text-xs font-semibold text-ink-soft">
                {hasPassword ? "Floor password" : "Choose a floor password"}
                <input
                  className="field mt-1"
                  type="password"
                  name="floor-password"
                  value={password}
                  autoComplete="current-password"
                  onChange={(event) => setPassword(event.target.value)}
                />
              </label>
              <button type="submit" className="btn btn-primary" disabled={publishing || password.trim().length < 4}>
                {publishing ? "Saving…" : "Save to server"}
              </button>
              <button
                type="button"
                className="btn btn-quiet"
                onClick={() => {
                  setPublishOpen(false);
                  setPassword("");
                }}
              >
                Cancel
              </button>
            </form>
          ) : null}
          <div className="no-print flex flex-col gap-3">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" aria-hidden />
              <input
                className="field pr-10 pl-9"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search product, aisle, or note"
                aria-label="Search the floor"
              />
              {query ? (
                <button
                  type="button"
                  className="absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center text-muted"
                  aria-label="Clear search"
                  onClick={() => setQuery("")}
                >
                  <X className="size-4" aria-hidden />
                </button>
              ) : null}
            </div>
            <div className="filter-row flex flex-wrap gap-2" role="group" aria-label="Filter by product">
              <FilterChip
                pressed={filter === "all"}
                label="All"
                count={counts.units}
                onClick={() => setFilter("all")}
              />
              {PRODUCTS.map((product) => (
                <FilterChip
                  key={product.id}
                  pressed={filter === product.id}
                  label={product.name}
                  count={counts.by.get(product.id) ?? 0}
                  swatch={`var(--color-swatch-${product.id})`}
                  onClick={() => setFilter((prev) => (prev === product.id ? "all" : product.id))}
                />
              ))}
              <FilterChip
                pressed={filter === "unknown"}
                label="Unknown"
                count={counts.by.get("unknown") ?? 0}
                swatch="var(--color-swatch-mixed)"
                onClick={() => setFilter((prev) => (prev === "unknown" ? "all" : "unknown"))}
              />
            </div>
          </div>
          {status ? <p className="text-sm text-ink-soft">{status}</p> : null}
          <p className="no-print text-xs text-muted">
            {yard.unpublished
              ? "These edits are only in this browser. Save to the server with the password when you want everyone else to see them."
              : "Edits stay in this browser until you save them to the server with the password."}
          </p>
        </header>

        {carrying && selected ? (
          <div className="no-print mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-sheet px-3 py-2">
            <p className="text-sm text-ink">
              Tap a cell to drop {stackLabel(selected.stack)}. A filled cell swaps.
            </p>
            <button type="button" className="btn btn-quiet" onClick={() => setCarrying(false)}>
              Cancel
            </button>
          </div>
        ) : null}

        {selected ? (
          <div className="mobile-carry no-print mb-4 rounded-lg border border-line bg-sheet p-3 lg:hidden">
            <p className="truncate text-sm font-semibold">{stackLabel(selected.stack)}</p>
            <p className="text-xs text-muted">
              {selected.bay.title} · cell {selected.index + 1} · {kindName(selected.stack.kind)}
            </p>
            <label className="mt-3 block text-xs font-semibold text-ink-soft" htmlFor="mobile-aisle">
              Send to aisle
            </label>
            <select
              id="mobile-aisle"
              className="field mt-1"
              value={selected.bay.id}
              onChange={(event) => sendSelected(event.target.value)}
            >
              {bays.map((bay) => (
                <option key={bay.id} value={bay.id}>
                  {bay.zone === "lane" ? "Forklift lane" : `Row ${bay.code}`}
                </option>
              ))}
            </select>
            <div className="mt-2 flex gap-2">
              <button type="button" className="btn btn-primary flex-1" onClick={() => setCarrying(true)}>
                Place on grid
              </button>
              <button
                type="button"
                className="btn btn-quiet flex-1"
                onClick={() => document.getElementById("stack-editor")?.scrollIntoView({ block: "start" })}
              >
                Edit
              </button>
            </div>
          </div>
        ) : null}

        {!anyMatch ? (
          <p className="mb-4 text-sm text-muted">Nothing on the floor matches that filter.</p>
        ) : null}

        <nav className="floor-jumps no-print" aria-label="Jump to a side of the floor">
          <a href="#rows-west">Rows 1–8</a>
          <a href="#forklift-lane">Lane</a>
          <a href="#rows-east">Rows 9–21</a>
        </nav>

        <div className="shell">
          <div className={cn("sheet select-none", ghost && "cursor-grabbing")}>
            <FloorLegend />
            <section id="rows-west" data-col="west" className={cn("sheet-col", snapCol === "west" && "is-snap-col")} aria-label="Rows 1 to 8">
              <h2 className="sheet-col-title">Rows 1–8</h2>
              {bays
                .filter((bay) => bay.zone === "west")
                .map((bay) => (
                  <BayRow
                    key={bay.id}
                    bay={bay}
                    edge="start"
                    filter={filter}
                    query={query}
                    selectedId={selectedId}
                    carrying={carrying}
                    draggingId={ghost?.id ?? null}
                    over={over}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerCancel}
                    onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
                    onEmptyClick={(index) => {
                      if (carrying && selectedId) drop(selectedId, bay.id, index);
                    }}
                    onGrow={() => {
                      const ok = yard.growBay(bay.id);
                      if (!ok) setStatus("This row cannot take another cell.");
                    }}
                    onNote={(detail) =>
                      yard.patchBay(bay.id, (current) => ({ ...current, detail: detail.trim() || undefined }))
                    }
                  />
                ))}
              {bays
                .filter((bay) => bay.zone === "treater")
                .map((bay) => (
                  <BayRow
                    key={bay.id}
                    bay={bay}
                    edge="start"
                    tall
                    filter={filter}
                    query={query}
                    selectedId={selectedId}
                    carrying={carrying}
                    draggingId={ghost?.id ?? null}
                    over={over}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerCancel}
                    onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
                    onEmptyClick={(index) => {
                      if (carrying && selectedId) drop(selectedId, bay.id, index);
                    }}
                    onGrow={() => yard.growBay(bay.id)}
                    onNote={(detail) =>
                      yard.patchBay(bay.id, (current) => ({ ...current, detail: detail.trim() || undefined }))
                    }
                  />
                ))}
            </section>

            <section id="forklift-lane" data-col="lane" aria-label="Forklift lane" className={cn("sheet-lane", snapCol === "lane" && "is-snap-col")}>
              <h2 className="sheet-lane-label">Forklift lane · limbo</h2>
              <div
                className={cn("lane-floor", snapCol === "lane" && "is-hot")}
                onClick={(event) => {
                  if (!carrying || !selectedId) return;
                  if ((event.target as HTMLElement).closest(".lane-piece")) return;
                  const rect = event.currentTarget.getBoundingClientRect();
                  drop(selectedId, "lane", -1, {
                    x: ((event.clientX - rect.left) / rect.width) * 100,
                    y: ((event.clientY - rect.top) / rect.height) * 100,
                  });
                }}
              >
                {bays
                  .find((bay) => bay.zone === "lane")
                  ?.slots.filter((slot): slot is NonNullable<typeof slot> => slot != null)
                  .map((stack) => (
                    <div
                      key={stack.id}
                      className={cn("lane-piece", ghost?.id === stack.id && "is-hidden")}
                      style={{ left: `${stack.x ?? 50}%`, top: `${stack.y ?? 50}%` }}
                    >
                      <button
                        type="button"
                        className="drag-handle no-print"
                        aria-label={`Drag ${stackLabel(stack)}`}
                        onPointerDown={(event) => onPointerDown(event, stack.id)}
                        onPointerMove={onPointerMove}
                        onPointerUp={(event) => onPointerUp(event, { bayId: "lane", index: -1 })}
                        onPointerCancel={onPointerCancel}
                      >
                        <GripVertical className="size-4" aria-hidden />
                      </button>
                      <button
                        type="button"
                        className={cn("stack-select", selectedId === stack.id && "is-selected")}
                        aria-pressed={selectedId === stack.id}
                        aria-label={`${kindName(stack.kind)}, ${stackLabel(stack)}, in the forklift lane`}
                        onClick={() => setSelectedId((prev) => (prev === stack.id ? null : stack.id))}
                      >
                        <StackFace stack={stack} />
                      </button>
                    </div>
                  ))}
              </div>
            </section>

            <section id="rows-east" data-col="east" className={cn("sheet-col", snapCol === "east" && "is-snap-col")} aria-label="Rows 9 to 21">
              <h2 className="sheet-col-title">Rows 9–21</h2>
              {bays
                .filter((bay) => bay.zone === "east")
                .map((bay) => (
                  <BayRow
                    key={bay.id}
                    bay={bay}
                    edge="end"
                    filter={filter}
                    query={query}
                    selectedId={selectedId}
                    carrying={carrying}
                    draggingId={ghost?.id ?? null}
                    over={over}
                    onPointerDown={onPointerDown}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerCancel}
                    onSelect={(id) => setSelectedId((prev) => (prev === id ? null : id))}
                    onEmptyClick={(index) => {
                      if (carrying && selectedId) drop(selectedId, bay.id, index);
                    }}
                    onGrow={() => {
                      const ok = yard.growBay(bay.id);
                      if (!ok) setStatus("This row cannot take another cell.");
                    }}
                    onNote={(detail) =>
                      yard.patchBay(bay.id, (current) => ({ ...current, detail: detail.trim() || undefined }))
                    }
                  />
                ))}
            </section>
          </div>

          <aside id="stack-editor" className="inspector-scroll no-print mt-6 rounded-xl border border-line bg-sheet p-4 lg:mt-0">
            {selected ? (
              <Editor
                bay={selected.bay}
                index={selected.index}
                stack={selected.stack}
                bays={bays}
                onPatch={(recipe, key) => yard.patchStack(selected.stack.id, recipe, key)}
                onBay={(recipe, key) => yard.patchBay(selected.bay.id, recipe, key)}
                onSend={sendSelected}
                onCarry={() => setCarrying(true)}
                onGrow={() => yard.growBay(selected.bay.id)}
                onDelete={() => {
                  const name = stackLabel(selected.stack);
                  yard.deleteStack(selected.stack.id);
                  setSelectedId(null);
                  setCarrying(false);
                  setLive(`Removed ${name}.`);
                }}
                onClose={() => {
                  setSelectedId(null);
                  setCarrying(false);
                }}
              />
            ) : (
              <NewStack
                bays={bays}
                onPlace={(bayId, stack) => {
                  const ok = yard.placeNew(bayId, stack);
                  if (!ok) {
                    setStatus("That aisle is full.");
                    return;
                  }
                  setSelectedId(stack.id);
                  const bay = bays.find((entry) => entry.id === bayId);
                  setLive(`Placed ${stackLabel(stack)} in ${bay?.title ?? "the aisle"}.`);
                  document.getElementById(`bay-${bayId}`)?.scrollIntoView({ block: "nearest" });
                }}
              />
            )}
          </aside>
        </div>
      </div>

      {ghost && ghostStack ? (
        <div
          className="pointer-events-none fixed z-50"
          style={{ left: ghost.x, top: ghost.y, transform: "translate(-50%, -50%)" }}
        >
          <StackFace stack={ghostStack} />
        </div>
      ) : null}
      <p className="sr-only" aria-live="polite">
        {live}
      </p>
    </main>
  );
}

function ThemeSwitch() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
  }, []);

  function toggle() {
    const next = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = next;
    localStorage.setItem("yard-theme", next);
    setTheme(next);
  }

  const dark = theme === "dark";
  return (
    <button
      type="button"
      className="btn btn-quiet"
      aria-pressed={dark}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
      onClick={toggle}
    >
      {dark ? <Sun className="size-4" aria-hidden /> : <Moon className="size-4" aria-hidden />}
      <span className="hidden sm:inline">{dark ? "Light" : "Dark"}</span>
    </button>
  );
}

function FloorLegend() {
  const [open, setOpen] = useState(false);
  return (
    <aside className="floor-legend" aria-label="Legend">
      <button
        type="button"
        className="floor-legend-title floor-legend-toggle"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
      >
        Legend
      </button>
      <h2 className="floor-legend-title floor-legend-heading">Legend</h2>
      <div className={cn("floor-legend-body", open && "is-open")}>
      <ul className="floor-legend-products">
        {PRODUCTS.map((product) => (
          <li key={product.id}>
            <span
              className="legend-dot"
              style={{ background: markColor({ label: "", product: product.id, height: 1, unknown: false }) }}
              aria-hidden
            />
            {product.name}
          </li>
        ))}
        <li>
          <span className="legend-dot is-unknown" aria-hidden />
          Unknown
        </li>
      </ul>
      <ul className="floor-legend-list">
        <li>
          <ShapeGlyph kind="tote" /> Tote
        </li>
        <li>
          <ShapeGlyph kind="box" /> Boxes
        </li>
        <li>
          <ShapeGlyph kind="pill" /> Split stack
        </li>
        <li>Number is the height</li>
        <li>
          <span className="legend-treated" aria-hidden />
          Red outline means treated
        </li>
        <li>The scale drags into any open section</li>
      </ul>
      </div>
    </aside>
  );
}

function FilterChip({
  pressed,
  label,
  count,
  swatch,
  onClick,
}: {
  pressed: boolean;
  label: string;
  count: number;
  swatch?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className="chip"
      aria-pressed={pressed}
      onClick={onClick}
      style={swatch ? ({ "--chip": swatch } as CSSProperties) : undefined}
    >
      {swatch ? (
        <span className="size-3 shrink-0 rounded-full" style={{ background: swatch }} aria-hidden />
      ) : null}
      {label}
      <span className="font-mono text-xs tabular-nums opacity-80">{count}</span>
    </button>
  );
}

function ShapeGlyph({ kind }: { kind: StackKind }) {
  const common = { width: 14, height: 14, viewBox: "0 0 16 16", fill: "none", stroke: "currentColor", strokeWidth: 1.5, "aria-hidden": true as const };
  if (kind === "tote") {
    return (
      <svg {...common}>
        <circle cx="8" cy="8" r="5.5" />
      </svg>
    );
  }
  if (kind === "box") {
    return (
      <svg {...common}>
        <rect x="2.5" y="2.5" width="11" height="11" rx="2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <rect x="1.5" y="4.5" width="13" height="7" rx="3.5" />
      <path d="M8 5v6" />
    </svg>
  );
}

function BayRow({
  bay,
  edge,
  tall,
  filter,
  query,
  selectedId,
  carrying,
  draggingId,
  over,
  bare,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  onSelect,
  onEmptyClick,
  onGrow,
  onNote,
}: {
  bay: Bay;
  edge: "start" | "end";
  tall?: boolean;
  filter: FilterId;
  query: string;
  selectedId: string | null;
  carrying: boolean;
  draggingId: string | null;
  over: Over | null;
  bare?: boolean;
  onPointerDown: (event: ReactPointerEvent<HTMLButtonElement>, id: string) => void;
  onPointerMove: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onPointerUp: (event: ReactPointerEvent<HTMLButtonElement>, slot: Over) => void;
  onPointerCancel: (event: ReactPointerEvent<HTMLButtonElement>) => void;
  onSelect: (id: string) => void;
  onEmptyClick: (index: number) => void;
  onGrow: () => void;
  onNote: (detail: string) => void;
}) {
  let splitAt = -1;
  if (bay.railRight) {
    splitAt = bay.slots.findIndex((slot, index) => {
      if (!slot || slot.layers[0]?.product !== bay.railRight) return false;
      return bay.slots.slice(0, index).some((prev) => prev && prev.layers[0]?.product !== bay.railRight);
    });
  }
  const cells = bay.slots.map((slot, index) => {
    const hot = over?.bayId === bay.id && over.index === index;
    const selected = slot?.id === selectedId;
    const handle = slot ? (
      <button
        type="button"
        className="drag-handle no-print"
        aria-label={`Drag ${stackLabel(slot)}`}
        onPointerDown={(event) => onPointerDown(event, slot.id)}
        onPointerMove={onPointerMove}
        onPointerUp={(event) => onPointerUp(event, { bayId: bay.id, index })}
        onPointerCancel={onPointerCancel}
      >
        <GripVertical className="size-4" aria-hidden />
      </button>
    ) : null;
    const face = slot ? (
      <button
        type="button"
        className={cn(
          "stack-select",
          draggingId === slot.id && "opacity-40",
          !stackMatches(slot, bay, filter, query) && slot.id !== selectedId && "opacity-35",
        )}
        aria-pressed={selected}
        aria-label={`${kindName(slot.kind)}, ${stackLabel(slot)}, height ${slot.layers.map((layer) => layer.height).join(" and ")}, ${bay.title} cell ${index + 1}`}
        onClick={() => onSelect(slot.id)}
      >
        <StackFace stack={slot} />
      </button>
    ) : null;
    return (
      <div
        key={`${bay.id}-${index}`}
        data-slot
        data-bay={bay.id}
        data-index={index}
        className={cn("slot", !slot && "is-empty", hot && "is-over", selected && "is-selected")}
      >
        {splitAt === index ? <span className="sheet-split" aria-hidden /> : null}
        {slot ? (
          <>
            {handle}
            {face}
          </>
        ) : carrying ? (
          <button type="button" className="slot-open sheet-drop" onClick={() => onEmptyClick(index)}>
            Drop
          </button>
        ) : (
          <span className="slot-open" aria-label={`Empty cell in ${bay.title}`} />
        )}
      </div>
    );
  });

  const shown = edge === "end" ? [...cells].reverse() : cells;

  if (bare) {
    return (
      <div id={`bay-${bay.id}`} data-row={bay.id} className={cn("lane-grid slot-grid", over?.bayId === bay.id && draggingId && "is-snap")}>
        {cells}
        {over?.bayId === bay.id && draggingId ? <span className="row-guide" aria-hidden /> : null}
      </div>
    );
  }

  const scale = bay.id === "e19" && bay.slots.every((slot) => slot == null);

  const rail = (
    <div className="sheet-rail" aria-hidden>
      <span style={{ background: railColor(bay.rail) }} />
      {bay.railRight ? <span style={{ background: railColor(bay.railRight) }} /> : null}
    </div>
  );
  const body = (
    <div className="sheet-main">
      <header className="sheet-head">
        <span className="sheet-code">{bay.code}</span>
        {tall ? <span className="sheet-title">{bay.title}</span> : null}
      </header>
      <div className={cn("sheet-stacks", edge === "end" && "is-outer-end", tall && "is-center")}>
        {shown}
        {over?.bayId === bay.id && draggingId ? <span className="row-guide" aria-hidden /> : null}
      </div>
      <RowNote value={bay.detail ?? ""} onChange={onNote} />
    </div>
  );

  return (
    <article
      id={`bay-${bay.id}`}
      data-row={bay.id}
      className={cn("sheet-row", tall && "is-treater", scale && "is-scale", edge === "end" && "is-east", over?.bayId === bay.id && draggingId && "is-snap")}
      aria-label={`Row ${bay.code}, ${bay.title}`}
    >
      {edge === "end" ? (
        <>
          {rail}
          {body}
        </>
      ) : (
        <>
          {body}
          {rail}
        </>
      )}
    </article>
  );
}

function RowNote({ value, onChange }: { value: string; onChange: (detail: string) => void }) {
  const [draft, setDraft] = useState(value);
  useEffect(() => setDraft(value), [value]);
  return (
    <label className="row-note select-text">
      <span className="row-note-label">Notes</span>
      <textarea
        className="row-note-input"
        rows={1}
        maxLength={400}
        value={draft}
        placeholder="Add a note for this row"
        onChange={(event) => setDraft(event.target.value)}
        onBlur={() => {
          if (draft !== value) onChange(draft);
        }}
      />
    </label>
  );
}

function StackFace({ stack }: { stack: Stack }) {
  if (stack.kind === "scale") {
    return <span className="mark scale-face">Scale</span>;
  }
  return stack.kind === "pill" ? <PillFace stack={stack} /> : <SingleFace stack={stack} />;
}

function pileDepth(height: number) {
  return String(Math.min(3, Math.max(0, height - 1)));
}

function SingleFace({ stack }: { stack: Stack }) {
  const layer = stack.layers[0];
  return (
    <span
      className={cn(
        "mark relative grid place-items-center font-mono text-sm font-medium tabular-nums",
        stack.kind === "tote" ? "rounded-full" : "rounded-sm",
      )}
      data-unknown={layer.unknown ? "true" : "false"}
      data-treated={layer.treated ? "true" : "false"}
      data-mix={!layer.unknown && layer.product === "mix" ? "true" : "false"}
      data-depth={layer.unknown ? "0" : pileDepth(layer.height)}
      style={markStyle(layer)}
    >
      {layer.height}
    </span>
  );
}

function PillFace({ stack }: { stack: Stack }) {
  const [a, b] = stack.layers;
  const height = Math.max(a.height, b.height);
  return (
    <span
      className="pill-face relative flex overflow-hidden rounded-full"
      data-depth={pileDepth(height)}
      data-treated={a.treated || b.treated ? "true" : "false"}
    >
      <Half layer={a} />
      <span className="w-px shrink-0 bg-ink/20" aria-hidden />
      <Half layer={b} />
    </span>
  );
}

function Half({ layer }: { layer: Layer }) {
  return (
    <span
      className="mark flex flex-1 items-center justify-center border-0 font-mono text-sm font-medium tabular-nums"
      data-unknown={layer.unknown ? "true" : "false"}
      data-treated={layer.treated ? "true" : "false"}
      data-mix={!layer.unknown && layer.product === "mix" ? "true" : "false"}
      style={markStyle(layer)}
    >
      {layer.height}
    </span>
  );
}

function Editor({
  bay,
  index,
  stack,
  bays,
  onPatch,
  onBay,
  onSend,
  onCarry,
  onGrow,
  onDelete,
  onClose,
}: {
  bay: Bay;
  index: number;
  stack: Stack;
  bays: Bay[];
  onPatch: (recipe: (stack: Stack) => Stack, key?: string) => void;
  onBay: (recipe: (bay: Bay) => Bay, key?: string) => void;
  onSend: (bayId: string) => void;
  onCarry: () => void;
  onGrow: () => void;
  onDelete: () => void;
  onClose: () => void;
}) {
  const [armDelete, setArmDelete] = useState(false);
  useEffect(() => setArmDelete(false), [stack.id]);

  function patchLayer(layerIndex: number, recipe: (layer: Layer) => Layer, key: string) {
    onPatch(
      (current) => ({
        ...current,
        layers: current.layers.map((layer, i) => (i === layerIndex ? recipe(layer) : layer)),
      }),
      key,
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-muted">Row {bay.code}</p>
          <h2 className="font-display text-2xl leading-tight text-ink">{stackLabel(stack)}</h2>
          <p className="mt-1 text-xs text-muted">
            Cell {index + 1} of {bay.slots.length}
          </p>
        </div>
        <button type="button" className="btn btn-quiet" onClick={onClose} aria-label="Close stack">
          <X className="size-4" aria-hidden />
        </button>
      </div>

      <label className="block text-xs font-semibold text-ink-soft">
        Aisle name
        <input
          className="field mt-1"
          value={bay.title}
          onChange={(event) => onBay((current) => ({ ...current, title: event.target.value }), `bay:${bay.id}:title`)}
        />
      </label>

      {stack.kind === "scale" ? (
        <p className="text-sm leading-relaxed text-ink-soft">
          Drag the scale into any open section, or send it to another row. It takes one spot, the same as a stack.
        </p>
      ) : (
        <>
      <fieldset>
        <legend className="text-xs font-semibold text-ink-soft">Container</legend>
        <div className="mt-1 grid grid-cols-3 gap-1">
          {(["tote", "box", "pill"] as StackKind[]).map((kind) => (
            <button
              key={kind}
              type="button"
              className={cn("btn", stack.kind === kind ? "btn-primary" : "btn-quiet")}
              aria-pressed={stack.kind === kind}
              onClick={() =>
                onPatch((current) => {
                  const layers = current.layers.slice();
                  if (kind === "pill" && layers.length < 2) {
                    layers.push({
                      label: "Second item",
                      product: layers[0]?.product ?? "awp",
                      height: 1,
                      unknown: false,
                    });
                  }
                  return { ...current, kind, layers: kind === "pill" ? layers.slice(0, 2) : layers.slice(0, 1) };
                }, `${stack.id}:kind`)
              }
            >
              <ShapeGlyph kind={kind} />
              {kind === "pill" ? "Split" : kindName(kind)}
            </button>
          ))}
        </div>
      </fieldset>

      {stack.layers.map((layer, layerIndex) => (
        <LayerFields
          key={`${stack.id}-${layerIndex}`}
          layer={layer}
          title={stack.kind === "pill" ? `Item ${layerIndex + 1}` : "Stack"}
          cap={maxHeight(stack.kind)}
          onLabel={(label) => patchLayer(layerIndex, (current) => ({ ...current, label }), `${stack.id}:${layerIndex}:label`)}
          onHeight={(height) =>
            patchLayer(layerIndex, (current) => ({ ...current, height }), `${stack.id}:${layerIndex}:height`)
          }
          onProduct={(product) =>
            patchLayer(
              layerIndex,
              (current) => ({ ...current, product, unknown: false }),
              `${stack.id}:${layerIndex}:product`,
            )
          }
          onUnknown={(unknown) =>
            patchLayer(layerIndex, (current) => ({ ...current, unknown }), `${stack.id}:${layerIndex}:unknown`)
          }
          onTreated={(treated) =>
            patchLayer(layerIndex, (current) => ({ ...current, treated }), `${stack.id}:${layerIndex}:treated`)
          }
        />
      ))}
        </>
      )}

      <label className="block text-xs font-semibold text-ink-soft">
        Note
        <textarea
          className="field-area mt-1"
          value={stack.note}
          onChange={(event) => onPatch((current) => ({ ...current, note: event.target.value }), `${stack.id}:note`)}
        />
      </label>

      <label className="block text-xs font-semibold text-ink-soft" htmlFor="aisle-select">
        Send to aisle
        <select id="aisle-select" className="field mt-1" value={bay.id} onChange={(event) => onSend(event.target.value)}>
          {bays.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.zone === "lane" ? "Forklift lane" : `Row ${entry.code}`}
            </option>
          ))}
        </select>
      </label>

      <div className="flex flex-col gap-2">
        <button type="button" className="btn btn-primary" onClick={onCarry}>
          Place on a cell
        </button>
        {armDelete ? (
          <div className="flex gap-2">
            <button type="button" className="btn btn-danger flex-1" onClick={onDelete}>
              Remove stack
            </button>
            <button type="button" className="btn btn-quiet flex-1" onClick={() => setArmDelete(false)}>
              Keep
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-danger" onClick={() => setArmDelete(true)}>
            Remove from floor
          </button>
        )}
      </div>
    </div>
  );
}

function LayerFields({
  layer,
  title,
  cap,
  onLabel,
  onHeight,
  onProduct,
  onUnknown,
  onTreated,
}: {
  layer: Layer;
  title: string;
  cap: number;
  onLabel: (label: string) => void;
  onHeight: (height: number) => void;
  onProduct: (product: ProductId) => void;
  onUnknown: (unknown: boolean) => void;
  onTreated: (treated: boolean) => void;
}) {
  return (
    <fieldset className="flex flex-col gap-2 border-t border-line pt-3">
      <legend className="text-xs font-semibold text-ink-soft">{title}</legend>
      <label className="block text-xs font-semibold text-ink-soft">
        Label
        <input className="field mt-1" value={layer.label} onChange={(event) => onLabel(event.target.value)} />
      </label>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold text-ink-soft">Height</span>
        <div className="flex items-center gap-1">
          <button
            type="button"
            className="btn btn-quiet size-11 px-0"
            aria-label="Decrease height"
            onClick={() => onHeight(Math.max(1, layer.height - 1))}
          >
            <Minus className="size-4" aria-hidden />
          </button>
          <span className="w-8 text-center font-mono text-sm tabular-nums">{layer.height}</span>
          <button
            type="button"
            className="btn btn-quiet size-11 px-0"
            aria-label="Increase height"
            onClick={() => onHeight(Math.min(cap, layer.height + 1))}
          >
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      <div className="flex flex-wrap gap-1" role="group" aria-label={`${title} product`}>
        {PRODUCTS.map((product) => (
          <button
            key={product.id}
            type="button"
            className="chip"
            aria-pressed={!layer.unknown && layer.product === product.id}
            onClick={() => onProduct(product.id)}
          >
            <span
              className="size-2.5 rounded-full"
              style={{ background: `var(--color-swatch-${product.id})` }}
              aria-hidden
            />
            {product.name}
          </button>
        ))}
        <button type="button" className="chip" aria-pressed={layer.unknown} onClick={() => onUnknown(!layer.unknown)}>
          Unknown
        </button>
      </div>
      <div className="flex gap-1" role="group" aria-label={`${title} treatment`}>
        <button
          type="button"
          className={cn("chip", layer.treated && "is-treated")}
          aria-pressed={Boolean(layer.treated)}
          onClick={() => onTreated(true)}
        >
          Treated
        </button>
        <button
          type="button"
          className="chip"
          aria-pressed={!layer.treated}
          onClick={() => onTreated(false)}
        >
          Not treated
        </button>
      </div>
    </fieldset>
  );
}

function NewStack({
  bays,
  onPlace,
}: {
  bays: Bay[];
  onPlace: (bayId: string, stack: Stack) => void;
}) {
  const [bayId, setBayId] = useState(bays[0]?.id ?? "w1");
  const [kind, setKind] = useState<StackKind>("tote");
  const [label, setLabel] = useState("");
  const [product, setProduct] = useState<ProductId>("awp");
  const [height, setHeight] = useState(2);

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const first = { label: label.trim() || "New stack", product, height, unknown: false };
        const stack = createStack({
          kind,
          layers: kind === "pill" ? [first, { label: "Second item", product, height: 1, unknown: false }] : [first],
        });
        onPlace(bayId, stack);
        setLabel("");
      }}
    >
      <div>
        <h2 className="font-display text-2xl leading-tight text-ink">Place a stack</h2>
        <p className="mt-1 text-sm leading-relaxed text-muted">
          Select anything on the floor to edit it. Or add a stack into the first open cell of an aisle.
        </p>
      </div>
      <label className="block text-xs font-semibold text-ink-soft">
        Aisle
        <select className="field mt-1" value={bayId} onChange={(event) => setBayId(event.target.value)}>
          {bays.map((bay) => (
            <option key={bay.id} value={bay.id}>
              {bay.zone === "lane" ? "Forklift lane" : `Row ${bay.code}`}
            </option>
          ))}
        </select>
      </label>
      <fieldset>
        <legend className="text-xs font-semibold text-ink-soft">Container</legend>
        <div className="mt-1 grid grid-cols-3 gap-1">
          {(["tote", "box", "pill"] as StackKind[]).map((entry) => (
            <button
              key={entry}
              type="button"
              className={cn("btn", kind === entry ? "btn-primary" : "btn-quiet")}
              aria-pressed={kind === entry}
              onClick={() => {
                setKind(entry);
                setHeight((n) => Math.min(n, maxHeight(entry)));
              }}
            >
              {entry === "pill" ? "Split" : kindName(entry)}
            </button>
          ))}
        </div>
      </fieldset>
      <label className="block text-xs font-semibold text-ink-soft" htmlFor="new-label">
        Label
        <input id="new-label" className="field mt-1" value={label} onChange={(event) => setLabel(event.target.value)} />
      </label>
      <label className="block text-xs font-semibold text-ink-soft">
        Product
        <select
          className="field mt-1"
          value={product}
          onChange={(event) => setProduct(event.target.value as ProductId)}
        >
          {PRODUCTS.map((entry) => (
            <option key={entry.id} value={entry.id}>
              {entry.name}
            </option>
          ))}
        </select>
      </label>
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-ink-soft">Height</span>
        <div className="flex items-center gap-1">
          <button type="button" className="btn btn-quiet size-11 px-0" aria-label="Decrease height" onClick={() => setHeight((n) => Math.max(1, n - 1))}>
            <Minus className="size-4" aria-hidden />
          </button>
          <span className="w-8 text-center font-mono tabular-nums">{height}</span>
          <button type="button" className="btn btn-quiet size-11 px-0" aria-label="Increase height" onClick={() => setHeight((n) => Math.min(maxHeight(kind), n + 1))}>
            <Plus className="size-4" aria-hidden />
          </button>
        </div>
      </div>
      <button type="submit" className="btn btn-primary">
        Place stack
      </button>
      <p className="text-xs leading-relaxed text-muted">
        {productName(product)} goes in as a {kindName(kind).toLowerCase()}. Split stacks can be labeled on each side after you place them.
      </p>
    </form>
  );
}
