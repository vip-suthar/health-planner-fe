/**
 * Self-check for the two spec shapes that silently produced wrong UI before:
 *   1. /data/ledger/today returns either LedgerDay or the flat EmptyLedgerDay.
 *   2. /data/plans/today returns 200 (a plan) or 202 (generation queued) with
 *      bodies that are NOT distinguishable without the status code.
 *   3. Plan task times are ranges with one trailing meridiem ("06:00 - 06:45 am").
 *
 * Run: node src/lib/mappers.check.mjs
 */
import assert from "node:assert/strict";

/* ---- 1. mapBudget accepts both ledger shapes ---- */
// Mirrors the target/consumed resolution in mappers.ts mapBudget().
const resolve = (l) => ({
  t: l?.nutrition?.target ?? l?.targets,
  c: l?.nutrition?.consumed ?? l?.consumed,
});

const stored = {
  nutrition: { target: { calories: 2000 }, consumed: { calories: 750 } },
};
const empty = {
  date: "2026-08-04",
  targets: { calories: 2000 },
  consumed: { calories: 0 },
  remaining: { calories: 2000 },
  activityBurnMinutes: 0,
};

assert.equal(resolve(stored).t.calories, 2000, "stored ledger target");
assert.equal(resolve(stored).c.calories, 750, "stored ledger consumed");
assert.equal(resolve(empty).t.calories, 2000, "empty ledger target");
assert.equal(resolve(empty).c.calories, 0, "empty ledger consumed");
assert.equal(resolve(undefined).t, undefined, "no ledger -> no target");

/* ---- 2. getPlanToday discriminates on status, not body ---- */
// Mirrors the branch in data.ts getPlanToday().
const classify = (status, body) =>
  status === 202
    ? { state: "generating", status: body.status === "processing" ? "processing" : "queued" }
    : { state: "ready", plan: body };

const queued = { status: "queued", date: "2026-08-04", message: "Building" };
const ready = { planId: "p1", date: "2026-08-04", status: "active", meals: [] };

assert.equal(classify(202, queued).state, "generating");
assert.equal(classify(202, queued).status, "queued");
assert.equal(classify(202, { ...queued, status: "processing" }).status, "processing");
assert.equal(classify(200, ready).state, "ready");
assert.equal(classify(200, ready).plan.planId, "p1");
// The regression this guards: a 202 body also carries `status`, so a
// body-only check would have called the queued placeholder a real plan.
assert.notEqual(classify(202, queued).state, classify(200, ready).state);


/* ---- 3. parseTimeRange: one trailing meridiem covers both ends ---- */
// Mirrors parseTimeRange() in mappers.ts.
function parseTimeRange(time) {
  const mer = /pm/i.test(time) ? "pm" : /am/i.test(time) ? "am" : null;
  const nums = time.match(/(\d{1,2}):(\d{2})/g);
  const parse = (s) => {
    const [h, m] = s.split(":").map(Number);
    return ((mer ? h % 12 : h) + (mer === "pm" ? 12 : 0)) * 60 + m;
  };
  let startMin = parse(nums[0]);
  const endMin = nums[1] ? parse(nums[1]) : startMin;
  if (mer === "pm" && startMin > endMin) startMin -= 12 * 60;
  return { startMin, endMin };
}

assert.deepEqual(parseTimeRange("06:00 - 06:45 am"), { startMin: 360, endMin: 405 }, "am range");
assert.deepEqual(parseTimeRange("01:00 - 01:30 pm"), { startMin: 780, endMin: 810 }, "pm range");
assert.deepEqual(parseTimeRange("11:30 - 12:30 pm"), { startMin: 690, endMin: 750 }, "range crossing noon");
assert.deepEqual(parseTimeRange("13:00"), { startMin: 780, endMin: 780 }, "single 24h time");

console.log("mappers.check: all assertions passed");
