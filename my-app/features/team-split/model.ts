export type ColorKey =
  | "white" | "blue" | "red" | "black" | "yellow" | "green"
  | "orange" | "purple" | "gray" | "pink" | "cyan";

type ColorKit = {
  key: ColorKey;
  color: string;
  words: string[];
};

export type Kit = ColorKit | { key: "custom"; letter: string; color: string };

export type GroupMode = "auto" | "2" | "3" | "4";
export type AbilityLevel = 1 | 2 | 3 | 4;
export type AbilityRating = AbilityLevel | null;
export type SplitStrategy = "random" | "balanced";
export const DEFAULT_ABILITY: AbilityLevel = 2;

export type AttendanceEntry = {
  id: number;
  player: string;
  included: boolean;
  ability: AbilityRating;
};

export type AttendanceState = {
  entries: AttendanceEntry[];
  history: AttendanceEntry[];
};

const COLORS: ColorKit[] = [
  { key: "white", color: "var(--kit-white)", words: ["白"] },
  { key: "blue", color: "var(--kit-blue)", words: ["蓝"] },
  { key: "red", color: "var(--kit-red)", words: ["红"] },
  { key: "black", color: "var(--kit-black)", words: ["黑"] },
  { key: "yellow", color: "var(--kit-yellow)", words: ["黄"] },
  { key: "green", color: "var(--kit-green)", words: ["绿"] },
  { key: "orange", color: "var(--kit-orange)", words: ["橙"] },
  { key: "purple", color: "var(--kit-purple)", words: ["紫"] },
  { key: "gray", color: "var(--kit-gray)", words: ["灰"] },
  { key: "pink", color: "var(--kit-pink)", words: ["粉"] },
  { key: "cyan", color: "var(--kit-cyan)", words: ["青"] },
];

const FALLBACK_KEYS: ColorKey[] = ["white", "blue", "red", "black"];
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

export function groupPlayers<T>(players: T[], groupCount: number): T[][] {
  if (groupCount <= 0) throw new Error("groupCount 必须大于 0");

  const shuffledPlayers = shuffle(players);
  const groups: T[][] = Array.from({ length: groupCount }, () => []);
  shuffledPlayers.forEach((player, index) => {
    groups[index % groupCount].push(player);
  });
  return groups;
}

function groupBalancedEntries<T extends Pick<AttendanceEntry, "player" | "ability">>(
  players: T[],
  groupCount: number,
): T[][] {
  if (groupCount <= 0) throw new Error("groupCount 必须大于 0");

  const rankedPlayers = shuffle(
    players.map((entry) => ({ entry, score: entry.ability ?? DEFAULT_ABILITY })),
  ).sort((a, b) => b.score - a.score);
  const groups: typeof rankedPlayers[] = Array.from(
    { length: groupCount },
    () => [],
  );
  const totals = groups.map(() => 0);
  const capacities = groups.map((_, index) =>
    Math.floor(players.length / groupCount) +
    (index < players.length % groupCount ? 1 : 0),
  );

  for (const player of rankedPlayers) {
    let lowestTotal = Infinity;
    let candidates: number[] = [];
    groups.forEach((group, index) => {
      if (group.length === capacities[index]) return;
      if (totals[index] < lowestTotal) {
        lowestTotal = totals[index];
        candidates = [index];
      } else if (totals[index] === lowestTotal) {
        candidates.push(index);
      }
    });
    const target = candidates[Math.floor(Math.random() * candidates.length)];
    groups[target].push(player);
    totals[target] += player.score;
  }

  // Swaps preserve team sizes. With a fixed total, reducing the sum of squares
  // also reduces the squared distance from the shared target team score.
  while (true) {
    let bestImprovement = 0;
    let bestSwap: [number, number, number, number] | undefined;
    let tiedSwaps = 0;
    for (let left = 0; left < groups.length; left++) {
      for (let right = left + 1; right < groups.length; right++) {
        groups[left].forEach((leftPlayer, leftIndex) => {
          groups[right].forEach((rightPlayer, rightIndex) => {
            const difference = rightPlayer.score - leftPlayer.score;
            const nextLeft = totals[left] + difference;
            const nextRight = totals[right] - difference;
            const improvement = totals[left] ** 2 + totals[right] ** 2 -
              nextLeft ** 2 - nextRight ** 2;
            if (improvement > bestImprovement) {
              bestImprovement = improvement;
              bestSwap = [left, right, leftIndex, rightIndex];
              tiedSwaps = 1;
            } else if (improvement > 0 && improvement === bestImprovement) {
              tiedSwaps++;
              if (Math.random() < 1 / tiedSwaps) {
                bestSwap = [left, right, leftIndex, rightIndex];
              }
            }
          });
        });
      }
    }
    if (!bestSwap) break;
    const [left, right, leftIndex, rightIndex] = bestSwap;
    const difference = groups[right][rightIndex].score - groups[left][leftIndex].score;
    [groups[left][leftIndex], groups[right][rightIndex]] =
      [groups[right][rightIndex], groups[left][leftIndex]];
    totals[left] += difference;
    totals[right] -= difference;
  }

  return groups.map((group) => group.map(({ entry }) => entry));
}

export function groupBalancedPlayers(
  players: Pick<AttendanceEntry, "player" | "ability">[],
  groupCount: number,
): string[][] {
  return groupBalancedEntries(players, groupCount)
    .map((group) => group.map(({ player }) => player));
}

export function splitTeams(
  players: AttendanceEntry[],
  groupCount: number,
  strategy: SplitStrategy,
): { groups: string[][]; scores: number[] } {
  const teams = strategy === "balanced"
    ? groupBalancedEntries(players, groupCount)
    : groupPlayers(players, groupCount);
  return {
    groups: teams.map((group) => group.map(({ player }) => player)),
    scores: teams.map((group) => group.reduce(
      (total, { ability }) => total + (ability ?? DEFAULT_ABILITY),
      0,
    )),
  };
}

export function formatGroups(
  groups: string[][],
  kits: Kit[],
  formatHeading: (kit: Kit, count: number) => string,
) {
  return groups
    .map((group, groupIndex) => {
      const heading = formatHeading(kits[groupIndex], group.length);
      const players = group
        .map((player, playerIndex) => `${playerIndex + 1}. ${player}`)
        .join("\n");
      return `${heading}\n${players}`;
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
      key: "custom",
      letter: String.fromCharCode(65 + kits.length),
      color: "var(--ink-3)",
    });
  }
  return kits;
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
      entry = { id: nextId++, player, included: true, ability: null };
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
