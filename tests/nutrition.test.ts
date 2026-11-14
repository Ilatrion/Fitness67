import { test } from "node:test";
import assert from "node:assert/strict";
import { portion, total, dateKey } from "../src/nutrition.ts";
test("portion scales all nutrients and rejects invalid weight", () => {
  assert.deepEqual(
    portion({ kcal: 200, protein: 10, fat: 4, carbs: 30 }, 150),
    { kcal: 300, protein: 15, fat: 6, carbs: 45 },
  );
  for (const x of [0, -1, NaN, Infinity, 10001])
    assert.throws(() => portion({ kcal: 0, protein: 0, fat: 0, carbs: 0 }, x));
});
test("totals are additive, empty diary is zero", () => {
  assert.equal(total([]).kcal, 0);
  assert.equal(
    total([
      portion({ kcal: 200, protein: 10, fat: 4, carbs: 30 }, 50),
      portion({ kcal: 200, protein: 10, fat: 4, carbs: 30 }, 150),
    ]).kcal,
    400,
  );
});
test("diary uses local calendar date", () =>
  assert.equal(dateKey(new Date(2026, 0, 2, 23)), "2026-01-02"));
