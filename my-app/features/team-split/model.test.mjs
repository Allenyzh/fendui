import assert from "node:assert/strict";
import test from "node:test";
import {
  DEFAULT_ABILITY,
  buildKits,
  detectColors,
  emptyAttendance,
  formatGroups,
  getGroupCount,
  groupBalancedPlayers,
  groupPlayers,
  halfWidth,
  parsePlayerNotes,
  parsePlayers,
  splitTeams,
  syncAttendance,
  toLines,
} from "./model.ts";

function exclude(state, index) {
  const id = state.entries[index].id;
  const update = (entry) => entry.id === id ? { ...entry, included: false } : entry;
  return { entries: state.entries.map(update), history: state.history.map(update) };
}

function rate(state, index, ability) {
  const id = state.entries[index].id;
  const update = (entry) => entry.id === id ? { ...entry, ability } : entry;
  return { entries: state.entries.map(update), history: state.history.map(update) };
}

function seededRandom(seed) {
  return () => {
    seed = (Math.imul(1664525, seed) + 1013904223) >>> 0;
    return seed / 4294967296;
  };
}

function squaredTotals(groups, players) {
  const scores = new Map(players.map(({ player, ability }) => [player, ability ?? DEFAULT_ABILITY]));
  return groups.reduce((sum, group) => {
    const total = group.reduce((score, player) => score + scores.get(player), 0);
    return sum + total ** 2;
  }, 0);
}

function minimumSquaredTotals(scores, capacities) {
  const totals = capacities.map(() => 0);
  const counts = capacities.map(() => 0);
  let best = Infinity;
  function visit(index) {
    if (index === scores.length) {
      best = Math.min(best, totals.reduce((sum, total) => sum + total ** 2, 0));
      return;
    }
    const seen = new Set();
    capacities.forEach((capacity, team) => {
      const state = `${capacity},${counts[team]},${totals[team]}`;
      if (counts[team] === capacity || seen.has(state)) return;
      seen.add(state);
      counts[team]++;
      totals[team] += scores[index];
      visit(index + 1);
      totals[team] -= scores[index];
      counts[team]--;
    });
  }
  visit(0);
  return best;
}

test("rosters retain original numbering and plain-name fallback rules", () => {
  assert.deepEqual(parsePlayers("#接龙 周六\r\n请准备白蓝上衣\r１． 小白\n2） 小红 (迟到)\u2028其他说明"), ["小白", "小红 (迟到)"]);
  assert.deepEqual(parsePlayers("#接龙\n报名截止今晚\n甲\n乙"), ["甲", "乙"]);
  assert.deepEqual(parsePlayers("甲"), []);
  assert.deepEqual(parsePlayers("1. 甲"), ["甲"]);
  assert.deepEqual(parsePlayers("甲\n2: 乙"), ["乙"]);
  assert.deepEqual(toLines(" \u200b甲\r乙\u2029\ufeff丙 "), ["甲", "乙", "丙"]);
  assert.equal(halfWidth("１２３Ａ"), "123Ａ");
});

test("notes keep nonempty mixed parentheses and the final known note", () => {
  assert.deepEqual(parsePlayerNotes("小王（带水)(早退） 迟到"), {
    name: "小王", notes: ["带水", "早退", "迟到"],
  });
  assert.deepEqual(parsePlayerNotes("小王()"), { name: "小王()", notes: [] });
  assert.deepEqual(parsePlayerNotes("小王迟到"), { name: "小王迟到", notes: [] });
});

test("kit detection excludes player names and keeps notice order and six-team cap", () => {
  assert.deepEqual(detectColors("1. 小白\n2. 小红").map((kit) => kit.key), []);
  const detected = detectColors("#接龙 红蓝白黑黄绿橙上衣\n1. 小王\n2. 小李");
  assert.deepEqual(detected.map((kit) => kit.key), ["red", "blue", "white", "black", "yellow", "green"]);
  assert.deepEqual(buildKits(detected.slice(0, 1), 4).map((kit) => kit.key), ["red", "white", "blue", "black"]);
  assert.equal(buildKits([], 12).at(-1).letter, "L");
  assert.equal(buildKits([], 12).at(-1).key, "custom");
  assert.equal(getGroupCount([], "auto"), 2);
  assert.equal(getGroupCount(detected, "auto"), 6);
  assert.equal(getGroupCount(detected, "3"), 3);
});

