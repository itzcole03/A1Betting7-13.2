#!/usr/bin/env node
const { spawn } = require("child_process");
const path = require("path");
const net = require("net");

const repoTestsE2E = __dirname; // this file lives in <repo>/tests/e2e
// repoRoot should point at the repository root. __dirname is <repo>/tests/e2e,
// so go up two levels to reach the repo root.
const repoRoot = path.resolve(repoTestsE2E, "..", "..");

// The mock-server was added under frontend/tests/e2e/mock-server.cjs
const mockServerPath = path.resolve(
  repoRoot,
  "frontend",
  "tests",
  "e2e",
  "mock-server.cjs"
);
// Prefer a non-default port to avoid clashing with local services
const mockPort = process.env.E2E_MOCK_PORT
  ? Number(process.env.E2E_MOCK_PORT)
  : process.env.MOCK_API_PORT
  ? Number(process.env.MOCK_API_PORT)
  : 8010;

function waitForPort(host, port, timeout = 15000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    (function tryConnect() {
      const sock = net.createConnection(port, host, () => {
        sock.destroy();
        resolve();
      });
      sock.on("error", () => {
        if (Date.now() - start > timeout) {
          reject(new Error("timeout waiting for port " + port));
        } else {
          setTimeout(tryConnect, 200);
        }
      });
    })();
  });
}

