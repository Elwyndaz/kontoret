// Enumerates every path through the five dilemmas and prints the archetype split.
// Run: node scripts/balance.ts  (Node 24 strips the types itself.)
import { applyChoice, createState, dilemmas, evaluate } from "../src/data/story.ts";

const counts = new Map<string, number>();
const paths = 3 ** dilemmas.length;
for (let n = 0; n < paths; n += 1) {
  const state = createState();
  let rest = n;
  for (const dilemma of dilemmas) {
    applyChoice(state, dilemma.choices[rest % 3]);
    rest = Math.floor(rest / 3);
  }
  const name = evaluate(state).archetype.name;
  counts.set(name, (counts.get(name) ?? 0) + 1);
}
for (const [name, count] of counts) console.log(`${name.padEnd(14)} ${String(count).padStart(3)}  ${Math.round((count / paths) * 100)} %`);
const share = (counts.get("MÖTESBOKAREN") ?? 0) / paths;
if (counts.size !== 4) { console.error("FAIL: not every archetype is reachable"); process.exit(1); }
if (share < 0.1 || share > 0.4) { console.error(`FAIL: Mötesbokaren at ${Math.round(share * 100)} %, wanted 10 to 40`); process.exit(1); }
console.log("balance ok");