test("grouping preserves every occurrence, balances teams, and keeps notes in copy text", () => {
  const players = ["甲", "甲", "乙（迟到）", "丙", "丁", "戊", "己"];
  const groups = groupPlayers(players, 3);
  assert.deepEqual(groups.map((group) => group.length), [3, 2, 2]);
  assert.deepEqual(groups.flat().sort(), [...players].sort());
  assert.throws(() => groupPlayers(players, 0), { message: "groupCount 必须大于 0" });
  const labels = { white: "White team", blue: "Blue team" };
  assert.equal(formatGroups([["甲", "乙（迟到）"], []], buildKits([], 2), (kit, count) => `${labels[kit.key]} (${count} players)`), "White team (2 players)\n1. 甲\n2. 乙（迟到）\n\nBlue team (0 players)\n");
});

test("balanced grouping respects capacities, duplicate occurrences, notes, and immutable input", () => {
  const players = Object.freeze([
    { player: "甲", ability: 4 },
    { player: "甲", ability: 1 },
    { player: "乙（迟到）", ability: null },
    { player: "丙", ability: 2 },
    { player: "丁", ability: 1 },
    { player: "戊", ability: 3 },
    { player: "己", ability: null },
  ].map((player) => Object.freeze(player)));
  const original = structuredClone(players);
  const groups = groupBalancedPlayers(players, 3);
  assert.deepEqual(groups.map((group) => group.length), [3, 2, 2]);
  assert.deepEqual(groups.flat().sort(), players.map(({ player }) => player).sort());
  assert.deepEqual(players, original);
  assert.deepEqual(groupBalancedPlayers([], 3), [[], [], []]);
  assert.deepEqual(groupBalancedPlayers(players.slice(0, 2), 4).map((group) => group.length), [1, 1, 0, 0]);
  assert.throws(() => groupBalancedPlayers(players, 0), { message: "groupCount 必须大于 0" });
});

test("balanced grouping uses regular ability for unspecified ratings and only copies original names", (t) => {
  assert.equal(DEFAULT_ABILITY, 2);
  let random = seededRandom(42);
  t.mock.method(Math, "random", () => random());
  const players = [
    { player: "甲（迟到）", ability: 4 },
    { player: "乙", ability: null },
    { player: "丙", ability: 1 },
    { player: "丁", ability: 3 },
    { player: "戊", ability: null },
    { player: "己", ability: 1 },
  ];
  const implicit = groupBalancedPlayers(players, 3);
  random = seededRandom(42);
  assert.deepEqual(
    groupBalancedPlayers(players.map((entry) => ({
      ...entry,
      ability: entry.ability ?? DEFAULT_ABILITY,
    })), 3),
    implicit,
  );
  const fresh = syncAttendance(["新球员甲", "新球员乙"], emptyAttendance());
  assert.deepEqual(fresh.entries.map((entry) => entry.ability ?? DEFAULT_ABILITY), [2, 2]);
  const copyGroups = groupBalancedPlayers(players.slice(0, 3), 1);
  assert.equal(
    formatGroups(copyGroups, buildKits([], 1), (_, count) => `白队（${count} 人）`),
    "白队（3 人）\n1. 甲（迟到）\n2. 乙\n3. 丙",
  );
});

test("four-point top players contribute to balanced team totals", () => {
  const players = [4, 4, 3, 3, 2, 2, 1, 1].map((ability, index) => ({
    player: `球员${index}`,
    ability,
  }));
  const groups = groupBalancedPlayers(players, 4);
  assert.deepEqual(groups.map((group) => group.length), [2, 2, 2, 2]);
  assert.equal(squaredTotals(groups, players), 100);
});

test("split results score actual duplicate identities for both strategies and copy only names", (t) => {
  t.mock.method(Math, "random", () => 0);
  const players = [
    { id: 1, player: "同名", included: true, ability: 4 },
    { id: 2, player: "同名", included: true, ability: 1 },
    { id: 3, player: "乙（迟到）", included: true, ability: 3 },
    { id: 4, player: "丙", included: true, ability: 2 },
    { id: 5, player: "丁", included: true, ability: null },
  ];
  const random = splitTeams(players, 2, "random");
  assert.deepEqual(random, {
    groups: [["同名", "丙", "同名"], ["乙（迟到）", "丁"]],
    scores: [7, 5],
  });
  const balanced = splitTeams(players, 2, "balanced");
  assert.deepEqual(balanced, {
    groups: [["乙（迟到）", "丁", "同名"], ["同名", "丙"]],
    scores: [6, 6],
  });
  assert.equal(
    formatGroups(balanced.groups, buildKits([], 2), (kit, count) => `${kit.key} (${count})`),
    "white (3)\n1. 乙（迟到）\n2. 丁\n3. 同名\n\nblue (2)\n1. 同名\n2. 丙",
  );
});

