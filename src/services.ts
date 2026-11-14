import { Platform } from "react-native";
import { File, Paths } from "expo-file-system";
import * as Sharing from "expo-sharing";
import * as DocumentPicker from "expo-document-picker";
import type { Food } from "./nutrition";
import type { Reminder } from "./model";
export async function exportFile(name: string, text: string, mime: string) {
  if (Platform.OS === "web") {
    const blob = new Blob([text], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = name;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    return;
  }
  const file = new File(Paths.cache, name);
  file.write(text);
  if (!(await Sharing.isAvailableAsync()))
    throw Error("Экспорт файлов недоступен на этом устройстве");
  await Sharing.shareAsync(file.uri, {
    mimeType: mime,
    dialogTitle: "Экспорт Fitness67",
  });
}
export async function importFile() {
  const r = await DocumentPicker.getDocumentAsync({
    type: ["application/json", "text/plain"],
    copyToCacheDirectory: true,
  });
  if (r.canceled) return null;
  const asset = r.assets[0];
  if (asset.size && asset.size > 5 * 1024 * 1024)
    throw Error("Резервная копия должна быть до 5 МБ");
  return Platform.OS === "web"
    ? await (await fetch(asset.uri)).text()
    : await new File(asset.uri).text();
}
export async function findBarcode(code: string): Promise<Food> {
  if (!/^\d{8,14}$/.test(code))
    throw Error("Штрихкод должен содержать от 8 до 14 цифр");
  const response = await fetch(
    `https://world.openfoodfacts.org/api/v2/product/${code}.json?fields=product_name,product_name_ru,nutriments,brands`,
    { signal: AbortSignal.timeout(15000) },
  );
  if (!response.ok) throw Error("База продуктов временно недоступна");
  const data = await response.json();
  if (data.status !== 1)
    throw Error("Продукт не найден. Добавьте его по данным с упаковки.");
  const p = data.product,
    n = p.nutriments || {};
  const kcal = Number(
    n["energy-kcal_100g"] ??
      (n.energy_100g !== undefined ? Number(n.energy_100g) / 4.184 : NaN),
  );
  const protein = Number(n.proteins_100g),
    fat = Number(n.fat_100g),
    carbs = Number(n.carbohydrates_100g);
  if ([kcal, protein, fat, carbs].some((v) => !Number.isFinite(v) || v < 0))
    throw Error(
      "В базе не хватает данных о калориях или БЖУ. Введите их с упаковки.",
    );
  return {
    id: `barcode-${code}`,
    name: p.product_name_ru || p.product_name || code,
    category: p.brands || "Продукт по штрихкоду",
    kcal,
    protein,
    fat,
    carbs,
    source: "Open Food Facts · ODbL / DbCL · данные пользователей",
  };
}
export async function enableReminder(r: Reminder): Promise<string> {
  if (Platform.OS === "web")
    throw Error(
      "Напоминания доступны в установленной iOS/Android-сборке или совместимом Expo Go. Веб-версия их не отправляет.",
    );
  const N = await import("expo-notifications");
  if (Platform.OS === "android") await N.setNotificationChannelAsync("daily", {name:"Напоминания Fitness67",importance:N.AndroidImportance.DEFAULT});
  const permission = await N.requestPermissionsAsync();
  if (!permission.granted)
    throw Error("Разрешите уведомления Fitness67 в настройках приложения");
  const [hour, minute] = r.time.split(":").map(Number);
  return N.scheduleNotificationAsync({
    content: { title: "Fitness67", body: r.name, sound: "default" },
    trigger: { type: N.SchedulableTriggerInputTypes.DAILY, hour, minute, ...(Platform.OS === "android" ? {channelId:"daily"} : {}) },
  });
}
export async function cancelReminder(id?: string) {
  if (id && Platform.OS !== "web") {
    const N = await import("expo-notifications");
    await N.cancelScheduledNotificationAsync(id);
  }
}
export type AIResult = {
  name: string;
  estimatedGrams: number;
  per100: { kcal: number; protein: number; fat: number; carbs: number };
  uncertainty: string;
};
export async function analyzePhoto(
  url: string,
  token: string,
  base64: string,
  mime: string,
): Promise<AIResult> {
  if (!url)
    throw Error(
      "Сначала подключите сервер распознавания в разделе «Профиль → Нейросеть». Ключ API хранится только на сервере.",
    );
  if (
    !/^https:\/\//.test(url) &&
    !/^http:\/\/(localhost|127\.0\.0\.1|192\.168\.|10\.)/.test(url)
  )
    throw Error("Для сервера нужен адрес HTTPS");
  const response = await fetch(url.replace(/\/$/, "") + "/api/analyze", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ image: base64, mime }),
    signal: AbortSignal.timeout(60000),
  });
  let body: any;
  try {
    body = await response.json();
  } catch {
    throw Error("Сервер вернул некорректный ответ");
  }
  if (!response.ok) throw Error(body.error || "Не удалось распознать фото");
  const r = body.result;
  if (
    !r ||
    typeof r.name !== "string" ||
    !Number.isFinite(r.estimatedGrams) ||
    r.estimatedGrams <= 0 ||
    r.estimatedGrams > 10000 ||
    !r.per100 ||
    !["kcal", "protein", "fat", "carbs"].every(
      (k) =>
        Number.isFinite(r.per100[k]) &&
        r.per100[k] >= 0 &&
        r.per100[k] <= 10000,
    )
  )
    throw Error("Ответ нейросети не содержит корректной пищевой ценности");
  return r;
}
