import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import {
  STORAGE_KEY,
  addCell,
  addStackToBay,
  createSurvey,
  mapBay,
  mapStack,
  moveInGrid,
  placeInBay,
  parkInLane,
  removeStack,
  sanitizeLayout,
  type Bay,
  type Stack,
} from "@/lib/yard/data";

const DIRTY_KEY = "yard-floor-dirty";

type State = {
  bays: Bay[];
  past: Bay[][];
  future: Bay[][];
  ready: boolean;
};

type Action =
  | { type: "hydrate"; bays: Bay[] }
  | { type: "commit"; bays: Bay[] }
  | { type: "replace"; bays: Bay[] }
  | { type: "undo" }
  | { type: "redo" };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "hydrate":
      return { bays: action.bays, past: [], future: [], ready: true };
    case "commit":
      return {
        ...state,
        past: [...state.past, state.bays].slice(-40),
        future: [],
        bays: action.bays,
      };
    case "replace":
      return { ...state, future: [], bays: action.bays };
    case "undo": {
      const prev = state.past.at(-1);
      if (!prev) return state;
      return {
        ...state,
        past: state.past.slice(0, -1),
        future: [state.bays, ...state.future],
        bays: prev,
      };
    }
    case "redo": {
      const next = state.future[0];
      if (!next) return state;
      return {
        ...state,
        past: [...state.past, state.bays],
        future: state.future.slice(1),
        bays: next,
      };
    }
    default:
      return state;
  }
}

export function useYard() {
  const [state, dispatch] = useReducer(reducer, undefined, () => ({
    bays: createSurvey(),
    past: [],
    future: [],
    ready: false,
  }));
  const coalesce = useRef<string | null>(null);
  const skipDirty = useRef(false);
  const seen = useRef(false);
  const [unpublished, setUnpublished] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = sanitizeLayout(JSON.parse(raw) as unknown);
        if (parsed) {
          dispatch({ type: "hydrate", bays: parsed });
          return;
        }
      }
    } catch {
      /* keep the survey */
    }
    dispatch({ type: "hydrate", bays: createSurvey() });
  }, []);

  useEffect(() => {
    if (!state.ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ version: 1, bays: state.bays }));
    if (!seen.current) {
      seen.current = true;
      setUnpublished(localStorage.getItem(DIRTY_KEY) === "1");
      return;
    }
    if (skipDirty.current) {
      skipDirty.current = false;
      localStorage.removeItem(DIRTY_KEY);
      setUnpublished(false);
      return;
    }
    localStorage.setItem(DIRTY_KEY, "1");
    setUnpublished(true);
  }, [state.bays, state.ready]);

  const apply = useCallback((next: Bay[] | null, key?: string) => {
    if (!next) return false;
    if (key && coalesce.current === key) {
      dispatch({ type: "replace", bays: next });
    } else {
      coalesce.current = key ?? null;
      dispatch({ type: "commit", bays: next });
    }
    return true;
  }, []);

  const patchStack = useCallback(
    (id: string, recipe: (stack: Stack) => Stack, key?: string) => {
      apply(mapStack(state.bays, id, recipe), key);
    },
    [apply, state.bays],
  );

  const patchBay = useCallback(
    (id: string, recipe: (bay: Bay) => Bay, key?: string) => {
      apply(mapBay(state.bays, id, recipe), key);
    },
    [apply, state.bays],
  );

  const moveStack = useCallback(
    (stackId: string, bayId: string, index: number) => {
      coalesce.current = null;
      return apply(moveInGrid(state.bays, stackId, bayId, index));
    },
    [apply, state.bays],
  );

  const parkInLaneAt = useCallback(
    (stackId: string, x: number, y: number) => {
      coalesce.current = null;
      return apply(parkInLane(state.bays, stackId, x, y));
    },
    [apply, state.bays],
  );

  const sendToBay = useCallback(
    (stackId: string, bayId: string) => {
      coalesce.current = null;
      return apply(placeInBay(state.bays, stackId, bayId));
    },
    [apply, state.bays],
  );

  const deleteStack = useCallback(
    (stackId: string) => {
      coalesce.current = null;
      apply(removeStack(state.bays, stackId));
    },
    [apply, state.bays],
  );

  const placeNew = useCallback(
    (bayId: string, stack: Stack) => {
      coalesce.current = null;
      return apply(addStackToBay(state.bays, bayId, stack));
    },
    [apply, state.bays],
  );

  const growBay = useCallback(
    (bayId: string) => {
      coalesce.current = null;
      return apply(addCell(state.bays, bayId));
    },
    [apply, state.bays],
  );

  const undo = useCallback(() => {
    coalesce.current = null;
    dispatch({ type: "undo" });
  }, []);

  const redo = useCallback(() => {
    coalesce.current = null;
    dispatch({ type: "redo" });
  }, []);

  const reset = useCallback(() => {
    coalesce.current = null;
    apply(createSurvey());
  }, [apply]);

  const replaceAll = useCallback(
    (bays: Bay[]) => {
      coalesce.current = null;
      apply(bays);
    },
    [apply],
  );

  const adopt = useCallback((bays: Bay[]) => {
    coalesce.current = null;
    skipDirty.current = true;
    dispatch({ type: "hydrate", bays });
  }, []);

  const markSaved = useCallback(() => {
    localStorage.removeItem(DIRTY_KEY);
    setUnpublished(false);
  }, []);

  return {
    bays: state.bays,
    ready: state.ready,
    unpublished,
    canUndo: state.past.length > 0,
    canRedo: state.future.length > 0,
    patchStack,
    patchBay,
    moveStack,
    parkInLaneAt,
    sendToBay,
    deleteStack,
    placeNew,
    growBay,
    undo,
    redo,
    reset,
    replaceAll,
    adopt,
    markSaved,
  };
}