test("split scores retain all four levels, default regular, empty teams, and immutable input", () => {
  const players = Object.freeze([4, 3, 2, 1, null].map((ability, index) => Object.freeze({
    id: index + 1,
    player: "同名",
    included: true,
    ability,
  })));
  const original = structuredClone(players);
  for (const strategy of ["random", "balanced"]) {
    const result = splitTeams(players, 6, strategy);
    assert.deepEqual(result.groups, [["同名"], ["同名"], ["同名"], ["同名"], ["同名"], []]);
    assert.deepEqual(result.scores.slice(0, 5).sort((a, b) => a - b), [1, 2, 2, 3, 4]);
    assert.equal(result.scores[5], 0);
    assert.deepEqual(splitTeams([], 2, strategy), { groups: [[], []], scores: [0, 0] });
    assert.throws(() => splitTeams(players, 0, strategy), { message: "groupCount 必须大于 0" });
  }
  assert.deepEqual(players, original);
});

test("scored splitting preserves legacy grouping behavior with the same randomness", (t) => {
  let random = seededRandom(17);
  t.mock.method(Math, "random", () => random());
  const players = [4, 3, 2, 1, null, 4, 1].map((ability, index) => ({
    id: index + 1,
    player: `球员${index}`,
    included: true,
    ability,
  }));
  const randomResult = splitTeams(players, 3, "random");
  random = seededRandom(17);
  assert.deepEqual(randomResult.groups, groupPlayers(players.map(({ player }) => player), 3));
  random = seededRandom(17);
  const balancedResult = splitTeams(players, 3, "balanced");
  random = seededRandom(17);
  assert.deepEqual(balancedResult.groups, groupBalancedPlayers(players, 3));
  assert.equal(randomResult.scores.reduce((sum, score) => sum + score, 0), 17);
  assert.equal(balancedResult.scores.reduce((sum, score) => sum + score, 0), 17);
});

test("balanced grouping improves a greedy allocation through swaps", (t) => {
  t.mock.method(Math, "random", () => 0);
  const players = [3, 3, 2, 2, 2, 1, 1].map((ability, index) => ({
    player: `球员${index}`,
    ability,
  }));
  const groups = groupBalancedPlayers(players, 3);
  assert.equal(squaredTotals(groups, players), 66);
  assert.deepEqual(groups.map((group) => group.length), [3, 2, 2]);
});

test("both strategies can produce different team compositions for equivalent players", (t) => {
  let random = seededRandom(1);
  t.mock.method(Math, "random", () => random());
  const players = Array.from({ length: 12 }, (_, index) => ({
    player: `球员${index}`,
    ability: 2,
  }));
  const composition = (groups) => groups.map((group) => [...group].sort().join(",")).sort();
  for (const split of [
    () => groupBalancedPlayers(players, 3),
    () => groupPlayers(players.map(({ player }) => player), 3),
  ]) {
    random = seededRandom(1);
    const first = composition(split());
    random = seededRandom(2);
    assert.notDeepEqual(composition(split()), first);
  }
});

test("balanced grouping matches exhaustive optima for small three-level distributions", (t) => {
  t.mock.method(Math, "random", seededRandom(42));
  for (let count = 1; count <= 8; count++) {
    for (let ones = 0; ones <= count; ones++) {
      for (let twos = 0; twos <= count - ones; twos++) {
        const scores = [
          ...Array(ones).fill(1),
          ...Array(twos).fill(2),
          ...Array(count - ones - twos).fill(3),
        ];
        const players = scores.map((ability, index) => ({ player: String(index), ability }));
        for (let teams = 2; teams <= 4; teams++) {
          const groups = groupBalancedPlayers(players, teams);
          const capacities = Array.from({ length: teams }, (_, index) =>
            Math.floor(count / teams) + (index < count % teams ? 1 : 0),
          );
          assert.deepEqual(groups.map((group) => group.length), capacities);
          assert.equal(
            squaredTotals(groups, players),
            minimumSquaredTotals(scores, capacities),
            `scores=${scores}; teams=${teams}`,
          );
        }
      }
    }
  }
});

