import { test, expect, type Page } from "@playwright/test";
import { fileURLToPath } from "url";
import path from "path";

const FIXTURE = path.resolve(
  fileURLToPath(import.meta.url),
  "../../fixtures/weather.parquet"
);

// Helper: wait for DuckDB to be ready, then upload the fixture file.
// DuckDB init is complete when the file input is no longer disabled.
async function loadFile(page: Page) {
  const input = page.locator('input[type="file"][accept=".parquet"]');
  // Wait for the input to become enabled (DuckDB initialized)
  await expect(input).toBeEnabled({ timeout: 30_000 });
  await input.setInputFiles(FIXTURE);
  // Wait for the tab bar to appear (file loaded successfully)
  await expect(page.getByRole("tab", { name: "Preview" })).toBeVisible({
    timeout: 30_000,
  });
  // Wait for at least one data row to render in the grid
  await expect(page.locator(".MuiDataGrid-row").first()).toBeVisible({
    timeout: 20_000,
  });
}

// ─────────────────────────────────────────────
// 1. Landing page
// ─────────────────────────────────────────────
test.describe("landing page", () => {
  test("shows app name and dropzone", async ({ page }) => {
    await page.goto("/");
    await expect(
      page.getByRole("heading", { name: /parquet visualizer/i }).first()
    ).toBeVisible();
    await expect(
      page.getByText(/drop your .parquet file here/i)
    ).toBeVisible();
  });

  test("shows privacy badges", async ({ page }) => {
    await page.goto("/");
    // Use exact: true to avoid matching partial text in other elements
    await expect(page.getByText("Never uploaded", { exact: true })).toBeVisible();
    await expect(page.getByText("No server", { exact: true })).toBeVisible();
    await expect(page.getByText("No tracking", { exact: true })).toBeVisible();
    await expect(page.getByText("Runs in-browser", { exact: true })).toBeVisible();
  });

  test("has no console errors on load", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.goto("/");
    // Wait for DuckDB to fully initialize
    const input = page.locator('input[type="file"][accept=".parquet"]');
    await expect(input).toBeEnabled({ timeout: 30_000 });
    expect(errors).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────
// 2. File loading
// ─────────────────────────────────────────────
test.describe("file loading", () => {
  test("loads weather.parquet and shows all tabs", async ({ page }) => {
    await page.goto("/");
    await loadFile(page);
    await expect(page.getByRole("tab", { name: "Schema" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Profile" })).toBeVisible();
    await expect(page.getByRole("tab", { name: "Query" })).toBeVisible();
  });

  test("shows file name chip in app bar", async ({ page }) => {
    await page.goto("/");
    await loadFile(page);
    await expect(page.getByText(/weather\.parquet/)).toBeVisible();
  });

  test("reset button returns to landing page", async ({ page }) => {
    await page.goto("/");
    await loadFile(page);
    // MUI chip delete button has the MuiChip-deleteIcon class
    await page.locator(".MuiChip-deleteIcon").click();
    await expect(
      page.getByText(/drop your .parquet file here/i)
    ).toBeVisible();
  });
});

// ─────────────────────────────────────────────
// 3. Preview tab
// ─────────────────────────────────────────────
test.describe("preview tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await loadFile(page);
  });

  test("shows weather column headers", async ({ page }) => {
    await expect(
      page.getByRole("columnheader", { name: "MinTemp" })
    ).toBeVisible();
    await expect(
      page.getByRole("columnheader", { name: "MaxTemp" })
    ).toBeVisible();
  });

  test("shows multiple rows of data", async ({ page }) => {
    const rows = page.locator(".MuiDataGrid-row");
    expect(await rows.count()).toBeGreaterThan(5);
  });

  test("shows row and column count summary", async ({ page }) => {
    // PreviewTab renders "{N} of {total} rows · {cols} of {total} cols"
    await expect(page.getByText(/\d+ of \d+ rows/i)).toBeVisible();
  });
});

// ─────────────────────────────────────────────
// 4. Schema tab
// ─────────────────────────────────────────────
test.describe("schema tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await loadFile(page);
    await page.getByRole("tab", { name: "Schema" }).click();
  });

  test("lists weather columns", async ({ page }) => {
    await expect(page.getByText("MinTemp")).toBeVisible();
    await expect(page.getByText("MaxTemp")).toBeVisible();
    await expect(page.getByText("Rainfall")).toBeVisible();
  });

  test("shows data types", async ({ page }) => {
    // DuckDB maps float columns to DOUBLE
    await expect(page.getByText(/double|float|decimal/i).first()).toBeVisible();
  });
});

// ─────────────────────────────────────────────
// 5. Query tab
// ─────────────────────────────────────────────
test.describe("query tab", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await loadFile(page);
    await page.getByRole("tab", { name: "Query" }).click();
  });

  test("runs COUNT(*) and shows result", async ({ page }) => {
    const editor = page.locator("textarea").first();
    await editor.fill("SELECT COUNT(*) AS total FROM data;");
    await page.getByRole("button", { name: /run/i }).click();
    await expect(page.getByText(/1 row returned/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("columnheader", { name: "total" })
    ).toBeVisible();
  });

  test("runs group-by query and shows results", async ({ page }) => {
    const editor = page.locator("textarea").first();
    await editor.fill(
      'SELECT "RainToday", COUNT(*) AS cnt FROM data GROUP BY "RainToday" ORDER BY cnt DESC;'
    );
    await page.getByRole("button", { name: /run/i }).click();
    await expect(page.getByText(/rows? returned/i)).toBeVisible({
      timeout: 15_000,
    });
    await expect(
      page.getByRole("columnheader", { name: "RainToday" })
    ).toBeVisible();
  });

  test("shows error message for invalid SQL", async ({ page }) => {
    const editor = page.locator("textarea").first();
    await editor.fill("SELECT not_a_column FROM data;");
    await page.getByRole("button", { name: /run/i }).click();
    // QueryTab renders errors in a red Paper — use .first() since query history also matches
    await expect(
      page.locator(".MuiPaper-root").filter({ hasText: /not_a_column/i }).first()
    ).toBeVisible({ timeout: 15_000 });
  });

  test("Ctrl+Enter runs query", async ({ page }) => {
    const editor = page.locator("textarea").first();
    await editor.fill("SELECT 42 AS answer;");
    await editor.press("Control+Enter");
    await expect(page.getByText(/1 row returned/i)).toBeVisible({
      timeout: 15_000,
    });
  });
});
