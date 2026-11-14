export type Sex = "male" | "female" | "unspecified";
export type Activity = "low" | "light" | "moderate" | "high";
export type WeightPlan = {
  age: number;
  height: number;
  startWeight: number;
  targetWeight: number;
  sex: Sex;
  activity: Activity;
  startedAt: string;
};
export const activities: {
  value: Activity;
  label: string;
  factor: number;
  description: string;
}[] = [
  {
    value: "low",
    label: "Мало движения",
    factor: 1.2,
    description: "Сидячий день, без регулярных тренировок",
  },
  {
    value: "light",
    label: "Легкая активность",
    factor: 1.375,
    description: "Прогулки и 1–3 тренировки в неделю",
  },
  {
    value: "moderate",
    label: "Средняя активность",
    factor: 1.55,
    description: "Регулярное движение и 3–5 тренировок",
  },
  {
    value: "high",
    label: "Высокая активность",
    factor: 1.725,
    description: "Подвижная работа или интенсивные тренировки",
  },
];
export function validPlan(p: unknown): p is WeightPlan {
  const x = p as WeightPlan;
  return (
    !!x &&
    Number.isInteger(x.age) &&
    x.age >= 10 &&
    x.age <= 100 &&
    Number.isFinite(x.height) &&
    x.height >= 100 &&
    x.height <= 230 &&
    Number.isFinite(x.startWeight) &&
    x.startWeight >= 20 &&
    x.startWeight <= 300 &&
    Number.isFinite(x.targetWeight) &&
    x.targetWeight >= 20 &&
    x.targetWeight <= 300 &&
    ["male", "female", "unspecified"].includes(x.sex) &&
    activities.some((a) => a.value === x.activity) &&
    /^\d{4}-\d{2}-\d{2}$/.test(x.startedAt) &&
    !Number.isNaN(new Date(x.startedAt + "T12:00:00").getTime())
  );
}
export function energy(p: WeightPlan, weight = p.startWeight) {
  if (!validPlan(p) || !Number.isFinite(weight) || weight < 20 || weight > 500)
    throw Error("Проверьте параметры анкеты");
  const factor = activities.find((a) => a.value === p.activity)!.factor;
  const base = 10 * weight + 6.25 * p.height - 5 * p.age;
  const bmr = base + (p.sex === "male" ? 5 : p.sex === "female" ? -161 : -78);
  const maintenance = bmr * factor;
  return { bmr: Math.round(bmr), maintenance: Math.round(maintenance), factor };
}
export function suggestedIntake(p: WeightPlan): number | null {
  if (
    p.age < 18 ||
    p.startWeight / (p.height / 100) ** 2 < 18.5 ||
    p.targetWeight / (p.height / 100) ** 2 < 18.5
  )
    return null;
  const m = energy(p).maintenance;
  return (
    Math.ceil(
      Math.max(
        1500,
        p.targetWeight < p.startWeight ? m - Math.min(500, m * 0.15) : m,
      ) / 50,
    ) * 50
  );
}
function weeksAt(
  p: WeightPlan,
  current: number,
  intake: number,
  multiplier: number,
): number | null {
  let weight = current;
  for (let week = 1; week <= 260; week++) {
    const deficit = energy(p, weight).maintenance * multiplier - intake;
    if (deficit <= 0) return null;
    weight -= (deficit * 7) / 7700;
    if (weight <= p.targetWeight) return week;
  }
  return null;
}
export type Forecast = {
  status:
    | "estimate"
    | "plateau"
    | "no-deficit"
    | "minor"
    | "outside-range"
    | "reached"
    | "maintenance";
  maintenance: number;
  weeklyLow: number;
  weeklyHigh: number;
  weeksLow: number | null;
  weeksHigh: number | null;
  weeksTypical: number | null;
  message: string;
};
export function forecast(
  p: WeightPlan,
  current: number,
  intake: number,
): Forecast {
  const maintenance = energy(p, current).maintenance;
  const result: Forecast = {
    status: "estimate",
    maintenance,
    weeklyLow: 0,
    weeklyHigh: 0,
    weeksLow: null,
    weeksHigh: null,
    weeksTypical: null,
    message: "",
  };
  if (p.age < 18)
    return {
      ...result,
      status: "minor",
      message:
        "Для пользователей младше 18 лет приложение не назначает дефицит и не прогнозирует снижение веса. Дневник доступен без расчета.",
    };
  if (
    p.startWeight / (p.height / 100) ** 2 < 18.5 ||
    p.targetWeight / (p.height / 100) ** 2 < 18.5 ||
    current / (p.height / 100) ** 2 < 18.5 ||
    !Number.isFinite(intake) ||
    intake < 1500
  )
    return {
      ...result,
      status: "outside-range",
      message:
        "Для этих параметров автоматический прогноз не строится. Подходящий рацион лучше подобрать индивидуально со специалистом; дневник остается доступен.",
    };
  if (p.targetWeight >= p.startWeight)
    return {
      ...result,
      status: "maintenance",
      message:
        "Выбран ориентир на поддержание веса. Отслеживайте средний вес за несколько недель.",
    };
  if (current <= p.targetWeight)
    return {
      ...result,
      status: "reached",
      message:
        "Текущий записанный вес достиг выбранного ориентира. Можно пересмотреть цель и калораж.",
    };
  if (maintenance - intake > Math.min(750, maintenance * 0.25))
    return {
      ...result,
      status: "outside-range",
      message:
        "При таком большом расчетном дефиците приложение не прогнозирует срок. Выберите умеренный ориентир или обсудите рацион со специалистом.",
    };
  if (intake >= maintenance)
    return {
      ...result,
      status: "no-deficit",
      message:
        "По расчету этот калораж не создает дефицита. Срок снижения веса при нем не прогнозируется.",
    };
  result.weeklyLow = Math.max(0, ((maintenance * 0.85 - intake) * 7) / 7700);
  result.weeklyHigh = Math.max(0, ((maintenance * 1.15 - intake) * 7) / 7700);
  result.weeksTypical = weeksAt(p, current, intake, 1);
  result.weeksLow = weeksAt(p, current, intake, 1.15);
  result.weeksHigh = weeksAt(p, current, intake, 0.85);
  if (result.weeksHigh === null) {
    result.status = "plateau";
    result.message =
      "Срок — ориентир. Если фактический расход ниже оценки, снижение веса может идти медленнее или остановиться раньше цели.";
  } else
    result.message =
      "Диапазон рассчитан при постоянном калораже и уровне активности. По мере снижения веса расчетный расход энергии уменьшается.";
  return result;
}
export function forecastTitle(f: Forecast) {
  if (f.status === "reached") return "Ориентир достигнут";
  if (f.status === "estimate" && f.weeksLow && f.weeksHigh)
    return f.weeksHigh > 104
      ? "Долгосрочный ориентир: больше 2 лет"
      : `Ориентировочно ${f.weeksLow}–${f.weeksHigh} нед.`;
  if (f.status === "plateau")
    return f.weeksTypical && f.weeksTypical <= 104
      ? `Базовый сценарий: ≈ ${f.weeksTypical} нед.`
      : "Срок пока неопределенный";
  if (f.status === "no-deficit") return "Дефицит не ожидается";
  if (f.status === "maintenance") return "Поддержание веса";
  return "Без автоматического прогноза";
}
export function latestWeight(
  plan: WeightPlan,
  weights: { date: string; value: number }[],
  today: string,
) {
  return (
    weights
      .filter((w) => w.date <= today && w.date >= plan.startedAt)
      .sort((a, b) => b.date.localeCompare(a.date))[0]?.value ??
    plan.startWeight
  );
}
