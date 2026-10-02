(function (root) {
  "use strict";

  let toolkitPreferences = {};
  try { toolkitPreferences = JSON.parse(root.localStorage?.getItem("researchToolkit.preferences.v1") || "{}"); } catch (_error) {}
  const theme = ["light", "dark"].includes(toolkitPreferences.theme)
    ? toolkitPreferences.theme
    : (root.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light");
  root.document.documentElement.dataset.theme = theme;
  const controller = root.StructureViewerUI.createStandaloneViewerController({ theme, toolkitPreferences });
  root.StructureViewerApp = controller;
  controller.initialize().catch((error) => {
    const output = root.document.getElementById("errorMessage");
    if (output) {
      output.hidden = false;
      output.textContent = error?.message || String(error);
    }
  });
  root.addEventListener("beforeunload", () => controller.dispose(), { once: true });
})(window);
