export type Macros = {
  kcal: number;
  protein: number;
  fat: number;
  carbs: number;
};
export type Food = Macros & {
  id: string;
  name: string;
  category: string;
  source?: string;
  ingredients?: Ingredient[];
  yieldGrams?: number;
};
export type Ingredient = { food: Food; grams: number };
export type Entry = Macros & {
  id: string;
  name: string;
  grams: number;
  foodId?: string;
  meal: string;
  date: string;
};
export const foods: Food[] = [
  {
    id: "1",
    name: "Овсяные хлопья",
    category: "Крупы · сухой продукт",
    kcal: 370,
    protein: 13,
    fat: 7,
    carbs: 62,
  },
  {
    id: "2",
    name: "Банан",
    category: "Фрукты · без кожуры",
    kcal: 89,
    protein: 1.1,
    fat: 0.3,
    carbs: 22.8,
  },
  {
    id: "3",
    name: "Куриная грудка",
    category: "Мясо · приготовленная",
    kcal: 165,
    protein: 31,
    fat: 3.6,
    carbs: 0,
  },
  {
    id: "4",
    name: "Гречка отварная",
    category: "Крупы · без масла",
    kcal: 110,
    protein: 4.2,
    fat: 1.1,
    carbs: 21.3,
  },
  {
    id: "5",
    name: "Помидоры",
    category: "Овощи · свежие",
    kcal: 20,
    protein: 1.1,
    fat: 0.2,
    carbs: 3.7,
  },
  {
    id: "6",
    name: "Йогурт натуральный",
    category: "Молочные продукты · 2%",
    kcal: 60,
    protein: 4.3,
    fat: 2,
    carbs: 6.2,
  },
  {
    id: "7",
    name: "Яблоко",
    category: "Фрукты · свежее",
    kcal: 52,
    protein: 0.3,
    fat: 0.2,
    carbs: 13.8,
  },
  {
    id: "8",
    name: "Яйцо вареное",
    category: "Яйца · без скорлупы",
    kcal: 155,
    protein: 12.6,
    fat: 10.6,
    carbs: 1.1,
  },
];
export const zero: Macros = { kcal: 0, protein: 0, fat: 0, carbs: 0 };
export function portion(food: Macros, grams: number): Macros {
  if (!Number.isFinite(grams) || grams <= 0 || grams > 10000)
    throw new Error("Укажите вес от 0 до 10 000 г");
  return Object.fromEntries(
    Object.keys(zero).map((k) => [
      k,
      Math.round(((food[k as keyof Macros] * grams) / 100) * 10) / 10,
    ]),
  ) as Macros;
}
export function total(entries: Macros[]): Macros {
  return entries.reduce(
    (a, e) => ({
      kcal: a.kcal + e.kcal,
      protein: a.protein + e.protein,
      fat: a.fat + e.fat,
      carbs: a.carbs + e.carbs,
    }),
    { ...zero },
  );
}
export function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
