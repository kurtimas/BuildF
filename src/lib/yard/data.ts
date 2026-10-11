import type { CSSProperties } from "react";

export const STORAGE_KEY = "yard-floor-v3";
export const MAX_SLOTS = 5;
export const MAX_HEIGHT = 5;

export function maxHeight(kind: StackKind): number {
  if (kind === "tote") return 2;
  if (kind === "scale") return 1;
  return MAX_HEIGHT;
}

export const PRODUCTS = [
  { id: "awp", name: "Austrian Winter Peas" },
  { id: "keystone", name: "Keystone Green Peas" },
  { id: "frontier", name: "Frontier Peas" },
  { id: "wheat", name: "Wheat" },
  { id: "barley", name: "Barley" },
  { id: "garb", name: "Garbanzo beans" },
  { id: "compass", name: "Compass Peas" },
  { id: "icicle", name: "Icicle Peas" },
  { id: "passion", name: "Passion Peas" },
  { id: "mix", name: "Mixed" },
] as const;

export type ProductId = (typeof PRODUCTS)[number]["id"];
export type StackKind = "tote" | "box" | "pill" | "scale";
export type Zone = "west" | "east" | "lane" | "treater";
export type FilterId = "all" | "unknown" | ProductId;

export type Layer = {
  label: string;
  product: ProductId;
  height: number;
  unknown: boolean;
  treated?: boolean;
};

export type Stack = {
  id: string;
  kind: StackKind;
  layers: Layer[];
  note: string;
  /** Percent across the forklift lane. Only used while the stack is in limbo. */
  x?: number;
  y?: number;
};

export type Bay = {
  id: string;
  zone: Zone;
  code: string;
  title: string;
  detail?: string;
  rail: ProductId | "neutral";
  railRight?: ProductId;
  slots: (Stack | null)[];
};

const PRODUCT_SET = new Set<string>(PRODUCTS.map((p) => p.id));
const KIND_SET = new Set<string>(["tote", "box", "pill", "scale"]);
const ZONE_SET = new Set<string>(["west", "east", "lane", "treater"]);

export function isProduct(value: string): value is ProductId {
  return PRODUCT_SET.has(value);
}

export function productName(id: ProductId): string {
  return PRODUCTS.find((p) => p.id === id)?.name ?? id;
}

export function zoneName(zone: Zone): string {
  if (zone === "west") return "Totes aisle";
  if (zone === "east") return "Numbered aisle";
  if (zone === "lane") return "Forklift lane";
  return "Seed treater";
}

export function kindName(kind: StackKind): string {
  if (kind === "tote") return "Tote";
  if (kind === "box") return "Boxes";
  if (kind === "scale") return "Scale";
  return "Split stack";
}

export function stackLabel(stack: Stack): string {
  const text = stack.layers.map((layer) => layer.label.trim() || "Untitled").join(" / ");
  return text || "Untitled";
}

const SWATCH: Record<ProductId, readonly [string, string]> = {
  awp: ["var(--color-swatch-awp)", "var(--color-swatch-awp-fg)"],
  keystone: ["var(--color-swatch-keystone)", "var(--color-swatch-keystone-fg)"],
  frontier: ["var(--color-swatch-frontier)", "var(--color-swatch-frontier-fg)"],
  wheat: ["var(--color-swatch-wheat)", "var(--color-swatch-wheat-fg)"],
  barley: ["var(--color-swatch-barley)", "var(--color-swatch-barley-fg)"],
  garb: ["var(--color-swatch-garb)", "var(--color-swatch-garb-fg)"],
  compass: ["var(--color-swatch-compass)", "var(--color-swatch-compass-fg)"],
  icicle: ["var(--color-swatch-icicle)", "var(--color-swatch-icicle-fg)"],
  passion: ["var(--color-swatch-passion)", "var(--color-swatch-passion-fg)"],
  mix: ["var(--color-swatch-mix)", "var(--color-swatch-mix-fg)"],
};

export function markColor(layer: Layer): string {
  if (layer.unknown) return "var(--color-swatch-mixed)";
  return SWATCH[layer.product][0];
}

