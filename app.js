(function (root) {
  "use strict";

  async function start() {
  const connected = await root.StructureViewerUI.connectToolkit(root);
  let toolkitPreferences = {};
  try { toolkitPreferences = JSON.parse(root.localStorage?.getItem("researchToolkit.preferences.v1") || "{}"); } catch (_error) {}
  if (connected) toolkitPreferences = root.ResearchToolkitPreferences.readCommon();
  toolkitPreferences.language = toolkitPreferences.language || (connected ? "ja" : "en");
  const theme = ["light", "dark"].includes(toolkitPreferences.theme)
    ? toolkitPreferences.theme
    : (root.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  root.document.documentElement.dataset.theme = theme;
  root.document.documentElement.lang = toolkitPreferences.language;
  toolkitPreferences.theme = theme;
  const controller = root.StructureViewerUI.createStandaloneViewerController({ theme, toolkitPreferences });
  root.StructureViewerApp = controller;
  const workbench = root.StructureViewerUI.createViewerWorkbench({ window: root, controller, preferences: toolkitPreferences });
  controller.initialize().catch((error) => {
    const output = root.document.getElementById("errorMessage");
    if (output) {
      output.hidden = false;
      output.textContent = error?.message || String(error);
    }
  });
  root.addEventListener("beforeunload", () => { workbench.dispose(); controller.dispose(); }, { once: true });
  }
  start().catch((error) => {
    const output = root.document.getElementById("errorMessage");
    if (output) { output.hidden = false; output.textContent = error?.message || String(error); }
  });
})(window);
