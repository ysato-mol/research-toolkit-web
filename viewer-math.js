(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? require("./core/atom-identity.js")
    : root.StructureViewerCore || {};
  const api = factory(dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerMath = api;
})(typeof window !== "undefined" ? window : globalThis, function (dependencies) {
  "use strict";
  function resolvedPositions(args, legacyCount) {
    if (args.length === legacyCount) return args;
    if (args.length !== legacyCount + 1 || !Array.isArray(args[0]?.atoms)) {
      throw new TypeError(`Expected ${legacyCount} coordinates or a scene followed by ${legacyCount} atom identities.`);
    }
    const [scene, ...identities] = args;
    return identities.map((identity) => {
      const atom = dependencies.resolveIdentity?.(scene, identity);
      if (!atom) throw new Error(`Atom identity does not resolve in the current scene: ${dependencies.serializeAtomIdentity?.(identity) || "unknown"}`);
      return atom.position;
    });
  }
  function component(point, index) {
    if (Array.isArray(point)) return point[index];
    return point[["x", "y", "z"][index]];
  }
  function distance(...args) {
    const [a, b] = resolvedPositions(args, 2);
    return Math.hypot(component(a, 0) - component(b, 0), component(a, 1) - component(b, 1), component(a, 2) - component(b, 2));
  }
  function vector(a, b) { return [component(a, 0) - component(b, 0), component(a, 1) - component(b, 1), component(a, 2) - component(b, 2)]; }
  function dot(a, b) { return a[0] * b[0] + a[1] * b[1] + a[2] * b[2]; }
  function cross(a, b) { return [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]; }
  function norm(a) { return Math.hypot(...a); }
  function angle(...args) {
    const [a, b, c] = resolvedPositions(args, 3);
    const u = vector(a, b); const v = vector(c, b);
    return Math.acos(Math.max(-1, Math.min(1, dot(u, v) / (norm(u) * norm(v))))) * 180 / Math.PI;
  }
  function dihedral(...args) {
    const [a, b, c, d] = resolvedPositions(args, 4);
    const b0 = vector(a, b); const b1 = vector(c, b); const b2 = vector(d, c);
    const axis = b1.map((value) => value / norm(b1));
    const v = b0.map((value, index) => value - dot(b0, axis) * axis[index]);
    const w = b2.map((value, index) => value - dot(b2, axis) * axis[index]);
    return Math.atan2(dot(cross(axis, v), w), dot(v, w)) * 180 / Math.PI;
  }

  const MEASUREMENT_KIND = Object.freeze({ 2: "distance", 3: "angle", 4: "dihedral" });

  function measurementForSelection(selection) {
    if (!Array.isArray(selection)) throw new TypeError("Selection must be an array.");
    const kind = MEASUREMENT_KIND[selection.length];
    if (!kind) return null;
    return Object.freeze({
      measurementId: "selection:auto",
      kind,
      atomIdentities: Object.freeze(selection.map((identity) => dependencies.makeAtomIdentity(identity))),
      visible: true,
    });
  }

  function evaluateMeasurement(scene, definition) {
    const identities = definition?.atomIdentities;
    const expected = definition?.kind === "distance" ? 2 : definition?.kind === "angle" ? 3 : definition?.kind === "dihedral" ? 4 : 0;
    if (!expected || !Array.isArray(identities) || identities.length !== expected) throw new TypeError("MeasurementDefinition is invalid.");
    if (identities.some((identity) => !dependencies.resolveIdentity(scene, identity))) {
      return Object.freeze({ definition, status: "unavailable" });
    }
    const value = definition.kind === "distance"
      ? distance(scene, ...identities)
      : definition.kind === "angle"
        ? angle(scene, ...identities)
        : dihedral(scene, ...identities);
    return Object.freeze({ definition, status: "available", value, unit: definition.kind === "distance" ? "angstrom" : "degree" });
  }

  return { distance, angle, dihedral, measurementForSelection, evaluateMeasurement };
});
