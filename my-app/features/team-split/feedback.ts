import { useEffect, useRef, useState } from "react";

export function useButtonFeedback() {
  const buttonRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [status, setStatus] = useState({ message: "", show: false });

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function reset() {
    if (timer.current) clearTimeout(timer.current);
    if (buttonRef.current) delete buttonRef.current.dataset.state;
    setStatus({ message: "", show: false });
  }

  function signal(state: "done" | "fail", message: string, showOnFail = false) {
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
