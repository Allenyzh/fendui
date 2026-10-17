import {
  parsePlayerNotes,
  type AbilityLevel,
  type AbilityRating,
  type AttendanceEntry,
  type AttendanceState,
} from "./model";

export type AbilityMemory = Map<string, AbilityLevel>;

const STORAGE_KEY = "team-split:abilities:v1";

function playerName(player: string) {
  return (parsePlayerNotes(player).name || player).trim();
}

function nameCounts(entries: AttendanceEntry[]) {
  const counts = new Map<string, number>();
  for (const entry of entries) {
    const name = playerName(entry.player);
    counts.set(name, (counts.get(name) ?? 0) + 1);
  }
  return counts;
}

export function restoreAbilities(
  state: AttendanceState,
  memory: AbilityMemory,
): AttendanceState {
  const counts = nameCounts(state.entries);
  const updates = new Map<number, AttendanceEntry>();
  const entries = state.entries.map((entry) => {
    const name = playerName(entry.player);
    const ability = memory.get(name);
    if (entry.ability !== null || counts.get(name) !== 1 || ability === undefined) {
      return entry;
    }
    const updated = { ...entry, ability };
    updates.set(entry.id, updated);
    return updated;
  });
  if (!updates.size) return state;
  return {
    entries,
    history: state.history.map((entry) => updates.get(entry.id) ?? entry),
  };
}

export function rememberAbility(
  memory: AbilityMemory,
  entries: AttendanceEntry[],
  id: number,
  ability: AbilityRating,
): AbilityMemory {
  const next = new Map(memory);
  const entry = entries.find((entry) => entry.id === id);
  if (!entry) return next;
  const name = playerName(entry.player);
  if (!name) return next;
  // An explicit edit makes an old shared-name rating unsafe to restore later.
  if (ability === null || nameCounts(entries).get(name) !== 1) next.delete(name);
  else next.set(name, ability);
  return next;
}

function parseMemory(serialized: string | null): AbilityMemory {
  const memory: AbilityMemory = new Map();
  if (!serialized) return memory;
  try {
    const value: unknown = JSON.parse(serialized);
    if (!value || typeof value !== "object" || !("version" in value) || value.version !== 1) {
      return memory;
    }
    if (!("ratings" in value) || !Array.isArray(value.ratings)) return memory;
    for (const rating of value.ratings) {
      if (!Array.isArray(rating) || rating.length !== 2) continue;
      const [name, ability] = rating;
      if (typeof name !== "string" || !name.trim()) continue;
      if (ability !== 1 && ability !== 2 && ability !== 3 && ability !== 4) continue;
      memory.set(name.trim(), ability);
    }
  } catch {
    // A damaged or outdated saved value must not interrupt roster entry.
  }
  return memory;
}

export function readAbilityMemory(): { memory: AbilityMemory; available: boolean } {
  if (typeof window === "undefined") return { memory: new Map(), available: false };
  try {
    return {
      memory: parseMemory(window.localStorage.getItem(STORAGE_KEY)),
      available: true,
    };
  } catch {
    return { memory: new Map(), available: false };
  }
}

export function writeAbilityMemory(memory: AbilityMemory): boolean {
  if (typeof window === "undefined") return false;
  try {
    window.localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ version: 1, ratings: [...memory] }),
    );
    return true;
  } catch {
    return false;
  }
}
