"use client";

import { useTranslations } from "next-intl";
import { useFeatureGuideController } from "./controller";
import { focusRing, primaryButton } from "@/features/team-split/styles";

export default function FeatureGuide() {
  const t = useTranslations("Guide");
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
            {t("eyebrow")}
          </p>
          <h2
            className="text-[23px] leading-[1.4] font-bold compact:text-[21px]"
            id="feature-title"
          >
            {t("title")}
          </h2>
          <p className="mt-2.25 text-[13px] text-ink-2" id="feature-intro">
            {t("intro")}
          </p>
          <button
            type="button"
            className={`absolute top-4 right-3.5 grid size-10 cursor-pointer place-items-center rounded-full border-0 bg-surface-2 p-0 text-ink-2 hover:bg-accent-soft hover:text-accent ${focusRing}`}
            id="feature-close-btn"
            aria-label={t("close")}
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
              {t("attendance.title")}{" "}
              <span className="rounded-sm bg-accent px-1.75 py-0.5 text-[10px] font-medium text-accent-ink">
                {t("attendance.new")}
              </span>
            </h3>
            <p className="text-[13px] leading-[1.8] text-ink-2">
              {t("attendance.description")}
            </p>
            <div
              className="mt-3 flex flex-wrap gap-x-3 gap-y-1.5 text-[12px] font-medium text-accent"
              aria-label={t("attendance.example")}
            >
              <span>{t("attendance.registered", { count: 21 })}</span>
              <span>{t("attendance.included", { count: 19 })}</span>
              <span>{t("attendance.excluded", { count: 2 })}</span>
            </div>
          </section>
          <ul
            className="mt-5 grid list-none gap-4 p-0 [&_h3]:mb-0.75 [&_h3]:text-[14px] [&_h3]:font-medium [&_p]:text-[12.5px] [&_p]:leading-[1.75] [&_p]:text-ink-2"
            aria-label={t("featuresLabel")}
          >
            <li className="flex items-start gap-3">
              <span
                className="grid size-7 flex-none place-items-center rounded-[7px] bg-surface-2 font-condensed text-[16px] text-ink-3"
                aria-hidden="true"
              >
                01
              </span>
              <div>
                <h3>{t("paste.title")}</h3>
                <p>
                  {t("paste.description")}
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
                <h3>{t("split.title")}</h3>
                <p>
                  {t("split.description")}
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
                <h3>{t("notes.title")}</h3>
                <p>
                  {t("notes.description")}
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
                <h3>{t("copy.title")}</h3>
                <p>
                  {t("copy.description")}
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
            {t("dismiss")}
          </button>
          <p className="mt-2.5 text-center text-[11.5px] text-ink-3">
            {t("reopenHint")}
          </p>
        </footer>
      </dialog>

      <button
        type="button"
        className={`fixed right-[calc(18px+env(safe-area-inset-right))] bottom-[calc(18px+env(safe-area-inset-bottom))] z-20 grid size-13.5 cursor-pointer touch-manipulation place-items-center rounded-full border border-line bg-note-soft p-0 text-note shadow-[0_4px_18px_rgba(0,0,0,.16)] transition-[transform,box-shadow] duration-160 ease-[ease] [-webkit-tap-highlight-color:transparent] [[hidden]]:hidden hover:shadow-[0_6px_22px_rgba(0,0,0,.22)] hover:transform-[translateY(-2px)] active:transform-[scale(.95)] motion-reduce:animate-none motion-reduce:transition-none ${focusRing}`}
        id="feature-launcher"
        aria-label={t("open")}
        aria-haspopup="dialog"
        aria-controls="feature-dialog"
        aria-expanded="false"
        title={t("openTitle")}
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
