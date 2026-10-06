import type { TeamSplitController } from "../controller";
import type { GroupMode } from "../model";
import { AttendanceList } from "./attendance-list";
import { FeedbackButton } from "./feedback-button";
import {
  focusRing,
  kitBackground,
  linkButton,
  pasteButton,
  primaryButton,
} from "../styles";

const fieldLabel =
  "flex items-baseline justify-between gap-3 text-[12px] font-medium tracking-[.12em] text-ink-3";

const GROUP_MODES: { value: GroupMode; label: string }[] = [
  { value: "auto", label: "按颜色" },
  { value: "2", label: "2 队" },
  { value: "3", label: "3 队" },
  { value: "4", label: "4 队" },
];

export function RosterPanel({
  controller,
}: {
  controller: TeamSplitController;
}) {
  const {
    roster,
    attendance,
    attendingCount,
    pasteFeedback,
    paste,
    inputRef,
    changeRoster,
    markPaste,
    pasteHint,
    clear,
    toggleAttendance,
    includeAll,
    mode,
    changeMode,
    detected,
    groupCount,
    groups,
    needsResplit,
    split,
  } = controller;
  const hasGroups = groups.length > 0;

  return (
    <section className="flex flex-col gap-3.5 rounded-[10px] border border-line bg-surface p-4.5 shadow-panel mobile:gap-3 mobile:p-3.75">
      <div className={fieldLabel}>
        <label htmlFor="roster-input">接龙原文</label>
        <span
          id="paste-status"
          role="status"
          aria-live="polite"
          className="sr-only"
        >
          {pasteFeedback.message}
        </span>
        <FeedbackButton
          id="paste-btn"
          className={pasteButton}
          idle="粘贴"
          done="已粘贴"
          fail="粘贴失败"
          feedback={pasteFeedback}
          onClick={paste}
        />
      </div>

      <textarea
        id="roster-input"
        className={`w-full min-h-75 resize-y rounded-[7px] border border-line bg-surface-2 px-3.25 py-3 font-sans text-[13.5px] leading-[1.75] text-ink tab-2 placeholder:text-ink-3 placeholder:leading-[1.8] data-[nudge=true]:border-note data-[nudge=true]:animate-fx-shake mobile:min-h-47.5 mobile:text-[16px] mobile:leading-[1.7] ${focusRing}`}
        ref={inputRef}
        spellCheck={false}
        autoCapitalize="off"
        autoCorrect="off"
        placeholder={
          "在微信里长按那条接龙消息 → 复制整条，\n然后原封不动地粘贴到这里，不用删改、也不用只挑名字。\n\n也可以直接点右上角的「粘贴」。"
        }
        value={roster}
        onInput={(event) => changeRoster(event.currentTarget.value)}
        onPaste={markPaste}
      />

      <p
        className="-mt-1.5 text-[12.5px] leading-[1.65] text-note"
        id="paste-hint"
        hidden={!pasteHint}
      >
        {pasteHint}
      </p>

      <div className="-mt-1.5 flex items-center justify-between gap-3 text-[13px] text-ink-2">
        <div
          className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 [&_span]:whitespace-nowrap [&_strong]:mx-0.5 [&_strong]:font-condensed [&_strong]:text-[20px] [&_strong]:font-bold [&_strong]:text-ink [&_strong]:tabular-nums"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span>
            报名<strong id="player-count">{attendance.length}</strong>人
          </span>
          <span>
            参与分队<strong id="attending-count">{attendingCount}</strong>人
          </span>
          <span>
            不参加
            <strong id="excluded-count">
              {attendance.length - attendingCount}
            </strong>
            人
          </span>
        </div>
        <button
          type="button"
          className={`flex-none ${linkButton}`}
          id="clear-btn"
          disabled={roster.length === 0}
          onClick={clear}
        >
          清空
        </button>
      </div>

      <AttendanceList
        entries={attendance}
        attendingCount={attendingCount}
        onToggle={toggleAttendance}
        onIncludeAll={includeAll}
      />

      <div className="h-px bg-line-soft" />

      <div className={fieldLabel}>
        <span>分成几队</span>
      </div>
      <div className="flex gap-1.5 mobile:gap-2" id="group-seg">
        {GROUP_MODES.map(({ value, label }) => (
          <label key={value} className="mobile:flex-[1_1_0]">
            <input
              type="radio"
              className="peer absolute size-px opacity-0"
              name="groups"
              id={`groups-${value}`}
              value={value}
              checked={mode === value}
              onChange={() => changeMode(value)}
            />
            <span className="block min-w-13.5 cursor-pointer touch-manipulation select-none rounded-md border border-line bg-surface-2 py-1.75 text-center font-display text-[16px] font-semibold tracking-[.04em] text-ink-2 [-webkit-tap-highlight-color:transparent] hover:border-ink-3 active:bg-accent-soft peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent peer-focus-visible:outline-2 peer-focus-visible:outline-solid peer-focus-visible:outline-accent peer-focus-visible:outline-offset-2 mobile:min-w-0 mobile:py-2.75">
              {label}
            </span>
          </label>
        ))}
      </div>

      <p
        className="-mt-1 flex flex-wrap items-center gap-1.5 text-[12.5px] text-ink-2"
        id="detected"
      >
        {!roster.trim() ? (
          <span className="text-ink-3">
            粘贴接龙后，自动按里面写的队服颜色分队
          </span>
        ) : !detected.length ? (
          <span className="text-ink-3">接龙里没写队服颜色，按白 / 蓝分</span>
        ) : (
          <>
            <span className="text-ink-3">接龙里写了</span>
            {detected.map((kit) => (
              <span
                className="inline-flex items-center gap-1.25 rounded-full border border-line bg-surface-2 py-0.5 pr-2.25 pl-1.75"
                key={kit.key}
              >
                <span
                  className={`size-2.5 flex-none rounded-full border border-[rgba(128,128,128,.45)] ${kitBackground(kit)}`}
                />
                {kit.name.replace("队", "")}
              </span>
            ))}
            <span className="text-ink-3">→ 分 {groupCount} 队</span>
          </>
        )}
      </p>

      <button
        type="button"
        className={`${primaryButton} data-[repeat=true]:bg-[#FCE3C5] data-[repeat=true]:text-[#8A481C]`}
        data-repeat={hasGroups || undefined}
        id="split-btn"
        disabled={attendance.length > 0 && attendingCount === 0}
        onClick={split}
      >
        {hasGroups ? "再次随机分队" : needsResplit ? "重新分队" : "随机分队"}
      </button>
    </section>
  );
}