export function markStyle(layer: Layer): CSSProperties {
  if (layer.unknown) {
    return { "--mark": "var(--color-swatch-mixed)", "--mark-fg": "var(--color-muted)" } as CSSProperties;
  }
  const [bg, fg] = SWATCH[layer.product];
  return { "--mark": bg, "--mark-fg": fg } as CSSProperties;
}

export function railColor(rail: ProductId | "neutral"): string {
  if (rail === "neutral") return "var(--color-line-strong)";
  return SWATCH[rail][0];
}

function clampHeight(value: unknown, kind: StackKind): number {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.min(maxHeight(kind), Math.max(1, Math.round(n)));
}

function cleanLayer(value: unknown, fallback: Layer, kind: StackKind): Layer {
  const raw = (value ?? {}) as Partial<Layer>;
  const productRaw = typeof raw.product === "string" && isProduct(raw.product) ? raw.product : fallback.product;
  const label = typeof raw.label === "string" ? raw.label.slice(0, 48) : fallback.label;
  const looksPassion = /^passion\b/i.test(label);
  const product = looksPassion && productRaw === "awp" ? "passion" : productRaw;
  return {
    label,
    product,
    height: clampHeight(raw.height ?? fallback.height, kind),
    unknown: looksPassion && productRaw === "awp" ? false : Boolean(raw.unknown),
    treated: typeof raw.treated === "boolean" ? raw.treated : /\btreated\b/i.test(String(raw.label ?? fallback.label)),
  };
}

export function normalizeStack(stack: Stack): Stack {
  const kind: StackKind = KIND_SET.has(stack.kind) ? stack.kind : "box";
  const spot = spotInLane(stack.x, stack.y);
  if (kind === "scale") {
    return {
      id: stack.id,
      kind: "scale",
      layers: [{ label: "Scale", product: "awp", height: 1, unknown: false }],
      note: typeof stack.note === "string" ? stack.note.slice(0, 240) : "",
      ...(spot ? { x: spot.x, y: spot.y } : {}),
    };
  }
  const base = stack.layers[0] ?? {
    label: "Untitled",
    product: "awp" as ProductId,
    height: 1,
    unknown: false,
  };
  const layers = [cleanLayer(stack.layers[0], base, kind)];
  if (kind === "pill") {
    layers.push(
      cleanLayer(stack.layers[1], {
        label: "Second item",
        product: layers[0].product,
        height: 1,
        unknown: false,
      }, kind),
    );
  }
  return {
    id: stack.id,
    kind,
    layers,
    note: typeof stack.note === "string" ? stack.note.slice(0, 240) : "",
    ...(spot ? { x: spot.x, y: spot.y } : {}),
  };
}

function spotInLane(x: unknown, y: unknown): { x: number; y: number } | null {
  if (typeof x !== "number" || typeof y !== "number") return null;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x: Math.min(96, Math.max(4, x)), y: Math.min(96, Math.max(4, y)) };
}

export function createStack(partial?: Partial<Stack>): Stack {
  return normalizeStack({
    id: crypto.randomUUID(),
    kind: partial?.kind ?? "tote",
    note: partial?.note ?? "",
    layers: partial?.layers ?? [
      { label: "New stack", product: "awp", height: 1, unknown: false },
    ],
  });
}

function cells(stacks: Stack[], count?: number): (Stack | null)[] {
  const size = Math.max(count ?? 0, stacks.length, 5);
  const slots: (Stack | null)[] = Array.from({ length: size }, () => null);
  stacks.forEach((stack, index) => {
    slots[index] = stack;
  });
  return slots;
}

function layer(label: string, product: ProductId, height: number, unknown = false, treated?: boolean): Layer {
  return {
    label,
    product,
    height,
    unknown,
    treated: treated ?? (/\btreated\b/i.test(label) && !/\buntreated\b/i.test(label)),
  };
}

function tote(id: string, label: string, product: ProductId, height: number, unknown = false): Stack {
  return { id, kind: "tote", note: "", layers: [layer(label, product, height, unknown)] };
}

function box(id: string, label: string, product: ProductId, height: number, unknown = false): Stack {
  return { id, kind: "box", note: "", layers: [layer(label, product, height, unknown)] };
}

function pill(id: string, a: Layer, b: Layer): Stack {
  return { id, kind: "pill", note: "", layers: [a, b] };
}

