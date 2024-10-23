import { CreateMessage } from "./lib/CreateMessage";
import { PostToUi } from "./lib/FigmaHelpers";
import { exportToJSON } from "./lib/ExportJson";

figma.showUI(__html__);

figma.on("selectionchange", () => {
	PostToUi("SelectionChanged", figma.currentPage.selection);
});

figma.ui.on("message", async ({ name, content }) => {
	const router = [
		{
			name: "notify",
			action: (content) => {
				figma.notify(content);
			},
		},
		{
			name: "close",
			action: () => {
				figma.closePlugin();
			},
		},
		{
			name: "get-variables",
			action: () => {
				const data = exportToJSON();
				PostToUi("VARIABLES", data);
			},
		},
		{
			name: "send-to-github",
			action: () => {
				const data = exportToJSON();
				PostToUi("TO-GITHUB", data);
			},
		},
		{
			name: "save-config",
			action: (content) => {
				// save everything besides auth in with setPluginData and auth on clientStorage
				const { auth, ...rest } = content;
				figma.clientStorage.setAsync("auth", auth);
				for (const [key, value] of Object.entries(rest)) {
					if (!value) {
						return;
					}
					figma.root.setPluginData(key, value);
				}
				figma.notify("Data saved!");
			},
		},
		{
			name: "get-config",
			action: async () => {
				// get everything besides auth in with getPluginData and auth on clientStorage
				const auth = await figma.clientStorage.getAsync("auth");
				const rest = {};
				for (const key of figma.root.getPluginDataKeys()) {
					rest[key] = figma.root.getPluginData(key);
				}
				PostToUi("RECEIVE-CONFIG", { auth, ...rest });
			},
		},
	];

	if (router.find((r) => r.name === name)) {
		await router.find((r) => r.name === name).action(content);
	}
});
