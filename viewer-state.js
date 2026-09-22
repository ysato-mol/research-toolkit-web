(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  if (root) root.StructureViewerState = api;
})(typeof window !== "undefined" ? window : globalThis, function () {
  "use strict";

  function freezeStyle(style) {
    Object.values(style).forEach(Object.freeze);
    return Object.freeze(style);
  }

  const DISPLAY_STYLES = Object.freeze({
    "ball-stick": freezeStyle({
      stick: { radius: 0.13 },
      sphere: { scale: 0.28 },
    }),
    stick: freezeStyle({
      stick: { radius: 0.15 },
    }),
    spacefill: freezeStyle({
      sphere: { scale: 1 },
    }),
  });

  function toggleSelection(selectedIndices, atomIndex) {
    const position = selectedIndices.indexOf(atomIndex);
    if (position < 0) return [...selectedIndices, atomIndex];
    return selectedIndices.filter((_, index) => index !== position);
  }

  function measurementForSelection(atoms, indices, math) {
    const selected = indices.map((index) => atoms[index]);
    if (selected.length === 2) {
      return { kind: "Distance", value: math.distance(selected[0], selected[1]), unit: "A", precision: 3 };
    }
    if (selected.length === 3) {
      return { kind: "Angle", value: math.angle(selected[0], selected[1], selected[2]), unit: "deg", precision: 2 };
    }
    if (selected.length === 4) {
      return { kind: "Dihedral", value: math.dihedral(selected[0], selected[1], selected[2], selected[3]), unit: "deg", precision: 2 };
    }
    return null;
  }

  function coordinateRowsFromAtoms(atoms) {
    return atoms.map((atom) => `${atom.elem || atom.element} ${atom.x} ${atom.y} ${atom.z}`).join("\n");
  }

  function positionFromAtom(atom) {
    return { x: atom.x, y: atom.y, z: atom.z };
  }

  function atomLabelSpec(atom) {
    return {
      position: positionFromAtom(atom),
      fontSize: 12,
      fontColor: "#1a1a1a",
      backgroundColor: "#ffffff",
      backgroundOpacity: 0.82,
      borderThickness: 0,
      alignment: "center",
      screenOffset: { x: 0, y: 0 },
      inFront: true,
    };
  }

  function selectionLabelSpec(atom) {
    return {
      position: positionFromAtom(atom),
      fontSize: 11,
      fontColor: "#ffffff",
      backgroundColor: "#1c3177",
      backgroundOpacity: 0.92,
      borderThickness: 0,
      alignment: "center",
      screenOffset: { x: 0, y: 0 },
      inFront: true,
    };
  }

  function selectionLabelSpecs(atoms, indices) {
    return indices.map((atomIndex, index) => ({
      text: String(index + 1),
      spec: selectionLabelSpec(atoms[atomIndex]),
    }));
  }

  return {
    DISPLAY_STYLES,
    toggleSelection,
    measurementForSelection,
    coordinateRowsFromAtoms,
    atomLabelSpec,
    selectionLabelSpec,
    selectionLabelSpecs,
  };
});
