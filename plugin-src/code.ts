import { exportToJSON } from "./lib/ExportJson";
import { emit, on } from '@create-figma-plugin/utilities'
import { uuidv7 } from "uuidv7";

figma.showUI(__html__, { themeColors: true, width: 400, height: 332 });

on('notify', (content) => {
  figma.notify(content);
});

on('close', () => {
  figma.closePlugin();
});

on('get-variables', () => {
  const data = exportToJSON();
  emit('VARIABLES', data);
});

on('send-to-github', () => {
  const data = exportToJSON();
  emit('TO-GITHUB', data);
});

on("save-config", async (content) => {
  const { auth, ...rest } = content;

  // Get existing providers from figma.root or initialize with an empty array
  let providers = await figma.root.getPluginData("providers") || [];
  let authProviders = await figma.clientStorage.getAsync("providers") || [];

  // Check if an existing provider with UUID is already saved
  let uuid = providers[0]?.uuid || uuidv7();

  // Prepare updated provider data for figma.root
  const providerData = {
    uuid,
    owner: rest.owner || "",
    repo: rest.repo || "",
    path: rest.path || "",
    branch: rest.branch || "",
  };

  // Prepare updated auth data for clientStorage
  const authData = {
    uuid,
    auth: auth || "",
  };

  // Overwrite providers array with the updated provider data
  providers = [providerData];
  figma.root.setPluginData("providers", JSON.stringify(providers));

  // Update authProviders array with the updated auth data
  authProviders = [authData];
  await figma.clientStorage.setAsync("providers", authProviders);

  figma.notify("Data saved!");
});

on("get-config", async () => {
  // Get providers data from figma.root
  const providers = JSON.parse(figma.root.getPluginData("providers") || "[]");

  // Currently, just select the first provider
  const currentProvider = providers[0] || {};

  // Get auth data from clientStorage and find the one matching the current provider's UUID
  const authProviders = (await figma.clientStorage.getAsync("providers")) || [];
  const authData = authProviders.find((item: { uuid: string; }) => item.uuid === currentProvider.uuid);

  // Combine auth with the current provider's data for frontend
  const config = { ...currentProvider, auth: authData ? authData.auth : null };
  emit("RECEIVE-CONFIG", config);
});

figma.on("selectionchange", () => {
	emit("SelectionChanged", figma.currentPage.selection);
});