function bay(
  partial: Omit<Bay, "slots"> & { stacks: Stack[]; count?: number },
): Bay {
  const { stacks, count, ...rest } = partial;
  return { ...rest, slots: cells(stacks, count) };
}

export function createSurvey(): Bay[] {
  return [
    bay({
      id: "w1",
      zone: "west",
      code: "1",
      title: "Totes — AWP",
      rail: "awp",
      stacks: [tote("w1a", "AWP", "awp", 3), tote("w1b", "AWP", "awp", 2)],
    }),
    bay({
      id: "w2",
      zone: "west",
      code: "2",
      title: "AWP treated",
      rail: "awp",
      stacks: [
        box("w2a", "AWP treated", "awp", 4),
        box("w2b", "AWP treated", "awp", 4),
        box("w2c", "AWP treated", "awp", 4),
        box("w2d", "AWP treated", "awp", 4),
      ],
    }),
    bay({
      id: "w3",
      zone: "west",
      code: "3",
      title: "Frontier peas",
      rail: "frontier",
      stacks: [tote("w3a", "Frontier peas", "frontier", 2), tote("w3b", "Frontier peas", "frontier", 2)],
    }),
    bay({
      id: "w4",
      zone: "west",
      code: "4",
      title: "Frontier peas",
      rail: "frontier",
      stacks: [
        tote("w4a", "Frontier peas", "frontier", 2),
        tote("w4b", "Frontier peas", "frontier", 2),
        tote("w4c", "Frontier peas", "frontier", 2),
      ],
    }),
    bay({
      id: "w5",
      zone: "west",
      code: "5",
      title: "Frontier peas",
      rail: "frontier",
      stacks: [
        tote("w5a", "Frontier peas", "frontier", 2),
        tote("w5b", "Frontier peas", "frontier", 2),
        tote("w5c", "Frontier peas", "frontier", 2),
      ],
    }),
    bay({
      id: "w6",
      zone: "west",
      code: "6",
      title: "Row 6 mix",
      detail:
        "1 tote black barley · split boxes: 2 RedCoat + 2 Compass treated · three box stacks unknown.",
      rail: "neutral",
      stacks: [
        box("w6a", "Unknown", "awp", 4, true),
        box("w6b", "Unknown", "awp", 4, true),
        box("w6c", "Unknown", "awp", 4, true),
        pill("w6d", layer("RedCoat", "awp", 2, true), layer("Compass treated", "compass", 2)),
        tote("w6e", "Black barley", "barley", 1),
      ],
    }),
    bay({
      id: "w7",
      zone: "west",
      code: "7",
      title: "Mixed stack",
      detail:
        "Rotated stock. Survey note: (2 Keystone, 1 RedCliff) · (2 SWW/blk mix, 1 blk bly) · (2 hulless bly, 2 blk bly) · (4 blk barley) · (2 McGuire seed, 2 unknown). Paired to the drawn shapes — edit a label if a pair is off.",
      rail: "neutral",
      stacks: [
        pill("w7a", layer("Hulless barley", "barley", 2), layer("Black barley", "barley", 2)),
        box("w7b", "Black barley", "barley", 4),
        pill(
          "w7c",
          layer("McGuire seed", "awp", 2, true),
          layer("Unknown", "awp", 2, true),
        ),
        pill("w7d", layer("Keystone", "keystone", 2), layer("RedCliff", "awp", 1, true)),
        pill("w7e", layer("SWW / black mix", "wheat", 2), layer("Black barley", "barley", 1)),
      ],
    }),
    bay({
      id: "treater",
      zone: "treater",
      code: "8",
      title: "Seed treater plant",
      detail: "Cardboard ½–¾ stack · 2× full wood bundle.",
      rail: "neutral",
      stacks: [
        { ...box("tr1", "Cardboard", "awp", 1, true), note: "½–¾ stack" },
        { ...box("tr2", "Wood bundle", "awp", 1, true), note: "Full bundle" },
        { ...box("tr3", "Wood bundle", "awp", 1, true), note: "Full bundle" },
      ],
    }),
    bay({
      id: "lane",
      zone: "lane",
      code: "FL",
      title: "Forklift lane",
      detail: "Limbo. Park a stack here while you clear a cell.",
      rail: "neutral",
      count: 4,
      stacks: [],
    }),
    bay({
      id: "e7",
      zone: "east",
      code: "9",
      title: "AWP untreated",
      rail: "awp",
      stacks: [
        box("e7a", "AWP untreated", "awp", 3),
        box("e7b", "AWP untreated", "awp", 4),
        box("e7c", "AWP untreated", "awp", 4),
        box("e7d", "AWP untreated", "awp", 4),
      ],
    }),
    bay({
      id: "e8",
      zone: "east",
      code: "10",
      title: "Keystone treated",
      rail: "keystone",
      stacks: [
        box("e8a", "Keystone treated", "keystone", 5),
        box("e8b", "Keystone treated", "keystone", 5),
        box("e8c", "Keystone treated", "keystone", 4),
        box("e8d", "Keystone treated", "keystone", 4),
      ],
    }),
    bay({
      id: "e9",
      zone: "east",
      code: "11",
      title: "Frontier garb",
      rail: "garb",
      stacks: [
        tote("e9a", "Frontier garb", "garb", 1),
        tote("e9b", "Frontier garb", "garb", 2),
        tote("e9c", "Frontier garb", "garb", 2),
        tote("e9d", "Frontier garb", "garb", 2),
      ],
    }),
    bay({
      id: "e10",
      zone: "east",
      code: "12",
      title: "Icicle winter peas / Compass",
      rail: "icicle",
      railRight: "compass",
      stacks: [
        box("e10a", "Icicle winter peas", "icicle", 3),
        tote("e10b", "Compass", "compass", 2),
        tote("e10c", "Compass", "compass", 2),
      ],
    }),
    bay({
      id: "e11",
      zone: "east",
      code: "13",
      title: "Keystone",
      rail: "keystone",
      stacks: [
        tote("e11a", "Keystone", "keystone", 1),
        tote("e11b", "Keystone", "keystone", 2),
        tote("e11c", "Keystone", "keystone", 2),
        tote("e11d", "Keystone", "keystone", 2),
      ],
    }),
    bay({
      id: "e12",
      zone: "east",
      code: "14",
      title: "Keystone",
      rail: "keystone",
      stacks: [
        tote("e12a", "Keystone", "keystone", 2),
        tote("e12b", "Keystone", "keystone", 2),
        tote("e12c", "Keystone", "keystone", 2),
        tote("e12d", "Keystone", "keystone", 2),
      ],
    }),
    bay({
      id: "e13",
      zone: "east",
      code: "15",
      title: "Uncert / Compass",
      detail: "Marked uncertain on the survey, colored as Compass.",
      rail: "compass",
      stacks: [
        tote("e13a", "Compass", "compass", 2),
        tote("e13b", "Compass", "compass", 2),
        tote("e13c", "Compass", "compass", 2),
        tote("e13d", "Compass", "compass", 2),
      ],
    }),
    bay({
      id: "e14",
      zone: "east",
      code: "16",
      title: "Keystone treated / Passion",
      rail: "keystone",
      railRight: "passion",
      stacks: [
        box("e14a", "Keystone treated", "keystone", 3),
        box("e14b", "Passion", "passion", 3),
        box("e14c", "Passion", "passion", 4),
        box("e14d", "Passion", "passion", 4),
      ],
    }),
    bay({
      id: "e15",
      zone: "east",
      code: "17",
      title: "Garb screens",
      rail: "garb",
      stacks: [
        tote("e15a", "Garb screens", "garb", 1),
        tote("e15b", "Garb screens", "garb", 2),
        tote("e15c", "Garb screens", "garb", 2),
        tote("e15d", "Garb screens", "garb", 2),
      ],
    }),
    bay({
      id: "e16",
      zone: "east",
      code: "18",
      title: "Keystone",
      rail: "keystone",
      stacks: [
        tote("e16a", "Keystone", "keystone", 2),
        tote("e16b", "Keystone", "keystone", 2),
        tote("e16c", "Keystone", "keystone", 2),
        tote("e16d", "Keystone", "keystone", 2),
      ],
    }),
    bay({
      id: "e17",
      zone: "east",
      code: "19",
      title: "Keystone",
      rail: "keystone",
      stacks: [
        tote("e17a", "Keystone", "keystone", 2),
        tote("e17b", "Keystone", "keystone", 2),
        tote("e17c", "Keystone", "keystone", 2),
        tote("e17d", "Keystone", "keystone", 2),
      ],
    }),
    bay({
      id: "e18",
      zone: "east",
      code: "20",
      title: "Keystone",
      rail: "keystone",
      stacks: [
        tote("e18a", "Keystone", "keystone", 2),
        tote("e18b", "Keystone", "keystone", 2),
        tote("e18c", "Keystone", "keystone", 2),
      ],
    }),
    bay({
      id: "r21",
      zone: "east",
      code: "21",
      title: "Scale",
      detail: "Drag the scale into any open section.",
      rail: "neutral",
      stacks: [
        {
          id: "yard-scale",
          kind: "scale",
          note: "",
          layers: [{ label: "Scale", product: "awp", height: 1, unknown: false }],
        },
      ],
    }),
  ].map((entry) => ({
    ...entry,
    slots: entry.slots.map((slot) => (slot ? normalizeStack(slot) : slot)),
  }));
}

