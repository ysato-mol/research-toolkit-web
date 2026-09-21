(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureShare = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  const SCHEMA = "structure-share/2";
  const LEGACY_SCHEMA = "structure-share/1";
  const WARNING_LENGTH = 8000;
  const STORAGE_KEY = "researchToolkit.structureShare.viewerBaseUrl.v2";
  const PUBLIC_GITHUB_OWNER = "ysato-mol";
  const PUBLIC_WEB_REPO = "research-toolkit-web";
  const PUBLIC_VIEWER_URL = "https://ysato-mol.github.io/research-toolkit-web/";
  const PUBLIC_REPO_REMOTE = "https://github.com/ysato-mol/research-toolkit-web.git";
  const SCRIPT_URL = root?.document?.currentScript?.src || "";
  const OMIT_CHARGE = 1;
  const OMIT_MULTIPLICITY = 2;
  const OMIT_HYDROGENS = 4;
  const SUPPORTED_OMISSIONS = OMIT_CHARGE | OMIT_MULTIPLICITY | OMIT_HYDROGENS;
  const PROFILE_FIELDS = new Set(["scale", "omissions"]);
  const DECIMAL_TOKEN = /^[+-]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][+-]?\d+)?$/;
  let qrAssetsPromise;

  function isFiniteDecimalToken(value) {
    return typeof value === "string" && DECIMAL_TOKEN.test(value) && Number.isFinite(Number(value));
  }

  function bytesToBase64Url(bytes) {
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 0x8000) {
      binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    }
    const encoded = typeof btoa === "function" ? btoa(binary) : Buffer.from(bytes).toString("base64");
    return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function base64UrlToBytes(value) {
    const base64 = String(value || "").replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(String(value || "").length / 4) * 4, "=");
    const binary = typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("binary");
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }

  async function transformBytes(bytes, TransformClass, format) {
    const stream = new Blob([bytes]).stream().pipeThrough(new TransformClass(format));
    return new Uint8Array(await new Response(stream).arrayBuffer());
  }

  async function encodePayload(payload) {
    validatePayload(payload);
    const source = new TextEncoder().encode(JSON.stringify(toWirePayload(payload)));
    if (typeof CompressionStream === "function") {
      try {
        return `d.${bytesToBase64Url(await transformBytes(source, CompressionStream, "deflate"))}`;
      } catch (_error) {
        // A plain UTF-8 fallback keeps sharing available in older browsers.
      }
    }
    return `u.${bytesToBase64Url(source)}`;
  }

  async function decodePayload(encoded, expectedVersion) {
    const value = String(encoded || "");
    const separator = value.indexOf(".");
    if (separator < 1) throw new Error("Unsupported structure share encoding.");
    const codec = value.slice(0, separator);
    let bytes = base64UrlToBytes(value.slice(separator + 1));
    if (codec === "d") {
      if (typeof DecompressionStream !== "function") throw new Error("This browser cannot decompress the shared structure URL.");
      bytes = await transformBytes(bytes, DecompressionStream, "deflate");
    } else if (codec !== "u") {
      throw new Error("Unsupported structure share codec.");
    }
    const payload = JSON.parse(new TextDecoder().decode(bytes));
    if (expectedVersion === 1 || (!expectedVersion && payload?.schema === LEGACY_SCHEMA)) {
      return legacyPayloadToV2(payload);
    }
    if (expectedVersion && expectedVersion !== 2) throw new Error(`Unsupported structure share version: ${expectedVersion}.`);
    if (payload?.s === 2) return fromWirePayload(payload);
    validatePayload(payload);
    return payload;
  }

  function parseXyz(xyz) {
    const lines = String(xyz || "").replace(/\r/g, "").split("\n");
    while (lines.length && !lines[0].trim()) lines.shift();
    while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
    if (!lines.length) throw new Error("XYZ structure is empty.");
    const hasHeader = /^\d+$/.test(lines[0].trim());
    const rows = hasHeader ? lines.slice(2, Number(lines[0].trim()) + 2) : lines.filter((line) => line.trim());
    const declared = hasHeader ? Number(lines[0].trim()) : rows.length;
    if (!Number.isInteger(declared) || declared < 1) throw new Error("XYZ atom count must be a positive integer.");
    if (rows.length !== declared) {
      throw new Error(`XYZ atom count declares ${declared}, but ${rows.length} coordinate rows were found.`);
    }
    const elements = [];
    const coordinates = [];
    rows.forEach((row, index) => {
      const tokens = row.trim().split(/\s+/);
      if (tokens.length !== 4 || !/^[A-Z][a-z]?$/.test(tokens[0])) {
        throw new Error(`XYZ atom row ${index + 1} must contain an element and three coordinates.`);
      }
      const coordinateTokens = tokens.slice(1);
      if (!coordinateTokens.every(isFiniteDecimalToken)) {
        throw new Error(`XYZ atom row ${index + 1} must contain three finite numeric coordinates.`);
      }
      elements.push(tokens[0]);
      coordinates.push(coordinateTokens);
    });
    return { elements, coordinates };
  }

  function createPayload(options) {
    const parsed = parseXyz(options?.xyz);
    const payload = {
      schema: SCHEMA,
      elements: parsed.elements,
      coordinates: parsed.coordinates,
    };
    if (options?.charge !== undefined && options?.charge !== null && options?.charge !== "") {
      const charge = Number(options.charge);
      if (!Number.isInteger(charge)) throw new Error("Structure charge must be an integer.");
      payload.charge = charge;
    }
    if (options?.multiplicity !== undefined && options?.multiplicity !== null && options?.multiplicity !== "") {
      const multiplicity = Number(options.multiplicity);
      if (!Number.isInteger(multiplicity) || multiplicity < 1) throw new Error("Structure multiplicity must be an integer of at least one.");
      payload.multiplicity = multiplicity;
    }
    return validatePayload(payload);
  }

  function validateProfile(profile) {
    if (!profile || typeof profile !== "object" || Array.isArray(profile)) {
      throw new Error("Structure profile metadata must be an object.");
    }
    const fields = Object.keys(profile);
    if (!fields.length || fields.some((field) => !PROFILE_FIELDS.has(field))) {
      throw new Error("Structure profile metadata contains unsupported fields.");
    }
    if (Object.hasOwn(profile, "scale") && (!Number.isInteger(profile.scale) || profile.scale < 1)) {
      throw new Error("Structure profile scale must be a positive integer.");
    }
    if (Object.hasOwn(profile, "omissions")
      && (!Number.isInteger(profile.omissions) || profile.omissions < 0 || profile.omissions > SUPPORTED_OMISSIONS)) {
      throw new Error("Structure profile omissions must use only supported bitmask values.");
    }
  }

  function validatePayload(payload) {
    if (!payload || payload.schema !== SCHEMA) throw new Error("Unsupported structure share schema.");
    if (!Array.isArray(payload.elements) || !Array.isArray(payload.coordinates) || !payload.elements.length) {
      throw new Error("The shared structure does not contain atom arrays.");
    }
    if (payload.elements.length !== payload.coordinates.length) throw new Error("The shared atom arrays have different lengths.");
    payload.elements.forEach((element, index) => {
      if (typeof element !== "string" || !/^[A-Z][a-z]?$/.test(element)) {
        throw new Error(`The shared atom array has an invalid element at index ${index}.`);
      }
      const coordinates = payload.coordinates[index];
      if (!Array.isArray(coordinates) || coordinates.length !== 3 || !coordinates.every(isFiniteDecimalToken)) {
        throw new Error(`The shared atom array has invalid coordinates at index ${index}.`);
      }
    });
    if (Object.hasOwn(payload, "charge") && !Number.isInteger(Number(payload.charge))) throw new Error("Structure charge must be an integer.");
    if (Object.hasOwn(payload, "multiplicity") && (!Number.isInteger(Number(payload.multiplicity)) || Number(payload.multiplicity) < 1)) {
      throw new Error("Structure multiplicity must be an integer of at least one.");
    }
    if (payload.profile !== undefined) validateProfile(payload.profile);
    return payload;
  }

  function toWirePayload(payload) {
    const elements = [];
    const elementIndices = new Map();
    const atoms = payload.elements.map((element) => {
      if (!elementIndices.has(element)) {
        elementIndices.set(element, elements.length);
        elements.push(element);
      }
      return elementIndices.get(element);
    });
    const scale = payload.profile?.scale;
    const coordinates = payload.coordinates.flat().map((token) => scale ? Math.round(Number(token) * scale) : token);
    const wire = { s: 2, e: elements, a: atoms, c: coordinates };
    if (Object.hasOwn(payload, "charge")) wire.q = Number(payload.charge);
    if (Object.hasOwn(payload, "multiplicity")) wire.m = Number(payload.multiplicity);
    if (scale !== undefined) {
      if (!Number.isInteger(scale) || scale < 1) throw new Error("Structure profile scale must be a positive integer.");
      wire.z = scale;
    }
    if (payload.profile?.omissions !== undefined) {
      const omissions = payload.profile.omissions;
      wire.o = omissions;
    }
    return wire;
  }

  function fromWirePayload(wire) {
    if (!wire || wire.s !== 2 || !Array.isArray(wire.e) || !Array.isArray(wire.a) || !Array.isArray(wire.c)) {
      throw new Error("Malformed structure share v2 atom arrays.");
    }
    if (wire.c.length !== wire.a.length * 3 || !wire.a.length) throw new Error("Malformed structure share v2 atom arrays.");
    const elements = wire.a.map((dictionaryIndex) => {
      if (!Number.isInteger(dictionaryIndex) || dictionaryIndex < 0 || dictionaryIndex >= wire.e.length || typeof wire.e[dictionaryIndex] !== "string") {
        throw new Error("Malformed structure share v2 atom arrays.");
      }
      return wire.e[dictionaryIndex];
    });
    if (wire.o !== undefined && (!Number.isInteger(wire.o) || wire.o < 0 || wire.o > SUPPORTED_OMISSIONS)) {
      throw new Error("Malformed structure share v2 omissions bitfield.");
    }
    if (wire.q !== undefined && !Number.isInteger(wire.q)) {
      throw new Error("Malformed structure share v2 charge.");
    }
    if (wire.m !== undefined && (!Number.isInteger(wire.m) || wire.m < 1)) {
      throw new Error("Malformed structure share v2 multiplicity.");
    }
    if (wire.z !== undefined && (!Number.isInteger(wire.z) || wire.z < 1)) throw new Error("Malformed structure share v2 coordinate scale.");
    const coordinateTokens = wire.c.map((token) => {
      if (wire.z === undefined) {
        if (!isFiniteDecimalToken(token)) throw new Error("Malformed structure share v2 atom arrays.");
        return token;
      }
      if (!Number.isInteger(token)) throw new Error("Malformed structure share v2 quantized coordinate.");
      return String(token / wire.z);
    });
    const payload = {
      schema: SCHEMA,
      elements,
      coordinates: Array.from({ length: elements.length }, (_, index) => coordinateTokens.slice(index * 3, index * 3 + 3)),
    };
    if (wire.q !== undefined) payload.charge = wire.q;
    else if ((wire.o & OMIT_CHARGE) !== 0) payload.charge = 0;
    if (wire.m !== undefined) payload.multiplicity = wire.m;
    else if ((wire.o & OMIT_MULTIPLICITY) !== 0) payload.multiplicity = 1;
    if (wire.z !== undefined || wire.o !== undefined) {
      payload.profile = {};
      if (wire.z !== undefined) payload.profile.scale = wire.z;
      if (wire.o !== undefined) payload.profile.omissions = wire.o;
    }
    return validatePayload(payload);
  }

  function legacyPayloadToV2(payload) {
    if (!payload || payload.schema !== LEGACY_SCHEMA || payload.structure?.format !== "xyz") {
      throw new Error("Malformed legacy structure share payload.");
    }
    return createPayload({
      xyz: payload.structure.xyz,
      charge: payload.structure.charge,
      multiplicity: payload.structure.multiplicity,
    });
  }

  async function payloadFromHash(hash) {
    const parameters = new URLSearchParams(String(hash || "").replace(/^#/, ""));
    const version = Number(parameters.get("v"));
    if (!parameters.get("data")) throw new Error("No supported structure was found in this URL.");
    if (version !== 1 && version !== 2) throw new Error(`Unsupported structure share version: ${parameters.get("v") || "missing"}.`);
    return decodePayload(parameters.get("data"), version);
  }

  async function buildUrl(payload, baseUrl) {
    const url = new URL(String(baseUrl || defaultViewerUrl()));
    url.hash = `v=2&data=${await encodePayload(payload)}`;
    return url.href;
  }

  function coordinateRows(payload) {
    validatePayload(payload);
    return payload.elements.map((element, index) => `${element} ${payload.coordinates[index].join(" ")}`).join("\n");
  }

  function defaultViewerUrl() {
    try {
      const saved = root?.localStorage?.getItem(STORAGE_KEY);
      if (saved) {
        const url = new URL(saved);
        const stale = url.protocol !== "https:" || url.hostname.toLowerCase() === "pepeporn.github.io" || ["localhost", "127.0.0.1"].includes(url.hostname.toLowerCase());
        if (!stale) return url.href.split("#")[0];
      }
    } catch (_error) {
      // Storage is optional.
    }
    return PUBLIC_VIEWER_URL;
  }

  function describeUrl(url) {
    const value = String(url || "");
    const localOnly = /^(file:|https?:\/\/(localhost|127\.0\.0\.1)(:|\/))/i.test(value);
    if (value.length > WARNING_LENGTH) {
      return { warning: true, reason: "length", text: `URL is ${value.length.toLocaleString()} characters and may be too long for some apps.` };
    }
    if (localOnly) {
      return { warning: true, reason: "local", text: `URL length: ${value.length.toLocaleString()}. This local address works only on this computer; set a public viewer URL for sharing to another device.` };
    }
    return { warning: false, reason: "none", text: `URL length: ${value.length.toLocaleString()}. Structure data remains in the URL fragment and is not sent to a server.` };
  }

  async function copyText(text, input) {
    try {
      await root.navigator.clipboard.writeText(text);
      return true;
    } catch (_error) {
      if (!input || !root.document) return false;
      input.focus();
      input.select();
      return root.document.execCommand("copy");
    }
  }

  function loadScript(url) {
    return new Promise((resolve, reject) => {
      const script = root.document.createElement("script");
      script.src = url;
      script.onload = resolve;
      script.onerror = () => reject(new Error(`Could not load ${new URL(url).pathname.split("/").pop()}.`));
      root.document.head.appendChild(script);
    });
  }

  function loadQrAssets() {
    if (root.StructureShareQr && typeof root.qrcode === "function") return Promise.resolve(root.StructureShareQr);
    if (!qrAssetsPromise) {
      const baseUrl = SCRIPT_URL || new URL("share-codec.js", root.location?.href || PUBLIC_VIEWER_URL).href;
      const buildVersion = new URL(baseUrl).searchParams.get("v");
      const assetUrl = (relativePath) => {
        const url = new URL(relativePath, baseUrl);
        if (buildVersion) url.searchParams.set("v", buildVersion);
        return url.href;
      };
      qrAssetsPromise = loadScript(assetUrl("./vendor/qrcode-generator-1.4.4.min.js"))
        .then(() => loadScript(assetUrl("./qr-share.js")))
        .then(() => {
          if (!root.StructureShareQr || typeof root.qrcode !== "function") throw new Error("QR tools did not initialize.");
          return root.StructureShareQr;
        });
    }
    return qrAssetsPromise;
  }

  function injectDialogStyle() {
    if (!root.document || root.document.getElementById("structureShareDialogStyle")) return;
    const style = root.document.createElement("style");
    style.id = "structureShareDialogStyle";
    style.textContent = `.structure-share-dialog{--color-primary:#1c3177;--color-on-primary:#fff;--color-primary-hover:#11215b;--color-primary-container:#e4ebf6;--color-on-primary-container:#11215b;--color-surface:#fff;--color-surface-container:#f2f4f9;--color-text:#1a1a1a;--color-text-secondary:#595959;--color-outline:#c4c4c4;--color-disabled-bg:#ebebeb;--status-warning-text:#6d2700;--status-warning-bg:#ffdfca;box-sizing:border-box;width:min(620px,calc(100vw - 24px));max-height:calc(100dvh - 24px);border:0;border-radius:8px;padding:0;background:var(--color-surface);color:var(--color-text);box-shadow:0 2px 10px rgba(0,0,0,.22),0 8px 24px 5px rgba(0,0,0,.08)}.structure-share-dialog::backdrop{background:rgba(15,23,42,.48)}.structure-share-dialog form{padding:16px;display:grid;gap:12px}.structure-share-dialog header,.structure-share-actions,.structure-share-qr-actions{display:flex;align-items:center;gap:8px}.structure-share-dialog header{justify-content:space-between}.structure-share-dialog h2,.structure-share-dialog h3{margin:0;letter-spacing:0}.structure-share-dialog h2{font-size:18px}.structure-share-dialog h3{font-size:14px}.structure-share-dialog label{display:grid;gap:4px;font-weight:700;font-size:12px}.structure-share-dialog textarea,.structure-share-dialog select{box-sizing:border-box;width:100%;border:1px solid var(--color-outline);border-radius:6px;background:var(--color-surface);color:var(--color-text);padding:8px;font:inherit}.structure-share-dialog textarea{min-height:76px;resize:vertical;font-family:ui-monospace,Consolas,monospace;font-size:11px}.structure-share-actions,.structure-share-qr-actions{flex-wrap:wrap;justify-content:flex-end}.structure-share-message,.structure-share-qr-status{margin:0;font-size:12px;color:var(--color-text-secondary)}.structure-share-message.warn,.structure-share-qr-status.warn{border-radius:4px;padding:6px 8px;background:var(--status-warning-bg);color:var(--status-warning-text)}.structure-share-dialog button{min-height:32px;border:1px solid var(--color-primary);border-radius:6px;padding:5px 12px;background:var(--color-primary);color:var(--color-on-primary);font:inherit;font-weight:700}.structure-share-dialog button.secondary{background:var(--color-surface);color:var(--color-primary)}.structure-share-dialog button:hover:not(:disabled){background:var(--color-primary-hover);color:var(--color-on-primary)}.structure-share-dialog button:disabled{border-color:var(--color-disabled-bg);background:var(--color-disabled-bg);color:var(--color-text-secondary)}.structure-share-qr-panel{display:grid;gap:12px;border-top:1px solid var(--color-outline);padding-top:12px}.structure-share-qr-panel[hidden],[data-qr-save][hidden]{display:none}.structure-share-qr-grid{display:grid;grid-template-columns:minmax(150px,1fr) minmax(150px,1fr);gap:8px 12px}.structure-share-checks{display:grid;gap:6px;align-content:start}.structure-share-checks label{display:flex;align-items:center;gap:6px;font-weight:400}.structure-share-qr-output{display:grid;place-items:center;overflow:auto}.structure-share-qr-output canvas{max-width:100%;height:auto}@media(max-width:520px){.structure-share-qr-grid{grid-template-columns:1fr}}`;
    root.document.head.appendChild(style);
  }

  async function openDialog(options) {
    if (!root.document) throw new Error("Sharing UI requires a browser.");
    injectDialogStyle();
    const payload = createPayload(options);
    root.document.getElementById("structureShareDialog")?.remove();
    const dialog = root.document.createElement("dialog");
    dialog.id = "structureShareDialog";
    dialog.className = "structure-share-dialog";
    dialog.innerHTML = `<form method="dialog"><header><h2>Share structure</h2><button value="close" type="submit" class="secondary" aria-label="Close">Close</button></header><label>Lossless URL<textarea data-share-url readonly spellcheck="false"></textarea></label><p class="structure-share-message" data-share-message>Generating lossless URL...</p><div class="structure-share-actions"><button type="button" class="secondary" data-share-make-qr>Make QR</button><button type="button" data-share-copy disabled>Copy URL</button></div><section class="structure-share-qr-panel" data-qr-panel hidden><h3>QR settings</h3><div class="structure-share-qr-grid"><label>Coordinate precision<select data-qr-setting data-qr-precision><option value="lossless" selected>Lossless</option><option value="0.0001">0.0001 A</option><option value="0.001">0.001 A</option><option value="0.01">0.01 A</option><option value="0.05">0.05 A</option></select></label><label>Error correction<select data-qr-setting data-qr-error-correction><option value="L">Low</option><option value="M" selected>Medium</option><option value="Q">Quartile</option><option value="H">High</option></select></label><div class="structure-share-checks"><label><input data-qr-setting data-qr-hydrogens type="checkbox" checked>Include hydrogens</label><label><input data-qr-setting data-qr-charge type="checkbox" checked>Include charge</label><label><input data-qr-setting data-qr-multiplicity type="checkbox" checked>Include multiplicity</label></div></div><p class="structure-share-qr-status" data-qr-status>Loading QR tools...</p><div class="structure-share-qr-actions"><button type="button" class="secondary" data-qr-auto-fit>Auto fit</button><button type="button" data-qr-generate disabled>Generate QR</button><button type="button" class="secondary" data-qr-save hidden>Save PNG</button></div><div class="structure-share-qr-output" data-qr-output></div></section></form>`;
    root.document.body.appendChild(dialog);
    const urlOutput = dialog.querySelector("[data-share-url]");
    const message = dialog.querySelector("[data-share-message]");
    const copyButton = dialog.querySelector("[data-share-copy]");
    const makeQrButton = dialog.querySelector("[data-share-make-qr]");
    const qrPanel = dialog.querySelector("[data-qr-panel]");
    const qrStatus = dialog.querySelector("[data-qr-status]");
    const generateButton = dialog.querySelector("[data-qr-generate]");
    const saveButton = dialog.querySelector("[data-qr-save]");
    const qrOutput = dialog.querySelector("[data-qr-output]");
    let qrApi = null;
    let qrUrl = "";
    let qrFit = null;
    let qrCanvas = null;
    let qrOperationGeneration = 0;

    const readQrSettings = () => {
      const precisionValue = dialog.querySelector("[data-qr-precision]").value;
      return {
        precision: precisionValue === "lossless" ? "lossless" : Number(precisionValue),
        includeHydrogens: dialog.querySelector("[data-qr-hydrogens]").checked,
        includeCharge: dialog.querySelector("[data-qr-charge]").checked,
        includeMultiplicity: dialog.querySelector("[data-qr-multiplicity]").checked,
        errorCorrection: dialog.querySelector("[data-qr-error-correction]").value,
        maxVersion: 40,
      };
    };
    const applyQrSettings = (settings) => {
      dialog.querySelector("[data-qr-precision]").value = String(settings.precision);
      dialog.querySelector("[data-qr-hydrogens]").checked = settings.includeHydrogens;
      dialog.querySelector("[data-qr-charge]").checked = settings.includeCharge;
      dialog.querySelector("[data-qr-multiplicity]").checked = settings.includeMultiplicity;
      dialog.querySelector("[data-qr-error-correction]").value = settings.errorCorrection;
    };
    const showQrResult = (fit) => {
      qrStatus.className = `structure-share-qr-status${fit.fits ? "" : " warn"}`;
      qrStatus.textContent = fit.fits
        ? `${fit.encodedBytes.toLocaleString()} encoded bytes; ${fit.remainingBytes.toLocaleString()} remaining at QR version ${fit.version}.`
        : fit.error;
      generateButton.disabled = !fit.fits;
    };
    const rebuildQr = async () => {
      const generation = ++qrOperationGeneration;
      qrFit = null;
      qrCanvas = null;
      generateButton.disabled = true;
      saveButton.hidden = true;
      qrOutput.innerHTML = "";
      try {
        const settings = readQrSettings();
        const qrPayload = qrApi.createQrPayload(payload, settings);
        const nextUrl = await buildUrl(qrPayload, defaultViewerUrl());
        if (generation !== qrOperationGeneration) return;
        const nextFit = qrApi.evaluateUrl(nextUrl, settings, root.qrcode);
        qrUrl = nextUrl;
        qrFit = nextFit;
        showQrResult(qrFit);
      } catch (error) {
        if (generation !== qrOperationGeneration) return;
        qrFit = null;
        generateButton.disabled = true;
        qrStatus.className = "structure-share-qr-status warn";
        qrStatus.textContent = error.message;
      }
    };

    copyButton.addEventListener("click", async () => {
      const copied = await copyText(urlOutput.value, urlOutput);
      message.textContent = copied ? "Share URL copied." : "Copy failed. Select the URL and copy it manually.";
    });
    makeQrButton.addEventListener("click", async () => {
      qrPanel.hidden = false;
      makeQrButton.disabled = true;
      try {
        qrApi = await loadQrAssets();
        await rebuildQr();
      } catch (error) {
        qrStatus.className = "structure-share-qr-status warn";
        qrStatus.textContent = error.message;
      }
    });
    dialog.querySelectorAll("[data-qr-setting]").forEach((control) => control.addEventListener("change", rebuildQr));
    dialog.querySelector("[data-qr-auto-fit]").addEventListener("click", async () => {
      if (!qrApi) return;
      const generation = ++qrOperationGeneration;
      qrFit = null;
      generateButton.disabled = true;
      try {
        const result = await qrApi.autoFit(payload, (candidate) => buildUrl(candidate, defaultViewerUrl()), readQrSettings(), root.qrcode);
        if (generation !== qrOperationGeneration) return;
        applyQrSettings(result.settings);
        qrUrl = result.url;
        qrFit = result.fit;
        qrCanvas = null;
        qrOutput.innerHTML = "";
        saveButton.hidden = true;
        showQrResult(qrFit);
      } catch (error) {
        if (generation !== qrOperationGeneration) return;
        qrStatus.className = "structure-share-qr-status warn";
        qrStatus.textContent = error.message;
      }
    });
    generateButton.addEventListener("click", () => {
      if (!qrApi || !qrFit?.fits) return;
      try {
        const settings = readQrSettings();
        const matrix = root.qrcode(qrFit.version, settings.errorCorrection);
        matrix.addData(qrUrl, "Byte");
        matrix.make();
        qrCanvas = qrApi.renderPng(matrix, () => root.document.createElement("canvas"), { size: 640 });
        qrOutput.innerHTML = "";
        qrOutput.appendChild(qrCanvas);
        saveButton.hidden = false;
      } catch (error) {
        saveButton.hidden = true;
        qrStatus.className = "structure-share-qr-status warn";
        qrStatus.textContent = error.message;
      }
    });
    saveButton.addEventListener("click", () => {
      if (!qrCanvas) return;
      qrCanvas.toBlob((blob) => {
        if (!blob) return;
        const link = root.document.createElement("a");
        link.href = root.URL.createObjectURL(blob);
        link.download = qrApi.pngFilename(readQrSettings());
        link.click();
        root.URL.revokeObjectURL(link.href);
      }, "image/png");
    });
    dialog.addEventListener("close", () => dialog.remove());
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open", "");
    try {
      const url = await buildUrl(payload, defaultViewerUrl());
      urlOutput.value = url;
      const description = describeUrl(url);
      message.className = `structure-share-message${description.warning ? " warn" : ""}`;
      message.textContent = description.text;
      copyButton.disabled = false;
    } catch (error) {
      message.className = "structure-share-message warn";
      message.textContent = error.message;
    }
    return { payload, dialog };
  }

  return {
    SCHEMA,
    WARNING_LENGTH,
    PUBLIC_GITHUB_OWNER,
    PUBLIC_WEB_REPO,
    PUBLIC_VIEWER_URL,
    PUBLIC_REPO_REMOTE,
    createPayload,
    validatePayload,
    encodePayload,
    decodePayload,
    payloadFromHash,
    buildUrl,
    coordinateRows,
    defaultViewerUrl,
    describeUrl,
    openDialog,
  };
});
