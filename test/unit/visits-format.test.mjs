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
  it("restores the previous visit message format", () => {
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

  it("Telegram delivery is production-only and optional", async () => {
    const calls = [];
    const transport = async (...args) => {
      calls.push(args);
      return { ok: true };
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
  });
});
