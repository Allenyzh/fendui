import assert from "node:assert/strict";
import { registerHooks } from "node:module";
import test from "node:test";
import { emptyAttendance, syncAttendance } from "./model.ts";

// Production uses Next's extensionless imports; resolve that one import for Node's source tests.
const hooks = registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "./model" && context.parentURL === new URL("./ability-memory.ts", import.meta.url).href) {
      return nextResolve("./model.ts", context);
    }
    return nextResolve(specifier, context);
  },
});
const { readAbilityMemory, rememberAbility, restoreAbilities, writeAbilityMemory } = await import("./ability-memory.ts");
hooks.deregister();

const storageKey = "team-split:abilities:v1";

function withWindow(t, value) {
  const descriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", { configurable: true, writable: true, value });
  t.after(() => {
    if (descriptor) Object.defineProperty(globalThis, "window", descriptor);
    else delete globalThis.window;
  });
}

function storage(initialValue = null) {
  const values = new Map(initialValue === null ? [] : [[storageKey, initialValue]]);
  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, value),
  };
}

test("abilities restore across new rosters and note edits, updating history immutably", () => {
  const previous = syncAttendance(["小王（迟到）", "小李"], emptyAttendance());
  const memory = rememberAbility(new Map(), previous.entries, previous.entries[0].id, 3);
  const fresh = syncAttendance(["小李", "小王 早退"], emptyAttendance());
  const restored = restoreAbilities(fresh, memory);
  assert.deepEqual(restored.entries.map((entry) => entry.ability), [null, 3]);
  assert.equal(restored.history[1], restored.entries[1]);
  assert.equal(fresh.entries[1].ability, null);
  assert.equal(fresh.history[1].ability, null);
  assert.equal(restoreAbilities(restored, new Map([["小王", 1]])), restored);
  assert.equal(restoreAbilities(fresh, new Map()), fresh);
});

test("namesakes never share automatic ratings, even with different notes or attendance", () => {
  const state = syncAttendance(["小王（迟到）", "小王（早退）", "小李", "小李"], emptyAttendance());
  state.entries[1].included = false;
  const memory = new Map([["小王", 3], ["小李", 1]]);
  assert.equal(restoreAbilities(state, memory), state);
  for (const entry of state.entries) {
    const remembered = rememberAbility(memory, state.entries, entry.id, 2);
    const expected = new Map(memory);
    expected.delete(entry.player.startsWith("小王") ? "小王" : "小李");
    assert.notEqual(remembered, memory);
    assert.deepEqual(remembered, expected);
    assert.deepEqual(rememberAbility(memory, state.entries, entry.id, null), expected);
  }
  assert.deepEqual([...memory], [["小王", 3], ["小李", 1]]);
});

test("clearing a namesake rating cannot restore an old score when the other namesake is removed", () => {
  let memory = new Map([["小王", 3]]);
  let state = restoreAbilities(syncAttendance(["小王", "小李"], emptyAttendance()), memory);
  const id = state.entries[0].id;
  assert.equal(state.entries[0].ability, 3);
  state = restoreAbilities(syncAttendance(["小王", "小王（早退）", "小李"], state), memory);
  memory = rememberAbility(memory, state.entries, id, null);
  const clear = (entry) => entry.id === id ? { ...entry, ability: null } : entry;
  state = { entries: state.entries.map(clear), history: state.history.map(clear) };
  state = restoreAbilities(syncAttendance(["小王", "小李"], state), memory);
  assert.equal(state.entries[0].ability, null);
  assert.equal(state.history.find((entry) => entry.id === id).ability, null);
  assert.equal(memory.has("小王"), false);
  assert.equal(restoreAbilities(syncAttendance(["小王"], emptyAttendance()), memory).entries[0].ability, null);
});

test("clearing a rating forgets it while preserving other names and original memory", () => {
  const state = syncAttendance(["小王（带水）", "小李"], emptyAttendance());
  const original = new Map([["小王", 3], ["小李", 1]]);
  const cleared = rememberAbility(original, state.entries, state.entries[0].id, null);
  assert.deepEqual([...cleared], [["小李", 1]]);
  assert.deepEqual([...original], [["小王", 3], ["小李", 1]]);
  assert.deepEqual(restoreAbilities(state, cleared).entries.map((entry) => entry.ability), [null, 1]);
  assert.deepEqual(rememberAbility(original, state.entries, -1, 2), original);
  assert.deepEqual(rememberAbility(original, [{ id: 99, player: "  ", included: true, ability: null }], 99, 2), original);
});

test("matching trims names without changing case or guessing aliases", () => {
  const state = syncAttendance(["  Alex （迟到） ", "alex", "阿力"], emptyAttendance());
  const memory = rememberAbility(new Map(), state.entries, state.entries[0].id, 3);
  assert.deepEqual([...memory], [["Alex", 3]]);
  assert.deepEqual(restoreAbilities(state, memory).entries.map((entry) => entry.ability), [3, null, null]);
});

