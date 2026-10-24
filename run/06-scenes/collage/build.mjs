#!/usr/bin/env node
/**
 * vox-photoshop-play — Vox paper-collage film, VERTICAL 1080x1920, 122.55s, Jessica narration.
 * Scene markup + timeline code were written by GLM (Z.ai glm-4.7-flash) from briefs in
 * ../glm/ (brief-A/B/C); raw replies in ../glm/out-*.txt are injected verbatim below.
 * This scaffold (head, fonts, assembly) is the integration layer.
 *   node build.mjs && npx -y hyperframes@0.8.33 lint .
 */
import { writeFileSync, readFileSync } from "node:fs";
import { CSS, DEFS, HELPERS, torn, cut, tag, stamp, card, title3d, pin, route } from "./collage-kit.mjs";

const DUR = 122.55;
const W = 1080, H = 1920;
const SFX = [];
const BLACKOUT = [76.44, 80.46]; // F4: no SFX from L16 start (76.44) until 0.5s into L17 (79.96+0.5)
const collectSfx = (s) => s.replace(/\$\{sfx\(\s*([\d.]+)\s*,\s*"([^"]+)"\s*,\s*([\d.]+)\s*\)\}/g,
  (_, t, f, g) => { const tt = +t; if (tt >= BLACKOUT[0] && tt < BLACKOUT[1]) { console.log("F4 blackout: dropped sfx", tt, f); return ""; } SFX.push([tt, f, +g]); return ""; });
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
const rawMarkup = ["out-S1.txt", "out-S2-one.txt", "out-S3-one.txt", "out-S4-one.txt", "out-S5.txt", "out-S6.txt", "out-S7.txt", "out-S8S9.txt"]
  .map((f) => strip(readFileSync(new URL("../glm/" + f, import.meta.url), "utf8"))).join("\n");
// GLM's markup uses ${...} kit interpolations (card/tag/stamp/cut/title3d/torn) that must
// EVALUATE at build time — inserting the raw string would leave them as literal text.
const MARKUP = new Function("torn", "cut", "tag", "stamp", "card", "title3d", "pin", "route",
  "return `" + rawMarkup + "`;")(torn, cut, tag, stamp, card, title3d, pin, route);
const TL1 = fixCam(collectSfx(strip(readFileSync(new URL("../glm/out-T1.txt", import.meta.url), "utf8"))));
const TL2 = fixCam(collectSfx(strip(readFileSync(new URL("../glm/out-T2.txt", import.meta.url), "utf8"))));
const TL3 = fixCam(collectSfx(strip(readFileSync(new URL("../glm/out-T3.txt", import.meta.url), "utf8"))));

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
  .spot { position:absolute; inset:0; opacity:0; pointer-events:none; }
  .tag, .sign { box-shadow: 0 10px 22px rgba(20,17,14,0.30); }
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

    // --- v2 integration helpers: continuous hover drift + warm spotlight ---
    const floaty = (sel, at, amp = 7, per = 2.8) => {
      const n = Math.max(1, Math.ceil((${DUR} - at) / per));
      tl.to(sel, { y: -amp, duration: per / 2, ease: "sine.inOut", yoyo: true, repeat: 2 * n - 1, immediateRender: false }, at);
    };
    const spotOn = (sel, at) => tl.to(sel, { opacity: 1, duration: 0.45, ease: "sine.inOut", immediateRender: false }, at);
    const spotOff = (sel, at) => tl.to(sel, { opacity: 0, duration: 0.55, ease: "sine.inOut", immediateRender: false }, at);
    boil(${DUR});
${TL1}
${TL2}
${TL3}
    window.__timelines["main"] = tl;
  </script>
</body>
</html>`;
writeFileSync(new URL("./index.html", import.meta.url), html);
writeFileSync(new URL("./sfx.json", import.meta.url), JSON.stringify(SFX));
console.log("built index.html ·", SFX.length, "sound cues · markup", MARKUP.length, "chars · tl", TL1.length + TL2.length, "chars");
