import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  formatVisitMessage,
  sendTelegramVisit,
} from "../../server/src/services/visits.ts";

const payload = {
  ip: "192.0.2.1",
  city: "Rotterdam",
  region: "South Holland",
  country: "Netherlands",
  location: "51.92,4.48",
  userAgent: "Test browser",
  platform: "Test platform",
  language: "en",
  vendor: "Test vendor",
  screenResolution: "1440x900",
  windowSize: "1200x800",
  timestamp: "2026-10-08T12:00:00.000Z",
};

describe("visit notifications (server)", () => {
  it("keeps location and device details for older clients without new fields", () => {
    const message = formatVisitMessage(payload);
    for (const text of [
      "📱 New Visit",
      "Rotterdam, South Holland, Netherlands",
      "51.92,4.48",
      "192.0.2.1",
      "Test platform",
      "1440x900",
      "Test browser",
    ]) {
      assert.ok(message.includes(text), text);
    }
  });

  it("sanitizes line breaks in visitor strings", () => {
    const message = formatVisitMessage({
      ...payload,
      city: "Rotterdam\nInjected line",
    });
    assert.ok(message.includes("Rotterdam Injected line"));
  });

  it("includes page, referrer, local time, ISP, trusted IP and a map link", () => {
    const message = formatVisitMessage({
      ...payload,
      pageUrl: "https://ybaha.com/?token=private#fragment",
      pageTitle: "Baha — Portfolio",
      referrer: "https://example.com/article?email=private@example.com#token",
      timezone: "Europe/Amsterdam",
      organization: "Example ISP",
      postalCode: "3011",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 Chrome/130.0.0.0 Safari/537.36",
    }, "203.0.113.8", new Date("2026-10-08T12:00:02.000Z"));
    for (const detail of [
      "Page: https://ybaha.com/", "Title: Baha — Portfolio",
      "Referrer: https://example.com/article", "Europe/Amsterdam",
      "14:00:00", "2026-10-08T12:00:00.000Z", "Example ISP", "3011",
      "Received (UTC, server): 2026-10-08T12:00:02.000Z",
      "IP (server): 203.0.113.8", "IP (location lookup): 192.0.2.1",
      "https://www.google.com/maps?q=51.92,4.48", "Chrome 130.0.0.0", "Mac / desktop",
    ]) assert.ok(message.includes(detail), detail);
    assert.doesNotMatch(message, /private|fragment|#token/);
  });

  it("handles absent context, invalid URLs, invalid coordinates and time zones", () => {
    const message = formatVisitMessage({
      ...payload, pageUrl: "javascript:alert(1)", referrer: "not a URL",
      timezone: "Invalid/Zone", location: "91,200",
    });
    assert.match(message, /Page: Not provided/);
    assert.match(message, /Referrer: Direct \/ not shared/);
    assert.match(message, /Visitor local time: Unknown/);
    assert.doesNotMatch(message, /google\.com\/maps|javascript:|undefined/);
  });

  it("does not turn missing or malformed coordinates into a map link", () => {
    for (const location of [",", "0,", "0,0,1", "NaN,0", "Unknown"]) {
      assert.doesNotMatch(formatVisitMessage({ ...payload, location }), /google\.com\/maps/);
    }
    assert.match(formatVisitMessage({ ...payload, location: "0,0" }), /maps\?q=0,0/);
  });

  it("recognizes common browsers and device types without calling them verified identities", () => {
    for (const [userAgent, browser, device] of [
      ["Mozilla/5.0 (iPhone) Version/18.0 Mobile Safari/604.1", "Safari 18.0", "iPhone / mobile"],
      ["Mozilla/5.0 (Windows NT 10.0) Chrome/130.0 Safari/537.36 Edg/130.1", "Edge 130.1", "Windows / desktop"],
      ["Mozilla/5.0 (Android 14; Mobile) Firefox/132.0", "Firefox 132.0", "Android / mobile"],
      ["Mozilla/5.0 (iPad) CriOS/130.0 Safari/604.1", "Chrome 130.0", "iPad / tablet"],
      ["HeadlessChrome/130.0", "Chrome 130.0", "Bot / automation (inferred)"],
    ]) {
      const message = formatVisitMessage({ ...payload, userAgent });
      assert.ok(message.includes(browser), browser);
      assert.ok(message.includes(device), device);
      assert.match(message, /inferred from UA/);
    }
  });

  it("bounds the Telegram text and removes control characters and URL credentials", () => {
    const message = formatVisitMessage({
      ...payload,
      pageUrl: `https://name:password@example.com/${"x".repeat(2048)}?secret=yes`,
      referrer: `https://example.org/${"y".repeat(2048)}`,
      pageTitle: "Title\u0000\u2028Injected",
      organization: "ISP\nInjected",
      userAgent: "z".repeat(1024),
      city: "c".repeat(200), region: "r".repeat(200), country: "n".repeat(200),
      platform: "p".repeat(200), vendor: "v".repeat(200), language: "l".repeat(200),
      screenResolution: "s".repeat(200), windowSize: "w".repeat(200),
    });
    assert.ok(message.length <= 4000);
    assert.doesNotMatch(message, /password|secret=yes|\u0000|\u2028|\nInjected/);
    assert.match(message, /Page: https:\/\/example\.com\//);
  });

  it("Telegram delivery is production-only and optional", async () => {
    const calls = [];
    const transport = async (...args) => {
      calls.push(args);
      return Response.json({ ok: true });
    };
    const deps = {
      nodeEnv: "development",
      botToken: "test-token",
      chatId: "test-chat",
      transport,
    };
    await sendTelegramVisit(deps, "Visit");
    assert.equal(calls.length, 0);

    await sendTelegramVisit({ ...deps, nodeEnv: "production", botToken: undefined }, "Visit");
    assert.equal(calls.length, 0);

    await sendTelegramVisit({ ...deps, nodeEnv: "production" }, "Visit");
    assert.equal(calls.length, 1);
    const body = JSON.parse(calls[0][1].body);
    assert.equal(body.chat_id, "test-chat");
    assert.equal(body.text, "Visit");
    assert.deepEqual(body.link_preview_options, { is_disabled: true });
    assert.equal(body.parse_mode, undefined);
  });
});
