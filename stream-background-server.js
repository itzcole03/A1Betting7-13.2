const express = require("express");
const puppeteer = require("puppeteer");
const app = express();
const port = 4001;

let browser = null;
let page = null;

app.use(express.json());

// Endpoint to get a screenshot of the current page
app.get("/api/stream-background/screenshot", async (req, res) => {
  try {
    if (!page) {
      return res
        .status(400)
        .json({ success: false, error: "No active session." });
    }
    const screenshot = await page.screenshot({
      encoding: "base64",
      fullPage: true,
    });
    res.json({ success: true, screenshot });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Endpoint to get the HTML of the current page
app.get("/api/stream-background/html", async (req, res) => {
  try {
    if (!page) {
      return res
        .status(400)
        .json({ success: false, error: "No active session." });
    }
    const html = await page.content();
    res.json({ success: true, html });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

app.post("/api/stream-background/start", async (req, res) => {
  try {
    const { url, clickSelector } = req.body || {};
    const targetUrl = url || "https://the.streameast.app";
    if (browser) {
      return res.json({ success: true, message: "Session already started." });
    }
    browser = await puppeteer.launch({ headless: true });
    page = await browser.newPage();
    await page.goto(targetUrl, {
      waitUntil: "domcontentloaded",
      timeout: 60000,
    });
    if (clickSelector) {
      await page.waitForSelector(clickSelector, { timeout: 10000 });
      await page.click(clickSelector);
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.post("/api/stream-background/stop", async (req, res) => {
  try {
    if (browser) {
      await browser.close();
      browser = null;
      page = null;
    }
    res.json({ success: true });
  } catch (err) {
    res.json({ success: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Stream background server running on port ${port}`);
});
