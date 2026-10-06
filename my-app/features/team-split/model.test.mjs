import assert from "node:assert/strict";
import test from "node:test";
import {
  buildKits,
  detectColors,
  emptyAttendance,
  formatGroups,
  getGroupCount,
  groupPlayers,
  halfWidth,
  parseMatchLine,
  parsePlayerNotes,
  parsePlayers,
  syncAttendance,
  toLines,
} from "./model.ts";

function exclude(state, index) {
  const id = state.entries[index].id;
  const update = (entry) => entry.id === id ? { ...entry, included: false } : entry;
  return { entries: state.entries.map(update), history: state.history.map(update) };
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
  assert.equal(buildKits([], 12).at(-1).name, "L组");
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
  assert.equal(formatGroups([["甲", "乙（迟到）"], []], buildKits([], 2)), "白队（2人）\n1. 甲\n2. 乙（迟到）\n\n蓝队（0人）\n");
  assert.equal(parseMatchLine("说明\n# 接龙 周六 18:00\n1. 甲"), "周六 18:00");
  assert.equal(parseMatchLine("#其他场次\n1. 甲"), "#其他场次");
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
