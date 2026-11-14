import { test } from "node:test";
import assert from "node:assert/strict";
import {
  recipe,
  restore,
  initial,
  csv,
  validDate,
  parseMacros,
} from "../src/model.ts";
import { portion, foods } from "../src/nutrition.ts";
test("cooked recipe uses final weight, not raw ingredient weight", () => {
  const r = recipe(
    "Каша",
    [
      { food: foods[0], grams: 100 },
      { food: foods[1], grams: 100 },
    ],
    500,
  );
  assert.equal(r.kcal, 91.8);
  assert.equal(portion(r, 250).kcal, 229.5);
  assert.throws(() => recipe("x", [], 100));
  assert.throws(() => recipe("x", [{ food: foods[0], grams: 100 }], 0));
});
test("backup migrates old diary and rejects corrupt records", () => {
  const old = {
    entries: [],
    water: {},
    weights: [],
    goal: 2200,
    protein: 130,
    fat: 75,
    carbs: 250,
  };
  assert.equal(restore(old).version, 2);
  assert.deepEqual(restore(old).customFoods, []);
  for (const x of [
    { ...initial, goal: 0 },
    { ...initial, entries: [{ kcal: -1 }] },
    { ...initial, water: { bad: 0 } },
    { ...initial, water: { "2026-01-01": NaN } },
    { ...initial, customFoods: [{}] },
    { ...initial, reminders: [{}] },
  ])
    assert.throws(() => restore(x));
});
test("dates reject impossible calendar days", () => {
  assert.equal(validDate("2026-02-30"), false);
  assert.equal(validDate("2028-02-29"), true);
  assert.equal(validDate("2026-11-10"), true);
});
test("manual macros accept decimal commas and reject negatives", () => {
  assert.equal(parseMacros(["120,5", "3", "2", "4"]).kcal, 120.5);
  assert.throws(() => parseMacros(["100", "-1", "0", "0"]));
  assert.throws(() => parseMacros(["Infinity", "1", "0", "0"]));
});
test("CSV escapes user text, including quotes and newlines", () => {
  const text = csv([
    {
      id: "1",
      name: 'Блюдо "Тест";\nСтрока',
      grams: 100,
      meal: "Обед",
      date: "2026-11-10",
      kcal: 100,
      protein: 1,
      fat: 2,
      carbs: 3,
    },
  ]);
  assert.ok(text.includes('"Блюдо ""Тест"";\nСтрока"'));
});
