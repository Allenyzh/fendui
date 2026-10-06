import type { AttendanceEntry } from "../model";
import { focusRing, linkButton } from "../styles";

type AttendanceListProps = {
  entries: AttendanceEntry[];
  attendingCount: number;
  onToggle: (id: number, included: boolean) => void;
  onIncludeAll: () => void;
};

export function AttendanceList({
  entries,
  attendingCount,
  onToggle,
  onIncludeAll,
}: AttendanceListProps) {
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
        调整出场名单
      </summary>
      <p
        className="m-0 px-3 pb-2.5 text-[12px] text-ink-2"
        id="attendance-help"
      >
        默认全部参加。取消勾选可标记本场不参加，再次勾选即可恢复。
      </p>
      <ol
        className="m-0 max-h-68 list-none overflow-y-auto overscroll-contain border-t border-line-soft p-0"
        id="attendance-list"
        aria-label="出场名单"
      >
        {entries.map((entry, index) => (
          <li
            className="border-t border-line-soft first:border-t-0"
            key={entry.id}
          >
            <label
              className={`flex min-h-11.5 cursor-pointer items-center gap-2.25 px-3 py-2.25 ${entry.included ? "hover:bg-accent-soft" : "bg-note-soft"}`}
            >
              <input
                className={`m-0 h-4.5 w-4.5 flex-none accent-accent ${focusRing}`}
                type="checkbox"
                checked={entry.included}
                data-index={index}
                aria-label={`${index + 1}. ${entry.player}，参与分队`}
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
                {entry.player}
              </span>
              <span
                className={`ml-auto flex-none text-[11px] whitespace-nowrap ${entry.included ? "text-ink-3" : "text-note"}`}
                aria-hidden="true"
              >
                {entry.included ? "参加" : "本场不参加"}
              </span>
            </label>
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
          全部参加
        </button>
      </div>
    </details>
  );
}
