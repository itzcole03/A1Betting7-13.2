# StreamBackgroundCard & Backend Automation Usage

## Usage

1. **Start the Frontend and Backend**

   - Frontend: `npm run dev --prefix frontend` (http://localhost:5174/)
   - Backend: `node stream-background-server.js`

2. **Using the Card**
   - Enter a target URL (default: https://the.streameast.app).
   - Optionally, enter a CSS selector to click after page load (e.g., `.game-link` for a game tile).
   - Click "Start Background Session" to launch a headless browser session on the backend.
   - Click "Show Screenshot" to fetch and display a screenshot of the current page for verification.

## Limitations

- **CSP/X-Frame-Options**: The frontend cannot embed protected streams directly; all automation must be done server-side.
- **User Interaction**: Some streams require user interaction (e.g., clicking a game link). Use the click selector field to automate this.
- **Session Persistence**: Only one background session is supported at a time. Restart the backend to reset.
- **Performance**: Headless browser sessions are resource-intensive; use judiciously.

## Next Steps for Automation

- **Scraping Game Links**: Extend the backend to extract and return available game links for user selection.
- **Extracting Stream URLs**: Automate extraction of .m3u8 or video URLs for direct playback or proxying.
- **Proxying Streams**: Implement a backend proxy to relay protected streams to the frontend if needed.
- **Session Management**: Add support for multiple or user-specific sessions.

## Troubleshooting

- If the screenshot is blank or incorrect, try adjusting the click selector or increasing wait times in the backend.
- Check backend logs for Puppeteer errors.

---

For advanced scraping or automation, see Puppeteer documentation and consider legal/ethical implications of automating protected content.