export type StackHit = { bay: Bay; index: number; stack: Stack };

export function findStack(bays: Bay[], id: string): StackHit | null {
  for (const bay of bays) {
    const index = bay.slots.findIndex((slot) => slot?.id === id);
    const stack = bay.slots[index];
    if (stack) return { bay, index, stack };
  }
  return null;
}

export function tally(bays: Bay[]) {
  let stacks = 0;
  let units = 0;
  const by = new Map<string, number>();
  for (const bay of bays) {
    for (const slot of bay.slots) {
      if (!slot || slot.kind === "scale") continue;
      stacks += 1;
      for (const layer of slot.layers) {
        units += layer.height;
        const key = layer.unknown ? "unknown" : layer.product;
        by.set(key, (by.get(key) ?? 0) + layer.height);
      }
    }
  }
  return { stacks, units, by };
}

export function stackMatches(stack: Stack, bay: Bay, filter: FilterId, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (stack.kind === "scale") {
    if (filter !== "all") return false;
    if (!q) return true;
    return `${bay.title} ${bay.code} ${bay.detail ?? ""} scale`.toLowerCase().includes(q);
  }
  const productHit = stack.layers.some((layer) => {
    if (filter === "all") return true;
    if (filter === "unknown") return layer.unknown;
    return !layer.unknown && layer.product === filter;
  });
  if (!productHit) return false;
  if (!q) return true;
  const blob = [
    bay.title,
    bay.detail ?? "",
    bay.code,
    zoneName(bay.zone),
    stack.note,
    ...stack.layers.flatMap((layer) => [layer.label, productName(layer.product), kindName(stack.kind)]),
  ]
    .join(" ")
    .toLowerCase();
  return blob.includes(q);
}

