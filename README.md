# Structure Viewer

Static, browser-only molecular and crystal viewer for Research Toolkit. It
accepts XYZ, MOL/SDF, PDB, CIF, and mmCIF input, keeps independent state for
multiple viewer tabs, and supports measurement, PNG/coordinate export, QR
sharing, and detached windows. Share payloads stay in the URL fragment and are
not sent to a server by the viewer.

Existing `structure-share/1` and XYZ `structure-share/2` links remain readable.
Lossless multi-format and crystal state uses `structure-share/3`; crystal shares
store the source structure and viewer settings rather than an expanded
supercell.

QR generation uses the vendored MIT-licensed `qrcode-generator` 1.4.4 runtime. It is browser-local, with no runtime CDN or external QR service.

The compact toolbar and tabbed right panel match Geometry Editor. The panel
folds below the canvas on narrow screens; crystal controls appear only for
crystal sources. Toolkit routes reuse the shared navigation, language, and
theme settings. Public and standalone copies retain the same workbench with
self-contained settings and assets.

Keep the CSS, app and bundle query versions in index.html synchronized and
change them with each public release so returning browsers load the new UI.

## Formats and chemistry policy

Supported formats are XYZ, MOL V2000/V3000, SDF V2000/V3000, PDB, CIF, and
mmCIF. Multi-record SDF and multi-model PDB inputs remain distinct models in
the normalized source. Deferred formats are formats outside this list, such as
MOL2, CUBE, and POSCAR; the Viewer rejects them instead of guessing a parser.

Source bonds from MOL/SDF/PDB or a trusted Toolkit caller are authoritative.
An explicitly complete bond graph, including an empty graph, is never replaced
or extended by distance inference. Bond inference is allowed only when the
source has no authoritative graph. Transition-metal bonds are not inferred
automatically.

Crystal sources retain their asymmetric unit, exact symmetry operations,
occupancy, and disorder information. The scene selector can derive an
**asymmetric unit**, **unit cell**, **symmetry mates**, radius-based **packing**,
or a bounded **supercell** without mutating the source. Crystal XYZ export is
explicitly one of **source asymmetric unit**, **visible scene**, or **selected
component**; an invalid or missing component selection fails closed.

## Toolkit caller API

Toolkit tools call the shared Viewer through:

```js
StructureViewerApi.open({
  text,
  format,
  displayName,
  bonds,
  charge,
  multiplicity,
  initialView,
  destination,
});
```

`bonds` is optional and uses zero-based atom endpoints. When supplied, it is a
validated authoritative graph for those coordinates. `destination` selects the
current Viewer, a new Viewer tab/window, or URL sharing according to the
calling tool's workflow.

## Local check

Open `index.html` directly with `file://`, through the Research Toolkit Local
Helper, or from any static HTTP server. The deterministic classic bundle has no
runtime module, Worker, WASM, or local-asset fetch requirement. A URL without
share data intentionally shows an error, but local files can be loaded from the
Viewer UI.

## Public viewer

The default cross-device viewer is:

`https://ysato-mol.github.io/research-toolkit-web/`

The complete `research-toolkit/web/structure-viewer/` directory is the only source of truth. Do not edit matching files directly in `research-toolkit-web`; publish them with the synchronization script below.

## Publish workflow

1. Implement and test changes in the private `research-toolkit` repository.
2. Run all related tests before touching the public repository:

   ```powershell
   node tests/structure_share.test.js
   py -m unittest tests.test_structure_viewer_sync
   ```

3. Preview the exact allowlisted copy operation. This does not write files:

   ```powershell
   .\scripts\sync_structure_viewer_to_public.ps1 -DryRun
   ```

4. Synchronize the allowlisted Viewer files:

   ```powershell
   .\scripts\sync_structure_viewer_to_public.ps1
   ```

5. Review the public repository before committing:

   ```powershell
   git -C ..\research-toolkit-web status --short
   git -C ..\research-toolkit-web diff --
   ```

6. Commit and push from `research-toolkit-web` only after the diff contains the expected generated Viewer changes. Then open the GitHub Pages URL with a real `#v=1&data=...` payload and verify rendering, desktop resize, fixed mobile sizing, labels, measurements, reset, XYZ display, and XYZ copy.

The sync script validates the source, destination Git repository, and expected GitHub remote. It copies only its explicit file allowlist, never pushes, never recursively deletes the destination, and never changes `.git/`. Retired public files must be added explicitly to the script's safe retired-file list.

## Share formats

`https://ysato-mol.github.io/research-toolkit-web/#v=1&data=<codec>.<base64url>`

- v1: legacy XYZ read compatibility.
- v2: current compact XYZ sharing and QR profiles.
- v3: lossless multi-format/crystal source plus scene and view settings.

Modern browsers use deflate compression where the protocol permits it; the
classic bundle retains compatible browser-local fallbacks.

## Browsers

