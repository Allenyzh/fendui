import { getRequestConfig } from "next-intl/server";
import { defaultLocale } from "./config";
import { messagesByLocale } from "./messages";

// Static hosting cannot read a visitor's cookies or request headers at build time.
// The client provider restores their language after hydrating this default HTML.
export default getRequestConfig(() => ({
  locale: defaultLocale,
  messages: messagesByLocale[defaultLocale],
  timeZone: "UTC",
}));
