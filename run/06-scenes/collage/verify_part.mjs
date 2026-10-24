import { readFileSync } from "node:fs";
import * as kit from "./collage-kit.mjs";
const { torn, cut, tag, stamp, card, title3d, pin, route } = kit;
const file = process.argv[2];
const raw = readFileSync(file, "utf8");
let out;
try {
  out = new Function("torn", "cut", "tag", "stamp", "card", "title3d", "pin", "route",
    "return `" + raw + "`;")(torn, cut, tag, stamp, card, title3d, pin, route);
} catch (e) { console.log("EVAL-FAIL", e.message); process.exit(1); }
let depth = 0, min = 0;
for (const m of out.matchAll(/<div\b|<\/div>/g)) { depth += m[0].startsWith("<div") ? 1 : -1; min = Math.min(min, depth); }
const ids = [...out.matchAll(/ id="([^"]+)"/g)].map((m) => m[1]);
console.log(`BALANCE final=${depth} min=${min} ids=${ids.length}`);
if (depth !== 0 || min < 0) { console.log("UNBALANCED"); process.exit(2); }
console.log("IDS:", ids.join(","));
