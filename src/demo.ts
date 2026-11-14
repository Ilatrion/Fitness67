import { dateKey, portion, foods } from "./nutrition";
import { dishes } from "./dishes";
import { initial, type Saved } from "./model";
export function demoData(): Saved {
  const today = dateKey(new Date());
  const rows = [
    { food: foods[0], grams: 60, meal: "Завтрак" },
    { food: foods[1], grams: 120, meal: "Завтрак" },
    {
      food: dishes.find((f) => f.name === "Куриный суп с лапшой")!,
      grams: 300,
      meal: "Обед",
    },
    { food: foods[2], grams: 180, meal: "Обед" },
    { food: foods[3], grams: 200, meal: "Обед" },
    { food: foods[5], grams: 200, meal: "Перекус" },
  ];
  const entries = rows.map((r, i) => ({
    ...portion(r.food, r.grams),
    id: "demo-today-" + i,
    name: r.food.name,
    foodId: r.food.id,
    grams: r.grams,
    meal: r.meal,
    date: today,
  }));
  const history = Array.from({ length: 6 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return {
      id: "demo-history-" + i,
      name: "Пример дневного рациона",
      grams: 0,
      meal: "Обед",
      date: dateKey(d),
      kcal: [1920, 2075, 1840, 2190, 2010, 1960][i],
      protein: 112 + i * 3,
      fat: 65 + i,
      carbs: 230 + i * 4,
    };
  });
  return {
    ...initial,
    onboardingDone: true,
    demo: true,
    entries: [...history, ...entries],
    water: { [today]: 1250 },
    notes: {
      [today]: "Пример записи: прогулка после обеда, вечером — легкий ужин.",
    },
    weights: Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - 6 + i);
      return {
        date: dateKey(d),
        value: Math.round((78.8 - i * 0.1) * 10) / 10,
      };
    }),
    favorites: ["2", "3", "dish-0", "dish-9"],
  };
}
