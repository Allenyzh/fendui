import type { Kit } from "./model";

export const focusRing =
  "focus-visible:outline-2 focus-visible:outline-solid focus-visible:outline-accent focus-visible:outline-offset-2";

export const linkButton = `rounded-sm border-0 bg-transparent px-0.5 py-1 font-sans text-[13px] leading-[normal] text-ink-3 underline underline-offset-[3px] cursor-pointer touch-manipulation [-webkit-tap-highlight-color:transparent] hover:text-ink disabled:opacity-40 disabled:cursor-default disabled:no-underline mobile:py-2 ${focusRing}`;

export const primaryButton = `w-full rounded-[7px] border-0 bg-accent p-3 font-display text-[19px] leading-[normal] font-semibold tracking-widest text-accent-ink cursor-pointer touch-manipulation [-webkit-tap-highlight-color:transparent] hover:brightness-[1.08] active:transform-[translateY(1px)] disabled:opacity-45 disabled:cursor-default disabled:filter-none disabled:transform-none mobile:p-3.5 ${focusRing}`;

export const ghostButton = `rounded-md border border-line bg-surface px-3.5 py-1.75 font-sans text-[13px] leading-[normal] text-ink cursor-pointer touch-manipulation [-webkit-tap-highlight-color:transparent] hover:border-ink-3 active:bg-accent-soft disabled:opacity-45 disabled:cursor-default mobile:px-4 mobile:py-2.5 ${focusRing}`;

export const pasteButton = `self-center rounded-full border border-line bg-surface-2 px-2.75 py-1 font-sans text-[12px] leading-[normal] font-normal tracking-normal text-ink-2 cursor-pointer hover:border-ink-3 hover:text-ink mobile:px-3.5 mobile:py-1.5 mobile:text-[12.5px] ${focusRing}`;

// Tailwind requires complete, statically visible classes for runtime kit choices.
const kitClasses: Record<string, string> = {
  white: "bg-(--kit-white)",
  blue: "bg-(--kit-blue)",
  red: "bg-(--kit-red)",
  black: "bg-(--kit-black)",
  yellow: "bg-(--kit-yellow)",
  green: "bg-(--kit-green)",
  orange: "bg-(--kit-orange)",
  purple: "bg-(--kit-purple)",
  gray: "bg-(--kit-gray)",
  pink: "bg-(--kit-pink)",
  cyan: "bg-(--kit-cyan)",
};

export function kitBackground(kit: Kit) {
  return kitClasses[kit.key ?? ""] ?? "bg-ink-3";
}
