import { validPlan, type WeightPlan } from "./plan.ts";
import {
  dateKey,
  total,
  portion,
  type Food,
  type Entry,
  type Macros,
  type Ingredient,
} from "./nutrition.ts";
export const meals = ["Завтрак", "Обед", "Ужин", "Перекус"];
export const macroKeys = ["kcal", "protein", "fat", "carbs"] as const;
export const macroLabels = [
  "Калории, ккал",
  "Белки, г",
  "Жиры, г",
  "Углеводы, г",
];
export type Reminder = {
  id: string;
  name: string;
  time: string;
  enabled: boolean;
  notificationId?: string;
};
export type Saved = {
  version: 2;
  demo?: boolean;
  onboardingDone: boolean;
  plan?: WeightPlan;
  entries: Entry[];
  water: Record<string, number>;
  notes: Record<string, string>;
  weights: { date: string; value: number }[];
  customFoods: Food[];
  favorites: string[];
  goal: number;
  protein: number;
  fat: number;
  carbs: number;
  waterGoal: number;
  profile: { name: string; height: string };
  theme: "dark" | "light" | "system";
  reminders: Reminder[];
  aiUrl: string;
  aiToken: string;
};
export const initial: Saved = {
  version: 2,
  onboardingDone: false,
  entries: [],
  water: {},
  notes: {},
  weights: [],
  customFoods: [],
  favorites: [],
  goal: 2200,
  protein: 130,
  fat: 75,
  carbs: 250,
  waterGoal: 2000,
  profile: { name: "", height: "" },
  theme: "dark",
  reminders: [],
  aiUrl: "",
  aiToken: "",
};
export const uid = () => `${Date.now()}-${Math.random().toString(36).slice(2)}`;
export const num = (s: string) => Number(s.trim().replace(",", "."));
export function numeric(s: string, min = 0, max = 100000) {
  const n = num(s);
  if (!s.trim() || !Number.isFinite(n) || n < min || n > max)
    throw Error(`Введите число от ${min} до ${max}`);
  return n;
}
export function parseMacros(fields: string[]): Macros {
  if (fields.length !== 4) throw Error("Укажите калории и БЖУ");
  const n = fields.map((s, i) => numeric(s || "0", 0, i ? 10000 : 100000));
  return { kcal: n[0], protein: n[1], fat: n[2], carbs: n[3] };
}
export function validDate(s: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T12:00:00");
  return Number.isFinite(d.getTime()) && dateKey(d) === s;
}
const isMacros = (v: any) =>
  v &&
  macroKeys.every(
    (k) =>
      typeof v[k] === "number" &&
      Number.isFinite(v[k]) &&
      v[k] >= 0 &&
      v[k] <= 1e7,
  );
const isFood = (v: any): boolean =>
  isMacros(v) &&
  typeof v.id === "string" &&
  typeof v.name === "string" &&
  typeof v.category === "string" &&
  (v.ingredients === undefined ||
    (Array.isArray(v.ingredients) &&
      v.ingredients.length > 0 &&
      v.ingredients.every(
        (i: any) =>
          i &&
          isMacros(i.food) &&
          typeof i.food.id === "string" &&
          typeof i.food.name === "string" &&
          typeof i.food.category === "string" &&
          Number.isFinite(i.grams) &&
          i.grams > 0 &&
          i.grams <= 10000,
      ) &&
      Number.isFinite(v.yieldGrams) &&
      v.yieldGrams > 0 &&
      v.yieldGrams <= 10000));
