import assert from "node:assert/strict";
import { describe, it } from "node:test";

import {
  paginateCommentRows,
  serializeComment,
} from "../../server/src/services/comment-serialize.ts";

describe("server comment serialization", () => {
  const baseRow = {
    id: "c1",
    text: "comment c1",
    createdAt: new Date("2024-01-01T12:00:00.000Z"),
    user: { name: "Ada", image: null },
    votes: [
      { value: 1, userId: "voter-a" },
      { value: -1, userId: "voter-b" },
      { value: 1, userId: "current-user" },
    ],
  };

  it("does not expose voter identities", () => {
    const serialized = serializeComment(baseRow, "current-user");
    const json = JSON.stringify(serialized);
    assert.ok(!json.includes("voter-a"));
    assert.equal(serialized.score, 1);
    assert.equal(serialized.currentUserVote, 1);
    assert.match(serialized.createdAt, /^\d{4}-/);
  });

  it("returns zero currentUserVote when logged out", () => {
    const serialized = serializeComment(baseRow, undefined);
    assert.equal(serialized.currentUserVote, 0);
  });

  it("paginates without mutating the fetched window", () => {
    const ids = Array.from({ length: 6 }, (_, i) => ({ id: `id-${i + 1}` }));
    const input = [...ids];
    const first = paginateCommentRows(input, 5);
    assert.deepEqual(
      first.page.map((row) => row.id),
      ["id-1", "id-2", "id-3", "id-4", "id-5"],
    );
    assert.equal(first.nextCursor, "id-5");
    assert.equal(input.length, 6);
  });
});