test("memory safely roundtrips through local storage, including prototype-looking names", (t) => {
  const localStorage = storage();
  withWindow(t, { localStorage });
  assert.deepEqual(readAbilityMemory(), { memory: new Map(), available: true });
  const memory = new Map([["__proto__", 3], ["constructor", 2], ["小王", 1]]);
  assert.equal(writeAbilityMemory(memory), true);
  assert.deepEqual(JSON.parse(localStorage.getItem(storageKey)), { version: 1, ratings: [...memory] });
  assert.deepEqual(readAbilityMemory(), { memory, available: true });
  const state = syncAttendance(["__proto__（迟到）", "constructor"], emptyAttendance());
  assert.deepEqual(restoreAbilities(state, memory).entries.map((entry) => entry.ability), [3, 2]);
});

test("legacy v1 memory retains all three original ability levels", (t) => {
  const ratings = [["小王", 1], ["小李", 2], ["小张", 3]];
  const localStorage = storage(JSON.stringify({ version: 1, ratings }));
  withWindow(t, { localStorage });
  const { memory } = readAbilityMemory();
  assert.deepEqual([...memory], ratings);
  const state = syncAttendance(ratings.map(([name]) => name), emptyAttendance());
  assert.deepEqual(restoreAbilities(state, memory).entries.map((entry) => entry.ability), [1, 2, 3]);
  assert.equal(writeAbilityMemory(memory), true);
  assert.deepEqual(JSON.parse(localStorage.getItem(storageKey)), { version: 1, ratings });
});

test("the highest ability level persists and restores after a refresh with changed notes", (t) => {
  withWindow(t, { localStorage: storage() });
  const state = syncAttendance(["小王（带水）", "小李"], emptyAttendance());
  const memory = rememberAbility(new Map(), state.entries, state.entries[0].id, 4);
  assert.equal(writeAbilityMemory(memory), true);
  const saved = readAbilityMemory();
  assert.deepEqual(saved, { memory: new Map([["小王", 4]]), available: true });
  const fresh = syncAttendance(["小李", "小王 早退"], emptyAttendance());
  const restored = restoreAbilities(fresh, saved.memory);
  assert.deepEqual(restored.entries.map((entry) => entry.ability), [null, 4]);
  assert.equal(restored.history[1].ability, 4);
});

test("choosing ordinary replaces a saved highest rating through roster edits and refreshes", (t) => {
  const localStorage = storage(JSON.stringify({ version: 1, ratings: [["小王", 4]] }));
  withWindow(t, { localStorage });
  let memory = readAbilityMemory().memory;
  let state = restoreAbilities(syncAttendance(["小王", "小李"], emptyAttendance()), memory);
  const id = state.entries[0].id;
  assert.equal(state.entries[0].ability, 4);
  memory = rememberAbility(memory, state.entries, id, 2);
  const ordinary = (entry) => entry.id === id ? { ...entry, ability: 2 } : entry;
  state = { entries: state.entries.map(ordinary), history: state.history.map(ordinary) };
  state = restoreAbilities(syncAttendance(["小李", "小王（迟到）"], state), memory);
  assert.equal(state.entries[1].ability, 2);
  assert.equal(writeAbilityMemory(memory), true);
  assert.deepEqual(JSON.parse(localStorage.getItem(storageKey)).ratings, [["小王", 2]]);
  const fresh = syncAttendance(["小王"], emptyAttendance());
  assert.equal(restoreAbilities(fresh, readAbilityMemory().memory).entries[0].ability, 2);
});

test("damaged JSON and unsupported saved structures fall back to empty usable memory", (t) => {
  const localStorage = storage();
  withWindow(t, { localStorage });
  for (const value of ["{", "null", "[]", "1", "false", JSON.stringify({ version: 2, ratings: [["小王", 3]] }), JSON.stringify({ version: "1", ratings: [] }), JSON.stringify({ version: 1 }), JSON.stringify({ version: 1, ratings: {} })]) {
    localStorage.setItem(storageKey, value);
    assert.deepEqual(readAbilityMemory(), { memory: new Map(), available: true }, value);
  }
});

test("saved ratings accept only nonempty names and exact numeric ability levels", (t) => {
  const ratings = [["Valid", 1], ["  Trimmed  ", 3], ["Highest", 4], ["Zero", 0], ["High", 5], ["Fraction", 1.5], ["String", "2"], ["StringHighest", "4"], ["Null", null], ["Boolean", true], [3, 2], ["", 2], ["   ", 2], ["Extra", 2, 3], ["Missing"], null, {}, "row"];
  withWindow(t, { localStorage: storage(JSON.stringify({ version: 1, ratings })) });
  assert.deepEqual(readAbilityMemory(), { memory: new Map([["Valid", 1], ["Trimmed", 3], ["Highest", 4]]), available: true });
});

test("server rendering and blocked storage never throw", async (t) => {
  await t.test("without window", (t) => {
    withWindow(t, undefined);
    assert.deepEqual(readAbilityMemory(), { memory: new Map(), available: false });
    assert.equal(writeAbilityMemory(new Map()), false);
  });
  await t.test("storage property access denied", (t) => {
    withWindow(t, { get localStorage() { throw new Error("denied"); } });
    assert.deepEqual(readAbilityMemory(), { memory: new Map(), available: false });
    assert.equal(writeAbilityMemory(new Map()), false);
  });
  await t.test("storage operations denied", (t) => {
    withWindow(t, { localStorage: { getItem() { throw new Error("denied"); }, setItem() { throw new Error("quota"); } } });
    assert.deepEqual(readAbilityMemory(), { memory: new Map(), available: false });
    assert.equal(writeAbilityMemory(new Map([["小王", 3]])), false);
  });
});
