(function (root) {
  "use strict";

  const controller = root.StructureViewerUI.createStandaloneViewerController();
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
