import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ClipboardEvent,
} from "react";
import { trackEvent } from "./analytics";
import { blockedReason, legacyCopy } from "./clipboard";
import { useButtonFeedback } from "./feedback";
import {
  buildKits,
  detectColors,
  emptyAttendance,
  formatGroups,
  getGroupCount,
  groupPlayers,
  parseMatchLine,
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
const getClipboardHint = () =>
  typeof navigator.clipboard?.readText === "function"
    ? ""
    : blockedReason() + " —— 请在输入框里长按，选「粘贴」。";
const getServerClipboardHint = () => "";

export function useTeamSplitController() {
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
  const [pasteHint, setPasteHint] = useState<string | null>(null);
  const [rawResult, setRawResult] = useState("");
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

  function resetResultFeedback() {
    resultRevision.current++;
    setRawResult("");
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
      setPasteHint(
        blockedReason() + " —— 请在上面的输入框里长按，选「粘贴」。",
      );
      inputRef.current?.focus();
      return;
    }
    try {
      const text = await navigator.clipboard.readText();
      if (!text.trim()) {
        pasteFeedback.signal("fail", "剪贴板是空的");
        return;
      }
      changeRoster(text, true);
      pasteFeedback.signal("done", "已粘贴接龙");
    } catch {
      pasteFeedback.signal("fail", "剪贴板读取被拒绝，请手动粘贴");
      setPasteHint("剪贴板读取被拒绝 —— 请在上面的输入框里长按，选「粘贴」。");
      inputRef.current?.focus();
    }
  }

  async function copy() {
    trackEvent("copy_result");
    if (!state.groups.length) return;
    const text = formatGroups(state.groups, state.kits);
    const revision = resultRevision.current;
    if (navigator.clipboard?.writeText) {
      try {
        await navigator.clipboard.writeText(text);
        if (revision !== resultRevision.current) return;
        setRawResult("");
        copyFeedback.signal("done", "已复制到剪贴板");
        return;
      } catch {
        // Continue with the original HTTP / older-browser fallback.
      }
    }
    if (revision !== resultRevision.current) return;
    if (legacyCopy(text)) {
      setRawResult("");
      copyFeedback.signal("done", "已复制到剪贴板");
      return;
    }
    setRawResult(text);
    setRawSelectionRequest((request) => request + 1);
    copyFeedback.signal(
      "fail",
      "自动复制被拦了，文本已选中，长按选「拷贝」",
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
    matchLine: parseMatchLine(state.roster),
    inputRef,
    resultsRef,
    rawRef,
    pasteHint: pasteHint ?? browserPasteHint,
    rawResult,
    pasteFeedback,
    copyFeedback,
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
