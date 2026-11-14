import { NativeModules, Platform } from "react-native";
function vault() {
  if (Platform.OS !== "android" || !NativeModules.FitnessKey)
    throw Error("Сохранение личного ключа доступно в обновленном Android APK. В веб-версии используйте сервер.");
  return NativeModules.FitnessKey as { read(): Promise<string | null>; save(key: string): Promise<void>; remove(): Promise<void> };
}
export async function readKey() {
  if (Platform.OS !== "android" || !NativeModules.FitnessKey) return null;
  return vault().read();
}
export async function saveKey(value: string) {
  const key = value.trim();
  if (!/^sk-[A-Za-z0-9_-]{16,}$/.test(key)) throw Error("Вставьте полный секретный API-ключ OpenAI, начинающийся с sk-");
  await vault().save(key);
}
export async function removeKey() { await vault().remove(); }
