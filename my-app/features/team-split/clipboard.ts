// Browser IO stays outside the model; keep the original iOS / HTTP fallback.
export function blockedReason() {
  return window.isSecureContext
    ? "这个浏览器不让网页读剪贴板"
    : "当前是 http 访问，浏览器只在 https 或 localhost 下才允许读剪贴板";
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
