// Run locally after `npm run build:web` and `python -m http.server 8081 --directory dist`.
const { chromium, expect } = require("@playwright/test");
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.CHROMIUM_PATH || undefined });
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.FITNESS67_TEST_URL || "http://127.0.0.1:8081");
  await page
    .getByRole("button", { name: "Начать без расчета", exact: true })
    .click();
  await page.getByText("Твой день", { exact: true }).waitFor();
  await page.getByLabel("Добавить: Завтрак", { exact: true }).click();
  await page.getByLabel("Поиск продуктов", { exact: true }).fill("Банан");
  await page.getByLabel("Выбрать Банан", { exact: true }).click();
  await page.getByLabel("Вес порции, г", { exact: true }).fill("150");
  await page
    .getByRole("button", { name: "Добавить в завтрак", exact: true })
    .click();
  await page.getByLabel("Изменить Банан", { exact: true }).click();
  await page.getByLabel("Вес порции, г", { exact: true }).fill("200");
  await page
    .getByRole("button", { name: "Сохранить изменения", exact: true })
    .click();
  await expect(page.getByText(/200 г · 178 ккал/)).toBeVisible();
  await page.getByLabel("Добавить 250 мл воды", { exact: true }).click();
  await page
    .getByLabel("Заметка дня", { exact: true })
    .fill("Прогулка после обеда");
  await page.reload();
  await page.getByLabel("Изменить Банан", { exact: true }).waitFor();
  await expect(page.getByLabel("Заметка дня", { exact: true })).toHaveValue(
    "Прогулка после обеда",
  );
  await expect(page.getByText("250 / 2000 мл", { exact: true })).toBeVisible();
  await page.getByRole("tab", { name: "Блюда", exact: true }).click();
  await page
    .getByRole("button", { name: "Создать рецепт", exact: true })
    .click();
  await page
    .getByLabel("Название рецепта", { exact: true })
    .fill("Тестовая каша");
  await page
    .getByRole("button", { name: "Добавить ингредиент", exact: true })
    .click();
  await page.getByLabel("Вес готового блюда, г", { exact: true }).fill("400");
  await page
    .getByRole("button", { name: "Сохранить рецепт", exact: true })
    .click();
  await page.getByLabel("Выбрать Тестовая каша", { exact: true }).waitFor();
  await page.getByRole("tab", { name: "Прогресс", exact: true }).click();
  await page.getByRole("button", { name: "Вес", exact: true }).click();
  await page.getByRole("button", { name: "Записать вес", exact: true }).click();
  await page.getByLabel("Вес, кг", { exact: true }).fill("75,5");
  await page
    .getByRole("button", { name: "Сохранить измерение", exact: true })
    .click();
  await page.getByText("75.5 кг", { exact: true }).waitFor();
  await page.getByRole("tab", { name: "Профиль", exact: true }).click();
  await page.getByRole("button", { name: "Светлая", exact: true }).click();
  await page.getByRole("button", { name: "Темная", exact: true }).click();
  await page.getByRole("tab", { name: "Дневник", exact: true }).click();
  await page.screenshot({ path: "preview-fitness67.png", fullPage: true });
  await page.getByLabel("Удалить Банан", { exact: true }).click();
  await page.getByText("Банан", { exact: true }).waitFor({ state: "detached" });
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "PASS: add/edit/delete food; water and notes persist; recipe; weight; theme; no runtime errors",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
