// Browser IO stays outside the model; keep the original iOS / HTTP fallback.
export function blockedReason(): "clipboardUnavailable" | "insecureContext" {
  return window.isSecureContext
    ? "clipboardUnavailable"
    : "insecureContext";
}

export function legacyCopy(text: string) {
  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.className =
    "fixed top-0 left-0 size-px border-0 p-0 text-[16px] opacity-0";
  document.body.appendChild(helper);

  const selection = window.getSelection();
  const saved = selection?.rangeCount ? selection.getRangeAt(0) : null;
  const isIOS =
    /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

  if (isIOS && selection) {
    helper.contentEditable = "true";
    helper.readOnly = false;
    const range = document.createRange();
    range.selectNodeContents(helper);
    selection.removeAllRanges();
    selection.addRange(range);
  }

  helper.focus();
  helper.setSelectionRange(0, text.length);

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch {
    // Manual text selection is the final fallback.
  }
  helper.remove();

  if (saved && selection) {
    selection.removeAllRanges();
    selection.addRange(saved);
  }
  return copied;
}
