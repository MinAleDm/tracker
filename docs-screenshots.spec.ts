import { expect, test, type Browser, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

const origin = "http://127.0.0.1:8080";
const demoEmail = process.env.DOCS_DEMO_EMAIL;
const demoPassword = process.env.DOCS_DEMO_PASSWORD;

async function signIn(page: Page) {
  if (!demoEmail || !demoPassword) {
    throw new Error("Set DOCS_DEMO_EMAIL and DOCS_DEMO_PASSWORD before capturing authenticated screens");
  }

  await page.goto(origin);
  await page.getByLabel("Email").fill(demoEmail);
  await page.getByLabel("Пароль").fill(demoPassword);
  await page.getByRole("button", { name: "Войти" }).click();
  await expect(page.getByRole("heading", { name: "Главная" })).toBeVisible({ timeout: 15_000 });

  const projectSelect = page.locator("select").first();
  await projectSelect.selectOption({ label: "CORE · Core Platform" });
  await page.waitForLoadState("networkidle");
}

async function authenticatedPage(browser: Browser, viewport: { width: number; height: number }) {
  const context = await browser.newContext({ viewport, colorScheme: "light" });
  const page = await context.newPage();
  await signIn(page);
  return { context, page };
}

test("capture current documentation gallery", async ({ browser }) => {
  const anonymous = await browser.newContext({ viewport: { width: 1440, height: 1000 }, colorScheme: "light" });
  const signInPage = await anonymous.newPage();
  await signInPage.goto(origin);
  await expect(signInPage.getByRole("heading", { name: "Вход" })).toBeVisible();
  await signInPage.waitForTimeout(400);
  await signInPage.screenshot({ path: "docs/screenshots/01-sign-in.png" });
  await anonymous.close();

  const desktop = await authenticatedPage(browser, { width: 1440, height: 1000 });
  for (const [path, output, heading] of [
    ["/", "docs/screenshots/02-overview.png", "Главная"],
    ["/tasks", "docs/screenshots/03-tasks.png", "Задачи"],
    ["/boards", "docs/screenshots/04-boards.png", "Доска"],
    ["/analytics", "docs/screenshots/05-analytics.png", "Аналитика"],
  ] as const) {
    await desktop.page.goto(`${origin}${path}`);
    await expect(desktop.page.getByRole("heading", { name: heading })).toBeVisible();
    await desktop.page.waitForLoadState("networkidle");
    await desktop.page.waitForTimeout(400);
    await desktop.page.screenshot({ path: output });
  }

  await desktop.page.goto(`${origin}/tasks`);
  const firstTask = desktop.page.locator('a[href^="/tasks/"]').first();
  await expect(firstTask).toBeVisible();
  await firstTask.click();
  await expect(desktop.page.getByText("Комментарии", { exact: true })).toBeVisible();
  await desktop.page.waitForTimeout(400);
  await desktop.page.screenshot({ path: "docs/screenshots/06-task-detail.png" });
  await desktop.context.close();

  const mobile = await authenticatedPage(browser, { width: 390, height: 1100 });
  await mobile.page.goto(origin);
  await expect(mobile.page.getByRole("heading", { name: "Главная" })).toBeVisible();
  await mobile.page.waitForTimeout(400);
  await mobile.page.screenshot({ path: "docs/screenshots/07-mobile-overview.png" });
  await mobile.page.goto(`${origin}/tasks`);
  await expect(mobile.page.getByRole("heading", { name: "Задачи" })).toBeVisible();
  await mobile.page.waitForTimeout(400);
  await mobile.page.screenshot({ path: "docs/screenshots/08-mobile-tasks.png" });
  await mobile.context.close();

  const logo = await browser.newContext({ viewport: { width: 512, height: 512 }, colorScheme: "light" });
  const logoPage = await logo.newPage();
  const logoSvg = readFileSync("apps/web/public/logo.svg", "utf8");
  await logoPage.setContent(`<style>html,body{margin:0;background:transparent}img{display:block;width:512px;height:512px}</style><img alt="Tracker" src="data:image/svg+xml,${encodeURIComponent(logoSvg)}">`);
  await logoPage.locator("img").screenshot({ path: "apps/web/public/logo.png", omitBackground: true });
  await logo.close();

  const preview = await authenticatedPage(browser, { width: 1536, height: 1024 });
  await preview.page.goto(origin);
  await expect(preview.page.getByRole("heading", { name: "Главная" })).toBeVisible();
  await preview.page.waitForTimeout(400);
  await preview.page.screenshot({ path: "apps/web/public/preview.png" });
  await preview.context.close();
});
