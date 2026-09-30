(function (root, factory) {
  "use strict";
  const dependencies = typeof module === "object" && module.exports
    ? { v2: require("./share/share-v2.js"), v3: require("./share/share-v3.js"), canonicalize: require("./core/canonical-json.js").canonicalizeRfc8785 }
    : { v2: root.StructureShareV2, v3: root.StructureShareV3, canonicalize: root.StructureViewerCore?.canonicalizeRfc8785 };
  const api = factory(root, dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureShare = api;
})(typeof window !== "undefined" ? window : globalThis, function (root, dependencies) {
  "use strict";

  const { v2, v3 } = dependencies;
  if (!v2 || !v3) throw new Error("StructureShare v2 and v3 must be loaded before the compatibility entry point.");
  const WARNING_LENGTH = 8000;
  const QR_FINAL_URL_BYTES = 2953;
  const utf8Bytes = (value) => new TextEncoder().encode(String(value)).length;

  function selectVersion(options = {}) {
    if (options.version !== undefined) {
      if (![2, 3].includes(options.version)) throw new Error(`Unsupported structure share version: ${options.version}.`);
      return options.version;
    }
    if (!options.source && options.xyz !== undefined) return 2;
    const source = options.source;
    const hasAuthoritativeGraph = source?.metadata?.bondGraphPolicy === "authoritative";
    return source?.source?.format === "xyz" && source?.structureType !== "crystal" && !hasAuthoritativeGraph ? 2 : 3;
  }

  function parameters(hash) {
    const result = new URLSearchParams(String(hash || "").replace(/^#/, ""));
    const rawVersion = result.get("v");
    if (!rawVersion || !result.get("data")) throw new Error(`Unsupported structure share version: ${rawVersion || "missing"}.`);
    const version = Number(rawVersion);
    if (![1, 2, 3].includes(version)) throw new Error(`Unsupported structure share version: ${rawVersion}.`);
    return { version, data: result.get("data") };
  }

  async function decodeHash(hash, options) {
    const { version, data } = parameters(hash);
    if (version === 3) return { version, ...(await v3.decodePayload(data, options)) };
    return { version, payload: await v2.decodePayload(data, version) };
  }

  async function payloadFromHash(hash, options) {
    const decoded = await decodeHash(hash, options);
    return decoded.version === 3 ? decoded : decoded.payload;
  }

  async function encodeVersionedPayload(payload) {
    if (payload?.schema === v3.SCHEMA) return { version: 3, encoded: await v3.encodePayload(payload) };
    return { version: 2, encoded: await v2.encodePayload(payload) };
  }

  async function buildUrl(payload, baseUrl) {
    const { version, encoded } = await encodeVersionedPayload(payload);
    const url = new URL(String(baseUrl || v2.defaultViewerUrl()));
    url.hash = `v=${version}&data=${encoded}`;
    return url.href;
  }

  function describeUrl(url) {
    const description = v2.describeUrl(url);
    if (String(url).length > WARNING_LENGTH) return { ...description, warning: true, reason: "length" };
    return description;
  }

  function assertQrCapacity(url) {
    const bytes = utf8Bytes(url);
    if (bytes > QR_FINAL_URL_BYTES) throw new RangeError(`QR URL exceeds the 2,953-byte capacity (${bytes} bytes).`);
    return bytes;
  }

  function assertQrEligible(share) {
    if (share?.version !== 2) throw new Error("QR generation is available only for XYZ structure-share v2 URLs.");
    assertQrCapacity(share.url);
    return share;
  }

  async function createLosslessViewerShare(options = {}) {
    if (!options.source || !options.settings) throw new TypeError("SourceStructure and Viewer settings are required for lossless Viewer navigation.");
    return createShare({ ...options, version: 3 });
  }

  async function createShare(options = {}) {
    const version = selectVersion(options);
    const payload = version === 2
      ? v2.createPayload({ xyz: options.xyz, charge: options.charge, multiplicity: options.multiplicity })
      : v3.createPayload(options.source, options.settings);
    const encoded = version === 2 ? await v2.encodePayload(payload) : await v3.encodePayload(payload);
    const url = new URL(String(options.baseUrl || v2.defaultViewerUrl()));
    url.hash = `v=${version}&data=${encoded}`;
    const href = url.href;
    const decodedText = version === 3 ? dependencies.canonicalize(payload) : JSON.stringify(payload);
    const sourceBytes = Number.isSafeInteger(options.source?.source?.byteLength)
      ? options.source.source.byteLength
      : utf8Bytes(options.xyz || "");
    return {
      version, payload, encoded, url: href, qrEligible: version === 2,
      sizes: {
        sourceBytes,
        decodedBytes: utf8Bytes(decodedText),
        encodedBytes: utf8Bytes(encoded),
        urlBytes: utf8Bytes(href),
        urlCharacters: href.length,
      },
      warning: href.length > WARNING_LENGTH,
    };
  }

  async function openV3Dialog(options) {
    if (!root.document) throw new Error("Sharing UI requires a browser.");
    const shared = await createShare({ ...options, version: 3 });
    root.document.getElementById("structureShareDialog")?.remove();
    const dialog = root.document.createElement("dialog");
    dialog.id = "structureShareDialog";
    dialog.className = "structure-share-dialog structure-share-v3-dialog";
    const sizes = shared.sizes;
    dialog.innerHTML = `<form method="dialog"><header><h2>Share structure</h2><button value="close" type="submit" class="secondary" aria-label="Close">Close</button></header><label>Lossless URL<textarea data-share-url readonly spellcheck="false"></textarea></label><p class="structure-share-message${shared.warning ? " warn" : ""}" data-share-message>${sizes.sourceBytes.toLocaleString()} source bytes · ${sizes.decodedBytes.toLocaleString()} decoded bytes · ${sizes.encodedBytes.toLocaleString()} encoded bytes · ${sizes.urlBytes.toLocaleString()} URL bytes${shared.warning ? " · URL exceeds 8,000 characters" : ""}</p><div class="structure-share-actions"><button type="button" class="secondary" data-share-make-qr disabled title="QR is currently available for XYZ v2 shares only">Make QR</button><button type="button" data-share-copy>Copy URL</button></div></form>`;
    root.document.body.appendChild(dialog);
    const output = dialog.querySelector("[data-share-url]"); output.value = shared.url;
    dialog.querySelector("[data-share-copy]").addEventListener("click", async () => {
      await root.navigator.clipboard.writeText(shared.url);
      dialog.querySelector("[data-share-message]").textContent = "Share URL copied.";
    });
    dialog.addEventListener("close", () => dialog.remove());
    if (dialog.showModal) dialog.showModal(); else dialog.setAttribute("open", "");
    return { ...shared, dialog };
  }

  async function openDialog(options = {}) {
    return selectVersion(options) === 2 ? v2.openDialog(options) : openV3Dialog(options);
  }

  return {
    ...v2,
    WARNING_LENGTH,
    QR_FINAL_URL_BYTES,
    selectVersion,
    decodeHash,
    payloadFromHash,
    buildUrl,
    describeUrl,
    assertQrCapacity,
    assertQrEligible,
    createLosslessViewerShare,
    createShare,
    openDialog,
  };
});
