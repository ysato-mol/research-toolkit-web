/* Research Toolkit Structure Viewer classic bundle. Generated deterministically; edit source modules. */
/* web/structure-viewer/core/constants.js */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerCore = Object.assign(root.StructureViewerCore || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const LIMITS = Object.freeze({
    inputSourceBytes: 32 * 1024 * 1024,
    sourceAtomSites: 250000,
    models: 10000,
    sourceBonds: 1000000,
    derivedAtoms: 300000,
    derivedBonds: 1200000,
    symmetryOperations: 512,
    replicationAxisMin: -10,
    replicationAxisMax: 10,
    replicationCandidateCells: 9261,
    v3DecodedJsonBytes: 8 * 1024 * 1024,
    v3EncodedFragmentCharacters: 12000000,
    qrFinalUrlBytes: 2953,
    mainThreadSliceMs: 8,
  });

  const CAPABILITIES = Object.freeze({
    v3000: "required-openchemlib-9.18.2",
  });

  const COVALENT_RADII_ANGSTROM = Object.freeze({
    H: 0.31, He: 0.28, Li: 1.28, Be: 0.96, B: 0.84, C: 0.76, N: 0.71, O: 0.66, F: 0.57, Ne: 0.58,
    Na: 1.66, Mg: 1.41, Al: 1.21, Si: 1.11, P: 1.07, S: 1.05, Cl: 1.02, Ar: 1.06, K: 2.03, Ca: 1.76,
    Sc: 1.70, Ti: 1.60, V: 1.53, Cr: 1.39, Mn: 1.39, Fe: 1.32, Co: 1.26, Ni: 1.24, Cu: 1.32, Zn: 1.22,
    Ga: 1.22, Ge: 1.20, As: 1.19, Se: 1.20, Br: 1.20, Kr: 1.16, Rb: 2.20, Sr: 1.95, Y: 1.90, Zr: 1.75,
    Nb: 1.64, Mo: 1.54, Tc: 1.47, Ru: 1.46, Rh: 1.42, Pd: 1.39, Ag: 1.45, Cd: 1.44, In: 1.42, Sn: 1.39,
    Sb: 1.39, Te: 1.38, I: 1.39, Xe: 1.40, Cs: 2.44, Ba: 2.15, La: 2.07, Ce: 2.04, Pr: 2.03, Nd: 2.01,
    Pm: 1.99, Sm: 1.98, Eu: 1.98, Gd: 1.96, Tb: 1.94, Dy: 1.92, Ho: 1.92, Er: 1.89, Tm: 1.90, Yb: 1.87,
    Lu: 1.87, Hf: 1.75, Ta: 1.70, W: 1.62, Re: 1.51, Os: 1.44, Ir: 1.41, Pt: 1.36, Au: 1.36, Hg: 1.32,
    Tl: 1.45, Pb: 1.46, Bi: 1.48, Po: 1.40, At: 1.50, Rn: 1.50,
  });

  const TRANSITION_METALS = Object.freeze(new Set((
    "Sc Ti V Cr Mn Fe Co Ni Cu Zn Y Zr Nb Mo Tc Ru Rh Pd Ag Cd Hf Ta W Re Os Ir Pt Au Hg Rf Db Sg Bh Hs Mt Ds Rg Cn"
  ).split(" ")));

  return { LIMITS, CAPABILITIES, COVALENT_RADII_ANGSTROM, TRANSITION_METALS };
});
;
/* web/structure-viewer/crystal/unit-cell.js */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerCrystal = Object.assign(root.StructureViewerCrystal || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const EPSILON = 1e-12;

  function finite(value, label) {
    if (!Number.isFinite(value)) throw new TypeError(`${label} must be finite.`);
    return value;
  }

  function vector3(value, label) {
    if (!Array.isArray(value) || value.length !== 3) throw new TypeError(`${label} must contain three finite values.`);
    return value.map((entry, index) => finite(entry, `${label}[${index}]`));
  }

  function inverse3(matrix) {
    const [a, b, c, d, e, f, g, h, i] = matrix;
    const A = e * i - f * h; const B = f * g - d * i; const C = d * h - e * g;
    const determinant = a * A + b * B + c * C;
    if (!Number.isFinite(determinant) || determinant <= EPSILON) {
      throw new Error("Unit cell matrix is singular or left-handed.");
    }
    return {
      determinant,
      inverse: [A, c * h - b * i, b * f - c * e, B, a * i - c * g, c * d - a * f, C, b * g - a * h, a * e - b * d]
        .map((entry) => entry / determinant),
    };
  }

  function matrix4(matrix) {
    return Object.freeze([
      matrix[0], matrix[1], matrix[2], 0,
      matrix[3], matrix[4], matrix[5], 0,
      matrix[6], matrix[7], matrix[8], 0,
      0, 0, 0, 1,
    ]);
  }

  function createUnitCell(a, b, c, alphaDeg, betaDeg, gammaDeg) {
    [a, b, c, alphaDeg, betaDeg, gammaDeg].forEach((value, index) => finite(value, ["a", "b", "c", "alpha", "beta", "gamma"][index]));
    if (a <= 0 || b <= 0 || c <= 0) throw new RangeError("Unit cell lengths must be positive.");
    if ([alphaDeg, betaDeg, gammaDeg].some((angle) => angle <= 0 || angle >= 180)) {
      throw new RangeError("Unit cell angles must be between 0 and 180 degrees.");
    }
    const radians = Math.PI / 180;
    const ca = Math.cos(alphaDeg * radians); const cb = Math.cos(betaDeg * radians); const cg = Math.cos(gammaDeg * radians);
    const sg = Math.sin(gammaDeg * radians);
    const volumeTerm = 1 - ca * ca - cb * cb - cg * cg + 2 * ca * cb * cg;
    if (Math.abs(sg) <= EPSILON || volumeTerm <= EPSILON) throw new Error("Unit cell angles form a singular or invalid cell.");
    const fracToCart3 = [
      a, b * cg, c * cb,
      0, b * sg, c * (ca - cb * cg) / sg,
      0, 0, c * Math.sqrt(volumeTerm) / sg,
    ];
    const inverted = inverse3(fracToCart3);
    return Object.freeze({
      a, b, c, alphaDeg, betaDeg, gammaDeg,
      volume: inverted.determinant,
      fracToCart: matrix4(fracToCart3),
      cartToFrac: matrix4(inverted.inverse),
    });
  }

  function validateCell(cell) {
    if (!cell || typeof cell !== "object") throw new TypeError("Unit cell object is required.");
    ["a", "b", "c", "alphaDeg", "betaDeg", "gammaDeg", "volume"].forEach((key) => finite(cell[key], `cell.${key}`));
    if (cell.a <= 0 || cell.b <= 0 || cell.c <= 0 || cell.volume <= 0) throw new RangeError("Unit cell lengths and volume must be positive.");
    for (const key of ["fracToCart", "cartToFrac"]) {
      if (!Array.isArray(cell[key]) || cell[key].length !== 16 || !cell[key].every(Number.isFinite)) {
        throw new TypeError(`Unit cell ${key} matrix must contain 16 finite values.`);
      }
    }
    const determinant = inverse3([
      cell.fracToCart[0], cell.fracToCart[1], cell.fracToCart[2],
      cell.fracToCart[4], cell.fracToCart[5], cell.fracToCart[6],
      cell.fracToCart[8], cell.fracToCart[9], cell.fracToCart[10],
    ]).determinant;
    if (Math.abs(determinant - cell.volume) > Math.max(1, cell.volume) * 1e-10) throw new Error("Unit cell matrix and volume are inconsistent.");
    return cell;
  }

  function transform(matrix, input) {
    const [x, y, z] = vector3(input, "coordinate");
    return Object.freeze([
      matrix[0] * x + matrix[1] * y + matrix[2] * z,
      matrix[4] * x + matrix[5] * y + matrix[6] * z,
      matrix[8] * x + matrix[9] * y + matrix[10] * z,
    ]);
  }

  function fractionalToCartesian(cell, fractional) {
    validateCell(cell);
    return transform(cell.fracToCart, fractional);
  }

  function cartesianToFractional(cell, cartesian) {
    validateCell(cell);
    return transform(cell.cartToFrac, cartesian);
  }

  function cellEdges(cell) {
    validateCell(cell);
    return Object.freeze([
      Object.freeze([cell.fracToCart[0], cell.fracToCart[4], cell.fracToCart[8]]),
      Object.freeze([cell.fracToCart[1], cell.fracToCart[5], cell.fracToCart[9]]),
      Object.freeze([cell.fracToCart[2], cell.fracToCart[6], cell.fracToCart[10]]),
    ]);
  }

  function cross(left, right) {
    return [
      left[1] * right[2] - left[2] * right[1],
      left[2] * right[0] - left[0] * right[2],
      left[0] * right[1] - left[1] * right[0],
    ];
  }

  function perpendicularHeights(cell) {
    const [a, b, c] = cellEdges(cell);
    return Object.freeze([
      cell.volume / Math.hypot(...cross(b, c)),
      cell.volume / Math.hypot(...cross(c, a)),
      cell.volume / Math.hypot(...cross(a, b)),
    ]);
  }

  return { createUnitCell, fractionalToCartesian, cartesianToFractional, perpendicularHeights, cellEdges, validateCell };
});
;
/* web/structure-viewer/crystal/symmetry.js */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerCrystal = Object.assign(root.StructureViewerCrystal || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function gcd(left, right) {
    let a = Math.abs(left); let b = Math.abs(right);
    while (b) [a, b] = [b, a % b];
    return a || 1;
  }

  function reduceRational(numerator, denominator = 1) {
    if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator)) throw new TypeError("Symmetry rational values must be safe integers.");
    if (denominator === 0) throw new RangeError("Symmetry rational denominator cannot be zero.");
    if (numerator === 0) return Object.freeze({ numerator: 0, denominator: 1 });
    const sign = denominator < 0 ? -1 : 1;
    const divisor = gcd(numerator, denominator);
    return Object.freeze({ numerator: sign * numerator / divisor, denominator: Math.abs(denominator) / divisor });
  }

  function add(left, right) {
    return reduceRational(left.numerator * right.denominator + right.numerator * left.denominator, left.denominator * right.denominator);
  }

  function multiply(left, right) {
    return reduceRational(left.numerator * right.numerator, left.denominator * right.denominator);
  }

  function normalizeTranslation(value) {
    const reduced = reduceRational(value.numerator, value.denominator);
    const numerator = ((reduced.numerator % reduced.denominator) + reduced.denominator) % reduced.denominator;
    return reduceRational(numerator, reduced.denominator);
  }

  function parseComponent(source) {
    const compact = source.replace(/\s+/g, "").toLowerCase();
    if (!compact) throw new Error("Symmetry component cannot be empty.");
    const signed = /^[+-]/.test(compact) ? compact : `+${compact}`;
    const terms = signed.match(/[+-][^+-]+/g) || [];
    if (!terms.length || terms.join("") !== signed) throw new Error(`Invalid symmetry component '${source}'.`);
    const rotation = [0, 0, 0];
    let translation = reduceRational(0);
    terms.forEach((signedTerm) => {
      const sign = signedTerm[0] === "-" ? -1 : 1;
      const term = signedTerm.slice(1);
      const axis = ["x", "y", "z"].indexOf(term);
      if (axis >= 0) {
        rotation[axis] += sign;
        if (Math.abs(rotation[axis]) > 1) throw new Error(`Nonlinear or scaled symmetry variable '${term}' is unsupported.`);
        return;
      }
      if (/[xyz]/i.test(term)) throw new Error(`Invalid symmetry variable or nonlinear term '${term}'.`);
      const fraction = /^(\d+)(?:\/(\d+))?$/.exec(term);
      if (!fraction) throw new Error(`Invalid symmetry term '${term}'.`);
      translation = add(translation, reduceRational(sign * Number(fraction[1]), Number(fraction[2] || 1)));
    });
    if (!rotation.some(Boolean)) throw new Error(`Symmetry component '${source}' contains no coordinate variable.`);
    return { rotation: Object.freeze(rotation), translation: normalizeTranslation(translation) };
  }

  function expressionFromExact(rotationExact, translationExact) {
    const axes = ["x", "y", "z"];
    return [0, 1, 2].map((row) => {
      const terms = [];
      axes.forEach((axis, column) => {
        const value = rotationExact[row * 3 + column];
        if (!value || value.numerator === 0) return;
        const sign = value.numerator < 0 ? "-" : "+";
        const magnitude = Math.abs(value.numerator);
        const coefficient = value.denominator === 1 ? (magnitude === 1 ? "" : String(magnitude)) : `${magnitude}/${value.denominator}`;
        terms.push({ sign, text: `${coefficient}${axis}` });
      });
      const shift = translationExact[row];
      if (shift.numerator !== 0) terms.push({ sign: "+", text: shift.denominator === 1 ? String(shift.numerator) : `${shift.numerator}/${shift.denominator}` });
      return terms.map((term, index) => `${index === 0 && term.sign === "+" ? "" : term.sign}${term.text}`).join("") || "0";
    }).join(",");
  }

  function canonicalSymmetryExpression(operationOrRotation, translation) {
    if (Array.isArray(operationOrRotation)) return expressionFromExact(operationOrRotation, translation);
    if (!operationOrRotation || !Array.isArray(operationOrRotation.rotationExact) || !Array.isArray(operationOrRotation.translationExact)) {
      throw new TypeError("A symmetry operation or exact rotation and translation are required.");
    }
    return expressionFromExact(operationOrRotation.rotationExact, operationOrRotation.translationExact);
  }

  function parseSymmetryExpression(expression) {
    if (typeof expression !== "string") throw new TypeError("Symmetry expression must be a string.");
    const components = expression.split(",");
    if (components.length !== 3) throw new Error("Symmetry expression must contain exactly three components.");
    const parsed = components.map(parseComponent);
    const rotation = Object.freeze(parsed.flatMap((component) => component.rotation));
    const rotationExact = Object.freeze(rotation.map((value) => reduceRational(value)));
    const translationExact = Object.freeze(parsed.map((component) => component.translation));
    const canonicalExpression = expressionFromExact(rotationExact, translationExact);
    return Object.freeze({
      operationId: `symop:${canonicalExpression}`,
      canonicalExpression,
      sourceExpression: expression,
      rotation,
      translation: translationExact,
      rotationExact,
      translationExact,
      rotationNumeric: Object.freeze(rotation.slice()),
      translationNumeric: Object.freeze(translationExact.map((value) => value.numerator / value.denominator)),
    });
  }

  function validateExactVector(vector) {
    if (!Array.isArray(vector) || vector.length !== 3) throw new TypeError("Exact fractional coordinate must contain three rational values.");
    return vector.map((value) => {
      if (!value || typeof value !== "object") throw new TypeError("Exact fractional coordinate entries must be rational values.");
      return reduceRational(value.numerator, value.denominator);
    });
  }

  function applySymmetryExact(operation, fractional) {
    const coordinate = validateExactVector(fractional);
    return Object.freeze([0, 1, 2].map((row) => {
      let value = operation.translationExact[row];
      for (let column = 0; column < 3; column += 1) value = add(value, multiply(operation.rotationExact[row * 3 + column], coordinate[column]));
      return value;
    }));
  }

  function applySymmetryFloat(operation, fractional) {
    if (!Array.isArray(fractional) || fractional.length !== 3 || !fractional.every(Number.isFinite)) {
      throw new TypeError("Fractional coordinate must contain three finite values.");
    }
    return Object.freeze([0, 1, 2].map((row) => operation.translationNumeric[row]
      + operation.rotationNumeric[row * 3] * fractional[0]
      + operation.rotationNumeric[row * 3 + 1] * fractional[1]
      + operation.rotationNumeric[row * 3 + 2] * fractional[2]));
  }

  function sortSymmetryOperations(operations) {
    if (!Array.isArray(operations)) throw new TypeError("Symmetry operations must be an array.");
    return Object.freeze([...operations].sort((left, right) => left.operationId.localeCompare(right.operationId)));
  }

  function transformPeriodicImage(globalOperation, imageOperation, cellTranslation, operations) {
    if (!globalOperation || !imageOperation || !Array.isArray(cellTranslation) || cellTranslation.length !== 3) {
      throw new TypeError("Periodic image transformation requires two operations and an Int3 translation.");
    }
    const rotation = Array(9).fill(0);
    for (let row = 0; row < 3; row += 1) for (let column = 0; column < 3; column += 1) {
      for (let inner = 0; inner < 3; inner += 1) {
        rotation[row * 3 + column] += globalOperation.rotationNumeric[row * 3 + inner] * imageOperation.rotationNumeric[inner * 3 + column];
      }
    }
    const inputTranslation = imageOperation.translationNumeric.map((value, index) => value + cellTranslation[index]);
    const rawTranslation = [0, 1, 2].map((row) => globalOperation.translationNumeric[row]
      + globalOperation.rotationNumeric[row * 3] * inputTranslation[0]
      + globalOperation.rotationNumeric[row * 3 + 1] * inputTranslation[1]
      + globalOperation.rotationNumeric[row * 3 + 2] * inputTranslation[2]);
    const normalizedTranslation = rawTranslation.map((value) => {
      const normalized = value - Math.floor(value);
      return Math.abs(normalized - 1) <= 1e-9 || Math.abs(normalized) <= 1e-9 ? 0 : normalized;
    });
    const composed = operations.find((operation) => operation.rotationNumeric.every((value, index) => Math.abs(value - rotation[index]) <= 1e-9)
      && operation.translationNumeric.every((value, index) => Math.abs(value - normalizedTranslation[index]) <= 1e-9));
    if (!composed) throw new Error("The declared symmetry operations are not closed under bond-image transformation.");
    return Object.freeze({
      symmetryOperationId: composed.operationId,
      cellTranslation: Object.freeze(rawTranslation.map((value, index) => Math.round(value - composed.translationNumeric[index]))),
    });
  }

  return { parseSymmetryExpression, reduceRational, canonicalSymmetryExpression, applySymmetryExact, applySymmetryFloat, sortSymmetryOperations, transformPeriodicImage };
});
;
/* web/structure-viewer/crystal/disorder.js */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerCrystal = Object.assign(root.StructureViewerCrystal || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const MODES = new Set(["all", "highest-occupancy", "group"]);

  function validateSites(sites) {
    if (!Array.isArray(sites)) throw new TypeError("Disorder selection requires a site array.");
    sites.forEach((site, index) => {
      if (!site || typeof site !== "object") throw new TypeError(`Site ${index} is invalid.`);
      if (!Number.isFinite(site.occupancy) || site.occupancy < 0 || site.occupancy > 1) {
        throw new RangeError(`Site ${site.siteId || index} occupancy must be between 0 and 1.`);
      }
    });
  }

  function sourceOrder(site, index) {
    return Number.isSafeInteger(site.sourceRow) ? site.sourceRow : index;
  }

  function selectDisorderSites(sites, options = {}) {
    validateSites(sites);
    const mode = options.mode ?? "all";
    const minimumOccupancy = options.minimumOccupancy ?? 0;
    if (!MODES.has(mode)) throw new TypeError(`Disorder mode '${mode}' is invalid.`);
    if (!Number.isFinite(minimumOccupancy) || minimumOccupancy < 0 || minimumOccupancy > 1) {
      throw new RangeError("minimumOccupancy must be between 0 and 1.");
    }
    const eligible = sites.filter((site) => site.occupancy >= minimumOccupancy);
    if (mode === "all") return Object.freeze([...eligible]);

    const ordinary = eligible.filter((site) => !site.disorderGroup);
    const disordered = eligible.filter((site) => site.disorderGroup);
    if (mode === "group") {
      if (typeof options.disorderGroup !== "string" || !options.disorderGroup) throw new TypeError("group mode requires disorderGroup.");
      const assemblies = [...new Set(disordered.filter((site) => site.disorderGroup === options.disorderGroup).map((site) => site.disorderAssembly || ""))];
      if (!options.disorderAssembly && assemblies.length > 1) throw new Error(`disorderGroup '${options.disorderGroup}' is ambiguous across assemblies.`);
      const assembly = options.disorderAssembly ?? assemblies[0];
      if (assembly === undefined) throw new Error(`disorderGroup '${options.disorderGroup}' was not found.`);
      const selected = disordered.filter((site) => site.disorderGroup === options.disorderGroup && (site.disorderAssembly || "") === assembly);
      if (!selected.length) throw new Error(`disorderGroup '${options.disorderGroup}' was not found in assembly '${assembly}'.`);
      const selectedSet = new Set(selected);
      return Object.freeze(eligible.filter((site) => ordinary.includes(site) || selectedSet.has(site)));
    }

    const byAssembly = new Map();
    disordered.forEach((site, index) => {
      const assembly = site.disorderAssembly || "";
      const groups = byAssembly.get(assembly) || new Map();
      const group = groups.get(site.disorderGroup) || { sites: [], occupancy: site.occupancy, first: sourceOrder(site, index) };
      group.sites.push(site);
      group.occupancy = Math.max(group.occupancy, site.occupancy);
      group.first = Math.min(group.first, sourceOrder(site, index));
      groups.set(site.disorderGroup, group);
      byAssembly.set(assembly, groups);
    });
    const winners = new Set();
    byAssembly.forEach((groups) => {
      const winner = [...groups.values()].sort((left, right) => right.occupancy - left.occupancy || left.first - right.first)[0];
      winner?.sites.forEach((site) => winners.add(site));
    });
    return Object.freeze(eligible.filter((site) => ordinary.includes(site) || winners.has(site)));
  }

  return { selectDisorderSites };
});
;
/* web/structure-viewer/crystal/expander.js */
(function (root, factory) {
  const symmetry = typeof module === "object" && module.exports ? require("./symmetry.js") : root.StructureViewerCrystal;
  const identity = typeof module === "object" && module.exports ? require("../core/atom-identity.js") : root.StructureViewerCore;
  const api = factory(symmetry, identity);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerCrystal = Object.assign(root.StructureViewerCrystal || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (symmetry, identityApi) {
  "use strict";

  const POSITION_TOLERANCE = 1e-6;

  function int3(value, label) {
    if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isSafeInteger)) {
      throw new TypeError(`${label} must contain three safe integers.`);
    }
    return Object.freeze([...value]);
  }

  function fractional(site) {
    const value = site?.fractional?.frac;
    if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isFinite)) {
      throw new TypeError(`Site ${site?.siteId || "?"} requires three finite fractional coordinates.`);
    }
    return value;
  }

  function canonicalCoordinate(value) {
    const nearest = Math.round(value);
    if (Math.abs(value - nearest) <= POSITION_TOLERANCE) return { coordinate: 0, carry: nearest };
    const carry = Math.floor(value);
    const coordinate = value - carry;
    return { coordinate: Math.abs(coordinate - 1) <= POSITION_TOLERANCE ? 0 : coordinate, carry: Math.abs(coordinate - 1) <= POSITION_TOLERANCE ? carry + 1 : carry };
  }

  function vectorEqual(left, right) {
    return left.every((value, index) => Math.abs(value - right[index]) <= POSITION_TOLERANCE);
  }

  function disorderKey(site) {
    if (site.disorderKey) return site.disorderKey;
    const tuple = [site.disorderAssembly || null, site.disorderGroup || null, site.altLocation || null];
    return tuple.some((entry) => entry !== null) ? JSON.stringify(tuple) : undefined;
  }

  function compareCandidate(left, right) {
    return left.symmetryOperationId.localeCompare(right.symmetryOperationId)
      || left.effectiveCellTranslation[0] - right.effectiveCellTranslation[0]
      || left.effectiveCellTranslation[1] - right.effectiveCellTranslation[1]
      || left.effectiveCellTranslation[2] - right.effectiveCellTranslation[2];
  }

  function candidateFor(site, operation, requestedCellTranslation, wrap) {
    const transformed = symmetry.applySymmetryFloat(operation, fractional(site));
    const canonical = transformed.map(canonicalCoordinate);
    const effectiveCellTranslation = Object.freeze(canonical.map((entry, index) => requestedCellTranslation[index] + entry.carry));
    const unwrapped = transformed.map((value, index) => value + requestedCellTranslation[index]);
    const displayWrapAdjustment = Object.freeze(wrap ? unwrapped.map((value) => {
      const adjustment = -Math.floor(value + POSITION_TOLERANCE);
      return Object.is(adjustment, -0) ? 0 : adjustment;
    }) : [0, 0, 0]);
    const fractionalPosition = Object.freeze(unwrapped.map((value, index) => {
      const displayed = value + displayWrapAdjustment[index];
      return Math.abs(displayed) <= POSITION_TOLERANCE || Math.abs(displayed - 1) <= POSITION_TOLERANCE ? 0 : displayed;
    }));
    return Object.freeze({
      symmetryOperationId: operation.operationId,
      requestedCellTranslation,
      effectiveCellTranslation,
      displayWrapAdjustment,
      canonicalFractionalPosition: Object.freeze(canonical.map((entry) => entry.coordinate)),
      fractionalPosition,
    });
  }

  function partitionKey(site, candidate) {
    return JSON.stringify([
      site.siteId,
      disorderKey(site) || null,
      ...candidate.requestedCellTranslation,
      ...candidate.effectiveCellTranslation,
    ]);
  }

  function freezeContributors(candidates) {
    return Object.freeze([...candidates].sort(compareCandidate).map((candidate) => Object.freeze({
      symmetryOperationId: candidate.symmetryOperationId,
      requestedCellTranslation: candidate.requestedCellTranslation,
      effectiveCellTranslation: candidate.effectiveCellTranslation,
      displayWrapAdjustment: candidate.displayWrapAdjustment,
    })));
  }

  function expandSites({ sites, operations, requestedTranslations, wrap = false }) {
    if (!Array.isArray(sites) || !sites.length) throw new TypeError("Crystal expansion requires source sites.");
    if (!Array.isArray(operations) || !operations.length) throw new TypeError("Crystal expansion requires symmetry operations.");
    if (!Array.isArray(requestedTranslations) || !requestedTranslations.length) throw new TypeError("Crystal expansion requires requested translations.");
    const translations = requestedTranslations.map((value, index) => int3(value, `requestedTranslations[${index}]`));
    const partitions = new Map();

    sites.forEach((site) => {
      if (typeof site.sourceStructureId !== "string" || typeof site.modelId !== "string" || typeof site.siteId !== "string") {
        throw new TypeError("Expanded sites require sourceStructureId, modelId, and siteId.");
      }
      translations.forEach((translation) => operations.forEach((operation) => {
        const candidate = candidateFor(site, operation, translation, Boolean(wrap));
        const key = partitionKey(site, candidate);
        const groups = partitions.get(key) || [];
        const existing = groups.find((group) => vectorEqual(group.position, candidate.canonicalFractionalPosition));
        if (existing) existing.candidates.push(candidate);
        else groups.push({ site, position: candidate.canonicalFractionalPosition, candidates: [candidate] });
        partitions.set(key, groups);
      }));
    });

    const atoms = [];
    const atomGeneration = {};
    for (const groups of partitions.values()) groups.forEach((group) => {
      const sorted = [...group.candidates].sort(compareCandidate);
      const canonical = sorted[0];
      const key = disorderKey(group.site);
      const atomIdentity = identityApi.makeAtomIdentity({
        sourceStructureId: group.site.sourceStructureId,
        modelId: group.site.modelId,
        siteId: group.site.siteId,
        periodicImage: { symmetryOperationId: canonical.symmetryOperationId, cellTranslation: canonical.effectiveCellTranslation },
        ...(key ? { disorderKey: key } : {}),
      });
      const renderAtomId = `atom:${identityApi.serializeAtomIdentity(atomIdentity)}`;
      const contributors = freezeContributors(sorted);
      const atom = Object.freeze({
        renderAtomId,
        identity: atomIdentity,
        sourceSite: group.site,
        element: group.site.element,
        occupancy: group.site.occupancy,
        fractionalPosition: canonical.fractionalPosition,
        requestedCellTranslation: canonical.requestedCellTranslation,
        effectiveCellTranslation: canonical.effectiveCellTranslation,
        contributors,
        generated: true,
      });
      atoms.push(atom);
      atomGeneration[renderAtomId] = Object.freeze({ canonicalIdentity: atomIdentity, contributors });
    });
    atoms.sort((left, right) => identityApi.compareAtomIdentity(left.identity, right.identity));
    return Object.freeze({ atoms: Object.freeze(atoms), atomGeneration: Object.freeze(atomGeneration) });
  }

  function expansionAbortError() {
    const error = new Error("Crystal expansion was cancelled.");
    error.name = "AbortError";
    return error;
  }

  async function expandSitesCooperatively({ sites, operations, requestedTranslations, wrap = false, signal, now = () => Date.now(), yieldControl = () => new Promise((resolve) => setTimeout(resolve, 0)), sliceMs = 8 }) {
    if (!Array.isArray(sites) || !sites.length) throw new TypeError("Crystal expansion requires source sites.");
    if (!Array.isArray(operations) || !operations.length) throw new TypeError("Crystal expansion requires symmetry operations.");
    if (!Array.isArray(requestedTranslations) || !requestedTranslations.length) throw new TypeError("Crystal expansion requires requested translations.");
    const translations = requestedTranslations.map((value, index) => int3(value, `requestedTranslations[${index}]`));
    const partitions = new Map();
    let sliceStart = now();
    async function cooperate() {
      if (signal?.aborted) throw expansionAbortError();
      if (now() - sliceStart >= sliceMs) { await yieldControl(); if (signal?.aborted) throw expansionAbortError(); sliceStart = now(); }
    }
    for (const site of sites) {
      if (typeof site.sourceStructureId !== "string" || typeof site.modelId !== "string" || typeof site.siteId !== "string") {
        throw new TypeError("Expanded sites require sourceStructureId, modelId, and siteId.");
      }
      for (const translation of translations) for (const operation of operations) {
        const candidate = candidateFor(site, operation, translation, Boolean(wrap));
        const key = partitionKey(site, candidate);
        const groups = partitions.get(key) || [];
        const existing = groups.find((group) => vectorEqual(group.position, candidate.canonicalFractionalPosition));
        if (existing) existing.candidates.push(candidate);
        else groups.push({ site, position: candidate.canonicalFractionalPosition, candidates: [candidate] });
        partitions.set(key, groups);
        await cooperate();
      }
    }
    const atoms = [];
    const atomGeneration = {};
    for (const groups of partitions.values()) for (const group of groups) {
      const sorted = [...group.candidates].sort(compareCandidate);
      const canonical = sorted[0];
      const key = disorderKey(group.site);
      const atomIdentity = identityApi.makeAtomIdentity({
        sourceStructureId: group.site.sourceStructureId, modelId: group.site.modelId, siteId: group.site.siteId,
        periodicImage: { symmetryOperationId: canonical.symmetryOperationId, cellTranslation: canonical.effectiveCellTranslation },
        ...(key ? { disorderKey: key } : {}),
      });
      const renderAtomId = `atom:${identityApi.serializeAtomIdentity(atomIdentity)}`;
      const contributors = freezeContributors(sorted);
      const atom = Object.freeze({
        renderAtomId, identity: atomIdentity, sourceSite: group.site, element: group.site.element, occupancy: group.site.occupancy,
        fractionalPosition: canonical.fractionalPosition, requestedCellTranslation: canonical.requestedCellTranslation,
        effectiveCellTranslation: canonical.effectiveCellTranslation, contributors, generated: true,
      });
      atoms.push(atom);
      atomGeneration[renderAtomId] = Object.freeze({ canonicalIdentity: atomIdentity, contributors });
      await cooperate();
    }
    atoms.sort((left, right) => identityApi.compareAtomIdentity(left.identity, right.identity));
    return Object.freeze({ atoms: Object.freeze(atoms), atomGeneration: Object.freeze(atomGeneration) });
  }

  return { expandSites, expandSitesCooperatively };
});
;
/* web/structure-viewer/crystal/packing.js */
(function (root, factory) {
  const crystal = typeof module === "object" && module.exports
    ? { ...require("./unit-cell.js"), ...require("./symmetry.js"), ...require("./disorder.js"), ...require("./expander.js") }
    : root.StructureViewerCrystal;
  const core = typeof module === "object" && module.exports
    ? { ...require("../core/constants.js"), ...require("../core/validators.js") }
    : root.StructureViewerCore;
  const api = factory(crystal, core);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerCrystal = Object.assign(root.StructureViewerCrystal || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (crystal, core) {
  "use strict";

  function abortError() { const error = new Error("Crystal packing was cancelled."); error.name = "AbortError"; return error; }
  function throwIfAborted(signal) { if (signal?.aborted) throw abortError(); }
  function distance(left, right) { return Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2]); }
  function add(left, right) { return left.map((value, index) => value + right[index]); }
  function sameInt3(left, right) { return left.every((value, index) => value === right[index]); }

  function deepFreeze(value, seen = new WeakSet()) {
    if (!value || typeof value !== "object" || seen.has(value)) return value;
    seen.add(value); Object.values(value).forEach((entry) => deepFreeze(entry, seen)); return Object.freeze(value);
  }

  function componentIndex(sites, bonds) {
    const siteById = new Map(sites.map((site) => [site.siteId, site]));
    const neighbors = new Map(sites.map((site) => [site.siteId, new Set()]));
    bonds.filter((bond) => ["source", "dictionary"].includes(bond.provenance)).forEach((bond) => {
      if (!siteById.has(bond.beginSiteId) || !siteById.has(bond.endSiteId)) return;
      neighbors.get(bond.beginSiteId).add(bond.endSiteId); neighbors.get(bond.endSiteId).add(bond.beginSiteId);
    });
    const remaining = new Set(siteById.keys()); const components = [];
    while (remaining.size) {
      const first = [...remaining].sort()[0]; const queue = [first]; const ids = [];
      remaining.delete(first);
      while (queue.length) {
        const id = queue.shift(); ids.push(id);
        [...neighbors.get(id)].sort().forEach((neighbor) => { if (remaining.delete(neighbor)) queue.push(neighbor); });
      }
      ids.sort();
      components.push({ componentId: `component:${ids[0]}`, siteIds: ids, sites: ids.map((id) => siteById.get(id)) });
    }
    return components.sort((left, right) => left.componentId.localeCompare(right.componentId));
  }

  function centroid(component, cell) {
    const points = component.sites.map((site) => crystal.fractionalToCartesian(cell, site.fractional.frac));
    return points.reduce((sum, point) => add(sum, point), [0, 0, 0]).map((value) => value / points.length);
  }

  function primaryComponent(components) {
    return [...components].sort((left, right) => {
      const leftHeavy = left.sites.filter((site) => site.element !== "H").length;
      const rightHeavy = right.sites.filter((site) => site.element !== "H").length;
      return rightHeavy - leftHeavy || left.componentId.localeCompare(right.componentId);
    })[0];
  }

  function centerComponent(components, selectedSiteIds, sites, hasBonds) {
    if (Array.isArray(selectedSiteIds) && selectedSiteIds.length) {
      const selected = components.filter((component) => selectedSiteIds.some((siteId) => component.siteIds.includes(siteId)));
      if (selected.length === 1) return selected[0];
    }
    if (!hasBonds) {
      const occupied = sites.filter((site) => site.occupancy > 0);
      const centeredSites = occupied.length ? occupied : sites;
      return { componentId: "occupied-sites", siteIds: centeredSites.map((site) => site.siteId), sites: centeredSites };
    }
    return primaryComponent(components);
  }

  function candidateTranslations(cell, radius, maxExtent) {
    const heights = crystal.perpendicularHeights(cell);
    const halfRanges = heights.map((height) => Math.min(10, Math.ceil((radius + maxExtent) / height) + 1));
    const ranges = halfRanges.map((half) => [-half, half]);
    const cellCount = ranges.reduce((product, range) => product * (range[1] - range[0] + 1), 1);
    if (cellCount > core.LIMITS.replicationCandidateCells) throw new core.StructureViewerError("scene-limit-exceeded", "$.crystal.packing", { cellCount, ranges });
    const translations = [];
    for (let a = ranges[0][0]; a <= ranges[0][1]; a += 1) for (let b = ranges[1][0]; b <= ranges[1][1]; b += 1) for (let c = ranges[2][0]; c <= ranges[2][1]; c += 1) translations.push([a, b, c]);
    return { ranges, translations };
  }

  function rotatedTranslation(operation, translation) {
    return [0, 1, 2].map((row) => operation.rotationNumeric[row * 3] * translation[0]
      + operation.rotationNumeric[row * 3 + 1] * translation[1]
      + operation.rotationNumeric[row * 3 + 2] * translation[2]);
  }

  function periodicOffset(beginSite, endSite) {
    return beginSite.fractional.frac.map((value, index) => -Math.round(endSite.fractional.frac[index] - value));
  }

  function defaultBondImage(sourceBond, endpoint, operations) {
    const explicit = sourceBond[`${endpoint}Image`];
    if (explicit) return explicit;
    const identity = operations.find((operation) => operation.operationId === "symop:x,y,z");
    return identity ? { symmetryOperationId: identity.operationId, cellTranslation: [0, 0, 0] } : null;
  }

  function addBond(bonds, seen, begin, end, sourceBond) {
    const endpoints = [begin.renderAtomId, end.renderAtomId].sort(); const key = endpoints.join("\u0000");
    if (seen.has(key)) return;
    seen.add(key);
    bonds.push({ renderBondId: `packing-bond:${bonds.length}`, beginRenderAtomId: endpoints[0], endRenderAtomId: endpoints[1], order: sourceBond.order, ...(sourceBond.aromatic ? { aromatic: true } : {}), provenance: "periodic" });
  }

  function buildBonds(atoms, sourceBonds, operations) {
    const bySite = new Map(); atoms.forEach((atom) => { const list = bySite.get(atom.identity.siteId) || []; list.push(atom); bySite.set(atom.identity.siteId, list); });
    const operationById = new Map(operations.map((operation) => [operation.operationId, operation]));
    const bonds = []; const seen = new Set();
    sourceBonds.filter((bond) => ["source", "dictionary"].includes(bond.provenance)).forEach((sourceBond) => {
      const begins = bySite.get(sourceBond.beginSiteId) || []; const ends = bySite.get(sourceBond.endSiteId) || [];
      if (sourceBond.beginImage || sourceBond.endImage) {
        const beginImage = defaultBondImage(sourceBond, "begin", operations);
        const endImage = defaultBondImage(sourceBond, "end", operations);
        if (!beginImage || !endImage) return;
        const operationById = new Map(operations.map((operation) => [operation.operationId, operation]));
        const beginOperation = operationById.get(beginImage.symmetryOperationId);
        const endOperation = operationById.get(endImage.symmetryOperationId);
        if (!beginOperation || !endOperation) return;
        operations.forEach((globalOperation) => {
          const transformedBegin = crystal.transformPeriodicImage(globalOperation, beginOperation, beginImage.cellTranslation, operations);
          const transformedEnd = crystal.transformPeriodicImage(globalOperation, endOperation, endImage.cellTranslation, operations);
          begins.forEach((begin) => begin.contributors.forEach((contributor) => {
            if (contributor.symmetryOperationId !== transformedBegin.symmetryOperationId) return;
            const base = contributor.requestedCellTranslation.map((value, index) => value - transformedBegin.cellTranslation[index]);
            const target = base.map((value, index) => value + transformedEnd.cellTranslation[index]);
            const end = ends.find((candidate) => sameInt3(candidate.requestedCellTranslation, target)
              && candidate.contributors.some((entry) => entry.symmetryOperationId === transformedEnd.symmetryOperationId));
            if (end) addBond(bonds, seen, begin, end, sourceBond);
          }));
        });
        return;
      }
      begins.forEach((begin) => begin.contributors.forEach((contributor) => {
        const operation = operationById.get(contributor.symmetryOperationId); if (!operation || !ends.length) return;
        const offset = rotatedTranslation(operation, periodicOffset(begin.sourceSite, ends[0].sourceSite));
        const target = begin.requestedCellTranslation.map((value, index) => value + offset[index]);
        const end = ends.find((candidate) => sameInt3(candidate.requestedCellTranslation, target)
          && candidate.contributors.some((entry) => entry.symmetryOperationId === contributor.symmetryOperationId));
        if (end) addBond(bonds, seen, begin, end, sourceBond);
      }));
    });
    return bonds;
  }

  async function buildPackingScene(source, definition, options = {}) {
    throwIfAborted(options.signal);
    if (!source?.crystal || source.schema !== "rt-source-structure/1") throw new TypeError("Packing requires a crystal SourceStructure.");
    if (definition?.mode !== "crystal" || definition.crystal?.content !== "packing") throw new TypeError("Packing requires a packing SceneDefinition.");
    const model = source.models.find((candidate) => candidate.modelId === definition.modelId);
    if (!model) throw new Error(`Unknown crystal model '${definition.modelId}'.`);
    const settings = definition.crystal; const radius = settings.packingRadiusAngstrom;
    if (!Number.isFinite(radius) || radius < 3 || radius > 30) throw new RangeError("Packing radius must be between 3 and 30 Angstrom.");
    const selected = crystal.selectDisorderSites(model.atomSites, settings).map((site) => ({
      ...site, sourceStructureId: source.structureId, modelId: model.modelId,
      fractional: { frac: [...(site.fractional?.frac || crystal.cartesianToFractional(source.crystal.cell, site.cartesian.cart))] },
    }));
    const components = componentIndex(selected, model.bonds);
    const hasBonds = model.bonds.some((bond) => ["source", "dictionary"].includes(bond.provenance));
    const center = centerComponent(components, options.selectedSiteIds, selected, hasBonds);
    const centerPoint = centroid(center, source.crystal.cell);
    const maxExtent = Math.max(0, ...components.map((component) => {
      const middle = centroid(component, source.crystal.cell);
      return Math.max(0, ...component.sites.map((site) => distance(crystal.fractionalToCartesian(source.crystal.cell, site.fractional.frac), middle)));
    }));
    const candidates = candidateTranslations(source.crystal.cell, radius, maxExtent);
    const projectedAtoms = selected.length * source.crystal.symmetryOperations.length * candidates.translations.length;
    const projectedBonds = model.bonds.length * source.crystal.symmetryOperations.length * candidates.translations.length;
    if (projectedAtoms > core.LIMITS.derivedAtoms || projectedBonds > core.LIMITS.derivedBonds) {
      throw new core.StructureViewerError("scene-limit-exceeded", "$.crystal.packing", { projectedAtoms, projectedBonds, candidateRange: candidates.ranges });
    }
    const expanded = await crystal.expandSitesCooperatively({
      sites: selected, operations: source.crystal.symmetryOperations, requestedTranslations: candidates.translations, wrap: false,
      signal: options.signal, now: options.now, yieldControl: options.yieldControl, sliceMs: core.LIMITS.mainThreadSliceMs,
    });
    const expandedAtoms = expanded.atoms.map((atom) => ({ ...atom, position: [...crystal.fractionalToCartesian(source.crystal.cell, atom.fractionalPosition)] }));
    const componentBySite = new Map(); components.forEach((component) => component.siteIds.forEach((siteId) => componentBySite.set(siteId, component)));
    const groups = new Map();
    expandedAtoms.forEach((atom) => atom.contributors.forEach((contributor) => {
      const component = componentBySite.get(atom.identity.siteId);
      const key = JSON.stringify([component.componentId, contributor.symmetryOperationId, ...contributor.requestedCellTranslation]);
      const group = groups.get(key) || { component, atoms: new Map() }; group.atoms.set(atom.renderAtomId, atom); groups.set(key, group);
    }));
    const included = new Map(); let actualComponents = 0; let yields = 0;
    const now = options.now || (() => Date.now()); const yieldControl = options.yieldControl || (() => new Promise((resolve) => setTimeout(resolve, 0))); let sliceStart = now();
    for (const group of groups.values()) {
      throwIfAborted(options.signal);
      const atoms = [...group.atoms.values()];
      if (atoms.some((atom) => distance(atom.position, centerPoint) <= radius + 1e-10)) {
        if (included.size + atoms.filter((atom) => !included.has(atom.renderAtomId)).length > core.LIMITS.derivedAtoms) {
          throw new core.StructureViewerError("scene-limit-exceeded", "$.crystal.packing", { projectedAtoms, actualAtoms: included.size, componentId: group.component.componentId });
        }
        atoms.forEach((atom) => included.set(atom.renderAtomId, atom)); actualComponents += 1;
      }
      if (now() - sliceStart >= core.LIMITS.mainThreadSliceMs) { await yieldControl(); yields += 1; throwIfAborted(options.signal); sliceStart = now(); }
    }
    const atoms = [...included.values()].sort((left, right) => left.renderAtomId.localeCompare(right.renderAtomId));
    const bonds = buildBonds(atoms, model.bonds, source.crystal.symmetryOperations);
    if (bonds.length > core.LIMITS.derivedBonds) throw new core.StructureViewerError("scene-limit-exceeded", "$.crystal.packing", { projectedBonds, actualBonds: bonds.length });
    const atomGeneration = {}; atoms.forEach((atom) => { atomGeneration[atom.renderAtomId] = expanded.atomGeneration[atom.renderAtomId]; });
    const scene = {
      schema: "rt-render-scene/1", sceneId: `scene:${source.structureId}:${model.modelId}:packing`, sourceStructureId: source.structureId, sourceModelId: model.modelId,
      atoms, bonds, provenance: { atomGeneration },
      crystal: { content: "packing", cell: source.crystal.cell, packing: { radiusAngstrom: radius, centerComponentId: center.componentId, center: centerPoint, centerFractional: center.sites.reduce((sum, site) => sum.map((value, index) => value + site.fractional.frac[index]), [0, 0, 0]).map((value) => value / center.sites.length), candidateRange: candidates.ranges, metrics: { projectedComponents: groups.size, actualComponents, projectedAtoms, actualAtoms: atoms.length, projectedBonds, actualBonds: bonds.length, operationCount: source.crystal.symmetryOperations.length, cellCount: candidates.translations.length, yields } } },
      warnings: [...source.warnings],
    };
    core.validateRenderScene(scene); return deepFreeze(scene);
  }

  return { buildPackingScene, componentIndex };
});
;
/* web/structure-viewer/crystal/scene-builder.js */
(function (root, factory) {
  const crystal = typeof module === "object" && module.exports
    ? { ...require("./unit-cell.js"), ...require("./symmetry.js"), ...require("./disorder.js"), ...require("./expander.js"), ...require("./packing.js") }
    : root.StructureViewerCrystal;
  const core = typeof module === "object" && module.exports
    ? { ...require("../core/atom-identity.js"), ...require("../core/validators.js"), ...require("../core/constants.js") }
    : root.StructureViewerCore;
  const api = factory(crystal, core);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerCrystal = Object.assign(root.StructureViewerCrystal || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (crystal, core) {
  "use strict";

  function deepFreeze(value, seen = new WeakSet()) {
    if (!value || typeof value !== "object" || seen.has(value)) return value;
    seen.add(value);
    Object.values(value).forEach((entry) => deepFreeze(entry, seen));
    return Object.freeze(value);
  }

  function add(left, right) {
    return left.map((value, index) => value + right[index]);
  }

  function cellEdgeSegments(cell) {
    const [a, b, c] = crystal.cellEdges(cell).map((edge) => [...edge]);
    const o = [0, 0, 0]; const ab = add(a, b); const ac = add(a, c); const bc = add(b, c); const abc = add(ab, c);
    return [
      [o, a], [o, b], [o, c], [a, ab], [a, ac], [b, ab], [b, bc], [c, ac], [c, bc], [ab, abc], [ac, abc], [bc, abc],
    ].map(([start, end]) => ({ start, end }));
  }

  function sourceFractional(site, cell) {
    if (site.fractional?.frac) return site.fractional.frac;
    if (site.cartesian?.cart) return crystal.cartesianToFractional(cell, site.cartesian.cart);
    throw new Error(`Crystal site '${site.siteId}' has no coordinates.`);
  }

  function selectedSites(source, model, settings) {
    return crystal.selectDisorderSites(model.atomSites, {
      mode: settings.disorderMode,
      minimumOccupancy: settings.minimumOccupancy,
      disorderAssembly: settings.disorderAssembly,
      disorderGroup: settings.disorderGroup,
    }).map((site) => ({
      ...site,
      sourceStructureId: source.structureId,
      modelId: model.modelId,
      fractional: { frac: [...sourceFractional(site, source.crystal.cell)] },
    }));
  }

  function asymmetricAtoms(source, model, sites) {
    const atomGeneration = {};
    const atoms = sites.map((site) => {
      const sourceSite = model.atomSites.find((candidate) => candidate.siteId === site.siteId);
      const atomIdentity = core.makeAtomIdentity({
        sourceStructureId: source.structureId,
        modelId: model.modelId,
        siteId: site.siteId,
        ...((site.disorderAssembly || site.disorderGroup || site.altLocation) ? { disorderKey: JSON.stringify([site.disorderAssembly || null, site.disorderGroup || null, site.altLocation || null]) } : {}),
      });
      const renderAtomId = `atom:${core.serializeAtomIdentity(atomIdentity)}`;
      atomGeneration[renderAtomId] = { canonicalIdentity: atomIdentity, contributors: [] };
      return {
        renderAtomId,
        identity: atomIdentity,
        element: site.element,
        position: [...crystal.fractionalToCartesian(source.crystal.cell, site.fractional.frac)],
        occupancy: site.occupancy,
        sourceSite,
        generated: false,
      };
    });
    return { atoms, atomGeneration };
  }

  function asymmetricBonds(atoms, sourceBonds) {
    const bySite = new Map(atoms.map((atom) => [atom.identity.siteId, atom.renderAtomId]));
    const baseImage = (image) => !image || (image.symmetryOperationId === "symop:x,y,z" && sameInt3(image.cellTranslation, [0, 0, 0]));
    return sourceBonds.filter((bond) => baseImage(bond.beginImage) && baseImage(bond.endImage)
      && bySite.has(bond.beginSiteId) && bySite.has(bond.endSiteId)).map((bond, index) => ({
      renderBondId: `asymmetric-bond:${index}`,
      beginRenderAtomId: bySite.get(bond.beginSiteId),
      endRenderAtomId: bySite.get(bond.endSiteId),
      order: bond.order,
      ...(bond.aromatic ? { aromatic: true } : {}),
      provenance: bond.provenance,
    }));
  }

  function unitCellAtoms(source, model, sites, settings) {
    const expanded = crystal.expandSites({
      sites,
      operations: source.crystal.symmetryOperations,
      requestedTranslations: [[0, 0, 0]],
      wrap: settings.wrapFractionalCoordinates,
    });
    return {
      atoms: expanded.atoms.map((atom) => ({
        ...atom,
        position: [...crystal.fractionalToCartesian(source.crystal.cell, atom.fractionalPosition)],
      })),
      atomGeneration: expanded.atomGeneration,
    };
  }

  function abortError() {
    const error = new Error("Crystal scene generation was cancelled.");
    error.name = "AbortError";
    return error;
  }

  function throwIfAborted(signal) {
    if (signal?.aborted) throw abortError();
  }

  function enumerateTranslations(replication, signal) {
    const translations = [];
    for (let a = replication.a[0]; a <= replication.a[1]; a += 1) {
      for (let b = replication.b[0]; b <= replication.b[1]; b += 1) {
        for (let c = replication.c[0]; c <= replication.c[1]; c += 1) {
          throwIfAborted(signal);
          translations.push([a, b, c]);
        }
      }
    }
    if (translations.length > core.LIMITS.replicationCandidateCells) throw new RangeError(`Replication requests ${translations.length} cells, exceeding the ${core.LIMITS.replicationCandidateCells}-cell limit.`);
    return translations;
  }

  function expandedAtoms(source, model, sites, settings, requestedTranslations) {
    const operationCount = source.crystal.symmetryOperations.length;
    const projectedAtoms = sites.length * operationCount * requestedTranslations.length;
    const projectedBonds = model.bonds.length * operationCount * requestedTranslations.length;
    if (projectedAtoms > core.LIMITS.derivedAtoms) throw new RangeError(`Projected derived atom count ${projectedAtoms} exceeds the ${core.LIMITS.derivedAtoms}-atom limit.`);
    if (projectedBonds > core.LIMITS.derivedBonds) throw new RangeError(`Projected derived bond count ${projectedBonds} exceeds the ${core.LIMITS.derivedBonds}-bond limit.`);
    const expanded = crystal.expandSites({ sites, operations: source.crystal.symmetryOperations, requestedTranslations, wrap: settings.wrapFractionalCoordinates });
    return {
      atoms: expanded.atoms.map((atom) => ({ ...atom, position: [...crystal.fractionalToCartesian(source.crystal.cell, atom.fractionalPosition)] })),
      atomGeneration: expanded.atomGeneration,
    };
  }

  async function expandedAtomsCooperatively(source, model, sites, settings, requestedTranslations, options) {
    const operationCount = source.crystal.symmetryOperations.length;
    const projectedAtoms = sites.length * operationCount * requestedTranslations.length;
    const projectedBonds = model.bonds.length * operationCount * requestedTranslations.length;
    if (projectedAtoms > core.LIMITS.derivedAtoms) throw new RangeError(`Projected derived atom count ${projectedAtoms} exceeds the ${core.LIMITS.derivedAtoms}-atom limit.`);
    if (projectedBonds > core.LIMITS.derivedBonds) throw new RangeError(`Projected derived bond count ${projectedBonds} exceeds the ${core.LIMITS.derivedBonds}-bond limit.`);
    const expanded = await crystal.expandSitesCooperatively({
      sites, operations: source.crystal.symmetryOperations, requestedTranslations, wrap: settings.wrapFractionalCoordinates,
      signal: options.signal, now: options.now, yieldControl: options.yieldControl, sliceMs: core.LIMITS.mainThreadSliceMs,
    });
    const now = options.now || (() => Date.now());
    const yieldControl = options.yieldControl || (() => new Promise((resolve) => setTimeout(resolve, 0)));
    let sliceStart = now();
    const atoms = [];
    for (const atom of expanded.atoms) {
      atoms.push({ ...atom, position: [...crystal.fractionalToCartesian(source.crystal.cell, atom.fractionalPosition)] });
      throwIfAborted(options.signal);
      if (now() - sliceStart >= core.LIMITS.mainThreadSliceMs) {
        await yieldControl();
        throwIfAborted(options.signal);
        sliceStart = now();
      }
    }
    return { atoms, atomGeneration: expanded.atomGeneration };
  }

  function sameInt3(left, right) {
    return left[0] === right[0] && left[1] === right[1] && left[2] === right[2];
  }

  function addPeriodicBond(bonds, seen, begin, end, sourceBond) {
    const endpoints = [begin.renderAtomId, end.renderAtomId].sort();
    const key = `${endpoints[0]}\u0000${endpoints[1]}`;
    if (seen.has(key)) return;
    seen.add(key);
    bonds.push({
      renderBondId: `periodic-bond:${bonds.length}`,
      beginRenderAtomId: endpoints[0],
      endRenderAtomId: endpoints[1],
      order: sourceBond.order,
      ...(sourceBond.aromatic ? { aromatic: true } : {}),
      provenance: "periodic",
    });
  }

  function rotatedTranslation(operation, translation) {
    return [0, 1, 2].map((row) => operation.rotationNumeric[row * 3] * translation[0]
      + operation.rotationNumeric[row * 3 + 1] * translation[1]
      + operation.rotationNumeric[row * 3 + 2] * translation[2]);
  }

  function periodicOffset(beginSite, endSite) {
    return beginSite.fractional.frac.map((value, index) => -Math.round(endSite.fractional.frac[index] - value));
  }

  function defaultBondImage(sourceBond, endpoint, operations) {
    const explicit = sourceBond[`${endpoint}Image`];
    if (explicit) return explicit;
    const identity = operations.find((operation) => operation.operationId === "symop:x,y,z");
    return identity ? { symmetryOperationId: identity.operationId, cellTranslation: [0, 0, 0] } : null;
  }

  function contributorForImage(atom, image, baseTranslation) {
    if (!image) return null;
    const requested = baseTranslation.map((value, index) => value + image.cellTranslation[index]);
    return atom.contributors.find((entry) => entry.symmetryOperationId === image.symmetryOperationId
      && sameInt3(entry.requestedCellTranslation, requested));
  }

  function addQualifiedImageBonds(bonds, seen, begins, ends, sourceBond, beginImage, endImage) {
    begins.forEach((begin) => begin.contributors.forEach((contributor) => {
      if (contributor.symmetryOperationId !== beginImage.symmetryOperationId) return;
      const baseTranslation = contributor.requestedCellTranslation.map((value, index) => value - beginImage.cellTranslation[index]);
      const end = ends.find((candidate) => contributorForImage(candidate, endImage, baseTranslation));
      if (end) addPeriodicBond(bonds, seen, begin, end, sourceBond);
    }));
  }

  function addQualifiedPeriodicBonds(bonds, seen, begins, ends, sourceBond, operations) {
    const beginImage = defaultBondImage(sourceBond, "begin", operations);
    const endImage = defaultBondImage(sourceBond, "end", operations);
    if (!beginImage || !endImage) return;
    const operationById = new Map(operations.map((operation) => [operation.operationId, operation]));
    const beginOperation = operationById.get(beginImage.symmetryOperationId);
    const endOperation = operationById.get(endImage.symmetryOperationId);
    if (!beginOperation || !endOperation) return;
    operations.forEach((globalOperation) => {
      const transformedBegin = crystal.transformPeriodicImage(globalOperation, beginOperation, beginImage.cellTranslation, operations);
      const transformedEnd = crystal.transformPeriodicImage(globalOperation, endOperation, endImage.cellTranslation, operations);
      addQualifiedImageBonds(bonds, seen, begins, ends, sourceBond, transformedBegin, transformedEnd);
    });
  }

  function appendPeriodicBonds(bonds, seen, bySite, sourceBond, options) {
    const begins = bySite.get(sourceBond.beginSiteId) || [];
    const ends = bySite.get(sourceBond.endSiteId) || [];
    if (sourceBond.beginImage || sourceBond.endImage) {
      addQualifiedPeriodicBonds(bonds, seen, begins, ends, sourceBond, options.operations || []);
      return;
    }
    if (options.crossBoundary) {
      const operationById = options.operationById || new Map(options.operations.map((operation) => [operation.operationId, operation]));
      begins.forEach((begin) => begin.contributors.forEach((contributor) => {
        const operation = operationById.get(contributor.symmetryOperationId);
        if (!operation) return;
        const offset = rotatedTranslation(operation, periodicOffset(begin.sourceSite, ends[0]?.sourceSite));
        const target = begin.requestedCellTranslation.map((value, index) => value + offset[index]);
        const end = ends.find((candidate) => sameInt3(candidate.requestedCellTranslation, target)
          && candidate.contributors.some((entry) => entry.symmetryOperationId === contributor.symmetryOperationId));
        if (end) addPeriodicBond(bonds, seen, begin, end, sourceBond);
      }));
      return;
    }
    begins.forEach((begin) => ends.forEach((end) => {
      if (!sameInt3(begin.requestedCellTranslation, end.requestedCellTranslation)) return;
      const beginOps = new Set(begin.contributors.map((entry) => entry.symmetryOperationId));
      if (!end.contributors.some((entry) => beginOps.has(entry.symmetryOperationId))) return;
      addPeriodicBond(bonds, seen, begin, end, sourceBond);
    }));
  }

  function periodicBonds(atoms, sourceBonds, options = {}) {
    const bySite = new Map();
    atoms.forEach((atom) => {
      const entries = bySite.get(atom.identity.siteId) || [];
      entries.push(atom);
      bySite.set(atom.identity.siteId, entries);
    });
    const bonds = [];
    const seen = new Set();
    const operationById = new Map((options.operations || []).map((operation) => [operation.operationId, operation]));
    sourceBonds.forEach((sourceBond) => appendPeriodicBonds(bonds, seen, bySite, sourceBond, { ...options, operationById }));
    return bonds;
  }

  async function periodicBondsCooperatively(atoms, sourceBonds, options = {}) {
    const bySite = new Map();
    const byImage = new Map();
    const bonds = [];
    const seen = new Set();
    const operationById = new Map((options.operations || []).map((operation) => [operation.operationId, operation]));
    const now = options.now || (() => Date.now());
    const yieldControl = options.yieldControl || (() => new Promise((resolve) => setTimeout(resolve, 0)));
    let sliceStart = now();
    const imageKey = (siteId, operationId, translation) => JSON.stringify([siteId, operationId, ...translation]);
    const cooperate = async () => {
      throwIfAborted(options.signal);
      if (now() - sliceStart >= core.LIMITS.mainThreadSliceMs) {
        await yieldControl();
        if (options.metrics) options.metrics.bondYields = (options.metrics.bondYields || 0) + 1;
        throwIfAborted(options.signal);
        sliceStart = now();
      }
    };
    for (const atom of atoms) {
      const entries = bySite.get(atom.identity.siteId) || [];
      entries.push(atom);
      bySite.set(atom.identity.siteId, entries);
      for (const contributor of atom.contributors) {
        byImage.set(imageKey(atom.identity.siteId, contributor.symmetryOperationId, contributor.requestedCellTranslation), atom);
        await cooperate();
      }
    }
    for (const sourceBond of sourceBonds) {
      const begins = bySite.get(sourceBond.beginSiteId) || [];
      if (sourceBond.beginImage || sourceBond.endImage) {
        const beginImage = defaultBondImage(sourceBond, "begin", options.operations || []);
        const endImage = defaultBondImage(sourceBond, "end", options.operations || []);
        const beginOperation = beginImage && operationById.get(beginImage.symmetryOperationId);
        const endOperation = endImage && operationById.get(endImage.symmetryOperationId);
        if (beginOperation && endOperation) for (const globalOperation of options.operations || []) {
          const transformedBegin = crystal.transformPeriodicImage(globalOperation, beginOperation, beginImage.cellTranslation, options.operations);
          const transformedEnd = crystal.transformPeriodicImage(globalOperation, endOperation, endImage.cellTranslation, options.operations);
          for (const begin of begins) for (const contributor of begin.contributors) {
            if (contributor.symmetryOperationId === transformedBegin.symmetryOperationId) {
              const base = contributor.requestedCellTranslation.map((value, index) => value - transformedBegin.cellTranslation[index]);
              const target = base.map((value, index) => value + transformedEnd.cellTranslation[index]);
              const end = byImage.get(imageKey(sourceBond.endSiteId, transformedEnd.symmetryOperationId, target));
              if (end) addPeriodicBond(bonds, seen, begin, end, sourceBond);
            }
            await cooperate();
          }
        }
        continue;
      }
      for (const begin of begins) for (const contributor of begin.contributors) {
        let target = contributor.requestedCellTranslation;
        if (options.crossBoundary) {
          const operation = operationById.get(contributor.symmetryOperationId);
          const endSite = (bySite.get(sourceBond.endSiteId) || [])[0]?.sourceSite;
          if (!operation || !endSite) { await cooperate(); continue; }
          const offset = rotatedTranslation(operation, periodicOffset(begin.sourceSite, endSite));
          target = contributor.requestedCellTranslation.map((value, index) => value + offset[index]);
        }
        const end = byImage.get(imageKey(sourceBond.endSiteId, contributor.symmetryOperationId, target));
        if (end) addPeriodicBond(bonds, seen, begin, end, sourceBond);
        await cooperate();
      }
    }
    return bonds;
  }

  function crystalScene(source, model, content, projection, bonds) {
    const scene = {
      schema: "rt-render-scene/1", sceneId: `scene:${source.structureId}:${model.modelId}:${content}`,
      sourceStructureId: source.structureId, sourceModelId: model.modelId, atoms: projection.atoms, bonds,
      provenance: { atomGeneration: projection.atomGeneration },
      crystal: { content, cell: source.crystal.cell, cellEdges: cellEdgeSegments(source.crystal.cell) }, warnings: [...source.warnings],
    };
    core.validateRenderScene(scene);
    return deepFreeze(scene);
  }

  function finalizeCrystalScene(source, model, content, projection) {
    const bonds = content === "asymmetric-unit" ? asymmetricBonds(projection.atoms, model.bonds) : periodicBonds(projection.atoms, model.bonds, {
      crossBoundary: content === "supercell", operations: source.crystal.symmetryOperations,
    });
    return crystalScene(source, model, content, projection, bonds);
  }

  async function finalizeCrystalSceneCooperatively(source, model, content, projection, options) {
    const bonds = await periodicBondsCooperatively(projection.atoms, model.bonds, {
      ...options, crossBoundary: content === "supercell", operations: source.crystal.symmetryOperations,
    });
    throwIfAborted(options.signal);
    return crystalScene(source, model, content, projection, bonds);
  }

  function buildCrystalScene(source, definition, options = {}) {
    throwIfAborted(options.signal);
    if (!source || source.schema !== "rt-source-structure/1" || !source.crystal) throw new TypeError("A validated crystal SourceStructure is required.");
    if (!definition || definition.mode !== "crystal" || !definition.crystal) throw new TypeError("A crystal SceneDefinition is required.");
    const content = definition.crystal.content;
    if (content === "packing") return crystal.buildPackingScene(source, definition, options);
    if (!["asymmetric-unit", "unit-cell", "symmetry-mates", "supercell"].includes(content)) throw new TypeError(`Crystal scene content '${content}' is not supported.`);
    crystal.validateCell(source.crystal.cell);
    const model = source.models.find((candidate) => candidate.modelId === definition.modelId);
    if (!model) throw new Error(`Unknown crystal model '${definition.modelId}'.`);
    const sites = selectedSites(source, model, definition.crystal);
    const translations = ["symmetry-mates", "supercell"].includes(content) ? enumerateTranslations(definition.crystal.replication, options.signal) : [[0, 0, 0]];
    const projectedAtoms = sites.length * source.crystal.symmetryOperations.length * translations.length;
    if (content !== "asymmetric-unit" && (options.signal || options.yieldControl || projectedAtoms >= 4096)) {
      return expandedAtomsCooperatively(source, model, sites, definition.crystal, translations, options)
        .then((projection) => { throwIfAborted(options.signal); return finalizeCrystalSceneCooperatively(source, model, content, projection, options); });
    }
    const projection = content === "asymmetric-unit"
      ? asymmetricAtoms(source, model, sites)
      : content === "unit-cell"
        ? unitCellAtoms(source, model, sites, definition.crystal)
        : expandedAtoms(source, model, sites, definition.crystal, translations);
    throwIfAborted(options.signal);
    return finalizeCrystalScene(source, model, content, projection);
  }

  return { buildCrystalScene, cellEdgeSegments };
});
;
/* web/structure-viewer/core/validators.js */
(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? require("./constants.js")
    : root.StructureViewerCore;
  const api = factory(dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerCore = Object.assign(root.StructureViewerCore || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (dependencies) {
  "use strict";

  const { LIMITS } = dependencies;

  const STRUCTURE_TYPES = new Set(["molecule", "crystal", "macromolecule", "trajectory", "multi-model"]);
  const SOURCE_FORMATS = new Set(["xyz", "mol", "sdf", "pdb", "cif", "mmcif"]);
  const ELEMENTS = new Set((
    "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr " +
    "Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu " +
    "Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og"
  ).split(" "));
  const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

  class StructureViewerError extends Error {
    constructor(code, path, details = {}) {
      super(details.message || `${code} at ${path}`);
      this.name = "StructureViewerError";
      this.code = code;
      this.path = path;
      this.details = details;
    }
  }

  function fail(code, path, details) {
    throw new StructureViewerError(code, path, details);
  }

  function assertDeclaredCount(limitKey, count, path = limitKey) {
    if (!Object.prototype.hasOwnProperty.call(LIMITS, limitKey)) fail("unknown-limit", path, { limitKey });
    if (!Number.isSafeInteger(count) || count < 0) fail("invalid-count", path, { count });
    if (count > LIMITS[limitKey]) fail("limit-exceeded", path, { count, limit: LIMITS[limitKey], limitKey });
    return count;
  }

  function assertObject(value, path) {
    if (!value || typeof value !== "object" || Array.isArray(value)) fail("invalid-object", path);
  }

  function assertArray(value, path) {
    if (!Array.isArray(value)) fail("invalid-array", path);
  }

  function assertString(value, path) {
    if (typeof value !== "string" || !value) fail("invalid-string", path);
  }

  function assertFinite(value, path) {
    if (typeof value !== "number" || !Number.isFinite(value)) fail("non-finite-number", path, { value });
  }

  function validateSafeObject(value, path, seen = new WeakSet()) {
    if (!value || typeof value !== "object") return;
    if (seen.has(value)) fail("cyclic-value", path);
    seen.add(value);
    Object.keys(value).forEach((key) => {
      if (FORBIDDEN_KEYS.has(key)) fail("forbidden-key", `${path}.${key}`, { key });
      validateSafeObject(value[key], `${path}.${key}`, seen);
    });
    seen.delete(value);
  }

  function validateVec3(value, path) {
    assertArray(value, path);
    if (value.length !== 3) fail("invalid-length", path, { expected: 3 });
    value.forEach((entry, index) => assertFinite(entry, `${path}[${index}]`));
  }

  function validateCoordinate(value, member, path) {
    assertObject(value, path);
    validateVec3(value[member], `${path}.${member}`);
  }

  function validateElement(element, path) {
    if (!ELEMENTS.has(element)) fail("invalid-element", path, { element });
  }

  function validateOccupancy(value, path) {
    assertFinite(value, path);
    if (value < 0 || value > 1) fail("invalid-occupancy", path, { value });
  }

  function validateMetadataRecord(value, path) {
    assertObject(value, path);
    Object.entries(value).forEach(([key, entry]) => {
      const entryPath = `${path}.${key}`;
      if (["string", "number", "boolean"].includes(typeof entry) || entry === null) {
        if (typeof entry === "number") assertFinite(entry, entryPath);
        return;
      }
      if (Array.isArray(entry) && entry.every((item) => typeof item === "string" || (typeof item === "number" && Number.isFinite(item)))) return;
      if (key === "records" && Array.isArray(entry)) {
        entry.forEach((record, index) => {
          assertObject(record, `${entryPath}[${index}]`);
          if (Object.keys(record).some((recordKey) => !["modelId", "properties"].includes(recordKey))) fail("invalid-metadata-value", `${entryPath}[${index}]`);
          if (typeof record.modelId !== "string" || !record.modelId) fail("invalid-metadata-value", `${entryPath}[${index}].modelId`);
          assertObject(record.properties, `${entryPath}[${index}].properties`);
          Object.entries(record.properties).forEach(([property, propertyValue]) => {
            if (!["string", "number", "boolean"].includes(typeof propertyValue) && propertyValue !== null) fail("invalid-metadata-value", `${entryPath}[${index}].properties.${property}`);
            if (typeof propertyValue === "number") assertFinite(propertyValue, `${entryPath}[${index}].properties.${property}`);
          });
        });
        return;
      }
      fail("invalid-metadata-value", entryPath);
    });
  }

  function gcd(a, b) {
    let left = Math.abs(a);
    let right = Math.abs(b);
    while (right) [left, right] = [right, left % right];
    return left;
  }

  function validateRational(value, path) {
    assertObject(value, path);
    const { numerator, denominator } = value;
    const validIntegers = Number.isSafeInteger(numerator) && Number.isSafeInteger(denominator);
    const reduced = validIntegers && denominator > 0 && gcd(numerator, denominator) === 1;
    const canonicalZero = numerator !== 0 || denominator === 1;
    if (!reduced || !canonicalZero) fail("invalid-rational", path, { numerator, denominator });
  }

  function rationalNumber(value) {
    return value.numerator / value.denominator;
  }

  function canonicalSymmetryExpression(rotation, translation) {
    const axes = ["x", "y", "z"];
    return [0, 1, 2].map((row) => {
      const terms = [];
      axes.forEach((axis, column) => {
        const value = rotation[(row * 3) + column];
        if (value.numerator === 0) return;
        const sign = value.numerator < 0 ? "-" : "+";
        const numerator = Math.abs(value.numerator);
        const coefficient = value.denominator === 1
          ? (numerator === 1 ? "" : String(numerator))
          : `${numerator}/${value.denominator}`;
        terms.push({ sign, text: `${coefficient}${axis}` });
      });
      const shift = translation[row];
      if (shift.numerator !== 0) {
        terms.push({ sign: "+", text: shift.denominator === 1 ? String(shift.numerator) : `${shift.numerator}/${shift.denominator}` });
      }
      return terms.map((term, index) => `${index === 0 && term.sign === "+" ? "" : term.sign}${term.text}`).join("") || "0";
    }).join(",");
  }

  function validateNumericMirror(exact, numeric, path) {
    assertArray(numeric, path);
    if (numeric.length !== exact.length) fail("invalid-length", path, { expected: exact.length });
    numeric.forEach((entry, index) => {
      assertFinite(entry, `${path}[${index}]`);
      if (Math.abs(entry - rationalNumber(exact[index])) > 1e-12) {
        fail("symmetry-numeric-mismatch", `${path}[${index}]`, { expected: rationalNumber(exact[index]), actual: entry });
      }
    });
  }

  function validateSymmetry(crystal, path) {
    assertObject(crystal, path);
    assertObject(crystal.cell, `${path}.cell`);
    ["a", "b", "c", "alphaDeg", "betaDeg", "gammaDeg", "volume"].forEach((field) => {
      assertFinite(crystal.cell[field], `${path}.cell.${field}`);
    });
    ["a", "b", "c", "volume"].forEach((field) => {
      if (crystal.cell[field] <= 0) fail("invalid-cell", `${path}.cell.${field}`, { value: crystal.cell[field] });
    });
    ["alphaDeg", "betaDeg", "gammaDeg"].forEach((field) => {
      if (crystal.cell[field] <= 0 || crystal.cell[field] >= 180) fail("invalid-cell", `${path}.cell.${field}`, { value: crystal.cell[field] });
    });
    ["fracToCart", "cartToFrac"].forEach((field) => {
      assertArray(crystal.cell[field], `${path}.cell.${field}`);
      if (crystal.cell[field].length !== 16) fail("invalid-length", `${path}.cell.${field}`, { expected: 16 });
      crystal.cell[field].forEach((entry, index) => assertFinite(entry, `${path}.cell.${field}[${index}]`));
    });
    assertObject(crystal.spaceGroup, `${path}.spaceGroup`);
    if (crystal.spaceGroup.hm !== undefined) assertString(crystal.spaceGroup.hm, `${path}.spaceGroup.hm`);
    if (crystal.spaceGroup.hall !== undefined) assertString(crystal.spaceGroup.hall, `${path}.spaceGroup.hall`);
    if (crystal.spaceGroup.number !== undefined) {
      if (!Number.isSafeInteger(crystal.spaceGroup.number) || crystal.spaceGroup.number < 1 || crystal.spaceGroup.number > 230) fail("invalid-space-group-number", `${path}.spaceGroup.number`);
    }
    assertObject(crystal.metadata, `${path}.metadata`);
    ["formula", "ccdcNumber"].forEach((field) => { if (crystal.metadata[field] !== undefined) assertString(crystal.metadata[field], `${path}.metadata.${field}`); });
    ["z", "zPrime", "temperatureK", "r1", "wr2", "goodnessOfFit", "flackParameter"].forEach((field) => {
      if (crystal.metadata[field] !== undefined) assertFinite(crystal.metadata[field], `${path}.metadata.${field}`);
    });
    validateMetadataRecord(crystal.metadata.extra, `${path}.metadata.extra`);
    assertArray(crystal.symmetryOperations, `${path}.symmetryOperations`);
    assertDeclaredCount("symmetryOperations", crystal.symmetryOperations.length, `${path}.symmetryOperations`);
    const operationIds = new Set();
    crystal.symmetryOperations.forEach((operation, index) => {
      const opPath = `${path}.symmetryOperations[${index}]`;
      assertObject(operation, opPath);
      assertString(operation.operationId, `${opPath}.operationId`);
      if (operationIds.has(operation.operationId)) fail("duplicate-id", `${opPath}.operationId`, { id: operation.operationId });
      operationIds.add(operation.operationId);
      assertString(operation.canonicalExpression, `${opPath}.canonicalExpression`);
      if (operation.operationId !== `symop:${operation.canonicalExpression}`) fail("invalid-operation-id", `${opPath}.operationId`);
      assertArray(operation.rotationExact, `${opPath}.rotationExact`);
      assertArray(operation.translationExact, `${opPath}.translationExact`);
      if (operation.rotationExact.length !== 9) fail("invalid-length", `${opPath}.rotationExact`, { expected: 9 });
      if (operation.translationExact.length !== 3) fail("invalid-length", `${opPath}.translationExact`, { expected: 3 });
      operation.rotationExact.forEach((entry, entryIndex) => validateRational(entry, `${opPath}.rotationExact[${entryIndex}]`));
      operation.translationExact.forEach((entry, entryIndex) => validateRational(entry, `${opPath}.translationExact[${entryIndex}]`));
      operation.translationExact.forEach((entry, entryIndex) => {
        if (entry.numerator < 0 || entry.numerator >= entry.denominator) {
          fail("unnormalized-translation", `${opPath}.translationExact[${entryIndex}]`);
        }
      });
      const expectedExpression = canonicalSymmetryExpression(operation.rotationExact, operation.translationExact);
      if (operation.canonicalExpression !== expectedExpression) {
        fail("invalid-canonical-expression", `${opPath}.canonicalExpression`, { expected: expectedExpression, actual: operation.canonicalExpression });
      }
      validateNumericMirror(operation.rotationExact, operation.rotationNumeric, `${opPath}.rotationNumeric`);
      validateNumericMirror(operation.translationExact, operation.translationNumeric, `${opPath}.translationNumeric`);
    });
  }

  function validateAtomIdentity(identity, path) {
    assertObject(identity, path);
    ["sourceStructureId", "modelId", "siteId"].forEach((field) => assertString(identity[field], `${path}.${field}`));
    if (identity.disorderKey !== undefined) assertString(identity.disorderKey, `${path}.disorderKey`);
    if (identity.periodicImage !== undefined) {
      assertObject(identity.periodicImage, `${path}.periodicImage`);
      assertString(identity.periodicImage.symmetryOperationId, `${path}.periodicImage.symmetryOperationId`);
      assertArray(identity.periodicImage.cellTranslation, `${path}.periodicImage.cellTranslation`);
      if (identity.periodicImage.cellTranslation.length !== 3 || !identity.periodicImage.cellTranslation.every(Number.isSafeInteger)) {
        fail("invalid-cell-translation", `${path}.periodicImage.cellTranslation`);
      }
    }
  }

  function validateInt3(value, path) {
    assertArray(value, path);
    if (value.length !== 3 || !value.every(Number.isSafeInteger)) fail("invalid-int3", path);
  }

  function validateGenerationCandidate(candidate, path) {
    assertObject(candidate, path);
    assertString(candidate.symmetryOperationId, `${path}.symmetryOperationId`);
    validateInt3(candidate.requestedCellTranslation, `${path}.requestedCellTranslation`);
    validateInt3(candidate.effectiveCellTranslation, `${path}.effectiveCellTranslation`);
    if (candidate.displayWrapAdjustment !== undefined) validateInt3(candidate.displayWrapAdjustment, `${path}.displayWrapAdjustment`);
  }

  function sameJsonValue(left, right) {
    return JSON.stringify(left) === JSON.stringify(right);
  }

  function validateParsedLike(value, expectedSchema) {
    assertObject(value, "$.");
    validateSafeObject(value, "$");
    if (value.schema !== expectedSchema) fail("invalid-schema", "$.schema", { expected: expectedSchema, actual: value.schema });
    assertString(value.displayName, "$.displayName");
    if (!STRUCTURE_TYPES.has(value.structureType)) fail("invalid-structure-type", "$.structureType", { value: value.structureType });
    assertObject(value.source, "$.source");
    if (!SOURCE_FORMATS.has(value.source.format)) fail("invalid-source-format", "$.source.format", { value: value.source.format });
    if (value.source.canonicalFormat !== "rt-structure-json/1") fail("invalid-canonical-format", "$.source.canonicalFormat");
    assertDeclaredCount("inputSourceBytes", value.source.byteLength, "$.source.byteLength");
    assertArray(value.models, "$.models");
    assertDeclaredCount("models", value.models.length, "$.models");

    const modelIds = new Set();
    const siteIds = new Set();
    const bondIds = new Set();
    let atomCount = 0;
    let bondCount = 0;
    value.models.forEach((model, modelIndex) => {
      const modelPath = `$.models[${modelIndex}]`;
      assertObject(model, modelPath);
      assertString(model.modelId, `${modelPath}.modelId`);
      assertString(model.label, `${modelPath}.label`);
      if (modelIds.has(model.modelId)) fail("duplicate-id", `${modelPath}.modelId`, { id: model.modelId });
      modelIds.add(model.modelId);
      assertArray(model.atomSites, `${modelPath}.atomSites`);
      assertArray(model.bonds, `${modelPath}.bonds`);
      atomCount += model.atomSites.length;
      bondCount += model.bonds.length;
      assertDeclaredCount("sourceAtomSites", atomCount, "$.models.atomSites");
      assertDeclaredCount("sourceBonds", bondCount, "$.models.bonds");
      const modelSiteIds = new Set();
      model.atomSites.forEach((site, siteIndex) => {
        const sitePath = `${modelPath}.atomSites[${siteIndex}]`;
        assertObject(site, sitePath);
        assertString(site.siteId, `${sitePath}.siteId`);
        if (siteIds.has(site.siteId)) fail("duplicate-id", `${sitePath}.siteId`, { id: site.siteId });
        siteIds.add(site.siteId);
        modelSiteIds.add(site.siteId);
        validateElement(site.element, `${sitePath}.element`);
        validateOccupancy(site.occupancy, `${sitePath}.occupancy`);
        if (site.cartesian === undefined && site.fractional === undefined) fail("missing-coordinate", sitePath);
        if (site.cartesian !== undefined) validateCoordinate(site.cartesian, "cart", `${sitePath}.cartesian`);
        if (site.fractional !== undefined) validateCoordinate(site.fractional, "frac", `${sitePath}.fractional`);
        assertObject(site.properties, `${sitePath}.properties`);
      });
      model.bonds.forEach((bond, bondIndex) => {
        const bondPath = `${modelPath}.bonds[${bondIndex}]`;
        assertObject(bond, bondPath);
        assertString(bond.bondId, `${bondPath}.bondId`);
        if (bondIds.has(bond.bondId)) fail("duplicate-id", `${bondPath}.bondId`, { id: bond.bondId });
        bondIds.add(bond.bondId);
        if (!modelSiteIds.has(bond.beginSiteId)) fail("invalid-endpoint", `${bondPath}.beginSiteId`, { id: bond.beginSiteId });
        if (!modelSiteIds.has(bond.endSiteId)) fail("invalid-endpoint", `${bondPath}.endSiteId`, { id: bond.endSiteId });
        assertFinite(bond.order, `${bondPath}.order`);
        if (bond.order <= 0) fail("invalid-bond-order", `${bondPath}.order`, { value: bond.order });
        if (!["source", "dictionary", "inferred"].includes(bond.provenance)) fail("invalid-bond-provenance", `${bondPath}.provenance`);
        ["beginImage", "endImage"].forEach((field) => {
          if (bond[field] === undefined) return;
          assertObject(bond[field], `${bondPath}.${field}`);
          assertString(bond[field].symmetryOperationId, `${bondPath}.${field}.symmetryOperationId`);
          validateInt3(bond[field].cellTranslation, `${bondPath}.${field}.cellTranslation`);
        });
      });
    });
    validateMetadataRecord(value.metadata, "$.metadata");
    assertArray(value.warnings, "$.warnings");
    if (value.crystal !== undefined) {
      validateSymmetry(value.crystal, "$.crystal");
      const operationIds = new Set(value.crystal.symmetryOperations.map((operation) => operation.operationId));
      value.models.forEach((model, modelIndex) => model.bonds.forEach((bond, bondIndex) => {
        ["beginImage", "endImage"].forEach((field) => {
          if (bond[field] && !operationIds.has(bond[field].symmetryOperationId)) {
            fail("unknown-bond-symmetry-operation", `$.models[${modelIndex}].bonds[${bondIndex}].${field}.symmetryOperationId`);
          }
        });
      }));
    }
    return value;
  }

  function validateParsedStructureContent(value) {
    return validateParsedLike(value, "rt-parsed-structure/1");
  }

  function validateSourceStructure(value) {
    validateParsedLike(value, "rt-source-structure/1");
    assertString(value.structureId, "$.structureId");
    if (!/^sha256:[0-9a-f]{64}$/.test(value.contentIdentity || "")) fail("invalid-content-identity", "$.contentIdentity");
    return value;
  }

  function validateRenderScene(value) {
    assertObject(value, "$");
    validateSafeObject(value, "$");
    if (value.schema !== "rt-render-scene/1") fail("invalid-schema", "$.schema", { expected: "rt-render-scene/1" });
    ["sceneId", "sourceStructureId", "sourceModelId"].forEach((key) => assertString(value[key], `$.${key}`));
    assertArray(value.atoms, "$.atoms");
    assertArray(value.bonds, "$.bonds");
    assertDeclaredCount("derivedAtoms", value.atoms.length, "$.atoms");
    assertDeclaredCount("derivedBonds", value.bonds.length, "$.bonds");
    const atomIds = new Set();
    const atomsById = new Map();
    value.atoms.forEach((atom, index) => {
      const path = `$.atoms[${index}]`;
      assertObject(atom, path);
      assertString(atom.renderAtomId, `${path}.renderAtomId`);
      if (atomIds.has(atom.renderAtomId)) fail("duplicate-id", `${path}.renderAtomId`, { id: atom.renderAtomId });
      atomIds.add(atom.renderAtomId);
      atomsById.set(atom.renderAtomId, atom);
      validateElement(atom.element, `${path}.element`);
      validateVec3(atom.position, `${path}.position`);
      validateOccupancy(atom.occupancy, `${path}.occupancy`);
      validateAtomIdentity(atom.identity, `${path}.identity`);
      if (atom.identity.sourceStructureId !== value.sourceStructureId) {
        fail("identity-mismatch", `${path}.identity.sourceStructureId`);
      }
      if (atom.identity.modelId !== value.sourceModelId) fail("identity-mismatch", `${path}.identity.modelId`);
      assertObject(atom.sourceSite, `${path}.sourceSite`);
      if (typeof atom.generated !== "boolean") fail("invalid-boolean", `${path}.generated`);
      if (atom.contributors !== undefined) {
        assertArray(atom.contributors, `${path}.contributors`);
        atom.contributors.forEach((candidate, candidateIndex) => validateGenerationCandidate(candidate, `${path}.contributors[${candidateIndex}]`));
      }
    });
    const bondIds = new Set();
    value.bonds.forEach((bond, index) => {
      const path = `$.bonds[${index}]`;
      assertObject(bond, path);
      assertString(bond.renderBondId, `${path}.renderBondId`);
      if (bondIds.has(bond.renderBondId)) fail("duplicate-id", `${path}.renderBondId`, { id: bond.renderBondId });
      bondIds.add(bond.renderBondId);
      if (!atomIds.has(bond.beginRenderAtomId)) fail("invalid-endpoint", `${path}.beginRenderAtomId`, { id: bond.beginRenderAtomId });
      if (!atomIds.has(bond.endRenderAtomId)) fail("invalid-endpoint", `${path}.endRenderAtomId`, { id: bond.endRenderAtomId });
      assertFinite(bond.order, `${path}.order`);
      if (bond.order <= 0) fail("invalid-bond-order", `${path}.order`, { value: bond.order });
      if (!["source", "dictionary", "inferred", "periodic"].includes(bond.provenance)) {
        fail("invalid-bond-provenance", `${path}.provenance`);
      }
    });
    assertObject(value.provenance, "$.provenance");
    assertObject(value.provenance.atomGeneration, "$.provenance.atomGeneration");
    Object.entries(value.provenance.atomGeneration).forEach(([renderAtomId, generation]) => {
      const path = `$.provenance.atomGeneration[${JSON.stringify(renderAtomId)}]`;
      const atom = atomsById.get(renderAtomId);
      if (!atom) fail("orphan-provenance", path, { renderAtomId });
      assertObject(generation, path);
      validateAtomIdentity(generation.canonicalIdentity, `${path}.canonicalIdentity`);
      if (!sameJsonValue(generation.canonicalIdentity, atom.identity)) fail("canonical-identity-mismatch", `${path}.canonicalIdentity`);
      assertArray(generation.contributors, `${path}.contributors`);
      generation.contributors.forEach((candidate, candidateIndex) => validateGenerationCandidate(candidate, `${path}.contributors[${candidateIndex}]`));
      if (atom.contributors !== undefined && !sameJsonValue(generation.contributors, atom.contributors)) {
        fail("contributor-projection-mismatch", `${path}.contributors`);
      }
    });
    value.atoms.forEach((atom, atomIndex) => {
      if (!atom.generated) return;
      if (!Array.isArray(atom.contributors) || !atom.contributors.length) fail("missing-contributors", `$.atoms[${atomIndex}].contributors`);
      if (!value.provenance.atomGeneration[atom.renderAtomId]) fail("missing-provenance", `$.provenance.atomGeneration`, { renderAtomId: atom.renderAtomId });
    });
    assertArray(value.warnings, "$.warnings");
    return value;
  }

  return {
    StructureViewerError,
    assertDeclaredCount,
    validateParsedStructureContent,
    validateSourceStructure,
    validateRenderScene,
  };
});
;
/* web/structure-viewer/core/canonical-json.js */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerCore = Object.assign(root.StructureViewerCore || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  function canonicalizeRfc8785(value) {
    function serialize(item, path) {
      if (item === null) return "null";
      if (typeof item === "string" || typeof item === "boolean") return JSON.stringify(item);
      if (typeof item === "number") {
        if (!Number.isFinite(item)) throw new TypeError(`Canonical JSON requires finite numbers at ${path}.`);
        return Object.is(item, -0) ? "0" : JSON.stringify(item);
      }
      if (typeof item === "undefined") throw new TypeError(`Canonical JSON forbids undefined at ${path}.`);
      if (Array.isArray(item)) {
        return `[${item.map((entry, index) => serialize(entry, `${path}[${index}]`)).join(",")}]`;
      }
      if (typeof item === "object") {
        const keys = Object.keys(item).sort();
        return `{${keys.map((key) => `${JSON.stringify(key)}:${serialize(item[key], `${path}.${key}`)}`).join(",")}}`;
      }
      throw new TypeError(`Canonical JSON cannot serialize ${typeof item} at ${path}.`);
    }

    return serialize(value, "$");
  }

  function scientificProjection(parsed) {
    if (!parsed || typeof parsed !== "object") throw new TypeError("Parsed structure content is required.");
    const source = parsed.source || {};
    const projectedSource = {
      format: source.format,
      canonicalFormat: source.canonicalFormat,
    };
    if (source.mediaType !== undefined) projectedSource.mediaType = source.mediaType;

    function optional(target, source, keys) {
      keys.forEach((key) => { if (source[key] !== undefined) target[key] = source[key]; });
      return target;
    }

    const models = parsed.models?.map((model) => {
      const projectedModel = {
        modelId: model.modelId,
        label: model.label,
        atomSites: model.atomSites?.map((site) => {
          const projectedSite = {
            siteId: site.siteId,
            element: site.element,
            occupancy: site.occupancy,
            properties: site.properties,
          };
          optional(projectedSite, site, ["label", "formalCharge", "isotope", "altLocation", "disorderAssembly", "disorderGroup", "residueId", "chainId", "sourceRow"]);
          if (site.fractional !== undefined) projectedSite.fractional = { frac: site.fractional.frac };
          else if (site.cartesian !== undefined) projectedSite.cartesian = { cart: site.cartesian.cart };
          return projectedSite;
        }),
        bonds: model.bonds?.map((bond) => optional({
          bondId: bond.bondId,
          beginSiteId: bond.beginSiteId,
          endSiteId: bond.endSiteId,
          order: bond.order,
          provenance: bond.provenance,
        }, bond, ["aromatic", "beginImage", "endImage"])),
      };
      if (model.residues !== undefined) {
        projectedModel.residues = model.residues.map((residue) => optional({
          residueId: residue.residueId,
          name: residue.name,
          atomSiteIds: residue.atomSiteIds,
        }, residue, ["sequenceNumber", "insertionCode", "chainId"]));
      }
      return projectedModel;
    });
    const projection = {
      schema: "rt-parsed-structure/1",
      structureType: parsed.structureType,
      source: projectedSource,
      models,
      metadata: parsed.metadata,
    };
    if (parsed.crystal !== undefined) {
      projection.crystal = {
        cell: {
          a: parsed.crystal.cell.a,
          b: parsed.crystal.cell.b,
          c: parsed.crystal.cell.c,
          alphaDeg: parsed.crystal.cell.alphaDeg,
          betaDeg: parsed.crystal.cell.betaDeg,
          gammaDeg: parsed.crystal.cell.gammaDeg,
          volume: parsed.crystal.cell.volume,
          fracToCart: parsed.crystal.cell.fracToCart,
          cartToFrac: parsed.crystal.cell.cartToFrac,
        },
        spaceGroup: optional({}, parsed.crystal.spaceGroup, ["hm", "hall", "number"]),
        symmetryOperations: parsed.crystal.symmetryOperations?.map(({
          sourceExpression: _sourceExpression,
          rotationNumeric: _rotationNumeric,
          translationNumeric: _translationNumeric,
          ...operation
        }) => ({
          operationId: operation.operationId,
          canonicalExpression: operation.canonicalExpression,
          rotationExact: operation.rotationExact,
          translationExact: operation.translationExact,
        })),
        metadata: parsed.crystal.metadata,
      };
    }
    return projection;
  }

  function toBytes(value) {
    if (typeof value === "string") return new TextEncoder().encode(value);
    if (value instanceof Uint8Array) return value;
    if (value instanceof ArrayBuffer) return new Uint8Array(value);
    if (ArrayBuffer.isView(value)) return new Uint8Array(value.buffer, value.byteOffset, value.byteLength);
    throw new TypeError("SHA-256 input must be text or bytes.");
  }

  function bytesToHex(bytes) {
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, "0")).join("");
  }

  async function sha256Hex(value) {
    const bytes = toBytes(value);
    if (root?.crypto?.subtle) {
      return bytesToHex(new Uint8Array(await root.crypto.subtle.digest("SHA-256", bytes)));
    }
    if (typeof require === "function") {
      return require("crypto").createHash("sha256").update(bytes).digest("hex");
    }
    throw new Error("SHA-256 is unavailable in this environment.");
  }

  async function computeContentIdentity(parsed) {
    const canonical = canonicalizeRfc8785(scientificProjection(parsed));
    return `sha256:${await sha256Hex(new TextEncoder().encode(canonical))}`;
  }

  return {
    scientificProjection,
    canonicalizeRfc8785,
    sha256Hex,
    computeContentIdentity,
  };
});
;
/* web/structure-viewer/core/contracts.js */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerCore = Object.assign(root.StructureViewerCore || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const SOURCE_FORMATS = new Set(["xyz", "mol", "sdf", "pdb", "cif", "mmcif"]);

  function assertParserAdapter(adapter) {
    const invalid = (message) => { throw new TypeError(`Invalid ParserAdapter: ${message}`); };
    if (!adapter || typeof adapter !== "object") invalid("adapter must be an object");
    if (typeof adapter.id !== "string" || !adapter.id) invalid("id must be a non-empty string");
    if (!Array.isArray(adapter.formats) || adapter.formats.length === 0) invalid("formats must be a non-empty array");
    if (new Set(adapter.formats).size !== adapter.formats.length || adapter.formats.some((format) => !SOURCE_FORMATS.has(format))) invalid("formats contain duplicates or unsupported values");
    if (typeof adapter.probe !== "function") invalid("probe must be a function");
    if (typeof adapter.parse !== "function") invalid("parse must be a function");
    return adapter;
  }

  return { assertParserAdapter };
});
;
/* web/structure-viewer/core/format-detector.js */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerCore = Object.assign(root.StructureViewerCore || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const FORMATS = new Set(["xyz", "mol", "sdf", "pdb", "cif", "mmcif"]);
  const EXTENSIONS = Object.freeze({ xyz: "xyz", mol: "mol", sdf: "sdf", pdb: "pdb", ent: "pdb", cif: "cif", mmcif: "mmcif", mcif: "mmcif" });

  function extensionFormat(filename) {
    const match = String(filename || "").toLowerCase().match(/\.([^.\\/]+)$/);
    return match ? EXTENSIONS[match[1]] || null : null;
  }

  function inspectContent(text) {
    const source = String(text || "").replace(/^\ufeff/, "");
    if (!source.trim()) return null;
    if (/^\s*(?:ATOM  |HETATM|MODEL\s|HEADER\s)/m.test(source)) return { format: "pdb", confidence: 0.98, reason: "pdb-records", ambiguous: false };
    if (/\$\$\$\$\s*(?:\r?\n|$)/.test(source) && /M\s+END/.test(source)) return { format: "sdf", confidence: 0.99, reason: "sdf-record-delimiter", ambiguous: false };
    if (/M\s+END/.test(source) && /V(?:2000|3000)/.test(source)) return { format: "mol", confidence: 0.97, reason: "mol-counts-block", ambiguous: false };
    if (/^\s*data_/mi.test(source)) {
      const hasMmcif = /_(?:atom_site|entity|struct|chem_comp)\./i.test(source);
      const hasStrongMmcif = /_atom_site\.(?:Cartn_[xyz]|group_PDB|pdbx_PDB_model_num)\b/i.test(source);
      const hasSmallCif = /_(?:cell_length|cell_angle|symmetry_|space_group_|atom_site_fract_)/i.test(source);
      if (hasStrongMmcif) return { format: "mmcif", confidence: 0.98, reason: "pdbx-atom-site-categories", ambiguous: false };
      if (hasMmcif && !hasSmallCif) return { format: "mmcif", confidence: 0.94, reason: "pdbx-categories", ambiguous: false };
      if (hasSmallCif && !hasMmcif) return { format: "cif", confidence: 0.94, reason: "small-molecule-cif-tags", ambiguous: false };
      return { format: "cif", confidence: 0.55, reason: "generic-cif-data-block", ambiguous: true };
    }
    const lines = source.split(/\r?\n/).filter((line) => line.trim());
    const coordinate = /^\s*(?:[A-Z][a-z]?|\d{1,3})\s+[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][-+]?\d+)?\s+[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][-+]?\d+)?\s+[-+]?(?:\d+(?:\.\d*)?|\.\d+)(?:[Ee][-+]?\d+)?(?:\s|$)/;
    const declared = /^\s*\d+\s*$/.test(lines[0] || "") ? Number(lines[0].trim()) : NaN;
    if (Number.isSafeInteger(declared) && declared > 0 && lines.slice(2, declared + 2).length === declared && lines.slice(2, declared + 2).every((line) => coordinate.test(line))) {
      return { format: "xyz", confidence: 0.96, reason: "xyz-count-and-coordinate-rows", ambiguous: false };
    }
    if (lines.length && lines.every((line) => coordinate.test(line))) return { format: "xyz", confidence: 0.78, reason: "coordinate-only-rows", ambiguous: false };
    return null;
  }

  function detectFormat({ text = "", filename = "", trustedFormat } = {}) {
    if (trustedFormat !== undefined) {
      if (!FORMATS.has(trustedFormat)) throw new TypeError(`Unsupported trusted format: ${trustedFormat}`);
      return { format: trustedFormat, confidence: 1, reason: "trusted-format", warnings: [], ambiguous: false };
    }
    const extension = extensionFormat(filename);
    const content = inspectContent(text);
    const warnings = [];
    if (content) {
      if (extension && extension !== content.format) {
        warnings.push({ code: "extension-content-mismatch", extensionFormat: extension, contentFormat: content.format });
      }
      if (content.ambiguous) warnings.push({ code: "ambiguous-cif", candidates: ["cif", "mmcif"] });
      return { ...content, warnings };
    }
    if (extension) return { format: extension, confidence: 0.45, reason: "filename-extension", warnings, ambiguous: false };
    return { format: null, confidence: 0, reason: "unknown-content", warnings: [{ code: "unknown-format" }], ambiguous: true };
  }

  return { detectFormat };
});
;
/* web/structure-viewer/parsers/registry.js */
(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? { ...require("../core/contracts.js"), ...require("../core/format-detector.js") }
    : root.StructureViewerCore;
  const api = factory(dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerParsers = Object.assign(root.StructureViewerParsers || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (dependencies) {
  "use strict";

  const { assertParserAdapter, detectFormat } = dependencies;

  function createParserRegistry(initialAdapters = []) {
    const byFormat = new Map();
    const byId = new Map();

    function register(candidate) {
      const adapter = assertParserAdapter(candidate);
      if (byId.has(adapter.id)) throw new Error(`ParserAdapter id already registered: ${adapter.id}`);
      adapter.formats.forEach((format) => {
        if (byFormat.has(format)) throw new Error(`ParserAdapter already registered for ${format}.`);
      });
      byId.set(adapter.id, adapter);
      adapter.formats.forEach((format) => byFormat.set(format, adapter));
      return adapter;
    }

    function getAdapter(format) {
      return byFormat.get(format) || null;
    }

    function formats() {
      return Array.from(byFormat.keys()).sort();
    }

    function selectAdapter(input) {
      const explicit = input?.explicitFormat;
      const detection = detectFormat({ text: input?.text, filename: input?.name, trustedFormat: explicit });
      if (detection.format && byFormat.has(detection.format)) return { adapter: byFormat.get(detection.format), detection };
      if (explicit !== undefined) throw new Error(`No registered ParserAdapter for explicit format ${explicit}.`);

      const candidates = Array.from(byId.values()).map((adapter) => ({ adapter, result: adapter.probe(input || {}) }))
        .filter(({ result }) => result?.supported)
        .sort((left, right) => (right.result.confidence || 0) - (left.result.confidence || 0) || left.adapter.id.localeCompare(right.adapter.id));
      if (!candidates.length) throw new Error(`Unable to detect a registered ParserAdapter for ${input?.name || "input"}.`);
      return { adapter: candidates[0].adapter, detection };
    }

    async function parse(input, options = {}) {
      const { adapter } = selectAdapter(input);
      return adapter.parse(input, options);
    }

    initialAdapters.forEach(register);
    return Object.freeze({ register, getAdapter, formats, selectAdapter, parse });
  }

  return { createParserRegistry };
});
;
/* web/structure-viewer/parsers/xyz-parser.js */
(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? require("../core/constants.js")
    : root.StructureViewerCore;
  const api = factory(dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerParsers = Object.assign(root.StructureViewerParsers || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (dependencies) {
  "use strict";

  const { LIMITS } = dependencies;
  const ELEMENTS = Object.freeze([
    null, "H", "He", "Li", "Be", "B", "C", "N", "O", "F", "Ne", "Na", "Mg", "Al", "Si", "P", "S", "Cl", "Ar",
    "K", "Ca", "Sc", "Ti", "V", "Cr", "Mn", "Fe", "Co", "Ni", "Cu", "Zn", "Ga", "Ge", "As", "Se", "Br", "Kr",
    "Rb", "Sr", "Y", "Zr", "Nb", "Mo", "Tc", "Ru", "Rh", "Pd", "Ag", "Cd", "In", "Sn", "Sb", "Te", "I", "Xe",
    "Cs", "Ba", "La", "Ce", "Pr", "Nd", "Pm", "Sm", "Eu", "Gd", "Tb", "Dy", "Ho", "Er", "Tm", "Yb", "Lu",
    "Hf", "Ta", "W", "Re", "Os", "Ir", "Pt", "Au", "Hg", "Tl", "Pb", "Bi", "Po", "At", "Rn", "Fr", "Ra",
    "Ac", "Th", "Pa", "U", "Np", "Pu", "Am", "Cm", "Bk", "Cf", "Es", "Fm", "Md", "No", "Lr", "Rf", "Db",
    "Sg", "Bh", "Hs", "Mt", "Ds", "Rg", "Cn", "Nh", "Fl", "Mc", "Lv", "Ts", "Og",
  ]);
  const ELEMENT_BY_LOWERCASE = new Map(ELEMENTS.filter(Boolean).map((symbol) => [symbol.toLowerCase(), symbol]));

  function abortError() {
    const error = new Error("XYZ parsing was cancelled.");
    error.name = "AbortError";
    return error;
  }

  function throwIfAborted(signal) {
    if (signal?.aborted) throw abortError();
  }

  function utf8ByteLength(text) {
    if (typeof TextEncoder === "function") return new TextEncoder().encode(text).byteLength;
    return unescape(encodeURIComponent(text)).length;
  }

  function normalizeElement(token, lineNumber) {
    if (/^\d+$/.test(token)) {
      const atomicNumber = Number(token);
      if (atomicNumber > 0 && atomicNumber < ELEMENTS.length) return ELEMENTS[atomicNumber];
      throw new Error(`Invalid atomic number '${token}' on XYZ line ${lineNumber}.`);
    }
    const symbol = ELEMENT_BY_LOWERCASE.get(token.toLowerCase());
    if (!symbol) throw new Error(`Invalid element '${token}' on XYZ line ${lineNumber}.`);
    return symbol;
  }

  function parseCoordinateLine(line, lineNumber, atomOrdinal) {
    const fields = String(line || "").trim().split(/\s+/);
    if (fields.length !== 4) throw new Error(`XYZ coordinate line ${lineNumber} must contain element, X, Y, and Z only.`);
    const coordinates = fields.slice(1).map(Number);
    if (!coordinates.every(Number.isFinite)) throw new Error(`XYZ coordinate line ${lineNumber} contains a non-finite coordinate.`);
    return {
      siteId: `site:0:${atomOrdinal}`,
      element: normalizeElement(fields[0], lineNumber),
      cartesian: { cart: coordinates },
      occupancy: 1,
      properties: {},
    };
  }

  function normalizeInvocation(input, options) {
    const opts = options || {};
    return {
      text: input?.text,
      displayName: input?.displayName || input?.name || "structure.xyz",
      signal: input?.signal || opts.signal,
      onProgress: input?.onProgress || opts.onProgress || opts.progress,
    };
  }

  async function parse(input, options) {
    const invocation = normalizeInvocation(input, options);
    if (typeof invocation.text !== "string") throw new TypeError("XYZ input text is required.");
    if (typeof invocation.displayName !== "string" || !invocation.displayName.trim()) throw new TypeError("XYZ displayName is required.");
    throwIfAborted(invocation.signal);

    const normalizedText = invocation.text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
    const byteLength = utf8ByteLength(invocation.text);
    if (byteLength > LIMITS.inputSourceBytes) throw new Error(`XYZ input exceeds the ${LIMITS.inputSourceBytes}-byte source limit.`);
    const lines = normalizedText.split("\n");
    while (lines.length && !lines.at(-1).trim()) lines.pop();
    if (!lines.length) throw new Error("XYZ input is empty.");

    const headered = /^\d+$/.test(lines[0].trim());
    let count;
    let comment = "";
    let coordinateLines;
    let firstCoordinateLine;
    if (headered) {
      count = Number(lines[0].trim());
      if (!Number.isSafeInteger(count) || count < 1) throw new Error("XYZ atom count must be a positive safe integer.");
      if (count > LIMITS.sourceAtomSites) throw new Error(`XYZ declares ${count} atoms, exceeding the ${LIMITS.sourceAtomSites}-atom limit.`);
      if (lines.length < 2) throw new Error(`XYZ declares ${count} atoms but is truncated before its comment line.`);
      comment = lines[1].trim();
      coordinateLines = lines.slice(2);
      firstCoordinateLine = 3;
      if (coordinateLines.length !== count) {
        const detail = coordinateLines.length < count ? "truncated" : "contains extra coordinate rows";
        throw new Error(`XYZ declares ${count} atoms but ${coordinateLines.length} coordinate rows were found (${detail}).`);
      }
    } else {
      coordinateLines = lines.filter((line) => line.trim());
      count = coordinateLines.length;
      firstCoordinateLine = 1;
      if (count > LIMITS.sourceAtomSites) throw new Error(`XYZ contains ${count} atoms, exceeding the ${LIMITS.sourceAtomSites}-atom limit.`);
    }

    invocation.onProgress?.({ stage: "parse", completed: 0, total: count });
    const atomSites = [];
    for (let index = 0; index < count; index += 1) {
      throwIfAborted(invocation.signal);
      atomSites.push(parseCoordinateLine(coordinateLines[index], firstCoordinateLine + index, index));
      const completed = index + 1;
      if (completed === count || completed % 2048 === 0) {
        invocation.onProgress?.({ stage: "parse", completed, total: count });
        if (completed < count) await Promise.resolve();
      }
    }

    return {
      content: {
        schema: "rt-parsed-structure/1",
        displayName: invocation.displayName.trim(),
        structureType: "molecule",
        source: { format: "xyz", byteLength, canonicalFormat: "rt-structure-json/1" },
        models: [{
          modelId: "model:0",
          label: comment || "Model 1",
          atomSites,
          bonds: [],
        }],
        metadata: comment ? { comment } : {},
        warnings: [],
      },
      diagnostics: [],
    };
  }

  const XyzParserAdapter = Object.freeze({
    id: "xyz-parser",
    formats: Object.freeze(["xyz"]),
    probe(input) {
      const name = String(input?.name || input?.displayName || "").toLowerCase();
      const text = typeof input?.text === "string" ? input.text.replace(/^\uFEFF/, "").trim() : "";
      const coordinateRows = text.split(/\r?\n/).filter((line) => line.trim());
      const supported = name.endsWith(".xyz") || /^\d+\s*(?:\r?\n)/.test(text)
        || (coordinateRows.length > 0 && coordinateRows.every((line) => /^\s*(?:[A-Za-z]{1,2}|\d+)\s+\S+\s+\S+\s+\S+\s*$/.test(line)));
      return { supported, confidence: supported ? 0.9 : 0, detectedFormat: supported ? "xyz" : undefined, reason: supported ? "xyz-structure" : "not-xyz" };
    },
    parse,
  });

  return { XyzParserAdapter, parseXyz: parse };
});
;
/* web/structure-viewer/parsers/mol-parser.js */
(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? require("../core/constants.js")
    : root.StructureViewerCore;
  const api = factory(dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerParsers = Object.assign(root.StructureViewerParsers || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (dependencies) {
  "use strict";

  const { LIMITS } = dependencies;
  const ELEMENT_LIST = (
    "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr "
    + "Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu "
    + "Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og"
  ).split(" ");
  const ELEMENTS = new Set(ELEMENT_LIST);
  const ROUNDED_MASS = Object.freeze([
    0, 1, 4, 7, 9, 11, 12, 14, 16, 19, 20, 23, 24, 27, 28, 31, 32, 35, 40, 39, 40, 45, 48, 51, 52, 55, 56, 59, 58, 63,
    64, 69, 74, 75, 80, 79, 84, 85, 88, 89, 90, 93, 98, 0, 102, 103, 106, 107, 114, 115, 120, 121, 130, 127, 132, 133, 138, 139, 140, 141,
    142, 0, 152, 153, 158, 159, 164, 165, 166, 169, 174, 175, 180, 181, 184, 187, 192, 193, 195, 197, 202, 205, 208, 209, 209, 210, 222, 223, 226, 227,
    232, 231, 238, 237, 244, 243, 247, 247, 251, 252, 257, 258, 259, 262, 267, 268, 271, 270, 277, 276, 281, 281, 283, 285, 289, 289, 293, 294, 294,
  ]);
  const CHARGE_CODES = Object.freeze({ 1: 3, 2: 2, 3: 1, 5: -1, 6: -2, 7: -3 });
  const OCL_SYNCHRONOUS_CROSSCHECK_MAX_ROWS = 2048;

  function byteLength(text) {
    if (typeof TextEncoder === "function") return new TextEncoder().encode(text).byteLength;
    return unescape(encodeURIComponent(text)).length;
  }

  function integer(value, label) {
    if (!/^[-+]?\d+$/.test(String(value || "").trim())) throw new Error(`Invalid ${label}.`);
    const parsed = Number(String(value).trim());
    if (!Number.isSafeInteger(parsed)) throw new Error(`Invalid ${label}.`);
    return parsed;
  }

  function finite(value, label) {
    const parsed = Number(String(value || "").trim());
    if (!Number.isFinite(parsed)) throw new Error(`Invalid finite ${label}.`);
    return parsed;
  }

  function abortError() {
    const error = new Error("MOL parsing was cancelled.");
    error.name = "AbortError";
    return error;
  }

  function v30IntegerAttribute(line, name, label) {
    const match = new RegExp(`(?:^|\\s)${name}=([-+]?\\d+)(?:\\s|$)`).exec(line);
    return match ? integer(match[1], label) : undefined;
  }

  function parsePropertyLine(line, code, atomSites) {
    const fields = line.trim().split(/\s+/);
    const count = integer(fields[2], `${code} entry count`);
    if (fields.length !== 3 + count * 2) throw new Error(`Malformed M  ${code} record.`);
    for (let index = 0; index < count; index += 1) {
      const atomIndex = integer(fields[3 + index * 2], `${code} atom index`) - 1;
      if (!atomSites[atomIndex]) throw new Error(`Invalid M  ${code} atom endpoint.`);
      const value = integer(fields[4 + index * 2], `${code} value`);
      if (code === "CHG") atomSites[atomIndex].formalCharge = value;
      else if (code === "ISO") {
        if (value < 1) throw new Error("Invalid isotope mass number.");
        atomSites[atomIndex].isotope = value;
      }
    }
  }

  function parseV3000(text, recordContext, modelIndex, title) {
    if (!/^M  V30 END CTAB\s*$/m.test(text)) throw new Error("MOL V3000 record is missing its END CTAB terminator.");
    if (!/^M  END\s*$/m.test(text)) throw new Error("MOL V3000 record is missing its M  END terminator.");
    const countMatch = /^M  V30 COUNTS\s+(\d+)\s+(\d+)\b/m.exec(text);
    if (!countMatch) throw new Error("MOL V3000 record is missing a valid COUNTS record.");
    const atomCount = integer(countMatch[1], "MOL V3000 atom count");
    const bondCount = integer(countMatch[2], "MOL V3000 bond count");
    if (atomCount < 1 || atomCount > LIMITS.sourceAtomSites) throw new Error(`MOL V3000 atom count exceeds the ${LIMITS.sourceAtomSites}-atom limit or is invalid.`);
    if (bondCount < 0 || bondCount > LIMITS.sourceBonds) throw new Error(`MOL V3000 bond count exceeds the ${LIMITS.sourceBonds}-bond limit or is invalid.`);
    const atomBlock = /M  V30 BEGIN ATOM\s*\n([\s\S]*?)M  V30 END ATOM/m.exec(text)?.[1];
    const bondBlock = /M  V30 BEGIN BOND\s*\n([\s\S]*?)M  V30 END BOND/m.exec(text)?.[1];
    if (atomBlock === undefined || bondBlock === undefined) throw new Error("MOL V3000 atom or bond block is truncated.");
    const atomIds = new Set();
    const parsedAtoms = [];
    const atomRows = atomBlock.split("\n").filter((line) => line.trim());
    if (atomRows.length !== atomCount) throw new Error("MOL V3000 atom block does not match its declared atom count.");
    atomRows.forEach((line, index) => {
      const match = /^M  V30\s+(\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+\d+(.*)$/.exec(line);
      if (!match) throw new Error(`Malformed MOL V3000 atom row ${index + 1}.`);
      if (atomIds.has(match[1])) throw new Error(`Duplicate MOL V3000 atom id ${match[1]}.`);
      atomIds.add(match[1]);
      if (!ELEMENTS.has(match[2])) throw new Error(`Invalid MOL V3000 element symbol '${match[2]}'.`);
      [match[3], match[4], match[5]].forEach((value) => finite(value, "MOL V3000 coordinate"));
      const formalCharge = v30IntegerAttribute(match[6], "CHG", "MOL V3000 charge");
      const isotope = v30IntegerAttribute(match[6], "MASS", "MOL V3000 isotope");
      if (isotope !== undefined && isotope < 1) throw new Error("Invalid MOL V3000 isotope mass number.");
      parsedAtoms.push({ id: match[1], element: match[2], coordinates: [Number(match[3]), Number(match[4]), Number(match[5])], formalCharge, isotope });
    });
    const bondIds = new Set();
    const parsedBonds = [];
    const bondRows = bondBlock.split("\n").filter((line) => line.trim());
    if (bondRows.length !== bondCount) throw new Error("MOL V3000 bond block does not match its declared bond count.");
    bondRows.forEach((line, index) => {
      const match = /^M  V30\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/.exec(line);
      if (!match) throw new Error(`Malformed MOL V3000 bond row ${index + 1}.`);
      if (bondIds.has(match[1])) throw new Error(`Duplicate MOL V3000 bond id ${match[1]}.`);
      bondIds.add(match[1]);
      if (!atomIds.has(match[3]) || !atomIds.has(match[4]) || match[3] === match[4]) throw new Error(`Invalid MOL V3000 bond endpoint at bond ${match[1]}.`);
      const type = integer(match[2], "MOL V3000 bond type");
      if (![1, 2, 3, 4].includes(type)) throw new Error(`Unsupported MOL V3000 bond type ${type}.`);
      parsedBonds.push({ beginId: match[3], endId: match[4], type });
    });

    const ocl = recordContext.openChemLib || (typeof globalThis !== "undefined" && (globalThis.OCL || globalThis.OpenChemLib || globalThis.openchemlib));
    if (!ocl?.Molecule?.fromMolfile) {
      const error = new Error("OpenChemLib 9.18.2 is required to parse MOL V3000.");
      error.code = "parser-runtime-unavailable";
      throw error;
    }
    const molecule = ocl.Molecule.fromMolfile(text);
    if (!molecule || molecule.getAllAtoms() !== atomCount || molecule.getAllBonds() !== bondCount) throw new Error("OpenChemLib returned an incomplete MOL V3000 graph.");
    const atomSites = parsedAtoms.map((parsed, index) => {
      const element = molecule.getAtomLabel(index);
      if (!ELEMENTS.has(element) || element !== parsed.element) throw new Error(`OpenChemLib returned invalid element '${element}'.`);
      const atom = {
        siteId: `site:${modelIndex}:${index}`, element: parsed.element,
        cartesian: { cart: parsed.coordinates },
        occupancy: 1, properties: {},
      };
      if (parsed.formalCharge) atom.formalCharge = parsed.formalCharge;
      if (parsed.isotope !== undefined) atom.isotope = parsed.isotope;
      return atom;
    });
    const atomIndexById = new Map(parsedAtoms.map((atom, index) => [atom.id, index]));
    const bonds = parsedBonds.map((parsed, index) => {
      const begin = atomIndexById.get(parsed.beginId);
      const end = atomIndexById.get(parsed.endId);
      const oclBegin = molecule.getBondAtom(0, index);
      const oclEnd = molecule.getBondAtom(1, index);
      if (!atomSites[begin] || !atomSites[end] || begin === end || !atomSites[oclBegin] || !atomSites[oclEnd]) throw new Error(`OpenChemLib returned an invalid MOL V3000 bond ${index + 1}.`);
      const expectedEndpoints = [begin, end].sort((left, right) => left - right);
      const actualEndpoints = [oclBegin, oclEnd].sort((left, right) => left - right);
      if (!actualEndpoints.every((value, endpoint) => value === expectedEndpoints[endpoint])) throw new Error(`OpenChemLib returned an inconsistent MOL V3000 bond at bond ${index + 1}.`);
      return {
        bondId: `bond:${modelIndex}:${index}`, beginSiteId: atomSites[begin].siteId, endSiteId: atomSites[end].siteId,
        order: parsed.type === 4 ? 1.5 : parsed.type, provenance: "source", ...(parsed.type === 4 ? { aromatic: true } : {}),
      };
    });
    return { title, atomSites, bonds, warnings: [] };
  }

  async function parseV3000RecordAsync(text, recordContext, options, lines) {
    const modelIndex = recordContext.modelIndex ?? 0;
    if (!Number.isSafeInteger(modelIndex) || modelIndex < 0) throw new TypeError("MOL modelIndex must be a non-negative safe integer.");
    const title = lines[0].trim() || `Model ${modelIndex + 1}`;
    if (!/^M  V30 END CTAB\s*$/m.test(text)) throw new Error("MOL V3000 record is missing its END CTAB terminator.");
    if (!/^M  END\s*$/m.test(text)) throw new Error("MOL V3000 record is missing its M  END terminator.");
    const signal = options.signal;
    const yieldControl = options.yieldControl || (() => new Promise((resolve) => setTimeout(resolve, 0)));
    let countMatch;
    let countsIndex = -1;
    let ctabStart = -1;
    let ctabEnd = -1;
    let atomStart = -1;
    let atomEnd = -1;
    let bondStart = -1;
    let bondEnd = -1;
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      const counts = /^M  V30 COUNTS\s+(\d+)\s+(\d+)\b/.exec(line);
      if (counts) {
        if (countMatch) throw new Error("MOL V3000 contains duplicate COUNTS records.");
        countMatch = counts;
        countsIndex = index;
      }
      if (/^M  V30 BEGIN CTAB\s*$/.test(line)) {
        if (ctabStart >= 0) throw new Error("MOL V3000 contains duplicate BEGIN CTAB records.");
        ctabStart = index;
      } else if (/^M  V30 END CTAB\s*$/.test(line)) {
        if (ctabEnd >= 0) throw new Error("MOL V3000 contains duplicate END CTAB records.");
        ctabEnd = index;
      } else if (/^M  V30 BEGIN ATOM\s*$/.test(line)) {
        if (atomStart >= 0) throw new Error("MOL V3000 contains duplicate BEGIN ATOM records.");
        atomStart = index + 1;
      } else if (/^M  V30 END ATOM\s*$/.test(line)) {
        if (atomEnd >= 0) throw new Error("MOL V3000 contains duplicate END ATOM records.");
        atomEnd = index;
      } else if (/^M  V30 BEGIN BOND\s*$/.test(line)) {
        if (bondStart >= 0) throw new Error("MOL V3000 contains duplicate BEGIN BOND records.");
        bondStart = index + 1;
      } else if (/^M  V30 END BOND\s*$/.test(line)) {
        if (bondEnd >= 0) throw new Error("MOL V3000 contains duplicate END BOND records.");
        bondEnd = index;
      }
      if ((index + 1) % 2048 === 0 && index + 1 < lines.length) {
        options.onProgress?.({ stage: "scan", completed: index + 1, total: lines.length });
        await yieldControl();
        if (signal?.aborted) throw abortError();
      }
    }
    if (!countMatch) throw new Error("MOL V3000 record is missing a valid COUNTS record.");
    const atomCount = integer(countMatch[1], "MOL V3000 atom count");
    const bondCount = integer(countMatch[2], "MOL V3000 bond count");
    if (atomCount < 1 || atomCount > LIMITS.sourceAtomSites) throw new Error(`MOL V3000 atom count exceeds the ${LIMITS.sourceAtomSites}-atom limit or is invalid.`);
    if (bondCount < 0 || bondCount > LIMITS.sourceBonds) throw new Error(`MOL V3000 bond count exceeds the ${LIMITS.sourceBonds}-bond limit or is invalid.`);
    if (!(ctabStart >= 0 && ctabStart < countsIndex && countsIndex < atomStart - 1
      && atomStart <= atomEnd && atomEnd < bondStart - 1 && bondStart <= bondEnd && bondEnd < ctabEnd)) {
      throw new Error("MOL V3000 CTAB, atom, or bond blocks are missing, duplicated, or out of order.");
    }
    const atomRows = lines.slice(atomStart, atomEnd).filter((line) => line.trim());
    const bondRows = lines.slice(bondStart, bondEnd).filter((line) => line.trim());
    if (atomRows.length !== atomCount) throw new Error("MOL V3000 atom block does not match its declared atom count.");
    if (bondRows.length !== bondCount) throw new Error("MOL V3000 bond block does not match its declared bond count.");
    const checkpoint = async (completed) => {
      if (signal?.aborted) throw abortError();
      options.onProgress?.({ stage: "materialize", completed, total: atomCount + bondCount });
      await yieldControl();
      if (signal?.aborted) throw abortError();
    };

    const atomIds = new Set();
    const atomSites = [];
    const atomIndexById = new Map();
    for (let index = 0; index < atomRows.length; index += 1) {
      const line = atomRows[index];
      const match = /^M  V30\s+(\d+)\s+(\S+)\s+(\S+)\s+(\S+)\s+(\S+)\s+\d+(.*)$/.exec(line);
      if (!match) throw new Error(`Malformed MOL V3000 atom row ${index + 1}.`);
      if (atomIds.has(match[1])) throw new Error(`Duplicate MOL V3000 atom id ${match[1]}.`);
      atomIds.add(match[1]);
      if (!ELEMENTS.has(match[2])) throw new Error(`Invalid MOL V3000 element symbol '${match[2]}'.`);
      const coordinates = [finite(match[3], "MOL V3000 coordinate"), finite(match[4], "MOL V3000 coordinate"), finite(match[5], "MOL V3000 coordinate")];
      const formalCharge = v30IntegerAttribute(match[6], "CHG", "MOL V3000 charge");
      const isotope = v30IntegerAttribute(match[6], "MASS", "MOL V3000 isotope");
      if (isotope !== undefined && isotope < 1) throw new Error("Invalid MOL V3000 isotope mass number.");
      const atom = { siteId: `site:${modelIndex}:${index}`, element: match[2], cartesian: { cart: coordinates }, occupancy: 1, properties: {} };
      if (formalCharge) atom.formalCharge = formalCharge;
      if (isotope !== undefined) atom.isotope = isotope;
      atomIndexById.set(match[1], index);
      atomSites.push(atom);
      if ((index + 1) % 2048 === 0 && index + 1 < atomRows.length) await checkpoint(index + 1);
    }

    const bondIds = new Set();
    const bonds = [];
    const bondEndpoints = [];
    for (let index = 0; index < bondRows.length; index += 1) {
      const match = /^M  V30\s+(\d+)\s+(\d+)\s+(\d+)\s+(\d+)/.exec(bondRows[index]);
      if (!match) throw new Error(`Malformed MOL V3000 bond row ${index + 1}.`);
      if (bondIds.has(match[1])) throw new Error(`Duplicate MOL V3000 bond id ${match[1]}.`);
      bondIds.add(match[1]);
      const begin = atomIndexById.get(match[3]);
      const end = atomIndexById.get(match[4]);
      if (begin === undefined || end === undefined || begin === end) throw new Error(`Invalid MOL V3000 bond endpoint at bond ${match[1]}.`);
      const type = integer(match[2], "MOL V3000 bond type");
      if (![1, 2, 3, 4].includes(type)) throw new Error(`Unsupported MOL V3000 bond type ${type}.`);
      bonds.push({
        bondId: `bond:${modelIndex}:${index}`, beginSiteId: atomSites[begin].siteId, endSiteId: atomSites[end].siteId,
        order: type === 4 ? 1.5 : type, provenance: "source", ...(type === 4 ? { aromatic: true } : {}),
      });
      bondEndpoints.push([begin, end]);
      if ((index + 1) % 2048 === 0 && index + 1 < bondRows.length) await checkpoint(atomCount + index + 1);
    }

    const ocl = recordContext.openChemLib || (typeof globalThis !== "undefined" && (globalThis.OCL || globalThis.OpenChemLib || globalThis.openchemlib));
    if (!ocl?.Molecule?.fromMolfile) {
      const error = new Error("OpenChemLib 9.18.2 is required to parse MOL V3000.");
      error.code = "parser-runtime-unavailable";
      throw error;
    }
    const warnings = [];
    if (atomCount + bondCount <= OCL_SYNCHRONOUS_CROSSCHECK_MAX_ROWS) {
      await yieldControl();
      if (signal?.aborted) throw abortError();
      const molecule = ocl.Molecule.fromMolfile(text);
      if (!molecule || molecule.getAllAtoms() !== atomCount || molecule.getAllBonds() !== bondCount) throw new Error("OpenChemLib returned an incomplete MOL V3000 graph.");
      if (typeof molecule.getAtomLabel !== "function" || typeof molecule.getBondAtom !== "function") throw new Error("OpenChemLib returned an incomplete MOL V3000 graph API.");
      for (let index = 0; index < atomCount; index += 1) {
        if (molecule.getAtomLabel(index) !== atomSites[index].element) throw new Error(`OpenChemLib returned an inconsistent MOL V3000 element at atom ${index + 1}.`);
      }
      for (let index = 0; index < bondCount; index += 1) {
        const actual = [molecule.getBondAtom(0, index), molecule.getBondAtom(1, index)].sort((left, right) => left - right);
        const expected = [...bondEndpoints[index]].sort((left, right) => left - right);
        if (!actual.every((value, endpoint) => value === expected[endpoint])) throw new Error(`OpenChemLib returned an inconsistent MOL V3000 bond at bond ${index + 1}.`);
      }
      await yieldControl();
      if (signal?.aborted) throw abortError();
    } else {
      warnings.push(`OpenChemLib graph cross-check skipped above ${OCL_SYNCHRONOUS_CROSSCHECK_MAX_ROWS.toLocaleString("en-US")} V3000 atom/bond rows to preserve responsive main-thread parsing; strict bounded source validation was applied.`);
    }
    return { title, atomSites, bonds, warnings };
  }

  function parseMolRecord(text, recordContext = {}) {
    if (typeof text !== "string") throw new TypeError("MOL record text is required.");
    const modelIndex = recordContext.modelIndex ?? 0;
    if (!Number.isSafeInteger(modelIndex) || modelIndex < 0) throw new TypeError("MOL modelIndex must be a non-negative safe integer.");
    const lines = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
    if (lines.length < 4) throw new Error("MOL record is truncated before the counts line.");
    const title = lines[0].trim() || `Model ${modelIndex + 1}`;
    if (/V3000\s*$/.test(lines[3])) return parseV3000(text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n"), recordContext, modelIndex, title);
    const countsFields = lines[3].trim().split(/\s+/);
    if (!/V2000\s*$/.test(lines[3])) throw new Error("Only MOL V2000 records are supported.");
    const atomCount = integer(countsFields[0], "MOL atom count");
    const bondCount = integer(countsFields[1], "MOL bond count");
    if (atomCount < 1 || atomCount > LIMITS.sourceAtomSites) throw new Error(`MOL atom count exceeds the ${LIMITS.sourceAtomSites}-atom limit or is invalid.`);
    if (bondCount < 0 || bondCount > LIMITS.sourceBonds) throw new Error(`MOL bond count exceeds the ${LIMITS.sourceBonds}-bond limit or is invalid.`);
    const blockEnd = 4 + atomCount + bondCount;
    if (lines.length < blockEnd) throw new Error("MOL record is truncated in its atom or bond block.");

    const atomSites = [];
    for (let index = 0; index < atomCount; index += 1) {
      const line = lines[4 + index] || "";
      if (line.length < 34) throw new Error(`MOL atom block is truncated at atom ${index + 1}.`);
      const element = line.slice(31, 34).trim();
      if (!ELEMENTS.has(element)) throw new Error(`Invalid MOL element symbol '${element}' at atom ${index + 1}.`);
      const atom = {
        siteId: `site:${modelIndex}:${index}`,
        element,
        cartesian: { cart: [finite(line.slice(0, 10), "MOL X coordinate"), finite(line.slice(10, 20), "MOL Y coordinate"), finite(line.slice(20, 30), "MOL Z coordinate")] },
        occupancy: 1,
        properties: {},
      };
      const chargeCode = Number(line.slice(36, 39).trim() || 0);
      if (CHARGE_CODES[chargeCode] !== undefined) atom.formalCharge = CHARGE_CODES[chargeCode];
      const massDifference = integer(line.slice(34, 36).trim() || "0", "MOL isotope mass difference");
      if (massDifference < -3 || massDifference > 4) throw new Error("MOL isotope mass difference must be in the -3..4 range.");
      if (massDifference) {
        const atomicNumber = ELEMENT_LIST.indexOf(element) + 1;
        const baseMass = ROUNDED_MASS[atomicNumber];
        if (!baseMass) throw new Error(`MOL isotope mass difference is unsupported for ${element}.`);
        atom.isotope = baseMass + massDifference;
      }
      atomSites.push(atom);
    }

    const bonds = [];
    for (let index = 0; index < bondCount; index += 1) {
      const line = lines[4 + atomCount + index] || "";
      if (line.length < 9) throw new Error(`MOL bond block is truncated at bond ${index + 1}.`);
      const begin = integer(line.slice(0, 3), "MOL bond begin endpoint") - 1;
      const end = integer(line.slice(3, 6), "MOL bond end endpoint") - 1;
      const type = integer(line.slice(6, 9), "MOL bond type");
      if (!atomSites[begin] || !atomSites[end] || begin === end) throw new Error(`Invalid MOL bond endpoint at bond ${index + 1}.`);
      if (![1, 2, 3, 4].includes(type)) throw new Error(`Unsupported MOL bond type ${type}.`);
      bonds.push({
        bondId: `bond:${modelIndex}:${index}`,
        beginSiteId: atomSites[begin].siteId,
        endSiteId: atomSites[end].siteId,
        order: type === 4 ? 1.5 : type,
        provenance: "source",
        ...(type === 4 ? { aromatic: true } : {}),
      });
    }

    let foundEnd = false;
    for (let index = blockEnd; index < lines.length; index += 1) {
      const line = lines[index];
      if (/^M  END\s*$/.test(line)) { foundEnd = true; break; }
      if (/^M  CHG\b/.test(line)) parsePropertyLine(line, "CHG", atomSites);
      else if (/^M  ISO\b/.test(line)) parsePropertyLine(line, "ISO", atomSites);
    }
    if (!foundEnd) throw new Error("MOL record is missing its M  END terminator.");
    return { title, atomSites, bonds, warnings: [] };
  }

  async function parseV2000RecordAsync(text, recordContext, options, lines) {
    const modelIndex = recordContext.modelIndex ?? 0;
    if (!Number.isSafeInteger(modelIndex) || modelIndex < 0) throw new TypeError("MOL modelIndex must be a non-negative safe integer.");
    if (lines.length < 4) throw new Error("MOL record is truncated before the counts line.");
    const title = lines[0].trim() || `Model ${modelIndex + 1}`;
    if (!/V2000\s*$/.test(lines[3])) throw new Error("Only MOL V2000 records are supported.");
    const countsFields = lines[3].trim().split(/\s+/);
    const atomCount = integer(countsFields[0], "MOL atom count");
    const bondCount = integer(countsFields[1], "MOL bond count");
    if (atomCount < 1 || atomCount > LIMITS.sourceAtomSites) throw new Error(`MOL atom count exceeds the ${LIMITS.sourceAtomSites}-atom limit or is invalid.`);
    if (bondCount < 0 || bondCount > LIMITS.sourceBonds) throw new Error(`MOL bond count exceeds the ${LIMITS.sourceBonds}-bond limit or is invalid.`);
    const blockEnd = 4 + atomCount + bondCount;
    if (lines.length < blockEnd) throw new Error("MOL record is truncated in its atom or bond block.");
    const signal = options.signal;
    const yieldControl = options.yieldControl || (() => new Promise((resolve) => setTimeout(resolve, 0)));
    const checkpoint = async (completed, total) => {
      if (signal?.aborted) throw abortError();
      options.onProgress?.({ stage: "materialize", completed, total });
      await yieldControl();
      if (signal?.aborted) throw abortError();
    };

    const atomSites = [];
    for (let index = 0; index < atomCount; index += 1) {
      const line = lines[4 + index] || "";
      if (line.length < 34) throw new Error(`MOL atom block is truncated at atom ${index + 1}.`);
      const element = line.slice(31, 34).trim();
      if (!ELEMENTS.has(element)) throw new Error(`Invalid MOL element symbol '${element}' at atom ${index + 1}.`);
      const atom = {
        siteId: `site:${modelIndex}:${index}`, element,
        cartesian: { cart: [finite(line.slice(0, 10), "MOL X coordinate"), finite(line.slice(10, 20), "MOL Y coordinate"), finite(line.slice(20, 30), "MOL Z coordinate")] },
        occupancy: 1, properties: {},
      };
      const chargeCode = Number(line.slice(36, 39).trim() || 0);
      if (CHARGE_CODES[chargeCode] !== undefined) atom.formalCharge = CHARGE_CODES[chargeCode];
      const massDifference = integer(line.slice(34, 36).trim() || "0", "MOL isotope mass difference");
      if (massDifference < -3 || massDifference > 4) throw new Error("MOL isotope mass difference must be in the -3..4 range.");
      if (massDifference) {
        const baseMass = ROUNDED_MASS[ELEMENT_LIST.indexOf(element) + 1];
        if (!baseMass) throw new Error(`MOL isotope mass difference is unsupported for ${element}.`);
        atom.isotope = baseMass + massDifference;
      }
      atomSites.push(atom);
      if ((index + 1) % 2048 === 0 && index + 1 < atomCount) await checkpoint(index + 1, atomCount + bondCount);
    }

    const bonds = [];
    for (let index = 0; index < bondCount; index += 1) {
      const line = lines[4 + atomCount + index] || "";
      if (line.length < 9) throw new Error(`MOL bond block is truncated at bond ${index + 1}.`);
      const begin = integer(line.slice(0, 3), "MOL bond begin endpoint") - 1;
      const end = integer(line.slice(3, 6), "MOL bond end endpoint") - 1;
      const type = integer(line.slice(6, 9), "MOL bond type");
      if (!atomSites[begin] || !atomSites[end] || begin === end) throw new Error(`Invalid MOL bond endpoint at bond ${index + 1}.`);
      if (![1, 2, 3, 4].includes(type)) throw new Error(`Unsupported MOL bond type ${type}.`);
      bonds.push({
        bondId: `bond:${modelIndex}:${index}`, beginSiteId: atomSites[begin].siteId, endSiteId: atomSites[end].siteId,
        order: type === 4 ? 1.5 : type, provenance: "source", ...(type === 4 ? { aromatic: true } : {}),
      });
      if ((index + 1) % 2048 === 0 && index + 1 < bondCount) await checkpoint(atomCount + index + 1, atomCount + bondCount);
    }

    let foundEnd = false;
    for (let index = blockEnd; index < lines.length; index += 1) {
      const line = lines[index];
      if (/^M  END\s*$/.test(line)) { foundEnd = true; break; }
      if (/^M  CHG\b/.test(line)) parsePropertyLine(line, "CHG", atomSites);
      else if (/^M  ISO\b/.test(line)) parsePropertyLine(line, "ISO", atomSites);
      if ((index - blockEnd + 1) % 2048 === 0) await checkpoint(atomCount + bondCount + index - blockEnd + 1, atomCount + bondCount + lines.length - blockEnd);
    }
    if (!foundEnd) throw new Error("MOL record is missing its M  END terminator.");
    if (signal?.aborted) throw abortError();
    return { title, atomSites, bonds, warnings: [] };
  }

  async function parseMolRecordAsync(text, recordContext = {}, options = {}) {
    const signal = options.signal;
    const yieldControl = options.yieldControl || (() => new Promise((resolve) => setTimeout(resolve, 0)));
    const normalized = String(text || "").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
    const lines = normalized.split("\n");
    if (signal?.aborted) throw abortError();
    if (!/V3000\s*$/.test(lines[3] || "")) return parseV2000RecordAsync(normalized, recordContext, options, lines);
    return parseV3000RecordAsync(normalized, recordContext, { ...options, signal, yieldControl }, lines);
  }

  async function parse(input, options = {}) {
    if (typeof input?.text !== "string") throw new TypeError("MOL input text is required.");
    const displayName = String(input.displayName || input.name || "structure.mol").trim();
    if (!displayName) throw new TypeError("MOL displayName is required.");
    const size = byteLength(input.text);
    if (size > LIMITS.inputSourceBytes) throw new Error(`MOL input exceeds the ${LIMITS.inputSourceBytes}-byte source limit.`);
    const signal = input.signal || options.signal;
    if (signal?.aborted) throw abortError();
    const record = await parseMolRecordAsync(
      input.text,
      { modelIndex: 0, openChemLib: input.openChemLib },
      { signal, yieldControl: options.yieldControl, onProgress: input.onProgress || options.onProgress || options.progress },
    );
    return {
      content: {
        schema: "rt-parsed-structure/1", displayName, structureType: "molecule",
        source: { format: "mol", byteLength: size, canonicalFormat: "rt-structure-json/1" },
        models: [{ modelId: "model:0", label: record.title, atomSites: record.atomSites, bonds: record.bonds }],
        metadata: {}, warnings: record.warnings,
      },
      diagnostics: [],
    };
  }

  const MolParserAdapter = Object.freeze({
    id: "mol-v2000-parser", formats: Object.freeze(["mol"]),
    probe(input) {
      const name = String(input?.name || input?.displayName || "").toLowerCase();
      const supported = name.endsWith(".mol") || /V2000[\s\S]*M  END/.test(String(input?.text || ""));
      return { supported, confidence: supported ? 0.97 : 0, detectedFormat: supported ? "mol" : undefined, reason: supported ? "mol-v2000" : "not-mol-v2000" };
    },
    parse,
  });

  return { MolParserAdapter, parseMolRecord, parseMolRecordAsync, parseMol: parse };
});
;
/* web/structure-viewer/parsers/sdf-parser.js */
(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? { ...require("../core/constants.js"), ...require("./mol-parser.js") }
    : { ...(root.StructureViewerCore || {}), ...(root.StructureViewerParsers || {}) };
  const api = factory(dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerParsers = Object.assign(root.StructureViewerParsers || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (dependencies) {
  "use strict";

  const { LIMITS, parseMolRecordAsync } = dependencies;

  function utf8ByteLength(text) {
    if (typeof TextEncoder === "function") return new TextEncoder().encode(text).byteLength;
    return unescape(encodeURIComponent(text)).length;
  }

  function abortError() {
    const error = new Error("SDF parsing was cancelled.");
    error.name = "AbortError";
    return error;
  }

  function parseProperties(record) {
    const lines = record.replace(/\r\n?/g, "\n").split("\n");
    const end = lines.findIndex((line) => /^M  END\s*$/.test(line));
    if (end < 0) return {};
    const properties = {};
    for (let index = end + 1; index < lines.length; index += 1) {
      const match = /^>\s*<([^<>]+)>\s*$/.exec(lines[index]);
      if (!match) continue;
      const values = [];
      index += 1;
      while (index < lines.length && lines[index] !== "") { values.push(lines[index]); index += 1; }
      properties[match[1].trim()] = values.join("\n");
    }
    return properties;
  }

  function frameRecords(text) {
    const normalized = text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
    const records = normalized.split(/^\$\$\$\$\s*$/m);
    while (records.length && !records.at(-1).trim()) records.pop();
    return records.map((record) => record.replace(/^\n+|\n+$/g, "")).filter((record) => record.trim());
  }

  async function parse(input, options = {}) {
    if (typeof input?.text !== "string") throw new TypeError("SDF input text is required.");
    const displayName = String(input.displayName || input.name || "structures.sdf").trim();
    if (!displayName) throw new TypeError("SDF displayName is required.");
    const size = utf8ByteLength(input.text);
    if (size > LIMITS.inputSourceBytes) throw new Error(`SDF input exceeds the ${LIMITS.inputSourceBytes}-byte source limit.`);
    const signal = input.signal || options.signal;
    const onProgress = input.onProgress || options.onProgress || options.progress;
    const now = options.now || (() => Date.now());
    const yieldControl = options.yieldControl || (() => new Promise((resolve) => setTimeout(resolve, 0)));
    const metrics = options.metrics;
    const startedAt = now();
    if (metrics) Object.assign(metrics, { parseMs: 0, yields: 0, maxSliceMs: 0 });
    if (signal?.aborted) throw abortError();
    const records = frameRecords(input.text);
    if (!records.length) throw new Error("SDF input contains no records.");
    if (records.length > LIMITS.models) throw new Error(`SDF record count exceeds the ${LIMITS.models.toLocaleString("en-US")}-model limit.`);

    const models = [];
    const metadataRecords = [];
    const warnings = [];
    let sliceStart = startedAt;
    onProgress?.({ stage: "parse", completed: 0, total: records.length });
    for (let index = 0; index < records.length; index += 1) {
      if (signal?.aborted) throw abortError();
      let parsed;
      try {
        parsed = await parseMolRecordAsync(
          records[index],
          { modelIndex: index, openChemLib: input.openChemLib },
          { signal, yieldControl },
        );
      }
      catch (cause) {
        if (cause?.name === "AbortError") throw cause;
        throw new Error(`SDF record ${index + 1}: ${cause.message}`, { cause });
      }
      const modelId = `model:${index}`;
      models.push({ modelId, label: parsed.title, atomSites: parsed.atomSites, bonds: parsed.bonds });
      metadataRecords.push({ modelId, properties: parseProperties(records[index]) });
      (parsed.warnings || []).forEach((warning) => warnings.push(`SDF record ${index + 1}: ${warning}`));
      onProgress?.({ stage: "parse", completed: index + 1, total: records.length });
      const sliceMs = now() - sliceStart;
      if (metrics) metrics.maxSliceMs = Math.max(metrics.maxSliceMs, sliceMs);
      if (sliceMs >= LIMITS.mainThreadSliceMs && index + 1 < records.length) {
        await yieldControl();
        if (metrics) metrics.yields += 1;
        if (signal?.aborted) throw abortError();
        sliceStart = now();
      }
    }

    if (metrics) metrics.parseMs = now() - startedAt;

    return {
      content: {
        schema: "rt-parsed-structure/1", displayName, structureType: models.length > 1 ? "multi-model" : "molecule",
        source: { format: "sdf", byteLength: size, canonicalFormat: "rt-structure-json/1" },
        models, metadata: { records: metadataRecords }, warnings,
      },
      diagnostics: [],
    };
  }

  const SdfParserAdapter = Object.freeze({
    id: "sdf-v2000-parser", formats: Object.freeze(["sdf"]),
    probe(input) {
      const name = String(input?.name || input?.displayName || "").toLowerCase();
      const text = String(input?.text || "");
      const supported = name.endsWith(".sdf") || (/V2000/.test(text) && /^\$\$\$\$\s*$/m.test(text));
      return { supported, confidence: supported ? 0.98 : 0, detectedFormat: supported ? "sdf" : undefined, reason: supported ? "sdf-v2000" : "not-sdf-v2000" };
    },
    parse,
  });

  return { SdfParserAdapter, parseSdf: parse, frameSdfRecords: frameRecords };
});
;
/* web/structure-viewer/parsers/pdb-parser.js */
(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? require("../core/constants.js")
    : root.StructureViewerCore;
  const api = factory(dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerParsers = Object.assign(root.StructureViewerParsers || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (dependencies) {
  "use strict";

  const { LIMITS } = dependencies;
  const ELEMENTS = new Set((
    "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr "
    + "Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu "
    + "Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og"
  ).split(" "));

  function abortError() { const error = new Error("PDB parsing was cancelled."); error.name = "AbortError"; return error; }
  function utf8ByteLength(text) { return typeof TextEncoder === "function" ? new TextEncoder().encode(text).byteLength : unescape(encodeURIComponent(text)).length; }
  function finite(field, label, lineNumber, fallback) {
    const text = field.trim();
    if (!text && fallback !== undefined) return fallback;
    const value = Number(text);
    if (!Number.isFinite(value)) throw new Error(`PDB line ${lineNumber} contains an invalid ${label}.`);
    return value;
  }
  function normalizeElement(rawElement, rawAtomName, lineNumber) {
    const explicit = rawElement.trim();
    if (explicit) {
      const candidate = explicit[0].toUpperCase() + explicit.slice(1).toLowerCase();
      if (ELEMENTS.has(candidate)) return candidate;
      throw new Error(`PDB line ${lineNumber} contains invalid element '${explicit}'.`);
    }
    let token;
    if (/^\d/.test(rawAtomName)) token = rawAtomName.slice(1).trim().slice(0, 1);
    else if (rawAtomName.startsWith(" ")) token = rawAtomName.trim().slice(0, 1);
    else token = rawAtomName.trim().slice(0, 2);
    const candidate = token ? token[0].toUpperCase() + token.slice(1).toLowerCase() : "";
    if (!ELEMENTS.has(candidate)) throw new Error(`PDB line ${lineNumber} atom name cannot be resolved to a valid element.`);
    return candidate;
  }
  function integer(field, label, lineNumber) {
    if (!/^[-+]?\d+$/.test(field.trim())) throw new Error(`PDB line ${lineNumber} contains an invalid ${label}.`);
    const value = Number(field.trim());
    if (!Number.isSafeInteger(value)) throw new Error(`PDB line ${lineNumber} contains an invalid ${label}.`);
    return value;
  }

  async function parse(input, options = {}) {
    if (typeof input?.text !== "string") throw new TypeError("PDB input text is required.");
    const displayName = String(input.displayName || input.name || "structure.pdb").trim();
    if (!displayName) throw new TypeError("PDB displayName is required.");
    const size = utf8ByteLength(input.text);
    if (size > LIMITS.inputSourceBytes) throw new Error(`PDB input exceeds the ${LIMITS.inputSourceBytes}-byte source limit.`);
    const signal = input.signal || options.signal;
    const onProgress = input.onProgress || options.onProgress || options.progress;
    const now = options.now || (() => Date.now());
    const yieldControl = options.yieldControl || (() => new Promise((resolve) => setTimeout(resolve, 0)));
    const metrics = options.metrics;
    const startedAt = now();
    if (metrics) Object.assign(metrics, { parseMs: 0, yields: 0, maxSliceMs: 0 });
    if (signal?.aborted) throw abortError();
    const lines = input.text.replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
    const models = [];
    const conectPairs = [];
    let current = null;
    let explicitModels = false;
    let totalSites = 0;
    let hasAtomRecords = false;
    let sliceStart = startedAt;

    function startModel(label) {
      if (models.length >= LIMITS.models) throw new Error(`PDB model count exceeds the ${LIMITS.models}-model limit.`);
      current = { modelId: `model:${models.length}`, label: label || `Model ${models.length + 1}`, atomSites: [], bonds: [], residues: [], _serials: new Map(), _residues: new Map() };
      models.push(current);
    }
    function activeModel() { if (!current) startModel("Model 1"); return current; }

    onProgress?.({ stage: "parse", completed: 0, total: lines.length });
    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      if (signal?.aborted) throw abortError();
      const line = lines[lineIndex];
      const record = line.slice(0, 6).trim();
      const lineNumber = lineIndex + 1;
      if (record === "MODEL") {
        if (current) throw new Error(`PDB MODEL line ${lineNumber} is nested before ENDMDL.`);
        if (models.length && !explicitModels) throw new Error(`PDB MODEL line ${lineNumber} follows atoms outside an explicit MODEL boundary.`);
        explicitModels = true;
        startModel(line.slice(10, 14).trim() ? `Model ${line.slice(10, 14).trim()}` : undefined);
      } else if (record === "ENDMDL") {
        if (!explicitModels || !current) throw new Error(`PDB ENDMDL line ${lineNumber} has no matching MODEL.`);
        if (!current.atomSites.length) throw new Error(`PDB MODEL ending at line ${lineNumber} is empty and contains no coordinates.`);
        current = null;
      }
      else if (record === "ATOM" || record === "HETATM") {
        if (explicitModels && !current) throw new Error(`PDB atom line ${lineNumber} is outside an explicit MODEL boundary.`);
        hasAtomRecords ||= record === "ATOM";
        if (line.length < 54) throw new Error(`PDB atom line ${lineNumber} is truncated.`);
        const model = activeModel();
        const serial = integer(line.slice(6, 11), "atom serial", lineNumber);
        if (model._serials.has(serial)) throw new Error(`PDB line ${lineNumber} repeats atom serial ${serial}.`);
        totalSites += 1;
        if (totalSites > LIMITS.sourceAtomSites) throw new Error(`PDB atom count exceeds the ${LIMITS.sourceAtomSites}-site limit.`);
        const chainId = line.slice(21, 22).trim();
        const sequenceNumber = integer(line.slice(22, 26), "residue sequence", lineNumber);
        const insertionCode = line.slice(26, 27).trim();
        const residueName = line.slice(17, 20).trim() || "UNK";
        const residueId = `res:${chainId || "_"}:${sequenceNumber}:${insertionCode || "_"}`;
        const siteId = `site:${models.indexOf(model)}:row:${lineNumber}`;
        const site = {
          siteId, label: line.slice(12, 16).trim(), element: normalizeElement(line.slice(76, 78), line.slice(12, 16), lineNumber),
          cartesian: { cart: [finite(line.slice(30, 38), "X coordinate", lineNumber), finite(line.slice(38, 46), "Y coordinate", lineNumber), finite(line.slice(46, 54), "Z coordinate", lineNumber)] },
          occupancy: finite(line.slice(54, 60), "occupancy", lineNumber, 1), properties: { temperatureFactor: finite(line.slice(60, 66), "temperature factor", lineNumber, 0), recordType: record },
          residueId, chainId, sourceRow: lineNumber,
        };
        const altLocation = line.slice(16, 17).trim();
        if (altLocation) site.altLocation = altLocation;
        model.atomSites.push(site);
        model._serials.set(serial, siteId);
        if (!model._residues.has(residueId)) {
          const residue = { residueId, name: residueName, atomSiteIds: [], sequenceNumber, insertionCode, chainId };
          model._residues.set(residueId, residue);
          model.residues.push(residue);
        }
        model._residues.get(residueId).atomSiteIds.push(siteId);
      } else if (record === "CONECT") {
        const serials = line.slice(6).match(/.{1,5}/g)?.map((field) => field.trim()).filter(Boolean).map((field) => integer(field, "CONECT serial", lineNumber)) || [];
        if (serials.length > 5) throw new Error(`PDB CONECT line ${lineNumber} has too many endpoints.`);
        if (serials.length > 1) serials.slice(1).forEach((serial) => {
          conectPairs.push([serials[0], serial, lineNumber]);
          if (conectPairs.length > LIMITS.sourceBonds) throw new Error(`PDB bond count exceeds the ${LIMITS.sourceBonds}-bond limit.`);
        });
      }
      const completed = lineIndex + 1;
      if (completed === lines.length || completed % 2048 === 0) {
        onProgress?.({ stage: "parse", completed, total: lines.length });
      }
      const sliceMs = now() - sliceStart;
      if (metrics) metrics.maxSliceMs = Math.max(metrics.maxSliceMs, sliceMs);
      if (sliceMs >= LIMITS.mainThreadSliceMs && completed < lines.length) {
        await yieldControl();
        if (metrics) metrics.yields += 1;
        if (signal?.aborted) throw abortError();
        sliceStart = now();
      }
    }
    if (explicitModels && current) throw new Error("PDB explicit MODEL is unterminated; ENDMDL is required.");
    if (!models.length || !models.some((model) => model.atomSites.length)) throw new Error("PDB input contains no ATOM or HETATM records.");
    models.forEach((model) => {
      const unique = new Map();
      conectPairs.forEach(([leftSerial, rightSerial, lineNumber]) => {
        const left = model._serials.get(leftSerial); const right = model._serials.get(rightSerial);
        if (!left || !right) {
          const missingSerial = !left ? leftSerial : rightSerial;
          throw new Error(`PDB CONECT line ${lineNumber} references missing atom serial ${missingSerial}.`);
        }
        if (left === right) throw new Error(`PDB CONECT line ${lineNumber} contains a self-referencing endpoint.`);
        const endpoints = [left, right].sort();
        unique.set(`${endpoints[0]}\u0000${endpoints[1]}`, endpoints);
      });
      model.bonds = Array.from(unique.values()).sort((a, b) => a[0].localeCompare(b[0]) || a[1].localeCompare(b[1])).map((endpoints, index) => ({
        bondId: `bond:${model.modelId.split(":")[1]}:${index}`, beginSiteId: endpoints[0], endSiteId: endpoints[1], order: 1, provenance: "source",
      }));
      delete model._serials; delete model._residues;
    });
    if (metrics) metrics.parseMs = now() - startedAt;
    return {
      content: {
        schema: "rt-parsed-structure/1", displayName,
        structureType: models.length > 1 ? "multi-model" : hasAtomRecords ? "macromolecule" : "molecule",
        source: { format: "pdb", byteLength: size, canonicalFormat: "rt-structure-json/1" },
        models, metadata: { explicitModels }, warnings: [],
      }, diagnostics: [],
    };
  }

  const PdbParserAdapter = Object.freeze({
    id: "pdb-parser", formats: Object.freeze(["pdb"]),
    probe(input) {
      const name = String(input?.name || input?.displayName || "").toLowerCase();
      const supported = /\.(?:pdb|ent)$/.test(name) || /^(?:ATOM  |HETATM|HEADER|MODEL )/m.test(String(input?.text || ""));
      return { supported, confidence: supported ? 0.96 : 0, detectedFormat: supported ? "pdb" : undefined, reason: supported ? "pdb-records" : "not-pdb" };
    }, parse,
  });
  return { PdbParserAdapter, parsePdb: parse };
});
;
/* web/structure-viewer/parsers/cif-parser.js */
(function (root, factory) {
  const core = typeof module === "object" && module.exports
    ? require("../core/constants.js")
    : root.StructureViewerCore;
  const defaultBackend = typeof module === "object" && module.exports
    ? require("../vendor/molstar-cif-parser.js")
    : root.MolstarCifBundle;
  const symmetry = typeof module === "object" && module.exports
    ? require("../crystal/symmetry.js")
    : root.StructureViewerCrystal;
  const api = factory(core, defaultBackend, symmetry);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerParsers = Object.assign(root.StructureViewerParsers || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (core, defaultBackend, symmetry) {
  "use strict";

  const { LIMITS } = core;

  function abortError() {
    const error = new Error("CIF parsing was cancelled.");
    error.name = "AbortError";
    return error;
  }

  function byteLength(text) {
    return typeof TextEncoder === "function"
      ? new TextEncoder().encode(text).byteLength
      : unescape(encodeURIComponent(text)).length;
  }

  function checkAborted(signal) {
    if (signal?.aborted) throw abortError();
  }

  async function normalizeBackendDocument(file, options = {}) {
    if (!file || !Array.isArray(file.blocks) || !file.blocks.length) {
      throw new Error("CIF parser returned no data blocks.");
    }
    const now = options.now || (() => Date.now());
    const yieldControl = options.yieldControl || (() => new Promise((resolve) => setTimeout(resolve, 0)));
    let sliceStart = now();
    async function cooperate() {
      checkAborted(options.signal);
      if (now() - sliceStart >= LIMITS.mainThreadSliceMs) {
        await yieldControl();
        checkAborted(options.signal);
        sliceStart = now();
      }
    }
    const blocks = [];
    for (let blockIndex = 0; blockIndex < file.blocks.length; blockIndex += 1) {
      const block = file.blocks[blockIndex];
        const categories = {};
        for (const [categoryName, category] of Object.entries(block.categories || {})) {
          await cooperate();
          const rowCount = Number(category?.rowCount || 0);
          if (!Number.isSafeInteger(rowCount) || rowCount < 0) {
            throw new Error(`CIF category '${categoryName}' has an invalid row count.`);
          }
          if ((categoryName === "atom_site" || categoryName.startsWith("atom_site_"))
              && rowCount > LIMITS.sourceAtomSites) {
            throw new Error(`CIF atom-site row limit exceeds the ${LIMITS.sourceAtomSites}-site limit.`);
          }
          if ((categoryName === "space_group_symop" || categoryName.startsWith("space_group_symop_"))
              && rowCount > LIMITS.symmetryOperations) {
            throw new Error(`CIF symmetry-operation count exceeds the ${LIMITS.symmetryOperations}-operation limit.`);
          }
          const fields = {};
          for (const fieldName of category.fieldNames || []) {
            const sourceField = category.getField(fieldName);
            if (!sourceField) continue;
            fields[fieldName] = [];
            for (let row = 0; row < rowCount; row += 1) {
              fields[fieldName].push(sourceField.str(row));
              await cooperate();
            }
          }
          categories[categoryName] = { rowCount, fields };
        }
        blocks.push({
          blockId: `block:${blockIndex}`,
          header: String(block.header || `data_${blockIndex + 1}`),
          categories,
        });
    }
    return { blocks };
  }

  async function parseCifDocument(text, options = {}) {
    if (typeof text !== "string") throw new TypeError("CIF source text is required.");
    if (byteLength(text) > LIMITS.inputSourceBytes) {
      throw new Error(`CIF input exceeds the ${LIMITS.inputSourceBytes}-byte source limit.`);
    }
    checkAborted(options.signal);
    const backend = options.backend || defaultBackend;
    if (!backend || typeof backend.parseCifText !== "function") {
      throw new Error("The selected CIF parser backend is unavailable.");
    }
    let parsed;
    try {
      parsed = await backend.parseCifText(text);
    } catch (error) {
      throw new Error(`CIF parse failed: ${error?.message || error}`);
    }
    checkAborted(options.signal);
    return normalizeBackendDocument(parsed, options);
  }

  function values(block, names) {
    for (const name of names) {
      if (block.categories[name]?.fields?.[""]) return block.categories[name].fields[""];
      const separator = name.indexOf(".");
      if (separator > 0) {
        const category = block.categories[name.slice(0, separator)];
        const candidate = category?.fields?.[name.slice(separator + 1)];
        if (candidate) return candidate;
      }
    }
    return undefined;
  }

  function textAt(fieldValues, row = 0) {
    if (!fieldValues || row >= fieldValues.length) return undefined;
    const value = String(fieldValues[row] ?? "");
    return value === "" || value === "." || value === "?" ? undefined : value;
  }

  function metadataText(fieldValues, row = 0) {
    const value = textAt(fieldValues, row);
    if (value === undefined) return undefined;
    return value.replace(/[<>]/g, "").replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/g, "").trim() || undefined;
  }

  function numberAt(fieldValues, row = 0, fallback) {
    const text = textAt(fieldValues, row);
    if (text === undefined) return fallback;
    const value = Number.parseFloat(text.replace(/\([^)]*\)$/, ""));
    if (!Number.isFinite(value)) throw new Error(`CIF numeric value '${text}' is invalid.`);
    return value;
  }

  function gcd(left, right) {
    let a = Math.abs(left); let b = Math.abs(right);
    while (b) [a, b] = [b, a % b];
    return a || 1;
  }

  function rational(numerator, denominator = 1) {
    if (!Number.isSafeInteger(numerator) || !Number.isSafeInteger(denominator) || denominator === 0) {
      throw new Error("CIF symmetry operation contains an invalid rational value.");
    }
    if (denominator < 0) return rational(-numerator, -denominator);
    const divisor = gcd(numerator, denominator);
    return { numerator: numerator / divisor, denominator: denominator / divisor };
  }

  function addRational(left, right) {
    return rational(
      left.numerator * right.denominator + right.numerator * left.denominator,
      left.denominator * right.denominator,
    );
  }

  function parseSymmetryComponent(component) {
    const compact = component.replace(/\s+/g, "").toLowerCase();
    if (!compact) throw new Error("CIF symmetry operation contains an empty component.");
    const rotation = [rational(0), rational(0), rational(0)];
    let translation = rational(0);
    const terms = (/^[+-]/.test(compact) ? compact : `+${compact}`).match(/[+-][^+-]+/g) || [];
    for (const signedTerm of terms) {
      const sign = signedTerm[0] === "-" ? -1 : 1;
      const term = signedTerm.slice(1);
      const axis = ["x", "y", "z"].indexOf(term);
      if (axis >= 0) {
        rotation[axis] = addRational(rotation[axis], rational(sign));
        continue;
      }
      const match = /^(\d+)(?:\/(\d+))?$/.exec(term);
      if (!match) throw new Error(`Unsupported CIF symmetry term '${term}'.`);
      translation = addRational(translation, rational(sign * Number(match[1]), Number(match[2] || 1)));
    }
    return { rotation, translation };
  }

  function parseSymmetry(expression) {
    return symmetry.parseSymmetryExpression(expression);
  }

  function inverse3(matrix) {
    const [a, b, c, d, e, f, g, h, i] = matrix;
    const A = e * i - f * h; const B = f * g - d * i; const C = d * h - e * g;
    const determinant = a * A + b * B + c * C;
    if (!Number.isFinite(determinant) || Math.abs(determinant) < 1e-12) throw new Error("CIF unit cell matrix is singular.");
    return [A, c * h - b * i, b * f - c * e, B, a * i - c * g, c * d - a * f, C, b * g - a * h, a * e - b * d]
      .map((entry) => entry / determinant);
  }

  function matrix4(matrix) {
    return [matrix[0], matrix[1], matrix[2], 0, matrix[3], matrix[4], matrix[5], 0, matrix[6], matrix[7], matrix[8], 0, 0, 0, 0, 1];
  }

  function createCell(block, required = true) {
    const cellFields = [
      values(block, ["cell_length_a", "cell.length_a"]), values(block, ["cell_length_b", "cell.length_b"]), values(block, ["cell_length_c", "cell.length_c"]),
      values(block, ["cell_angle_alpha", "cell.angle_alpha"]), values(block, ["cell_angle_beta", "cell.angle_beta"]), values(block, ["cell_angle_gamma", "cell.angle_gamma"]),
    ];
    const present = cellFields.map((field) => textAt(field) !== undefined);
    if (!present.some(Boolean) && !required) return null;
    if (!present.every(Boolean)) throw new Error("CIF unit-cell lengths and angles must be supplied together.");
    const [a, b, c, alphaDeg, betaDeg, gammaDeg] = cellFields.map((field) => numberAt(field));
    if (![a, b, c, alphaDeg, betaDeg, gammaDeg].every(Number.isFinite) || a <= 0 || b <= 0 || c <= 0) {
      throw new Error("CIF unit-cell lengths and angles are required and must be valid.");
    }
    const radians = Math.PI / 180;
    const ca = Math.cos(alphaDeg * radians); const cb = Math.cos(betaDeg * radians); const cg = Math.cos(gammaDeg * radians);
    const sg = Math.sin(gammaDeg * radians);
    const volumeFactor = Math.sqrt(Math.max(0, 1 - ca * ca - cb * cb - cg * cg + 2 * ca * cb * cg));
    if (Math.abs(sg) < 1e-12 || volumeFactor <= 0) throw new Error("CIF unit-cell angles form an invalid cell.");
    const fracToCart3 = [a, b * cg, c * cb, 0, b * sg, c * (ca - cb * cg) / sg, 0, 0, c * volumeFactor / sg];
    return { a, b, c, alphaDeg, betaDeg, gammaDeg, volume: a * b * c * volumeFactor, fracToCart: matrix4(fracToCart3), cartToFrac: matrix4(inverse3(fracToCart3)) };
  }

  function fractionalToCartesian(cell, fractional) {
    const matrix = cell.fracToCart;
    return [0, 1, 2].map((row) => matrix[row * 4] * fractional[0] + matrix[row * 4 + 1] * fractional[1] + matrix[row * 4 + 2] * fractional[2]);
  }

  function isMmCif(block) {
    return Boolean(block.categories.atom_site
      && values(block, ["atom_site.Cartn_x"])
      && (values(block, ["atom_site.label_comp_id"]) || values(block, ["atom_site.group_PDB"])));
  }

  function projectCrystalMetadata(block) {
    const extra = { dataBlock: metadataText([block.header]) || "data_1" };
    const auditCreationMethod = metadataText(values(block, ["audit_creation_method", "audit.creation_method"]));
    const auditBlockDoi = metadataText(values(block, ["audit_block_DOI", "audit.block_doi"]));
    const databaseCod = metadataText(values(block, ["database_code_COD", "database_code.cod"]));
    const databaseIcsd = metadataText(values(block, ["database_code_ICSD", "database_code.icsd"]));
    if (auditCreationMethod) extra.auditCreationMethod = auditCreationMethod;
    if (auditBlockDoi) extra.auditBlockDoi = auditBlockDoi;
    if (databaseCod) extra.databaseCod = databaseCod;
    if (databaseIcsd) extra.databaseIcsd = databaseIcsd;
    const formula = metadataText(values(block, ["chemical_formula_sum", "chemical_formula.sum"]));
    const z = numberAt(values(block, ["cell_formula_units_Z", "cell.formula_units_z", "cell.Z_PDB"]), 0, undefined);
    const zPrime = numberAt(values(block, ["cell_formula_units_Z_prime", "cell.formula_units_z_prime"]), 0, undefined);
    const temperatureK = numberAt(values(block, ["diffrn_ambient_temperature", "diffrn.ambient_temp"]), 0, undefined);
    const ccdcNumber = metadataText(values(block, ["database_code_depnum_CCDC_archive", "database_code.depnum_ccdc_archive", "database_code_depnum_CCDC_fiz", "database_code.depnum_ccdc_fiz"]));
    const r1 = numberAt(values(block, ["refine_ls_R_factor_gt", "refine.ls_R_factor_gt"]), 0, undefined);
    const wr2 = numberAt(values(block, ["refine_ls_wR_factor_ref", "refine.ls_wR_factor_ref"]), 0, undefined);
    const goodnessOfFit = numberAt(values(block, ["refine_ls_goodness_of_fit_ref", "refine.ls_goodness_of_fit_ref"]), 0, undefined);
    const flackParameter = numberAt(values(block, ["refine_ls_abs_structure_Flack", "refine.ls_abs_structure_Flack"]), 0, undefined);
    return {
      ...(formula ? { formula } : {}),
      ...(z !== undefined ? { z } : {}),
      ...(zPrime !== undefined ? { zPrime } : {}),
      ...(temperatureK !== undefined ? { temperatureK } : {}),
      ...(ccdcNumber ? { ccdcNumber } : {}),
      ...(r1 !== undefined ? { r1 } : {}),
      ...(wr2 !== undefined ? { wr2 } : {}),
      ...(goodnessOfFit !== undefined ? { goodnessOfFit } : {}),
      ...(flackParameter !== undefined ? { flackParameter } : {}),
      extra,
    };
  }

  function bondOrder(text) {
    if (text === undefined) return 1;
    const normalized = String(text).trim().toLowerCase();
    if (/^(?:sing|single)$/.test(normalized)) return 1;
    if (/^(?:doub|double)$/.test(normalized)) return 2;
    if (/^(?:trip|triple)$/.test(normalized)) return 3;
    const numeric = Number(normalized);
    if (!Number.isFinite(numeric) || numeric <= 0) throw new Error(`CIF bond order '${text}' is invalid.`);
    return numeric;
  }

  function resolveSymmetry(block, cell) {
    if (!cell) return undefined;
    const operationValues = values(block, ["space_group_symop_operation_xyz", "space_group_symop.operation_xyz", "symmetry_equiv_pos_as_xyz"]);
    const operationIds = values(block, ["space_group_symop_id", "space_group_symop.id", "symmetry_equiv_pos_site_id"]);
    const hm = metadataText(values(block, ["space_group_name_H-M_alt", "space_group.name_H-M_alt", "symmetry_space_group_name_H-M"]));
    const number = numberAt(values(block, ["space_group_IT_number", "space_group.IT_number", "symmetry_Int_Tables_number"]), 0, undefined);
    if (!operationValues?.length) {
      if (number === 1 || /^p\s*1$/i.test(hm || "")) {
        const identity = parseSymmetry("x,y,z");
        return { operations: [identity], declaredOperations: new Map([["1", identity]]) };
      }
      throw new Error("CIF symmetry operations are missing or unknown for the declared crystal.");
    }
    const unique = new Map();
    const declaredOperations = new Map();
    operationValues.forEach((_, row) => {
      const expression = textAt(operationValues, row);
      if (!expression) throw new Error(`CIF symmetry operation row ${row + 1} is missing or unknown.`);
      const operation = parseSymmetry(expression);
      const declaredId = textAt(operationIds, row) || String(row + 1);
      if (declaredOperations.has(declaredId)) throw new Error(`CIF symmetry operation ID '${declaredId}' is duplicated.`);
      declaredOperations.set(declaredId, operation);
      if (!unique.has(operation.canonicalExpression)) unique.set(operation.canonicalExpression, operation);
    });
    return { operations: symmetry.sortSymmetryOperations([...unique.values()]), declaredOperations };
  }

  function bondImage(field, row, declaredOperations) {
    const code = textAt(field, row);
    if (!code) return undefined;
    const match = /^(\d+)_([0-9])([0-9])([0-9])$/.exec(code);
    if (!match) throw new Error(`CIF bond symmetry code '${code}' is invalid.`);
    const operation = declaredOperations?.get?.(match[1]);
    if (!operation) throw new Error(`CIF bond symmetry operation '${match[1]}' is unknown.`);
    return {
      symmetryOperationId: operation.operationId,
      cellTranslation: [Number(match[2]) - 5, Number(match[3]) - 5, Number(match[4]) - 5],
    };
  }

  async function project(document, text, input, options = {}) {
    const block = document.blocks[0];
    const mmcif = isMmCif(block);
    const labels = values(block, mmcif ? ["atom_site.label_atom_id", "atom_site.id"] : ["atom_site_label"]);
    const elements = values(block, mmcif ? ["atom_site.type_symbol"] : ["atom_site_type_symbol"]);
    const fractionalFields = [
      values(block, mmcif ? ["atom_site.fract_x"] : ["atom_site_fract_x"]),
      values(block, mmcif ? ["atom_site.fract_y"] : ["atom_site_fract_y"]),
      values(block, mmcif ? ["atom_site.fract_z"] : ["atom_site_fract_z"]),
    ];
    const cartesianFields = [values(block, ["atom_site.Cartn_x"]), values(block, ["atom_site.Cartn_y"]), values(block, ["atom_site.Cartn_z"])];
    const hasFractional = fractionalFields.every(Boolean);
    const hasCartesian = cartesianFields.every(Boolean);
    const coordinateFields = hasFractional ? fractionalFields : hasCartesian ? cartesianFields : null;
    if (!labels || !elements || !coordinateFields || labels.length !== elements.length) {
      throw new Error("CIF atom-site labels, elements, and complete coordinates are required.");
    }
    const occupancy = values(block, mmcif ? ["atom_site.occupancy"] : ["atom_site_occupancy"]);
    const assembly = values(block, ["atom_site_disorder_assembly", "atom_site.disorder_assembly"]);
    const disorderGroup = values(block, ["atom_site_disorder_group", "atom_site.disorder_group"]);
    const residueNames = values(block, ["atom_site.label_comp_id"]);
    const chains = values(block, ["atom_site.label_asym_id"]);
    const sequence = values(block, ["atom_site.label_seq_id"]);
    const modelNumbers = values(block, ["atom_site.pdbx_PDB_model_num"]);
    const alternateLocations = values(block, ["atom_site.label_alt_id"]);
    const cell = createCell(block, !mmcif || hasFractional);
    const symmetryResolution = resolveSymmetry(block, cell);
    const now = options.now || (() => Date.now());
    const yieldControl = options.yieldControl || (() => new Promise((resolve) => setTimeout(resolve, 0)));
    let sliceStart = now();
    async function cooperate() {
      checkAborted(options.signal);
      if (now() - sliceStart >= LIMITS.mainThreadSliceMs) { await yieldControl(); checkAborted(options.signal); sliceStart = now(); }
    }
    const modelKeys = [];
    const rowsByModel = new Map();
    for (let row = 0; row < labels.length; row += 1) {
      await cooperate();
      const rawModelNumber = mmcif ? (textAt(modelNumbers, row) || "1") : "1";
      if (!/^\d+$/.test(rawModelNumber) || Number(rawModelNumber) < 1) throw new Error(`mmCIF atom-site row ${row + 1} has an invalid model number.`);
      const key = String(Number(rawModelNumber));
      if (!rowsByModel.has(key)) { modelKeys.push(key); rowsByModel.set(key, []); }
      rowsByModel.get(key).push(row);
    }
    const models = [];
    for (let modelIndex = 0; modelIndex < modelKeys.length; modelIndex += 1) {
      const modelKey = modelKeys[modelIndex];
      const residues = new Map();
      const atomSites = [];
      for (const row of rowsByModel.get(modelKey)) {
      await cooperate();
      const siteId = `site:${modelIndex}:${row}`;
      const siteOccupancy = numberAt(occupancy, row, 1);
      if (!Number.isFinite(siteOccupancy) || siteOccupancy < 0 || siteOccupancy > 1) {
        throw new Error(`CIF atom-site row ${row + 1} occupancy must be between 0 and 1.`);
      }
      const site = {
        siteId,
        label: textAt(labels, row) || `Atom ${row + 1}`,
        element: textAt(elements, row),
        occupancy: siteOccupancy,
        sourceRow: row,
        properties: {},
      };
      const coordinates = coordinateFields.map((fieldValues) => numberAt(fieldValues, row));
      if (!coordinates.every(Number.isFinite)) throw new Error(`CIF atom-site row ${row + 1} has invalid coordinates.`);
      if (hasFractional) site.fractional = { frac: coordinates };
      else site.cartesian = { cart: coordinates };
      if (hasFractional && hasCartesian) {
        const cartesian = cartesianFields.map((fieldValues) => numberAt(fieldValues, row));
        const projected = fractionalToCartesian(cell, coordinates);
        if (projected.some((value, index) => Math.abs(value - cartesian[index]) > 1e-3)) {
          throw new Error(`CIF atom-site row ${row + 1} fractional and Cartesian coordinates are inconsistent.`);
        }
        site.cartesian = { cart: cartesian };
      }
      const disorderAssembly = textAt(assembly, row); const group = textAt(disorderGroup, row);
      if (disorderAssembly) site.disorderAssembly = disorderAssembly;
      if (group) site.disorderGroup = group;
      const altLocation = textAt(alternateLocations, row);
      if (altLocation) site.altLocation = altLocation;
      if (mmcif) {
        const chainId = textAt(chains, row) || "_";
        const sequenceNumber = textAt(sequence, row) || "_";
        const residueId = `res:${modelIndex}:${chainId}:${sequenceNumber}`;
        site.residueId = residueId; site.chainId = chainId;
        if (!residues.has(residueId)) residues.set(residueId, { residueId, name: textAt(residueNames, row) || "UNK", atomSiteIds: [], chainId, sequenceNumber });
        residues.get(residueId).atomSiteIds.push(siteId);
      }
      atomSites.push(site);
      }
      const labelToSite = new Map(atomSites.map((site) => [site.label, site.siteId]));
      const bondBegin = values(block, ["geom_bond_atom_site_label_1", "geom_bond.atom_site_label_1", "geom_bond_atom_site_id_1"]);
      const bondEnd = values(block, ["geom_bond_atom_site_label_2", "geom_bond.atom_site_label_2", "geom_bond_atom_site_id_2"]);
      const bondOrders = values(block, ["geom_bond_valence", "geom_bond.valence", "geom_bond_value_order", "geom_bond.value_order"]);
      const bondBeginSymmetry = values(block, ["geom_bond_site_symmetry_1", "geom_bond.site_symmetry_1"]);
      const bondEndSymmetry = values(block, ["geom_bond_site_symmetry_2", "geom_bond.site_symmetry_2"]);
      const bonds = [];
      if (bondBegin || bondEnd) {
        if (!bondBegin || !bondEnd || bondBegin.length !== bondEnd.length) throw new Error("CIF geometry bond endpoints are incomplete.");
        for (let row = 0; row < bondBegin.length; row += 1) {
          const beginLabel = textAt(bondBegin, row); const endLabel = textAt(bondEnd, row);
          const beginSiteId = labelToSite.get(beginLabel); const endSiteId = labelToSite.get(endLabel);
          if (!beginSiteId || !endSiteId) throw new Error(`CIF geometry bond row ${row + 1} references an unknown atom-site label.`);
          const beginImage = bondImage(bondBeginSymmetry, row, symmetryResolution?.declaredOperations || []);
          const endImage = bondImage(bondEndSymmetry, row, symmetryResolution?.declaredOperations || []);
          bonds.push({
            bondId: `bond:${modelIndex}:${bonds.length}`, beginSiteId, endSiteId,
            order: bondOrder(textAt(bondOrders, row)), provenance: "dictionary",
            ...(beginImage ? { beginImage } : {}), ...(endImage ? { endImage } : {}),
          });
        }
      }
      models.push({
        modelId: `model:${modelIndex}`,
        label: mmcif ? `Model ${modelKey}` : (block.header || "Model 1"),
        atomSites,
        bonds,
        ...(mmcif ? { residues: Array.from(residues.values()) } : {}),
      });
    }
    const symmetryOperations = symmetryResolution?.operations;
    const crystalMetadata = projectCrystalMetadata(block);
    const auditCreationMethod = crystalMetadata.extra.auditCreationMethod;
    const warnings = document.blocks.length > 1 ? [{ code: "additional-data-blocks", message: `${document.blocks.length - 1} additional CIF data block(s) were not projected.` }] : [];
    return {
      content: {
        schema: "rt-parsed-structure/1",
        displayName: String(input.displayName || input.name || block.header || "CIF structure"),
        structureType: mmcif ? "macromolecule" : "crystal",
        source: { format: mmcif ? "mmcif" : "cif", originalFilename: input.displayName || input.name, byteLength: byteLength(text), canonicalFormat: "rt-structure-json/1" },
        models,
        ...(cell ? { crystal: {
          cell,
          spaceGroup: {
            ...(metadataText(values(block, ["space_group_name_H-M_alt", "space_group.name_H-M_alt", "symmetry_space_group_name_H-M"])) ? { hm: metadataText(values(block, ["space_group_name_H-M_alt", "space_group.name_H-M_alt", "symmetry_space_group_name_H-M"])) } : {}),
            ...(metadataText(values(block, ["space_group_name_Hall", "space_group.name_Hall", "symmetry_space_group_name_Hall"])) ? { hall: metadataText(values(block, ["space_group_name_Hall", "space_group.name_Hall", "symmetry_space_group_name_Hall"])) } : {}),
            ...(numberAt(values(block, ["space_group_IT_number", "space_group.IT_number", "symmetry_Int_Tables_number"]), 0, undefined) !== undefined ? { number: numberAt(values(block, ["space_group_IT_number", "space_group.IT_number", "symmetry_Int_Tables_number"]), 0, undefined) } : {}),
          },
          symmetryOperations,
          metadata: crystalMetadata,
        } } : {}),
        metadata: { dataBlock: block.header, ...(auditCreationMethod ? { auditCreationMethod } : {}) },
        warnings,
      },
      diagnostics: [],
    };
  }

  async function parse(input, options = {}) {
    if (typeof input?.text !== "string") throw new TypeError("CIF input text is required.");
    const signal = input.signal || options.signal;
    const document = await parseCifDocument(input.text, { ...options, signal, backend: options.backend });
    checkAborted(signal);
    return project(document, input.text, input, { ...options, signal });
  }

  const CifParserAdapter = Object.freeze({
    id: "cif-parser",
    formats: Object.freeze(["cif", "mmcif"]),
    probe(input) {
      const text = String(input?.text || "");
      const name = String(input?.name || input?.displayName || "").toLowerCase();
      const supported = /\.(?:cif|mmcif)$/.test(name) || /^\s*data_/im.test(text);
      return { supported, confidence: supported ? 0.9 : 0, detectedFormat: supported ? "cif" : undefined, reason: supported ? "cif-data-block" : "not-cif" };
    },
    parse,
  });

  return { CifParserAdapter, parseCifDocument };
});
;
/* web/structure-viewer/core/structure-factory.js */
(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? { ...require("./canonical-json.js"), ...require("./validators.js") }
    : root.StructureViewerCore;
  const api = factory(root, dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerCore = Object.assign(root.StructureViewerCore || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (root, dependencies) {
  "use strict";

  const { computeContentIdentity, validateParsedStructureContent, validateSourceStructure, StructureViewerError } = dependencies;

  function cloneValue(value) {
    if (Array.isArray(value)) return value.map(cloneValue);
    if (value && typeof value === "object") {
      const copy = {};
      Object.keys(value).forEach((key) => { copy[key] = cloneValue(value[key]); });
      return copy;
    }
    return value;
  }

  function deepFreeze(value, seen = new WeakSet()) {
    if (!value || typeof value !== "object" || seen.has(value)) return value;
    seen.add(value);
    Object.values(value).forEach((entry) => deepFreeze(entry, seen));
    return Object.freeze(value);
  }

  function normalizeParsedContent(parsed) {
    const normalized = {
      schema: "rt-parsed-structure/1",
      displayName: parsed.displayName,
      structureType: parsed.structureType,
      source: cloneValue(parsed.source),
      models: parsed.models.map((model) => ({
        ...cloneValue(model),
        bonds: cloneValue(model.bonds).sort((left, right) => left.bondId.localeCompare(right.bondId)),
      })),
      metadata: cloneValue(parsed.metadata),
      warnings: cloneValue(parsed.warnings),
    };
    if (parsed.crystal !== undefined) {
      normalized.crystal = cloneValue(parsed.crystal);
      normalized.crystal.symmetryOperations.sort((left, right) => left.canonicalExpression.localeCompare(right.canonicalExpression));
    }
    return normalized;
  }

  function defaultUuid() {
    if (root?.crypto?.randomUUID) return root.crypto.randomUUID();
    if (typeof require === "function") return require("crypto").randomUUID();
    throw new Error("A UUID generator is required in this environment.");
  }

  async function createSourceStructure(parsed, { uuid = defaultUuid } = {}) {
    validateParsedStructureContent(parsed);
    const normalized = normalizeParsedContent(parsed);
    const structureId = uuid();
    if (typeof structureId !== "string" || !structureId) throw new StructureViewerError("invalid-runtime-id", "$.structureId");
    const contentIdentity = await computeContentIdentity(normalized);
    const source = {
      ...normalized,
      schema: "rt-source-structure/1",
      structureId,
      contentIdentity,
    };
    validateSourceStructure(source);
    return deepFreeze(source);
  }

  class SourceRegistry {
    constructor() {
      this._entries = new Map();
      this._removedIds = new Set();
    }

    add(source) {
      validateSourceStructure(source);
      if (this._removedIds.has(source.structureId)) throw new StructureViewerError("runtime-id-reused", "$.structureId", { message: "A removed structure cannot be re-added with the same runtime identity." });
      if (this._entries.has(source.structureId)) throw new StructureViewerError("duplicate-runtime-id", "$.structureId");
      this._entries.set(source.structureId, { source, references: 0 });
      return source;
    }

    get(structureId) {
      return this._entries.get(structureId)?.source || null;
    }

    retain(structureId) {
      const entry = this._require(structureId);
      entry.references += 1;
      return entry.references;
    }

    release(structureId) {
      const entry = this._require(structureId);
      if (entry.references === 0) throw new StructureViewerError("reference-underflow", "$.structureId", { structureId });
      entry.references -= 1;
      return entry.references;
    }

    referenceCount(structureId) {
      return this._entries.get(structureId)?.references || 0;
    }

    remove(structureId) {
      const entry = this._entries.get(structureId);
      if (!entry) return false;
      if (entry.references > 0) throw new StructureViewerError("structure-in-use", "$.structureId", { structureId, references: entry.references });
      this._entries.delete(structureId);
      this._removedIds.add(structureId);
      return true;
    }

    _require(structureId) {
      const entry = this._entries.get(structureId);
      if (!entry) throw new StructureViewerError("unknown-structure", "$.structureId", { structureId });
      return entry;
    }
  }

  return { createSourceStructure, SourceRegistry };
});
;
/* web/structure-viewer/core/atom-identity.js */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerCore = Object.assign(root.StructureViewerCore || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function requiredString(value, field) {
    if (typeof value !== "string" || !value) throw new TypeError(`${field} must be a non-empty string.`);
    return value;
  }

  function makeAtomIdentity(value) {
    if (!value || typeof value !== "object") throw new TypeError("AtomIdentity must be an object.");
    const identity = {
      sourceStructureId: requiredString(value.sourceStructureId, "sourceStructureId"),
      modelId: requiredString(value.modelId, "modelId"),
      siteId: requiredString(value.siteId, "siteId"),
    };
    if (value.periodicImage !== undefined) {
      const image = value.periodicImage;
      const translation = image?.cellTranslation;
      if (!Array.isArray(translation) || translation.length !== 3 || !translation.every(Number.isSafeInteger)) {
        throw new TypeError("periodicImage.cellTranslation must contain three safe integers.");
      }
      identity.periodicImage = Object.freeze({
        symmetryOperationId: requiredString(image.symmetryOperationId, "periodicImage.symmetryOperationId"),
        cellTranslation: Object.freeze([...translation]),
      });
    }
    if (value.disorderKey !== undefined) identity.disorderKey = requiredString(value.disorderKey, "disorderKey");
    return Object.freeze(identity);
  }

  function identityTuple(value) {
    const identity = makeAtomIdentity(value);
    const image = identity.periodicImage;
    return [
      identity.sourceStructureId,
      identity.modelId,
      identity.siteId,
      image?.symmetryOperationId ?? null,
      image?.cellTranslation[0] ?? null,
      image?.cellTranslation[1] ?? null,
      image?.cellTranslation[2] ?? null,
      identity.disorderKey ?? null,
    ];
  }

  function serializeAtomIdentity(value) {
    return JSON.stringify(identityTuple(value));
  }

  function compareTupleValue(left, right) {
    if (left === right) return 0;
    if (left === null) return -1;
    if (right === null) return 1;
    return left < right ? -1 : 1;
  }

  function compareAtomIdentity(left, right) {
    const a = identityTuple(left);
    const b = identityTuple(right);
    for (let index = 0; index < a.length; index += 1) {
      const comparison = compareTupleValue(a[index], b[index]);
      if (comparison) return comparison;
    }
    return 0;
  }

  function resolveIdentity(scene, identity) {
    if (!scene || !Array.isArray(scene.atoms)) throw new TypeError("RenderScene.atoms must be an array.");
    const key = serializeAtomIdentity(identity);
    return scene.atoms.find((atom) => atom?.identity && serializeAtomIdentity(atom.identity) === key) || null;
  }

  return { makeAtomIdentity, serializeAtomIdentity, compareAtomIdentity, resolveIdentity };
});
;
/* web/structure-viewer/core/scene-definition.js */
(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? { ...require("./canonical-json.js"), ...require("./constants.js") }
    : root.StructureViewerCore;
  const api = factory(dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerCore = Object.assign(root.StructureViewerCore || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (dependencies) {
  "use strict";

  const MODES = new Set(["molecular", "crystal", "macromolecular"]);
  const CRYSTAL_CONTENT = new Set(["asymmetric-unit", "unit-cell", "symmetry-mates", "packing", "supercell"]);
  const DISORDER_MODES = new Set(["all", "highest-occupancy", "group"]);
  const HYDROGEN_FILTERS = new Set(["all", "hide", "polar-only"]);

  function requiredString(value, path) {
    if (typeof value !== "string" || !value.trim()) throw new TypeError(`${path} must be a non-empty string.`);
    return value.trim();
  }

  function optionalString(value, path) {
    return value === undefined ? undefined : requiredString(value, path);
  }

  function normalizedRange(value, path) {
    const range = value === undefined ? [0, 0] : value;
    if (!Array.isArray(range) || range.length !== 2 || !range.every(Number.isSafeInteger)) {
      throw new TypeError(`${path} must contain two safe integers.`);
    }
    const sorted = range[0] <= range[1] ? [...range] : [range[1], range[0]];
    if (sorted[0] < dependencies.LIMITS.replicationAxisMin || sorted[1] > dependencies.LIMITS.replicationAxisMax) {
      throw new RangeError(`${path} must stay within ${dependencies.LIMITS.replicationAxisMin}..${dependencies.LIMITS.replicationAxisMax}.`);
    }
    return Object.freeze(sorted);
  }

  function normalizeMolecular(settings = {}) {
    const normalized = {};
    if (settings.hydrogenFilter !== undefined) {
      if (!HYDROGEN_FILTERS.has(settings.hydrogenFilter)) throw new TypeError("molecular.hydrogenFilter is invalid.");
      normalized.hydrogenFilter = settings.hydrogenFilter;
    }
    return Object.freeze(normalized);
  }

  function normalizeCrystal(settings = {}) {
    const content = settings.content ?? "asymmetric-unit";
    const disorderMode = settings.disorderMode ?? "all";
    const minimumOccupancy = settings.minimumOccupancy ?? 0;
    if (!CRYSTAL_CONTENT.has(content)) throw new TypeError("crystal.content is invalid.");
    if (!DISORDER_MODES.has(disorderMode)) throw new TypeError("crystal.disorderMode is invalid.");
    if (!Number.isFinite(minimumOccupancy) || minimumOccupancy < 0 || minimumOccupancy > 1) {
      throw new RangeError("crystal.minimumOccupancy must be between 0 and 1.");
    }
    const replication = Object.freeze({
      a: normalizedRange(settings.replication?.a, "crystal.replication.a"),
      b: normalizedRange(settings.replication?.b, "crystal.replication.b"),
      c: normalizedRange(settings.replication?.c, "crystal.replication.c"),
    });
    const normalized = {
      content,
      replication,
      wrapFractionalCoordinates: settings.wrapFractionalCoordinates === true,
      disorderMode,
      minimumOccupancy,
    };
    if (settings.packingRadiusAngstrom !== undefined && content !== "packing") {
      throw new TypeError("crystal.packingRadiusAngstrom is valid only for packing content.");
    }
    if (content === "packing") {
      const packingRadiusAngstrom = settings.packingRadiusAngstrom ?? 8;
      if (!Number.isFinite(packingRadiusAngstrom) || packingRadiusAngstrom < 3 || packingRadiusAngstrom > 30) {
        throw new RangeError("crystal.packingRadiusAngstrom must be between 3 and 30 Angstrom.");
      }
      normalized.packingRadiusAngstrom = packingRadiusAngstrom;
    }
    if (disorderMode === "group") {
      const disorderAssembly = optionalString(settings.disorderAssembly, "crystal.disorderAssembly");
      const disorderGroup = optionalString(settings.disorderGroup, "crystal.disorderGroup");
      if (disorderAssembly !== undefined) normalized.disorderAssembly = disorderAssembly;
      if (disorderGroup !== undefined) normalized.disorderGroup = disorderGroup;
    }
    return Object.freeze(normalized);
  }

  function normalizeSceneDefinition(input) {
    if (!input || typeof input !== "object") throw new TypeError("SceneDefinition must be an object.");
    const mode = input.mode ?? "molecular";
    if (!MODES.has(mode)) throw new TypeError("mode is invalid.");
    const normalized = {
      schema: "rt-scene-definition/1",
      modelId: requiredString(input.modelId, "modelId"),
      mode,
    };
    if (mode === "crystal") normalized.crystal = normalizeCrystal(input.crystal);
    else normalized.molecular = normalizeMolecular(input.molecular);
    return Object.freeze(normalized);
  }

  function sceneCacheKey(source, definition) {
    if (!source || typeof source.structureId !== "string" || typeof source.contentIdentity !== "string") {
      throw new TypeError("Scene cache keys require source structureId and contentIdentity.");
    }
    const normalized = normalizeSceneDefinition(definition);
    const { schema: _schema, ...parameters } = normalized;
    return dependencies.canonicalizeRfc8785({
      contentIdentity: source.contentIdentity,
      definition: parameters,
    });
  }

  return { normalizeSceneDefinition, sceneCacheKey };
});
;
/* web/structure-viewer/core/scene-builder.js */
(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? { ...require("./constants.js"), ...require("./validators.js"), ...require("./atom-identity.js") }
    : root.StructureViewerCore;
  const api = factory(dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerCore = Object.assign(root.StructureViewerCore || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (dependencies) {
  "use strict";

  const { LIMITS, COVALENT_RADII_ANGSTROM, TRANSITION_METALS, StructureViewerError, makeAtomIdentity, validateRenderScene } = dependencies;

  function deepFreeze(value, seen = new WeakSet()) {
    if (!value || typeof value !== "object" || seen.has(value)) return value;
    seen.add(value);
    Object.values(value).forEach((entry) => deepFreeze(entry, seen));
    return Object.freeze(value);
  }

  function abortError() {
    const error = new Error("Molecular scene generation was cancelled.");
    error.name = "AbortError";
    return error;
  }

  function throwIfAborted(signal) {
    if (signal?.aborted) throw abortError();
  }

  function pairKey(beginSiteId, endSiteId) {
    return beginSiteId < endSiteId ? `${beginSiteId}\u0000${endSiteId}` : `${endSiteId}\u0000${beginSiteId}`;
  }

  function normalizeBond(candidate, provenance, siteIds, path) {
    const beginSiteId = candidate?.beginSiteId;
    const endSiteId = candidate?.endSiteId;
    if (!siteIds.has(beginSiteId)) throw new StructureViewerError("invalid-endpoint", `${path}.beginSiteId`, { id: beginSiteId });
    if (!siteIds.has(endSiteId)) throw new StructureViewerError("invalid-endpoint", `${path}.endSiteId`, { id: endSiteId });
    if (beginSiteId === endSiteId) throw new StructureViewerError("invalid-endpoint", path, { message: "A bond cannot connect a site to itself." });
    if (!Number.isFinite(candidate.order) || candidate.order <= 0) {
      throw new StructureViewerError("invalid-bond-order", `${path}.order`, { value: candidate.order });
    }
    const ordered = beginSiteId < endSiteId ? [beginSiteId, endSiteId] : [endSiteId, beginSiteId];
    return {
      beginSiteId: ordered[0],
      endSiteId: ordered[1],
      order: candidate.order,
      aromatic: candidate.aromatic === true,
      provenance,
    };
  }

  function graphSignature(bonds) {
    return bonds.map((bond) => `${pairKey(bond.beginSiteId, bond.endSiteId)}\u0000${bond.order}\u0000${bond.aromatic === true ? 1 : 0}`).sort();
  }

  function sameGraph(left, right) {
    const a = graphSignature(left);
    const b = graphSignature(right);
    return a.length === b.length && a.every((entry, index) => entry === b[index]);
  }

  function addBond(map, bond, path) {
    const key = pairKey(bond.beginSiteId, bond.endSiteId);
    const existing = map.get(key);
    if (!existing) {
      map.set(key, bond);
      return;
    }
    if (existing.provenance === bond.provenance && (existing.order !== bond.order || existing.aromatic !== bond.aromatic)) {
      throw new StructureViewerError("conflicting-bond-graph", path, { pair: key });
    }
  }

  function cellKey(position, cellSize) {
    return position.map((value) => Math.floor(value / cellSize)).join(",");
  }

  function distance(left, right) {
    return Math.hypot(left[0] - right[0], left[1] - right[1], left[2] - right[2]);
  }

  function shouldInfer(left, right) {
    if (left.element === "H" && right.element === "H") return false;
    if (TRANSITION_METALS.has(left.element) || TRANSITION_METALS.has(right.element)) return false;
    const leftRadius = COVALENT_RADII_ANGSTROM[left.element];
    const rightRadius = COVALENT_RADII_ANGSTROM[right.element];
    if (!Number.isFinite(leftRadius) || !Number.isFinite(rightRadius)) return false;
    const separation = distance(left.position, right.position);
    return separation >= 0.40 && separation <= 1.20 * (leftRadius + rightRadius);
  }

  async function buildMolecularScene(source, definition, options = {}) {
    throwIfAborted(options.signal);
    const now = options.now || (() => Date.now());
    const yieldControl = options.yieldControl || (() => new Promise((resolve) => setTimeout(resolve, 0)));
    const metrics = options.metrics;
    const startedAt = now();
    if (metrics) Object.assign(metrics, { buildMs: 0, yields: 0, maxSliceMs: 0 });
    if (!source || source.schema !== "rt-source-structure/1") throw new TypeError("A validated SourceStructure is required.");
    if (!definition || !["molecular", "macromolecular"].includes(definition.mode)) {
      throw new TypeError("A molecular or macromolecular SceneDefinition is required.");
    }
    const model = source.models.find((candidate) => candidate.modelId === definition.modelId);
    if (!model) throw new StructureViewerError("unknown-model", "$.modelId", { modelId: definition.modelId });

    const siteById = new Map(model.atomSites.map((site) => [site.siteId, site]));
    const siteIds = new Set(siteById.keys());
    const sourceBonds = model.bonds.map((candidate, index) => normalizeBond(candidate, candidate.provenance === "dictionary" ? "dictionary" : "source", siteIds, `$.models[0].bonds[${index}]`));
    const toolkitBonds = (options.toolkitBonds || []).map((candidate, index) => normalizeBond(candidate, "source", siteIds, `$.toolkitBonds[${index}]`));
    const dictionaryBonds = (options.dictionaryBonds || []).map((candidate, index) => normalizeBond(candidate, "dictionary", siteIds, `$.dictionaryBonds[${index}]`));
    const hasAuthoritativeGraph = source.metadata?.bondGraphPolicy === "authoritative";

    if (sourceBonds.length && toolkitBonds.length && !sameGraph(sourceBonds, toolkitBonds)) {
      throw new StructureViewerError("conflicting-bond-graph", "$.toolkitBonds", { message: "Source and Toolkit bond graphs conflict." });
    }

    const merged = new Map();
    const authoritative = sourceBonds.length ? sourceBonds : toolkitBonds;
    authoritative.forEach((candidate, index) => addBond(merged, candidate, `$.authoritativeBonds[${index}]`));
    dictionaryBonds.forEach((candidate, index) => addBond(merged, candidate, `$.dictionaryBonds[${index}]`));

    const polarSites = new Set();
    merged.forEach((candidate) => {
      const left = siteById.get(candidate.beginSiteId);
      const right = siteById.get(candidate.endSiteId);
      if (left.element === "H" && ["N", "O", "F", "S"].includes(right.element)) polarSites.add(left.siteId);
      if (right.element === "H" && ["N", "O", "F", "S"].includes(left.element)) polarSites.add(right.siteId);
    });
    const hydrogenFilter = definition.molecular?.hydrogenFilter || "all";
    const visibleSites = model.atomSites.filter((site) => site.element !== "H" || hydrogenFilter === "all" || (hydrogenFilter === "polar-only" && polarSites.has(site.siteId)));

    const residueById = new Map((model.residues || []).map((residue) => [residue.residueId, residue]));
    const atoms = visibleSites.map((site) => {
      if (!site.cartesian?.cart) throw new StructureViewerError("missing-cartesian-position", `$.models[0].atomSites.${site.siteId}`);
      const identity = makeAtomIdentity({ sourceStructureId: source.structureId, modelId: model.modelId, siteId: site.siteId });
      const residue = residueById.get(site.residueId);
      return {
        renderAtomId: `atom:${site.siteId}`,
        identity,
        element: site.element,
        position: [...site.cartesian.cart],
        occupancy: site.occupancy,
        sourceSite: site,
        ...(site.chainId !== undefined ? { chainId: site.chainId } : {}),
        ...(site.residueId !== undefined ? { residueId: site.residueId } : {}),
        ...(residue ? {
          residueName: residue.name,
          residueSequenceNumber: residue.sequenceNumber,
          residueInsertionCode: residue.insertionCode,
        } : {}),
        ...(site.label !== undefined ? { atomName: site.label } : {}),
        ...(site.altLocation !== undefined ? { altLocation: site.altLocation } : {}),
        generated: false,
      };
    });
    const visibleIds = new Set(atoms.map((atom) => atom.identity.siteId));

    const maximumRadius = Math.max(...Object.values(COVALENT_RADII_ANGSTROM));
    const cellSize = 2.40 * maximumRadius;
    const bins = new Map();
    atoms.forEach((atom, index) => {
      const key = cellKey(atom.position, cellSize);
      if (!bins.has(key)) bins.set(key, []);
      bins.get(key).push(index);
    });

    let sliceStarted = startedAt;
    options.onProgress?.({ stage: "bonds", completed: 0, total: atoms.length });
    for (let leftIndex = 0; leftIndex < atoms.length; leftIndex += 1) {
      throwIfAborted(options.signal);
      const left = atoms[leftIndex];
      const cell = left.position.map((value) => Math.floor(value / cellSize));
      for (let dx = -1; dx <= 1; dx += 1) for (let dy = -1; dy <= 1; dy += 1) for (let dz = -1; dz <= 1; dz += 1) {
        const candidates = bins.get(`${cell[0] + dx},${cell[1] + dy},${cell[2] + dz}`) || [];
        for (const rightIndex of candidates) {
          if (rightIndex <= leftIndex) continue;
          const right = atoms[rightIndex];
          const key = pairKey(left.identity.siteId, right.identity.siteId);
          if (!hasAuthoritativeGraph && !merged.has(key) && shouldInfer(left, right)) {
            merged.set(key, {
              beginSiteId: left.identity.siteId,
              endSiteId: right.identity.siteId,
              order: 1,
              aromatic: false,
              provenance: "inferred",
            });
          }
        }
      }
      const sliceMs = now() - sliceStarted;
      if (metrics) metrics.maxSliceMs = Math.max(metrics.maxSliceMs, sliceMs);
      if (sliceMs >= LIMITS.mainThreadSliceMs) {
        options.onProgress?.({ stage: "bonds", completed: leftIndex + 1, total: atoms.length });
        await yieldControl();
        if (metrics) metrics.yields += 1;
        throwIfAborted(options.signal);
        sliceStarted = now();
      }
    }
    options.onProgress?.({ stage: "bonds", completed: atoms.length, total: atoms.length });

    const bonds = Array.from(merged.values())
      .filter((candidate) => visibleIds.has(candidate.beginSiteId) && visibleIds.has(candidate.endSiteId))
      .sort((left, right) => pairKey(left.beginSiteId, left.endSiteId).localeCompare(pairKey(right.beginSiteId, right.endSiteId)))
      .map((candidate, index) => ({
        renderBondId: `render-bond:${index}`,
        beginRenderAtomId: `atom:${candidate.beginSiteId}`,
        endRenderAtomId: `atom:${candidate.endSiteId}`,
        order: candidate.order,
        ...(candidate.aromatic ? { aromatic: true } : {}),
        provenance: candidate.provenance,
      }));
    const atomGeneration = {};
    atoms.forEach((atom) => {
      atomGeneration[atom.renderAtomId] = { canonicalIdentity: atom.identity, contributors: [] };
    });
    const chainIds = Array.from(new Set(atoms.map((atom) => atom.chainId).filter((value) => value !== undefined))).sort();
    const backboneNamesByChain = new Map();
    atoms
      .filter((atom) => atom.sourceSite?.properties?.recordType === "ATOM")
      .forEach((atom) => {
        const chainId = atom.chainId || "";
        if (!backboneNamesByChain.has(chainId)) backboneNamesByChain.set(chainId, new Set());
        backboneNamesByChain.get(chainId).add(atom.atomName);
      });
    const scene = {
      schema: "rt-render-scene/1",
      sceneId: `scene:${source.structureId}:${model.modelId}:molecular`,
      sourceStructureId: source.structureId,
      sourceModelId: model.modelId,
      atoms,
      bonds,
      provenance: { atomGeneration },
      macromolecule: {
        chains: chainIds,
        residueIds: Array.from(new Set(atoms.map((atom) => atom.residueId).filter(Boolean))),
        cartoonEligible: Array.from(backboneNamesByChain.values())
          .some((names) => ["N", "CA", "C"].every((name) => names.has(name))),
      },
      warnings: [...source.warnings],
    };
    if (metrics) metrics.buildMs = now() - startedAt;
    validateRenderScene(scene);
    return deepFreeze(scene);
  }

  return { buildMolecularScene };
});
;
/* web/structure-viewer/core/exporters.js */
(function (root, factory) {
  const crystal = typeof module === "object" && module.exports
    ? require("../crystal/unit-cell.js")
    : root.StructureViewerCrystal;
  const api = factory(root, crystal);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerCore = Object.assign(root.StructureViewerCore || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (root, crystal) {
  "use strict";

  function requireModel(source, modelId) {
    if (!source || source.schema !== "rt-source-structure/1") throw new TypeError("A SourceStructure is required.");
    const model = source.models.find((candidate) => candidate.modelId === modelId);
    if (!model) throw new Error(`Unknown model: ${modelId}`);
    return model;
  }

  function coordinate(value) {
    if (!Number.isFinite(value)) throw new TypeError("XYZ coordinates must be finite.");
    return Object.is(value, -0) ? "0" : String(value);
  }

  function sourceModelCoordinateRows(source, modelId) {
    return requireModel(source, modelId).atomSites.map((site) => {
      if (!site.cartesian?.cart || site.cartesian.cart.length !== 3) throw new Error(`Atom site ${site.siteId} has no Cartesian coordinates.`);
      return `${site.element} ${site.cartesian.cart.map(coordinate).join(" ")}`;
    }).join("\n");
  }

  function sourceModelToXyz(source, modelId) {
    const model = requireModel(source, modelId);
    return `${model.atomSites.length}\n${source.displayName} - ${model.label}\n${sourceModelCoordinateRows(source, modelId)}`;
  }

  const CRYSTAL_EXPORT_MODES = new Set(["source-asymmetric-unit", "visible-scene", "selected-component"]);

  function requireCrystalSource(source) {
    if (!source || source.schema !== "rt-source-structure/1" || !source.crystal) throw new TypeError("A crystal SourceStructure is required.");
    return source;
  }

  function requireMatchingScene(source, scene, modelId) {
    if (!scene || scene.schema !== "rt-render-scene/1") throw new TypeError("A RenderScene is required for this crystal export mode.");
    if (scene.sourceStructureId !== source.structureId || scene.sourceModelId !== modelId) throw new Error("RenderScene does not belong to the requested crystal source model.");
    return scene;
  }

  function sourceSitePosition(source, site) {
    if (site.cartesian?.cart?.length === 3) return site.cartesian.cart;
    if (site.fractional?.frac?.length === 3) return crystal.fractionalToCartesian(source.crystal.cell, site.fractional.frac);
    throw new Error(`Atom site ${site.siteId} has no exportable coordinates.`);
  }

  function selectedComponentAtoms(scene, selectedRenderAtomIds) {
    if (!Array.isArray(selectedRenderAtomIds) || selectedRenderAtomIds.length === 0) throw new Error("Select one connected component to export.");
    const atoms = new Map(scene.atoms.map((atom) => [atom.renderAtomId, atom]));
    const neighbors = new Map(scene.atoms.map((atom) => [atom.renderAtomId, new Set()]));
    scene.bonds.forEach((bond) => {
      if (!neighbors.has(bond.beginRenderAtomId) || !neighbors.has(bond.endRenderAtomId)) return;
      neighbors.get(bond.beginRenderAtomId).add(bond.endRenderAtomId);
      neighbors.get(bond.endRenderAtomId).add(bond.beginRenderAtomId);
    });
    const selected = [...new Set(selectedRenderAtomIds)];
    selected.forEach((id) => { if (!atoms.has(id)) throw new Error(`Selected render atom '${id}' is not in the visible scene.`); });
    const componentFor = (seed) => {
      const component = new Set([seed]); const queue = [seed];
      while (queue.length) {
        const id = queue.shift();
        [...neighbors.get(id)].sort().forEach((neighbor) => { if (!component.has(neighbor)) { component.add(neighbor); queue.push(neighbor); } });
      }
      return component;
    };
    const component = componentFor(selected[0]);
    if (selected.some((id) => !component.has(id))) throw new Error("Selected atoms span more than one connected component.");
    return [...component].sort().map((id) => atoms.get(id));
  }

  function crystalExportAtoms({ source, scene, modelId, mode = "source-asymmetric-unit", selectedRenderAtomIds } = {}) {
    requireCrystalSource(source);
    if (!CRYSTAL_EXPORT_MODES.has(mode)) throw new TypeError(`Unsupported crystal XYZ export mode: ${mode}`);
    const selectedModelId = modelId || scene?.sourceModelId || source.models[0]?.modelId;
    const model = requireModel(source, selectedModelId);
    if (mode === "source-asymmetric-unit") {
      return { mode, model, atoms: model.atomSites.map((site) => ({ id: site.siteId, element: site.element, position: sourceSitePosition(source, site) })) };
    }
    const visible = requireMatchingScene(source, scene, selectedModelId);
    const sceneAtoms = mode === "visible-scene"
      ? [...visible.atoms].sort((left, right) => left.renderAtomId.localeCompare(right.renderAtomId))
      : selectedComponentAtoms(visible, selectedRenderAtomIds);
    return { mode, model, atoms: sceneAtoms.map((atom) => ({ id: atom.renderAtomId, element: atom.element, position: atom.position })) };
  }

  function crystalCoordinateRows(options = {}) {
    return crystalExportAtoms(options).atoms.map((atom) => `${atom.element} ${atom.position.map(coordinate).join(" ")}`).join("\n");
  }

  function exportCrystalXyz(options = {}) {
    const projected = crystalExportAtoms(options);
    const labels = {
      "source-asymmetric-unit": "source asymmetric unit",
      "visible-scene": "visible scene",
      "selected-component": "selected component",
    };
    const title = String(options.source.displayName || "Crystal structure").replace(/[\r\n]+/g, " ");
    const comment = `${title} - ${projected.model.label.replace(/[\r\n]+/g, " ")} - ${labels[projected.mode]}`;
    const rows = projected.atoms.map((atom) => `${atom.element} ${atom.position.map(coordinate).join(" ")}`).join("\n");
    return `${projected.atoms.length}\n${comment}\n${rows}`;
  }

  function sanitizeDownloadName(name, extension = "") {
    const suffix = extension && String(extension).startsWith(".") ? String(extension) : extension ? `.${extension}` : "";
    let base = String(name || "").trim().replace(/^\.+[\\/]+/, "").replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_").replace(/[. ]+$/g, "");
    if (suffix && base.toLowerCase().endsWith(suffix.toLowerCase())) base = base.slice(0, -suffix.length).replace(/[. ]+$/g, "");
    else if (suffix) base = base.replace(/\.[A-Za-z0-9]{1,8}$/i, "");
    if (!base || /^\.+$/.test(base)) base = "structure";
    return `${base}${suffix}`;
  }

  function abortError() { const error = new Error("File reading was cancelled."); error.name = "AbortError"; return error; }

  function readStructureFile(file, options = {}) {
    if (!file || typeof file.name !== "string") return Promise.reject(new TypeError("A named structure file is required."));
    const signal = options.signal;
    if (signal?.aborted) return Promise.reject(abortError());
    const FileReaderCtor = options.FileReader || root?.FileReader;
    if (typeof FileReaderCtor === "function") return new Promise((resolve, reject) => {
      const reader = new FileReaderCtor();
      const abort = () => reader.abort();
      const cleanup = () => signal?.removeEventListener?.("abort", abort);
      reader.onprogress = (event) => options.onProgress?.({ loaded: event.loaded, total: event.total || file.size || 0 });
      reader.onload = () => { cleanup(); resolve({ name: file.name, text: String(reader.result || "") }); };
      reader.onerror = () => { cleanup(); reject(reader.error || new Error(`Unable to read ${file.name}.`)); };
      reader.onabort = () => { cleanup(); reject(abortError()); };
      signal?.addEventListener?.("abort", abort, { once: true });
      reader.readAsText(file);
    });
    if (typeof file.text !== "function") return Promise.reject(new TypeError("The file cannot be read as text."));
    return new Promise((resolve, reject) => {
      const abort = () => reject(abortError());
      signal?.addEventListener?.("abort", abort, { once: true });
      Promise.resolve(file.text()).then((text) => {
        signal?.removeEventListener?.("abort", abort);
        if (signal?.aborted) reject(abortError());
        else { options.onProgress?.({ loaded: file.size || String(text).length, total: file.size || String(text).length }); resolve({ name: file.name, text: String(text) }); }
      }, (error) => { signal?.removeEventListener?.("abort", abort); reject(error); });
    });
  }

  return { sourceModelCoordinateRows, sourceModelToXyz, crystalCoordinateRows, exportCrystalXyz, sanitizeDownloadName, readStructureFile };
});
;
/* web/structure-viewer/viewer-math.js */
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
;
/* web/structure-viewer/workspace/workspace-store.js */
(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? { ...require("../core/structure-factory.js"), ...require("../core/scene-definition.js"), ...require("../core/atom-identity.js") }
    : root.StructureViewerCore;
  const api = factory(root, dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerCore = Object.assign(root.StructureViewerCore || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (root, dependencies) {
  "use strict";

  function clone(value) {
    if (Array.isArray(value)) return value.map(clone);
    if (value && typeof value === "object") {
      const copy = {};
      Object.keys(value).forEach((key) => { copy[key] = clone(value[key]); });
      return copy;
    }
    return value;
  }

  function freeze(value, seen = new WeakSet()) {
    if (!value || typeof value !== "object" || seen.has(value)) return value;
    seen.add(value);
    Object.values(value).forEach((entry) => freeze(entry, seen));
    return Object.freeze(value);
  }

  function defaultUuid() {
    if (root?.crypto?.randomUUID) return root.crypto.randomUUID();
    if (typeof require === "function") return require("crypto").randomUUID();
    throw new Error("A UUID generator is required in this environment.");
  }

  function defaultView() {
    return {
      representation: { kind: "ball-stick", colorScheme: "element", multipleBonds: true },
      labels: { mode: "none", showSelectionOrder: true },
      hydrogenDisplay: "show",
      backgroundColor: "var(--rt-viewer-background)",
      crystalDisplay: { showUnitCell: true, showCellAxes: false },
    };
  }

  function mergeView(current, patch = {}) {
    return {
      ...current,
      ...clone(patch),
      representation: { ...current.representation, ...clone(patch.representation || {}) },
      labels: { ...current.labels, ...clone(patch.labels || {}) },
      crystalDisplay: { ...current.crystalDisplay, ...clone(patch.crystalDisplay || {}) },
    };
  }

  const REPRESENTATIONS = new Set(["ball-stick", "stick", "spacefill", "line", "cartoon", "ribbon", "surface"]);
  const COLOR_SCHEMES = new Set(["element", "chain", "residue", "occupancy", "uniform"]);
  const LABEL_MODES = new Set(["none", "element", "index", "element-index", "residue"]);
  const MEASUREMENT_ARITY = Object.freeze({ distance: 2, angle: 3, dihedral: 4 });

  function validateVector(value, length, path) {
    if (!Array.isArray(value) || value.length !== length || !value.every(Number.isFinite)) throw new TypeError(`${path} is invalid.`);
  }

  function validateView(view) {
    if (!view || typeof view !== "object") throw new TypeError("Viewer view is invalid.");
    if (!REPRESENTATIONS.has(view.representation?.kind) || !COLOR_SCHEMES.has(view.representation?.colorScheme) || typeof view.representation?.multipleBonds !== "boolean") {
      throw new TypeError("Viewer representation is invalid.");
    }
    if (view.representation.uniformColor !== undefined && (typeof view.representation.uniformColor !== "string" || !view.representation.uniformColor)) {
      throw new TypeError("Viewer representation uniform color is invalid.");
    }
    if (view.representation.surfaceOpacity !== undefined && (!Number.isFinite(view.representation.surfaceOpacity) || view.representation.surfaceOpacity < 0 || view.representation.surfaceOpacity > 1)) {
      throw new TypeError("Viewer representation surface opacity is invalid.");
    }
    if (!LABEL_MODES.has(view.labels?.mode) || typeof view.labels?.showSelectionOrder !== "boolean") throw new TypeError("Viewer labels are invalid.");
    if (!["show", "hide"].includes(view.hydrogenDisplay)) throw new TypeError("Viewer hydrogen display is invalid.");
    if (view.backgroundColor !== undefined && (typeof view.backgroundColor !== "string" || !view.backgroundColor)) throw new TypeError("Viewer background color is invalid.");
    if (view.crystalDisplay !== undefined && (typeof view.crystalDisplay.showUnitCell !== "boolean" || typeof view.crystalDisplay.showCellAxes !== "boolean")) {
      throw new TypeError("Viewer crystal display is invalid.");
    }
  }

  function validateCamera(camera) {
    validateVector(camera?.target, 3, "Camera target");
    validateVector(camera?.rotation, 4, "Camera rotation");
    if (!Number.isFinite(camera.distance) || camera.distance <= 0 || !["perspective", "orthographic"].includes(camera.projection)) {
      throw new TypeError("Camera state is invalid.");
    }
  }

  function findModel(source, modelId) {
    return source?.models.find((model) => model.modelId === modelId) || null;
  }

  function validateIdentity(identity, source, path) {
    const normalized = dependencies.makeAtomIdentity(identity);
    if (!source || normalized.sourceStructureId !== source.structureId) throw new TypeError(`${path} references another structure.`);
    const model = findModel(source, normalized.modelId);
    if (!model || !model.atomSites.some((site) => site.siteId === normalized.siteId)) throw new TypeError(`${path} references an unknown atom.`);
    return normalized;
  }

  function validateSceneDefinition(definition, source) {
    if (!definition) {
      if (source) throw new TypeError("A structure Viewer requires a scene definition.");
      return undefined;
    }
    if (!source) throw new TypeError("A scene definition requires a structure.");
    const normalized = dependencies.normalizeSceneDefinition(definition);
    if (!findModel(source, normalized.modelId)) throw new TypeError(`Unknown model: ${normalized.modelId}`);
    const expectedMode = source.structureType === "crystal" ? "crystal" : source.structureType === "macromolecule" ? "macromolecular" : "molecular";
    if (normalized.mode !== expectedMode) throw new TypeError(`Scene mode ${normalized.mode} is incompatible with ${source.structureType}.`);
    return normalized;
  }

  function validateMeasurements(measurements, source) {
    if (!Array.isArray(measurements)) throw new TypeError("Viewer measurements are invalid.");
    const ids = new Set();
    return measurements.map((measurement, index) => {
      const expected = MEASUREMENT_ARITY[measurement?.kind];
      if (typeof measurement?.measurementId !== "string" || !measurement.measurementId || ids.has(measurement.measurementId) || !expected || measurement.visible !== true && measurement.visible !== false) {
        throw new TypeError(`Measurement ${index} is invalid.`);
      }
      ids.add(measurement.measurementId);
      if (!Array.isArray(measurement.atomIdentities) || measurement.atomIdentities.length !== expected) throw new TypeError(`Measurement ${index} has invalid arity.`);
      return { ...clone(measurement), atomIdentities: measurement.atomIdentities.map((identity) => validateIdentity(identity, source, `Measurement ${index}`)) };
    });
  }

  function defaultDefinitionFor(source) {
    if (!source) return undefined;
    return {
      modelId: source.models[0].modelId,
      mode: source.structureType === "crystal" ? "crystal" : source.structureType === "macromolecule" ? "macromolecular" : "molecular",
    };
  }

  function initialState() {
    return freeze({
      schema: "rt-viewer-workspace/1",
      structures: {},
      order: [],
      activeViewerId: null,
      instances: {},
      layout: "tabs",
    });
  }

  function createWorkspaceStore({ uuid = defaultUuid } = {}) {
    const registry = new dependencies.SourceRegistry();
    const listeners = new Set();
    let state = initialState();

    function publish(next) {
      state = freeze(next);
      listeners.forEach((listener) => listener(state));
    }

    function requireViewer(viewerId) {
      const viewer = state.instances[viewerId];
      if (!viewer) throw new Error(`Unknown Viewer instance: ${viewerId}`);
      return viewer;
    }

    function cleanupReleasedSource(structureId, structures) {
      if (!structureId || registry.referenceCount(structureId) !== 0) return structures;
      registry.remove(structureId);
      const next = { ...structures };
      delete next[structureId];
      return next;
    }

    function addStructure(source) {
      registry.add(source);
      publish({ ...state, structures: { ...state.structures, [source.structureId]: source } });
      return source.structureId;
    }

    function createViewer(options = {}) {
      const viewerId = options.viewerId || uuid();
      if (typeof viewerId !== "string" || !viewerId || state.instances[viewerId]) throw new Error(`Invalid or duplicate Viewer ID: ${viewerId}`);
      const structureId = options.structureId;
      const source = structureId ? registry.get(structureId) : null;
      if (structureId && !source) throw new Error(`Unknown structure: ${structureId}`);
      const sceneDefinition = validateSceneDefinition(options.sceneDefinition || defaultDefinitionFor(source), source);
      const view = mergeView(defaultView(), options.view);
      validateView(view);
      if (options.camera) validateCamera(options.camera);
      const selection = (options.selection || []).map((identity, index) => validateIdentity(identity, source, `Selection ${index}`));
      const measurements = validateMeasurements(options.measurements || [], source);
      const viewer = {
        schema: "rt-viewer-instance/1",
        viewerId,
        name: options.name || source?.displayName || "Untitled structure",
        ...(structureId ? { structureId } : {}),
        ...(sceneDefinition ? { sceneDefinition } : {}),
        view,
        ...(options.camera ? { camera: clone(options.camera) } : {}),
        selection,
        measurements,
        uiState: clone(options.uiState || {}),
        operation: clone(options.operation || { status: "idle" }),
        ...(options.error ? { error: clone(options.error) } : {}),
      };
      if (structureId) registry.retain(structureId);
      publish({
        ...state,
        order: [...state.order, viewerId],
        activeViewerId: viewerId,
        instances: { ...state.instances, [viewerId]: viewer },
      });
      return viewerId;
    }

    function patchViewer(viewerId, patch = {}) {
      const current = requireViewer(viewerId);
      let structures = state.structures;
      const retargeting = Object.prototype.hasOwnProperty.call(patch, "structureId") && (patch.structureId || undefined) !== current.structureId;
      const structureId = retargeting ? (patch.structureId || undefined) : current.structureId;
      const source = structureId ? registry.get(structureId) : null;
      if (structureId && !source) throw new Error(`Unknown structure: ${structureId}`);
      const sceneInput = patch.sceneDefinition || (retargeting ? defaultDefinitionFor(source) : current.sceneDefinition);
      const sceneDefinition = validateSceneDefinition(sceneInput, source);
      const view = patch.view ? mergeView(current.view, patch.view) : current.view;
      validateView(view);
      const cameraPatched = Object.prototype.hasOwnProperty.call(patch, "camera");
      const camera = cameraPatched ? (patch.camera == null ? undefined : clone(patch.camera)) : current.camera;
      if (camera) validateCamera(camera);
      const selectionInput = patch.selection || (retargeting ? [] : current.selection);
      const selection = selectionInput.map((identity, index) => validateIdentity(identity, source, `Selection ${index}`));
      const measurementInput = patch.measurements || (retargeting ? [] : current.measurements);
      const measurements = validateMeasurements(measurementInput, source);
      const next = {
        ...current,
        ...(patch.name !== undefined ? { name: String(patch.name) } : {}),
        ...(structureId ? { structureId } : {}),
        view,
        ...(camera ? { camera } : {}),
        selection,
        measurements,
        ...(sceneDefinition ? { sceneDefinition } : {}),
        ...(patch.uiState ? { uiState: clone(patch.uiState) } : {}),
        ...(patch.operation ? { operation: clone(patch.operation) } : {}),
        ...(patch.error ? { error: clone(patch.error) } : {}),
      };
      if (cameraPatched && !camera) delete next.camera;
      if (!structureId) {
        delete next.structureId;
        delete next.sceneDefinition;
      }
      if (retargeting) {
        if (structureId) registry.retain(structureId);
        if (current.structureId) {
          registry.release(current.structureId);
          structures = cleanupReleasedSource(current.structureId, structures);
        }
      }
      publish({ ...state, structures, instances: { ...state.instances, [viewerId]: next } });
      return viewerId;
    }

    function activate(viewerId) {
      if (viewerId !== null) requireViewer(viewerId);
      if (state.activeViewerId !== viewerId) publish({ ...state, activeViewerId: viewerId });
    }

    function reorder(order) {
      if (!Array.isArray(order) || order.length !== state.order.length || new Set(order).size !== order.length || order.some((id) => !state.instances[id])) {
        throw new Error("Reorder must contain every Viewer ID exactly once.");
      }
      publish({ ...state, order: [...order] });
    }

    function setLayout(layout) {
      if (!["tabs", "single", "side-by-side"].includes(layout)) throw new TypeError(`Unsupported Workspace layout: ${layout}`);
      if (state.layout !== layout) publish({ ...state, layout });
      return layout;
    }

  function duplicateName(name) {
      const base = String(name).replace(/ \(\d+\)$/, "");
      const names = new Set(Object.values(state.instances).map((viewer) => viewer.name));
      for (let suffix = 2; ; suffix += 1) {
        const candidate = `${base} (${suffix})`;
        if (!names.has(candidate)) return candidate;
      }
    }

    function duplicate(viewerId) {
      const source = requireViewer(viewerId);
      return createViewer({
        name: duplicateName(source.name),
        structureId: source.structureId,
        sceneDefinition: source.sceneDefinition,
        view: source.view,
        camera: source.camera,
        selection: source.selection,
        measurements: source.measurements,
        uiState: source.uiState,
        operation: { status: "idle" },
      });
    }

    function close(viewerId) {
      const viewer = requireViewer(viewerId);
      const oldIndex = state.order.indexOf(viewerId);
      const order = state.order.filter((id) => id !== viewerId);
      const instances = { ...state.instances };
      delete instances[viewerId];
      let structures = state.structures;
      if (viewer.structureId) {
        registry.release(viewer.structureId);
        structures = cleanupReleasedSource(viewer.structureId, structures);
      }
      const activeViewerId = state.activeViewerId === viewerId
        ? (order[Math.min(oldIndex, order.length - 1)] || null)
        : state.activeViewerId;
      publish({ ...state, structures, order, instances, activeViewerId });
    }

    function subscribe(listener) {
      if (typeof listener !== "function") throw new TypeError("Subscriber must be a function.");
      listeners.add(listener);
      return () => listeners.delete(listener);
    }

    return {
      getState: () => state,
      subscribe,
      addStructure,
      createViewer,
      patchViewer,
      activate,
      reorder,
      setLayout,
      duplicate,
      close,
      referenceCount: (structureId) => registry.referenceCount(structureId),
    };
  }

  return { createWorkspaceStore };
});
;
/* web/structure-viewer/renderers/renderer-contract.js */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerCore = Object.assign(root.StructureViewerCore || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  const BOOLEAN_CAPABILITIES = ["unitCell", "atomPicking", "labels", "measurements", "png"];
  const STRUCTURE_TYPES = new Set(["molecule", "crystal", "macromolecule", "trajectory", "multi-model"]);
  const REPRESENTATIONS = new Set(["ball-stick", "stick", "spacefill", "line", "cartoon", "ribbon", "surface"]);
  const SESSION_METHODS = [
    "loadScene", "applyViewState", "setSelection", "setMeasurements", "getCamera",
    "setCamera", "resetCamera", "resize", "render", "capturePng", "dispose",
  ];
  const CALLBACK_METHODS = ["onPick", "onCameraChanged", "onError"];
  const LEGACY_SESSION_ALIASES = ["load", "setStyle", "destroy", "png"];

  class RendererContractError extends Error {
    constructor(code, message, details = {}) {
      super(message);
      this.name = "RendererContractError";
      this.code = code;
      this.details = details;
    }
  }

  function assertStringArray(value, path, allowed) {
    if (!Array.isArray(value) || value.length === 0 || value.some((entry) => typeof entry !== "string" || !entry)) {
      throw new TypeError(`${path} must be a non-empty string array.`);
    }
    if (new Set(value).size !== value.length) throw new TypeError(`${path} must not contain duplicates.`);
    if (allowed && value.some((entry) => !allowed.has(entry))) throw new TypeError(`${path} contains an unsupported value.`);
  }

  function assertRendererCapabilities(capabilities) {
    if (!capabilities || typeof capabilities !== "object") throw new TypeError("Renderer capabilities must be an object.");
    assertStringArray(capabilities.structureTypes, "capabilities.structureTypes", STRUCTURE_TYPES);
    assertStringArray(capabilities.representations, "capabilities.representations", REPRESENTATIONS);
    BOOLEAN_CAPABILITIES.forEach((name) => {
      if (typeof capabilities[name] !== "boolean") throw new TypeError(`capabilities.${name} must be boolean.`);
    });
    return capabilities;
  }

  function assertRendererCallbacks(callbacks) {
    if (!callbacks || typeof callbacks !== "object") throw new TypeError("Renderer callbacks must be an object.");
    CALLBACK_METHODS.forEach((name) => {
      if (typeof callbacks[name] !== "function") throw new TypeError(`Renderer callback ${name} must be a function.`);
    });
    return callbacks;
  }

  function assertRendererSession(session) {
    if (!session || typeof session !== "object") throw new TypeError("RendererSession must be an object.");
    SESSION_METHODS.forEach((name) => {
      if (typeof session[name] !== "function") throw new TypeError(`RendererSession.${name} must be a function.`);
    });
    LEGACY_SESSION_ALIASES.forEach((name) => {
      if (name in session) throw new TypeError(`RendererSession legacy alias '${name}' is not allowed.`);
    });
    return session;
  }

  function assertRendererAdapter(adapter) {
    if (!adapter || typeof adapter !== "object") throw new TypeError("RendererAdapter must be an object.");
    if (typeof adapter.id !== "string" || !adapter.id) throw new TypeError("RendererAdapter.id must be a non-empty string.");
    assertRendererCapabilities(adapter.capabilities);
    if (typeof adapter.createSession !== "function") throw new TypeError("RendererAdapter.createSession must be a function.");
    return adapter;
  }

  function createRendererSession(adapter, container, callbacks) {
    assertRendererAdapter(adapter);
    assertRendererCallbacks(callbacks);
    return assertRendererSession(adapter.createSession(container, callbacks));
  }

  function assertRendererSupports(adapter, requirements = {}) {
    assertRendererAdapter(adapter);
    const unsupported = [];
    if (requirements.structureType && !adapter.capabilities.structureTypes.includes(requirements.structureType)) unsupported.push(`structureType:${requirements.structureType}`);
    if (requirements.representation && !adapter.capabilities.representations.includes(requirements.representation)) unsupported.push(`representation:${requirements.representation}`);
    BOOLEAN_CAPABILITIES.forEach((name) => {
      if (requirements[name] === true && adapter.capabilities[name] !== true) unsupported.push(name);
    });
    if (unsupported.length) {
      throw new RendererContractError(
        "unsupported-renderer-capability",
        `Renderer ${adapter.id} does not support: ${unsupported.join(", ")}`,
        { rendererId: adapter.id, unsupported },
      );
    }
    return true;
  }

  return {
    RendererContractError,
    assertRendererAdapter,
    assertRendererCapabilities,
    assertRendererCallbacks,
    assertRendererSession,
    assertRendererSupports,
    createRendererSession,
  };
});
;
/* web/structure-viewer/renderers/3dmol-renderer.js */
(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? { ...require("./renderer-contract.js"), ...require("../core/atom-identity.js"), ...require("../core/validators.js") }
    : root.StructureViewerCore;
  const api = factory(root, dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerRenderers = Object.assign(root.StructureViewerRenderers || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (root, dependencies) {
  "use strict";

  const { serializeAtomIdentity, validateRenderScene } = dependencies;
  const REPRESENTATIONS = Object.freeze(["ball-stick", "stick", "spacefill", "line", "cartoon", "ribbon", "surface"]);

  function cloneCamera(camera) {
    return { target: [...camera.target], rotation: [...camera.rotation], distance: camera.distance, projection: camera.projection };
  }

  function cameraForScene(scene) {
    if (!scene?.atoms?.length) return { target: [0, 0, 0], rotation: [0, 0, 0, 1], distance: 10, projection: "perspective" };
    const target = [0, 1, 2].map((axis) => scene.atoms.reduce((sum, atom) => sum + atom.position[axis], 0) / scene.atoms.length);
    const radius = Math.max(1, ...scene.atoms.map((atom) => Math.hypot(atom.position[0] - target[0], atom.position[1] - target[1], atom.position[2] - target[2])));
    return { target, rotation: [0, 0, 0, 1], distance: radius * 3, projection: "perspective" };
  }

  function styleFor(representation) {
    const color = representation.colorScheme === "uniform"
      ? { color: representation.uniformColor || "#64748b" }
      : { colorscheme: representation.colorScheme === "element" ? "Jmol" : representation.colorScheme };
    if (representation.kind === "stick") return { stick: { radius: 0.16, singleBonds: !representation.multipleBonds, ...color } };
    if (representation.kind === "spacefill") return { sphere: { scale: 1, ...color } };
    if (representation.kind === "line") return { line: { ...color } };
    if (representation.kind === "cartoon" || representation.kind === "ribbon") return { cartoon: { style: representation.kind === "ribbon" ? "trace" : "rectangle", ...color } };
    return { stick: { radius: 0.13, singleBonds: !representation.multipleBonds, ...color }, sphere: { scale: 0.28, ...color } };
  }

  function resolveMacromolecularRepresentation(scene, representation) {
    if (!["cartoon", "ribbon"].includes(representation.kind) || scene?.macromolecule?.cartoonEligible === true) {
      return { representation, warning: null };
    }
    const requested = representation.kind === "ribbon" ? "Ribbon" : "Cartoon";
    return {
      representation: { ...representation, kind: "stick" },
      warning: `${requested} requires normalized protein backbone atoms; using Stick instead.`,
    };
  }

  function labelTextForAtom(atom, index, mode) {
    if (mode === "element") return atom.element;
    if (mode === "index") return String(index + 1);
    if (mode === "element-index") return `${atom.element}${index + 1}`;
    if (mode === "residue" && atom.residueName && Number.isSafeInteger(atom.residueSequenceNumber)) {
      return `${atom.residueName} ${atom.residueSequenceNumber}${atom.residueInsertionCode || ""}:${atom.chainId || "_"}`;
    }
    return atom.residueId || atom.sourceSite?.residueId || atom.sourceSite?.label || atom.element;
  }

  function buildAtomSpecs(scene) {
    const indexById = new Map(scene.atoms.map((atom, index) => [atom.renderAtomId, index]));
    const specs = scene.atoms.map((atom, index) => ({
      index,
      serial: index + 1,
      elem: atom.element,
      x: atom.position[0], y: atom.position[1], z: atom.position[2],
      bonds: [], bondOrder: [],
      ...(atom.chainId !== undefined ? { chain: atom.chainId } : {}),
      ...(Number.isSafeInteger(atom.residueSequenceNumber) ? { resi: atom.residueSequenceNumber } : {}),
      ...(atom.residueInsertionCode !== undefined ? { icode: atom.residueInsertionCode } : {}),
      ...(atom.residueName !== undefined ? { resn: atom.residueName } : {}),
      ...(atom.atomName !== undefined ? { atom: atom.atomName } : {}),
      ...(atom.residueId !== undefined ? { altLoc: atom.altLocation || "" } : {}),
      properties: { renderAtomId: atom.renderAtomId, identity: atom.identity },
    }));
    scene.bonds.forEach((bond) => {
      const begin = indexById.get(bond.beginRenderAtomId);
      const end = indexById.get(bond.endRenderAtomId);
      if (!Number.isInteger(begin) || !Number.isInteger(end)) throw new Error(`Unknown RenderBond endpoint: ${bond.renderBondId}`);
      specs[begin].bonds.push(end);
      specs[begin].bondOrder.push(bond.order);
      specs[end].bonds.push(begin);
      specs[end].bondOrder.push(bond.order);
    });
    return specs;
  }

  function dataUriToBlob(uri) {
    const match = String(uri).match(/^data:([^;,]+)(?:;base64)?,(.*)$/);
    if (!match) throw new Error("3Dmol did not return a PNG data URI.");
    const bytes = typeof atob === "function"
      ? Uint8Array.from(atob(match[2]), (character) => character.charCodeAt(0))
      : Uint8Array.from(Buffer.from(match[2], "base64"));
    return new Blob([bytes], { type: match[1] });
  }

  function unitCellEdges(unitCell) {
    if (!unitCell?.origin || !unitCell?.vectors) return [];
    const add = (...vectors) => vectors.reduce((sum, vector) => sum.map((value, axis) => value + vector[axis]), [0, 0, 0]);
    const [a, b, c] = unitCell.vectors;
    const origin = unitCell.origin;
    const corners = [origin, add(origin, a), add(origin, b), add(origin, c), add(origin, a, b), add(origin, a, c), add(origin, b, c), add(origin, a, b, c)];
    return [[0, 1], [0, 2], [0, 3], [1, 4], [1, 5], [2, 4], [2, 6], [3, 5], [3, 6], [4, 7], [5, 7], [6, 7]]
      .map(([begin, end]) => ({ start: corners[begin], end: corners[end] }));
  }

  function create3DmolRendererAdapter(runtime) {
    const getRuntime = () => runtime || root?.$3Dmol;
    const diagnostics = { activeSessions: 0, activeModels: 0, activeLabels: 0, activeWebglContexts: 0, activeListeners: 0, activeObservers: 0, activeAnimationFrames: 0 };
    const getDiagnostics = () => Object.freeze({ ...diagnostics });
    return Object.freeze({
      id: "3dmol-2.5.3",
      capabilities: Object.freeze({
        structureTypes: Object.freeze(["molecule", "crystal", "macromolecule", "trajectory", "multi-model"]),
        representations: REPRESENTATIONS,
        unitCell: true, atomPicking: true, labels: true, measurements: true, png: true,
      }),
      createSession(container, callbacks) {
        const threeDmol = getRuntime();
        if (!threeDmol || typeof threeDmol.createViewer !== "function") throw new Error("3Dmol runtime is unavailable.");
        const registrations = [];
        const restores = [];
        [root, root?.document?.body].filter((target) => target?.addEventListener).forEach((target) => {
          const original = target.addEventListener;
          target.addEventListener = function (type, listener, options) {
            registrations.push({ target, type, listener, options });
            return original.call(this, type, listener, options);
          };
          restores.push(() => { target.addEventListener = original; });
        });
        let viewer;
        try {
          viewer = threeDmol.createViewer(container, { backgroundColor: "#ffffff", antialias: true });
        } catch (cause) {
          registrations.forEach(({ target, type, listener, options }) => target.removeEventListener?.(type, listener, options));
          callbacks.onError({ stage: "initialize", code: "3dmol-initialize-failed", message: cause.message, cause });
          throw cause;
        } finally {
          restores.reverse().forEach((restore) => restore());
        }
        let model = null;
        let scene = null;
        let viewState = null;
        let selection = [];
        let measurements = [];
        let camera = cameraForScene(null);
        let disposed = false;
        let atomByIdentity = new Map();
        let modelCount = 0;
        let labelCount = 0;
        let suppressCameraEvents = false;
        let cameraResumeFrames = [];
        let viewGeneration = 0;
        const webglContext = viewer.getRenderer?.()?.getContext?.() || null;
        const internalObservers = [viewer.divwatcher, viewer.intwatcher].filter((observer) => observer?.disconnect);
        let cameraListenerActive = false;
        diagnostics.activeSessions += 1;
        if (webglContext) diagnostics.activeWebglContexts += 1;
        diagnostics.activeListeners += registrations.length;
        diagnostics.activeObservers += internalObservers.length;

        function ensureActive() {
          if (disposed) throw new Error("RendererSession is disposed.");
        }

        function readCamera() {
          const view = viewer.getView?.();
          if (Array.isArray(view) && view.length >= 8 && view.slice(0, 8).every(Number.isFinite)) {
            camera = {
              target: view.slice(0, 3),
              distance: view[3],
              rotation: view.slice(4, 8),
              projection: camera.projection,
            };
          }
          return cloneCamera(camera);
        }

        function report(stage, code, cause) {
          const error = { stage, code, message: cause?.message || String(cause), cause };
          callbacks.onError(error);
          return cause;
        }

        function addLabel(text, atom, extra = {}) {
          viewer.addLabel(String(text), {
            position: { x: atom.position[0], y: atom.position[1], z: atom.position[2] },
            fontSize: 11, fontColor: "#111827", backgroundColor: "#ffffff", backgroundOpacity: 0.72,
            borderThickness: 0, alignment: "center", screenOffset: { x: 0, y: 0 }, inFront: true, ...extra,
          });
          labelCount += 1;
          diagnostics.activeLabels += 1;
        }

        function clearLabels() {
          viewer.removeAllLabels();
          diagnostics.activeLabels -= labelCount;
          labelCount = 0;
        }

        function clearModels() {
          viewer.removeAllModels();
          diagnostics.activeModels -= modelCount;
          modelCount = 0;
        }

        function cancelCameraResume() {
          cameraResumeFrames.forEach((id) => root.cancelAnimationFrame?.(id));
          diagnostics.activeAnimationFrames -= cameraResumeFrames.length;
          cameraResumeFrames = [];
        }

        function scheduleCameraEvents() {
          cancelCameraResume();
          if (typeof root.requestAnimationFrame !== "function") {
            suppressCameraEvents = false;
            return;
          }
          const request = (callback) => {
            const id = root.requestAnimationFrame(() => {
              const index = cameraResumeFrames.indexOf(id);
              if (index >= 0) cameraResumeFrames.splice(index, 1);
              diagnostics.activeAnimationFrames -= 1;
              callback();
            });
            cameraResumeFrames.push(id);
            diagnostics.activeAnimationFrames += 1;
          };
          request(() => request(() => { suppressCameraEvents = false; }));
        }

        function addLabels() {
          if (!scene || !viewState) return;
          const mode = viewState.labels?.mode || "none";
          if (mode !== "none") scene.atoms.forEach((atom, index) => {
            addLabel(labelTextForAtom(atom, index, mode), atom);
          });
          if (viewState.labels?.showSelectionOrder) selection.forEach((identity, index) => {
            const atom = atomByIdentity.get(serializeAtomIdentity(identity));
            if (atom) addLabel(index + 1, atom, { fontColor: "#ffffff", backgroundColor: "#1e3a8a", backgroundOpacity: 0.9 });
          });
        }

        function addUnitCell() {
          if (!scene?.unitCell || viewState?.crystalDisplay?.showUnitCell !== true) return;
          unitCellEdges(scene.unitCell).forEach((edge) => viewer.addLine({
            start: { x: edge.start[0], y: edge.start[1], z: edge.start[2] },
            end: { x: edge.end[0], y: edge.end[1], z: edge.end[2] }, color: "#64748b", linewidth: 2,
          }));
        }

        function addMeasurements() {
          addUnitCell();
          if (!scene) return;
          measurements.forEach((item) => {
            if (item?.definition?.visible === false) return;
            const atoms = (item.definition?.atomIdentities || []).map((identity) => atomByIdentity.get(serializeAtomIdentity(identity)));
            if (atoms.some((atom) => !atom)) return;
            for (let index = 1; index < atoms.length; index += 1) {
              viewer.addLine({
                start: { x: atoms[index - 1].position[0], y: atoms[index - 1].position[1], z: atoms[index - 1].position[2] },
                end: { x: atoms[index].position[0], y: atoms[index].position[1], z: atoms[index].position[2] },
                color: "#2563eb", dashed: true, linewidth: 2,
              });
            }
            const center = [0, 1, 2].map((axis) => atoms.reduce((sum, atom) => sum + atom.position[axis], 0) / atoms.length);
            const suffix = item.unit === "angstrom" ? " Å" : "°";
            viewer.addLabel(`${Number(item.value).toFixed(item.unit === "angstrom" ? 3 : 2)}${suffix}`, {
              position: { x: center[0], y: center[1], z: center[2] }, fontColor: "#1e3a8a", backgroundColor: "#dbeafe", inFront: true,
            });
            labelCount += 1;
            diagnostics.activeLabels += 1;
          });
        }

        function rebuildOverlays() {
          clearLabels();
          viewer.removeAllShapes();
          addLabels();
          addMeasurements();
        }

        if (typeof viewer.setViewChangeCallback === "function") {
          viewer.setViewChangeCallback(() => { if (!suppressCameraEvents) callbacks.onCameraChanged(readCamera()); });
          cameraListenerActive = true;
          diagnostics.activeListeners += 1;
        }

        const session = {
          async loadScene(nextScene, options = {}) {
            ensureActive();
            let completionGeneration = ++viewGeneration;
            if (options.signal?.aborted) {
              const error = new Error("Scene loading was cancelled."); error.name = "AbortError"; throw error;
            }
            try {
              validateRenderScene(nextScene);
              suppressCameraEvents = true;
              clearLabels();
              viewer.removeAllShapes();
              viewer.removeAllSurfaces?.();
              clearModels();
              scene = nextScene;
              model = viewer.addModel();
              modelCount = 1;
              diagnostics.activeModels += 1;
              const specs = buildAtomSpecs(scene);
              model.addAtoms(specs);
              model.setClickable({}, true, (atom, _viewer, event) => callbacks.onPick({
                renderAtomId: atom?.properties?.renderAtomId,
                additive: Boolean(event?.shiftKey || event?.ctrlKey || event?.metaKey),
              }));
              atomByIdentity = new Map(scene.atoms.map((atom) => [serializeAtomIdentity(atom.identity), atom]));
              camera = cameraForScene(scene);
              viewer.zoomTo();
              if (viewState) {
                const pendingViewState = session.applyViewState(viewState);
                completionGeneration = viewGeneration;
                await pendingViewState;
              }
              if (disposed || completionGeneration !== viewGeneration) return;
              viewer.render();
            } catch (cause) {
              throw report("load", "3dmol-load-failed", cause);
            } finally {
              if (!disposed && completionGeneration === viewGeneration) scheduleCameraEvents();
            }
          },
          async applyViewState(nextViewState) {
            ensureActive();
            const generation = ++viewGeneration;
            viewState = nextViewState;
            try {
              if (nextViewState.backgroundColor) viewer.setBackgroundColor(nextViewState.backgroundColor, 1);
              if (model) {
                model.setStyle({}, {});
                const resolved = resolveMacromolecularRepresentation(scene, nextViewState.representation);
                model.setStyle({}, styleFor(resolved.representation));
                if (nextViewState.hydrogenDisplay === "hide") model.setStyle({ elem: "H" }, {});
                viewer.removeAllSurfaces?.();
                if (resolved.representation.kind === "surface" && typeof viewer.addSurface === "function") {
                  const surface = await viewer.addSurface(threeDmol.SurfaceType?.VDW ?? 1, {
                    opacity: nextViewState.representation.surfaceOpacity ?? 0.75,
                    ...(nextViewState.representation.colorScheme === "uniform" ? { color: nextViewState.representation.uniformColor || "#64748b" } : {}),
                  }, {});
                  if (disposed || generation !== viewGeneration) {
                    if (surface !== undefined && typeof viewer.removeSurface === "function") viewer.removeSurface(surface);
                    else if (disposed) viewer.removeAllSurfaces?.();
                    return resolved;
                  }
                }
              }
              if (disposed || generation !== viewGeneration) return resolveMacromolecularRepresentation(scene, nextViewState.representation);
              rebuildOverlays();
              viewer.render();
              return resolveMacromolecularRepresentation(scene, nextViewState.representation);
            } catch (cause) {
              throw report("style", "3dmol-style-failed", cause);
            }
          },
          setSelection(ids) {
            ensureActive(); selection = [...ids]; rebuildOverlays(); viewer.render();
          },
          setMeasurements(items) {
            ensureActive(); measurements = [...items]; rebuildOverlays(); viewer.render();
          },
          getCamera() { ensureActive(); return readCamera(); },
          setCamera(nextCamera) {
            ensureActive(); suppressCameraEvents = true; camera = cloneCamera(nextCamera);
            viewer.setProjection?.(camera.projection);
            if (typeof viewer.setView === "function") viewer.setView([...camera.target, camera.distance, ...camera.rotation]);
            scheduleCameraEvents();
          },
          resetCamera() {
            ensureActive(); suppressCameraEvents = true; camera = cameraForScene(scene); viewer.zoomTo(); viewer.render(); scheduleCameraEvents();
          },
          resize() {
            ensureActive();
            try { viewer.resize(); viewer.render(); } catch (cause) { throw report("resize", "3dmol-resize-failed", cause); }
          },
          render() { ensureActive(); viewer.render(); },
          async capturePng(options = {}) {
            ensureActive();
            try { return dataUriToBlob(viewer.pngURI(options)); } catch (cause) { throw report("capture", "3dmol-capture-failed", cause); }
          },
          dispose() {
            if (disposed) return;
            disposed = true;
            viewGeneration += 1;
            const failures = [];
            const attempt = (action) => { try { action(); return true; } catch (cause) { failures.push(cause); return false; } };
            attempt(cancelCameraResume);
            attempt(clearLabels);
            attempt(() => viewer.removeAllShapes());
            attempt(() => viewer.removeAllSurfaces?.());
            attempt(clearModels);
            if (cameraListenerActive && attempt(() => viewer.setViewChangeCallback?.(null))) {
              diagnostics.activeListeners -= 1;
              cameraListenerActive = false;
            }
            registrations.forEach(({ target, type, listener, options }) => {
              if (attempt(() => target.removeEventListener?.(type, listener, options))) diagnostics.activeListeners -= 1;
            });
            internalObservers.forEach((observer) => {
              if (attempt(() => observer.disconnect())) diagnostics.activeObservers -= 1;
            });
            if (webglContext && attempt(() => webglContext.getExtension?.("WEBGL_lose_context")?.loseContext?.())) diagnostics.activeWebglContexts -= 1;
            attempt(() => container.replaceChildren?.());
            model = null; scene = null; atomByIdentity.clear(); selection = []; measurements = [];
            diagnostics.activeSessions -= 1;
            if (failures.length) {
              const cause = failures[0];
              try { callbacks.onError({ stage: "dispose", code: "3dmol-dispose-failed", message: cause.message, cause, failureCount: failures.length }); } catch (_error) {}
            }
          },
        };
        return session;
      },
      getDiagnostics,
    });
  }

  const ThreeDmolRendererAdapter = create3DmolRendererAdapter();
  return {
    ThreeDmolRendererAdapter,
    create3DmolRendererAdapter,
    build3DmolAtomSpecs: buildAtomSpecs,
    labelTextForAtom,
    resolveMacromolecularRepresentation,
    styleForRepresentation: styleFor,
  };
});
;
/* web/structure-viewer/workspace/viewer-instance.js */
(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? { ...require("../renderers/renderer-contract.js"), ...require("../core/atom-identity.js"), ...require("../viewer-math.js") }
    : { ...(root.StructureViewerCore || {}), ...(root.StructureViewerMath || {}) };
  const api = factory(root, dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerCore = Object.assign(root.StructureViewerCore || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (root, dependencies) {
  "use strict";

  function clone(value) {
    if (value === undefined) return undefined;
    if (typeof structuredClone === "function") return structuredClone(value);
    return JSON.parse(JSON.stringify(value));
  }

  function defaultResizeObserverFactory(callback) {
    if (typeof root.ResizeObserver !== "function") return { observe() {}, disconnect() {} };
    return new root.ResizeObserver(callback);
  }

  function isAbortError(error) {
    return error?.name === "AbortError" || error?.code === "ABORT_ERR";
  }

  function serializableError(error) {
    return {
      code: error?.code || "renderer-error",
      name: error?.name || "Error",
      message: error?.message || String(error),
    };
  }

  const diagnostics = { activeObservers: 0, activeLoads: 0 };

  function getViewerInstanceDiagnostics() {
    return Object.freeze({ ...diagnostics });
  }

  class ViewerInstance {
    constructor({ viewerId, workspace, rendererAdapter, resizeObserverFactory = defaultResizeObserverFactory, callbacks = {} } = {}) {
      if (typeof viewerId !== "string" || !viewerId) throw new TypeError("ViewerInstance requires a viewerId.");
      if (!workspace || typeof workspace.getState !== "function" || typeof workspace.patchViewer !== "function") {
        throw new TypeError("ViewerInstance requires a Workspace store.");
      }
      if (!workspace.getState().instances?.[viewerId]) throw new Error(`Unknown Viewer instance: ${viewerId}`);
      if (typeof resizeObserverFactory !== "function") throw new TypeError("resizeObserverFactory must be a function.");
      dependencies.assertRendererAdapter(rendererAdapter);
      this.viewerId = viewerId;
      this.workspace = workspace;
      this.rendererAdapter = rendererAdapter;
      this.resizeObserverFactory = resizeObserverFactory;
      this.callbacks = {
        onPick: typeof callbacks.onPick === "function" ? callbacks.onPick : () => {},
        onCameraChanged: typeof callbacks.onCameraChanged === "function" ? callbacks.onCameraChanged : () => {},
        onError: typeof callbacks.onError === "function" ? callbacks.onError : () => {},
      };
      this.container = null;
      this.session = null;
      this.resizeObserver = null;
      this.observerActive = false;
      this.loadController = null;
      this.generation = 0;
      this.disposed = false;
      this.currentScene = null;
      this.viewQueue = Promise.resolve();
    }

    currentState() {
      const state = this.workspace.getState().instances[this.viewerId];
      if (!state) throw new Error(`Unknown Viewer instance: ${this.viewerId}`);
      return state;
    }

    assertUsable() {
      if (this.disposed) throw new Error("ViewerInstance is disposed.");
    }

    assertMounted() {
      this.assertUsable();
      if (!this.session) throw new Error("ViewerInstance is not mounted.");
    }

    releaseMountedResources() {
      this.generation += 1;
      if (this.loadController) this.loadController.abort();
      this.loadController = null;
      if (this.resizeObserver) this.resizeObserver.disconnect();
      if (this.observerActive) diagnostics.activeObservers -= 1;
      this.resizeObserver = null;
      this.observerActive = false;
      if (this.session) this.session.dispose();
      this.session = null;
      this.container = null;
      this.currentScene = null;
    }

    mount(container) {
      this.assertUsable();
      if (!container || typeof container !== "object") throw new TypeError("ViewerInstance.mount requires a container.");
      if (this.session && this.container === container) return this;
      if (this.session) this.releaseMountedResources();
      const generation = ++this.generation;
      const active = () => !this.disposed && this.session && generation === this.generation;
      const rendererCallbacks = {
        onPick: (pick) => {
          if (!active()) return;
          const atom = this.currentScene?.atoms?.find((candidate) => candidate.renderAtomId === pick?.renderAtomId);
          if (atom) this.callbacks.onPick({ identity: atom.identity, additive: pick.additive === true });
        },
        onCameraChanged: (camera) => {
          if (!active()) return;
          try {
            this.workspace.patchViewer(this.viewerId, { camera });
            this.callbacks.onCameraChanged(camera);
          } catch (error) {
            this.handleError(error, generation);
          }
        },
        onError: (error) => this.handleError(error, generation),
      };
      this.container = container;
      this.session = dependencies.createRendererSession(this.rendererAdapter, container, rendererCallbacks);
      this.resizeObserver = this.resizeObserverFactory(() => { if (active()) this.resize(); });
      this.resizeObserver.observe(container);
      this.observerActive = true;
      diagnostics.activeObservers += 1;
      return this;
    }

    handleError(error, generation = this.generation) {
      if (this.disposed || generation !== this.generation || !this.session) return;
      this.workspace.patchViewer(this.viewerId, { error: serializableError(error) });
      this.callbacks.onError(error);
    }

    async updateScene(scene) {
      this.assertMounted();
      if (!scene || typeof scene !== "object") throw new TypeError("ViewerInstance.updateScene requires a RenderScene.");
      if (this.loadController) this.loadController.abort();
      const controller = new AbortController();
      this.loadController = controller;
      const generation = this.generation;
      diagnostics.activeLoads += 1;
      try {
        await this.session.loadScene(scene, { signal: controller.signal });
        if (controller.signal.aborted || this.disposed || generation !== this.generation || controller !== this.loadController) return false;
        this.currentScene = scene;
        await this.updateView();
        if (controller.signal.aborted || this.disposed || generation !== this.generation || controller !== this.loadController) return false;
        this.updateCamera();
        return true;
      } catch (error) {
        if (controller.signal.aborted || isAbortError(error)) return false;
        this.handleError(error, generation);
        throw error;
      } finally {
        diagnostics.activeLoads -= 1;
        if (this.loadController === controller) this.loadController = null;
      }
    }

    async updateView(input) {
      this.assertMounted();
      const generation = this.generation;
      const run = async () => {
        this.assertMounted();
        if (generation !== this.generation) return this;
        const current = this.currentState();
        const complete = input?.view ? input : null;
        await this.session.applyViewState(complete?.view || input || current.view);
        if (this.disposed || generation !== this.generation) return this;
        const selection = complete?.selection || current.selection;
        const measurements = complete?.measurements || current.measurements;
        const visibleSelection = this.currentScene
          ? selection.filter((identity) => dependencies.resolveIdentity(this.currentScene, identity))
          : [];
        const visibleMeasurements = this.currentScene
          ? measurements.map((definition) => dependencies.evaluateMeasurement(this.currentScene, definition)).filter((item) => item.status === "available")
          : [];
        this.session.setSelection(visibleSelection);
        this.session.setMeasurements(visibleMeasurements);
        this.session.render();
        return this;
      };
      const operation = this.viewQueue.then(run, run);
      this.viewQueue = operation.catch(() => {});
      return operation;
    }

    updateCamera(camera = this.currentState().camera) {
      this.assertMounted();
      if (camera) this.session.setCamera(camera);
      else {
        this.workspace.patchViewer(this.viewerId, { camera: null });
        this.session.resetCamera();
      }
      this.session.render();
      return this;
    }

    resize() {
      this.assertMounted();
      this.session.resize();
      this.session.render();
      return this;
    }

    snapshot() {
      this.assertUsable();
      return clone(this.currentState());
    }

    getCamera() {
      this.assertMounted();
      return clone(this.session.getCamera());
    }

    capturePng(options) {
      this.assertMounted();
      return this.session.capturePng(options);
    }

    dispose() {
      if (this.disposed) return;
      this.disposed = true;
      this.releaseMountedResources();
    }
  }

  return { ViewerInstance, getViewerInstanceDiagnostics };
});
;
/* web/structure-viewer/ui/viewer-pane.js */
(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? { ...require("../core/atom-identity.js"), ...require("../viewer-math.js") }
    : { ...(root.StructureViewerCore || {}), ...(root.StructureViewerMath || {}) };
  const api = factory(dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerUI = Object.assign(root.StructureViewerUI || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (dependencies) {
  "use strict";

  function createViewerPaneController({ viewerId, workspace, viewerInstance } = {}) {
    if (typeof viewerId !== "string" || !viewerId) throw new TypeError("Viewer pane requires a viewerId.");
    if (!workspace?.getState || !workspace?.patchViewer) throw new TypeError("Viewer pane requires a Workspace store.");
    if (!viewerInstance?.updateView || !viewerInstance?.updateCamera) throw new TypeError("Viewer pane requires a ViewerInstance.");

    function state() {
      const value = workspace.getState().instances[viewerId];
      if (!value) throw new Error(`Unknown Viewer instance: ${viewerId}`);
      return value;
    }

    async function applySelection(selection) {
      const normalized = selection.map((identity) => dependencies.makeAtomIdentity(identity));
      const measurement = dependencies.measurementForSelection(normalized);
      workspace.patchViewer(viewerId, { selection: normalized, measurements: measurement ? [measurement] : [] });
      await viewerInstance.updateView();
      return state();
    }

    async function toggleSelection(identity) {
      const normalized = dependencies.makeAtomIdentity(identity);
      const key = dependencies.serializeAtomIdentity(normalized);
      const selection = [...state().selection];
      const existing = selection.findIndex((candidate) => dependencies.serializeAtomIdentity(candidate) === key);
      if (existing >= 0) selection.splice(existing, 1);
      else selection.push(normalized);
      return applySelection(selection);
    }

    async function clearSelection() {
      return applySelection([]);
    }

    async function handlePick(pick) {
      if (pick?.identity) return toggleSelection(pick.identity);
      return state();
    }

    const previousPick = viewerInstance.callbacks?.onPick;
    const panePick = (pick) => {
      const work = handlePick(pick);
      work.catch((error) => viewerInstance.handleError?.(error));
      if (typeof previousPick === "function") previousPick(pick);
      return work;
    };
    if (viewerInstance.callbacks) {
      viewerInstance.callbacks.onPick = panePick;
    }

    function commands() {
      return Object.freeze({
        clear: Object.freeze({ label: "Clear selection", keyboardAccessible: true, run: clearSelection }),
        reset: Object.freeze({ label: "Reset view", keyboardAccessible: true, run: () => viewerInstance.updateCamera(null) }),
      });
    }

    function bindCommands({ clear, reset } = {}) {
      const bindings = [[clear, clearSelection], [reset, () => viewerInstance.updateCamera(null)]];
      const removers = [];
      bindings.forEach(([control, run]) => {
        if (!control?.addEventListener) return;
        const click = () => Promise.resolve(run()).catch((error) => viewerInstance.handleError?.(error));
        const keydown = (event) => {
          if (String(control.tagName || "").toLowerCase() === "button") return;
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault?.();
          Promise.resolve(run()).catch((error) => viewerInstance.handleError?.(error));
        };
        control.addEventListener("click", click);
        control.addEventListener("keydown", keydown);
        if (String(control.tagName || "").toLowerCase() !== "button") {
          control.setAttribute?.("role", "button");
          control.setAttribute?.("tabindex", "0");
        }
        removers.push(() => {
          control.removeEventListener?.("click", click);
          control.removeEventListener?.("keydown", keydown);
        });
      });
      return () => removers.forEach((remove) => remove());
    }

    function dispose() {
      if (viewerInstance.callbacks?.onPick === panePick) viewerInstance.callbacks.onPick = previousPick || (() => {});
    }

    return Object.freeze({ toggleSelection, clearSelection, handlePick, commands, bindCommands, dispose });
  }

  return { createViewerPaneController };
});
;
/* web/structure-viewer/ui/multi-instance-harness.js */
(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? {
      ...require("../workspace/workspace-store.js"), ...require("../workspace/viewer-instance.js"),
      ...require("../core/scene-builder.js"), ...require("./viewer-pane.js"),
    }
    : { ...(root.StructureViewerCore || {}), ...(root.StructureViewerUI || {}) };
  const api = factory(dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerUI = Object.assign(root.StructureViewerUI || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (dependencies) {
  "use strict";

  async function createMultiInstanceHarness({
    sourceStructure,
    rendererAdapter,
    containers,
    workspace = dependencies.createWorkspaceStore(),
    resizeObserverFactory,
  } = {}) {
    if (!sourceStructure?.structureId) throw new TypeError("Multi-instance harness requires a SourceStructure.");
    if (!Array.isArray(containers) || containers.length === 0) throw new TypeError("Multi-instance harness requires one or more containers.");
    if (!workspace.getState().structures[sourceStructure.structureId]) workspace.addStructure(sourceStructure);
    const panes = [];

    function disposePane(viewerId) {
      const pane = panes.find((candidate) => candidate.viewerId === viewerId);
      if (!pane || pane.disposed) return false;
      pane.disposed = true;
      pane.controller.dispose();
      pane.instance.dispose();
      workspace.close(viewerId);
      return true;
    }

    try {
      for (let index = 0; index < containers.length; index += 1) {
        const viewerId = workspace.createViewer({ name: `Test pane ${index + 1}`, structureId: sourceStructure.structureId });
        let instance = null;
        let controller = null;
        try {
          instance = new dependencies.ViewerInstance({
            viewerId, workspace, rendererAdapter, ...(resizeObserverFactory ? { resizeObserverFactory } : {}),
          });
          instance.mount(containers[index]);
          controller = dependencies.createViewerPaneController({ viewerId, workspace, viewerInstance: instance });
          const definition = workspace.getState().instances[viewerId].sceneDefinition;
          const scene = await dependencies.buildMolecularScene(sourceStructure, definition);
          await instance.updateScene(scene);
          panes.push({ viewerId, instance, controller, container: containers[index], disposed: false });
        } catch (error) {
          controller?.dispose();
          instance?.dispose();
          if (workspace.getState().instances[viewerId]) workspace.close(viewerId);
          throw error;
        }
      }
    } catch (error) {
      [...panes].forEach((pane) => disposePane(pane.viewerId));
      throw error;
    }

    return Object.freeze({
      workspace,
      panes,
      disposePane,
      dispose() { [...panes].forEach((pane) => disposePane(pane.viewerId)); },
    });
  }

  return { createMultiInstanceHarness };
});
;
/* web/structure-viewer/ui/workspace-tabs.js */
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerUI = Object.assign(root.StructureViewerUI || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function createWorkspaceTabs({
    workspace,
    container,
    onActivate = (viewerId) => workspace.activate(viewerId),
    onClose = (viewerId) => workspace.close(viewerId),
    onReorder = (order) => workspace.reorder(order),
  } = {}) {
    if (!workspace?.getState || !workspace?.subscribe) throw new TypeError("Workspace tabs require a Workspace store.");
    if (!container?.ownerDocument || typeof container.replaceChildren !== "function") throw new TypeError("Workspace tabs require a DOM container.");
    let disposed = false;
    let draggedViewerId = null;

    container.setAttribute?.("role", "tablist");
    if (!container.getAttribute?.("aria-label")) container.setAttribute?.("aria-label", "Open structures");

    function tabLabel(state, viewerId) {
      const viewer = state.instances[viewerId];
      const source = viewer.structureId ? state.structures[viewer.structureId] : null;
      const model = source?.models?.find((candidate) => candidate.modelId === viewer.sceneDefinition?.modelId);
      return model?.label ? `${viewer.name} · ${model.label}` : viewer.name;
    }

    function activateByIndex(state, index) {
      if (!state.order.length) return;
      const viewerId = state.order[(index + state.order.length) % state.order.length];
      onActivate(viewerId);
      const current = Array.from(container.children || []).find((child) => child.dataset?.viewerId === viewerId);
      (current?.querySelector?.('[role="tab"]') || current?.children?.[0] || current)?.focus?.();
    }

    function reorderBy(viewerId, offset) {
      const state = workspace.getState();
      const from = state.order.indexOf(viewerId);
      const to = Math.max(0, Math.min(state.order.length - 1, from + offset));
      if (from < 0 || from === to) return;
      const order = [...state.order];
      order.splice(to, 0, order.splice(from, 1)[0]);
      onReorder(order);
      const current = Array.from(container.children || []).find((child) => child.dataset?.viewerId === viewerId);
      (current?.querySelector?.('[role="tab"]') || current?.children?.[0] || current)?.focus?.();
    }

    function render(state = workspace.getState()) {
      if (disposed) return;
      if (!state.order.length) {
        const empty = container.ownerDocument.createElement("span");
        empty.className = "workspace-tabs-empty";
        empty.textContent = "No viewers open";
        empty.setAttribute("role", "status");
        container.replaceChildren(empty);
        return;
      }
      const tabs = state.order.map((viewerId) => {
        const item = container.ownerDocument.createElement("div");
        item.className = "workspace-tab-item";
        item.dataset.viewerId = viewerId;
        item.draggable = true;
        const button = container.ownerDocument.createElement("button");
        button.type = "button";
        button.className = "workspace-tab";
        button.dataset.viewerId = viewerId;
        button.id = `workspace-tab-${viewerId}`;
        button.textContent = tabLabel(state, viewerId);
        button.setAttribute("role", "tab");
        button.setAttribute("aria-selected", String(state.activeViewerId === viewerId));
        button.setAttribute("aria-controls", `viewer-pane-${viewerId}`);
        button.setAttribute("aria-label", button.textContent);
        button.tabIndex = state.activeViewerId === viewerId ? 0 : -1;
        button.addEventListener("click", () => onActivate(viewerId));
        button.addEventListener("keydown", (event) => {
          const index = state.order.indexOf(viewerId);
          if (event.altKey && event.key === "ArrowRight") { event.preventDefault(); reorderBy(viewerId, 1); }
          else if (event.altKey && event.key === "ArrowLeft") { event.preventDefault(); reorderBy(viewerId, -1); }
          else if (event.key === "ArrowRight") { event.preventDefault(); activateByIndex(workspace.getState(), index + 1); }
          else if (event.key === "ArrowLeft") { event.preventDefault(); activateByIndex(workspace.getState(), index - 1); }
          else if (event.key === "Home") { event.preventDefault(); activateByIndex(workspace.getState(), 0); }
          else if (event.key === "End") { event.preventDefault(); activateByIndex(workspace.getState(), state.order.length - 1); }
        });
        const close = container.ownerDocument.createElement("button");
        close.type = "button";
        close.className = "workspace-tab-close";
        close.textContent = "×";
        close.setAttribute("aria-label", `Close ${button.textContent}`);
        close.addEventListener("click", (event) => { event.stopPropagation?.(); onClose(viewerId); });
        item.addEventListener("dragstart", (event) => {
          draggedViewerId = viewerId;
          event.dataTransfer?.setData?.("text/plain", viewerId);
          if (event.dataTransfer) event.dataTransfer.effectAllowed = "move";
        });
        item.addEventListener("dragover", (event) => { event.preventDefault(); if (event.dataTransfer) event.dataTransfer.dropEffect = "move"; });
        item.addEventListener("drop", (event) => {
          event.preventDefault();
          const sourceId = draggedViewerId || event.dataTransfer?.getData?.("text/plain");
          draggedViewerId = null;
          const current = workspace.getState().order;
          const from = current.indexOf(sourceId);
          const to = current.indexOf(viewerId);
          if (from < 0 || to < 0 || from === to) return;
          const order = [...current];
          order.splice(to, 0, order.splice(from, 1)[0]);
          onReorder(order);
        });
        item.addEventListener("dragend", () => { draggedViewerId = null; });
        item.append(button, close);
        return item;
      });
      container.replaceChildren(...tabs);
    }

    const unsubscribe = workspace.subscribe(render);
    render();
    return Object.freeze({ render, dispose() { if (!disposed) { disposed = true; unsubscribe(); } } });
  }

  return { createWorkspaceTabs };
});
;
/* web/structure-viewer/transfer/window-transfer.js */
(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? {
        ...require("../core/validators.js"),
        ...require("../core/canonical-json.js"),
        ...require("../core/scene-definition.js"),
        ...require("../workspace/workspace-store.js"),
      }
    : root.StructureViewerCore;
  const api = factory(root, dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerTransfer = Object.assign(root.StructureViewerTransfer || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (root, dependencies) {
  "use strict";

  const SNAPSHOT_SCHEMA = "rt-detached-snapshot/1";
  const MESSAGE_SCHEMA = "rt-window-transfer/1";
  const DEFAULT_TTL_MS = 10_000;
  const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);

  function exactFields(value, allowed, path) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${path} must be an object.`);
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${path} has an unsupported prototype.`);
    Object.keys(value).forEach((key) => {
      if (FORBIDDEN_KEYS.has(key)) throw new TypeError(`${path}.${key} is a forbidden prototype field.`);
      if (!allowed.has(key)) throw new TypeError(`${path}.${key} is an unknown field.`);
    });
  }

  function validatePlainData(value, path = "$", seen = new WeakSet()) {
    if (value === null || ["string", "boolean"].includes(typeof value)) return;
    if (typeof value === "number") {
      if (!Number.isFinite(value)) throw new TypeError(`${path} must contain only finite numbers.`);
      return;
    }
    if (typeof value !== "object") throw new TypeError(`${path} contains unsupported ${typeof value} data.`);
    if (seen.has(value)) throw new TypeError(`${path} contains a cyclic value.`);
    seen.add(value);
    if (Array.isArray(value)) value.forEach((entry, index) => validatePlainData(entry, `${path}[${index}]`, seen));
    else {
      const prototype = Object.getPrototypeOf(value);
      if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${path} has an unsupported prototype.`);
      Object.keys(value).forEach((key) => {
        if (FORBIDDEN_KEYS.has(key)) throw new TypeError(`${path}.${key} is a forbidden prototype field.`);
        validatePlainData(value[key], `${path}.${key}`, seen);
      });
    }
    seen.delete(value);
  }

  function clone(value) {
    if (Array.isArray(value)) return value.map(clone);
    if (value && typeof value === "object") {
      const result = {};
      Object.keys(value).forEach((key) => { result[key] = clone(value[key]); });
      return result;
    }
    return value;
  }

  function deepFreeze(value, seen = new WeakSet()) {
    if (!value || typeof value !== "object" || seen.has(value)) return value;
    seen.add(value);
    Object.values(value).forEach((entry) => deepFreeze(entry, seen));
    return Object.freeze(value);
  }

  function validateViewShape(view) {
    exactFields(view, new Set(["representation", "labels", "hydrogenDisplay", "backgroundColor", "crystalDisplay"]), "snapshot.view");
    exactFields(view.representation, new Set(["kind", "colorScheme", "multipleBonds", "uniformColor", "surfaceOpacity"]), "snapshot.view.representation");
    exactFields(view.labels, new Set(["mode", "showSelectionOrder"]), "snapshot.view.labels");
    if (view.crystalDisplay !== undefined) exactFields(view.crystalDisplay, new Set(["showUnitCell", "showCellAxes"]), "snapshot.view.crystalDisplay");
  }

  function validateCameraShape(camera) {
    exactFields(camera, new Set(["target", "rotation", "distance", "projection"]), "snapshot.camera");
  }

  function validateIdentityShape(identity, path) {
    exactFields(identity, new Set(["sourceStructureId", "modelId", "siteId", "disorderKey", "periodicImage"]), path);
    if (identity.periodicImage !== undefined) {
      exactFields(identity.periodicImage, new Set(["symmetryOperationId", "cellTranslation"]), `${path}.periodicImage`);
    }
  }

  function validateMeasurementShape(measurement, index) {
    const path = `snapshot.measurements[${index}]`;
    exactFields(measurement, new Set(["measurementId", "kind", "atomIdentities", "visible"]), path);
    if (!Array.isArray(measurement.atomIdentities)) throw new TypeError(`${path}.atomIdentities must be an array.`);
    measurement.atomIdentities.forEach((identity, atomIndex) => validateIdentityShape(identity, `${path}.atomIdentities[${atomIndex}]`));
  }

  function validateSceneShape(scene) {
    exactFields(scene, new Set(["schema", "modelId", "mode", "molecular", "crystal"]), "snapshot.sceneDefinition");
    if (scene.molecular !== undefined) exactFields(scene.molecular, new Set(["hydrogenFilter"]), "snapshot.sceneDefinition.molecular");
    if (scene.crystal !== undefined) {
      exactFields(scene.crystal, new Set([
        "content", "replication", "wrapFractionalCoordinates", "disorderMode", "minimumOccupancy",
        "packingRadiusAngstrom", "disorderAssembly", "disorderGroup",
      ]), "snapshot.sceneDefinition.crystal");
      exactFields(scene.crystal.replication, new Set(["a", "b", "c"]), "snapshot.sceneDefinition.crystal.replication");
    }
  }

  function exactOptional(value, allowed, path) {
    if (value !== undefined) exactFields(value, allowed, path);
  }

  function validateSourceShape(source) {
    exactFields(source.source, new Set(["format", "originalFilename", "byteLength", "canonicalFormat", "mediaType"]), "snapshot.sourceStructure.source");
    source.models.forEach((model, modelIndex) => {
      const modelPath = `snapshot.sourceStructure.models[${modelIndex}]`;
      exactFields(model, new Set(["modelId", "label", "atomSites", "bonds", "residues"]), modelPath);
      model.atomSites.forEach((site, siteIndex) => {
        const sitePath = `${modelPath}.atomSites[${siteIndex}]`;
        exactFields(site, new Set([
          "siteId", "element", "occupancy", "properties", "label", "formalCharge", "isotope", "altLocation",
          "disorderAssembly", "disorderGroup", "residueId", "chainId", "sourceRow", "fractional", "cartesian",
        ]), sitePath);
        exactOptional(site.fractional, new Set(["frac"]), `${sitePath}.fractional`);
        exactOptional(site.cartesian, new Set(["cart"]), `${sitePath}.cartesian`);
      });
      model.bonds.forEach((bond, bondIndex) => {
        const bondPath = `${modelPath}.bonds[${bondIndex}]`;
        exactFields(bond, new Set([
          "bondId", "beginSiteId", "endSiteId", "order", "provenance", "aromatic", "beginImage", "endImage",
        ]), bondPath);
        ["beginImage", "endImage"].forEach((field) => exactOptional(bond[field], new Set(["symmetryOperationId", "cellTranslation"]), `${bondPath}.${field}`));
      });
      (model.residues || []).forEach((residue, residueIndex) => exactFields(residue, new Set([
        "residueId", "name", "atomSiteIds", "sequenceNumber", "insertionCode", "chainId",
      ]), `${modelPath}.residues[${residueIndex}]`));
    });
    if (source.crystal !== undefined) {
      exactFields(source.crystal, new Set(["cell", "spaceGroup", "symmetryOperations", "metadata"]), "snapshot.sourceStructure.crystal");
      exactFields(source.crystal.cell, new Set([
        "a", "b", "c", "alphaDeg", "betaDeg", "gammaDeg", "volume", "fracToCart", "cartToFrac",
      ]), "snapshot.sourceStructure.crystal.cell");
      exactFields(source.crystal.spaceGroup, new Set(["hm", "hall", "number"]), "snapshot.sourceStructure.crystal.spaceGroup");
      source.crystal.symmetryOperations.forEach((operation, operationIndex) => {
        const operationPath = `snapshot.sourceStructure.crystal.symmetryOperations[${operationIndex}]`;
        exactFields(operation, new Set([
          "operationId", "canonicalExpression", "sourceExpression", "rotation", "translation", "rotationExact", "translationExact", "rotationNumeric", "translationNumeric",
        ]), operationPath);
        [...operation.rotationExact, ...operation.translationExact, ...(operation.translation || [])].forEach((rational, rationalIndex) => {
          exactFields(rational, new Set(["numerator", "denominator"]), `${operationPath}.rational[${rationalIndex}]`);
        });
      });
    }
  }

  function sameData(left, right) {
    return dependencies.canonicalizeRfc8785(left) === dependencies.canonicalizeRfc8785(right);
  }

  async function createDetachedSnapshot(input) {
    exactFields(input, new Set([
      "schema", "sourceStructure", "sceneDefinition", "view", "camera", "selection", "measurements", "crystalSettings",
    ]), "snapshot");
    validatePlainData(input, "snapshot");
    if (input.schema !== undefined && input.schema !== SNAPSHOT_SCHEMA) throw new TypeError("snapshot.schema is invalid.");
    exactFields(input.sourceStructure, new Set([
      "schema", "displayName", "structureType", "source", "models", "metadata", "warnings", "crystal", "structureId", "contentIdentity",
    ]), "snapshot.sourceStructure");
    validateSourceShape(input.sourceStructure);
    dependencies.validateSourceStructure(input.sourceStructure);
    const computedIdentity = await dependencies.computeContentIdentity(input.sourceStructure);
    if (computedIdentity !== input.sourceStructure.contentIdentity) throw new TypeError("SourceStructure contentIdentity does not match its scientific content.");
    validateSceneShape(input.sceneDefinition);
    validateViewShape(input.view);
    validateCameraShape(input.camera);
    if (!Array.isArray(input.selection)) throw new TypeError("snapshot.selection must be an array.");
    input.selection.forEach((identity, index) => validateIdentityShape(identity, `snapshot.selection[${index}]`));
    if (!Array.isArray(input.measurements)) throw new TypeError("snapshot.measurements must be an array.");
    input.measurements.forEach(validateMeasurementShape);

    const sceneDefinition = dependencies.normalizeSceneDefinition(input.sceneDefinition);
    const expectedCrystalSettings = sceneDefinition.mode === "crystal" ? sceneDefinition.crystal : null;
    if (!sameData(input.crystalSettings, expectedCrystalSettings)) throw new TypeError("snapshot.crystalSettings must match the normalized SceneDefinition.");

    const workspace = dependencies.createWorkspaceStore({ uuid: () => "viewer:detached-snapshot-validation" });
    workspace.addStructure(input.sourceStructure);
    const viewerId = workspace.createViewer({
      structureId: input.sourceStructure.structureId,
      sceneDefinition,
      view: input.view,
      camera: input.camera,
      selection: input.selection,
      measurements: input.measurements,
    });
    const validated = workspace.getState().instances[viewerId];
    const snapshot = clone({
      schema: SNAPSHOT_SCHEMA,
      sourceStructure: input.sourceStructure,
      sceneDefinition: validated.sceneDefinition,
      view: validated.view,
      camera: validated.camera,
      selection: validated.selection,
      measurements: validated.measurements,
      crystalSettings: expectedCrystalSettings,
    });
    workspace.close(viewerId);
    return deepFreeze(snapshot);
  }

  async function serializeSnapshot(snapshot) {
    return dependencies.canonicalizeRfc8785(await createDetachedSnapshot(snapshot));
  }

  async function deserializeSnapshot(serialized) {
    if (typeof serialized !== "string" || !serialized) throw new TypeError("Serialized snapshot must be a non-empty string.");
    let parsed;
    try { parsed = JSON.parse(serialized); }
    catch (_error) { throw new TypeError("Serialized snapshot is not valid JSON."); }
    return createDetachedSnapshot(parsed);
  }

  function bytesToBase64Url(bytes) {
    let base64;
    if (typeof Buffer !== "undefined") base64 = Buffer.from(bytes).toString("base64");
    else {
      let binary = "";
      bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
      base64 = root.btoa(binary);
    }
    return base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function defaultRandomBytes() {
    const bytes = new Uint8Array(16);
    if (!root?.crypto?.getRandomValues) throw new Error("Secure random bytes are unavailable.");
    root.crypto.getRandomValues(bytes);
    return bytes;
  }

  function validateNonce(value) {
    if (typeof value !== "string" || !/^[A-Za-z0-9_-]{22}$/.test(value)) throw new TypeError("Transfer nonce is invalid.");
    return value;
  }

  function validateMessage(data) {
    exactFields(data, new Set(data?.type === "snapshot" ? ["schema", "type", "nonce", "snapshot"] : ["schema", "type", "nonce"]), "message");
    if (data.schema !== MESSAGE_SCHEMA) throw new TypeError("Transfer message schema is invalid.");
    if (!["ready", "snapshot", "ack"].includes(data.type)) throw new TypeError("Transfer message type is invalid.");
    validateNonce(data.nonce);
    return data;
  }

  function createTransferSession({ role, nonce, expectedSource, expectedOrigin, now = Date.now, randomBytes = defaultRandomBytes, ttlMs = DEFAULT_TTL_MS } = {}) {
    if (!['parent', 'child'].includes(role)) throw new TypeError("Transfer role is invalid.");
    if (!expectedSource || (typeof expectedSource !== "object" && typeof expectedSource !== "function")) throw new TypeError("Transfer expected source is invalid.");
    if (typeof expectedOrigin !== "string" || !expectedOrigin) throw new TypeError("Transfer expected origin is invalid.");
    if (typeof now !== "function" || !Number.isFinite(ttlMs) || ttlMs <= 0) throw new TypeError("Transfer expiry settings are invalid.");
    const sessionNonce = role === "parent"
      ? validateNonce(nonce || bytesToBase64Url(randomBytes()))
      : validateNonce(nonce);
    const createdAt = now();
    if (!Number.isFinite(createdAt)) throw new TypeError("Transfer clock returned an invalid value.");
    let state = role === "parent" ? "waiting-ready" : "new";

    function assertLive() {
      if (state === "consumed") throw new Error("Transfer session is consumed; replay is not allowed.");
      if ((now() - createdAt) > ttlMs) throw new Error("Transfer session has expired.");
    }

    function createMessage(type, payload) {
      assertLive();
      if (role === "child" && type === "ready" && state === "new") {
        state = "waiting-snapshot";
        return Object.freeze({ schema: MESSAGE_SCHEMA, type, nonce: sessionNonce });
      }
      if (role === "parent" && type === "snapshot" && state === "ready") {
        state = "creating-snapshot";
        return createDetachedSnapshot(payload).then(
          (snapshot) => {
            assertLive();
            state = "waiting-ack";
            return deepFreeze({ schema: MESSAGE_SCHEMA, type, nonce: sessionNonce, snapshot });
          },
          (error) => {
            state = "ready";
            throw error;
          },
        );
      }
      if (role === "child" && type === "ack" && state === "snapshot-received") {
        state = "consumed";
        return Object.freeze({ schema: MESSAGE_SCHEMA, type, nonce: sessionNonce });
      }
      throw new Error(`Transfer message ${type} is invalid in state ${state}.`);
    }

    async function receive(event) {
      assertLive();
      if (!event || event.source !== expectedSource) throw new Error("Transfer message source does not match the expected window.");
      if (event.origin !== expectedOrigin) throw new Error("Transfer message origin does not match the expected origin.");
      const data = validateMessage(event.data);
      if (data.nonce !== sessionNonce) throw new Error("Transfer message nonce does not match this session.");
      if (role === "parent" && data.type === "ready" && state === "waiting-ready") {
        state = "ready";
        return Object.freeze({ type: "ready" });
      }
      if (role === "child" && data.type === "snapshot" && state === "waiting-snapshot") {
        state = "validating-snapshot";
        try {
          const snapshot = await createDetachedSnapshot(data.snapshot);
          assertLive();
          state = "snapshot-received";
          return Object.freeze({ type: "snapshot", snapshot });
        } catch (error) {
          state = "waiting-snapshot";
          throw error;
        }
      }
      if (role === "parent" && data.type === "ack" && state === "waiting-ack") {
        state = "consumed";
        return Object.freeze({ type: "ack" });
      }
      throw new Error(`Transfer message ${data.type} is invalid in state ${state}.`);
    }

    return Object.freeze({
      role,
      nonce: sessionNonce,
      createdAt,
      expiresAt: createdAt + ttlMs,
      getState: () => state,
      createMessage,
      receive,
    });
  }

  return {
    SNAPSHOT_SCHEMA,
    MESSAGE_SCHEMA,
    createDetachedSnapshot,
    serializeSnapshot,
    deserializeSnapshot,
    createTransferSession,
  };
});
;
/* web/structure-viewer/share/share-v2.js */
(function (root, factory) {
  const api = factory(root);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureShareV2 = api;
})(typeof window !== "undefined" ? window : globalThis, function (root) {
  "use strict";

  const SCHEMA = "structure-share/2";
  const LEGACY_SCHEMA = "structure-share/1";
  const WARNING_LENGTH = 8000;
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
  const PAYLOAD_FIELDS = new Set(["schema", "elements", "coordinates", "charge", "multiplicity", "profile"]);
  const WIRE_FIELDS = new Set(["s", "e", "a", "c", "q", "m", "z", "o"]);
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
    if (payload?.schema === SCHEMA) throw new Error("Structure share v2 must use the canonical wire payload.");
    throw new Error("Unsupported structure share payload.");
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
      charge: 0,
      multiplicity: 1,
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
    if (Object.keys(payload).some((field) => !PAYLOAD_FIELDS.has(field))) {
      throw new Error("Structure share payload contains unsupported fields.");
    }
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
    if (Object.hasOwn(payload, "charge") && !Number.isInteger(payload.charge)) throw new Error("Structure charge must be an integer.");
    if (Object.hasOwn(payload, "multiplicity") && (!Number.isInteger(payload.multiplicity) || payload.multiplicity < 1)) {
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
    if (Object.keys(wire).some((field) => !WIRE_FIELDS.has(field))) {
      throw new Error("Structure share v2 wire payload contains unsupported fields.");
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
        qrAssetsPromise = loadScript(assetUrl("../vendor/qrcode-generator-1.4.4.min.js"))
          .then(() => root.StructureShareQr || loadScript(assetUrl("./qr-share.js")))
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
      const encoded = new URL(url).hash.match(/(?:^#|&)data=([^&]+)/)?.[1] || "";
      const sourceBytes = new TextEncoder().encode(String(options?.xyz || "")).length;
      const decodedBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
      const encodedBytes = new TextEncoder().encode(encoded).length;
      const urlBytes = new TextEncoder().encode(url).length;
      message.className = `structure-share-message${description.warning ? " warn" : ""}`;
      message.textContent = `${sourceBytes.toLocaleString()} source bytes · ${decodedBytes.toLocaleString()} decoded bytes · ${encodedBytes.toLocaleString()} encoded bytes · ${urlBytes.toLocaleString()} URL bytes. ${description.text}`;
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
;
/* web/structure-viewer/share/share-v3.js */
(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? { ...require("../core/constants.js"), ...require("../core/canonical-json.js"), ...require("../core/validators.js"), ...require("../core/structure-factory.js"), ...require("../core/scene-definition.js"), ...require("../crystal/unit-cell.js"), ...require("../crystal/symmetry.js") }
    : { ...root.StructureViewerCore, ...root.StructureViewerCrystal };
  const api = factory(dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureShareV3 = api;
})(typeof window !== "undefined" ? window : globalThis, function (dependencies) {
  "use strict";

  const SCHEMA = "structure-share/3";
  const SHARED_SOURCE_SCHEMA = "rt-shared-source/1";
  const FORBIDDEN_KEYS = new Set(["__proto__", "prototype", "constructor"]);
  const ELEMENTS = new Set((
    "H He Li Be B C N O F Ne Na Mg Al Si P S Cl Ar K Ca Sc Ti V Cr Mn Fe Co Ni Cu Zn Ga Ge As Se Br Kr " +
    "Rb Sr Y Zr Nb Mo Tc Ru Rh Pd Ag Cd In Sn Sb Te I Xe Cs Ba La Ce Pr Nd Pm Sm Eu Gd Tb Dy Ho Er Tm Yb Lu " +
    "Hf Ta W Re Os Ir Pt Au Hg Tl Pb Bi Po At Rn Fr Ra Ac Th Pa U Np Pu Am Cm Bk Cf Es Fm Md No Lr Rf Db Sg Bh Hs Mt Ds Rg Cn Nh Fl Mc Lv Ts Og"
  ).split(" "));

  function clone(value) {
    if (Array.isArray(value)) return value.map(clone);
    if (value && typeof value === "object") {
      const copy = {};
      Object.keys(value).forEach((key) => { if (value[key] !== undefined) copy[key] = clone(value[key]); });
      return copy;
    }
    return value;
  }

  function decimal(value) {
    if (!Number.isFinite(value)) throw new TypeError("Share v3 numeric values must be finite.");
    return Object.is(value, -0) ? "0" : String(value);
  }

  function bytesToBase64Url(bytes) {
    let binary = "";
    for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
    const encoded = typeof btoa === "function" ? btoa(binary) : Buffer.from(bytes).toString("base64");
    return encoded.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function base64UrlToBytes(value) {
    const text = String(value || "");
    if (!text || !/^[A-Za-z0-9_-]+$/.test(text) || text.length % 4 === 1) throw new TypeError("Invalid share v3 base64url data.");
    const base64 = text.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(text.length / 4) * 4, "=");
    const binary = typeof atob === "function" ? atob(base64) : Buffer.from(base64, "base64").toString("binary");
    return Uint8Array.from(binary, (character) => character.charCodeAt(0));
  }

  async function transformBytes(bytes, TransformClass, format, maximumBytes = Infinity) {
    const stream = new Blob([bytes]).stream().pipeThrough(new TransformClass(format));
    const reader = stream.getReader();
    const chunks = []; let length = 0;
    try {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        length += value.byteLength;
        if (length > maximumBytes) throw new RangeError("Share v3 decoded JSON exceeds the decoded size limit.");
        chunks.push(value);
      }
    } finally { reader.releaseLock(); }
    const result = new Uint8Array(length); let offset = 0;
    chunks.forEach((chunk) => { result.set(chunk, offset); offset += chunk.byteLength; });
    return result;
  }

  function object(value, path) {
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new TypeError(`${path} must be an object.`);
    const prototype = Object.getPrototypeOf(value);
    if (prototype !== Object.prototype && prototype !== null) throw new TypeError(`${path} has an unsupported prototype.`);
    return value;
  }

  function allow(value, fields, path) {
    object(value, path);
    const allowed = new Set(fields);
    Object.keys(value).forEach((key) => {
      if (FORBIDDEN_KEYS.has(key)) throw new TypeError(`${path}.${key} is a forbidden prototype field.`);
      if (!allowed.has(key)) throw new TypeError(`${path}.${key} is an unknown field.`);
    });
  }

  function safeValue(value, path) {
    const maximumDepth = 64;
    const maximumNodes = 100000;
    const maximumContainerEntries = 100000;
    const active = new WeakSet();
    const stack = [{ value, path, depth: 0, entered: false, index: 0, keys: null }];
    let nodes = 0;
    while (stack.length) {
      const current = stack[stack.length - 1];
      if (!current.entered) {
        nodes += 1;
        if (nodes > maximumNodes) throw new RangeError(`${path} exceeds the structural node limit.`);
        if (current.depth > maximumDepth) throw new RangeError(`${current.path} exceeds the structural depth limit.`);
        const item = current.value;
        if (!item || typeof item !== "object") {
          if (typeof item === "number" && !Number.isFinite(item)) throw new TypeError(`${current.path} must be finite.`);
          if (!["string", "number", "boolean", "object"].includes(typeof item)) throw new TypeError(`${current.path} has an unsupported value type.`);
          stack.pop();
          continue;
        }
        if (active.has(item)) throw new TypeError(`${current.path} is cyclic.`);
        active.add(item);
        current.entered = true;
        if (Array.isArray(item)) {
          if (item.length > maximumContainerEntries) throw new RangeError(`${current.path} exceeds the container entry limit.`);
        } else {
          object(item, current.path);
          current.keys = Object.keys(item);
          if (current.keys.length > maximumContainerEntries) throw new RangeError(`${current.path} exceeds the container entry limit.`);
        }
        continue;
      }
      const item = current.value;
      const length = Array.isArray(item) ? item.length : current.keys.length;
      if (current.index >= length) {
        active.delete(item);
        stack.pop();
        continue;
      }
      const key = Array.isArray(item) ? current.index : current.keys[current.index];
      current.index += 1;
      if (!Array.isArray(item) && FORBIDDEN_KEYS.has(key)) throw new TypeError(`${current.path}.${key} is a forbidden prototype field.`);
      stack.push({
        value: item[key],
        path: Array.isArray(item) ? `${current.path}[${key}]` : `${current.path}.${key}`,
        depth: current.depth + 1,
        entered: false,
        index: 0,
        keys: null,
      });
    }
  }

  function validateMetadataRecord(value, path) {
    object(value, path);
    Object.entries(value).forEach(([key, entry]) => {
      const entryPath = `${path}.${key}`;
      if (entry === null || ["string", "boolean"].includes(typeof entry)) return;
      if (typeof entry === "number") {
        if (!Number.isFinite(entry)) throw new TypeError(`${entryPath} must be finite.`);
        return;
      }
      if (Array.isArray(entry) && (entry.every((item) => typeof item === "string")
        || entry.every((item) => typeof item === "number" && Number.isFinite(item)))) return;
      throw new TypeError(`${entryPath} is an invalid metadata value.`);
    });
  }

  function array(value, path, limit) {
    if (!Array.isArray(value)) throw new TypeError(`${path} must be an array.`);
    if (value.length > limit) throw new RangeError(`${path} exceeds its limit.`);
    return value;
  }

  function string(value, path) {
    if (typeof value !== "string" || !value) throw new TypeError(`${path} must be a non-empty string.`);
  }

  function int3(value, path) {
    if (!Array.isArray(value) || value.length !== 3 || !value.every(Number.isSafeInteger)) throw new TypeError(`${path} must contain three safe integers.`);
  }

  function validateImage(value, path) {
    allow(value, ["symmetryOperationId", "cellTranslation"], path);
    string(value.symmetryOperationId, `${path}.symmetryOperationId`); int3(value.cellTranslation, `${path}.cellTranslation`);
  }

  function gcd(left, right) {
    let a = Math.abs(left); let b = Math.abs(right);
    while (b) [a, b] = [b, a % b];
    return a;
  }

  function validateRational(value, path) {
    allow(value, ["numerator", "denominator"], path);
    if (!Number.isSafeInteger(value.numerator) || !Number.isSafeInteger(value.denominator) || value.denominator <= 0
      || gcd(value.numerator, value.denominator) !== 1 || (value.numerator === 0 && value.denominator !== 1)) {
      throw new TypeError(`${path} is an invalid reduced rational.`);
    }
  }

  function validateViewSettings(shared, modelIds) {
    allow(shared, ["modelId", "mode", "scene", "view", "camera"], "$.view");
    string(shared.modelId, "$.view.modelId");
    if (!modelIds.has(shared.modelId)) throw new TypeError("$.view.modelId references an unknown model.");
    if (!["molecular", "crystal", "macromolecular"].includes(shared.mode)) throw new TypeError("$.view.mode is invalid.");
    allow(shared.scene, ["molecular", "crystal"], "$.view.scene");
    const sceneKey = shared.mode === "crystal" ? "crystal" : "molecular";
    const irrelevantSceneKey = sceneKey === "crystal" ? "molecular" : "crystal";
    if (shared.scene[sceneKey] === undefined || shared.scene[irrelevantSceneKey] !== undefined) {
      throw new TypeError(`$.view.scene must contain only the ${sceneKey} settings for ${shared.mode} mode.`);
    }
    if (shared.scene.molecular !== undefined) allow(shared.scene.molecular, ["hydrogenFilter"], "$.view.scene.molecular");
    if (shared.scene.crystal !== undefined) {
      allow(shared.scene.crystal, ["content", "replication", "wrapFractionalCoordinates", "disorderMode", "minimumOccupancy", "packingRadiusAngstrom", "disorderAssembly", "disorderGroup"], "$.view.scene.crystal");
      if (shared.scene.crystal.replication !== undefined) {
        allow(shared.scene.crystal.replication, ["a", "b", "c"], "$.view.scene.crystal.replication");
      }
    }
    const normalizedScene = dependencies.normalizeSceneDefinition({ modelId: shared.modelId, mode: shared.mode, ...(shared.scene || {}) });
    if (dependencies.canonicalizeRfc8785(shared.scene[sceneKey]) !== dependencies.canonicalizeRfc8785(normalizedScene[sceneKey])) {
      throw new TypeError(`$.view.scene.${sceneKey} must be canonical and fully validated.`);
    }
    allow(shared.view, ["representation", "labels", "hydrogenDisplay", "backgroundColor", "crystalDisplay"], "$.view.view");
    allow(shared.view.representation, ["kind", "colorScheme", "multipleBonds", "uniformColor", "surfaceOpacity"], "$.view.view.representation");
    if (!["ball-stick", "stick", "spacefill", "line", "cartoon", "ribbon", "surface"].includes(shared.view.representation.kind)) throw new TypeError("Viewer representation is invalid.");
    if (!["element", "chain", "residue", "occupancy", "uniform"].includes(shared.view.representation.colorScheme) || typeof shared.view.representation.multipleBonds !== "boolean") throw new TypeError("Viewer representation is invalid.");
    if (shared.view.representation.uniformColor !== undefined
      && (typeof shared.view.representation.uniformColor !== "string" || !shared.view.representation.uniformColor)) {
      throw new TypeError("Viewer representation uniformColor is invalid.");
    }
    if (shared.view.representation.surfaceOpacity !== undefined
      && (!Number.isFinite(shared.view.representation.surfaceOpacity) || shared.view.representation.surfaceOpacity < 0 || shared.view.representation.surfaceOpacity > 1)) {
      throw new TypeError("Viewer representation surfaceOpacity is invalid.");
    }
    allow(shared.view.labels, ["mode", "showSelectionOrder"], "$.view.view.labels");
    if (!["none", "element", "index", "element-index", "residue"].includes(shared.view.labels.mode) || typeof shared.view.labels.showSelectionOrder !== "boolean") throw new TypeError("Viewer labels are invalid.");
    if (!["show", "hide"].includes(shared.view.hydrogenDisplay)) throw new TypeError("Viewer hydrogen display is invalid.");
    if (shared.view.backgroundColor !== undefined && (typeof shared.view.backgroundColor !== "string" || !shared.view.backgroundColor)) {
      throw new TypeError("Viewer backgroundColor is invalid.");
    }
    if (shared.view.crystalDisplay !== undefined) {
      allow(shared.view.crystalDisplay, ["showUnitCell", "showCellAxes"], "$.view.view.crystalDisplay");
      if (typeof shared.view.crystalDisplay.showUnitCell !== "boolean" || typeof shared.view.crystalDisplay.showCellAxes !== "boolean") throw new TypeError("Viewer crystal display is invalid.");
    }
    if (shared.camera !== undefined) {
      allow(shared.camera, ["target", "rotation", "distance", "projection"], "$.view.camera");
      if (!Array.isArray(shared.camera.target) || shared.camera.target.length !== 3 || !shared.camera.target.every(Number.isFinite)
        || !Array.isArray(shared.camera.rotation) || shared.camera.rotation.length !== 4 || !shared.camera.rotation.every(Number.isFinite)
        || !Number.isFinite(shared.camera.distance) || shared.camera.distance <= 0
        || !["perspective", "orthographic"].includes(shared.camera.projection)) throw new TypeError("Viewer camera is invalid.");
    }
  }

  function sharedAtom(site) {
    const atom = { siteId: site.siteId, element: site.element, occupancy: site.occupancy };
    ["label", "formalCharge", "isotope", "altLocation", "disorderAssembly", "disorderGroup", "residueId", "chainId", "sourceRow"].forEach((key) => {
      if (site[key] !== undefined) atom[key] = site[key];
    });
    if (site.properties !== undefined) atom.properties = clone(site.properties);
    if (site.cartesian) atom.cartesian = site.cartesian.cart.map(decimal);
    if (site.fractional) atom.fractional = site.fractional.frac.map(decimal);
    return atom;
  }

  function sharedBond(bond) {
    const result = {
      bondId: bond.bondId, beginSiteId: bond.beginSiteId, endSiteId: bond.endSiteId,
      order: bond.order, provenance: bond.provenance,
    };
    if (bond.aromatic !== undefined) result.aromatic = bond.aromatic;
    if (bond.beginImage !== undefined) result.beginImage = clone(bond.beginImage);
    if (bond.endImage !== undefined) result.endImage = clone(bond.endImage);
    return result;
  }

  function sharedCrystal(crystal) {
    if (!crystal) return undefined;
    return {
      cell: {
        a: decimal(crystal.cell.a), b: decimal(crystal.cell.b), c: decimal(crystal.cell.c),
        alphaDeg: decimal(crystal.cell.alphaDeg), betaDeg: decimal(crystal.cell.betaDeg), gammaDeg: decimal(crystal.cell.gammaDeg),
      },
      spaceGroup: clone(crystal.spaceGroup),
      symmetryOperations: crystal.symmetryOperations.map((operation) => ({
        operationId: operation.operationId,
        canonicalExpression: operation.canonicalExpression,
        rotationExact: operation.rotationExact.map(({ numerator, denominator }) => ({ numerator, denominator })),
        translationExact: operation.translationExact.map(({ numerator, denominator }) => ({ numerator, denominator })),
      })),
      ...(crystal.metadata !== undefined ? { metadata: clone(crystal.metadata) } : {}),
    };
  }

  function createPayload(source, settings) {
    if (!source || source.schema !== "rt-source-structure/1") throw new TypeError("A SourceStructure is required for share v3.");
    if (!settings || typeof settings !== "object") throw new TypeError("Viewer settings are required for share v3.");
    const sharedSource = {
      schema: SHARED_SOURCE_SCHEMA,
      sourceStructureId: source.structureId,
      contentIdentity: source.contentIdentity,
      sourceFormat: source.source.format,
      canonicalFormat: source.source.canonicalFormat,
      ...(source.source.mediaType !== undefined ? { sourceMediaType: source.source.mediaType } : {}),
      structureType: source.structureType,
      models: source.models.map((model) => ({
        modelId: model.modelId,
        label: model.label,
        atomSites: model.atomSites.map(sharedAtom),
        bonds: model.bonds.map(sharedBond),
        ...(model.residues !== undefined ? { residues: clone(model.residues) } : {}),
      })),
      ...(source.crystal ? { crystal: sharedCrystal(source.crystal) } : {}),
      ...(source.metadata !== undefined ? { metadata: clone(source.metadata) } : {}),
    };
    const sharedView = {
      modelId: settings.modelId,
      mode: settings.mode,
      scene: clone(settings.scene || {}),
      view: clone(settings.view),
      ...(settings.camera !== undefined ? { camera: clone(settings.camera) } : {}),
    };
    return { schema: SCHEMA, source: sharedSource, view: sharedView };
  }

  async function encodePayload(payload) {
    if (payload?.schema !== SCHEMA) throw new TypeError("Unsupported structure share v3 schema.");
    const bytes = new TextEncoder().encode(dependencies.canonicalizeRfc8785(payload));
    if (typeof CompressionStream === "function") {
      try { return `d.${bytesToBase64Url(await transformBytes(bytes, CompressionStream, "deflate"))}`; } catch (_error) {}
    }
    return `u.${bytesToBase64Url(bytes)}`;
  }

  function numericTriplet(tokens, path) {
    if (!Array.isArray(tokens) || tokens.length !== 3) throw new TypeError(`${path} must contain three canonical decimals.`);
    return tokens.map((token) => {
      const number = Number(token);
      if (typeof token !== "string" || !Number.isFinite(number) || decimal(number) !== token) throw new TypeError(`${path} contains a non-canonical decimal.`);
      return number;
    });
  }

  function canonicalNumber(token, path) {
    const number = Number(token);
    if (typeof token !== "string" || !Number.isFinite(number) || decimal(number) !== token) throw new TypeError(`${path} must be a canonical decimal.`);
    return number;
  }

  function parsedFromShared(shared) {
    const parsed = {
      schema: "rt-parsed-structure/1",
      displayName: shared.metadata?.title || shared.sourceFormat,
      structureType: shared.structureType,
      source: {
        format: shared.sourceFormat,
        canonicalFormat: shared.canonicalFormat,
        ...(shared.sourceMediaType !== undefined ? { mediaType: shared.sourceMediaType } : {}),
        byteLength: 0,
      },
      models: shared.models.map((model) => ({
        modelId: model.modelId,
        label: model.label,
        atomSites: model.atomSites.map((site, index) => ({
          siteId: site.siteId, element: site.element, occupancy: site.occupancy,
          ...(["label", "formalCharge", "isotope", "altLocation", "disorderAssembly", "disorderGroup", "residueId", "chainId", "sourceRow"].reduce((result, key) => {
            if (site[key] !== undefined) result[key] = site[key]; return result;
          }, {})),
          ...(site.cartesian ? { cartesian: { cart: numericTriplet(site.cartesian, `atomSites[${index}].cartesian`) } } : {}),
          ...(site.fractional ? { fractional: { frac: numericTriplet(site.fractional, `atomSites[${index}].fractional`) } } : {}),
          properties: clone(site.properties || {}),
        })),
        bonds: clone(model.bonds),
        ...(model.residues !== undefined ? { residues: clone(model.residues) } : {}),
      })),
      metadata: clone(shared.metadata || {}),
      warnings: [],
    };
    if (shared.crystal) {
      const cell = shared.crystal.cell;
      const cellValues = [cell.a, cell.b, cell.c, cell.alphaDeg, cell.betaDeg, cell.gammaDeg]
        .map((token, index) => canonicalNumber(token, `crystal.cell[${index}]`));
      parsed.crystal = {
        cell: dependencies.createUnitCell(...cellValues),
        spaceGroup: clone(shared.crystal.spaceGroup),
        symmetryOperations: shared.crystal.symmetryOperations.map((operation) => {
          const parsedOperation = dependencies.parseSymmetryExpression(operation.canonicalExpression);
          if (parsedOperation.operationId !== operation.operationId
            || dependencies.canonicalizeRfc8785(parsedOperation.rotationExact) !== dependencies.canonicalizeRfc8785(operation.rotationExact)
            || dependencies.canonicalizeRfc8785(parsedOperation.translationExact) !== dependencies.canonicalizeRfc8785(operation.translationExact)) {
            throw new TypeError("Shared symmetry operation exact values do not match its canonical expression.");
          }
          return parsedOperation;
        }),
        ...(shared.crystal.metadata !== undefined ? { metadata: clone(shared.crystal.metadata) } : {}),
      };
    }
    return parsed;
  }

  function validatePayload(payload) {
    allow(payload, ["schema", "source", "view"], "$.");
    if (payload.schema !== SCHEMA) throw new TypeError("Unsupported structure share v3 schema.");
    const shared = payload.source;
    allow(shared, ["schema", "sourceStructureId", "contentIdentity", "sourceFormat", "canonicalFormat", "sourceMediaType", "structureType", "models", "crystal", "metadata"], "$.source");
    if (shared.schema !== SHARED_SOURCE_SCHEMA) throw new TypeError("Unsupported shared source schema.");
    string(shared.sourceStructureId, "$.source.sourceStructureId");
    if (!/^sha256:[0-9a-f]{64}$/.test(shared.contentIdentity || "")) throw new TypeError("$.source.contentIdentity is invalid.");
    string(shared.sourceFormat, "$.source.sourceFormat"); string(shared.canonicalFormat, "$.source.canonicalFormat");
    if (shared.sourceMediaType !== undefined) string(shared.sourceMediaType, "$.source.sourceMediaType");
    string(shared.structureType, "$.source.structureType");
    const models = array(shared.models, "$.source.models", dependencies.LIMITS.models);
    const modelIds = new Set(); const siteIds = new Set(); const bondIds = new Set();
    let siteCount = 0; let bondCount = 0;
    models.forEach((model, modelIndex) => {
      const modelPath = `$.source.models[${modelIndex}]`;
      allow(model, ["modelId", "label", "atomSites", "bonds", "residues"], modelPath);
      string(model.modelId, `${modelPath}.modelId`); string(model.label, `${modelPath}.label`);
      if (modelIds.has(model.modelId)) throw new TypeError(`${modelPath}.modelId is a duplicate model ID.`);
      modelIds.add(model.modelId);
      const sites = array(model.atomSites, `${modelPath}.atomSites`, dependencies.LIMITS.sourceAtomSites);
      const bonds = array(model.bonds, `${modelPath}.bonds`, dependencies.LIMITS.sourceBonds);
      siteCount += sites.length; bondCount += bonds.length;
      if (siteCount > dependencies.LIMITS.sourceAtomSites) throw new RangeError("$.source.models.atomSites exceeds the sites limit.");
      if (bondCount > dependencies.LIMITS.sourceBonds) throw new RangeError("$.source.models.bonds exceeds the bonds limit.");
      const localSites = new Set();
      sites.forEach((site, siteIndex) => {
        const path = `${modelPath}.atomSites[${siteIndex}]`;
        allow(site, ["siteId", "element", "label", "cartesian", "fractional", "formalCharge", "isotope", "occupancy", "altLocation", "disorderAssembly", "disorderGroup", "residueId", "chainId", "sourceRow", "properties"], path);
        string(site.siteId, `${path}.siteId`);
        if (siteIds.has(site.siteId)) throw new TypeError(`${path}.siteId is a duplicate site ID.`);
        siteIds.add(site.siteId); localSites.add(site.siteId);
        if (!ELEMENTS.has(site.element)) throw new TypeError(`${path}.element is invalid.`);
        if (!Number.isFinite(site.occupancy) || site.occupancy < 0 || site.occupancy > 1) throw new TypeError(`${path}.occupancy is invalid.`);
        if (site.cartesian === undefined && site.fractional === undefined) throw new TypeError(`${path} has no coordinates.`);
        if (site.cartesian !== undefined) numericTriplet(site.cartesian, `${path}.cartesian`);
        if (site.fractional !== undefined) numericTriplet(site.fractional, `${path}.fractional`);
        if (site.properties !== undefined) {
          safeValue(site.properties, `${path}.properties`);
          validateMetadataRecord(site.properties, `${path}.properties`);
        }
      });
      bonds.forEach((bond, bondIndex) => {
        const path = `${modelPath}.bonds[${bondIndex}]`;
        allow(bond, ["bondId", "beginSiteId", "endSiteId", "order", "aromatic", "provenance", "beginImage", "endImage"], path);
        string(bond.bondId, `${path}.bondId`);
        if (bondIds.has(bond.bondId)) throw new TypeError(`${path}.bondId is a duplicate bond ID.`);
        bondIds.add(bond.bondId);
        if (!localSites.has(bond.beginSiteId) || !localSites.has(bond.endSiteId)) throw new TypeError(`${path} has an invalid bond endpoint.`);
        if (!Number.isFinite(bond.order) || bond.order <= 0) throw new TypeError(`${path}.order is invalid.`);
        if (!["source", "dictionary", "inferred"].includes(bond.provenance)) throw new TypeError(`${path}.provenance is invalid.`);
        if (bond.aromatic !== undefined && typeof bond.aromatic !== "boolean") throw new TypeError(`${path}.aromatic is invalid.`);
        if (bond.beginImage !== undefined) validateImage(bond.beginImage, `${path}.beginImage`);
        if (bond.endImage !== undefined) validateImage(bond.endImage, `${path}.endImage`);
      });
      if (model.residues !== undefined) array(model.residues, `${modelPath}.residues`, dependencies.LIMITS.sourceAtomSites).forEach((residue, residueIndex) => {
        const path = `${modelPath}.residues[${residueIndex}]`;
        allow(residue, ["residueId", "name", "atomSiteIds", "sequenceNumber", "insertionCode", "chainId"], path);
        string(residue.residueId, `${path}.residueId`); string(residue.name, `${path}.name`);
        array(residue.atomSiteIds, `${path}.atomSiteIds`, dependencies.LIMITS.sourceAtomSites).forEach((id) => {
          if (!localSites.has(id)) throw new TypeError(`${path}.atomSiteIds has an invalid endpoint.`);
        });
      });
    });
    if (shared.metadata !== undefined) safeValue(shared.metadata, "$.source.metadata");
    if (shared.crystal !== undefined) {
      const crystal = shared.crystal;
      allow(crystal, ["cell", "spaceGroup", "symmetryOperations", "metadata"], "$.source.crystal");
      allow(crystal.cell, ["a", "b", "c", "alphaDeg", "betaDeg", "gammaDeg"], "$.source.crystal.cell");
      const cellValues = ["a", "b", "c", "alphaDeg", "betaDeg", "gammaDeg"].map((field) => canonicalNumber(crystal.cell[field], `$.source.crystal.cell.${field}`));
      if (cellValues.slice(0, 3).some((value) => value <= 0) || cellValues.slice(3).some((value) => value <= 0 || value >= 180)) throw new TypeError("$.source.crystal.cell is invalid.");
      dependencies.createUnitCell(...cellValues);
      allow(crystal.spaceGroup, ["hm", "hall", "number"], "$.source.crystal.spaceGroup");
      const operations = array(crystal.symmetryOperations, "$.source.crystal.symmetryOperations", dependencies.LIMITS.symmetryOperations);
      const operationIds = new Set();
      operations.forEach((operation, index) => {
        const path = `$.source.crystal.symmetryOperations[${index}]`;
        allow(operation, ["operationId", "canonicalExpression", "rotationExact", "translationExact"], path);
        string(operation.operationId, `${path}.operationId`); string(operation.canonicalExpression, `${path}.canonicalExpression`);
        if (operationIds.has(operation.operationId)) throw new TypeError(`${path}.operationId is a duplicate operation ID.`);
        operationIds.add(operation.operationId);
        array(operation.rotationExact, `${path}.rotationExact`, 9).forEach((entry, entryIndex) => validateRational(entry, `${path}.rotationExact[${entryIndex}]`));
        array(operation.translationExact, `${path}.translationExact`, 3).forEach((entry, entryIndex) => validateRational(entry, `${path}.translationExact[${entryIndex}]`));
        if (operation.rotationExact.length !== 9 || operation.translationExact.length !== 3) throw new TypeError(`${path} has invalid rational dimensions.`);
      });
      models.forEach((model) => model.bonds.forEach((bond) => [bond.beginImage, bond.endImage].filter(Boolean).forEach((image) => {
        if (!operationIds.has(image.symmetryOperationId)) throw new TypeError("Bond image references an unknown symmetry operation.");
      })));
      if (crystal.metadata !== undefined) safeValue(crystal.metadata, "$.source.crystal.metadata");
    }
    validateViewSettings(payload.view, modelIds);
    dependencies.validateParsedStructureContent(parsedFromShared(shared));
    return payload;
  }

  async function decodePayload(encoded, options = {}) {
    const value = String(encoded || "");
    if (value.length > dependencies.LIMITS.v3EncodedFragmentCharacters) throw new RangeError("Share v3 encoded fragment exceeds the encoded size limit.");
    const separator = value.indexOf(".");
    if (separator < 1) throw new Error("Unsupported structure share v3 encoding.");
    const codec = value.slice(0, separator);
    let bytes = base64UrlToBytes(value.slice(separator + 1));
    if (codec === "d") {
      if (typeof DecompressionStream !== "function") throw new Error("This browser cannot decompress the shared structure URL.");
      try { bytes = await transformBytes(bytes, DecompressionStream, "deflate", dependencies.LIMITS.v3DecodedJsonBytes); }
      catch (error) { if (error instanceof RangeError) throw error; throw new Error(`Invalid share v3 deflate data: ${error.message}`); }
    } else if (codec !== "u") throw new Error("Unsupported structure share v3 codec.");
    if (bytes.byteLength > dependencies.LIMITS.v3DecodedJsonBytes) throw new RangeError("Share v3 decoded JSON exceeds the decoded size limit.");
    let payload;
    try { payload = JSON.parse(new TextDecoder("utf-8", { fatal: true }).decode(bytes)); }
    catch (error) { throw new TypeError(`Invalid share v3 JSON: ${error.message}`); }
    safeValue(payload, "$");
    validatePayload(payload);
    const identities = options.sourceIdentities;
    const existingIdentity = identities instanceof Map ? identities.get(payload.source.sourceStructureId) : identities?.[payload.source.sourceStructureId];
    const collides = existingIdentity !== undefined && existingIdentity !== payload.source.contentIdentity;
    const factoryOptions = collides
      ? (options.uuid ? { uuid: options.uuid } : {})
      : { uuid: () => payload.source.sourceStructureId };
    const source = await dependencies.createSourceStructure(parsedFromShared(payload.source), factoryOptions);
    if (source.contentIdentity !== payload.source.contentIdentity) throw new TypeError("Shared structure content identity does not match its scientific content.");
    if (identities instanceof Map && identities.has(source.structureId) && identities.get(source.structureId) !== source.contentIdentity) throw new TypeError("Shared source ID collision could not be remapped safely.");
    return { source, settings: clone(payload.view), payload };
  }

  async function createHash(source, settings) {
    return `#v=3&data=${await encodePayload(createPayload(source, settings))}`;
  }

  async function decodeHash(hash) {
    const params = new URLSearchParams(String(hash || "").replace(/^#/, ""));
    if (params.get("v") !== "3" || !params.get("data")) throw new Error("Unsupported structure share hash.");
    return decodePayload(params.get("data"));
  }

  return { SCHEMA, createPayload, encodePayload, decodePayload, createHash, decodeHash, validatePayload };
});
;
/* web/structure-viewer/share-codec.js */
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
;
/* web/structure-viewer/toolkit-api.js */
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
;
/* web/structure-viewer/share/qr-share.js */
(function (root, factory) {
  const share = root?.StructureShareV2 || (typeof module === "object" && module.exports ? require("./share-v2.js") : null);
  const api = factory(share);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureShareQr = api;
})(typeof window !== "undefined" ? window : globalThis, function (share) {
  "use strict";
  const QR_FINAL_URL_BYTES = 2953;

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
    if (encodedBytes > QR_FINAL_URL_BYTES) {
      return {
        fits: false, encodedBytes, capacityBytes: QR_FINAL_URL_BYTES,
        remainingBytes: QR_FINAL_URL_BYTES - encodedBytes, version: null,
        error: `QR URL exceeds the ${QR_FINAL_URL_BYTES.toLocaleString()}-byte final URL capacity (${encodedBytes - QR_FINAL_URL_BYTES} bytes over capacity).`,
      };
    }
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
;
/* web/structure-viewer/ui/crystal-panel.js */
(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? require("../core/scene-definition.js")
    : root.StructureViewerCore;
  const api = factory(dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerUI = Object.assign(root.StructureViewerUI || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (dependencies) {
  "use strict";

  const EXPORT_MODES = new Set(["source-asymmetric-unit", "visible-scene", "selected-component"]);

  function requireCrystalSource(source) {
    if (!source || source.schema !== "rt-source-structure/1" || !source.crystal) throw new TypeError("A crystal SourceStructure is required.");
    return source;
  }

  function normalizeCrystalPanelState(source, state = {}) {
    requireCrystalSource(source);
    const modelId = state.modelId || source.models[0]?.modelId;
    if (!source.models.some((model) => model.modelId === modelId)) throw new Error(`Unknown crystal model '${modelId}'.`);
    const exportMode = state.exportMode || "source-asymmetric-unit";
    if (!EXPORT_MODES.has(exportMode)) throw new TypeError(`Unsupported crystal export mode '${exportMode}'.`);
    const crystal = {
      content: state.content || "asymmetric-unit",
      disorderMode: state.disorderMode || "all",
      minimumOccupancy: state.minimumOccupancy === undefined ? 0 : Number(state.minimumOccupancy),
      replication: state.replication || { a: [0, 0], b: [0, 0], c: [0, 0] },
      wrapFractionalCoordinates: state.wrapFractionalCoordinates === true,
    };
    if (crystal.content === "packing") crystal.packingRadiusAngstrom = state.packingRadiusAngstrom === undefined ? 8 : Number(state.packingRadiusAngstrom);
    if (crystal.disorderMode === "group") {
      if (state.disorderAssembly) crystal.disorderAssembly = state.disorderAssembly;
      if (state.disorderGroup) crystal.disorderGroup = state.disorderGroup;
    }
    return Object.freeze({ definition: dependencies.normalizeSceneDefinition({ modelId, mode: "crystal", crystal }), exportMode });
  }

  function crystalMetadataRows(source) {
    requireCrystalSource(source);
    const cell = source.crystal.cell;
    const group = source.crystal.spaceGroup || {};
    const crystalMetadata = source.crystal.metadata || {};
    const metadata = { ...crystalMetadata, ...(crystalMetadata.extra || {}) };
    const rows = [
      { label: "Unit cell", value: `${cell.a} × ${cell.b} × ${cell.c} Å; ${cell.alphaDeg}°, ${cell.betaDeg}°, ${cell.gammaDeg}°` },
      { label: "Space group", value: group.hm || group.hall || (group.number ? `No. ${group.number}` : "Unknown") },
    ];
    const optional = [
      ["Formula", metadata.formula], ["Z", metadata.z], ["Temperature", metadata.temperatureK === undefined ? undefined : `${metadata.temperatureK} K`],
      ["CCDC", metadata.ccdcNumber], ["COD", metadata.databaseCod], ["ICSD", metadata.databaseIcsd], ["DOI", metadata.auditBlockDoi],
    ];
    optional.forEach(([label, value]) => { if (value !== undefined && value !== null && String(value)) rows.push({ label, value: String(value) }); });
    return rows;
  }

  function crystalExportSummary({ mode = "source-asymmetric-unit", atomCount = 0, sceneLabel = "Crystal scene" } = {}) {
    const count = Number.isInteger(atomCount) && atomCount >= 0 ? atomCount : 0;
    const labels = {
      "source-asymmetric-unit": "Source asymmetric unit",
      "visible-scene": `Visible scene (${sceneLabel})`,
      "selected-component": `Selected component (${sceneLabel})`,
    };
    if (!labels[mode]) throw new TypeError(`Unsupported crystal export mode '${mode}'.`);
    return `${labels[mode]} · ${count} ${count === 1 ? "atom" : "atoms"}`;
  }

  function createElement(document, tag, attributes = {}, text = "") {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([name, value]) => {
      if (name === "className") element.className = value;
      else element.setAttribute(name, String(value));
    });
    if (text) element.textContent = text;
    return element;
  }

  function option(document, value, label) {
    return createElement(document, "option", { value }, label);
  }

  function labeledControl(document, labelText, control) {
    const label = createElement(document, "label", { className: "crystal-field" });
    label.append(createElement(document, "span", { className: "crystal-field-label" }, labelText), control);
    return label;
  }

  function createCrystalPanel(options = {}) {
    const document = options.document || root.document;
    const container = options.container;
    const source = requireCrystalSource(options.source);
    if (!document || !container) throw new TypeError("Crystal panel requires a document and container.");
    let state = { ...(options.initialState || {}) };
    let disposed = false;
    const panel = createElement(document, "section", { className: "crystal-panel", "aria-label": "Crystal display controls" });
    const fields = createElement(document, "div", { className: "crystal-fields" });
    const content = createElement(document, "select", { "aria-label": "Crystal scene" });
    [["asymmetric-unit", "Asymmetric unit"], ["unit-cell", "Unit cell"], ["symmetry-mates", "Symmetry mates"], ["packing", "Packing"], ["supercell", "Supercell"]].forEach(([value, label]) => content.append(option(document, value, label)));
    const model = createElement(document, "select", { "aria-label": "Crystal model" });
    source.models.forEach((entry) => model.append(option(document, entry.modelId, entry.label || entry.modelId)));
    const disorder = createElement(document, "select", { "aria-label": "Disorder handling" });
    [["all", "All disorder"], ["highest-occupancy", "Highest occupancy"], ["group", "Specified group"]].forEach(([value, label]) => disorder.append(option(document, value, label)));
    const occupancy = createElement(document, "input", { type: "number", min: "0", max: "1", step: "0.05", "aria-label": "Minimum occupancy" });
    const disorderAssembly = createElement(document, "input", { type: "text", "aria-label": "Disorder assembly" });
    const disorderGroup = createElement(document, "input", { type: "text", "aria-label": "Disorder group" });
    const radius = createElement(document, "input", { type: "number", min: "3", max: "30", step: "0.5", "aria-label": "Packing radius in Angstrom" });
    const exportMode = createElement(document, "select", { "aria-label": "XYZ export mode" });
    [["source-asymmetric-unit", "Source asymmetric unit"], ["visible-scene", "Visible scene"], ["selected-component", "Selected component"]].forEach(([value, label]) => exportMode.append(option(document, value, label)));
    const radiusField = labeledControl(document, "Radius (Å)", radius);
    const assemblyField = labeledControl(document, "Disorder assembly", disorderAssembly);
    const groupField = labeledControl(document, "Disorder group", disorderGroup);
    fields.append(labeledControl(document, "Scene", content), labeledControl(document, "Model", model), labeledControl(document, "Disorder", disorder), labeledControl(document, "Min. occupancy", occupancy), assemblyField, groupField, radiusField, labeledControl(document, "XYZ export", exportMode));

    const replication = createElement(document, "fieldset", { className: "crystal-replication" });
    replication.append(createElement(document, "legend", {}, "Replication ranges"));
    const rangeInputs = {};
    ["a", "b", "c"].forEach((axis) => {
      const row = createElement(document, "label", { className: "crystal-range" });
      row.append(createElement(document, "span", {}, axis));
      rangeInputs[axis] = ["min", "max"].map((edge) => {
        const input = createElement(document, "input", { type: "number", min: "-10", max: "10", step: "1", "aria-label": `${axis} ${edge}` });
        row.append(input); return input;
      });
      replication.append(row);
    });

    const metadata = createElement(document, "dl", { className: "crystal-metadata" });
    crystalMetadataRows(source).forEach((row) => metadata.append(createElement(document, "dt", {}, row.label), createElement(document, "dd", {}, row.value)));
    const feedback = createElement(document, "div", { className: "crystal-feedback" });
    const exportSummary = createElement(document, "output", { className: "crystal-export-summary", "aria-live": "polite" });
    const warnings = createElement(document, "output", { className: "crystal-warnings", "aria-live": "polite" });
    const progress = createElement(document, "output", { className: "crystal-progress", "aria-live": "polite" });
    const cancel = createElement(document, "button", { type: "button", className: "outlined-action crystal-cancel" }, "Cancel");
    cancel.hidden = true;
    feedback.append(warnings, progress, cancel);
    panel.append(fields, replication, metadata, exportSummary, feedback);
    container.append(panel);

    function readState() {
      const ranges = {};
      ["a", "b", "c"].forEach((axis) => { ranges[axis] = rangeInputs[axis].map((input) => Number(input.value)); });
      return { modelId: model.value, content: content.value, disorderMode: disorder.value, disorderAssembly: disorderAssembly.value.trim(), disorderGroup: disorderGroup.value.trim(), minimumOccupancy: Number(occupancy.value), packingRadiusAngstrom: Number(radius.value), replication: ranges, exportMode: exportMode.value };
    }

    function reflect(next) {
      state = { ...state, ...next };
      const normalized = normalizeCrystalPanelState(source, state);
      content.value = normalized.definition.crystal.content;
      model.value = normalized.definition.modelId;
      disorder.value = normalized.definition.crystal.disorderMode;
      disorderAssembly.value = normalized.definition.crystal.disorderAssembly || "";
      disorderGroup.value = normalized.definition.crystal.disorderGroup || "";
      occupancy.value = String(normalized.definition.crystal.minimumOccupancy);
      radius.value = String(normalized.definition.crystal.packingRadiusAngstrom ?? 8);
      exportMode.value = normalized.exportMode;
      ["a", "b", "c"].forEach((axis) => normalized.definition.crystal.replication[axis].forEach((value, index) => { rangeInputs[axis][index].value = String(value); }));
      radiusField.hidden = normalized.definition.crystal.content !== "packing";
      assemblyField.hidden = normalized.definition.crystal.disorderMode !== "group";
      groupField.hidden = normalized.definition.crystal.disorderMode !== "group";
      replication.hidden = !["symmetry-mates", "supercell"].includes(normalized.definition.crystal.content);
      return normalized;
    }

    function notify() {
      if (disposed) return;
      try {
        const normalized = normalizeCrystalPanelState(source, readState());
        state = { ...readState() };
        reflect(state);
        warnings.textContent = "";
        options.onChange?.(normalized);
      } catch (error) {
        warnings.textContent = error?.message || String(error);
      }
    }
    panel.addEventListener("change", notify);
    cancel.addEventListener("click", () => options.onCancel?.());
    reflect(state);

    return Object.freeze({
      element: panel,
      getState: () => normalizeCrystalPanelState(source, readState()),
      setState: (next) => reflect(next || {}),
      setProgress: (message) => { progress.textContent = message || ""; cancel.hidden = !message; },
      setWarnings: (messages) => {
        const format = (message) => typeof message === "string" ? message : message?.message || message?.code || String(message || "");
        warnings.textContent = Array.isArray(messages) ? messages.map(format).filter(Boolean).join(" ") : format(messages);
      },
      setExportSummary: (summary) => { exportSummary.textContent = crystalExportSummary(summary); },
      getExportMode: () => exportMode.value,
      dispose: () => { disposed = true; panel.remove(); },
    });
  }

  return { normalizeCrystalPanelState, crystalMetadataRows, crystalExportSummary, createCrystalPanel };
});
;
/* web/structure-viewer/ui/app-controller.js */
(function (root, factory) {
  const dependencies = typeof module === "object" && module.exports
    ? {
      ...require("../parsers/registry.js"), ...require("../parsers/xyz-parser.js"), ...require("../parsers/mol-parser.js"), ...require("../parsers/sdf-parser.js"), ...require("../parsers/pdb-parser.js"), ...require("../parsers/cif-parser.js"),
      ...require("../core/structure-factory.js"), ...require("../core/scene-builder.js"), ...require("../core/atom-identity.js"),
      ...require("../crystal/scene-builder.js"),
      ...require("../core/exporters.js"),
      ...require("../workspace/workspace-store.js"), ...require("../workspace/viewer-instance.js"),
      ...require("./viewer-pane.js"), ...require("./workspace-tabs.js"), ...require("./crystal-panel.js"),
      ...require("../renderers/3dmol-renderer.js"), ...require("../viewer-math.js"),
      ...require("../transfer/window-transfer.js"),
      share: require("../share-codec.js"),
    }
    : {
      ...(root.StructureViewerCore || {}), ...(root.StructureViewerParsers || {}),
      ...(root.StructureViewerCrystal || {}),
      ...(root.StructureViewerRenderers || {}), ...(root.StructureViewerUI || {}),
      ...(root.StructureViewerTransfer || {}),
      ...(root.StructureViewerMath || {}), share: root.StructureShare || root.StructureShareV2,
    };
  const api = factory(root, dependencies);
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerUI = Object.assign(root.StructureViewerUI || {}, api);
})(typeof window !== "undefined" ? window : globalThis, function (root, dependencies) {
  "use strict";

  function payloadToFullXyz(payload) {
    dependencies.share.validatePayload(payload);
    return `${payload.elements.length}\nResearch Toolkit shared structure\n${dependencies.share.coordinateRows(payload)}`;
  }

  function createStandaloneViewerController(options = {}) {
    const document = options.document || root.document;
    const windowObject = options.window || root;
    const location = options.location || root.location;
    const history = options.history || root.history;
    const navigator = options.navigator || root.navigator;
    const rendererAdapter = options.rendererAdapter || dependencies.ThreeDmolRendererAdapter;
    const createCrystalPanel = options.createCrystalPanel || dependencies.createCrystalPanel;
    const workspace = options.workspace || dependencies.createWorkspaceStore();
    const registry = dependencies.createParserRegistry([dependencies.XyzParserAdapter, dependencies.MolParserAdapter, dependencies.SdfParserAdapter, dependencies.PdbParserAdapter, dependencies.CifParserAdapter]);
    const runtime = new Map();
    let tabs = null;

    const byId = (id) => document?.getElementById(id);
    const elements = options.elements || {
      viewer: byId("viewer"), stage: byId("viewerStage"), summary: byId("structureSummary"),
      status: byId("statusMessage"), measurement: byId("measurementOverlay"), error: byId("errorMessage"),
      model: byId("modelSelect"), style: byId("styleSelect"), labels: byId("labelsButton"), clear: byId("clearButton"), reset: byId("resetButton"),
      showXyz: byId("showXyzButton"), copy: byId("copyCoordinatesButton"), share: byId("shareButton"), png: byId("pngButton"),
      open: byId("openButton"), file: byId("fileInput"), xyzPanel: byId("xyzPanel"), xyz: byId("xyzText"), tabs: byId("workspaceTabs"),
      newViewer: byId("newViewerButton"), duplicateViewer: byId("duplicateViewerButton"),
      openDetached: byId("openDetachedButton"),
      compareViewer: byId("compareViewerButton"), secondaryViewer: byId("secondaryViewerSelect"),
      exportXyz: byId("exportXyzButton"),
      crystalPanel: byId("crystalPanelHost"),
      lossy: byId("lossyNotice"),
    };
    const compactMedia = options.compactMediaQuery || root.matchMedia?.("(max-width: 700px), (pointer: coarse)") || null;
    const isCompactLayout = options.isCompactLayout || (() => compactMedia?.matches === true);
    let secondaryViewerId = null;
    const transferCleanups = new Set();

    function transferOrigin() {
      return location?.protocol === "file:" ? "null" : location?.origin;
    }

    function transferTargetOrigin() {
      return location?.protocol === "file:" ? "*" : transferOrigin();
    }

    function detachedNonce() {
      if (new URLSearchParams(location?.search || "").get("layout") !== "detached") return null;
      return new URLSearchParams(String(location?.hash || "").replace(/^#/, "")).get("nonce");
    }

    function activeRuntime() {
      return runtime.get(workspace.getState().activeViewerId) || null;
    }

    function crystalPanelState(definition, exportMode) {
      return definition?.mode === "crystal"
        ? { modelId: definition.modelId, ...definition.crystal, exportMode }
        : { modelId: definition?.modelId, exportMode };
    }

    function sharedViewerSettings(current) {
      const state = workspace.getState().instances[current.viewerId];
      const definition = state.sceneDefinition;
      const sceneKey = definition.mode === "crystal" ? "crystal" : "molecular";
      return {
        modelId: definition.modelId,
        mode: definition.mode,
        scene: { [sceneKey]: definition[sceneKey] || {} },
        view: state.view,
        camera: current.instance.getCamera(),
      };
    }

    function comparisonCandidates(state = workspace.getState()) {
      return state.order.filter((viewerId) => viewerId !== state.activeViewerId && runtime.has(viewerId));
    }

    function refreshComparisonControls(state = workspace.getState()) {
      const candidates = comparisonCandidates(state);
      if (state.layout === "side-by-side" && !candidates.includes(secondaryViewerId)) secondaryViewerId = candidates[0] || null;
      if (elements.compareViewer) {
        elements.compareViewer.disabled = candidates.length === 0;
        elements.compareViewer.setAttribute("aria-pressed", String(state.layout === "side-by-side"));
      }
      if (elements.secondaryViewer) {
        const options = candidates.map((viewerId) => {
          const option = elements.secondaryViewer.ownerDocument.createElement("option");
          option.value = viewerId;
          option.textContent = state.instances[viewerId].name;
          option.selected = viewerId === secondaryViewerId;
          return option;
        });
        elements.secondaryViewer.replaceChildren(...options);
        elements.secondaryViewer.value = secondaryViewerId || "";
        if (elements.secondaryViewer.parentElement) elements.secondaryViewer.parentElement.hidden = state.layout !== "side-by-side" || candidates.length === 0;
      }
    }

    function applyWorkspaceLayout() {
      const state = workspace.getState();
      const split = state.layout === "side-by-side" && secondaryViewerId && secondaryViewerId !== state.activeViewerId && runtime.has(secondaryViewerId) && !isCompactLayout();
      const visible = new Set([state.activeViewerId, ...(split ? [secondaryViewerId] : [])].filter(Boolean));
      runtime.forEach((entry, id) => {
        if (entry.host) entry.host.hidden = !visible.has(id);
        if (visible.has(id)) entry.instance?.resize?.();
      });
      elements.viewer?.classList?.toggle?.("is-split", Boolean(split));
      refreshComparisonControls(state);
      return visible;
    }

    function activateRuntime(viewerId) {
      const priorActive = workspace.getState().activeViewerId;
      workspace.activate(viewerId);
      if (workspace.getState().layout === "side-by-side" && secondaryViewerId === viewerId) secondaryViewerId = priorActive && priorActive !== viewerId ? priorActive : null;
      runtime.forEach((entry, id) => { if (entry.crystalPanel?.element) entry.crystalPanel.element.hidden = id !== viewerId; });
      const current = runtime.get(viewerId);
      const viewerState = workspace.getState().instances[viewerId];
      if (current?.source) {
        refreshExport(current);
        if (elements.xyz) elements.xyz.value = current.fullXyz;
        if (elements.summary) elements.summary.textContent = `${current.source.models.find((model) => model.modelId === current.modelId)?.atomSites.length || 0} atoms · ${current.source.source.format.toUpperCase()}`;
        if (elements.model) {
          const options = current.source.models.map((model) => {
            const option = elements.model.ownerDocument.createElement("option");
            option.value = model.modelId;
            option.textContent = model.label || model.modelId;
            option.selected = model.modelId === current.modelId;
            return option;
          });
          elements.model.replaceChildren(...options);
          elements.model.value = current.modelId;
          if (elements.model.parentElement) elements.model.parentElement.hidden = options.length < 2;
        }
        current.instance?.resize();
      } else {
        if (elements.xyz) elements.xyz.value = "";
        if (elements.summary) elements.summary.textContent = "Empty Viewer";
        if (elements.model?.parentElement) elements.model.parentElement.hidden = true;
      }
      if (elements.style && viewerState?.view) elements.style.value = viewerState.view.representation.kind;
      elements.labels?.setAttribute?.("aria-pressed", String(viewerState?.view?.labels?.mode !== "none"));
      updateMeasurement();
      if (elements.crystalPanel) elements.crystalPanel.hidden = !current?.source?.crystal;
      applyWorkspaceLayout();
      tabs?.render();
    }

    function setComparison(viewerId) {
      const state = workspace.getState();
      if (!viewerId || viewerId === state.activeViewerId || !runtime.has(viewerId)) throw new Error(`Invalid comparison Viewer: ${viewerId}`);
      secondaryViewerId = viewerId;
      workspace.setLayout("side-by-side");
      applyWorkspaceLayout();
      return viewerId;
    }

    function exitComparison() {
      secondaryViewerId = null;
      workspace.setLayout("tabs");
      applyWorkspaceLayout();
    }

    function disposeRuntime(viewerId) {
      const current = runtime.get(viewerId);
      if (!current) return false;
      current.pane?.dispose?.();
      current.operation?.abort?.();
      current.crystalPanel?.dispose?.();
      current.instance?.dispose?.();
      current.host?.remove?.();
      runtime.delete(viewerId);
      if (workspace.getState().instances[viewerId]) workspace.close(viewerId);
      return true;
    }

    function mountEmptyRuntime(viewerId) {
      const host = elements.viewer?.ownerDocument?.createElement?.("div") || null;
      if (host) {
        host.className = "viewer-pane-host viewer-pane-empty";
        host.id = `viewer-pane-${viewerId}`;
        host.setAttribute("role", "tabpanel");
        host.setAttribute("aria-labelledby", `workspace-tab-${viewerId}`);
        host.textContent = "Open or drop a structure into this Viewer.";
        elements.viewer.append?.(host);
      }
      runtime.set(viewerId, { viewerId, host, empty: true, operation: null });
      activateRuntime(viewerId);
      return viewerId;
    }

    function newViewer() {
      return mountEmptyRuntime(workspace.createViewer({ name: "Untitled structure" }));
    }

    function closeViewer(viewerId = workspace.getState().activeViewerId) {
      if (!viewerId || !workspace.getState().instances[viewerId]) return false;
      if (workspace.getState().layout === "side-by-side" && (viewerId === secondaryViewerId || viewerId === workspace.getState().activeViewerId)) exitComparison();
      if (runtime.has(viewerId)) disposeRuntime(viewerId);
      else workspace.close(viewerId);
      const next = workspace.getState().activeViewerId;
      if (next) activateRuntime(next);
      else {
        if (elements.summary) elements.summary.textContent = "";
        if (elements.xyz) elements.xyz.value = "";
        if (elements.crystalPanel) elements.crystalPanel.hidden = true;
      }
      return true;
    }

    async function duplicateViewer(viewerId = workspace.getState().activeViewerId) {
      const current = runtime.get(viewerId);
      if (!current) throw new Error(`Unknown Viewer instance: ${viewerId}`);
      const duplicateId = workspace.duplicate(viewerId);
      if (current.empty) return mountEmptyRuntime(duplicateId);
      let host;
      let instance;
      let pane;
      let crystalPanel;
      try {
        host = elements.viewer?.ownerDocument?.createElement?.("div") || elements.viewer;
        if (host !== elements.viewer) {
          host.className = "viewer-pane-host";
          host.id = `viewer-pane-${duplicateId}`;
          host.setAttribute("role", "tabpanel");
          host.setAttribute("aria-labelledby", `workspace-tab-${duplicateId}`);
          elements.viewer.append?.(host);
        }
        instance = new dependencies.ViewerInstance({ viewerId: duplicateId, workspace, rendererAdapter });
        instance.mount(host);
        pane = dependencies.createViewerPaneController({ viewerId: duplicateId, workspace, viewerInstance: instance });
        const priorPick = instance.callbacks.onPick;
        instance.callbacks.onPick = (pick) => Promise.resolve(priorPick(pick)).then(updateMeasurement).catch((error) => setStatus(error?.message || String(error), true));
        await instance.updateScene(current.instance.currentScene);
        const entry = {
          viewerId: duplicateId, instance, pane, source: current.source, payload: current.payload,
          fullXyz: current.fullXyz, coordinateRows: current.coordinateRows, modelId: current.modelId,
          host, exportMode: current.exportMode, operation: null,
        };
        runtime.set(duplicateId, entry);
        if (isCrystal(entry.source) && elements.crystalPanel) {
          const duplicateDefinition = workspace.getState().instances[duplicateId].sceneDefinition;
          crystalPanel = createCrystalPanel({
            document, container: elements.crystalPanel, source: entry.source,
            initialState: crystalPanelState(duplicateDefinition, entry.exportMode),
            onChange: (normalized) => applyCrystalPanelChange(entry, normalized),
            onCancel: () => entry.operation?.abort?.(),
          });
          entry.crystalPanel = crystalPanel;
          crystalPanel.setWarnings(entry.instance.currentScene?.warnings || entry.source.warnings || []);
        }
        activateRuntime(duplicateId);
        return duplicateId;
      } catch (error) {
        crystalPanel?.dispose?.();
        pane?.dispose?.();
        instance?.dispose?.();
        host?.remove?.();
        if (workspace.getState().instances[duplicateId]) workspace.close(duplicateId);
        throw error;
      }
    }

    function setStatus(message, error = false) {
      if (elements.status) { elements.status.hidden = !message; elements.status.textContent = message || ""; }
      if (elements.error) { elements.error.hidden = !error; elements.error.textContent = error ? message : ""; }
    }

    function updateMeasurement() {
      const current = activeRuntime();
      const definition = current && workspace.getState().instances[current.viewerId]?.measurements[0];
      const evaluated = definition && current.instance.currentScene
        ? dependencies.evaluateMeasurement(current.instance.currentScene, definition)
        : null;
      if (!elements.measurement) return;
      elements.measurement.hidden = !evaluated || evaluated.status !== "available";
      if (!elements.measurement.hidden) {
        const label = definition.kind === "distance" ? "Distance" : definition.kind === "angle" ? "Angle" : "Dihedral";
        elements.measurement.textContent = `${label}: ${evaluated.value.toFixed(definition.kind === "distance" ? 3 : 2)}${evaluated.unit === "angstrom" ? " Å" : "°"}`;
      }
    }

    function normalizedXyz(text, parsedContent) {
      const sites = parsedContent.models?.[0]?.atomSites || [];
      const lines = String(text || "").replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n").split("\n");
      while (lines.length && !lines.at(-1).trim()) lines.pop();
      const headered = /^\d+$/.test(lines[0]?.trim() || "");
      const coordinateLines = headered ? lines.slice(2) : lines.filter((line) => line.trim());
      const rows = sites.map((site, index) => {
        const tokens = coordinateLines[index].trim().split(/\s+/);
        return `${site.element} ${tokens.slice(1).join(" ")}`;
      });
      return `${rows.length}\n${parsedContent.metadata?.comment || parsedContent.displayName || "Structure"}\n${rows.join("\n")}`;
    }

    function isCrystal(source) {
      return Boolean(source?.crystal && source.structureType === "crystal");
    }

    function buildScene(source, definition, options = {}) {
      return isCrystal(source)
        ? dependencies.buildCrystalScene(source, definition, options)
        : dependencies.buildMolecularScene(source, definition);
    }

    function selectedRenderAtomIds(current) {
      const selection = workspace.getState().instances[current.viewerId]?.selection || [];
      return selection.map((identity) => dependencies.resolveIdentity(current.instance.currentScene, identity)?.renderAtomId).filter(Boolean);
    }

    function crystalSceneLabel(current) {
      const content = current?.instance?.currentScene?.crystal?.content || "asymmetric-unit";
      return ({
        "asymmetric-unit": "Asymmetric unit",
        "unit-cell": "Unit cell",
        "symmetry-mates": "Symmetry mates",
        packing: "Packing",
        supercell: "Supercell",
      })[content] || content;
    }

    function refreshExport(current, options = {}) {
      if (!current) return "";
      try {
        if (isCrystal(current.source)) {
          const mode = current.exportMode || "source-asymmetric-unit";
          const exportOptions = { source: current.source, scene: current.instance.currentScene, modelId: current.modelId, mode, selectedRenderAtomIds: selectedRenderAtomIds(current) };
          current.fullXyz = dependencies.exportCrystalXyz(exportOptions);
          current.coordinateRows = dependencies.crystalCoordinateRows(exportOptions);
          const atomCount = current.coordinateRows ? current.coordinateRows.split("\n").filter(Boolean).length : 0;
          const sceneLabel = crystalSceneLabel(current);
          current.exportSummary = dependencies.crystalExportSummary({ mode, atomCount, sceneLabel });
          current.crystalPanel?.setExportSummary({ mode, atomCount, sceneLabel });
        } else {
          current.fullXyz = payloadToFullXyz(current.payload);
          current.coordinateRows = dependencies.share.coordinateRows(current.payload);
        }
        current.exportError = null;
      } catch (error) {
        current.exportError = error;
        current.crystalPanel?.setWarnings(error?.message || String(error));
        if (options.strict) throw error;
      }
      if (workspace.getState().activeViewerId === current.viewerId && elements.xyz) elements.xyz.value = current.fullXyz;
      return current.fullXyz;
    }

    async function applyCrystalPanelChange(current, normalized) {
      const previous = workspace.getState().instances[current.viewerId];
      const previousScene = current.instance.currentScene;
      const previousModelId = current.modelId;
      const previousExportMode = current.exportMode;
      if (JSON.stringify(previous.sceneDefinition) === JSON.stringify(normalized.definition)) {
        current.exportMode = normalized.exportMode;
        refreshExport(current);
        return;
      }
      const operation = new AbortController();
      current.operation?.abort?.();
      current.operation = operation;
      current.crystalPanel?.setProgress("Building crystal scene...");
      try {
        const scene = await buildScene(current.source, normalized.definition, { signal: operation.signal });
        if (operation.signal.aborted || current.operation !== operation) return;
        const applied = await current.instance.updateScene(scene);
        if (operation.signal.aborted || current.operation !== operation) {
          if (applied && current.operation === operation && previousScene) await current.instance.updateScene(previousScene);
          return;
        }
        if (!applied) { const error = new Error("Crystal scene update was cancelled."); error.name = "AbortError"; throw error; }
        workspace.patchViewer(current.viewerId, { sceneDefinition: normalized.definition });
        current.modelId = normalized.definition.modelId;
        current.exportMode = normalized.exportMode;
        refreshExport(current);
        current.crystalPanel?.setWarnings(scene.warnings || []);
      } catch (error) {
        if (error?.name !== "AbortError" && current.operation === operation) {
          workspace.patchViewer(current.viewerId, { sceneDefinition: previous.sceneDefinition, selection: previous.selection, measurements: previous.measurements });
          current.modelId = previousModelId;
          current.exportMode = previousExportMode;
          if (previousScene) {
            try { await current.instance.updateScene(previousScene); }
            catch (restoreError) { setStatus(`Scene restore failed: ${restoreError?.message || restoreError}`, true); }
          }
          current.crystalPanel?.setWarnings(error?.message || String(error));
          setStatus(error?.message || String(error), true);
        }
      } finally {
        if (current.operation === operation) { current.operation = null; current.crystalPanel?.setProgress(""); }
      }
    }

    async function loadStructure({ text, name = "structure.xyz", explicitFormat, charge = 0, multiplicity = 1, replace = false, signal } = {}) {
      setStatus("Loading structure...");
      const selected = registry.selectAdapter({ text, name, ...(explicitFormat ? { explicitFormat } : {}) });
      const parsed = await selected.adapter.parse({ text, name, signal, onProgress: (event) => {
        setStatus(`Parsing ${name}: ${event.completed}/${event.total || "?"}`);
      } }, { signal });
      const source = await dependencies.createSourceStructure(parsed.content);
      const modelId = source.models[0].modelId;
      let payload;
      if (isCrystal(source)) {
        payload = dependencies.share.createPayload({ xyz: dependencies.exportCrystalXyz({ source, modelId, mode: "source-asymmetric-unit" }), charge, multiplicity });
      } else if (source.source.format === "xyz") {
        try { payload = dependencies.share.createPayload({ xyz: text, charge, multiplicity }); }
        catch (_error) { payload = dependencies.share.createPayload({ xyz: normalizedXyz(text, parsed.content), charge, multiplicity }); }
      } else {
        payload = dependencies.share.createPayload({ xyz: dependencies.sourceModelToXyz(source, modelId), charge, multiplicity });
      }
      const fullXyz = payloadToFullXyz(payload);
      const activeBeforeLoad = activeRuntime();
      const previousViewerIds = replace ? [...runtime.keys()] : activeBeforeLoad?.empty ? [activeBeforeLoad.viewerId] : [];
      const previousViewerNodes = elements.viewer?.childNodes ? new Set([...elements.viewer.childNodes]) : null;
      workspace.addStructure(source);
      let viewerId;
      let instance;
      let pane;
      let host;
      let crystalPanel;
      try {
        viewerId = workspace.createViewer({ name, structureId: source.structureId });
        const scene = await buildScene(source, workspace.getState().instances[viewerId].sceneDefinition, { signal });
        host = elements.viewer?.ownerDocument?.createElement?.("div") || elements.viewer;
        if (host !== elements.viewer) {
          host.className = "viewer-pane-host";
          host.id = `viewer-pane-${viewerId}`;
          host.setAttribute("role", "tabpanel");
          host.setAttribute("aria-labelledby", `workspace-tab-${viewerId}`);
          elements.viewer.append?.(host);
        }
        instance = new dependencies.ViewerInstance({ viewerId, workspace, rendererAdapter });
        instance.mount(host);
        pane = dependencies.createViewerPaneController({ viewerId, workspace, viewerInstance: instance });
        const priorPick = instance.callbacks.onPick;
        instance.callbacks.onPick = (pick) => Promise.resolve(priorPick(pick))
          .then(updateMeasurement)
          .catch((error) => setStatus(error?.message || String(error), true));
        await instance.updateScene(scene);
        previousViewerIds.forEach(disposeRuntime);
        const entry = { viewerId, instance, pane, source, payload, fullXyz, coordinateRows: dependencies.share.coordinateRows(payload), modelId, host, exportMode: "source-asymmetric-unit", operation: null };
        runtime.set(viewerId, entry);
        if (isCrystal(source) && elements.crystalPanel) {
          const initialDefinition = workspace.getState().instances[viewerId].sceneDefinition;
          crystalPanel = createCrystalPanel({
            document, container: elements.crystalPanel, source,
            initialState: crystalPanelState(initialDefinition, entry.exportMode),
            onChange: (normalized) => applyCrystalPanelChange(entry, normalized),
            onCancel: () => entry.operation?.abort?.(),
          });
          entry.crystalPanel = crystalPanel;
          crystalPanel.setWarnings(scene.warnings || source.warnings || []);
        }
        refreshExport(entry);
      } catch (error) {
        crystalPanel?.dispose?.();
        pane?.dispose();
        instance?.dispose();
        if (viewerId && workspace.getState().instances[viewerId]) workspace.close(viewerId);
        if (host !== elements.viewer) host?.remove?.();
        if (previousViewerNodes && elements.viewer?.childNodes) {
          [...elements.viewer.childNodes].forEach((node) => { if (!previousViewerNodes.has(node)) node.remove(); });
        }
        setStatus(error?.message || String(error), true);
        throw error;
      }
      if (elements.xyz) elements.xyz.value = fullXyz;
      if (selected.detection.warnings.some((warning) => warning.code === "extension-content-mismatch")) {
        const mismatch = `Filename extension suggests ${selected.detection.warnings[0].extensionFormat}, but content is ${selected.detection.warnings[0].contentFormat}. Loaded as ${selected.detection.format}.`;
        setStatus([mismatch, ...(parsed.content.warnings || [])].join(" "));
      } else if (parsed.content.warnings?.length) {
        setStatus(parsed.content.warnings.join(" "));
      }
      if (elements.lossy) {
        const profile = payload.profile || {};
        const adjustments = [
          profile.hydrogenMode === "omit" ? "hydrogens omitted" : "",
          Number.isInteger(profile.coordinatePrecision) && profile.coordinatePrecision < 6 ? `${profile.coordinatePrecision}-decimal coordinates` : "",
        ].filter(Boolean);
        elements.lossy.hidden = adjustments.length === 0;
        elements.lossy.textContent = adjustments.length ? `Shared QR profile: ${adjustments.join(", ")}.` : "";
      }
      if (elements.viewer) elements.viewer.querySelector?.("p")?.remove?.();
      if (!selected.detection.warnings.length && !parsed.content.warnings?.length) setStatus("");
      activateRuntime(viewerId);
      return viewerId;
    }

    async function loadXyz(options = {}) {
      return loadStructure({ ...options, name: options.name || "Shared structure.xyz", explicitFormat: "xyz", replace: options.replace !== false });
    }

    async function loadDetachedSnapshot(input) {
      const snapshot = await dependencies.createDetachedSnapshot(input);
      const source = snapshot.sourceStructure;
      const modelId = snapshot.sceneDefinition.modelId;
      const previousViewerIds = [...runtime.keys()];
      workspace.addStructure(source);
      let viewerId;
      let instance;
      let pane;
      let host;
      let crystalPanel;
      try {
        viewerId = workspace.createViewer({
          name: source.displayName,
          structureId: source.structureId,
          sceneDefinition: snapshot.sceneDefinition,
          view: snapshot.view,
          camera: snapshot.camera,
          selection: snapshot.selection,
          measurements: snapshot.measurements,
        });
        const scene = await buildScene(source, snapshot.sceneDefinition);
        host = elements.viewer?.ownerDocument?.createElement?.("div") || elements.viewer;
        if (host !== elements.viewer) {
          host.className = "viewer-pane-host";
          host.id = `viewer-pane-${viewerId}`;
          host.setAttribute("role", "tabpanel");
          host.setAttribute("aria-labelledby", `workspace-tab-${viewerId}`);
          elements.viewer.append?.(host);
        }
        instance = new dependencies.ViewerInstance({ viewerId, workspace, rendererAdapter });
        instance.mount(host);
        pane = dependencies.createViewerPaneController({ viewerId, workspace, viewerInstance: instance });
        const priorPick = instance.callbacks.onPick;
        instance.callbacks.onPick = (pick) => Promise.resolve(priorPick(pick)).then(updateMeasurement).catch((error) => setStatus(error?.message || String(error), true));
        await instance.updateScene(scene);
        const exported = isCrystal(source)
          ? dependencies.exportCrystalXyz({ source, modelId, mode: "source-asymmetric-unit" })
          : dependencies.sourceModelToXyz(source, modelId);
        const payload = dependencies.share.createPayload({ xyz: exported, charge: 0, multiplicity: 1 });
        const entry = {
          viewerId, instance, pane, source, payload, modelId, host, operation: null,
          fullXyz: payloadToFullXyz(payload), coordinateRows: dependencies.share.coordinateRows(payload), exportMode: "source-asymmetric-unit",
        };
        runtime.set(viewerId, entry);
        if (isCrystal(source) && elements.crystalPanel) {
          crystalPanel = createCrystalPanel({
            document, container: elements.crystalPanel, source,
            initialState: crystalPanelState(snapshot.sceneDefinition, entry.exportMode),
            onChange: (normalized) => applyCrystalPanelChange(entry, normalized),
            onCancel: () => entry.operation?.abort?.(),
          });
          entry.crystalPanel = crystalPanel;
          crystalPanel.setWarnings(scene.warnings || source.warnings || []);
        }
        previousViewerIds.forEach(disposeRuntime);
        refreshExport(entry);
        activateRuntime(viewerId);
        setStatus("");
        return viewerId;
      } catch (error) {
        crystalPanel?.dispose?.();
        pane?.dispose?.();
        instance?.dispose?.();
        host?.remove?.();
        if (viewerId && workspace.getState().instances[viewerId]) workspace.close(viewerId);
        setStatus(error?.message || String(error), true);
        throw error;
      }
    }

    function openDetachedViewer(viewerId = workspace.getState().activeViewerId) {
      const current = runtime.get(viewerId);
      const viewer = workspace.getState().instances[viewerId];
      if (!current?.source || !viewer) return Promise.reject(new Error("Open a structure before opening a new window."));
      const child = windowObject.open?.("about:blank", "_blank", "width=960,height=760");
      if (!child) {
        const error = new Error("The popup was blocked. Allow popups and try again.");
        setStatus(error.message, true);
        return Promise.reject(error);
      }
      const session = dependencies.createTransferSession({ role: "parent", expectedSource: child, expectedOrigin: transferOrigin() });
      const url = new URL(location.href);
      url.searchParams.set("layout", "detached");
      url.hash = `nonce=${encodeURIComponent(session.nonce)}`;
      if (child.location?.replace) child.location.replace(url.href);
      else child.location = url.href;

      return new Promise((resolve, reject) => {
        let settled = false;
        let cancel;
        const timer = windowObject.setTimeout(() => finish(new Error("New-window transfer expired.")), 10_050);
        const cleanup = () => {
          windowObject.clearTimeout(timer);
          windowObject.removeEventListener("message", onMessage);
          transferCleanups.delete(cancel);
        };
        const finish = (error) => {
          if (settled) return;
          settled = true;
          cleanup();
          if (error) { setStatus(error.message, true); reject(error); }
          else { setStatus("Opened in a new window."); resolve(true); }
        };
        const onMessage = async (event) => {
          if (event?.data?.schema !== dependencies.MESSAGE_SCHEMA) return;
          try {
            const accepted = await session.receive(event);
            if (accepted.type === "ready") {
              const message = await session.createMessage("snapshot", {
                sourceStructure: current.source,
                sceneDefinition: viewer.sceneDefinition,
                view: viewer.view,
                camera: current.instance.getCamera(),
                selection: viewer.selection,
                measurements: viewer.measurements,
                crystalSettings: viewer.sceneDefinition.mode === "crystal" ? viewer.sceneDefinition.crystal : null,
              });
              child.postMessage(message, transferTargetOrigin());
            } else if (accepted.type === "ack") finish();
          } catch (error) {
            finish(error instanceof Error ? error : new Error(String(error)));
          }
        };
        cancel = () => finish(new Error("New-window transfer cancelled."));
        transferCleanups.add(cancel);
        windowObject.addEventListener("message", onMessage);
      });
    }

    function initializeDetachedTransfer(nonce) {
      const opener = windowObject.opener;
      if (!opener) throw new Error("Detached Viewer requires its opener window.");
      const session = dependencies.createTransferSession({ role: "child", nonce, expectedSource: opener, expectedOrigin: transferOrigin() });
      let active = true;
      const cleanup = () => {
        if (!active) return;
        active = false;
        windowObject.clearTimeout(timer);
        windowObject.removeEventListener("message", onMessage);
        transferCleanups.delete(cleanup);
      };
      const timer = windowObject.setTimeout(() => {
        if (!active) return;
        setStatus("New-window transfer expired.", true);
        cleanup();
      }, 10_050);
      const onMessage = async (event) => {
        if (event?.data?.schema !== dependencies.MESSAGE_SCHEMA) return;
        try {
          const accepted = await session.receive(event);
          if (accepted.type !== "snapshot") return;
          await loadDetachedSnapshot(accepted.snapshot);
          const ack = session.createMessage("ack");
          opener.postMessage(ack, transferTargetOrigin());
          cleanup();
          const cleanUrl = new URL(location.href);
          cleanUrl.hash = "";
          history?.replaceState?.(null, "", cleanUrl.href);
        } catch (error) {
          setStatus(error?.message || String(error), true);
          cleanup();
        }
      };
      transferCleanups.add(cleanup);
      windowObject.addEventListener("message", onMessage);
      opener.postMessage(session.createMessage("ready"), transferTargetOrigin());
    }

    async function importFiles(files, options = {}) {
      const viewerIds = [];
      for (const file of Array.from(files || [])) {
        const read = await dependencies.readStructureFile(file, {
          signal: options.signal,
          onProgress: ({ loaded, total }) => setStatus(`Reading ${file.name}: ${loaded}/${total || "?"}`),
        });
        viewerIds.push(await loadStructure({ text: read.text, name: read.name, replace: false, signal: options.signal }));
      }
      return viewerIds;
    }

    async function selectModel(viewerId, modelId) {
      const current = runtime.get(viewerId);
      if (!current) throw new Error(`Unknown Viewer instance: ${viewerId}`);
      const model = current.source.models.find((candidate) => candidate.modelId === modelId);
      if (!model) throw new Error(`Unknown model: ${modelId}`);
      if (current.modelId === modelId) return modelId;
      const viewer = workspace.getState().instances[viewerId];
      const definition = { ...viewer.sceneDefinition, modelId };
      workspace.patchViewer(viewerId, { sceneDefinition: definition, selection: [], measurements: [] });
      try {
        const scene = await buildScene(current.source, workspace.getState().instances[viewerId].sceneDefinition);
        await current.instance.updateScene(scene);
      } catch (error) {
        workspace.patchViewer(viewerId, { sceneDefinition: viewer.sceneDefinition, selection: viewer.selection, measurements: viewer.measurements });
        throw error;
      }
      current.modelId = modelId;
      const exported = isCrystal(current.source)
        ? dependencies.exportCrystalXyz({ source: current.source, modelId, mode: "source-asymmetric-unit" })
        : dependencies.sourceModelToXyz(current.source, modelId);
      current.payload = dependencies.share.createPayload({
        xyz: exported,
        charge: current.payload.charge,
        multiplicity: current.payload.multiplicity,
      });
      current.crystalPanel?.setState({ modelId });
      refreshExport(current);
      if (workspace.getState().activeViewerId === viewerId) activateRuntime(viewerId);
      return modelId;
    }

    async function initialize() {
      if (elements.tabs) tabs = dependencies.createWorkspaceTabs({
        workspace,
        container: elements.tabs,
        onActivate: activateRuntime,
        onClose: closeViewer,
        onReorder: (order) => workspace.reorder(order),
      });
      compactMedia?.addEventListener?.("change", applyWorkspaceLayout);
      wireControls();
      const nonce = detachedNonce();
      if (nonce) {
        document?.body?.classList?.add?.("is-detached");
        initializeDetachedTransfer(nonce);
        setStatus("Waiting for structure from the opener...");
        return null;
      }
      if (location?.hash) {
        const decoded = await dependencies.share.decodeHash(location.hash);
        if (decoded.version === 3) {
          const definition = { modelId: decoded.settings.modelId, mode: decoded.settings.mode, ...(decoded.settings.scene || {}) };
          return loadDetachedSnapshot({
            sourceStructure: decoded.source,
            sceneDefinition: definition,
            view: decoded.settings.view,
            camera: decoded.settings.camera || null,
            selection: [], measurements: [],
            crystalSettings: definition.mode === "crystal" ? definition.crystal : null,
          });
        }
        const payload = decoded.payload;
        return loadXyz({ text: payloadToFullXyz(payload), charge: payload.charge ?? 0, multiplicity: payload.multiplicity ?? 1 });
      }
      setStatus("Open or drop XYZ, MOL, SDF, PDB, CIF, or mmCIF files.");
      return null;
    }

    async function setDisplay(kind) {
      const current = activeRuntime();
      if (!current) return;
      workspace.patchViewer(current.viewerId, { view: { representation: { kind } } });
      await current.instance.updateView();
    }

    async function toggleLabels() {
      const current = activeRuntime();
      if (!current) return;
      const state = workspace.getState().instances[current.viewerId];
      const active = state.view.labels.mode !== "none";
      workspace.patchViewer(current.viewerId, { view: { labels: { mode: active ? "none" : "element-index", showSelectionOrder: true } } });
      elements.labels?.setAttribute("aria-pressed", String(!active));
      await current.instance.updateView();
    }

    async function copyCoordinates() {
      const current = activeRuntime();
      if (!current) return false;
      try { refreshExport(current, { strict: true }); }
      catch (error) { setStatus(error?.message || String(error), true); return false; }
      const text = current.coordinateRows;
      try { await navigator.clipboard.writeText(text); setStatus(`${current.exportSummary || "Coordinates"} copied.`); return true; }
      catch (_error) { if (elements.xyz) { elements.xyz.value = text; elements.xyz.focus(); elements.xyz.select(); } return document.execCommand?.("copy") === true; }
    }

    function wireControls() {
      elements.open?.addEventListener("click", () => elements.file?.click());
      elements.newViewer?.addEventListener("click", newViewer);
      elements.duplicateViewer?.addEventListener("click", () => report(duplicateViewer()));
      elements.openDetached?.addEventListener("click", () => report(openDetachedViewer()));
      elements.compareViewer?.addEventListener("click", () => {
        if (workspace.getState().layout === "side-by-side") exitComparison();
        else {
          const candidate = comparisonCandidates()[0];
          if (candidate) report(setComparison(candidate));
        }
      });
      elements.secondaryViewer?.addEventListener("change", () => report(setComparison(elements.secondaryViewer.value)));
      elements.file?.addEventListener("change", async () => { if (elements.file.files?.length) await importFiles(elements.file.files); });
      elements.stage?.addEventListener("dragover", (event) => event.preventDefault());
      elements.stage?.addEventListener("drop", async (event) => { event.preventDefault(); if (event.dataTransfer?.files?.length) await importFiles(event.dataTransfer.files); });
      elements.stage?.addEventListener("dblclick", (event) => { if (event.target === elements.stage || event.target === elements.viewer) report(activeRuntime()?.pane.clearSelection()).then(updateMeasurement); });
      const report = (work) => Promise.resolve(work).catch((error) => setStatus(error?.message || String(error), true));
      elements.model?.addEventListener("change", () => {
        const current = activeRuntime();
        if (current) report(selectModel(current.viewerId, elements.model.value));
      });
      elements.style?.addEventListener("change", () => report(setDisplay(elements.style.value)));
      elements.labels?.addEventListener("click", () => report(toggleLabels()));
      elements.clear?.addEventListener("click", () => report(activeRuntime()?.pane.clearSelection()).then(updateMeasurement));
      elements.reset?.addEventListener("click", () => activeRuntime()?.instance.updateCamera(null));
      elements.showXyz?.addEventListener("click", () => { if (!elements.xyzPanel) return; elements.xyzPanel.open = !elements.xyzPanel.open; elements.showXyz.setAttribute("aria-expanded", String(elements.xyzPanel.open)); });
      elements.copy?.addEventListener("click", copyCoordinates);
      elements.exportXyz?.addEventListener("click", () => {
        const current = activeRuntime();
        if (!current || !root.URL) return;
        try { refreshExport(current, { strict: true }); }
        catch (error) { setStatus(error?.message || String(error), true); return; }
        const blob = new Blob([current.fullXyz], { type: "chemical/x-xyz;charset=utf-8" });
        const link = document.createElement("a"); link.href = root.URL.createObjectURL(blob);
        link.download = dependencies.sanitizeDownloadName(current.source.displayName, ".xyz"); link.click(); root.URL.revokeObjectURL(link.href);
        setStatus(`${current.exportSummary || "XYZ"} exported.`);
      });
      elements.share?.addEventListener("click", () => {
        const current = activeRuntime(); if (!current) return;
        const xyz = isCrystal(current.source)
          ? dependencies.exportCrystalXyz({ source: current.source, modelId: current.modelId, mode: "source-asymmetric-unit" })
          : current.fullXyz;
        report(dependencies.share.openDialog({
          source: current.source,
          settings: sharedViewerSettings(current),
          xyz,
          charge: current.payload.charge,
          multiplicity: current.payload.multiplicity,
        }));
      });
      elements.png?.addEventListener("click", async () => {
        const blob = await activeRuntime()?.instance.capturePng();
        if (!blob || !root.URL) return;
        const link = document.createElement("a"); link.href = root.URL.createObjectURL(blob); link.download = "structure-viewer.png"; link.click(); root.URL.revokeObjectURL(link.href);
      });
    }

    function dispose() {
      [...transferCleanups].forEach((cleanup) => cleanup());
      tabs?.dispose();
      compactMedia?.removeEventListener?.("change", applyWorkspaceLayout);
      [...runtime.keys()].forEach(disposeRuntime);
    }

    return Object.freeze({ workspace, initialize, newViewer, closeViewer, duplicateViewer, setComparison, exitComparison, loadXyz, loadStructure, loadDetachedSnapshot, openDetachedViewer, importFiles, selectModel, setDisplay, toggleLabels, copyCoordinates, dispose });
  }

  return { payloadToFullXyz, createStandaloneViewerController };
});
