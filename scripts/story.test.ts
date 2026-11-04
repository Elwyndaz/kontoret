// Unit tests for the scoring in src/data/story.ts, written against surviving Stryker mutants.
// Run: node --test scripts/story.test.ts  (Node strips the types itself.)
import assert from "node:assert/strict";
import { test } from "node:test";
import { applyChoice, createState, dilemmas, evaluate, openerFor, type Choice, type Dilemma, type StoryState } from "../src/data/story.ts";

function state(tydlighet: number, trygghet: number, delaktighet = 0, tags: string[] = []): StoryState {
  return { scores: { tydlighet, trygghet, delaktighet }, tags: new Set(tags) };
}

const name = (s: StoryState) => evaluate(s).archetype.name;

test("createState starts at zero with no tags, and every call is a fresh object", () => {
  const a = createState();
  assert.deepEqual(a.scores, { tydlighet: 0, trygghet: 0, delaktighet: 0 });
  assert.equal(a.tags.size, 0);
  a.scores.tydlighet = 5;
  a.tags.add("x");
  const b = createState();
  assert.equal(b.scores.tydlighet, 0);
  assert.equal(b.tags.size, 0);
});

test("applyChoice adds the tag and every effect, and leaves other axes alone", () => {
  const s = createState();
  const choice: Choice = { prompt: "", response: "", effects: { tydlighet: 1, trygghet: -1 }, tag: "t1" };
  applyChoice(s, choice);
  applyChoice(s, choice);
  assert.deepEqual(s.scores, { tydlighet: 2, trygghet: -2, delaktighet: 0 });
  assert.deepEqual([...s.tags], ["t1"]);
});

test("archetype quadrants split exactly at 2 on tydlighet and trygghet", () => {
  assert.equal(name(state(2, 2)), "DIRIGENTEN");
  assert.equal(name(state(2, 1)), "KAPTENEN");
  assert.equal(name(state(1, 2)), "DIPLOMATEN");
  assert.equal(name(state(1, 1)), "MÖTESBOKAREN");
  assert.equal(name(state(3, -3)), "KAPTENEN");
  assert.equal(name(state(-3, 3)), "DIPLOMATEN");
  // delaktighet does not pick the archetype
  assert.equal(name(state(1, 1, 5)), "MÖTESBOKAREN");
});

test("summary appends the first matching tag line, with '*' as fallback", () => {
  const base = evaluate(state(2, 2)).archetype.summary;
  assert.equal(evaluate(state(2, 2, 0, ["listen"])).summary, `${base} Göran tog av sig hörlurarna.`);
  assert.equal(evaluate(state(2, 2)).summary, `${base} Göran har hörlurarna på, men han tittade upp.`);
});

test("summary is the bare archetype summary when no tag matches and there is no fallback", () => {
  const kapten = evaluate(state(2, 0));
  assert.equal(kapten.summary, kapten.archetype.summary);
  // list order wins over tag order: "push" comes before "soothe" in Kaptenen's list
  assert.equal(evaluate(state(2, 0, 0, ["soothe", "push"])).summary, `${kapten.archetype.summary} Göran har hörlurarna på, och Mira vidarebefordrar inte längre.`);
});

test("axis lines: 2 and up is high, 0 to 1 is mid, below 0 is low, in axis order", () => {
  const lines = (s: StoryState) => evaluate(s).axes;
  const high = lines(state(2, 2, 2));
  const mid = lines(state(1, 0, 1));
  const low = lines(state(-1, -1, -1));
  assert.deepEqual(high.map(([axis]) => axis), ["tydlighet", "trygghet", "delaktighet"]);
  assert.equal(high[0][1], "Du sa vem som bestämmer, och stod för det.");
  assert.equal(mid[0][1], "Du sa vad som gäller när du blev pressad.");
  assert.equal(lines(state(0, 0, 0))[0][1], "Du sa vad som gäller när du blev pressad.");
  assert.equal(low[0][1], "Du lät det vara öppet. Alla tolkade det olika.");
  assert.equal(high[2][1], "Du frågade innan du bestämde.");
  assert.equal(mid[2][1], "Du frågade ibland. Ingen vet riktigt när.");
  assert.equal(low[2][1], "Du bestämde innan du frågade.");
  assert.equal(lines(state(0, 2, -2))[1][1], "Folk sa obekväma saker till dig och fick det inte tillbaka.");
});

test("openerFor uses the first matching tag line, else the plain opener", () => {
  const d: Dilemma = {
    ...dilemmas[0],
    opener: "plain",
    openerIf: [["a", "line a"], ["b", "line b"]],
  };
  assert.equal(openerFor(d, state(0, 0)), "plain");
  assert.equal(openerFor(d, state(0, 0, 0, ["b"])), "line b");
  assert.equal(openerFor(d, state(0, 0, 0, ["b", "a"])), "line a");
  const noVariants: Dilemma = { ...dilemmas[0], opener: "plain", openerIf: undefined };
  assert.equal(openerFor(noVariants, state(0, 0, 0, ["a"])), "plain");
});

test("story data: the first dilemma has no variant opener, the second reacts to 'meeting'", () => {
  assert.equal(openerFor(dilemmas[0], state(0, 0, 0, ["meeting"])), dilemmas[0].opener);
  assert.match(openerFor(dilemmas[1], state(0, 0, 0, ["meeting"])), /bokat ett möte/);
});