function clone(bays: Bay[]): Bay[] {
  return structuredClone(bays);
}

export function mapStack(bays: Bay[], id: string, recipe: (stack: Stack) => Stack): Bay[] {
  return bays.map((bay) => ({
    ...bay,
    slots: bay.slots.map((slot) => (slot && slot.id === id ? normalizeStack(recipe(slot)) : slot)),
  }));
}

export function mapBay(bays: Bay[], id: string, recipe: (bay: Bay) => Bay): Bay[] {
  return bays.map((bay) => (bay.id === id ? recipe(bay) : bay));
}

export function moveInGrid(bays: Bay[], stackId: string, toBayId: string, toIndex: number): Bay[] | null {
  const next = clone(bays);
  let fromBay = -1;
  let fromSlot = -1;
  for (let i = 0; i < next.length; i += 1) {
    const slot = next[i].slots.findIndex((entry) => entry?.id === stackId);
    if (slot >= 0) {
      fromBay = i;
      fromSlot = slot;
      break;
    }
  }
  if (fromBay < 0) return null;
  const target = next.find((bay) => bay.id === toBayId);
  if (!target || toIndex < 0 || toIndex >= target.slots.length) return null;
  const source = next[fromBay];
  if (source.id === target.id && fromSlot === toIndex) return null;
  const moving = source.slots[fromSlot];
  const displaced = target.slots[toIndex];
  if (moving && target.zone !== "lane") {
    delete moving.x;
    delete moving.y;
  }
  target.slots[toIndex] = moving;
  source.slots[fromSlot] = displaced;
  if (source.zone === "lane") source.slots = source.slots.filter((slot) => slot != null);
  return next;
}

