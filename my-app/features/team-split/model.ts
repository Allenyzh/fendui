export type Kit = {
  key?: string;
  name: string;
  color: string;
  words?: string[];
};

export type GroupMode = "auto" | "2" | "3" | "4";

export type AttendanceEntry = {
  id: number;
  player: string;
  included: boolean;
};

export type AttendanceState = {
  entries: AttendanceEntry[];
  history: AttendanceEntry[];
};

const COLORS = [
  { key: "white", name: "白队", color: "var(--kit-white)", words: ["白"] },
  { key: "blue", name: "蓝队", color: "var(--kit-blue)", words: ["蓝"] },
  { key: "red", name: "红队", color: "var(--kit-red)", words: ["红"] },
  { key: "black", name: "黑队", color: "var(--kit-black)", words: ["黑"] },
  { key: "yellow", name: "黄队", color: "var(--kit-yellow)", words: ["黄"] },
  { key: "green", name: "绿队", color: "var(--kit-green)", words: ["绿"] },
  { key: "orange", name: "橙队", color: "var(--kit-orange)", words: ["橙"] },
  { key: "purple", name: "紫队", color: "var(--kit-purple)", words: ["紫"] },
  { key: "gray", name: "灰队", color: "var(--kit-gray)", words: ["灰"] },
  { key: "pink", name: "粉队", color: "var(--kit-pink)", words: ["粉"] },
  { key: "cyan", name: "青队", color: "var(--kit-cyan)", words: ["青"] },
];

const FALLBACK_KEYS = ["white", "blue", "red", "black"];
const MAX_GROUPS = 6;
const NOTE_RE =
  /^(.*?)[\s　]+(迟到|早退|半残|替补|机动|待定|请假|可能|带球|带水)$/;
const ROSTER_RE = /^(\d{1,3})\s*(?:[.、．,，:：)）。]|\s)\s*(\S.*)$/;
const HEADER_RE = /^#|接龙|报名|截止|上衣|请准备/;

export function parsePlayerNotes(player: string) {
  const notes: string[] = [];
  let name = player
    .replace(/[（(]([^()（）]*)[）)]/g, (whole, content: string) => {
      const note = content.trim();
      if (!note) return whole;
      notes.push(note);
      return "";
    })
    .trim();

  const match = name.match(NOTE_RE);
  if (match) {
    name = match[1].trim();
    notes.push(match[2]);
  }

  return { name, notes };
}

export function toLines(text: string) {
  return text
    .split(/\r\n|[\n\r\u2028\u2029]/)
    .map((line) => line.replace(/[\u200B-\u200F\u2060\uFEFF]/g, "").trim());
}

export function halfWidth(text: string) {
  return text.replace(/[０-９]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) - 0xfee0),
  );
}

export function parsePlayers(text: string) {
  const lines = toLines(text).filter(Boolean);
  const numbered = lines
    .map((line) => halfWidth(line).match(ROSTER_RE))
    .filter((match): match is RegExpMatchArray => match !== null)
    .map((match) => match[2].trim());

  if (numbered.length) return numbered;

  const plain = lines.filter((line) => !HEADER_RE.test(line));
  return plain.length >= 2 ? plain : [];
}

export function shuffle<T>(array: T[]) {
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const randomIndex = Math.floor(Math.random() * (i + 1));
    [result[i], result[randomIndex]] = [result[randomIndex], result[i]];
  }
  return result;
}

export function groupPlayers(players: string[], groupCount: number) {
  if (groupCount <= 0) throw new Error("groupCount 必须大于 0");

  const shuffledPlayers = shuffle(players);
  const groups: string[][] = Array.from({ length: groupCount }, () => []);
  shuffledPlayers.forEach((player, index) => {
    groups[index % groupCount].push(player);
  });
  return groups;
}

export function formatGroups(groups: string[][], kits: Kit[]) {
  return groups
    .map((group, groupIndex) => {
      const groupName = kits[groupIndex].name;
      const players = group
        .map((player, playerIndex) => `${playerIndex + 1}. ${player}`)
        .join("\n");
      return `${groupName}（${group.length}人）\n${players}`;
    })
    .join("\n\n");
}

export function detectColors(text: string): Kit[] {
  const players = parsePlayers(text);
  const notice = toLines(text)
    .filter(
      (line) =>
        line && players.indexOf(line) < 0 && !ROSTER_RE.test(halfWidth(line)),
    )
    .join("\n");
  const hits: { color: Kit; at: number }[] = [];

  COLORS.forEach((color) => {
    const at = color.words
      .map((word) => notice.indexOf(word))
      .filter((index) => index >= 0);
    if (at.length) hits.push({ color, at: Math.min(...at) });
  });

  return hits
    .sort((a, b) => a.at - b.at)
    .map((hit) => hit.color)
    .slice(0, MAX_GROUPS);
}

export function buildKits(detected: Kit[], groupCount: number) {
  const kits = detected.slice(0, groupCount);
  const used = new Set(kits.map((kit) => kit.key));

  FALLBACK_KEYS.concat(COLORS.map((color) => color.key)).forEach((key) => {
    if (kits.length >= groupCount || used.has(key)) return;
    used.add(key);
    kits.push(COLORS.find((color) => color.key === key)!);
  });

  while (kits.length < groupCount) {
    kits.push({
      name: `${String.fromCharCode(65 + kits.length)}组`,
      color: "var(--ink-3)",
    });
  }
  return kits;
}

export function parseMatchLine(text: string) {
  const line = toLines(text).find((value) => value.trim().startsWith("#"));
  return line ? line.trim().replace(/^#\s*接龙\s*/, "") : "";
}

export function getGroupCount(detected: Kit[], mode: GroupMode) {
  if (mode !== "auto") return Number(mode);
  return detected.length >= 2 ? detected.length : 2;
}

export function emptyAttendance(): AttendanceState {
  return { entries: [], history: [] };
}

// Reserve exact entries before matching names, so reordered namesakes retain their selections.
export function syncAttendance(
  players: string[],
  state: AttendanceState,
): AttendanceState {
  if (
    players.length === state.entries.length &&
    players.every((player, index) => player === state.entries[index].player)
  ) {
    return state;
  }

  const current = new Set(state.entries.map((entry) => entry.id));
  const candidates = state.entries.concat(
    state.history.filter((entry) => !current.has(entry.id)),
  );
  const used = new Set<number>();
  const next = players.map((player) => {
    const entry = candidates.find(
      (candidate) => !used.has(candidate.id) && candidate.player === player,
    );
    if (entry) used.add(entry.id);
    return entry;
  });
  let nextId =
    state.history.reduce((max, entry) => Math.max(max, entry.id), 0) + 1;
  const updates = new Map<number, AttendanceEntry>();
  const added: AttendanceEntry[] = [];

  const entries = players.map((player, index) => {
    let entry = next[index];
    if (!entry) {
      const name = parsePlayerNotes(player).name || player;
      entry = candidates.find(
        (candidate) =>
          !used.has(candidate.id) &&
          (parsePlayerNotes(candidate.player).name || candidate.player) ===
            name,
      );
      if (entry) used.add(entry.id);
    }
    if (!entry) {
      entry = { id: nextId++, player, included: true };
      added.push(entry);
    }
    const updated = { ...entry, player };
    updates.set(updated.id, updated);
    return updated;
  });

  const history = state.history
    .map((entry) => updates.get(entry.id) ?? entry)
    .concat(added.map((entry) => updates.get(entry.id)!));
  return { entries, history };
}
