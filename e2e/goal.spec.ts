import { expect, test } from "@playwright/test";
import { GOAL_CLICKS } from "../src/game/config";
import { createNearGoalSave } from "../src/testing/e2eApi";

test.describe("1億クリック到達（E2E）", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => window.__CLICK_QUEST__ !== undefined);
  });

  test("1億クリックでクリア画面が表示される", async ({ page }) => {
    await page.evaluate((goal) => {
      window.__CLICK_QUEST__!.setTotalClicks(goal);
    }, GOAL_CLICKS);

    await expect(page.getByRole("heading", { name: "クリア！" })).toBeVisible();
    await expect(page.getByText(/100,000,000\s*クリック達成/)).toBeVisible();
    await expect(page.getByRole("button", { name: "もう一度プレイ" })).toBeVisible();
  });

  test("エンジンシミュレーションで 0 から 1億到達できる", async ({ page }) => {
    const result = await page.evaluate(() => {
      const api = window.__CLICK_QUEST__!;
      api.setState({
        ...api.getState(),
        totalClicks: 0,
        cleared: false,
        equippedItemIds: ["factory", "conveyor", "crown"],
        power: 200,
        stageIndex: 15,
      });
      return api.simulateToGoal(400_000);
    });

    expect(result.state.totalClicks).toBe(GOAL_CLICKS);
    expect(result.state.cleared).toBe(true);
    expect(result.iterations).toBeGreaterThan(0);

    await expect(page.getByRole("heading", { name: "クリア！" })).toBeVisible({
      timeout: 5000,
    });
  });

  test("ゴール直前のバーストでクリアに遷移する", async ({ page }) => {
    const save = createNearGoalSave(2);

    await page.evaluate((json) => {
      window.__CLICK_QUEST__!.loadSaveJson(json);
    }, save);

    await page.evaluate(() => {
      window.__CLICK_QUEST__!.burstClick(5);
    });

    await expect(page.getByRole("heading", { name: "クリア！" })).toBeVisible();
  });

  test("クリア後に再開するとゲーム画面に戻る", async ({ page }) => {
    await page.evaluate((goal) => {
      window.__CLICK_QUEST__!.setTotalClicks(goal);
    }, GOAL_CLICKS);

    await page.getByRole("button", { name: "もう一度プレイ" }).click();
    await expect(page.getByRole("button", { name: "クリック" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "クリア！" })).toBeHidden();
  });
});

test.describe("基本操作", () => {
  test("クリックで累計が増える", async ({ page }) => {
    await page.goto("/");
    await page.waitForFunction(() => window.__CLICK_QUEST__ !== undefined);

    const before = await page.evaluate(() => window.__CLICK_QUEST__!.getState().totalClicks);

    await page.getByRole("button", { name: /クリック/ }).click();
    await page.waitForFunction(
      (prev) => window.__CLICK_QUEST__!.getState().totalClicks > prev,
      before,
    );

    const after = await page.evaluate(() => window.__CLICK_QUEST__!.getState().totalClicks);
    expect(after).toBeGreaterThan(before);
  });

  test("モバイル幅でクリックボタンが表示される", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto("/");
    await expect(page.getByRole("button", { name: /クリック/ })).toBeVisible();
    await expect(page.locator(".hint-mobile")).toBeVisible();
  });
});