export function placeInBay(bays: Bay[], stackId: string, toBayId: string): Bay[] | null {
  const hit = findStack(bays, stackId);
  if (!hit || hit.bay.id === toBayId) return null;
  const next = clone(bays);
  const source = next.find((bay) => bay.id === hit.bay.id);
  const target = next.find((bay) => bay.id === toBayId);
  if (!source || !target) return null;
  const stack = source.slots[hit.index];
  source.slots[hit.index] = null;
  if (source.zone === "lane") source.slots = source.slots.filter((slot) => slot != null);
  if (target.zone === "lane" && stack) {
    return tuckInLane(target, stack) ? next : null;
  }
  const open = target.slots.findIndex((slot) => slot === null);
  if (open >= 0) {
    target.slots[open] = stack;
    return next;
  }
  if (target.slots.length >= MAX_SLOTS) return null;
  target.slots.push(stack);
  return next;
}

export function removeStack(bays: Bay[], stackId: string): Bay[] {
  return bays.map((bay) => ({
    ...bay,
    slots: bay.slots.map((slot) => (slot?.id === stackId ? null : slot)),
  }));
}

export function addStackToBay(bays: Bay[], bayId: string, stack: Stack): Bay[] | null {
  const next = clone(bays);
  const target = next.find((bay) => bay.id === bayId);
  if (!target) return null;
  const open = target.slots.findIndex((slot) => slot === null);
  const clean = normalizeStack(stack);
  if (target.zone === "lane") return tuckInLane(target, clean) ? next : null;
  if (open >= 0) {
    target.slots[open] = clean;
    return next;
  }
  if (target.slots.length >= MAX_SLOTS) return null;
  target.slots.push(clean);
  return next;
}

export function addCell(bays: Bay[], bayId: string): Bay[] | null {
  const next = clone(bays);
  const target = next.find((bay) => bay.id === bayId);
  if (!target || target.slots.length >= MAX_SLOTS) return null;
  target.slots.push(null);
  return next;
}

function tuckInLane(lane: Bay, stack: Stack): boolean {
  const held = lane.slots.filter((slot) => slot != null);
  if (held.length >= 24) return false;
  const spot = spotInLane(stack.x, stack.y) ?? {
    x: 18 + (held.length % 3) * 32,
    y: 14 + (held.length % 5) * 16,
  };
  stack.x = spot.x;
  stack.y = spot.y;
  lane.slots = [...held, stack];
  return true;
}

export function parkInLane(bays: Bay[], stackId: string, x: number, y: number): Bay[] | null {
  const next = clone(bays);
  let fromBay = -1;
  let fromSlot = -1;
  for (let i = 0; i < next.length; i += 1) {
    const slot = next[i].slots.findIndex((entry) => entry?.id === stackId);
    if (slot >= 0) {
      fromBay = i;
      fromSlot = slot;
      break;
    }
  }
  if (fromBay < 0) return null;
  const lane = next.find((bay) => bay.zone === "lane");
  if (!lane) return null;
  const spot = spotInLane(x, y);
  if (!spot) return null;
  const source = next[fromBay];
  const moving = source.slots[fromSlot];
  if (!moving) return null;
  moving.x = spot.x;
  moving.y = spot.y;
  if (source.id === lane.id) return next;
  source.slots[fromSlot] = null;
  if (source.zone === "lane") source.slots = source.slots.filter((slot) => slot != null);
  const held = lane.slots.filter((slot) => slot != null);
  if (held.length >= 24) return null;
  lane.slots = [...held, moving];
  return next;
}

function alignSlots(slots: (Stack | null)[], zone: Zone): (Stack | null)[] {
  if (zone === "lane") return slots.filter((slot) => slot != null).slice(0, 24);
  const next = slots.slice(0, MAX_SLOTS);
  while (next.length > 5 && next[next.length - 1] == null) next.pop();
  const size = Math.min(MAX_SLOTS, Math.max(next.length, 5));
  while (next.length < size) next.push(null);
  return next;
}

