# Native Performance Module Example (Rust/NAPI-RS)

This module demonstrates a minimal Rust/NAPI-RS native addon for Electron/React apps.

## Build Instructions

1. Install Rust (https://rustup.rs/)
2. Install @napi-rs/cli:
   ```bash
   npm install --save-dev @napi-rs/cli
   ```
3. Build the native module:
   ```bash
   npx napi build --release
   ```
4. The resulting `native_perf.node` file can be required in Electron/React code:
   ```js
   const { fast_add } = require("./native/native_perf.node");
   console.log(fast_add(2, 3)); // 5
   ```
5. After upgrading Electron, rebuild with @electron/rebuild:
   ```bash
   npx electron-rebuild
   ```

## Notes

- For Windows, ensure Electron compatibility by following the official docs.
- Unpack `.node` files from Electron asar archive for runtime loading.
- See main README for more details and best practices.