(async function main() {
  console.log("Running lean E2E runner — starting mock server and Playwright");

  // Start mock server
  console.log("Starting mock server at:", mockServerPath);
  const mock = spawn(process.execPath, [mockServerPath], {
    stdio: "inherit",
    env: Object.assign({}, process.env, { PORT: String(mockPort) }),
  });

  mock.on("error", (err) => {
    console.error("Failed to spawn mock server:", err);
    process.exit(1);
  });

  try {
    await waitForPort("127.0.0.1", mockPort, 15000);
    console.log("Mock server is responsive on port", mockPort);
  } catch (err) {
    console.error("Mock server did not respond in time:", err);
    try {
      mock.kill();
    } catch (e) {}
    process.exit(1);
  }

  // Run Playwright via `npm exec` to avoid missing npx on some Node installs.
  // Using `npm exec --no-install playwright -- test ...` runs the local bin.
  const env = Object.assign({}, process.env, {
    E2E_USE_MOCKS: "1",
    E2E_MOCK_PORT: String(mockPort),
  });

  // placeholder for static server child (started later if requested)
  let staticServerChild = null;
  // placeholder for frontend dev server child (if we start it)
  let frontendChild = null;

  console.log("Attempting to run Playwright (tries: npx -> npm -> node CLI).");

  const frontendCwd = path.resolve(repoRoot, "frontend");
  // Use absolute config path so Playwright resolves correctly regardless of cwd
  const playwrightConfigPath = path.resolve(
    repoRoot,
    "tests",
    "e2e",
    "playwright.config.ts"
  );
  // If there is a local tests/e2e installation of @playwright/test, prefer running from that folder
  const fs = require("fs");
  const e2eLocalPlaywright = path.resolve(
    repoRoot,
    "tests",
    "e2e",
    "node_modules",
    "@playwright",
    "test"
  );
  const playwrightCwd = fs.existsSync(e2eLocalPlaywright)
    ? path.resolve(repoRoot, "tests", "e2e")
    : frontendCwd;
  const resolvedPlaywrightConfigPath = fs.existsSync(playwrightConfigPath)
    ? playwrightConfigPath
    : path.resolve(playwrightCwd, "playwright.config.ts");

  // Helper to try spawning a command and return the child.
  function trySpawn(cmd, args, opts) {
    try {
      return spawn(cmd, args, opts);
    } catch (e) {
      return null;
    }
  }

  // When running in lean mock mode, run only the example specs folder to avoid
  // trying to load the full frontend (which is not started by this runner).
  const leanOnlyExamples =
    env.E2E_USE_MOCKS === "1" || env.E2E_USE_MOCKS === "true";
  const exampleTestPath = leanOnlyExamples ? ["examples"] : [];

  // If requested, start the tiny static server that serves a minimal SPA stub
  // so page.goto('/') and other routes work in the example specs.
  if (leanOnlyExamples) {
    // Prefer starting the real frontend dev server (Vite) when the frontend
    // appears to be installed and has a dev script. If not available, fall
    // back to the minimal static stub server.
    try {
      const fs = require("fs");
      const pkgPath = path.resolve(frontendCwd, "package.json");
      const nodeModulesPath = path.resolve(frontendCwd, "node_modules");
      const hasNodeModules = fs.existsSync(nodeModulesPath);
      let startedFrontend = false;

      if (fs.existsSync(pkgPath) && hasNodeModules) {
        // read package.json and prefer `npm run dev` if present
        const pkg = JSON.parse(fs.readFileSync(pkgPath, "utf8"));
        if (pkg.scripts && (pkg.scripts.dev || pkg.scripts.start)) {
          const preferredScript = pkg.scripts.dev ? "dev" : "start";
          const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
          console.log(
            `Starting frontend (${preferredScript}) via ${npmCmd} in ${frontendCwd}`
          );
          frontendChild = trySpawn(npmCmd, ["run", preferredScript], {
            stdio: "inherit",
            cwd: frontendCwd,
            env: Object.assign({}, process.env),
            shell: true,
          });

          // Default Vite dev port; allow override via FRONTEND_PORT env var
          const frontendPort = process.env.FRONTEND_PORT
            ? Number(process.env.FRONTEND_PORT)
            : 5173;
          try {
            await waitForPort("127.0.0.1", frontendPort, 30000);
            console.log(
              `✅ Frontend dev server listening on http://localhost:${frontendPort}`
            );
            env.E2E_BASE_URL = `http://localhost:${frontendPort}`;
            startedFrontend = true;
          } catch (err) {
            console.warn(
              "Frontend did not become ready in time:",
              err && err.message ? err.message : err
            );
            // fallthrough to fallback static server
          }
        }
      }

      if (!frontendChild || !env.E2E_BASE_URL) {
        // Fallback: static stub
        const staticServerPath = path.resolve(
          repoRoot,
          "tests",
          "e2e",
          "static-server.cjs"
        );
        try {
          staticServerChild = trySpawn(process.execPath, [staticServerPath], {
            stdio: "inherit",
            env: Object.assign({}, process.env, { E2E_STATIC_PORT: "3000" }),
          });
          // wait for static server to be ready
          await waitForPort("127.0.0.1", 3000, 10000);
          console.log(
            "✅ Static E2E stub server listening on http://localhost:3000"
          );
          env.E2E_BASE_URL = env.E2E_BASE_URL || "http://localhost:3000";
        } catch (e) {
          console.warn(
            "⚠️ Could not start static E2E stub server:",
            e && e.message ? e.message : e
          );
          if (staticServerChild) {
            try {
              staticServerChild.kill();
            } catch (e) {}
          }
        }
      }
    } catch (e) {
      console.warn(
        "Error while attempting to start frontend or static stub:",
        e && e.message ? e.message : e
      );
    }
  }

  // 1) Try npx if available (on Windows the command is npx.cmd)
  const spawnSync = require("child_process").spawnSync;
  let proc = null;
  try {
    const npxCmd = process.platform === "win32" ? "npx.cmd" : "npx";
    const npxCheck = spawnSync(npxCmd, ["--version"], {
      stdio: "ignore",
      shell: true,
    });
    if (npxCheck && npxCheck.status === 0) {
      proc = trySpawn(
        npxCmd,
        [
          "playwright",
          "test",
          `--config=${resolvedPlaywrightConfigPath}`,
          "--workers=1",
          ...exampleTestPath,
        ],
        {
          stdio: "inherit",
          cwd: playwrightCwd,
          env,
          shell: true,
        }
      );
    } else {
      // helpful debug when detection fails in CI/dev environments
      // console.debug('npx check failed', npxCheck && npxCheck.status);
    }
  } catch (e) {
    // ignore - we'll try npm next
  }

  // 2) Try npm exec if npx not available (use npm.cmd on Windows)
  if (!proc) {
    try {
      const npmCmd = process.platform === "win32" ? "npm.cmd" : "npm";
      const npmCheck = spawnSync(npmCmd, ["--version"], {
        stdio: "ignore",
        shell: true,
      });
      if (npmCheck && npmCheck.status === 0) {
        proc = trySpawn(
          npmCmd,
          [
            "exec",
            "--no-install",
            "playwright",
            "--",
            "test",
            `--config=${resolvedPlaywrightConfigPath}`,
            "--workers=1",
            ...exampleTestPath,
          ],
          {
            stdio: "inherit",
            cwd: playwrightCwd,
            env,
            shell: true,
          }
        );
      } else {
        // console.debug('npm check failed', npmCheck && npmCheck.status);
      }
    } catch (e) {
      // ignore
    }
  }

  // 3) Try running Playwright CLI via node directly (if installed under frontend/node_modules)
  if (!proc) {
    const candidateCli = path.resolve(
      frontendCwd,
      "node_modules",
      "@playwright",
      "test",
      "lib",
      "cli",
      "cli.js"
    );
    const altCli = path.resolve(
      frontendCwd,
      "node_modules",
      "@playwright",
      "test",
      "lib",
      "cli",
      "index.js"
    );
    const cliPath = require("fs").existsSync(candidateCli)
      ? candidateCli
      : altCli;
    if (require("fs").existsSync(cliPath)) {
      proc = trySpawn(
        process.execPath,
        [
          cliPath,
          "test",
          "--config=tests/e2e/playwright.config.ts",
          "--workers=1",
        ],
        {
          stdio: "inherit",
          cwd: frontendCwd,
          env,
        }
      );
    }
  }

  if (!proc) {
    console.error(
      "Could not locate a Playwright runner (npx/npm/node). Please run Playwright locally."
    );
    try {
      mock.kill();
    } catch (e) {}
    process.exit(1);
  }

  proc.on("exit", (code) => {
    console.log("Playwright exited with code", code);
    try {
      mock.kill();
    } catch (e) {}
    if (frontendChild) {
      try {
        frontendChild.kill();
      } catch (e) {}
    }
    process.exit(code === null ? 1 : code);
  });

  proc.on("error", (err) => {
    console.error("Error running Playwright:", err);
    try {
      mock.kill();
    } catch (e) {}
    process.exit(1);
  });

  // Forward signals to child processes
  ["SIGINT", "SIGTERM", "SIGHUP"].forEach((sig) => {
    process.on(sig, () => {
      try {
        proc.kill(sig);
      } catch (e) {}
      try {
        mock.kill(sig);
      } catch (e) {}
      if (frontendChild) {
        try {
          frontendChild.kill(sig);
        } catch (e) {}
      }
      process.exit(1);
    });
  });
})();
