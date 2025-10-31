const { chromium } = require("@playwright/test");
const fs = require("fs");
(async () => {
  const baseURL = process.env.E2E_BASE_URL || "http://127.0.0.1:5173";
  console.log("Base URL:", baseURL);
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    storageState: "tests/e2e/auth.json",
  });
  const page = await context.newPage();

  const seen = [];
  page.on("request", (req) => {
    seen.push({
      url: req.url(),
      method: req.method(),
      resourceType: req.resourceType(),
    });
  });
  page.on("response", (resp) => {
    // Only log API responses
    if (resp.url().includes("/api/propfinder")) {
      console.log("Resp:", resp.status(), resp.url());
    }
  });
  page.on("console", (msg) => {
    try {
      console.log("PAGE LOG:", msg.type(), msg.text());
    } catch (e) {
      console.log("PAGE LOG: (error reading message)");
    }
  });

  try {
    await page.goto(baseURL + "/", {
      waitUntil: "networkidle",
      timeout: 20000,
    });
  } catch (e) {
    console.warn("goto failed:", e.message);
  }

  // wait a little for SPA to mount
  await page.waitForTimeout(2000);

  const localKeys = await page.evaluate(() => Object.keys(localStorage));
  console.log("localStorage keys:", localKeys);

  const lastReq = await page.evaluate(
    () => window.__propfinder_last_request_url ?? null
  );
  console.log("window.__propfinder_last_request_url =", lastReq);
  const lastResp = await page.evaluate(
    () => window.__propfinder_last_response ?? null
  );
  console.log(
    "window.__propfinder_last_response =",
    lastResp ? "present" : null
  );

  // page info
  const title = await page.title();
  console.log("page.title =", title);
  const hasRoot = await page.evaluate(() => !!document.getElementById("root"));
  console.log("has #root element:", hasRoot);
  const hasAppContainer = await page.evaluate(
    () => !!document.querySelector('[data-testid="app-container"]')
  );
  console.log("has [data-testid=app-container]:", hasAppContainer);
  const hasPropHeading = await page.evaluate(
    () => !!document.querySelector('[data-testid="propfinder-killer-heading"]')
  );
  console.log("has propfinder heading:", hasPropHeading);

  // print the first several network requests for inspection
  console.log("First network requests seen (slice 0..50):");
  console.log(seen.slice(0, 50));

  await browser.close();
})();