test("four-level distributions preserve players and have no improving single swap", (t) => {
  t.mock.method(Math, "random", seededRandom(42));
  for (let count = 1; count <= 8; count++) {
    for (let ones = 0; ones <= count; ones++) {
      for (let twos = 0; twos <= count - ones; twos++) {
        for (let threes = 0; threes <= count - ones - twos; threes++) {
          const scores = [
            ...Array(ones).fill(1),
            ...Array(twos).fill(2),
            ...Array(threes).fill(3),
            ...Array(count - ones - twos - threes).fill(4),
          ];
          const players = scores.map((ability, index) => ({ player: String(index), ability }));
          for (let teams = 2; teams <= 4; teams++) {
            const groups = groupBalancedPlayers(players, teams);
            const capacities = Array.from({ length: teams }, (_, index) =>
              Math.floor(count / teams) + (index < count % teams ? 1 : 0),
            );
            assert.deepEqual(groups.map((group) => group.length), capacities);
            assert.deepEqual(groups.flat().sort(), players.map(({ player }) => player).sort());
            const current = squaredTotals(groups, players);
            for (let left = 0; left < teams; left++) {
              for (let right = left + 1; right < teams; right++) {
                for (let i = 0; i < groups[left].length; i++) {
                  for (let j = 0; j < groups[right].length; j++) {
                    const alternative = groups.map((group) => [...group]);
                    [alternative[left][i], alternative[right][j]] =
                      [alternative[right][j], alternative[left][i]];
                    assert.ok(squaredTotals(alternative, players) >= current);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
});

test("attendance reserves full entries before name matching after reordering", () => {
  let state = syncAttendance(["小王（迟到）", "小王（早退）"], emptyAttendance());
  state = exclude(state, 0);
  const previous = state;
  state = syncAttendance(["小王（机动）", "小王（迟到）"], state);
  assert.deepEqual(state.entries.map((entry) => entry.included), [true, false]);
  assert.deepEqual(state.entries.map((entry) => entry.id), [previous.entries[1].id, previous.entries[0].id]);
  assert.equal(previous.entries[1].player, "小王（早退）");
  assert.equal(previous.history[1].player, "小王（早退）");
});

test("attendance retains exclusions through note edits and temporary removal", () => {
  let state = syncAttendance(["小王", "小李"], emptyAttendance());
  state = exclude(state, 0);
  const excludedId = state.entries[0].id;
  state = syncAttendance(["小李"], state);
  state = syncAttendance(["小李", "小王 迟到"], state);
  assert.equal(state.entries[1].id, excludedId);
  assert.equal(state.entries[1].included, false);
  assert.equal(state.history[0].player, "小王 迟到");
  state = syncAttendance([], state);
  state = syncAttendance(["小王 迟到"], state);
  assert.equal(state.entries[0].included, false);
});

test("identical duplicate names have separate stable identities and fresh sessions reset them", () => {
  let state = syncAttendance(["小王", "小王", "小李"], emptyAttendance());
  state = exclude(state, 1);
  assert.notEqual(state.entries[0].id, state.entries[1].id);
  state = syncAttendance(["小王", "小李", "小王"], state);
  assert.deepEqual(state.entries.map((entry) => entry.included), [true, true, false]);
  const unchanged = syncAttendance(["小王", "小李", "小王"], state);
  assert.equal(unchanged, state);
  const reset = syncAttendance(["小王", "小王"], emptyAttendance());
  assert.deepEqual(reset.entries.map((entry) => entry.included), [true, true]);
});

test("ability ratings follow identities through reordering, notes, and temporary removal", () => {
  let state = syncAttendance(["小王（迟到）", "小王（早退）", "小李"], emptyAttendance());
  assert.deepEqual(state.entries.map((entry) => entry.ability), [null, null, null]);
  state = rate(state, 0, 4);
  state = rate(state, 1, 1);
  const previous = state;
  state = syncAttendance(["小王（机动）", "小李", "小王（迟到）"], state);
  assert.deepEqual(state.entries.map((entry) => entry.ability), [1, null, 4]);
  assert.deepEqual(state.entries.map((entry) => entry.id), [
    previous.entries[1].id, previous.entries[2].id, previous.entries[0].id,
  ]);
  state = syncAttendance(["小李"], state);
  state = syncAttendance(["小李", "小王（迟到）"], state);
  assert.equal(state.entries[1].ability, 4);
  assert.equal(previous.entries[0].player, "小王（迟到）");
  const fresh = syncAttendance(["小王（迟到）"], emptyAttendance());
  assert.equal(fresh.entries[0].ability, null);
});
