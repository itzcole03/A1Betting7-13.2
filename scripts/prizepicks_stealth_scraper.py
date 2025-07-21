# PrizePicks Stealth Scraper
# Requirements: pip install selenium selenium-stealth undetected-chromedriver pandas
# For proxies: pip install selenium-wire
# For anti-captcha: pip install 2captcha-python

import time

import pandas as pd
import undetected_chromedriver as uc
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.common.by import By
from selenium_stealth import stealth

# Optional: Use selenium-wire for proxy support
# from seleniumwire import webdriver as wire_webdriver
# proxy = "http://user:pass@proxy_ip:proxy_port"

# --- CONFIG ---
PRIZEPICKS_URL = "https://app.prizepicks.com/"
CHROMEDRIVER_PATH = None  # Use default or specify path
# proxy = None  # Set to your proxy string if needed

# --- SETUP ---
options = uc.ChromeOptions()
options.add_argument("--headless=new")
options.add_argument("--disable-blink-features=AutomationControlled")
options.add_argument("--window-size=1920,1080")
options.add_argument("--no-sandbox")
options.add_argument("--disable-gpu")
options.add_argument("--disable-dev-shm-usage")

# Uncomment for proxy support
# options.add_argument(f'--proxy-server={proxy}')

# Start undetected Chrome
browser = uc.Chrome(options=options, driver_executable_path=CHROMEDRIVER_PATH)

# Stealth settings
stealth(
    browser,
    languages=["en-US", "en"],
    vendor="Google Inc.",
    platform="Win32",
    webgl_vendor="Intel Inc.",
    renderer="Intel Iris OpenGL Engine",
    fix_hairline=True,
)

browser.get(PRIZEPICKS_URL)
time.sleep(5)  # Wait for page to load
# Save screenshot after initial load
browser.save_screenshot("prizepicks_debug_initial.png")
print("Saved screenshot: prizepicks_debug_initial.png")

# --- Handle popups (if any) ---
try:
    close_btn = browser.find_element(By.CLASS_NAME, "popup-close")
    close_btn.click()
    time.sleep(1)
except Exception:
    pass

# --- Scrape sports categories ---
props = []
sports_buttons = browser.find_elements(By.CSS_SELECTOR, '[data-testid="sport-tab"]')
print(f"Found {len(sports_buttons)} sport tabs.")
for sport_btn in sports_buttons:
    try:
        sport_btn.click()
        time.sleep(2)
        # Save screenshot after clicking each sport tab
        idx = sports_buttons.index(sport_btn)
        screenshot_name = f"prizepicks_debug_sport_{idx}.png"
        browser.save_screenshot(screenshot_name)
        print(
            f"Clicked sport tab {idx}: '{sport_btn.text}'. Saved screenshot: {screenshot_name}"
        )
        # Scrape player props for this sport
        players = browser.find_elements(By.CSS_SELECTOR, '[data-testid="player-card"]')
        print(f"  Found {len(players)} player cards for sport '{sport_btn.text}'.")
        for player in players:
            try:
                player_name = player.find_element(
                    By.CSS_SELECTOR, '[data-testid="player-name"]'
                ).text
                prop_type = player.find_element(
                    By.CSS_SELECTOR, '[data-testid*="stat-type"]'
                ).text
                prop_value = player.find_element(
                    By.CSS_SELECTOR, '[data-testid*="stat-value"]'
                ).text
                props.append(
                    {
                        "Player": player_name,
                        "Prop Type": prop_type,
                        "Prop Value": prop_value,
                        "Sport": sport_btn.text,
                    }
                )
            except Exception:
                print(f"    Error scraping player card: {e}")
                continue
    except Exception:
        print(f"Error clicking sport tab: {e}")
        continue

# --- Save to CSV ---
df = pd.DataFrame(props)
df.to_csv("prizepicks_props.csv", index=False)

browser.quit()
print(f"Scraped {len(props)} props. Saved to prizepicks_props.csv.")
