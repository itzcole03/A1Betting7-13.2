"""PrizePicks stealth scraper (import-safe).

This script avoids importing or starting browser instances at import time so
that test discovery and static analysis do not trigger heavy side-effects.
Run directly to perform scraping.
"""

from typing import Any, Dict, List, Optional


def _build_options() -> Any:
    """Build browser options lazily to avoid importing selenium at module import."""
    try:
        import undetected_chromedriver as uc
        from selenium.webdriver.chrome.options import Options
    except Exception:
        # If the optional packages are unavailable, return None so the caller
        # can handle the missing dependency gracefully.
        return None

    options = Options()
    options.add_argument("--headless=new")
    options.add_argument("--no-sandbox")
    options.add_argument("--disable-dev-shm-usage")
    return options


def scrape_prizepicks(target_url: str) -> Optional[List[Dict[str, Any]]]:
    """Perform scraping using undetected-chromedriver when available.

    Returns parsed projection data or None if dependencies are missing.
    """
    options = _build_options()
    if options is None:
        print("Stealth scraping dependencies not installed; skipping.")
        return None

    try:
        import undetected_chromedriver as uc
        from selenium.webdriver.common.by import By
        from selenium.webdriver.support.ui import WebDriverWait
        from selenium.webdriver.support import expected_conditions as EC
    except Exception:
        print("Required selenium packages missing; install undetected_chromedriver and selenium.")
        return None

    driver = None
    try:
        driver = uc.Chrome(options=options)
        driver.get(target_url)

        # Example wait and parse logic (adjust selectors to actual site)
        wait = WebDriverWait(driver, 10)
        # Example: wait for a table of projections
        wait.until(EC.presence_of_all_elements_located((By.CSS_SELECTOR, ".projection-row")))

        rows = driver.find_elements(By.CSS_SELECTOR, ".projection-row")
        results = []
        for r in rows:
            try:
                player = r.find_element(By.CSS_SELECTOR, ".player-name").text
                stat = r.find_element(By.CSS_SELECTOR, ".stat-type").text
                line = r.find_element(By.CSS_SELECTOR, ".line").text
                results.append({"player": player, "stat": stat, "line": line})
            except Exception:
                continue

        return results
    finally:
        if driver:
            try:
                driver.quit()
            except Exception:
                pass


def main():
    # Example target; adjust as needed when running directly.
    url = "https://app.prizepicks.com/"
    data = scrape_prizepicks(url)
    if data is None:
        print("No data scraped or dependencies missing.")
    else:
        print(f"Scraped {len(data)} projection rows.")


if __name__ == "__main__":
    main()
