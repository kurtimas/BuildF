import { o as __toESM } from "../_runtime.mjs";
import { b as require_jsx_runtime, q as require_react } from "../_libs/@tanstack/react-router+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { C as tally, S as stackMatches, _ as productName, a as createStack, b as sanitizeLayout, c as kindName, d as markColor, f as markStyle, g as placeInBay, h as parkInLane, i as addStackToBay, l as mapBay, m as moveInGrid, n as STORAGE_KEY, o as createSurvey, p as maxHeight, r as addCell, s as findStack, t as PRODUCTS, u as mapStack, v as railColor, x as stackLabel, y as removeStack } from "./data-DgpBTTGj.mjs";
import { a as Sun, c as Redo2, d as Minus, f as GripVertical, l as Plus, n as Upload, o as Search, p as Download, r as Undo2, s as RotateCcw, t as X, u as Moon } from "../_libs/lucide-react.mjs";
import { t as clsx } from "../_libs/clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-BgeWgvUu.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
var DIRTY_KEY = "yard-floor-dirty";
function reducer(state, action) {
	switch (action.type) {
		case "hydrate": return {
			bays: action.bays,
			past: [],
			future: [],
			ready: true
		};
		case "commit": return {
			...state,
			past: [...state.past, state.bays].slice(-40),
			future: [],
			bays: action.bays
		};
		case "replace": return {
			...state,
			future: [],
			bays: action.bays
		};
		case "undo": {
			const prev = state.past.at(-1);
			if (!prev) return state;
			return {
				...state,
				past: state.past.slice(0, -1),
				future: [state.bays, ...state.future],
				bays: prev
			};
		}
		case "redo": {
			const next = state.future[0];
			if (!next) return state;
			return {
				...state,
				past: [...state.past, state.bays],
				future: state.future.slice(1),
				bays: next
			};
		}
		default: return state;
	}
}
function useYard() {
	const [state, dispatch] = (0, import_react.useReducer)(reducer, void 0, () => ({
		bays: createSurvey(),
		past: [],
		future: [],
		ready: false
	}));
	const coalesce = (0, import_react.useRef)(null);
	const skipDirty = (0, import_react.useRef)(false);
	const seen = (0, import_react.useRef)(false);
	const [unpublished, setUnpublished] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			if (raw) {
				const parsed = sanitizeLayout(JSON.parse(raw));
				if (parsed) {
					dispatch({
						type: "hydrate",
						bays: parsed
					});
					return;
				}
			}
		} catch {}
		dispatch({
			type: "hydrate",
			bays: createSurvey()
		});
	}, []);
	(0, import_react.useEffect)(() => {
		if (!state.ready) return;
		localStorage.setItem(STORAGE_KEY, JSON.stringify({
			version: 1,
			bays: state.bays
		}));
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
	const apply = (0, import_react.useCallback)((next, key) => {
		if (!next) return false;
		if (key && coalesce.current === key) dispatch({
			type: "replace",
			bays: next
		});
		else {
			coalesce.current = key ?? null;
			dispatch({
				type: "commit",
				bays: next
			});
		}
		return true;
	}, []);
	const patchStack = (0, import_react.useCallback)((id, recipe, key) => {
		apply(mapStack(state.bays, id, recipe), key);
	}, [apply, state.bays]);
	const patchBay = (0, import_react.useCallback)((id, recipe, key) => {
		apply(mapBay(state.bays, id, recipe), key);
	}, [apply, state.bays]);
	const moveStack = (0, import_react.useCallback)((stackId, bayId, index) => {
		coalesce.current = null;
		return apply(moveInGrid(state.bays, stackId, bayId, index));
	}, [apply, state.bays]);
	const parkInLaneAt = (0, import_react.useCallback)((stackId, x, y) => {
		coalesce.current = null;
		return apply(parkInLane(state.bays, stackId, x, y));
	}, [apply, state.bays]);
	const sendToBay = (0, import_react.useCallback)((stackId, bayId) => {
		coalesce.current = null;
		return apply(placeInBay(state.bays, stackId, bayId));
	}, [apply, state.bays]);
	const deleteStack = (0, import_react.useCallback)((stackId) => {
		coalesce.current = null;
		apply(removeStack(state.bays, stackId));
	}, [apply, state.bays]);
	const placeNew = (0, import_react.useCallback)((bayId, stack) => {
		coalesce.current = null;
		return apply(addStackToBay(state.bays, bayId, stack));
	}, [apply, state.bays]);
	const growBay = (0, import_react.useCallback)((bayId) => {
		coalesce.current = null;
		return apply(addCell(state.bays, bayId));
	}, [apply, state.bays]);
	const undo = (0, import_react.useCallback)(() => {
		coalesce.current = null;
		dispatch({ type: "undo" });
	}, []);
	const redo = (0, import_react.useCallback)(() => {
		coalesce.current = null;
		dispatch({ type: "redo" });
	}, []);
	const reset = (0, import_react.useCallback)(() => {
		coalesce.current = null;
		apply(createSurvey());
	}, [apply]);
	const replaceAll = (0, import_react.useCallback)((bays) => {
		coalesce.current = null;
		apply(bays);
	}, [apply]);
	const adopt = (0, import_react.useCallback)((bays) => {
		coalesce.current = null;
		skipDirty.current = true;
		dispatch({
			type: "hydrate",
			bays
		});
	}, []);
	const markSaved = (0, import_react.useCallback)(() => {
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
		markSaved
	};
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var loadPublishedFloor = createServerFn({ method: "GET" }).handler(createSsrRpc("5158621a2dcaa8d6b0ff9f125dd22503660e79cbead54c1d3536b829224eb16b"));
var savePublishedFloor = createServerFn({ method: "POST" }).validator((input) => ({
	password: typeof input?.password === "string" ? input.password : "",
	layout: typeof input?.layout === "string" ? input.layout : ""
})).handler(createSsrRpc("31bcd79e4b3d4eb57539aeeadf1bba7ba4fbae9537f71f6f414b71b5679a296f"));
function YardApp() {
	const yard = useYard();
	const { bays } = yard;
	const [selectedId, setSelectedId] = (0, import_react.useState)(null);
	const [query, setQuery] = (0, import_react.useState)("");
	const [filter, setFilter] = (0, import_react.useState)("all");
	const [carrying, setCarrying] = (0, import_react.useState)(false);
	const [confirmReset, setConfirmReset] = (0, import_react.useState)(false);
	const [status, setStatus] = (0, import_react.useState)("");
	const [live, setLive] = (0, import_react.useState)("");
	const [publishOpen, setPublishOpen] = (0, import_react.useState)(false);
	const [password, setPassword] = (0, import_react.useState)("");
	const [publishing, setPublishing] = (0, import_react.useState)(false);
	const [sharedAt, setSharedAt] = (0, import_react.useState)(null);
	const [hasPassword, setHasPassword] = (0, import_react.useState)(false);
	const [ghost, setGhost] = (0, import_react.useState)(null);
	const [over, setOver] = (0, import_react.useState)(null);
	const [snapCol, setSnapCol] = (0, import_react.useState)(null);
	const drag = (0, import_react.useRef)(null);
	const overRef = (0, import_react.useRef)(null);
	const fileRef = (0, import_react.useRef)(null);
	const loadedShared = (0, import_react.useRef)(false);
	const counts = tally(bays);
	const selected = selectedId ? findStack(bays, selectedId) : null;
	const ghostStack = ghost ? findStack(bays, ghost.id)?.stack : null;
	(0, import_react.useEffect)(() => {
		if (selectedId && !findStack(bays, selectedId)) setSelectedId(null);
	}, [bays, selectedId]);
	(0, import_react.useEffect)(() => {
		if (!status) return;
		const timer = window.setTimeout(() => setStatus(""), 4500);
		return () => window.clearTimeout(timer);
	}, [status]);
	(0, import_react.useEffect)(() => {
		if (!yard.ready || loadedShared.current) return;
		loadedShared.current = true;
		loadPublishedFloor().then((result) => {
			setHasPassword(result.hasPassword);
			if (!result.layout) return;
			setSharedAt(result.updatedAt);
			if (localStorage.getItem("yard-floor-dirty") === "1") return;
			let next = null;
			try {
				next = sanitizeLayout(JSON.parse(result.layout));
			} catch {
				next = null;
			}
			if (next) yard.adopt(next);
		}).catch(() => {
			loadedShared.current = false;
		});
	}, [yard.ready, yard.adopt]);
	async function publishFloor(event) {
		event.preventDefault();
		setPublishing(true);
		try {
			const result = await savePublishedFloor({ data: {
				password,
				layout: JSON.stringify({
					version: 1,
					bays
				})
			} });
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
				next = result.layout ? sanitizeLayout(JSON.parse(result.layout)) : null;
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
	(0, import_react.useEffect)(() => {
		function onKey(event) {
			const target = event.target;
			const typing = target && [
				"INPUT",
				"TEXTAREA",
				"SELECT"
			].includes(target.tagName);
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
	function rememberOver(next) {
		overRef.current = next;
		setOver(next);
	}
	function drop(stackId, bayId, index, at) {
		const hit = findStack(bays, stackId);
		const target = bays.find((bay) => bay.id === bayId);
		if (!hit || !target) return;
		if (target.zone === "lane" && at) {
			if (!yard.parkInLaneAt(stackId, at.x, at.y)) return;
			setLive(`Parked ${stackLabel(hit.stack)} in the forklift lane.`);
			setSelectedId(stackId);
			setCarrying(false);
			return;
		}
		const displaced = target.slots[index];
		if (!yard.moveStack(stackId, bayId, index)) return;
		const name = stackLabel(hit.stack);
		if (displaced && displaced.id !== stackId) setLive(`Swapped ${name} with ${stackLabel(displaced)} in ${target.title}, cell ${index + 1}.`);
		else setLive(`Moved ${name} to ${target.title}, cell ${index + 1}.`);
		setSelectedId(stackId);
		setCarrying(false);
	}
	function onPointerDown(event, id) {
		if (event.button !== 0) return;
		drag.current = {
			id,
			pid: event.pointerId,
			x: event.clientX,
			y: event.clientY,
			active: false
		};
		event.currentTarget.setPointerCapture(event.pointerId);
	}
	function snapTarget(x, y) {
		const columns = [...document.querySelectorAll("[data-col]")];
		let column = null;
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
			const rect = (column.querySelector(".lane-floor") ?? column).getBoundingClientRect();
			if (rect.width < 1 || rect.height < 1) return null;
			const xPct = (x - rect.left) / rect.width * 100;
			const yPct = (y - rect.top) / rect.height * 100;
			if (xPct < -8 || xPct > 108 || yPct < -8 || yPct > 108) return null;
			return {
				col: "lane",
				over: {
					bayId: "lane",
					index: -1,
					x: Math.min(96, Math.max(4, xPct)),
					y: Math.min(96, Math.max(4, yPct))
				},
				x,
				y
			};
		}
		const rows = [...column.querySelectorAll("[data-row]")];
		let best = null;
		for (const el of rows) {
			const rect = (el.querySelector(".sheet-stacks") ?? el).getBoundingClientRect();
			const mid = rect.top + rect.height / 2;
			const dist = Math.abs(y - mid);
			if (!best || dist < best.dist) best = {
				el,
				dist
			};
		}
		if (!best) return null;
		const slots = [...best.el.querySelectorAll("[data-slot]")];
		let slot = null;
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
		const bandRect = (best.el.querySelector(".sheet-stacks") ?? slot).getBoundingClientRect();
		const slotRect = slot.getBoundingClientRect();
		return {
			col: column.dataset.col ?? null,
			over: {
				bayId: slot.dataset.bay,
				index: Number(slot.dataset.index)
			},
			x: slotRect.left + slotRect.width / 2,
			y: bandRect.top + bandRect.height / 2
		};
	}
	function onPointerMove(event) {
		const current = drag.current;
		if (!current || event.pointerId !== current.pid) return;
		const distance = Math.hypot(event.clientX - current.x, event.clientY - current.y);
		if (!current.active && distance < 8) return;
		current.active = true;
		const snap = snapTarget(event.clientX, event.clientY);
		setGhost({
			id: current.id,
			x: snap?.x ?? event.clientX,
			y: snap?.y ?? event.clientY
		});
		rememberOver(snap?.over ?? null);
		setSnapCol(snap?.col ?? null);
	}
	function clearDrag() {
		drag.current = null;
		setGhost(null);
		rememberOver(null);
		setSnapCol(null);
	}
	function onPointerUp(event, slot) {
		const current = drag.current;
		if (!current || event.pointerId !== current.pid) return;
		const wasDrag = current.active;
		const target = overRef.current;
		clearDrag();
		if (wasDrag) {
			if (target) drop(current.id, target.bayId, target.index, target.x != null && target.y != null ? {
				x: target.x,
				y: target.y
			} : void 0);
			return;
		}
		if (carrying && selectedId) {
			if (selectedId !== current.id) drop(selectedId, slot.bayId, slot.index);
			return;
		}
		setSelectedId((prev) => prev === current.id ? null : current.id);
	}
	function onPointerCancel(event) {
		const current = drag.current;
		if (!current || event.pointerId !== current.pid) return;
		clearDrag();
	}
	function sendSelected(bayId) {
		if (!selected) return;
		const name = stackLabel(selected.stack);
		const target = bays.find((bay) => bay.id === bayId);
		if (!yard.sendToBay(selected.stack.id, bayId)) {
			setStatus(target ? `${target.title} is full.` : "That aisle is not on the floor.");
			return;
		}
		setLive(`Moved ${name} to ${target?.title ?? "another aisle"}.`);
		setCarrying(false);
		document.getElementById(`bay-${bayId}`)?.scrollIntoView({ block: "nearest" });
	}
	function exportLayout() {
		const blob = new Blob([JSON.stringify({
			version: 1,
			bays
		}, null, 2)], { type: "application/json" });
		const url = URL.createObjectURL(blob);
		const link = document.createElement("a");
		link.href = url;
		link.download = "yard-floor.json";
		link.click();
		URL.revokeObjectURL(url);
		setStatus("Downloaded this floor as yard-floor.json.");
	}
	function importLayout(file) {
		const reader = new FileReader();
		reader.onload = () => {
			try {
				const parsed = sanitizeLayout(JSON.parse(String(reader.result)));
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
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
			confirmReset ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "btn btn-quiet",
				onClick: () => setConfirmReset(true),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
					className: "size-4",
					"aria-hidden": true
				}), "Reset"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "btn btn-quiet",
				onClick: exportLayout,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
					className: "size-4",
					"aria-hidden": true
				}), "Export"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				className: "btn btn-quiet",
				onClick: () => fileRef.current?.click(),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
					className: "size-4",
					"aria-hidden": true
				}), "Import"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn btn-quiet",
				onClick: () => window.print(),
				children: "Print"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn btn-primary",
				onClick: () => setPublishOpen((open) => !open),
				children: "Save to server"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "btn btn-quiet",
				onClick: loadShared,
				disabled: !sharedAt,
				children: "Load shared"
			})
		] });
	}
	const anyMatch = bays.some((bay) => bay.slots.some((slot) => slot && stackMatches(slot, bay, filter, query)));
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "min-h-screen bg-paper text-ink",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("mx-auto max-w-7xl px-4 py-3 pb-28 sm:px-6 sm:py-5", selected && "max-lg:pb-64"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
						className: "mb-3 flex flex-col gap-3 border-b border-line pb-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-end gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
										src: "/iemc-logo.png",
										alt: "IEMC",
										className: "h-12 w-auto shrink-0 sm:h-16 lg:h-20"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
										className: "pb-1 font-display text-3xl leading-none tracking-tight text-ink sm:pb-1.5 sm:text-4xl",
										children: "Building F"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-start gap-2 lg:items-end",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "font-mono text-sm tabular-nums text-ink",
										children: [
											counts.units,
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted",
												children: "units"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted",
												children: " · "
											}),
											counts.stacks,
											" ",
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-muted",
												children: "stacks"
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "no-print flex flex-wrap gap-2",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ThemeSwitch, {}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												className: "btn btn-quiet",
												"aria-label": "Undo",
												disabled: !yard.canUndo,
												onClick: yard.undo,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, {
													className: "size-4",
													"aria-hidden": true
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "hidden sm:inline",
													children: "Undo"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
												type: "button",
												className: "btn btn-quiet",
												"aria-label": "Redo",
												disabled: !yard.canRedo,
												onClick: yard.redo,
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Redo2, {
													className: "size-4",
													"aria-hidden": true
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "hidden sm:inline",
													children: "Redo"
												})]
											}),
											confirmReset ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "btn btn-danger",
												onClick: () => {
													yard.reset();
													setSelectedId(null);
													setCarrying(false);
													setConfirmReset(false);
													setStatus("Restored the survey layout.");
												},
												children: "Restore survey"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "btn btn-quiet",
												onClick: () => setConfirmReset(false),
												children: "Cancel"
											})] }) : null,
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "hidden max-w-xl flex-wrap justify-end gap-2 lg:flex",
												children: extraTools()
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
												className: "tool-more lg:hidden",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
													className: "btn btn-quiet",
													children: "More"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "tool-more-panel",
													children: extraTools()
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												ref: fileRef,
												className: "sr-only",
												type: "file",
												accept: "application/json,.json",
												"aria-label": "Import layout file",
												onChange: (event) => {
													const file = event.target.files?.[0];
													event.target.value = "";
													if (file) importLayout(file);
												}
											})
										]
									})]
								})]
							}),
							publishOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
								className: "no-print flex flex-wrap items-end gap-2",
								onSubmit: publishFloor,
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "block min-w-52 text-xs font-semibold text-ink-soft",
										children: [hasPassword ? "Floor password" : "Choose a floor password", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											className: "field mt-1",
											type: "password",
											name: "floor-password",
											value: password,
											autoComplete: "current-password",
											onChange: (event) => setPassword(event.target.value)
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "submit",
										className: "btn btn-primary",
										disabled: publishing || password.trim().length < 4,
										children: publishing ? "Saving…" : "Save to server"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										type: "button",
										className: "btn btn-quiet",
										onClick: () => {
											setPublishOpen(false);
											setPassword("");
										},
										children: "Cancel"
									})
								]
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "no-print flex flex-col gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, {
											className: "pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted",
											"aria-hidden": true
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											className: "field pr-10 pl-9",
											value: query,
											onChange: (event) => setQuery(event.target.value),
											placeholder: "Search product, aisle, or note",
											"aria-label": "Search the floor"
										}),
										query ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											className: "absolute top-1/2 right-2 grid size-8 -translate-y-1/2 place-items-center text-muted",
											"aria-label": "Clear search",
											onClick: () => setQuery(""),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
												className: "size-4",
												"aria-hidden": true
											})
										}) : null
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "filter-row flex flex-wrap gap-2",
									role: "group",
									"aria-label": "Filter by product",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
											pressed: filter === "all",
											label: "All",
											count: counts.units,
											onClick: () => setFilter("all")
										}),
										PRODUCTS.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
											pressed: filter === product.id,
											label: product.name,
											count: counts.by.get(product.id) ?? 0,
											swatch: `var(--color-swatch-${product.id})`,
											onClick: () => setFilter((prev) => prev === product.id ? "all" : product.id)
										}, product.id)),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterChip, {
											pressed: filter === "unknown",
											label: "Unknown",
											count: counts.by.get("unknown") ?? 0,
											swatch: "var(--color-swatch-mixed)",
											onClick: () => setFilter((prev) => prev === "unknown" ? "all" : "unknown")
										})
									]
								})]
							}),
							status ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-ink-soft",
								children: status
							}) : null,
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "no-print text-xs text-muted",
								children: yard.unpublished ? "These edits are only in this browser. Save to the server with the password when you want everyone else to see them." : "Edits stay in this browser until you save them to the server with the password."
							})
						]
					}),
					carrying && selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "no-print mb-4 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-line bg-sheet px-3 py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-ink",
							children: [
								"Tap a cell to drop ",
								stackLabel(selected.stack),
								". A filled cell swaps."
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-quiet",
							onClick: () => setCarrying(false),
							children: "Cancel"
						})]
					}) : null,
					selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "mobile-carry no-print mb-4 rounded-lg border border-line bg-sheet p-3 lg:hidden",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "truncate text-sm font-semibold",
								children: stackLabel(selected.stack)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted",
								children: [
									selected.bay.title,
									" · cell ",
									selected.index + 1,
									" · ",
									kindName(selected.stack.kind)
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "mt-3 block text-xs font-semibold text-ink-soft",
								htmlFor: "mobile-aisle",
								children: "Send to aisle"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								id: "mobile-aisle",
								className: "field mt-1",
								value: selected.bay.id,
								onChange: (event) => sendSelected(event.target.value),
								children: bays.map((bay) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: bay.id,
									children: bay.zone === "lane" ? "Forklift lane" : `Row ${bay.code}`
								}, bay.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn btn-primary flex-1",
									onClick: () => setCarrying(true),
									children: "Place on grid"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "btn btn-quiet flex-1",
									onClick: () => document.getElementById("stack-editor")?.scrollIntoView({ block: "start" }),
									children: "Edit"
								})]
							})
						]
					}) : null,
					!anyMatch ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mb-4 text-sm text-muted",
						children: "Nothing on the floor matches that filter."
					}) : null,
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("nav", {
						className: "floor-jumps no-print",
						"aria-label": "Jump to a side of the floor",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "#rows-west",
								children: "Rows 1–8"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "#forklift-lane",
								children: "Lane"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: "#rows-east",
								children: "Rows 9–21"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "shell",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("sheet select-none", ghost && "cursor-grabbing"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FloorLegend, {}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									id: "rows-west",
									"data-col": "west",
									className: cn("sheet-col", snapCol === "west" && "is-snap-col"),
									"aria-label": "Rows 1 to 8",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "sheet-col-title",
											children: "Rows 1–8"
										}),
										bays.filter((bay) => bay.zone === "west").map((bay) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BayRow, {
											bay,
											edge: "start",
											filter,
											query,
											selectedId,
											carrying,
											draggingId: ghost?.id ?? null,
											over,
											onPointerDown,
											onPointerMove,
											onPointerUp,
											onPointerCancel,
											onSelect: (id) => setSelectedId((prev) => prev === id ? null : id),
											onEmptyClick: (index) => {
												if (carrying && selectedId) drop(selectedId, bay.id, index);
											},
											onGrow: () => {
												if (!yard.growBay(bay.id)) setStatus("This row cannot take another cell.");
											},
											onNote: (detail) => yard.patchBay(bay.id, (current) => ({
												...current,
												detail: detail.trim() || void 0
											}))
										}, bay.id)),
										bays.filter((bay) => bay.zone === "treater").map((bay) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BayRow, {
											bay,
											edge: "start",
											tall: true,
											filter,
											query,
											selectedId,
											carrying,
											draggingId: ghost?.id ?? null,
											over,
											onPointerDown,
											onPointerMove,
											onPointerUp,
											onPointerCancel,
											onSelect: (id) => setSelectedId((prev) => prev === id ? null : id),
											onEmptyClick: (index) => {
												if (carrying && selectedId) drop(selectedId, bay.id, index);
											},
											onGrow: () => yard.growBay(bay.id),
											onNote: (detail) => yard.patchBay(bay.id, (current) => ({
												...current,
												detail: detail.trim() || void 0
											}))
										}, bay.id))
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									id: "forklift-lane",
									"data-col": "lane",
									"aria-label": "Forklift lane",
									className: cn("sheet-lane", snapCol === "lane" && "is-snap-col"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "sheet-lane-label",
										children: "Forklift lane · limbo"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: cn("lane-floor", snapCol === "lane" && "is-hot"),
										onClick: (event) => {
											if (!carrying || !selectedId) return;
											if (event.target.closest(".lane-piece")) return;
											const rect = event.currentTarget.getBoundingClientRect();
											drop(selectedId, "lane", -1, {
												x: (event.clientX - rect.left) / rect.width * 100,
												y: (event.clientY - rect.top) / rect.height * 100
											});
										},
										children: bays.find((bay) => bay.zone === "lane")?.slots.filter((slot) => slot != null).map((stack) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: cn("lane-piece", ghost?.id === stack.id && "is-hidden"),
											style: {
												left: `${stack.x ?? 50}%`,
												top: `${stack.y ?? 50}%`
											},
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: "drag-handle no-print",
												"aria-label": `Drag ${stackLabel(stack)}`,
												onPointerDown: (event) => onPointerDown(event, stack.id),
												onPointerMove,
												onPointerUp: (event) => onPointerUp(event, {
													bayId: "lane",
													index: -1
												}),
												onPointerCancel,
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, {
													className: "size-4",
													"aria-hidden": true
												})
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												type: "button",
												className: cn("stack-select", selectedId === stack.id && "is-selected"),
												"aria-pressed": selectedId === stack.id,
												"aria-label": `${kindName(stack.kind)}, ${stackLabel(stack)}, in the forklift lane`,
												onClick: () => setSelectedId((prev) => prev === stack.id ? null : stack.id),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackFace, { stack })
											})]
										}, stack.id))
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
									id: "rows-east",
									"data-col": "east",
									className: cn("sheet-col", snapCol === "east" && "is-snap-col"),
									"aria-label": "Rows 9 to 21",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "sheet-col-title",
										children: "Rows 9–21"
									}), bays.filter((bay) => bay.zone === "east").map((bay) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BayRow, {
										bay,
										edge: "end",
										filter,
										query,
										selectedId,
										carrying,
										draggingId: ghost?.id ?? null,
										over,
										onPointerDown,
										onPointerMove,
										onPointerUp,
										onPointerCancel,
										onSelect: (id) => setSelectedId((prev) => prev === id ? null : id),
										onEmptyClick: (index) => {
											if (carrying && selectedId) drop(selectedId, bay.id, index);
										},
										onGrow: () => {
											if (!yard.growBay(bay.id)) setStatus("This row cannot take another cell.");
										},
										onNote: (detail) => yard.patchBay(bay.id, (current) => ({
											...current,
											detail: detail.trim() || void 0
										}))
									}, bay.id))]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("aside", {
							id: "stack-editor",
							className: "inspector-scroll no-print mt-6 rounded-xl border border-line bg-sheet p-4 lg:mt-0",
							children: selected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Editor, {
								bay: selected.bay,
								index: selected.index,
								stack: selected.stack,
								bays,
								onPatch: (recipe, key) => yard.patchStack(selected.stack.id, recipe, key),
								onBay: (recipe, key) => yard.patchBay(selected.bay.id, recipe, key),
								onSend: sendSelected,
								onCarry: () => setCarrying(true),
								onGrow: () => yard.growBay(selected.bay.id),
								onDelete: () => {
									const name = stackLabel(selected.stack);
									yard.deleteStack(selected.stack.id);
									setSelectedId(null);
									setCarrying(false);
									setLive(`Removed ${name}.`);
								},
								onClose: () => {
									setSelectedId(null);
									setCarrying(false);
								}
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(NewStack, {
								bays,
								onPlace: (bayId, stack) => {
									if (!yard.placeNew(bayId, stack)) {
										setStatus("That aisle is full.");
										return;
									}
									setSelectedId(stack.id);
									const bay = bays.find((entry) => entry.id === bayId);
									setLive(`Placed ${stackLabel(stack)} in ${bay?.title ?? "the aisle"}.`);
									document.getElementById(`bay-${bayId}`)?.scrollIntoView({ block: "nearest" });
								}
							})
						})]
					})
				]
			}),
			ghost && ghostStack ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "pointer-events-none fixed z-50",
				style: {
					left: ghost.x,
					top: ghost.y,
					transform: "translate(-50%, -50%)"
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackFace, { stack: ghostStack })
			}) : null,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "sr-only",
				"aria-live": "polite",
				children: live
			})
		]
	});
}
function ThemeSwitch() {
	const [theme, setTheme] = (0, import_react.useState)("light");
	(0, import_react.useEffect)(() => {
		setTheme(document.documentElement.dataset.theme === "dark" ? "dark" : "light");
	}, []);
	function toggle() {
		const next = theme === "dark" ? "light" : "dark";
		document.documentElement.dataset.theme = next;
		localStorage.setItem("yard-theme", next);
		setTheme(next);
	}
	const dark = theme === "dark";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: "btn btn-quiet",
		"aria-pressed": dark,
		"aria-label": dark ? "Switch to light mode" : "Switch to dark mode",
		onClick: toggle,
		children: [dark ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sun, {
			className: "size-4",
			"aria-hidden": true
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Moon, {
			className: "size-4",
			"aria-hidden": true
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "hidden sm:inline",
			children: dark ? "Light" : "Dark"
		})]
	});
}
function FloorLegend() {
	const [open, setOpen] = (0, import_react.useState)(false);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("aside", {
		className: "floor-legend",
		"aria-label": "Legend",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "floor-legend-title floor-legend-toggle",
				"aria-expanded": open,
				onClick: () => setOpen((value) => !value),
				children: "Legend"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "floor-legend-title floor-legend-heading",
				children: "Legend"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("floor-legend-body", open && "is-open"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "floor-legend-products",
					children: [PRODUCTS.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "legend-dot",
						style: { background: markColor({
							label: "",
							product: product.id,
							height: 1,
							unknown: false
						}) },
						"aria-hidden": true
					}), product.name] }, product.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "legend-dot is-unknown",
						"aria-hidden": true
					}), "Unknown"] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
					className: "floor-legend-list",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShapeGlyph, { kind: "tote" }), " Tote"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShapeGlyph, { kind: "box" }), " Boxes"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShapeGlyph, { kind: "pill" }), " Split stack"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Number is the height" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "legend-treated",
							"aria-hidden": true
						}), "Red outline means treated"] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "The scale drags into any open section" })
					]
				})]
			})
		]
	});
}
function FilterChip({ pressed, label, count, swatch, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		className: "chip",
		"aria-pressed": pressed,
		onClick,
		style: swatch ? { "--chip": swatch } : void 0,
		children: [
			swatch ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "size-3 shrink-0 rounded-full",
				style: { background: swatch },
				"aria-hidden": true
			}) : null,
			label,
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-mono text-xs tabular-nums opacity-80",
				children: count
			})
		]
	});
}
function ShapeGlyph({ kind }) {
	const common = {
		width: 14,
		height: 14,
		viewBox: "0 0 16 16",
		fill: "none",
		stroke: "currentColor",
		strokeWidth: 1.5,
		"aria-hidden": true
	};
	if (kind === "tote") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		...common,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", {
			cx: "8",
			cy: "8",
			r: "5.5"
		})
	});
	if (kind === "box") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
		...common,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x: "2.5",
			y: "2.5",
			width: "11",
			height: "11",
			rx: "2"
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("svg", {
		...common,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", {
			x: "1.5",
			y: "4.5",
			width: "13",
			height: "7",
			rx: "3.5"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 5v6" })]
	});
}
function BayRow({ bay, edge, tall, filter, query, selectedId, carrying, draggingId, over, bare, onPointerDown, onPointerMove, onPointerUp, onPointerCancel, onSelect, onEmptyClick, onGrow, onNote }) {
	let splitAt = -1;
	if (bay.railRight) splitAt = bay.slots.findIndex((slot, index) => {
		if (!slot || slot.layers[0]?.product !== bay.railRight) return false;
		return bay.slots.slice(0, index).some((prev) => prev && prev.layers[0]?.product !== bay.railRight);
	});
	const cells = bay.slots.map((slot, index) => {
		const hot = over?.bayId === bay.id && over.index === index;
		const selected = slot?.id === selectedId;
		const handle = slot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: "drag-handle no-print",
			"aria-label": `Drag ${stackLabel(slot)}`,
			onPointerDown: (event) => onPointerDown(event, slot.id),
			onPointerMove,
			onPointerUp: (event) => onPointerUp(event, {
				bayId: bay.id,
				index
			}),
			onPointerCancel,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(GripVertical, {
				className: "size-4",
				"aria-hidden": true
			})
		}) : null;
		const face = slot ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			type: "button",
			className: cn("stack-select", draggingId === slot.id && "opacity-40", !stackMatches(slot, bay, filter, query) && slot.id !== selectedId && "opacity-35"),
			"aria-pressed": selected,
			"aria-label": `${kindName(slot.kind)}, ${stackLabel(slot)}, height ${slot.layers.map((layer) => layer.height).join(" and ")}, ${bay.title} cell ${index + 1}`,
			onClick: () => onSelect(slot.id),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StackFace, { stack: slot })
		}) : null;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			"data-slot": true,
			"data-bay": bay.id,
			"data-index": index,
			className: cn("slot", !slot && "is-empty", hot && "is-over", selected && "is-selected"),
			children: [splitAt === index ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sheet-split",
				"aria-hidden": true
			}) : null, slot ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [handle, face] }) : carrying ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				className: "slot-open sheet-drop",
				onClick: () => onEmptyClick(index),
				children: "Drop"
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "slot-open",
				"aria-label": `Empty cell in ${bay.title}`
			})]
		}, `${bay.id}-${index}`);
	});
	const shown = edge === "end" ? [...cells].reverse() : cells;
	if (bare) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		id: `bay-${bay.id}`,
		"data-row": bay.id,
		className: cn("lane-grid slot-grid", over?.bayId === bay.id && draggingId && "is-snap"),
		children: [cells, over?.bayId === bay.id && draggingId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "row-guide",
			"aria-hidden": true
		}) : null]
	});
	const scale = bay.id === "e19" && bay.slots.every((slot) => slot == null);
	const rail = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "sheet-rail",
		"aria-hidden": true,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { background: railColor(bay.rail) } }), bay.railRight ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { style: { background: railColor(bay.railRight) } }) : null]
	});
	const body = /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "sheet-main",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
				className: "sheet-head",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "sheet-code",
					children: bay.code
				}), tall ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "sheet-title",
					children: bay.title
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("sheet-stacks", edge === "end" && "is-outer-end", tall && "is-center"),
				children: [shown, over?.bayId === bay.id && draggingId ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "row-guide",
					"aria-hidden": true
				}) : null]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RowNote, {
				value: bay.detail ?? "",
				onChange: onNote
			})
		]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("article", {
		id: `bay-${bay.id}`,
		"data-row": bay.id,
		className: cn("sheet-row", tall && "is-treater", scale && "is-scale", edge === "end" && "is-east", over?.bayId === bay.id && draggingId && "is-snap"),
		"aria-label": `Row ${bay.code}, ${bay.title}`,
		children: edge === "end" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [rail, body] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [body, rail] })
	});
}
function RowNote({ value, onChange }) {
	const [draft, setDraft] = (0, import_react.useState)(value);
	(0, import_react.useEffect)(() => setDraft(value), [value]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className: "row-note select-text",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "row-note-label",
			children: "Notes"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
			className: "row-note-input",
			rows: 1,
			maxLength: 400,
			value: draft,
			placeholder: "Add a note for this row",
			onChange: (event) => setDraft(event.target.value),
			onBlur: () => {
				if (draft !== value) onChange(draft);
			}
		})]
	});
}
function StackFace({ stack }) {
	if (stack.kind === "scale") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "mark scale-face",
		children: "Scale"
	});
	return stack.kind === "pill" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PillFace, { stack }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SingleFace, { stack });
}
function pileDepth(height) {
	return String(Math.min(3, Math.max(0, height - 1)));
}
function SingleFace({ stack }) {
	const layer = stack.layers[0];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("mark relative grid place-items-center font-mono text-sm font-medium tabular-nums", stack.kind === "tote" ? "rounded-full" : "rounded-sm"),
		"data-unknown": layer.unknown ? "true" : "false",
		"data-treated": layer.treated ? "true" : "false",
		"data-mix": !layer.unknown && layer.product === "mix" ? "true" : "false",
		"data-depth": layer.unknown ? "0" : pileDepth(layer.height),
		style: markStyle(layer),
		children: layer.height
	});
}
function PillFace({ stack }) {
	const [a, b] = stack.layers;
	const height = Math.max(a.height, b.height);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "pill-face relative flex overflow-hidden rounded-full",
		"data-depth": pileDepth(height),
		"data-treated": a.treated || b.treated ? "true" : "false",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Half, { layer: a }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "w-px shrink-0 bg-ink/20",
				"aria-hidden": true
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Half, { layer: b })
		]
	});
}
function Half({ layer }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "mark flex flex-1 items-center justify-center border-0 font-mono text-sm font-medium tabular-nums",
		"data-unknown": layer.unknown ? "true" : "false",
		"data-treated": layer.treated ? "true" : "false",
		"data-mix": !layer.unknown && layer.product === "mix" ? "true" : "false",
		style: markStyle(layer),
		children: layer.height
	});
}
function Editor({ bay, index, stack, bays, onPatch, onBay, onSend, onCarry, onGrow, onDelete, onClose }) {
	const [armDelete, setArmDelete] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => setArmDelete(false), [stack.id]);
	function patchLayer(layerIndex, recipe, key) {
		onPatch((current) => ({
			...current,
			layers: current.layers.map((layer, i) => i === layerIndex ? recipe(layer) : layer)
		}), key);
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col gap-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs font-semibold text-muted",
						children: ["Row ", bay.code]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "font-display text-2xl leading-tight text-ink",
						children: stackLabel(stack)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "mt-1 text-xs text-muted",
						children: [
							"Cell ",
							index + 1,
							" of ",
							bay.slots.length
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn btn-quiet",
					onClick: onClose,
					"aria-label": "Close stack",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, {
						className: "size-4",
						"aria-hidden": true
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-xs font-semibold text-ink-soft",
				children: ["Aisle name", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field mt-1",
					value: bay.title,
					onChange: (event) => onBay((current) => ({
						...current,
						title: event.target.value
					}), `bay:${bay.id}:title`)
				})]
			}),
			stack.kind === "scale" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm leading-relaxed text-ink-soft",
				children: "Drag the scale into any open section, or send it to another row. It takes one spot, the same as a stack."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
				className: "text-xs font-semibold text-ink-soft",
				children: "Container"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 grid grid-cols-3 gap-1",
				children: [
					"tote",
					"box",
					"pill"
				].map((kind) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: cn("btn", stack.kind === kind ? "btn-primary" : "btn-quiet"),
					"aria-pressed": stack.kind === kind,
					onClick: () => onPatch((current) => {
						const layers = current.layers.slice();
						if (kind === "pill" && layers.length < 2) layers.push({
							label: "Second item",
							product: layers[0]?.product ?? "awp",
							height: 1,
							unknown: false
						});
						return {
							...current,
							kind,
							layers: kind === "pill" ? layers.slice(0, 2) : layers.slice(0, 1)
						};
					}, `${stack.id}:kind`),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShapeGlyph, { kind }), kind === "pill" ? "Split" : kindName(kind)]
				}, kind))
			})] }), stack.layers.map((layer, layerIndex) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LayerFields, {
				layer,
				title: stack.kind === "pill" ? `Item ${layerIndex + 1}` : "Stack",
				cap: maxHeight(stack.kind),
				onLabel: (label) => patchLayer(layerIndex, (current) => ({
					...current,
					label
				}), `${stack.id}:${layerIndex}:label`),
				onHeight: (height) => patchLayer(layerIndex, (current) => ({
					...current,
					height
				}), `${stack.id}:${layerIndex}:height`),
				onProduct: (product) => patchLayer(layerIndex, (current) => ({
					...current,
					product,
					unknown: false
				}), `${stack.id}:${layerIndex}:product`),
				onUnknown: (unknown) => patchLayer(layerIndex, (current) => ({
					...current,
					unknown
				}), `${stack.id}:${layerIndex}:unknown`),
				onTreated: (treated) => patchLayer(layerIndex, (current) => ({
					...current,
					treated
				}), `${stack.id}:${layerIndex}:treated`)
			}, `${stack.id}-${layerIndex}`))] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-xs font-semibold text-ink-soft",
				children: ["Note", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					className: "field-area mt-1",
					value: stack.note,
					onChange: (event) => onPatch((current) => ({
						...current,
						note: event.target.value
					}), `${stack.id}:note`)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-xs font-semibold text-ink-soft",
				htmlFor: "aisle-select",
				children: ["Send to aisle", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					id: "aisle-select",
					className: "field mt-1",
					value: bay.id,
					onChange: (event) => onSend(event.target.value),
					children: bays.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: entry.id,
						children: entry.zone === "lane" ? "Forklift lane" : `Row ${entry.code}`
					}, entry.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn btn-primary",
					onClick: onCarry,
					children: "Place on a cell"
				}), armDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-danger flex-1",
						onClick: onDelete,
						children: "Remove stack"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						className: "btn btn-quiet flex-1",
						onClick: () => setArmDelete(false),
						children: "Keep"
					})]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "btn btn-danger",
					onClick: () => setArmDelete(true),
					children: "Remove from floor"
				})]
			})
		]
	});
}
function LayerFields({ layer, title, cap, onLabel, onHeight, onProduct, onUnknown, onTreated }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
		className: "flex flex-col gap-2 border-t border-line pt-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
				className: "text-xs font-semibold text-ink-soft",
				children: title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-xs font-semibold text-ink-soft",
				children: ["Label", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					className: "field mt-1",
					value: layer.label,
					onChange: (event) => onLabel(event.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-semibold text-ink-soft",
					children: "Height"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-quiet size-11 px-0",
							"aria-label": "Decrease height",
							onClick: () => onHeight(Math.max(1, layer.height - 1)),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {
								className: "size-4",
								"aria-hidden": true
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "w-8 text-center font-mono text-sm tabular-nums",
							children: layer.height
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-quiet size-11 px-0",
							"aria-label": "Increase height",
							onClick: () => onHeight(Math.min(cap, layer.height + 1)),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
								className: "size-4",
								"aria-hidden": true
							})
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-wrap gap-1",
				role: "group",
				"aria-label": `${title} product`,
				children: [PRODUCTS.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					className: "chip",
					"aria-pressed": !layer.unknown && layer.product === product.id,
					onClick: () => onProduct(product.id),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "size-2.5 rounded-full",
						style: { background: `var(--color-swatch-${product.id})` },
						"aria-hidden": true
					}), product.name]
				}, product.id)), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "chip",
					"aria-pressed": layer.unknown,
					onClick: () => onUnknown(!layer.unknown),
					children: "Unknown"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex gap-1",
				role: "group",
				"aria-label": `${title} treatment`,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: cn("chip", layer.treated && "is-treated"),
					"aria-pressed": Boolean(layer.treated),
					onClick: () => onTreated(true),
					children: "Treated"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: "chip",
					"aria-pressed": !layer.treated,
					onClick: () => onTreated(false),
					children: "Not treated"
				})]
			})
		]
	});
}
function NewStack({ bays, onPlace }) {
	const [bayId, setBayId] = (0, import_react.useState)(bays[0]?.id ?? "w1");
	const [kind, setKind] = (0, import_react.useState)("tote");
	const [label, setLabel] = (0, import_react.useState)("");
	const [product, setProduct] = (0, import_react.useState)("awp");
	const [height, setHeight] = (0, import_react.useState)(2);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
		className: "flex flex-col gap-4",
		onSubmit: (event) => {
			event.preventDefault();
			const first = {
				label: label.trim() || "New stack",
				product,
				height,
				unknown: false
			};
			const stack = createStack({
				kind,
				layers: kind === "pill" ? [first, {
					label: "Second item",
					product,
					height: 1,
					unknown: false
				}] : [first]
			});
			onPlace(bayId, stack);
			setLabel("");
		},
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "font-display text-2xl leading-tight text-ink",
				children: "Place a stack"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "mt-1 text-sm leading-relaxed text-muted",
				children: "Select anything on the floor to edit it. Or add a stack into the first open cell of an aisle."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-xs font-semibold text-ink-soft",
				children: ["Aisle", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					className: "field mt-1",
					value: bayId,
					onChange: (event) => setBayId(event.target.value),
					children: bays.map((bay) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: bay.id,
						children: bay.zone === "lane" ? "Forklift lane" : `Row ${bay.code}`
					}, bay.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
				className: "text-xs font-semibold text-ink-soft",
				children: "Container"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-1 grid grid-cols-3 gap-1",
				children: [
					"tote",
					"box",
					"pill"
				].map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					className: cn("btn", kind === entry ? "btn-primary" : "btn-quiet"),
					"aria-pressed": kind === entry,
					onClick: () => {
						setKind(entry);
						setHeight((n) => Math.min(n, maxHeight(entry)));
					},
					children: entry === "pill" ? "Split" : kindName(entry)
				}, entry))
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-xs font-semibold text-ink-soft",
				htmlFor: "new-label",
				children: ["Label", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					id: "new-label",
					className: "field mt-1",
					value: label,
					onChange: (event) => setLabel(event.target.value)
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
				className: "block text-xs font-semibold text-ink-soft",
				children: ["Product", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
					className: "field mt-1",
					value: product,
					onChange: (event) => setProduct(event.target.value),
					children: PRODUCTS.map((entry) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: entry.id,
						children: entry.name
					}, entry.id))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-semibold text-ink-soft",
					children: "Height"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-quiet size-11 px-0",
							"aria-label": "Decrease height",
							onClick: () => setHeight((n) => Math.max(1, n - 1)),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, {
								className: "size-4",
								"aria-hidden": true
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "w-8 text-center font-mono tabular-nums",
							children: height
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							className: "btn btn-quiet size-11 px-0",
							"aria-label": "Increase height",
							onClick: () => setHeight((n) => Math.min(maxHeight(kind), n + 1)),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, {
								className: "size-4",
								"aria-hidden": true
							})
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "submit",
				className: "btn btn-primary",
				children: "Place stack"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs leading-relaxed text-muted",
				children: [
					productName(product),
					" goes in as a ",
					kindName(kind).toLowerCase(),
					". Split stacks can be labeled on each side after you place them."
				]
			})
		]
	});
}
function Home() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(YardApp, {});
}
//#endregion
export { Home as component };
