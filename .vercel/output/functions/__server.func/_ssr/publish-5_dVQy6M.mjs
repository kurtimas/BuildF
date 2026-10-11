import { n as TSS_SERVER_FUNCTION, t as createServerFn } from "./ssr.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/publish-5_dVQy6M.js
var createServerRpc = (serverFnMeta, splitImportFn) => {
	const url = "/_serverFn/" + serverFnMeta.id;
	return Object.assign(splitImportFn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var loadPublishedFloor_createServerFn_handler = createServerRpc({
	id: "5158621a2dcaa8d6b0ff9f125dd22503660e79cbead54c1d3536b829224eb16b",
	name: "loadPublishedFloor",
	filename: "src/lib/yard/publish.ts"
}, (opts) => loadPublishedFloor.__executeServer(opts));
var loadPublishedFloor = createServerFn({ method: "GET" }).handler(loadPublishedFloor_createServerFn_handler, async () => {
	const { readPublished } = await import("./publish.server-Dbwujro6.mjs");
	return readPublished();
});
var savePublishedFloor_createServerFn_handler = createServerRpc({
	id: "31bcd79e4b3d4eb57539aeeadf1bba7ba4fbae9537f71f6f414b71b5679a296f",
	name: "savePublishedFloor",
	filename: "src/lib/yard/publish.ts"
}, (opts) => savePublishedFloor.__executeServer(opts));
var savePublishedFloor = createServerFn({ method: "POST" }).validator((input) => ({
	password: typeof input?.password === "string" ? input.password : "",
	layout: typeof input?.layout === "string" ? input.layout : ""
})).handler(savePublishedFloor_createServerFn_handler, async ({ data }) => {
	const { writePublished } = await import("./publish.server-Dbwujro6.mjs");
	return writePublished(data);
});
//#endregion
export { loadPublishedFloor_createServerFn_handler, savePublishedFloor_createServerFn_handler };
