# Structure Viewer

Static, single-structure viewer for Research Toolkit share URLs. Structure data
is compressed into the URL fragment and is not sent to a server by the Viewer.

## Target public viewer and URL compatibility

The intended production deployment is:

`https://ysato-mol.github.io/research-toolkit-web/`

The current private source generates lossless `structure-share/2` links for
that target:

`https://ysato-mol.github.io/research-toolkit-web/#v=2&data=<codec>.<base64url>`

Treat this as the target deployment until the allowlisted public sync, push,
and GitHub Pages verification in the publication workflow are complete.

Lossless links preserve atom order, element symbols, coordinate tokens, charge,
and multiplicity. Title, display style, labels, camera, selection, measurements,
and bonds are not shared. Bonds are inferred from the coordinates when the link
opens.

Legacy migration note: existing `structure-share/1` links remain readable and
are normalized to the current Viewer input model. Research Toolkit no longer
creates new v1 links.

## Sharing and QR limits

**Copy URL** creates the lossless v2 link immediately. **Make QR** opens QR-only
settings for coordinate precision (Lossless, 0.0001, 0.001, 0.01, or 0.05 A),
hydrogen inclusion, charge inclusion, multiplicity inclusion, and error
correction (L, M, Q, or H). The QR profile is still `structure-share/2`.

The browser tests the complete URL against the real byte-mode encoder up to the
standard maximum QR version 40. **Generate QR** is available only when the
selected profile fits one QR. **Auto fit** tries the highest-quality profiles
first, omits multiplicity and then charge only at 0.05 A, and removes hydrogens
only after all higher-quality all-atom choices fail. Some large structures may
not fit one QR even after Auto fit; the lossless URL remains available.

QR generation and PNG saving happen locally. PNG output is a black-on-white QR
with an integer module scale and at least a four-module quiet zone; the long URL
is not painted into the image.

## Coordinates

**Show XYZ** displays a complete XYZ document with atom count and the fixed
comment `Research Toolkit shared structure`. **Copy coordinates** copies only
the `Element X Y Z` rows, preserving the decoded coordinate tokens and omitting
the atom count and comment. Its clipboard fallback selects the same
coordinate-only text.

## Local check

Open `index.html` through the Research Toolkit Local Helper, or serve the
repository with any static HTTP server. A URL without share data intentionally
shows an error.

## Publication workflow

`research-toolkit/web/structure-viewer/` in the private repository is the sole
source of truth. Never edit generated Viewer files directly in the public
checkout.

The public checkout origin fetch and push URLs must both be exactly:

`https://github.com/ysato-mol/research-toolkit-web.git`

Publish in this order:

1. Implement and run the complete private regression gate in
   `research-toolkit`.
2. Before changing public files, replace all configured fetch and push URLs with
   one exact URL each, then require both complete lists to contain exactly that
   one value:

   ```powershell
   $expectedRemote = "https://github.com/ysato-mol/research-toolkit-web.git"
   git -C ..\research-toolkit-web config --replace-all remote.origin.url $expectedRemote
   git -C ..\research-toolkit-web config --replace-all remote.origin.pushurl $expectedRemote
   $fetchRemotes = @(git -C ..\research-toolkit-web remote get-url --all origin)
   $pushRemotes = @(git -C ..\research-toolkit-web remote get-url --push --all origin)
   $fetchRemotes
   $pushRemotes
   if ($fetchRemotes.Count -ne 1 -or $fetchRemotes[0] -cne $expectedRemote -or
       $pushRemotes.Count -ne 1 -or $pushRemotes[0] -cne $expectedRemote) {
     throw "Public fetch/push remote lists must each contain only the expected URL."
   }
   git -C ..\research-toolkit-web status --short
   ```

3. Preview the exact allowlisted operation. DryRun reports the private commit
   used for cache versions and writes nothing:

   ```powershell
   .\scripts\sync_structure_viewer_to_public.ps1 -DestinationPath ..\research-toolkit-web -DryRun
   ```

4. Run the same command without `-DryRun` to generate the public files:

   ```powershell
   .\scripts\sync_structure_viewer_to_public.ps1 -DestinationPath ..\research-toolkit-web
   ```

5. Review the generated public checkout before committing:

   ```powershell
   git -C ..\research-toolkit-web status --short
   git -C ..\research-toolkit-web diff --
   git -C ..\research-toolkit-web diff --check
   ```

6. Commit the reviewed generated files in `research-toolkit-web`, push to the
   verified origin without force-pushing, and open
   `https://ysato-mol.github.io/research-toolkit-web/`.
7. On GitHub Pages, verify desktop and approximately 390 px mobile layouts,
   display styles, labels, selection/measurement behavior, reset, XYZ display,
   coordinate copying, lossless URL sharing, QR capacity and Auto fit, PNG
   saving, and desktop/touch resize behavior.

The synchronization script validates the source, destination Git repository,
exactly one fetch and one push origin URL, and every managed path before
writing. It copies only its explicit allowlist, never pushes, never recursively
deletes the destination, rejects reparse-point paths, and never changes `.git/`.
It replaces the private build placeholder in generated `index.html` with the
tested private commit ID so all Viewer assets share one cache version.

## Browsers

Current Chrome, Edge, Firefox, and Safari on Windows, macOS, iOS, and Android
are supported. Mouse/touch rotation and wheel/pinch zoom are provided by the
bundled 3Dmol.js viewer.

## Vendored QR encoder

QR matrix generation uses the pinned `qrcode-generator` 1.4.4 browser build and
its MIT license under `vendor/`. Both are published from the private source by
the allowlisted sync. There is no runtime CDN or external QR service, and no
upload.

## Limits

- One XYZ structure is stored per URL.
- There is no editing, server storage, analytics, or backend.
- Very large lossless URLs can exceed limits in messaging apps or browsers;
  Research Toolkit warns at 8,000 characters.
- A saved local, loopback, or `file:` Viewer address is migrated to the public
  production URL. An intentional valid HTTPS custom deployment remains usable.
