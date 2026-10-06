"use client";

import { useTeamSplitController } from "./controller";
import { RosterPanel } from "./views/roster-panel";
import { TeamResults } from "./views/team-results";

export default function TeamSplitView() {
  const controller = useTeamSplitController();

  return (
    <div className="mx-auto max-w-285 px-5 pt-7 pb-[calc(88px+env(safe-area-inset-bottom))] mobile:pt-5 compact:px-4">
      <header className="mb-6 flex flex-wrap items-baseline gap-x-5 gap-y-2 border-b-2 border-ink pb-4.5 mobile:mb-4.5 mobile:pb-3.5 compact:gap-x-3 compact:gap-y-1.5">
        <h1 className="m-0 font-display text-[40px] leading-none font-bold tracking-[.04em] text-balance mobile:text-[34px] compact:text-[30px]">
          接龙分队
        </h1>
        <span className="text-[11px] font-medium tracking-[.18em] text-ink-3 uppercase compact:text-[10px]">
          Random Teams
        </span>
        <p
          id="match-line"
          className="my-[1em] ml-auto max-w-[46ch] text-right text-[13px] text-ink-2 mobile:ml-0 mobile:w-full mobile:max-w-none mobile:text-left mobile:text-[12.5px]"
        >
          {controller.matchLine}
        </p>
      </header>
      <div className="grid grid-cols-[minmax(300px,400px)_1fr] items-start gap-7 mobile:grid-cols-1 mobile:gap-6">
        <RosterPanel controller={controller} />
        <TeamResults controller={controller} />
      </div>
    </div>
  );
}
