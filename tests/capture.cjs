const path = require("node:path");
const fs = require("node:fs");
const out =
  process.env.FITNESS67_SCREENSHOTS_DIR ||
  path.resolve(__dirname, "../screenshots");
fs.mkdirSync(out, { recursive: true });
const { chromium, expect } = require("@playwright/test");
(async () => {
  const browser = await chromium.launch({
    headless: true,
    args: ["--no-sandbox"],
  });
  const page = await browser.newPage({
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2,
  });
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  await page.goto(process.env.FITNESS67_TEST_URL || "http://127.0.0.1:8090");
  await page
    .getByRole("button", { name: "Начать без расчета", exact: true })
    .click();
  await page.getByText("Твой день", { exact: true }).waitFor();
  await page.getByRole("tab", { name: "Профиль", exact: true }).click();
  await page.getByText("Пример заполненного дневника", { exact: true }).click();
  await page.getByRole("button", { name: "Подтвердить", exact: true }).click();
  await page.getByText("ДЕМОНСТРАЦИОННЫЙ ДНЕВНИК", { exact: true }).waitFor();
  await page.waitForTimeout(450);
  await page.evaluate(() => {
    for (const e of document.querySelectorAll("div"))
      if (e.scrollHeight > e.clientHeight + 100) e.scrollTop = 0;
    window.scrollTo(0, 0);
    return document.fonts.ready;
  });
  await page.screenshot({ path: out + "/01-diary.png" });
  await page.getByRole("tab", { name: "Прогресс", exact: true }).click();
  await page.waitForTimeout(450);
  await page.evaluate(() => {
    for (const e of document.querySelectorAll("div"))
      if (e.scrollHeight > e.clientHeight + 100) e.scrollTop = 0;
    window.scrollTo(0, 0);
    return document.fonts.ready;
  });
  await page.screenshot({ path: out + "/02-progress.png" });
  await page.getByRole("button", { name: "Вес", exact: true }).click();
  await page.waitForTimeout(450);
  await page.evaluate(() => {
    for (const e of document.querySelectorAll("div"))
      if (e.scrollHeight > e.clientHeight + 100) e.scrollTop = 0;
    window.scrollTo(0, 0);
    return document.fonts.ready;
  });
  await page.screenshot({ path: out + "/03-weight.png" });
  await page.getByRole("tab", { name: "Блюда", exact: true }).click();
  await page.getByRole("button", { name: "Блюда", exact: true }).click();
  await page.waitForTimeout(450);
  await page.evaluate(() => {
    for (const e of document.querySelectorAll("div"))
      if (e.scrollHeight > e.clientHeight + 100) e.scrollTop = 0;
    window.scrollTo(0, 0);
    return document.fonts.ready;
  });
  await page.screenshot({ path: out + "/04-foods.png" });
  await page
    .getByRole("button", { name: "Создать рецепт", exact: true })
    .click();
  await page
    .getByLabel("Название рецепта", { exact: true })
    .fill("Овсянка с бананом");
  await page
    .getByRole("button", { name: "Добавить ингредиент", exact: true })
    .click();
  await page.getByRole("button", { name: "Банан", exact: true }).click();
  await page.getByLabel("Вес ингредиента, г", { exact: true }).fill("120");
  await page
    .getByRole("button", { name: "Добавить ингредиент", exact: true })
    .click();
  await page.getByLabel("Вес готового блюда, г", { exact: true }).fill("350");
  await page.waitForTimeout(450);
  await page.evaluate(() => {
    for (const e of document.querySelectorAll("div"))
      if (e.scrollHeight > e.clientHeight + 100) e.scrollTop = 0;
    window.scrollTo(0, 0);
    return document.fonts.ready;
  });
  await page.screenshot({ path: out + "/05-recipe.png" });
  await page
    .getByRole("button", { name: "Сохранить рецепт", exact: true })
    .click();
  await page.getByLabel("Выбрать Овсянка с бананом", { exact: true }).click();
  await page.getByLabel("Вес порции, г", { exact: true }).fill("250");
  await page.waitForTimeout(450);
  await page.evaluate(() => {
    for (const e of document.querySelectorAll("div"))
      if (e.scrollHeight > e.clientHeight + 100) e.scrollTop = 0;
    window.scrollTo(0, 0);
    return document.fonts.ready;
  });
  await page.screenshot({ path: out + "/06-portion.png" });
  await page
    .getByRole("button", { name: "Добавить в завтрак", exact: true })
    .click();
  await page.getByRole("tab", { name: "Профиль", exact: true }).click();
  await page.waitForTimeout(450);
  await page.evaluate(() => {
    for (const e of document.querySelectorAll("div"))
      if (e.scrollHeight > e.clientHeight + 100) e.scrollTop = 0;
    window.scrollTo(0, 0);
    return document.fonts.ready;
  });
  await page.screenshot({ path: out + "/07-profile.png" });
  await page.getByRole("button", { name: "Светлая", exact: true }).click();
  await page.getByRole("tab", { name: "Дневник", exact: true }).click();
  await page.waitForTimeout(450);
  await page.evaluate(() => {
    for (const e of document.querySelectorAll("div"))
      if (e.scrollHeight > e.clientHeight + 100) e.scrollTop = 0;
    window.scrollTo(0, 0);
    return document.fonts.ready;
  });
  await page.screenshot({ path: out + "/08-light.png" });
  await page.getByRole("button", { name: "Фото еды", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Оценить калории по фото", exact: true }),
  ).toBeDisabled();
  await page.waitForTimeout(450);
  await page.evaluate(() => {
    for (const e of document.querySelectorAll("div"))
      if (e.scrollHeight > e.clientHeight + 100) e.scrollTop = 0;
    window.scrollTo(0, 0);
    return document.fonts.ready;
  });
  await page.screenshot({ path: out + "/09-photo.png" });
  await page.getByRole("button", { name: "Закрыть", exact: true }).click();
  await page.reload();
  await page.getByText("Овсянка с бананом", { exact: true }).waitFor();
  if (errors.length) throw Error(errors.join("\n"));
  console.log(
    "PASS: all four navigation tabs, demo diary, recipe creation and portion, persistence, light theme, AI unavailable state. Screenshots are React Native Web render, not native emulator captures.",
  );
  await browser.close();
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
