import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ClipboardEvent,
} from "react";
import { trackEvent } from "./analytics";
import { useTranslations } from "next-intl";
import { blockedReason, legacyCopy } from "./clipboard";
import { useButtonFeedback, type FeedbackMessage } from "./feedback";
import { getKitTeamLabel } from "./presentation";
import {
  buildKits,
  detectColors,
  emptyAttendance,
  formatGroups,
  getGroupCount,
  groupPlayers,
  parsePlayers,
  syncAttendance,
  type AttendanceState,
  type GroupMode,
  type Kit,
} from "./model";

interface TeamSplitState {
  roster: string;
  attendance: AttendanceState;
  mode: GroupMode;
  groups: string[][];
  kits: Kit[];
  needsResplit: boolean;
}

const subscribeToClipboard = () => () => {};
const getClipboardHint = (): FeedbackMessage | "" =>
  typeof navigator.clipboard?.readText === "function"
    ? ""
    : blockedReason() === "insecureContext" ? "pasteManualInsecure" : "pasteManualUnavailable";
const getServerClipboardHint = (): FeedbackMessage | "" => "";

export function useTeamSplitController() {
  const t = useTranslations("Feedback");
  const kitT = useTranslations("Kits");
  const [state, setState] = useState<TeamSplitState>(() => ({
    roster: "",
    attendance: emptyAttendance(),
    mode: "auto",
    groups: [],
    kits: [],
    needsResplit: false,
  }));
  const browserPasteHint = useSyncExternalStore(
    subscribeToClipboard,
    getClipboardHint,
    getServerClipboardHint,
  );
  const [pasteHint, setPasteHint] = useState<FeedbackMessage | "" | null>(null);
  const [showRawResult, setShowRawResult] = useState(false);
  const formattedResult = formatGroups(state.groups, state.kits, (kit, count) =>
    kitT("copyHeading", { name: getKitTeamLabel(kit, kitT), count }),
  );
  const rawResult = showRawResult ? formattedResult : "";
  const [rawSelectionRequest, setRawSelectionRequest] = useState(0);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const resultsRef = useRef<HTMLElement>(null);
  const rawRef = useRef<HTMLPreElement>(null);
  const resetAttendanceOnInput = useRef(false);
  const resultRevision = useRef(0);
  const nudgeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pasteFeedback = useButtonFeedback();
  const copyFeedback = useButtonFeedback();

  useEffect(() => {
    const revision = resultRevision;
    return () => {
      revision.current++;
      if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
    };
  }, []);

  useEffect(() => {
    if (!rawResult || !rawRef.current) return;
    const range = document.createRange();
    range.selectNodeContents(rawRef.current);
    const selection = window.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
    rawRef.current.scrollIntoView({ block: "nearest" });
  }, [rawResult, rawSelectionRequest]);

  const attendance = state.attendance.entries;
  const attending = attendance
    .filter((entry) => entry.included)
    .map((entry) => entry.player);
  const detected = detectColors(state.roster);
  const groupCount = getGroupCount(detected, state.mode);
  const hintMessage = pasteHint ?? browserPasteHint;

  function resetResultFeedback() {
    resultRevision.current++;
    setShowRawResult(false);
    copyFeedback.reset();
  }

  function invalidateResults(next: TeamSplitState): TeamSplitState {
    return {
      ...next,
      needsResplit: next.needsResplit || next.groups.length > 0,
      groups: [],
      kits: [],
    };
  }

  function changeRoster(
    roster: string,
    newRoster = resetAttendanceOnInput.current,
  ) {
    resetAttendanceOnInput.current = false;
    if (roster.trim()) setPasteHint("");
    resetResultFeedback();
    setState((previous) =>
      invalidateResults({
        ...previous,
        roster,
        attendance: syncAttendance(
          parsePlayers(roster),
          newRoster ? emptyAttendance() : previous.attendance,
        ),
      }),
    );
  }

  function markPaste(event: ClipboardEvent<HTMLTextAreaElement>) {
    const input = event.currentTarget;
    resetAttendanceOnInput.current =
      input.selectionStart === 0 &&
      input.selectionEnd === input.value.length &&
      !!event.clipboardData.getData("text");
  }

  function toggleAttendance(id: number, included: boolean) {
    resetResultFeedback();
    setState((previous) => {
      const history = previous.attendance.history.map((entry) =>
        entry.id === id ? { ...entry, included } : entry,
      );
      return invalidateResults({
        ...previous,
        attendance: {
          history,
          entries: previous.attendance.entries.map((entry) =>
            entry.id === id ? { ...entry, included } : entry,
          ),
        },
      });
    });
  }

  function includeAll() {
    resetResultFeedback();
    setState((previous) =>
      invalidateResults({
        ...previous,
        attendance: {
          entries: previous.attendance.entries.map((entry) => ({
            ...entry,
            included: true,
          })),
          history: previous.attendance.history.map((entry) => ({
            ...entry,
            included: true,
          })),
        },
      }),
    );
  }

  function splitWithMode(mode: GroupMode) {
    resetResultFeedback();
    const count = getGroupCount(detected, mode);
    setState({
      ...state,
      mode,
      groups: attending.length ? groupPlayers(attending, count) : [],
      kits: buildKits(detected, count),
      needsResplit: false,
    });
  }

  function changeMode(mode: GroupMode) {
    splitWithMode(mode);
  }

  function split() {
    if (!parsePlayers(state.roster).length) {
      const input = inputRef.current;
      input?.focus();
      if (input) {
        delete input.dataset.nudge;
        void input.offsetWidth;
        input.dataset.nudge = "true";
        if (nudgeTimer.current) clearTimeout(nudgeTimer.current);
        nudgeTimer.current = setTimeout(() => {
          delete input.dataset.nudge;
        }, 400);
      }
      navigator.vibrate?.([18, 40, 18]);
      return;
    }
    if (!attending.length) return;
    trackEvent("split_teams", {
      player_count: attending.length,
      group_count: groupCount,
    });
    inputRef.current?.blur();
    splitWithMode(state.mode);
    if (window.matchMedia("(max-width: 860px)").matches) {
      resultsRef.current?.scrollIntoView({
        behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
          ? "auto"
          : "smooth",
        block: "start",
      });
    }
  }

  function clear() {
    resetResultFeedback();
    resetAttendanceOnInput.current = false;
    setState({
      ...state,
      roster: "",
      attendance: emptyAttendance(),
      groups: [],
      kits: [],
      needsResplit: false,
    });
    inputRef.current?.focus();
  }

  async function paste() {
    trackEvent("paste_roster");
    if (!navigator.clipboard?.readText) {
      pasteFeedback.signal("fail", blockedReason());
      setPasteHint(blockedReason() === "insecureContext" ? "pasteManualInsecure" : "pasteManualUnavailable");
      inputRef.current?.focus();
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        pasteFeedback.signal("fail", "clipboardEmpty");
        return;
      }
      changeRoster(text, true);
      pasteFeedback.signal("done", "pasted");
    } catch {
      pasteFeedback.signal("fail", "pasteDenied");
      setPasteHint("pasteManualDenied");
      inputRef.current?.focus();
    }
  }

  async function copy() {
    trackEvent("copy_result");
    if (!state.groups.length) return;
    const text = formattedResult;
    const revision = resultRevision.current;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        if (revision !== resultRevision.current) return;
        setShowRawResult(false);
        copyFeedback.signal("done", "copied");
        return;
      } catch {
        // Continue with the original HTTP / older-browser fallback.
      }
    }
    if (revision !== resultRevision.current) return;
    if (legacyCopy(text)) {
      setShowRawResult(false);
      copyFeedback.signal("done", "copied");
      return;
    }
    setShowRawResult(true);
    setRawSelectionRequest((request) => request + 1);
    copyFeedback.signal(
      "fail",
      "copyManual",
      true,
    );
  }

  return {
    roster: state.roster,
    mode: state.mode,
    groups: state.groups,
    kits: state.kits,
    needsResplit: state.needsResplit,
    attendance,
    attendingCount: attending.length,
    detected,
    groupCount,
    inputRef,
    resultsRef,
    rawRef,
    pasteHint: hintMessage ? t(hintMessage) : "",
    rawResult,
    pasteFeedback: { ...pasteFeedback, message: pasteFeedback.message ? t(pasteFeedback.message) : "" },
    copyFeedback: { ...copyFeedback, message: copyFeedback.message ? t(copyFeedback.message) : "" },
    changeRoster,
    markPaste,
    toggleAttendance,
    includeAll,
    changeMode,
    split,
    clear,
    paste,
    copy,
  };
}

export type TeamSplitController = ReturnType<typeof useTeamSplitController>;
