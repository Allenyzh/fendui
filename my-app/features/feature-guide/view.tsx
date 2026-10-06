"use client";

import { useFeatureGuideController } from "./controller";
import { focusRing, primaryButton } from "@/features/team-split/styles";

export default function FeatureGuide() {
  const {
    dialogRef,
    launcherRef,
    closeButtonRef,
    dismissButtonRef,
    openGuide,
    dismissGuide,
    onDialogClose,
    onDialogCancel,
    onDialogKeyDown,
    onDialogPointerDown,
    onDialogClick,
  } = useFeatureGuideController();

  return (
    <>
      <dialog
        className="m-auto w-[calc(100%-32px)] max-w-140 max-h-[calc(100vh-40px)] overflow-hidden rounded-2xl border border-line bg-surface p-0 text-ink shadow-[0_24px_80px_rgba(0,0,0,.24)] open:flex open:flex-col open:animate-feature-enter motion-reduce:animate-none supports-[height:100dvh]:max-h-[min(760px,calc(100dvh-40px-env(safe-area-inset-top)-env(safe-area-inset-bottom)))] backdrop:bg-[rgba(14,18,23,.48)] backdrop:backdrop-blur-[3px]"
        id="feature-dialog"
        aria-labelledby="feature-title"
        aria-describedby="feature-intro"
        ref={dialogRef}
        onClose={onDialogClose}
        onCancel={onDialogCancel}
        onKeyDown={onDialogKeyDown}
        onPointerDown={onDialogPointerDown}
        onClick={onDialogClick}
      >
        <header className="relative flex-none border-b border-line-soft pt-6 pr-15 pb-4.5 pl-6 compact:pt-5 compact:pr-14 compact:pb-4 compact:pl-4.5">
          <p className="mb-1.5 text-[11px] font-medium tracking-[.14em] text-accent">
            功能介绍
          </p>
          <h2
            className="text-[23px] leading-[1.4] font-bold compact:text-[21px]"
            id="feature-title"
          >
            接龙分队使用指南
          </h2>
          <p className="mt-2.25 text-[13px] text-ink-2" id="feature-intro">
            粘贴完整接龙，确认出场名单，再随机分队。
          </p>
          <button
            type="button"
            className={`absolute top-4 right-3.5 grid size-10 cursor-pointer place-items-center rounded-full border-0 bg-surface-2 p-0 text-ink-2 hover:bg-accent-soft hover:text-accent ${focusRing}`}
            id="feature-close-btn"
            aria-label="关闭功能介绍"
            autoFocus
            ref={closeButtonRef}
            onClick={dismissGuide}
          >
            <svg
              viewBox="0 0 24 24"
              width="18"
              height="18"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              aria-hidden="true"
            >
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </button>
        </header>
        <div className="min-h-0 overflow-y-auto overscroll-contain px-6 py-5 compact:px-4.5 compact:py-4">
          <section
            className="rounded-[10px] border border-accent bg-accent-soft p-4"
            aria-labelledby="feature-attendance-title"
          >
            <h3
              className="mb-2 flex flex-wrap items-center gap-2 text-[16px] font-bold"
              id="feature-attendance-title"
            >
              调整出场名单{" "}
              <span className="rounded-sm bg-accent px-1.75 py-0.5 text-[10px] font-medium text-accent-ink">
                新增
              </span>
            </h3>
            <p className="text-[13px] leading-[1.8] text-ink-2">
              有人报名但确定不来？取消勾选即可标记「本场不参加」，原始接龙保留。分队和复制只包含勾选的人，名单变更后会提示重新分队。
            </p>
            <div
              className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[12px] font-medium text-accent"
              aria-label="人数统计示例"
            >
              <span>报名 21 人</span>
              <span>参与分队 19 人</span>
              <span>不参加 2 人</span>
            </div>
          </section>
          <ul
            className="mt-5 grid list-none gap-4 p-0 [&_h3]:mb-0.75 [&_h3]:text-[14px] [&_h3]:font-medium [&_p]:text-[12.5px] [&_p]:leading-[1.75] [&_p]:text-ink-2"
            aria-label="已有功能"
          >
            <li className="flex items-start gap-3">
              <span
                className="grid size-7 flex-none place-items-center rounded-[7px] bg-surface-2 font-condensed text-[16px] text-ink-3"
                aria-hidden="true"
              >
                01
              </span>
              <div>
                <h3>整条粘贴，自动识别</h3>
                <p>
                  直接粘贴微信接龙，识别人名和场次信息。支持常见编号格式，也可以一行一个名字。
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="grid size-7 flex-none place-items-center rounded-[7px] bg-surface-2 font-condensed text-[16px] text-ink-3"
                aria-hidden="true"
              >
                02
              </span>
              <div>
                <h3>按队服颜色或队数随机分队</h3>
                <p>
                  自动识别队服颜色，也可选择 2、3、4
                  队，尽量均分人数；再次点击可以重新随机。
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="grid size-7 flex-none place-items-center rounded-[7px] bg-surface-2 font-condensed text-[16px] text-ink-3"
                aria-hidden="true"
              >
                03
              </span>
              <div>
                <h3>球员备注一起保留</h3>
                <p>
                  迟到、早退和括号里的备注会显示在名字旁，复制结果时也会保留。
                </p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <span
                className="grid size-7 flex-none place-items-center rounded-[7px] bg-surface-2 font-condensed text-[16px] text-ink-3"
                aria-hidden="true"
              >
                04
              </span>
              <div>
                <h3>复制结果，发回群里</h3>
                <p>
                  一键复制带队名、人数和球员名单的结果。自动复制失败时，可选取显示的文本手动复制。
                </p>
              </div>
            </li>
          </ul>
        </div>
        <footer className="flex-none border-t border-line-soft bg-surface-2 px-6 pt-4 pb-4.5 compact:px-4.5 compact:pt-3.5 compact:pb-4">
          <button
            type="button"
            className={primaryButton}
            id="feature-dismiss-btn"
            ref={dismissButtonRef}
            onClick={dismissGuide}
          >
            知道了，开始分队
          </button>
          <p className="mt-2.5 text-center text-[11.5px] text-ink-3">
            关闭后，点右下角的 Cookie 图标可再次查看。
          </p>
        </footer>
      </dialog>

      <button
        type="button"
        className={`fixed right-[calc(18px+env(safe-area-inset-right))] bottom-[calc(18px+env(safe-area-inset-bottom))] z-20 grid size-13.5 cursor-pointer touch-manipulation place-items-center rounded-full border border-line bg-note-soft p-0 text-note shadow-[0_4px_18px_rgba(0,0,0,.16)] transition-[transform,box-shadow] duration-160 ease-[ease] [-webkit-tap-highlight-color:transparent] [[hidden]]:hidden hover:shadow-[0_6px_22px_rgba(0,0,0,.22)] hover:transform-[translateY(-2px)] active:transform-[scale(.95)] motion-reduce:animate-none motion-reduce:transition-none ${focusRing}`}
        id="feature-launcher"
        aria-label="打开功能介绍"
        aria-haspopup="dialog"
        aria-controls="feature-dialog"
        aria-expanded="false"
        title="查看功能介绍"
        hidden
        ref={launcherRef}
        onClick={openGuide}
      >
        <svg viewBox="0 0 32 32" width="30" height="30" aria-hidden="true">
          <path
            d="M27 17.1a6.8 6.8 0 0 1-8.2-8.4 5.4 5.4 0 0 1-3.6-4.1A12 12 0 1 0 27.4 19c-.1-.7-.2-1.3-.4-1.9Z"
            fill="currentColor"
            fillOpacity=".2"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinejoin="round"
          />
          <g fill="currentColor">
            <circle cx="10" cy="11" r="1.7" />
            <circle cx="9" cy="20" r="1.6" />
            <circle cx="17" cy="17" r="1.9" />
            <circle cx="18" cy="24" r="1.4" />
            <circle cx="23" cy="21" r="1.1" />
          </g>
        </svg>
      </button>
    </>
  );
}
