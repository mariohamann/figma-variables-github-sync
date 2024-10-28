import { exportToJSON } from "./lib/ExportJson";
import { emit, on } from '@create-figma-plugin/utilities'

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

on('save-config', (content) => {
  // save everything besides auth in with setPluginData and auth on clientStorage
  const { auth, ...rest } = content;
  figma.clientStorage.setAsync('auth', auth);
  for (const [key, value] of Object.entries(rest)) {
    if (!value) {
      return;
    }
    figma.root.setPluginData(key, value);
  }
  figma.notify('Data saved!');
});

on("get-config", async () => {
  // get everything besides auth in with getPluginData and auth on clientStorage
  const auth = await figma.clientStorage.getAsync("auth");
  const rest = {};
  for (const key of figma.root.getPluginDataKeys()) {
    rest[key] = figma.root.getPluginData(key);
  }
  emit("RECEIVE-CONFIG", { auth, ...rest });
},);

figma.on("selectionchange", () => {
	emit("SelectionChanged", figma.currentPage.selection);
});
