import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  sanitizeVisitField,
  sanitizeVisitPayload,
  sanitizeVisitUrl,
} from "../../server/src/services/visit-data.ts";

const basePayload = {
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

describe("visit-data sanitization", () => {
  it("strips control characters and bounds fields", () => {
    assert.equal(sanitizeVisitField("a\nb\rc", 2), "a ");
  });

  it("keeps only safe http(s) origin and pathname", () => {
    assert.equal(
      sanitizeVisitUrl("https://user:pass@example.com/path?secret=1#hash"),
      "https://example.com/path",
    );
    assert.equal(sanitizeVisitUrl("javascript:alert(1)"), undefined);
  });

  it("returns only known DTO fields with sanitized values", () => {
    const sanitized = sanitizeVisitPayload({
      ...basePayload,
      city: "Rotterdam\nInjected",
      pageUrl: "https://ybaha.com/?token=private",
      referrer: "not-a-url",
      pageTitle: "Title",
      timezone: "Europe/Amsterdam",
      organization: "ISP",
      postalCode: "3011",
      extra: "ignored",
    });
    assert.equal(sanitized.city, "Rotterdam Injected");
    assert.equal(sanitized.pageUrl, "https://ybaha.com/");
    assert.equal(sanitized.referrer, undefined);
    assert.equal(sanitized.timestamp, basePayload.timestamp);
    assert.equal("extra" in sanitized, false);
  });
});
