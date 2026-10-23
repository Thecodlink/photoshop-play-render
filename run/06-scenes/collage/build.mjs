#!/usr/bin/env node
/**
 * vox-photoshop-play — Vox paper-collage film, VERTICAL 1080x1920, 75.47s, Jessica narration.
 * Scene markup + timeline code were written by GLM (Z.ai glm-4.7-flash) from briefs in
 * ../glm/ (brief-A/B/C); raw replies in ../glm/out-*.txt are injected verbatim below.
 * This scaffold (head, fonts, assembly) is the integration layer.
 *   node build.mjs && npx -y hyperframes@0.8.33 lint .
 */
import { writeFileSync, readFileSync } from "node:fs";
import { CSS, DEFS, HELPERS, torn, cut, tag, stamp, card, title3d, pin, route } from "./collage-kit.mjs";

const DUR = 75.67;
const W = 1080, H = 1920;
const SFX = [];
const collectSfx = (s) => s.replace(/\$\{sfx\(\s*([\d.]+)\s*,\s*"([^"]+)"\s*,\s*([\d.]+)\s*\)\}/g,
  (_, t, f, g) => { SFX.push([+t, f, +g]); return ""; });
// Camera pushes chain across scenes: every #cam fromTo after the first must not
// immediate-render its from-state during earlier scenes (lint: gsap_repeated_fromto_without_baseline).
let camSeen = 0;
const fixCam = (s) => s.replace(/tl\.fromTo\("#cam",\s*(\{[^{}]*\}),\s*(\{[^{}]*\}),/g,
  (m, from, to) => {
    camSeen += 1;
    if (camSeen === 1) return m;
    const dest = /immediateRender:\s*\w+/.test(to)
      ? to.replace(/immediateRender:\s*\w+/, "immediateRender: false")
      : to.replace(/\}$/, ", immediateRender: false }");
    return `tl.fromTo("#cam", ${from}, ${dest},`;
  });
const strip = (s) => s.replace(/^```[a-z]*\n?/i, "").replace(/\n?```\s*$/i, "").trim();
const rawMarkup = strip(readFileSync(new URL("../glm/out-A-markup.txt", import.meta.url), "utf8"));
// GLM's markup uses ${...} kit interpolations (card/tag/stamp/cut/title3d/torn) that must
// EVALUATE at build time — inserting the raw string would leave them as literal text.
const MARKUP = new Function("torn", "cut", "tag", "stamp", "card", "title3d", "pin", "route",
  "return `" + rawMarkup + "`;")(torn, cut, tag, stamp, card, title3d, pin, route);
const TL1 = fixCam(collectSfx(strip(readFileSync(new URL("../glm/out-B-timeline-1.txt", import.meta.url), "utf8"))));
const TL2 = fixCam(collectSfx(strip(readFileSync(new URL("../glm/out-C-timeline-2.txt", import.meta.url), "utf8"))));

const HEADFONTS = `
  <style>
    @font-face { font-family: "Playfair Display"; src: url("assets/fonts/PlayfairDisplay-VF.woff2") format("woff2"); font-weight: 400 900; }
    @font-face { font-family: "Archivo Narrow"; src: url("assets/fonts/ArchivoNarrow-700.woff2") format("woff2"); font-weight: 700; }
    @font-face { font-family: "Permanent Marker"; src: url("assets/fonts/PermanentMarker-400.woff2") format("woff2"); font-weight: 400; }
  </style>
  <script src="assets/gsap.min.js"></script>`;

const html = `<!doctype html>
<html lang="en" data-resolution="portrait">
<head>
  <meta charset="UTF-8" /><meta name="viewport" content="width=${W}, height=${H}" />
  ${HEADFONTS}
  <style>${CSS}
    html, body { width: ${W}px; height: ${H}px; overflow: hidden; background: #1F1D1B; }
    .xm { position: absolute; opacity: 0; }
  </style>
</head>
<body>
  ${DEFS}
  <div id="root" data-composition-id="main" data-start="0" data-duration="${DUR}" data-width="${W}" data-height="${H}">
    <div id="stage" class="clip" data-start="0" data-duration="${DUR}" data-track-index="0" data-layout-allow-overflow data-layout-allow-overlap data-layout-allow-occlusion>
      <div id="cam" style="position:absolute; inset:0;">
${MARKUP}
      </div>
      <div id="grain"></div>
      <div id="vig"></div>
    </div>
  </div>
  <script>
    window.__timelines = window.__timelines || {};
    const tl = gsap.timeline({ paused: true });
    ${HELPERS}
    boil(${DUR});
${TL1}
${TL2}
    window.__timelines["main"] = tl;
  </script>
</body>
</html>`;
writeFileSync(new URL("./index.html", import.meta.url), html);
writeFileSync(new URL("./sfx.json", import.meta.url), JSON.stringify(SFX));
console.log("built index.html ·", SFX.length, "sound cues · markup", MARKUP.length, "chars · tl", TL1.length + TL2.length, "chars");
