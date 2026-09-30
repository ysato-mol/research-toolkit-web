(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? {
        ...require("./parsers/registry.js"),
        ...require("./parsers/xyz-parser.js"),
        ...require("./parsers/mol-parser.js"),
        ...require("./parsers/sdf-parser.js"),
        ...require("./parsers/pdb-parser.js"),
        ...require("./parsers/cif-parser.js"),
        ...require("./core/structure-factory.js"),
        ...require("./workspace/workspace-store.js"),
        share: require("./share-codec.js"),
      }
    : { ...(root.StructureViewerCore || {}), ...(root.StructureViewerParsers || {}), share: root.StructureShare };
  const api = factory(root, dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerApi = api;
})(typeof window !== "undefined" ? window : globalThis, function (root, dependencies) {
  "use strict";

  const DESTINATIONS = new Set(["current-window", "new-window", "share"]);
  const FORMATS = new Set(["xyz", "mol", "sdf", "pdb", "cif", "mmcif"]);
  const TRUSTED_BOND_FIELDS = new Set(["atom1", "atom2", "order", "aromatic"]);

  function clone(value) {
    if (Array.isArray(value)) return value.map(clone);
    if (value && typeof value === "object") {
      const copy = {};
      Object.keys(value).forEach((key) => { copy[key] = clone(value[key]); });
      return copy;
    }
    return value;
  }

  function canonicalBond(begin, end, order, aromatic) {
    const endpoints = begin < end ? [begin, end] : [end, begin];
    return `${endpoints[0]}:${endpoints[1]}:${order}:${aromatic === true ? 1 : 0}`;
  }

  function normalizedTrustedBonds(bonds, model) {
    if (!Array.isArray(bonds)) throw new TypeError("Trusted bonds must be an array.");
    const atomCount = model.atomSites.length;
    const seen = new Set();
    const normalized = bonds.map((bond, index) => {
      if (!bond || typeof bond !== "object" || Array.isArray(bond)) throw new TypeError(`Trusted bond ${index} must be an object.`);
      Object.keys(bond).forEach((key) => {
        if (!TRUSTED_BOND_FIELDS.has(key)) throw new TypeError(`Trusted bond ${index}.${key} is not supported.`);
      });
      const { atom1, atom2, order } = bond;
      if (!Number.isSafeInteger(atom1) || !Number.isSafeInteger(atom2)
        || atom1 < 0 || atom2 < 0 || atom1 >= atomCount || atom2 >= atomCount || atom1 === atom2) {
        throw new RangeError(`Trusted bond ${index} must use distinct zero-based atom1/atom2 endpoints within the parsed model.`);
      }
      if (!Number.isFinite(order) || order <= 0) throw new TypeError(`Trusted bond ${index}.order must be a positive finite number.`);
      if (bond.aromatic !== undefined && typeof bond.aromatic !== "boolean") throw new TypeError(`Trusted bond ${index}.aromatic must be boolean.`);
      const endpoints = atom1 < atom2 ? [atom1, atom2] : [atom2, atom1];
      const pair = `${endpoints[0]}:${endpoints[1]}`;
      if (seen.has(pair)) throw new TypeError(`Trusted bond ${index} duplicates another endpoint pair.`);
      seen.add(pair);
      return {
        beginIndex: endpoints[0],
        endIndex: endpoints[1],
        order,
        ...(bond.aromatic !== undefined ? { aromatic: bond.aromatic } : {}),
      };
    });
    normalized.sort((left, right) => left.beginIndex - right.beginIndex || left.endIndex - right.endIndex || left.order - right.order || Number(left.aromatic === true) - Number(right.aromatic === true));
    return normalized.map((bond, index) => ({
      bondId: `bond:0:trusted:${index}`,
      beginSiteId: model.atomSites[bond.beginIndex].siteId,
      endSiteId: model.atomSites[bond.endIndex].siteId,
      order: bond.order,
      provenance: "source",
      ...(bond.aromatic !== undefined ? { aromatic: bond.aromatic } : {}),
    }));
  }

  function assertCompatibleGraph(parsedBonds, trustedBonds, model) {
    if (!parsedBonds.length) return;
    const indices = new Map(model.atomSites.map((site, index) => [site.siteId, index]));
    const parsed = parsedBonds.map((bond) => canonicalBond(
      indices.get(bond.beginSiteId), indices.get(bond.endSiteId), bond.order, bond.aromatic,
    )).sort();
    const trusted = trustedBonds.map((bond) => canonicalBond(
      indices.get(bond.beginSiteId), indices.get(bond.endSiteId), bond.order, bond.aromatic,
    )).sort();
    if (parsed.length !== trusted.length || parsed.some((entry, index) => entry !== trusted[index])) {
      throw new Error("Trusted bond graph conflicts with the graph parsed from the supplied structure.");
    }
  }

  function applyTrustedGraph(content, bonds) {
    if (bonds === undefined) return content;
    if (content.models.length !== 1) throw new Error("Trusted bonds require a single-model structure.");
    const copy = clone(content);
    copy.metadata = { ...(copy.metadata || {}), bondGraphPolicy: "authoritative" };
    const model = copy.models[0];
    const trusted = normalizedTrustedBonds(bonds, model);
    assertCompatibleGraph(model.bonds, trusted, model);
    if (!model.bonds.length) model.bonds = trusted;
    return copy;
  }

  function defaultViewerUrl(windowObject) {
    const scriptUrl = windowObject?.document?.currentScript?.src;
    if (scriptUrl) return new URL(scriptUrl.includes("/dist/") ? "../index.html" : "index.html", scriptUrl).href;
    return dependencies.share.PUBLIC_VIEWER_URL || dependencies.share.defaultViewerUrl();
  }

  function settingsFor(source, initialView) {
    const workspace = dependencies.createWorkspaceStore({ uuid: () => "viewer:toolkit-api" });
    workspace.addStructure(source);
    const options = { structureId: source.structureId };
    if (initialView?.sceneDefinition) options.sceneDefinition = initialView.sceneDefinition;
    if (initialView?.view) options.view = initialView.view;
    else if (initialView && !initialView.sceneDefinition && !initialView.camera) options.view = initialView;
    if (initialView?.camera) options.camera = initialView.camera;
    const viewerId = workspace.createViewer(options);
    const state = workspace.getState().instances[viewerId];
    const definition = state.sceneDefinition;
    const sceneKey = definition.mode === "crystal" ? "crystal" : "molecular";
    const settings = {
      modelId: definition.modelId,
      mode: definition.mode,
      scene: { [sceneKey]: definition[sceneKey] || {} },
      view: state.view,
      ...(state.camera ? { camera: state.camera } : {}),
    };
    workspace.close(viewerId);
    return settings;
  }

  function createStructureViewerApi(overrides = {}) {
    const share = overrides.share || dependencies.share;
    const windowObject = overrides.windowObject || root;
    const registry = dependencies.createParserRegistry([
      dependencies.XyzParserAdapter,
      dependencies.MolParserAdapter,
      dependencies.SdfParserAdapter,
      dependencies.PdbParserAdapter,
      dependencies.CifParserAdapter,
    ]);
    const viewerUrl = overrides.viewerUrl || defaultViewerUrl(windowObject);

    async function prepare(input = {}) {
      if (typeof input.text !== "string" || !input.text.trim()) throw new TypeError("Structure text is required.");
      if (!FORMATS.has(input.format)) throw new TypeError(`Unsupported structure format: ${input.format || "missing"}.`);
      const displayName = String(input.displayName || `structure.${input.format}`).trim();
      if (!displayName) throw new TypeError("Structure displayName is required.");
      const parsed = await registry.parse({
        text: input.text,
        name: displayName,
        displayName,
        explicitFormat: input.format,
        signal: input.signal,
      }, { signal: input.signal });
      const content = applyTrustedGraph(parsed.content, input.bonds);
      const source = await dependencies.createSourceStructure(content);
      return Object.freeze({ source, settings: settingsFor(source, input.initialView), text: input.text, charge: input.charge ?? 0, multiplicity: input.multiplicity ?? 1 });
    }

    async function open(input = {}) {
      const destination = input.destination || "current-window";
      if (!DESTINATIONS.has(destination)) throw new TypeError(`Unsupported Structure Viewer destination: ${destination}.`);
      let child = null;
      if (destination === "new-window") {
        child = windowObject.open?.("about:blank", "_blank");
        if (!child) throw new Error("The Structure Viewer popup was blocked.");
      }
      try {
        const prepared = await prepare(input);
        if (destination === "share") {
          const opened = await share.openDialog({
            source: prepared.source,
            settings: prepared.settings,
            xyz: prepared.source.source.format === "xyz" ? prepared.text : undefined,
            charge: prepared.charge,
            multiplicity: prepared.multiplicity,
          });
          return Object.freeze({ ...prepared, destination, share: opened });
        }
        const created = await share.createLosslessViewerShare({
          source: prepared.source,
          settings: prepared.settings,
          baseUrl: viewerUrl,
        });
        if (destination === "current-window") windowObject.location.assign(created.url);
        else if (child.location?.replace) child.location.replace(created.url);
        else child.location = created.url;
        return Object.freeze({ ...prepared, destination, share: created });
      } catch (error) {
        child?.close?.();
        throw error;
      }
    }

    return Object.freeze({ prepare, open });
  }

  const defaultApi = createStructureViewerApi();
  return Object.freeze({ createStructureViewerApi, prepare: defaultApi.prepare, open: defaultApi.open });
});
