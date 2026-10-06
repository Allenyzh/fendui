import { useCallback, useEffect, useRef } from "react";
import type {
  KeyboardEvent,
  MouseEvent,
  PointerEvent,
  SyntheticEvent,
} from "react";

const DISMISSED_KEY = "team-split:feature-guide-dismissed";

export function useFeatureGuideController() {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const launcherRef = useRef<HTMLButtonElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dismissButtonRef = useRef<HTMLButtonElement>(null);
  const minimizingRef = useRef(false);
  const backdropPointerDownRef = useRef(false);
  const animationRef = useRef<Animation | null>(null);

  const openGuide = useCallback(() => {
    const dialog = dialogRef.current;
    const launcher = launcherRef.current;
    if (!dialog || !launcher || dialog.open || minimizingRef.current) return;

    launcher.classList.remove("animate-fx-pop");
    dialog.showModal();
    document.body.classList.add("overflow-hidden");
    launcher.hidden = true;
    launcher.setAttribute("aria-expanded", "true");
  }, []);

  async function dismissGuide() {
    const dialog = dialogRef.current;
    const launcher = launcherRef.current;
    if (!dialog || !launcher || !dialog.open || minimizingRef.current) return;

    minimizingRef.current = true;
    try {
      localStorage.setItem(DISMISSED_KEY, "true");
    } catch {
      // 存储受限时仍保留当前页面的关闭和重新打开功能。
    }
    launcher.hidden = false;

    if (
      !window.matchMedia("(prefers-reduced-motion: reduce)").matches &&
      dialog.animate
    ) {
      const from = dialog.getBoundingClientRect();
      const to = launcher.getBoundingClientRect();
      const x = to.left + to.width / 2 - from.left - from.width / 2;
      const y = to.top + to.height / 2 - from.top - from.height / 2;
      let animation: Animation | null = null;
      try {
        animation = dialog.animate(
          [
            { transform: "none", opacity: 1 },
            {
              transform: `translate(${x}px, ${y}px) scale(${to.width / from.width})`,
              opacity: 0,
            },
          ],
          { duration: 220, easing: "cubic-bezier(.4, 0, .2, 1)" },
        );
        animationRef.current = animation;
        await animation.finished;
      } catch {
        // 动画不可用时直接收起，关闭功能照常可用。
      }
      // 卸载时取消的动画不能再关闭后续挂载的弹窗。
      if (animation && animationRef.current !== animation) return;
      animationRef.current = null;
    }

    dialog.close();
  }

  function onDialogClose() {
    const dialog = dialogRef.current;
    const launcher = launcherRef.current;
    // 忽略 Strict Mode effect 清理后才送达的旧 close 事件。
    if (!dialog || !launcher || dialog.open) return;

    minimizingRef.current = false;
    document.body.classList.remove("overflow-hidden");
    launcher.hidden = false;
    launcher.setAttribute("aria-expanded", "false");
    launcher.classList.add("animate-fx-pop");
    launcher.focus({ preventScroll: true });
  }

  function onDialogCancel(event: SyntheticEvent<HTMLDialogElement>) {
    event.preventDefault();
    void dismissGuide();
  }

  function onDialogKeyDown(event: KeyboardEvent<HTMLDialogElement>) {
    if (event.key !== "Tab") return;
    if (event.shiftKey && document.activeElement === closeButtonRef.current) {
      event.preventDefault();
      dismissButtonRef.current?.focus();
    } else if (
      !event.shiftKey &&
      document.activeElement === dismissButtonRef.current
    ) {
      event.preventDefault();
      closeButtonRef.current?.focus();
    }
  }

  function isBackdrop(event: MouseEvent<HTMLDialogElement>) {
    const dialog = dialogRef.current;
    if (!dialog || event.target !== dialog) return false;
    const bounds = dialog.getBoundingClientRect();
    return (
      event.clientX < bounds.left ||
      event.clientX > bounds.right ||
      event.clientY < bounds.top ||
      event.clientY > bounds.bottom
    );
  }

  function onDialogPointerDown(event: PointerEvent<HTMLDialogElement>) {
    backdropPointerDownRef.current = isBackdrop(event);
  }

  function onDialogClick(event: MouseEvent<HTMLDialogElement>) {
    if (backdropPointerDownRef.current && isBackdrop(event))
      void dismissGuide();
    backdropPointerDownRef.current = false;
  }

  useEffect(() => {
    const dialog = dialogRef.current;
    const launcher = launcherRef.current;
    let dismissed = false;
    try {
      dismissed = localStorage.getItem(DISMISSED_KEY) === "true";
    } catch {
      // 读取失败时按首次访问展示。
    }
    if (dismissed && launcher) launcher.hidden = false;
    else openGuide();

    return () => {
      animationRef.current?.cancel();
      animationRef.current = null;
      minimizingRef.current = false;
      backdropPointerDownRef.current = false;
      dialog?.close();
      document.body.classList.remove("overflow-hidden");
    };
  }, [openGuide]);

  return {
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
  };
}