export function restore(raw: unknown): Saved {
  const x = raw as any;
  if (
    !x ||
    typeof x !== "object" ||
    !Array.isArray(x.entries) ||
    !Array.isArray(x.weights)
  )
    throw Error("Некорректный файл Fitness67");
  if (
    !x.entries.every(
      (e: any) =>
        isMacros(e) &&
        typeof e.id === "string" &&
        typeof e.name === "string" &&
        validDate(e.date) &&
        meals.includes(e.meal) &&
        Number.isFinite(e.grams) &&
        e.grams >= 0 &&
        e.grams <= 10000,
    )
  )
    throw Error("Повреждены записи дневника");
  if (
    !x.weights.every(
      (w: any) =>
        validDate(w.date) &&
        Number.isFinite(w.value) &&
        w.value >= 20 &&
        w.value <= 500,
    )
  )
    throw Error("Некорректная история веса");
  for (const k of ["goal", "protein", "fat", "carbs", "waterGoal"])
    if (
      x[k] !== undefined &&
      (!Number.isFinite(x[k]) || x[k] <= 0 || x[k] > 100000)
    )
      throw Error("Некорректные цели");
  for (const k of ["water", "notes"])
    if (x[k] !== undefined) {
      if (
        !x[k] ||
        typeof x[k] !== "object" ||
        Array.isArray(x[k]) ||
        !Object.entries(x[k]).every(
          ([d, v]) =>
            validDate(d) &&
            (k === "water"
              ? typeof v === "number" &&
                Number.isFinite(v) &&
                v >= 0 &&
                v <= 100000
              : typeof v === "string" && v.length <= 5000),
        )
      )
        throw Error("Некорректные данные дня");
    }
  if (
    x.customFoods !== undefined &&
    (!Array.isArray(x.customFoods) || !x.customFoods.every(isFood))
  )
    throw Error("Некорректные продукты");
  if (
    x.favorites !== undefined &&
    (!Array.isArray(x.favorites) ||
      !x.favorites.every((v: any) => typeof v === "string"))
  )
    throw Error("Некорректное избранное");
  if (
    x.profile !== undefined &&
    (!x.profile ||
      typeof x.profile.name !== "string" ||
      typeof x.profile.height !== "string")
  )
    throw Error("Некорректный профиль");
  if (
    x.reminders !== undefined &&
    (!Array.isArray(x.reminders) ||
      !x.reminders.every(
        (r: any) =>
          typeof r.id === "string" &&
          typeof r.name === "string" &&
          /^([01]\d|2[0-3]):[0-5]\d$/.test(r.time) &&
          typeof r.enabled === "boolean",
      ))
  )
    throw Error("Некорректные напоминания");
  if (
    new Set(x.entries.map((e: any) => e.id)).size !== x.entries.length ||
    new Set(x.weights.map((w: any) => w.date)).size !== x.weights.length
  )
    throw Error("В копии повторяются записи");
  if (
    x.plan !== undefined &&
    (!validPlan(x.plan) || !validDate(x.plan.startedAt))
  )
    throw Error("Некорректные параметры плана");
  if (x.onboardingDone !== undefined && typeof x.onboardingDone !== "boolean")
    throw Error("Некорректное состояние анкеты");
  const safe = {
    ...initial,
    ...x,
    version: 2,
    onboardingDone: x.onboardingDone === true,
    theme: ["dark", "light", "system"].includes(x.theme) ? x.theme : "dark",
    aiUrl: typeof x.aiUrl === "string" ? x.aiUrl : "",
    aiToken: typeof x.aiToken === "string" ? x.aiToken : "",
  };
  return safe;
}
export function recipe(
  name: string,
  ingredients: Ingredient[],
  yieldGrams: number,
  id = uid(),
): Food {
  if (!name.trim()) throw Error("Укажите название рецепта");
  if (!ingredients.length) throw Error("Добавьте ингредиенты");
  if (!Number.isFinite(yieldGrams) || yieldGrams <= 0 || yieldGrams > 10000)
    throw Error("Укажите вес готового блюда до 10 000 г");
  const all = total(ingredients.map((i) => portion(i.food, i.grams)));
  const per100 = Object.fromEntries(
    macroKeys.map((k) => [k, Math.round((all[k] / yieldGrams) * 1000) / 10]),
  ) as Macros;
  return {
    ...per100,
    id,
    name: name.trim(),
    category: "Мой рецепт",
    ingredients,
    yieldGrams,
    source: "Собственный рецепт",
  };
}
export function csv(entries: Entry[]) {
  const q = (v: unknown) => `"${String(v).replace(/"/g, '""')}"`;
  return (
    "\uFEFF" +
    [
      [
        "Дата",
        "Прием пищи",
        "Продукт",
        "Граммы",
        "Ккал",
        "Белки",
        "Жиры",
        "Углеводы",
      ],
      ...entries.map((e) => [
        e.date,
        e.meal,
        e.name,
        e.grams,
        e.kcal,
        e.protein,
        e.fat,
        e.carbs,
      ]),
    ]
      .map((row) => row.map(q).join(";"))
      .join("\r\n")
  );
}
