import { test } from "node:test";
import assert from "node:assert/strict";
import {
  energy,
  forecast,
  forecastTitle,
  suggestedIntake,
  latestWeight,
  validPlan,
  type WeightPlan,
} from "../src/plan.ts";
import { restore, initial } from "../src/model.ts";
const p: WeightPlan = {
  age: 30,
  height: 180,
  startWeight: 90,
  targetWeight: 80,
  sex: "male",
  activity: "low",
  startedAt: "2026-11-11",
};
test("Mifflin formula and activity factor", () => {
  assert.deepEqual(energy(p), { bmr: 1880, maintenance: 2256, factor: 1.2 });
  assert.equal(energy({ ...p, sex: "female" }).bmr, 1714);
  assert.equal(energy({ ...p, sex: "unspecified" }).bmr, 1797);
});
test("automatic intake uses moderate deficit and conservative rounding", () => {
  for (const w of [70, 90, 130]) {
    const x = { ...p, startWeight: w, targetWeight: w - 5 };
    const kcal = suggestedIntake(x)!;
    const m = energy(x).maintenance;
    assert.ok(kcal >= 1500);
    assert.ok(m - kcal <= 500);
    assert.ok(m - kcal <= m * 0.15 + 1);
  }
});
test("slower loss at lower body mass, lower calories shorten central scenario", () => {
  const a = forecast(p, 90, 1900),
    b = forecast(p, 90, 1750);
  assert.ok(a.weeksTypical! > b.weeksTypical!);
  assert.ok(a.weeksTypical! > Math.ceil((10 * 7700) / ((2256 - 1900) * 7)));
  assert.equal(a.status, "plateau");
  assert.match(forecastTitle(a), /Базовый сценарий/);
});
test("no fake ETA without deficit or for unsupported cases", () => {
  assert.equal(forecast(p, 90, 2300).status, "no-deficit");
  assert.equal(forecast(p, 90, 2300).weeksTypical, null);
  assert.equal(forecast({ ...p, age: 16 }, 90, 1900).status, "minor");
  assert.equal(suggestedIntake({ ...p, age: 16 }), null);
  assert.equal(
    forecast({ ...p, targetWeight: 45 }, 90, 1900).status,
    "outside-range",
  );
  assert.equal(forecast(p, 90, 1000).status, "outside-range");
  assert.equal(
    forecast({ ...p, activity: "high" }, 90, 1500).status,
    "outside-range",
  );
});
test("achieved target and maintenance do not predict more loss", () => {
  assert.equal(forecast(p, 79, 1900).status, "reached");
  assert.equal(
    forecast({ ...p, targetWeight: 90 }, 90, 2200).status,
    "maintenance",
  );
});
test("last actual weight excludes future measurements and old plan dates", () => {
  assert.equal(
    latestWeight(
      p,
      [
        { date: "2026-11-10", value: 75 },
        { date: "2026-11-11", value: 89 },
        { date: "2026-11-12", value: 50 },
      ],
      "2026-11-11",
    ),
    89,
  );
  assert.equal(latestWeight(p, [], "2026-11-11"), 90);
});
test("old backups prompt questionnaire, new plans persist, malformed plans rejected", () => {
  const old = { ...initial };
  delete (old as Partial<typeof initial>).onboardingDone;
  assert.equal(restore(old).onboardingDone, false);
  const restored = restore({ ...initial, onboardingDone: true, plan: p });
  assert.deepEqual(restored.plan, p);
  assert.throws(() => restore({ ...initial, plan: { ...p, height: 0 } }));
  assert.equal(validPlan({ ...p, age: NaN }), false);
});
