import { useTranslations } from "next-intl";
import type { TeamSplitController } from "../controller";
import type { GroupMode } from "../model";
import { getKitColorLabel } from "../presentation";
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
  "flex flex-wrap items-baseline justify-between gap-3 text-[12px] font-medium tracking-[.12em] text-ink-3";

const GROUP_MODES: GroupMode[] = ["auto", "2", "3", "4"];

export function RosterPanel({
  controller,
}: {
  controller: TeamSplitController;
}) {
  const t = useTranslations("Roster");
  const tFeedback = useTranslations("Feedback");
  const tKits = useTranslations("Kits");
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
        <label htmlFor="roster-input">{t("label")}</label>
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
          idle={tFeedback("paste")}
          done={tFeedback("pasteDone")}
          fail={tFeedback("pasteFail")}
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
        placeholder={t("placeholder")}
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
          className="min-w-0 flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5 [&_strong]:mx-0.5 [&_strong]:font-condensed [&_strong]:text-[20px] [&_strong]:font-bold [&_strong]:text-ink [&_strong]:tabular-nums"
          role="status"
          aria-live="polite"
          aria-atomic="true"
        >
          <span>
            {t.rich("registeredCount", {
              count: attendance.length,
              strong: (chunks) => <strong id="player-count">{chunks}</strong>,
            })}
          </span>
          <span>
            {t.rich("attendingCount", {
              count: attendingCount,
              strong: (chunks) => <strong id="attending-count">{chunks}</strong>,
            })}
          </span>
          <span>
            {t.rich("excludedCount", {
              count: attendance.length - attendingCount,
              strong: (chunks) => <strong id="excluded-count">{chunks}</strong>,
            })}
          </span>
        </div>
        <button
          type="button"
          className={`flex-none ${linkButton}`}
          id="clear-btn"
          disabled={roster.length === 0}
          onClick={clear}
        >
          {t("clear")}
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
        <span>{t("groupLabel")}</span>
      </div>
      <div className="grid grid-cols-4 gap-1.5 mobile:gap-2" id="group-seg">
        {GROUP_MODES.map((value) => (
          <label key={value} className="min-w-0">
            <input
              type="radio"
              className="peer absolute size-px opacity-0"
              name="groups"
              id={`groups-${value}`}
              value={value}
              checked={mode === value}
              onChange={() => changeMode(value)}
            />
            <span className="flex h-full min-h-11 items-center justify-center rounded-md border border-line bg-surface-2 px-1.5 py-1.75 text-center font-display text-[16px] leading-tight font-semibold tracking-[.04em] text-ink-2 wrap-anywhere cursor-pointer touch-manipulation select-none [-webkit-tap-highlight-color:transparent] hover:border-ink-3 active:bg-accent-soft peer-checked:border-accent peer-checked:bg-accent-soft peer-checked:text-accent peer-focus-visible:outline-2 peer-focus-visible:outline-solid peer-focus-visible:outline-accent peer-focus-visible:outline-offset-2 mobile:py-2.75 compact:text-[14px]">
              {value === "auto"
                ? t("automaticGroups")
                : t("teamCount", { count: Number(value) })}
            </span>
          </label>
        ))}
      </div>

      <p
        className="-mt-1 flex flex-wrap items-center gap-1.5 text-[12.5px] text-ink-2"
        id="detected"
      >
        {!roster.trim() ? (
          <span className="text-ink-3">{t("detectPrompt")}</span>
        ) : !detected.length ? (
          <span className="text-ink-3">{t("defaultColors")}</span>
        ) : (
          t.rich("detectedColors", {
            count: groupCount,
            colors: () =>
              detected.map((kit) => (
                <span
                  className="inline-flex items-center gap-1.25 rounded-full border border-line bg-surface-2 py-0.5 pr-2.25 pl-1.75"
                  key={kit.key}
                >
                  <span
                    className={`size-2.5 flex-none rounded-full border border-[rgba(128,128,128,.45)] ${kitBackground(kit)}`}
                  />
                  {getKitColorLabel(kit, tKits)}
                </span>
              )),
          })
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
        {hasGroups
          ? t("splitAgain")
          : needsResplit
            ? t("resplit")
            : t("split")}
      </button>
    </section>
  );
}
