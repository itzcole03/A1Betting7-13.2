// Helper to mock WebSocket behavior in Playwright tests by intercepting the
// browser's WebSocket constructor. This is intended for deterministic local
// runs where a real WS feeder isn't available.
import type { Page } from '@playwright/test';

export async function installWsMock(page: Page, messages: any[] = []) {
  // Inject a script that replaces window.WebSocket with a mocked implementation
  await page.addInitScript(
    ({ msgs }) => {
      // eslint-disable-next-line no-inner-declarations
      function createMockSocket() {
        let onopen = null;
        let onmessage = null;
        let onclose = null;
        const queued: any[] = [];

        const socket = {
          send: (data: any) => {
            // echo back for simple tests or ignore
            // console.log('ws send', data);
          },
          close: () => {
            if (typeof onclose === 'function') onclose({ code: 1000 });
          },
          addEventListener: (ev: string, cb: any) => {
            if (ev === 'open') onopen = cb;
            if (ev === 'message') onmessage = cb;
            if (ev === 'close') onclose = cb;
          },
          removeEventListener: () => {},
          readyState: 1,
        };

        // simulate open
        setTimeout(() => {
          if (typeof onopen === 'function') onopen({});
          // deliver queued messages
          for (const m of queued) {
            if (typeof onmessage === 'function') onmessage({ data: JSON.stringify(m) });
          }
        }, 10);

        return socket;
      }

      // Override WebSocket
      // @ts-ignore
      (window as any).WebSocket = function () {
        return createMockSocket();
      };

      // Optionally queue initial messages
      const initial = msgs || [];
      for (const m of initial) {
        setTimeout(() => {
          try {
            // dispatch a message event if listeners added later
            const ev = new MessageEvent('message', { data: JSON.stringify(m) });
            window.dispatchEvent(ev);
          } catch (e) {
            // ignore
          }
        }, 50);
      }
    },
    { msgs: messages }
  );
}

export default { installWsMock };
