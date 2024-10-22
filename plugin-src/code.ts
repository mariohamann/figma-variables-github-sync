import { CreateMessage } from "./lib/CreateMessage";
import { PostToUi } from "./lib/FigmaHelpers";
import { exportToJSON } from "./lib/ExportJson";

figma.showUI(__html__);

figma.on('selectionchange', () => {
  PostToUi('SelectionChanged', figma.currentPage.selection);
})

figma.ui.on("message", (msg) => {
  if (msg === "Hello") {
    let message = CreateMessage(msg);
    figma.notify(message);
    PostToUi('HelloBack');
  }
  else if (msg === "close") {
    figma.closePlugin();
  }
  if( msg === "get-variables") {
    const data = exportToJSON();
    console.log(data);
    PostToUi('VARIABLES', data);
  }
});
