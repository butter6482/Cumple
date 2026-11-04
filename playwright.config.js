// @ts-check
const { defineConfig, devices } = require("@playwright/test");

module.exports = defineConfig({
  testDir: "./tests",
  timeout: 60_000,
  reporter: "list",
  use: { baseURL: "http://localhost:4173", trace: "retain-on-failure" },
  webServer: {
    command: "node tests/server.js",
    url: "http://localhost:4173/",
    reuseExistingServer: true,
    timeout: 30_000
  },
  projects: [
    // WebKit no está instalado: emulamos el iPhone con Chromium.
    { name: "mobile-iphone", use: { ...devices["iPhone 13"], browserName: "chromium" } },
    { name: "android", use: { ...devices["Pixel 7"] } },
    { name: "desktop", use: { ...devices["Desktop Chrome"] } }
  ]
});
