import { useTranslations } from "next-intl";
import type { TeamSplitController } from "../controller";
import { parsePlayerNotes, toLines } from "../model";
import { getKitTeamLabel } from "../presentation";
import { ghostButton, kitBackground } from "../styles";
import { FeedbackButton } from "./feedback-button";

const emptyResult =
  "rounded-[10px] border border-dashed border-line bg-surface-2 px-5 py-7 text-[14px] text-ink-2";
const inlineCode =
  "rounded-sm border border-line bg-surface px-1.5 py-px font-code text-[15px] wrap-anywhere";

function EmptyResult({ controller }: { controller: TeamSplitController }) {
  const t = useTranslations("Results");
  const { roster, attendance, attendingCount, needsResplit } = controller;
  if (!roster.trim()) {
    return (
      <div className={emptyResult}>
        {t.rich("emptyRoster", {
          code: (chunks) => <code className={inlineCode}>{chunks}</code>,
        })}
      </div>
    );
  }

  if (attendance.length) {
    return (
      <div className={emptyResult} role="status">
        {!attendingCount
          ? t("noAttendees")
          : needsResplit
            ? t("rosterChanged")
            : t("readyToSplit")}
      </div>
    );
  }

  const lines = toLines(roster).filter(Boolean);
  const sample = lines.length > 1 ? lines[1] : lines[0] || "";

  return (
    <div className={emptyResult}>
      {t.rich("unrecognized", {
        sample: sample.slice(0, 40) || t("emptyLine"),
        code: (chunks) => <code className={inlineCode}>{chunks}</code>,
      })}
    </div>
  );
}

export function TeamResults({
  controller,
}: {
  controller: TeamSplitController;
}) {
  const t = useTranslations("Results");
  const tKits = useTranslations("Kits");
  const { resultsRef, copyFeedback, groups, copy, kits, rawRef, rawResult } =
    controller;
  return (
    <section id="results" ref={resultsRef}>
      <div className="mb-3.5 flex min-h-8.5 flex-wrap items-center justify-between gap-3 mobile:mb-3">
        <h2 className="m-0 font-display text-[22px] font-semibold tracking-[.08em]">
          {t("title")}
        </h2>
        <div className="min-w-0 flex flex-wrap items-center justify-end gap-3">
          <span
            id="copy-status"
            role="status"
            aria-live="polite"
            className={
              copyFeedback.show
                ? "static h-auto w-auto overflow-visible text-right text-[12.5px] whitespace-normal text-note"
                : "sr-only"
            }
          >
            {copyFeedback.message}
          </span>
          <FeedbackButton
            id="copy-btn"
            className={ghostButton}
            idle={t("copy")}
            done={t("copyDone")}
            fail={t("copyFail")}
            feedback={copyFeedback}
            disabled={!groups.length}
            onClick={copy}
          />
        </div>
      </div>
      <div
        id="teams"
        className="grid grid-cols-[repeat(auto-fit,minmax(190px,1fr))] items-start gap-4 compact:grid-cols-[repeat(auto-fit,minmax(146px,1fr))] compact:gap-2.5"
      >
        {!groups.length ? (
          <EmptyResult controller={controller} />
        ) : (
          groups.map((group, index) => {
            const kit = kits[index];

            return (
              <div
                className="overflow-hidden rounded-[10px] border border-line bg-surface shadow-panel"
                key={index}
              >
                <div className="flex flex-wrap items-center gap-2.25 border-b border-line-soft bg-surface-2 px-3.5 py-2.75 compact:gap-1.75 compact:px-2.75 compact:py-2.25">
                  <span
                    className={`h-3.5 w-3.5 flex-none rounded-full border border-[rgba(128,128,128,.45)] ${kitBackground(kit)}`}
                  />
                  <span className="min-w-0 flex-1 font-display text-[18px] font-semibold tracking-[.06em] wrap-anywhere compact:text-[16px]">
                    {getKitTeamLabel(kit, tKits)}
                  </span>
                  <span className="ml-auto text-[12px] text-ink-3 tabular-nums compact:text-[11px]">
                    {t("playerCount", { count: group.length })}
                  </span>
                </div>
                <ol className="m-0 list-none px-3.5 pt-1.5 pb-3.5 [counter-reset:player] compact:px-2.75 compact:pt-1 compact:pb-2.75">
                  {group.map((player, playerIndex) => {
                    const parsed = parsePlayerNotes(player);

                    return (
                      <li
                        className="flex flex-wrap items-baseline gap-x-2.25 gap-y-1 border-b border-dashed border-line-soft py-1 [counter-increment:player] before:min-w-3.75 before:flex-none before:text-right before:font-condensed before:text-[14px] before:font-semibold before:text-ink-3 before:tabular-nums before:content-[counter(player)] last:border-b-0 compact:gap-x-1.75 compact:gap-y-0.75 compact:py-1.25 compact:text-[14px]"
                        key={playerIndex}
                      >
                        <span className="min-w-0 max-w-full wrap-anywhere">{parsed.name}</span>
                        {parsed.notes.map((note, noteIndex) => (
                          <span
                            className="max-w-full flex-none rounded-full bg-note-soft px-1.5 py-px text-[11px] text-note wrap-anywhere compact:text-[10px]"
                            key={noteIndex}
                          >
                            {note}
                          </span>
                        ))}
                      </li>
                    );
                  })}
                </ol>
              </div>
            );
          })
        )}
      </div>
      <pre
        className="m-0 mt-4 rounded-lg border border-note bg-surface px-3.5 py-3 font-sans text-[13px] leading-[1.7] whitespace-pre-wrap text-ink wrap-anywhere select-text [-webkit-user-select:text]"
        id="raw-result"
        ref={rawRef}
        hidden={!rawResult}
      >
        {rawResult}
      </pre>
    </section>
  );
}
