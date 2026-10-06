import type { TeamSplitController } from "../controller";
import { parsePlayerNotes, toLines } from "../model";
import { ghostButton, kitBackground } from "../styles";
import { FeedbackButton } from "./feedback-button";

const emptyResult =
  "rounded-[10px] border border-dashed border-line bg-surface-2 px-5 py-7 text-[14px] text-ink-2";
const inlineCode =
  "rounded-sm border border-line bg-surface px-1.5 py-px font-code text-[15px]";

function EmptyResult({ controller }: { controller: TeamSplitController }) {
  const { roster, attendance, attendingCount, needsResplit } = controller;
  if (!roster.trim()) {
    return (
      <div className={emptyResult}>
        还没有名单。把微信接龙整条粘到左边就行 ——
        带序号的行会被认成报名的人，例如{" "}
        <code className={inlineCode}>1. Rain</code>。
      </div>
    );
  }

  if (attendance.length) {
    return (
      <div className={emptyResult} role="status">
        {!attendingCount
          ? "当前没有人参与分队。请在出场名单中勾选参加的人。"
          : needsResplit
            ? "名单已变更，请重新分队。"
            : "出场名单已准备好，确认参加的人后点击「随机分队」。"}
      </div>
    );
  }

  const lines = toLines(roster).filter(Boolean);
  const sample = lines.length > 1 ? lines[1] : lines[0] || "";

  return (
    <div className={emptyResult}>
      这段文字里认不出报名的人。读到的第 2 行是：
      <code className={inlineCode}>{sample.slice(0, 40) || "(空)"}</code>
      。需要写成 1. Rain 这样：序号 + 分隔符 + 名字。
    </div>
  );
}

export function TeamResults({
  controller,
}: {
  controller: TeamSplitController;
}) {
  const { resultsRef, copyFeedback, groups, copy, kits, rawRef, rawResult } =
    controller;
  return (
    <section id="results" ref={resultsRef}>
      <div className="mb-3.5 flex min-h-8.5 items-center justify-between gap-3 mobile:mb-3">
        <h2 className="m-0 font-display text-[22px] font-semibold tracking-[.08em]">
          分队结果
        </h2>
        <div className="flex items-center gap-3">
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
            idle="复制结果"
            done="已复制"
            fail="复制失败"
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
                <div className="flex items-center gap-2.25 border-b border-line-soft bg-surface-2 px-3.5 py-2.75 compact:gap-1.75 compact:px-2.75 compact:py-2.25">
                  <span
                    className={`h-3.5 w-3.5 flex-none rounded-full border border-[rgba(128,128,128,.45)] ${kitBackground(kit)}`}
                  />
                  <span className="font-display text-[18px] font-semibold tracking-[.06em] compact:text-[16px]">
                    {kit.name}
                  </span>
                  <span className="ml-auto text-[12px] text-ink-3 tabular-nums compact:text-[11px]">
                    {group.length} 人
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
                        <span className="wrap-anywhere">{parsed.name}</span>
                        {parsed.notes.map((note, noteIndex) => (
                          <span
                            className="flex-none rounded-full bg-note-soft px-1.5 py-px text-[11px] whitespace-nowrap text-note compact:text-[10px]"
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
