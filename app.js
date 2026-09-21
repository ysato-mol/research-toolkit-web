(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerApp = api;
  if (root?.document) api.start(root);
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function atomLabel(atom) {
    return `${atom.elem || atom.element || "X"}${Number(atom.index) + 1}`;
  }

  function renderModel(options) {
    const { viewer, model, atoms, style, selectedIndices, labelsVisible, state } = options;
    viewer.removeAllLabels();
    model.setStyle({}, state.DISPLAY_STYLES[style] || state.DISPLAY_STYLES["ball-stick"]);
    selectedIndices.forEach((atomIndex) => {
      model.setStyle({ index: atomIndex }, { sphere: { scale: 0.48 } }, true);
    });
    if (labelsVisible) {
      atoms.forEach((atom) => viewer.addLabel(atomLabel(atom), state.atomLabelSpec(atom)));
    }
    state.selectionLabelSpecs(atoms, selectedIndices).forEach((label) => {
      viewer.addLabel(label.text, label.spec);
    });
    viewer.render();
  }

  function fullXyz(payload, coordinateRows) {
    return `${payload.elements.length}\nResearch Toolkit shared structure\n${coordinateRows}`;
  }

  function profileNotice(payload) {
    const profile = payload.profile;
    if (!profile || (profile.scale === undefined && !profile.omissions)) return "";
    const notices = [];
    if (profile.scale !== undefined) notices.push(`coordinates rounded to ${1 / profile.scale} A`);
    if ((profile.omissions & 4) !== 0) notices.push("hydrogens omitted");
    if ((profile.omissions & 1) !== 0) notices.push("charge omitted and assumed 0");
    if ((profile.omissions & 2) !== 0) notices.push("multiplicity omitted and assumed 1");
    return notices.length ? `Shared with reduced detail: ${notices.join("; ")}.` : "";
  }

  function start(windowObject) {
    const { document } = windowObject;
    const byId = (id) => document.getElementById(id);
    const els = {
      summary: byId("structureSummary"),
      stage: byId("viewerStage"),
      viewer: byId("viewer"),
      measurement: byId("measurementOverlay"),
      status: byId("statusMessage"),
      style: byId("styleSelect"),
      labels: byId("labelsButton"),
      clear: byId("clearButton"),
      reset: byId("resetButton"),
      showXyz: byId("showXyzButton"),
      copyCoordinates: byId("copyCoordinatesButton"),
      lossy: byId("lossyNotice"),
      xyzPanel: byId("xyzPanel"),
      xyz: byId("xyzText"),
      error: byId("errorMessage"),
    };
    const payloadControls = [els.style, els.labels, els.clear, els.reset, els.showXyz, els.copyCoordinates];
    const state = windowObject.StructureViewerState;
    const measurementMath = windowObject.StructureViewerMath;
    let payload = null;
    let coordinateRows = "";
    let viewer = null;
    let model = null;
    let atoms = [];
    let selectedIndices = [];
    let labelsVisible = false;
    let resizeFrame = 0;
    let resizeObserver = null;
    let statusTimer = 0;

    function setPayloadControlsDisabled(disabled) {
      payloadControls.forEach((control) => { control.disabled = disabled; });
    }

    function resizeViewer() {
      resizeFrame = 0;
      if (!viewer) return;
      viewer.resize();
      viewer.render();
    }

    function scheduleViewerResize() {
      if (resizeFrame) windowObject.cancelAnimationFrame(resizeFrame);
      resizeFrame = windowObject.requestAnimationFrame(resizeViewer);
    }

    function render() {
      if (!viewer || !model) return;
      renderModel({
        viewer,
        model,
        atoms,
        style: els.style.value,
        selectedIndices,
        labelsVisible,
        state,
      });
    }

    function updateMeasurement() {
      const result = state.measurementForSelection(atoms, selectedIndices, measurementMath);
      els.measurement.hidden = !result;
      els.measurement.textContent = result
        ? `${result.kind}: ${result.value.toFixed(result.precision)}${result.unit === "A" ? " Å" : "°"}`
        : "";
    }

    function updateSelection() {
      updateMeasurement();
      render();
    }

    function selectAtom(atom) {
      selectedIndices = state.toggleSelection(selectedIndices, atom.index);
      updateSelection();
    }

    function showStatus(message) {
      windowObject.clearTimeout(statusTimer);
      els.status.textContent = message;
      els.status.hidden = false;
      statusTimer = windowObject.setTimeout(() => { els.status.hidden = true; }, 2400);
    }

    async function copyText(text) {
      try {
        await windowObject.navigator.clipboard.writeText(text);
        return true;
      } catch (_error) {
        const input = document.createElement("textarea");
        input.value = text;
        input.setAttribute("readonly", "");
        input.style.position = "fixed";
        input.style.opacity = "0";
        document.body.appendChild(input);
        input.focus();
        input.select();
        const copied = document.execCommand("copy");
        input.remove();
        return copied;
      }
    }

    async function initialize() {
      try {
        payload = await windowObject.StructureShare.payloadFromHash(windowObject.location.hash);
        coordinateRows = windowObject.StructureShare.coordinateRows(payload);
        els.xyz.value = fullXyz(payload, coordinateRows);
        els.viewer.textContent = "";
        viewer = windowObject.$3Dmol.createViewer(els.viewer, { backgroundColor: "white" });
        model = viewer.addModel(els.xyz.value, "xyz", { keepH: true });
        atoms = model.selectedAtoms({});
        atoms.forEach((atom, index) => { atom.index = Number.isInteger(atom.index) ? atom.index : index; });
        model.setClickable({}, true, selectAtom);
        els.summary.textContent = `${atoms.length} atoms · charge ${payload.charge ?? 0} · multiplicity ${payload.multiplicity ?? 1}`;
        const notice = profileNotice(payload);
        els.lossy.textContent = notice;
        els.lossy.hidden = !notice;
        render();
        viewer.zoomTo();
        viewer.render();
        setPayloadControlsDisabled(false);
        scheduleViewerResize();
      } catch (error) {
        els.viewer.innerHTML = "";
        els.error.hidden = false;
        els.error.textContent = error.message;
        document.querySelectorAll("button, select").forEach((control) => { control.disabled = true; });
      }
    }

    els.style.addEventListener("change", render);
    els.labels.addEventListener("click", () => {
      labelsVisible = !labelsVisible;
      els.labels.setAttribute("aria-pressed", String(labelsVisible));
      render();
    });
    els.clear.addEventListener("click", () => { selectedIndices = []; updateSelection(); });
    els.reset.addEventListener("click", () => { viewer?.zoomTo(); viewer?.render(); });
    els.showXyz.addEventListener("click", () => {
      els.xyzPanel.open = !els.xyzPanel.open;
      els.showXyz.setAttribute("aria-expanded", String(els.xyzPanel.open));
      if (els.xyzPanel.open) els.xyzPanel.scrollIntoView({ behavior: "smooth", block: "nearest" });
    });
    els.copyCoordinates.addEventListener("click", async () => {
      if (!coordinateRows) {
        showStatus("Structure is still loading.");
        return;
      }
      const copied = await copyText(coordinateRows);
      showStatus(copied ? "Coordinates copied." : "Copy failed. Open XYZ and copy the coordinate rows manually.");
    });
    if (typeof windowObject.ResizeObserver === "function") {
      resizeObserver = new windowObject.ResizeObserver(scheduleViewerResize);
      resizeObserver.observe(els.stage);
    }
    windowObject.addEventListener("resize", scheduleViewerResize);
    setPayloadControlsDisabled(true);
    return { ready: initialize() };
  }

  return { renderModel, fullXyz, profileNotice, start };
});
