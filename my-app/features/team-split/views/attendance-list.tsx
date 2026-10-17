import { useTranslations } from "next-intl";
import { DEFAULT_ABILITY } from "../model";
import type { AbilityRating, AttendanceEntry } from "../model";
import { focusRing, linkButton } from "../styles";

type AttendanceListProps = {
  entries: AttendanceEntry[];
  attendingCount: number;
  onToggle: (id: number, included: boolean) => void;
  onAbilityChange: (id: number, ability: AbilityRating) => void;
  onIncludeAll: () => void;
  memoryAvailable: boolean;
};

export function AttendanceList({
  entries,
  attendingCount,
  onToggle,
  onAbilityChange,
  onIncludeAll,
  memoryAvailable,
}: AttendanceListProps) {
  const t = useTranslations("Attendance");
  return (
    <details
      className="overflow-hidden rounded-[7px] border border-line bg-surface-2"
      id="attendance-panel"
      open
      hidden={entries.length === 0}
    >
      <summary
        className={`cursor-pointer px-3 py-2.5 text-[13px] font-medium ${focusRing}`}
      >
        {t("title")}
      </summary>
      <p
        className="m-0 px-3 pb-1.5 text-[12px] leading-[1.65] text-ink-2"
        id="attendance-help"
      >
        {t("help")}
      </p>
      <p
        className="m-0 px-3 pb-1.5 text-[12px] leading-[1.65] text-ink-2"
        id="ability-help"
      >
        {t("abilityHelp")}
      </p>
      <p
        className={`m-0 px-3 pb-2.5 text-[12px] leading-[1.65] ${memoryAvailable ? "text-ink-3" : "text-note"}`}
        id="ability-memory"
        role="status"
      >
        {memoryAvailable ? t("abilityMemory") : t("abilityMemoryUnavailable")}
      </p>
      <ol
        className="m-0 max-h-68 list-none overflow-y-auto overscroll-contain border-t border-line-soft p-0"
        id="attendance-list"
        aria-label={t("listLabel")}
      >
        {entries.map((entry, index) => (
          <li
            className={`flex items-center gap-2 border-t border-line-soft px-3 py-1 first:border-t-0 ${entry.included ? "hover:bg-accent-soft" : "bg-note-soft"}`}
            key={entry.id}
          >
            <label
              className="flex min-h-11.5 min-w-0 flex-1 cursor-pointer items-center gap-2.25 py-1.25"
            >
              <input
                className={`m-0 h-4.5 w-4.5 flex-none accent-accent ${focusRing}`}
                type="checkbox"
                checked={entry.included}
                data-index={index}
                aria-label={t("playerLabel", {
                  number: index + 1,
                  player: entry.player,
                })}
                aria-describedby="attendance-help"
                onChange={(event) => onToggle(entry.id, event.target.checked)}
              />
              <span
                className="min-w-4.25 flex-none text-[12px] text-ink-3 tabular-nums"
                aria-hidden="true"
              >
                {index + 1}
              </span>
              <span className="min-w-0 text-[13px] wrap-anywhere">
                <span className="block">{entry.player}</span>
                <span
                  className={`block text-[11px] ${entry.included ? "text-ink-3" : "text-note"}`}
                  aria-hidden="true"
                >
                  {entry.included ? t("included") : t("excluded")}
                </span>
              </span>
            </label>
            <select
              className={`min-h-11 w-28 max-w-[45%] flex-none cursor-pointer rounded-md border border-line bg-surface px-2 py-1.5 text-[13px] text-ink mobile:text-[16px] ${focusRing}`}
              id={`ability-${entry.id}`}
              value={entry.ability ?? DEFAULT_ABILITY}
              aria-label={t("abilityLabel", {
                number: index + 1,
                player: entry.player,
              })}
              aria-describedby="ability-help ability-memory"
              onChange={(event) => {
                const ability = Number(event.target.value);
                onAbilityChange(
                  entry.id,
                  ability === 1 || ability === 2 || ability === 3 || ability === 4
                    ? ability
                    : DEFAULT_ABILITY,
                );
              }}
            >
              <option value="4">{t("abilityLegend")}</option>
              <option value="3">{t("abilityStrong")}</option>
              <option value="2">{t("abilityRegular")}</option>
              <option value="1">{t("abilityBeginner")}</option>
            </select>
          </li>
        ))}
      </ol>
      <div className="border-t border-line-soft px-3 py-0.75">
        <button
          type="button"
          className={linkButton}
          id="include-all-btn"
          disabled={attendingCount === entries.length}
          onClick={onIncludeAll}
        >
          {t("includeAll")}
        </button>
      </div>
    </details>
  );
}