The release gate records tested Chrome and Edge versions in
`release-manifest.json` for both HTTP and direct `file:` operation. Mouse/touch
rotation and wheel/pinch zoom are provided by the bundled 3Dmol.js viewer.

## Crystal display controls

New CIF imports show one unit cell with symmetry equivalents. Asymmetric-unit
view remains an explicit option. Normal **Packing** starts with the same cell
and reuses **Supercell** expansion. Add or remove one layer toward +a/-a,
+b/-b or +c/-c; the controls use crystallographic axes, including triclinic
cells. Integer translation ranges are shown separately from geometric bounds:
b=[-1,0] contains two cells and its frame extends from fractional -1 to +1.
The 1 x 1 x 1 preset resets the ranges. Common lattice edges are drawn once.

Finite molecules belong to the cell containing their completed fractional
centroid. Bond-connected atoms are completed together and can extend beyond
the requested frame; these atoms do not count as additional requested cells.
Periodic networks are clipped to the requested range and report that finite
molecule completion is unavailable. Hiding molecules does not move the grid.

Molecule-count and radius packing remain advanced modes. Existing share v3
settings, including explicit legacy count/radius and wrapping settings, are
restored as saved. Ranges, grid visibility and hidden periodic components are
stored in new shares without changing source content or atom identity.

XYZ display, copy and file export default to the visible crystal scene, including
expanded packing cells and excluding hidden molecules. Source asymmetric unit and
selected component remain explicit export choices; coordinates retain their lattice
positions independently of camera rotation. Copy outputs coordinate rows; XYZ file
export includes the atom count and comment header.

A fixed upper-left a/b/c orientation indicator follows the camera rotation and
uses the actual (including triclinic) lattice basis. Crystal axes can be toggled
independently of cell edges; their visibility is retained in v3 shares. Explicit
axis settings in saved shares are honored. Representation names are ball & stick,
stick and spacefill in both interface languages.

Crystal View controls switch between Perspective and Orthographic, view from
the positive/negative a/b/c sides, and rotate around actual crystallographic
axes. Rotation starts at 5 degrees per click and accepts 0.1–180 degrees.
Axis views use a perpendicularized secondary crystal direction for screen-up;
they do not turn a triclinic lattice into an orthogonal box. Camera operations
preserve target/distance and source/displayed XYZ coordinates. Projection and
orientation are retained in v3 shares and duplicates, including after Reset.

Distance, angle and dihedral values appear at the lower left of the viewer.
Selected-atom details are in Info / XYZ; there is no Measurements tab. Double-click inside a
viewer, including its canvas, to clear that viewer's selection.
The 3D viewer retains selection/order labels and measurement helper lines;
it does not generate numeric measurement labels, including for older shares.

Crystal information includes reported cell standard uncertainties (parentheses),
R1 and wR2 for observed/all reflections, goodness of fit, Flack, reflection counts,
density and residual-density RMS/extrema. Missing Flack values are marked as not
reported. Statistics refer to the original CIF, independent of display expansion.
Allowlisted raw reporting tokens are display metadata, excluded from scientific
contentIdentity, and retained in new v3 shares. Older shares remain readable.

## Build and acceptance

```powershell
node scripts\build_structure_viewer_bundle.js
node scripts\build_structure_viewer_release_manifest.js
node scripts\run_structure_viewer_release_tests.js
py -m unittest tests.test_structure_viewer_sync
```

The generated `release-manifest.json` records source hashes, the bundle hash,
public files, vendored licenses, capabilities, and tested browser versions. It
contains no generation timestamp, so identical sources produce byte-identical
release metadata. See `docs/structure-viewer-release-checklist.md` for the
recorded acceptance evidence.

## Limits

- Input is limited to 32 MiB, 250,000 source atom sites, 1,000,000 source
  bonds, 10,000 models/records, and 512 symmetry operations.
- Derived scenes are limited to 300,000 derived atoms and 1,200,000 derived
  bonds. Replication ranges are bounded to -10..10 per axis.
- Share v3 is limited to 8 MiB decoded JSON and 12,000,000 encoded-fragment
  characters. QR output is limited to a 2,953-byte final URL; capacity failure
  is reported rather than silently changing scientific content.

## Known limitations

- No server storage, analytics, or backend is used.
- Parsing and crystal expansion use cooperative main-thread slices. A Worker is
  not required or shipped in this release.
- Very large URL shares remain subject to browser and messaging limits even
  when they are below the codec limits.
- The viewer is not a structure editor; edits remain in the originating Toolkit
  tool.
- A `localhost` or `file:` URL is local to that computer. Cross-device links
  must use the configured public deployment URL.
- Browser release evidence covers current Windows Chrome and Edge. macOS
  browser acceptance remains environment-dependent.
- The 300,000-derived-atom limit is enforced and covered at 299,999, 300,000,
  and 300,001 derived atoms; browser evidence also includes a 27,783-atom
  crystal scene.
