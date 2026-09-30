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

## Local check

Open `index.html` directly with `file:`, through the Research Toolkit Local
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

- No server storage, analytics, or backend is used.
- Very large structures can exceed URL or QR limits. QR generation reports
  capacity rather than silently reducing scientific content.
- The viewer is not a structure editor; edits remain in the originating Toolkit
  tool.
- A `localhost` or `file:` URL is local to that computer. Cross-device links
  must use the configured public deployment URL.
