'use strict';

const assert = require('node:assert/strict');
const { describe, it } = require('node:test');
require('tsx/cjs/api').register();

const {
  advanceMockSnapshot,
  createMockEvent,
  INITIAL_SNAPSHOT,
  SERVICES,
} = require('../src/components/live-operations/mock-data.ts');

describe('live operations mock telemetry', () => {
  it('has deterministic, hydration-safe initial data', () => {
    assert.deepEqual(createMockEvent(3), INITIAL_SNAPSHOT.events[0]);
    assert.equal(createMockEvent(3).time, '14:32:09');
    assert.equal(INITIAL_SNAPSHOT.traffic.length, 24);
    assert.equal(new Set(SERVICES.map((service) => service.id)).size, 3);
    assert.equal(new Set(SERVICES.map((service) => service.nodeId)).size, 3);
    for (const service of SERVICES) {
      assert.match(service.nodeId, /^(eu|edge|home)-01$/);
      assert.ok(service.workload.length > 0);
      assert.ok(service.memory > 0 && service.memory < 100);
    }
  });

  it('advances metrics and events without mutating prior snapshots', () => {
    const original = structuredClone(INITIAL_SNAPSHOT);
    const next = advanceMockSnapshot(INITIAL_SNAPSHOT);
    assert.deepEqual(INITIAL_SNAPSHOT, original);
    assert.equal(next.sequence, original.sequence + 1);
    assert.ok(next.requests > original.requests);
    assert.notEqual(next.latency, original.latency);
    assert.deepEqual(next.traffic.slice(0, -1), original.traffic.slice(1));
    assert.equal(next.events[0].id, next.sequence);
    assert.deepEqual(next.events.slice(1), original.events);
  });

  it('keeps buffers bounded and generates all event kinds across all machines', () => {
    let snapshot = INITIAL_SNAPSHOT;
    for (let i = 0; i < 1000; i++) snapshot = advanceMockSnapshot(snapshot);
    assert.equal(snapshot.events.length, 12);
    assert.equal(snapshot.traffic.length, 24);
    assert.equal(new Set(snapshot.events.map((event) => event.id)).size, 12);
    assert.deepEqual(new Set(snapshot.events.map((event) => event.kind)), new Set(['request', 'job', 'deploy']));
    assert.deepEqual(new Set(snapshot.events.map((event) => event.service)), new Set(SERVICES.map((service) => service.id)));
    for (const event of snapshot.events) {
      assert.match(event.time, /^\d{2}:\d{2}:\d{2}$/);
      assert.ok(event.duration >= 82 && event.duration <= 251);
      assert.equal('body' in event, false);
    }
  });
});
