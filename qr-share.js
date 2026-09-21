(function (root, factory) {
  const share = root?.StructureShare || (typeof module === "object" && module.exports ? require("./share-codec.js") : null);
  const api = factory(share);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureShareQr = api;
})(typeof window !== "undefined" ? window : globalThis, function (share) {
  "use strict";

  const OMIT_CHARGE = 1;
  const OMIT_MULTIPLICITY = 2;
  const OMIT_HYDROGENS = 4;
  const PRECISION_SCALES = new Map([
    [0.0001, 10000],
    [0.001, 1000],
    [0.01, 100],
    [0.05, 20],
  ]);
  const ERROR_CORRECTION_LEVELS = new Set(["L", "M", "Q", "H"]);
  const capacityCaches = new WeakMap();

  function scaleForPrecision(precision) {
    if (precision === "lossless") return undefined;
    if (!PRECISION_SCALES.has(precision)) throw new Error("Unsupported QR coordinate precision.");
    return PRECISION_SCALES.get(precision);
  }

  function createQrPayload(payload, settings) {
    if (!share?.validatePayload) throw new Error("StructureShare must be loaded before StructureShareQr.");
    share.validatePayload(payload);
    const scale = scaleForPrecision(settings?.precision);
    const includeHydrogens = settings?.includeHydrogens !== false;
    const elements = [];
    const coordinates = [];
    payload.elements.forEach((element, index) => {
      if (!includeHydrogens && element === "H") return;
      elements.push(element);
      coordinates.push(payload.coordinates[index].slice());
    });
    if (!elements.length) throw new Error("The QR profile cannot omit every atom.");

    const result = { schema: share.SCHEMA, elements, coordinates };
    let omissions = 0;
    if (settings?.includeCharge === false) omissions |= OMIT_CHARGE;
    else if (Object.hasOwn(payload, "charge")) result.charge = Number(payload.charge);
    if (settings?.includeMultiplicity === false) omissions |= OMIT_MULTIPLICITY;
    else if (Object.hasOwn(payload, "multiplicity")) result.multiplicity = Number(payload.multiplicity);
    if (!includeHydrogens) omissions |= OMIT_HYDROGENS;
    if (scale !== undefined || omissions) {
      result.profile = {};
      if (scale !== undefined) result.profile.scale = scale;
      if (omissions) result.profile.omissions = omissions;
    }
    return share.validatePayload(result);
  }

  function validateCapacitySettings(settings) {
    if (!ERROR_CORRECTION_LEVELS.has(settings?.errorCorrection)) throw new Error("Unsupported QR error-correction level.");
    if (!Number.isInteger(settings?.maxVersion) || settings.maxVersion < 1 || settings.maxVersion > 40) {
      throw new Error("QR maximum version must be an integer from 1 to 40.");
    }
  }

  function isOverflow(error) {
    return /code length overflow/i.test(String(error));
  }

  function canEncode(data, version, errorCorrection, qrcodeFactory) {
    const qr = qrcodeFactory(version, errorCorrection);
    qr.addData(data, "Byte");
    try {
      qr.make();
      return true;
    } catch (error) {
      if (isOverflow(error)) return false;
      throw error;
    }
  }

  function cacheFor(qrcodeFactory) {
    let cache = capacityCaches.get(qrcodeFactory);
    if (!cache) {
      cache = new Map();
      capacityCaches.set(qrcodeFactory, cache);
    }
    return cache;
  }

  function capacityFor(version, errorCorrection, qrcodeFactory) {
    const cache = cacheFor(qrcodeFactory);
    const key = `${version}:${errorCorrection}`;
    if (cache.has(key)) return cache.get(key);

    let low = 0;
    let high = 1;
    const ceiling = 65536;
    while (high < ceiling && canEncode("x".repeat(high), version, errorCorrection, qrcodeFactory)) {
      low = high;
      high *= 2;
    }
    if (high === ceiling && canEncode("x".repeat(high), version, errorCorrection, qrcodeFactory)) {
      cache.set(key, high);
      return high;
    }
    while (low + 1 < high) {
      const middle = Math.floor((low + high) / 2);
      if (canEncode("x".repeat(middle), version, errorCorrection, qrcodeFactory)) low = middle;
      else high = middle;
    }
    cache.set(key, low);
    return low;
  }

  function evaluateUrl(url, settings, qrcodeFactory) {
    validateCapacitySettings(settings);
    if (typeof qrcodeFactory !== "function") throw new Error("A QR encoder factory is required.");
    const value = String(url);
    const encodedBytes = new TextEncoder().encode(value).length;
    let low = 1;
    let high = settings.maxVersion;
    let version = null;
    while (low <= high) {
      const middle = Math.floor((low + high) / 2);
      if (capacityFor(middle, settings.errorCorrection, qrcodeFactory) >= encodedBytes) {
        version = middle;
        high = middle - 1;
      } else {
        low = middle + 1;
      }
    }

    if (version !== null && canEncode(value, version, settings.errorCorrection, qrcodeFactory)) {
      const capacityBytes = capacityFor(version, settings.errorCorrection, qrcodeFactory);
      return {
        fits: true,
        encodedBytes,
        capacityBytes,
        remainingBytes: capacityBytes - encodedBytes,
        version,
        error: null,
      };
    }

    const capacityBytes = capacityFor(settings.maxVersion, settings.errorCorrection, qrcodeFactory);
    const remainingBytes = capacityBytes - encodedBytes;
    return {
      fits: false,
      encodedBytes,
      capacityBytes,
      remainingBytes,
      version: null,
      error: `QR data does not fit version ${settings.maxVersion} at error correction ${settings.errorCorrection} (${Math.abs(remainingBytes)} bytes over capacity).`,
    };
  }

  function autoFitCandidates(settings) {
    const common = {
      errorCorrection: settings.errorCorrection,
      maxVersion: settings.maxVersion,
    };
    return [
      { precision: "lossless", includeHydrogens: true, includeCharge: true, includeMultiplicity: true, ...common },
      { precision: 0.0001, includeHydrogens: true, includeCharge: true, includeMultiplicity: true, ...common },
      { precision: 0.001, includeHydrogens: true, includeCharge: true, includeMultiplicity: true, ...common },
      { precision: 0.01, includeHydrogens: true, includeCharge: true, includeMultiplicity: true, ...common },
      { precision: 0.05, includeHydrogens: true, includeCharge: true, includeMultiplicity: true, ...common },
      { precision: 0.05, includeHydrogens: true, includeCharge: true, includeMultiplicity: false, ...common },
      { precision: 0.05, includeHydrogens: true, includeCharge: false, includeMultiplicity: false, ...common },
      { precision: 0.05, includeHydrogens: false, includeCharge: true, includeMultiplicity: true, ...common },
      { precision: 0.05, includeHydrogens: false, includeCharge: true, includeMultiplicity: false, ...common },
      { precision: 0.05, includeHydrogens: false, includeCharge: false, includeMultiplicity: false, ...common },
    ];
  }

  async function autoFit(payload, makeUrl, settings, qrcodeFactory) {
    if (typeof makeUrl !== "function") throw new Error("A URL builder is required.");
    let lastResult = null;
    for (const candidateSettings of autoFitCandidates(settings)) {
      const candidatePayload = createQrPayload(payload, candidateSettings);
      const url = await makeUrl(candidatePayload);
      const fit = evaluateUrl(url, candidateSettings, qrcodeFactory);
      lastResult = { settings: candidateSettings, payload: candidatePayload, url, fit };
      if (fit.fits) return lastResult;
    }
    return lastResult;
  }

  function renderPng(qr, canvasFactory, options = {}) {
    if (!qr || typeof qr.getModuleCount !== "function" || typeof qr.isDark !== "function") {
      throw new Error("A completed QR matrix is required.");
    }
    if (typeof canvasFactory !== "function") throw new Error("A canvas factory is required.");
    const moduleCount = qr.getModuleCount();
    const quietZone = Math.max(4, Number.isInteger(options.quietZone) ? options.quietZone : 4);
    const totalModules = moduleCount + quietZone * 2;
    let moduleSize = Number.isInteger(options.moduleSize) ? options.moduleSize : 8;
    if (Number.isFinite(options.size)) moduleSize = Math.max(1, Math.floor(options.size / totalModules));
    if (!Number.isInteger(moduleSize) || moduleSize < 1) throw new Error("QR module size must be a positive integer.");
    const size = totalModules * moduleSize;
    const canvas = canvasFactory(size, size);
    canvas.width = size;
    canvas.height = size;
    const context = canvas.getContext("2d");
    if (!context) throw new Error("A 2D canvas context is required.");
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, size, size);
    context.fillStyle = "#000000";
    for (let row = 0; row < moduleCount; row += 1) {
      for (let column = 0; column < moduleCount; column += 1) {
        if (!qr.isDark(row, column)) continue;
        context.fillRect((column + quietZone) * moduleSize, (row + quietZone) * moduleSize, moduleSize, moduleSize);
      }
    }
    return canvas;
  }

  function pngFilename(settings) {
    const precision = settings?.precision;
    if (precision === "lossless") return "structure-share-qr-lossless.png";
    scaleForPrecision(precision);
    return `structure-share-qr-${String(precision).replace(".", "p")}A.png`;
  }

  return {
    createQrPayload,
    evaluateUrl,
    autoFit,
    renderPng,
    pngFilename,
  };
});
