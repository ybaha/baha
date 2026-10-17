import assert from "node:assert/strict";
import { describe, it } from "node:test";

import { visitNotificationsAllowed } from "../../src/lib/preview.ts";

describe("visitNotificationsAllowed", () => {
  it("suppresses tracking on preview-style hosts even when env override is set", () => {
    assert.equal(
      visitNotificationsAllowed("branch.pages.dev", false, true),
      false,
    );
  });

  it("suppresses tracking on localhost before env override", () => {
    assert.equal(visitNotificationsAllowed("localhost", false, true), false);
    assert.equal(visitNotificationsAllowed("127.0.0.1", false, true), false);
    assert.equal(visitNotificationsAllowed("app.localhost", false, true), false);
    assert.equal(visitNotificationsAllowed("[::1]", false, true), false);
  });

  it("allows env override on production canonical host", () => {
    assert.equal(visitNotificationsAllowed("ybaha.com", false, true), true);
  });

  it("defaults to canonical host only without env override", () => {
    assert.equal(visitNotificationsAllowed("ybaha.com", false, false), true);
    assert.equal(visitNotificationsAllowed("other.example.com", false, false), false);
    assert.equal(visitNotificationsAllowed("custom.example.com", false, false, "custom.example.com"), true);
  });
});
