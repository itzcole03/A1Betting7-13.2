const puppeteer = require("puppeteer");

(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();

  // Store found m3u8 URLs
  const m3u8Urls = new Set();

  // Listen for all network requests
  page.on("request", (request) => {
    const url = request.url();
    if (url.includes(".m3u8")) {
      m3u8Urls.add(url);
      console.log("Found stream:", url);
    }
  });

  // Go to the target page (change to your stream page if needed)
  await page.goto("https://the.streameast.app/v91", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });

  // Wait a bit for all requests to fire
  await new Promise((r) => setTimeout(r, 10000));

  if (m3u8Urls.size === 0) {
    console.log("No .m3u8 streams found.");
  } else {
    console.log("All found .m3u8 URLs:", Array.from(m3u8Urls));
  }

  await browser.close();
})();