function cleanBay(value: unknown): Bay | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Partial<Bay>;
  if (typeof raw.id !== "string" || typeof raw.title !== "string" || !Array.isArray(raw.slots)) {
    return null;
  }
  const zone = typeof raw.zone === "string" && ZONE_SET.has(raw.zone) ? (raw.zone as Zone) : "east";
  const rail =
    raw.rail === "neutral" || (typeof raw.rail === "string" && isProduct(raw.rail)) ? raw.rail : "neutral";
  const railRight =
    typeof raw.railRight === "string" && isProduct(raw.railRight) ? raw.railRight : undefined;
  const slots = alignSlots(
    raw.slots.slice(0, zone === "lane" ? 24 : MAX_SLOTS).map((slot) => {
      if (slot == null) return null;
      if (typeof slot !== "object" || typeof (slot as Stack).id !== "string") return null;
      const candidate = slot as Stack;
      return normalizeStack({
        id: candidate.id,
        kind: candidate.kind,
        note: candidate.note ?? "",
        layers: Array.isArray(candidate.layers) ? candidate.layers : [],
        x: candidate.x,
        y: candidate.y,
      });
    }),
    zone,
  );
  const code = typeof raw.code === "string" ? raw.code.replace(/^[LR]/i, "").slice(0, 6) : "—";
  return {
    id: raw.id,
    zone,
    code,
    title: raw.title.slice(0, 64),
    detail: typeof raw.detail === "string" ? raw.detail.slice(0, 400) : undefined,
    rail,
    railRight,
    slots,
  };
}

export function sanitizeLayout(input: unknown): Bay[] | null {
  if (!input || typeof input !== "object") return null;
  const raw = input as { version?: unknown; bays?: unknown };
  if (raw.version !== 1 || !Array.isArray(raw.bays) || raw.bays.length === 0) return null;
  const bays = raw.bays.map(cleanBay);
  if (bays.some((bay) => bay == null)) return null;
  const ids = new Set<string>();
  for (const bay of bays as Bay[]) {
    if (ids.has(bay.id)) return null;
    ids.add(bay.id);
    const stackIds = new Set<string>();
    for (const slot of bay.slots) {
      if (!slot) continue;
      if (stackIds.has(slot.id)) return null;
      stackIds.add(slot.id);
    }
  }
  const padding = new Set(["e19", "r14", "r15", "r16", "r17", "r18"]);
  const kept = (bays as Bay[]).filter((bay) => {
    if (!padding.has(bay.id)) return true;
    return bay.slots.some((slot) => slot != null);
  });
  const withScale = ensureScale(kept);
  let left = 1;
  let right = 9;
  return withScale.map((bay) => {
    if (bay.zone === "west" || bay.zone === "treater") return { ...bay, code: String(left++) };
    if (bay.zone === "east") return { ...bay, code: String(right++) };
    return bay;
  });
}

function ensureScale(bays: Bay[]): Bay[] {
  const next = bays.map((bay) => ({ ...bay, slots: bay.slots.slice() }));
  const hasScale = next.some((bay) => bay.slots.some((slot) => slot?.kind === "scale" || slot?.id === "yard-scale"));
  const east = next.filter((bay) => bay.zone === "east");
  if (east.length < 13) {
    const slots: (Stack | null)[] = [hasScale ? null : scalePiece(), null, null, null, null];
    next.push({
      id: "r21",
      zone: "east",
      code: "21",
      title: "Scale",
      detail: "Drag the scale into any open section.",
      rail: "neutral",
      slots,
    });
    return next;
  }
  if (!hasScale) {
    const row = [...next].reverse().find((bay) => bay.zone === "east");
    if (row) {
      const index = row.slots.findIndex((slot) => slot == null);
      if (index >= 0) row.slots[index] = scalePiece();
    }
  }
  return next;
}

function scalePiece(): Stack {
  return {
    id: "yard-scale",
    kind: "scale",
    note: "",
    layers: [{ label: "Scale", product: "awp", height: 1, unknown: false }],
  };
}
