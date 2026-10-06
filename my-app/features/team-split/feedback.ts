import { useEffect, useRef, useState } from "react";
import type { Messages } from "@/i18n/messages";

export type FeedbackMessage = keyof Messages["Feedback"];

export function useButtonFeedback() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState<{ message: FeedbackMessage | null; show: boolean }>({ message: null, show: false });

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function reset() {
    if (timer.current) clearTimeout(timer.current);
    if (buttonRef.current) delete buttonRef.current.dataset.state;
    setStatus({ message: null, show: false });
  }

  function signal(state: "done" | "fail", message: FeedbackMessage, showOnFail = false) {
    if (timer.current) clearTimeout(timer.current);
    const button = buttonRef.current;
    if (button) {
      delete button.dataset.state;
      // Restart the original feedback animation for repeated clicks.
      void button.offsetWidth;
      button.dataset.state = state;
    }
    setStatus({ message, show: state === "fail" && showOnFail });
    navigator.vibrate?.(state === "fail" ? [18, 40, 18] : 14);
    timer.current = setTimeout(reset, state === "fail" ? 3200 : 1800);
  }

  return { buttonRef, ...status, signal, reset };
}
